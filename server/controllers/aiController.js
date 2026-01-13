const { GoogleGenerativeAI } = require("@google/generative-ai");
const Interview = require("../models/Interview"); 
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = "gemini-flash-lite-latest"; 

exports.getInterviewReply = async (req, res) => {
  try {
    const { message, topic, userId, interviewId } = req.body;
    
    // 1. Find or Create the Interview Session
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

    // 2. Add USER message to DB history (Clean version)
    interview.messages.push({ role: "user", content: message });

    // 3. Prepare History for Gemini (Load previous context)
    const history = interview.messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // 4. Send to AI
    const model = genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000 }
    });

    // --- NEW: THE INSTRUCTION PROMPT ---
    const prompt = `
      You are an expert technical interviewer for a ${topic} role.
      The candidate said: "${message}".

      Instructions:
      1. Answer the candidate's question clearly and professionally.
      2. If they ask for code, provide a *concise* example.
      3. CRITICAL: Your total response MUST fit within the 1000 token limit. 
      4. Do NOT cut off mid-sentence. Summarize if necessary.
      5. Use Markdown formatting (Bold, Lists, Code Blocks) for readability.
      6. End your response with a follow-up question to keep the interview going.
    `;

    // Send the INSTRUCTION, not just the message
    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // 5. Add AI message to history & SAVE
    interview.messages.push({ role: "model", content: responseText });
    await interview.save();

    res.json({ 
      reply: responseText, 
      interviewId: interview._id 
    });

  } catch (error) {
    console.error("[AI Error]", error.message);
    res.status(500).json({ error: "Failed to generate response" });
  }
};
exports.getUserInterviews = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all chats for this user, sort by newest first
    const interviews = await Interview.find({ userId })
      .select('topic createdAt') // Only get topic and date (save bandwidth)
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// GET SINGLE CHAT DETAILS
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
};