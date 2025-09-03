const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Recipe = require('../models/recipe');
const { logger } = require('../config/logger');

dotenv.config();

async function migrateTags() {
  try {
    logger.info('Starting tags migration');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB successfully');

    // 查找所有tags字段为字符串的菜谱
    const recipesWithStringTags = await Recipe.find({
      tags: { $type: 'string' }
    });

    logger.info(`Found ${recipesWithStringTags.length} recipes with string tags`);

    // 转换每个菜谱的tags格式
    for (const recipe of recipesWithStringTags) {
      if (typeof recipe.tags === 'string') {
        // 按逗号分割字符串，去除空格
        const tagsArray = recipe.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        await Recipe.updateOne(
          { _id: recipe._id },
          { 
            $set: { 
              tags: tagsArray
            }
          }
        );
        
        logger.info(`Updated recipe: ${recipe.name}`, { 
          recipeId: recipe.id,
          oldTags: recipe.tags,
          newTags: tagsArray
        });
      }
    }

    // 验证转换结果
    const remainingStringTags = await Recipe.find({
      tags: { $type: 'string' }
    });
    
    if (remainingStringTags.length === 0) {
      logger.info('All tags have been successfully converted to arrays');
    } else {
      logger.warn(`Still found ${remainingStringTags.length} recipes with string tags`);
    }

    logger.info('Tags migration completed successfully');
  } catch (error) {
    logger.error('Tags migration failed', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// 运行迁移
migrateTags();
