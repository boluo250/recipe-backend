const mongoose = require('mongoose');

const searchKeywordSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  count: { type: Number, default: 1 },
  lastSearched: { type: Date, default: Date.now }
}, { timestamps: true });

// 创建复合索引，确保关键词唯一性
searchKeywordSchema.index({ keyword: 1 }, { unique: true });

module.exports = mongoose.model('SearchKeyword', searchKeywordSchema); 