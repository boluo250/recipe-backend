const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe');
const SearchKeyword = require('../models/searchKeyword');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../config/logger');
const multer = require('multer');

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

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'default'; // 从请求中获取分类
    const uploadPath = path.join(__dirname, '../public/images', category);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 图片上传接口
router.post('/upload-image', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const category = req.body.category || 'default';
    const imagePath = `/images/${category}/${req.file.filename}`;
    
    logger.info('Image uploaded successfully', {
      filename: req.file.filename,
      category: category,
      originalName: req.file.originalname,
      ip: req.ip || req.connection.remoteAddress
    });
    
    res.json({ 
      success: true, 
      path: imagePath,
      url: `${process.env.SERVER_URL}${imagePath}`
    });
  } catch (err) {
    logger.error('Error uploading image', {
      error: err.message,
      stack: err.stack,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 获取热门搜索关键词
router.get('/popular-keywords', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    logger.info('Fetching popular search keywords', {
      limit: parseInt(limit),
      ip: req.ip || req.connection.remoteAddress
    });
    
    // 获取所有菜谱的名称和标签
    const recipes = await Recipe.find({}, 'name tags');
    
    // 提取所有菜谱中的关键词（名称和标签）
    const recipeKeywords = new Set();
    recipes.forEach(recipe => {
      // 添加菜谱名称（用于包含匹配）
      recipeKeywords.add(recipe.name.toLowerCase());
      // 添加标签（用于精确匹配）
      if (recipe.tags && Array.isArray(recipe.tags)) {
        recipe.tags.forEach(tag => {
          recipeKeywords.add(tag.toLowerCase());
        });
      }
    });
    
    // 获取所有搜索关键词
    const allSearchKeywords = await SearchKeyword.find()
      .sort({ count: -1, lastSearched: -1 })
      .select('keyword');
    
    // 过滤出菜谱中存在的关键词
    const validKeywords = [];
    for (const searchKeyword of allSearchKeywords) {
      const keyword = searchKeyword.keyword;
      
      // 检查是否匹配菜谱名称（包含关系）
      const nameMatch = Array.from(recipeKeywords).some(recipeName => 
        recipeName.includes(keyword) || keyword.includes(recipeName)
      );
      
      // 检查是否匹配标签（精确匹配）
      const tagMatch = Array.from(recipeKeywords).some(tag => 
        tag === keyword
      );
      
      if (nameMatch || tagMatch) {
        validKeywords.push(searchKeyword);
      }
      
      // 限制返回数量
      if (validKeywords.length >= limit) {
        break;
      }
    }
    
    logger.info('Popular search keywords fetched successfully', {
      count: validKeywords.length
    });
    
    res.json(validKeywords);
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
    let filter = { status: 'approved' };
    if (query) {
      // 搜索菜谱名称和标签中的关键词
      filter = {
        $and: [
          { status: 'approved' },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { tags: { $regex: query, $options: 'i' } }
            ]
          }
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
    
    let recipes;
    if (!query) {
      // 无搜索条件时，直接随机采样
      recipes = await Recipe.aggregate([
        { $match: { status: 'approved' } },
        { $sample: { size: Number(size) } }
      ]);
    } else {
      // 有搜索条件时，先过滤再随机
      recipes = await Recipe.aggregate([
        { $match: filter },
        { $sample: { size: Number(size) } }
      ]);
    }
    const baseUrl = process.env.SERVER_URL;
    const updatedRecipes = recipes.map(recipe => ({
      ...recipe,
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
    const recipeObj = recipe.toObject();
    const updatedRecipe = {
      ...recipeObj,
      image: recipeObj.image.startsWith('http') ? recipeObj.image : `${baseUrl}${recipeObj.image}`,
      steps: (recipeObj.steps || []).map(step => ({
        ...step,
        image: step.image && !step.image.startsWith('http') ? `${baseUrl}${step.image}` : step.image
      }))
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
    
    // 验证图片文件是否存在 - 支持子目录
    const imagePath = path.join(__dirname, '../public', image);
    try {
      await fs.access(imagePath);
    } catch {
      // 如果直接路径不存在，尝试在子目录中查找
      const possiblePaths = [
        path.join(__dirname, '../public/images/chao', path.basename(image)),
        path.join(__dirname, '../public/images/zhu', path.basename(image)),
        path.join(__dirname, '../public/images/ban', path.basename(image)),
        path.join(__dirname, '../public/images', path.basename(image))
      ];
      
      let found = false;
      for (const possiblePath of possiblePaths) {
        try {
          await fs.access(possiblePath);
          found = true;
          break;
        } catch {
          continue;
        }
      }
      
      if (!found) {
        logger.warn('Image file does not exist in any directory', {
          imagePath: image,
          ip: req.ip || req.connection.remoteAddress
        });
        return res.status(400).json({ error: 'Image file does not exist' });
      }
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

// 用户上传菜谱（待审核）
router.post('/upload', async (req, res) => {
  try {
    const { name, image, ingredients, steps, tips, tags } = req.body;
    if (!name || !image || !ingredients || !steps) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // 验证图片文件是否存在
    const imagePath = path.join(__dirname, '../public', image);
    try {
      await fs.access(imagePath);
    } catch {
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
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: 'pending'
    });
    await recipe.save();
    res.status(201).json({ message: 'Recipe uploaded, pending review.' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// 管理员审核通过菜谱
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const recipeId = Number(req.params.id);
    const recipe = await Recipe.findOneAndUpdate(
      { id: recipeId },
      { status: 'approved' },
      { new: true }
    );
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe approved.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 管理员拒绝菜谱
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const recipeId = Number(req.params.id);
    const recipe = await Recipe.findOneAndUpdate(
      { id: recipeId },
      { status: 'rejected' },
      { new: true }
    );
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取所有待审核菜谱
router.get('/pending-list', authenticate, async (req, res) => {
  try {
    const pendingRecipes = await Recipe.find({ status: 'pending' });
    res.json(pendingRecipes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;