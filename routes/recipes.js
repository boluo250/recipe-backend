const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe');
const SearchKeyword = require('../models/searchKeyword');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../config/logger');

// 中间件：验证 API 密钥
const authenticate = (req, res, next) => {
  const apiKey = req.headers['authorization'];
  if (apiKey === `Bearer ${process.env.API_KEY}`) {
    next();
  } else {
    logger.warn('Unauthorized access attempt', {
      ip: req.ip || req.connection.remoteAddress,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// 获取热门搜索关键词
router.get('/popular-keywords', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    logger.info('Fetching popular search keywords', {
      limit: parseInt(limit),
      ip: req.ip || req.connection.remoteAddress
    });
    
    const popularKeywords = await SearchKeyword.find()
      .sort({ count: -1, lastSearched: -1 })
      .limit(Number(limit))
      .select('keyword count');
    
    logger.info('Popular search keywords fetched successfully', {
      count: popularKeywords.length
    });
    
    res.json(popularKeywords);
  } catch (err) {
    logger.error('Error fetching popular search keywords', {
      error: err.message,
      stack: err.stack,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取菜谱列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { query, page = 1, size = 10 } = req.query;
    const skip = (page - 1) * size;
    let filter = {};
    if (query) {
      // 搜索菜谱名称和标签中的关键词
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      };
      
      // 记录搜索关键词
      try {
        await SearchKeyword.findOneAndUpdate(
          { keyword: query.toLowerCase() },
          { 
            $inc: { count: 1 },
            lastSearched: new Date()
          },
          { upsert: true }
        );
        logger.info('Search keyword recorded', { keyword: query });
      } catch (keywordError) {
        logger.error('Error recording search keyword', { 
          keyword: query, 
          error: keywordError.message 
        });
      }
    }
    
    logger.info('Fetching recipes', {
      query: query || 'none',
      page: parseInt(page),
      size: parseInt(size),
      ip: req.ip || req.connection.remoteAddress
    });
    
    const recipes = await Recipe.find(filter).skip(skip).limit(Number(size));
    const baseUrl = process.env.SERVER_URL;
    const updatedRecipes = recipes.map(recipe => ({
      ...recipe.toObject(),
      image: recipe.image.startsWith('http') ? recipe.image : `${baseUrl}${recipe.image}`
    }));
    
    logger.info('Recipes fetched successfully', {
      count: recipes.length,
      query: query || 'none',
      page: parseInt(page)
    });
    
    res.json(updatedRecipes);
  } catch (err) {
    logger.error('Error fetching recipes', {
      error: err.message,
      stack: err.stack,
      query: req.query.query,
      page: req.query.page,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取菜谱详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const recipeId = Number(req.params.id);
    
    logger.info('Fetching recipe details', {
      recipeId: recipeId,
      ip: req.ip || req.connection.remoteAddress
    });
    
    const recipe = await Recipe.findOne({ id: recipeId });
    if (!recipe) {
      logger.warn('Recipe not found', {
        recipeId: recipeId,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const baseUrl = process.env.SERVER_URL;
    const updatedRecipe = {
      ...recipe.toObject(),
      image: recipe.image.startsWith('http') ? recipe.image : `${baseUrl}${recipe.image}`
    };
    
    logger.info('Recipe details fetched successfully', {
      recipeId: recipeId,
      recipeName: recipe.name
    });
    
    res.json(updatedRecipe);
  } catch (err) {
    logger.error('Error fetching recipe details', {
      error: err.message,
      stack: err.stack,
      recipeId: req.params.id,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// 添加菜谱
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, image, ingredients, steps, tips, tags } = req.body;
    
    logger.info('Creating new recipe', {
      recipeName: name,
      hasImage: !!image,
      hasIngredients: !!ingredients,
      hasSteps: !!steps,
      ip: req.ip || req.connection.remoteAddress
    });
    
    if (!name || !image || !ingredients || !steps) {
      logger.warn('Missing required fields for recipe creation', {
        hasName: !!name,
        hasImage: !!image,
        hasIngredients: !!ingredients,
        hasSteps: !!steps,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 验证图片文件是否存在
    const imagePath = path.join(__dirname, '../public', image);
    try {
      await fs.access(imagePath);
    } catch {
      logger.warn('Image file does not exist', {
        imagePath: image,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(400).json({ error: 'Image file does not exist' });
    }
    
    const lastRecipe = await Recipe.findOne().sort({ id: -1 });
    const newId = lastRecipe ? lastRecipe.id + 1 : 1;
    
    const recipe = new Recipe({
      id: newId,
      name,
      image,
      ingredients,
      steps,
      tips,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    await recipe.save();
    
    const baseUrl = process.env.SERVER_URL;
    const updatedRecipe = {
      ...recipe.toObject(),
      image: recipe.image.startsWith('http') ? recipe.image : `${baseUrl}${recipe.image}`
    };
    
    logger.info('Recipe created successfully', {
      recipeId: newId,
      recipeName: name,
      ip: req.ip || req.connection.remoteAddress
    });
    
    res.status(201).json(updatedRecipe);
  } catch (err) {
    logger.error('Error creating recipe', {
      error: err.message,
      stack: err.stack,
      recipeName: req.body.name,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(400).json({ error: 'Invalid data' });
  }
});

module.exports = router;