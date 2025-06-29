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
    
    const testKeywords = ['红烧肉', '红烧', '肉', '糖醋里脊', '糖醋', '里脊', '宫保鸡丁', '宫保', '鸡丁', '麻婆豆腐', '麻婆', '豆腐', '不存在的菜谱'];
    
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

    // 测试获取热门搜索关键词（新的匹配逻辑）
    console.log('\n=== 测试获取热门搜索关键词（新匹配逻辑） ===');
    
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
        console.log(`✓ 匹配成功: ${keyword} (名称匹配: ${nameMatch}, 标签匹配: ${tagMatch})`);
      } else {
        console.log(`✗ 不匹配: ${keyword}`);
      }
      
      // 限制返回数量
      if (validKeywords.length >= 10) {
        break;
      }
    }
    
    console.log('\n最终热门搜索关键词:');
    validKeywords.forEach((item, index) => {
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