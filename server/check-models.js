// This script asks Google what models your Key has access to.
const apiKey = "AIzaSyAXK9lnaXvcuGV7cjfWVqHiOkT2zZ0qRuQ";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function getModels() {
  console.log("Checking available models...");
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
        console.log("ERROR:", data.error.message);
    } else {
        console.log("SUCCESS! Here are the models you can use:");
        // Filter for "generateContent" models only
        const available = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name);
        console.log(available);
    }
  } catch (err) {
    console.log("Network Error:", err.message);
  }
}

getModels();