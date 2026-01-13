const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  // HARDCODE THE KEY HERE FOR TESTING (Do not use process.env)
  const genAI = new GoogleGenerativeAI("AIzaSyAXK9lnaXvcuGV7cjfWVqHiOkT2zZ0qRuQ"); 
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

  console.log("1. Contacting Gemini...");
  
  try {
    const result = await model.generateContent("Say 'Hello' if you can hear me.");
    const response = await result.response;
    console.log("2. SUCCESS! API Reply:", response.text());
  } catch (error) {
    console.log("3. FAILED.");
    console.log("Error Message:", error.message);
    // If it's a 404, the key is invalid or the project is wrong.
  }
}

run();