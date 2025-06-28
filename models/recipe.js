const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true }, // 存储 /images/filename.jpg
  ingredients: { type: String, required: true }, // 食材
  steps: { type: String, required: true },
  tips: { type: String }, // 小贴士，非必须
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);