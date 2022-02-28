const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  detail: { type: String, required: false },
  created: { type: String, required: true },
  isComplete: { type: Boolean, require: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

module.exports = mongoose.model('Todo', todoSchema);
