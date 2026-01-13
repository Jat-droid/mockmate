const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: String, // <--- CHANGED FROM ObjectId TO String
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  messages: [
    {
      role: { type: String, enum: ['user', 'model'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);