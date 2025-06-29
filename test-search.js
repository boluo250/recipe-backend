const mongoose = require('mongoose');
const SearchKeyword = require('./models/searchKeyword');
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
    
    const testKeywords = ['红烧肉', '糖醋里脊', '宫保鸡丁', '麻婆豆腐', '红烧肉'];
    
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

    // 测试获取热门搜索关键词
    console.log('\n=== 测试获取热门搜索关键词 ===');
    
    const popularKeywords = await SearchKeyword.find()
      .sort({ count: -1, lastSearched: -1 })
      .limit(10)
      .select('keyword count');
    
    console.log('热门搜索关键词:');
    popularKeywords.forEach((item, index) => {
      console.log(`${index + 1}. ${item.keyword} (${item.count}次)`);
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