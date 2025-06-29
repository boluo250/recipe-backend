const mongoose = require('mongoose');
const SearchKeyword = require('./models/searchKeyword');
const Recipe = require('./models/recipe');
const dotenv = require('dotenv');

dotenv.config();

async function testSearchKeywords() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // 测试记录搜索关键词
    console.log('\n=== 测试记录搜索关键词 ===');
    
    const testKeywords = ['红烧肉', '糖醋里脊', '宫保鸡丁', '麻婆豆腐', '红烧肉', '不存在的菜谱'];
    
    for (const keyword of testKeywords) {
      const result = await SearchKeyword.findOneAndUpdate(
        { keyword: keyword.toLowerCase() },
        { 
          $inc: { count: 1 },
          lastSearched: new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`记录关键词: ${keyword} -> 计数: ${result.count}`);
    }

    // 获取所有菜谱的关键词
    console.log('\n=== 获取菜谱中的关键词 ===');
    const recipes = await Recipe.find({}, 'name tags');
    const recipeKeywords = new Set();
    recipes.forEach(recipe => {
      recipeKeywords.add(recipe.name.toLowerCase());
      if (recipe.tags && Array.isArray(recipe.tags)) {
        recipe.tags.forEach(tag => {
          recipeKeywords.add(tag.toLowerCase());
        });
      }
    });
    
    console.log('菜谱中的关键词:');
    Array.from(recipeKeywords).forEach((keyword, index) => {
      console.log(`${index + 1}. ${keyword}`);
    });

    // 测试获取热门搜索关键词（只返回菜谱中存在的）
    console.log('\n=== 测试获取热门搜索关键词（仅菜谱中存在的） ===');
    
    const popularKeywords = await SearchKeyword.find({
      keyword: { $in: Array.from(recipeKeywords) }
    })
      .sort({ count: -1, lastSearched: -1 })
      .limit(10)
      .select('keyword');
    
    console.log('热门搜索关键词（仅菜谱中存在的）:');
    popularKeywords.forEach((item, index) => {
      console.log(`${index + 1}. ${item.keyword}`);
    });

    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSearchKeywords(); 