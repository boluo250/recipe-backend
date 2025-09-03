const mongoose = require('mongoose');
const Recipe = require('./models/recipe');
require('dotenv').config();

async function checkRecipeStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('已连接到数据库');
    
    // 统计各状态的菜谱数量
    const statusCounts = await Recipe.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n=== 菜谱状态统计 ===');
    statusCounts.forEach(item => {
      const status = item._id || '未知';
      const count = item.count;
      console.log(`${status}: ${count} 个菜谱`);
    });
    
    // 获取总数量
    const totalCount = await Recipe.countDocuments();
    console.log(`\n总计: ${totalCount} 个菜谱`);
    
    // 显示最近创建的菜谱
    console.log('\n=== 最近创建的菜谱 ===');
    const recentRecipes = await Recipe.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('id name status createdAt');
    
    recentRecipes.forEach(recipe => {
      console.log(`ID: ${recipe.id}, 名称: ${recipe.name}, 状态: ${recipe.status}, 创建时间: ${recipe.createdAt}`);
    });
    
    // 显示待审核的菜谱详情
    console.log('\n=== 待审核菜谱详情 ===');
    const pendingRecipes = await Recipe.find({ status: 'pending' })
      .select('id name createdAt');
    
    if (pendingRecipes.length > 0) {
      pendingRecipes.forEach(recipe => {
        console.log(`ID: ${recipe.id}, 名称: ${recipe.name}, 创建时间: ${recipe.createdAt}`);
      });
    } else {
      console.log('暂无待审核菜谱');
    }
    
    // 显示已拒绝的菜谱
    console.log('\n=== 已拒绝菜谱详情 ===');
    const rejectedRecipes = await Recipe.find({ status: 'rejected' })
      .select('id name createdAt');
    
    if (rejectedRecipes.length > 0) {
      rejectedRecipes.forEach(recipe => {
        console.log(`ID: ${recipe.id}, 名称: ${recipe.name}, 创建时间: ${recipe.createdAt}`);
      });
    } else {
      console.log('暂无已拒绝菜谱');
    }
    
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

checkRecipeStatus();
