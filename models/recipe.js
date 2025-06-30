const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true }, // 存储 /images/filename.jpg
  ingredients: { type: String, required: true }, // 食材
  steps: [{
    description: { type: String, required: true },
    image: { type: String } // 可选
  }],
  tips: { type: String }, // 小贴士，非必须
  tags: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);