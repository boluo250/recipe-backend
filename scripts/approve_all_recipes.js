const mongoose = require('mongoose');
const Recipe = require('../models/recipe');

// 修改为你的 MongoDB 连接字符串
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recipe';

async function approveAllRecipes() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await Recipe.updateMany({}, { $set: { status: 'approved' } });
  console.log(`已将 ${result.modifiedCount || result.nModified} 条菜谱状态改为 approved`);
  await mongoose.disconnect();
}

approveAllRecipes().catch(err => {
  console.error('批量更新失败:', err);
  process.exit(1);
}); 