const express = require('express');
const router = express.Router();
const { getInterviewReply, getUserInterviews, getInterviewById, endInterview } = require('../controllers/aiController');

// Existing Chat Route
router.post('/chat', getInterviewReply);

// New History Routes
router.get('/history/:userId', getUserInterviews); // Get list of chats
router.get('/chat/:id', getInterviewById); // Get specific chat messages
router.post('/end', endInterview);
module.exports = router;