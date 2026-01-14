const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: String, 
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
  // --- NEW FEEDBACK FIELDS ---
  feedback: {
    score: { type: Number }, // e.g., 8
    summary: { type: String }, // "Good technical depth, but..."
    strengths: [{ type: String }],
    weaknesses: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);