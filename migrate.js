const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Recipe = require('./models/recipe');
const { logger } = require('./config/logger');
const SearchKeyword = require('./models/searchKeyword');

dotenv.config();

async function migrateRecipes() {
  try {
    logger.info('Starting recipe migration');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB successfully');

    // 查找所有没有ingredients字段的食谱
    const recipesWithoutIngredients = await Recipe.find({
      $or: [
        { ingredients: { $exists: false } },
        { ingredients: null }
      ]
    });

    logger.info(`Found ${recipesWithoutIngredients.length} recipes without ingredients field`);

    // 为每个食谱添加默认的ingredients字段
    for (const recipe of recipesWithoutIngredients) {
      await Recipe.updateOne(
        { _id: recipe._id },
        { 
          $set: { 
            ingredients: '请添加食材信息' // 默认值，您可以根据需要修改
          }
        }
      );
      logger.info(`Updated recipe: ${recipe.name}`, { recipeId: recipe.id });
    }

    // 创建搜索关键词集合的索引
    await SearchKeyword.createIndexes();
    logger.info('搜索关键词索引创建完成');

    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error('Migration failed', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// 运行迁移
migrateRecipes(); 