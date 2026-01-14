const { GoogleGenerativeAI } = require("@google/generative-ai");
const Interview = require("../models/Interview");
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = "gemini-flash-lite-latest"; 

// 1. CHAT FUNCTION
exports.getInterviewReply = async (req, res) => {
  try {
    const { message, topic, userId, interviewId } = req.body;
    
    // Find or Create Interview
    let interview;
    if (interviewId) {
      interview = await Interview.findById(interviewId);
    } 
    
    if (!interview) {
      interview = new Interview({
        userId: userId, 
        topic: topic, 
        messages: []
      });
    }

    // Add User Message
    interview.messages.push({ role: "user", content: message });

    // Prepare History
    const history = interview.messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Start Chat
    const model = genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000 }
    });

    // The Instruction Prompt
    const prompt = `
      You are an expert technical interviewer for a ${topic} role.
      The candidate said: "${message}".
      
      Instructions:
      1. Answer clearly and concisely.
      2. If asking a question, ask ONE at a time.
      3. Use Markdown formatting.
      4. Keep responses under 800 words.
    `;

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // Save AI Message
    interview.messages.push({ role: "model", content: responseText });
    await interview.save();

    res.json({ 
      reply: responseText, 
      interviewId: interview._id 
    });

  } catch (error) {
    console.error("[AI Chat Error]", error.message);
    res.status(500).json({ error: "Failed to generate response" });
  }
};

// 2. GET HISTORY
exports.getUserInterviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const interviews = await Interview.find({ userId }).select('topic createdAt feedback').sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error("[History Error]", error.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// 3. GET SINGLE CHAT
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    res.json(interview);
  } catch (error) {
    console.error("[Get Chat Error]", error.message);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
};

// 4. END INTERVIEW & FEEDBACK
exports.endInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) return res.status(404).json({ error: "Interview not found" });

    const conversationText = interview.messages.map(m => 
      `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`
    ).join('\n');

    const prompt = `
      Analyze this interview. Return a STRICT JSON object:
      {
        "score": number (0-10),
        "summary": "string",
        "strengths": ["string", "string"],
        "weaknesses": ["string", "string"]
      }
      History:
      ${conversationText}
    `;

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean JSON
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const feedbackData = JSON.parse(jsonString);

    interview.feedback = feedbackData;
    await interview.save();

    res.json(feedbackData);

  } catch (error) {
    console.error("[Feedback Error]", error.message);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
};