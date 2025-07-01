const mongoose = require('mongoose');
const Recipe = require('../models/recipe');

async function approveAll() {
  await mongoose.connect('mongodb://localhost:27017/recipes');
  await Recipe.updateMany({ status: 'pending' }, { status: 'approved' });
  console.log('All pending recipes approved!');
  mongoose.disconnect();
}

approveAll();