
import { conversationHistory } from "./agent/session.js";

conversationHistory.push({
  role: "user",
  parts: [{ text: "My project is called my-pi." }],
});

conversationHistory.push({
  role: "model",
  parts: [{ text: "Understood. Your project is called my-pi." }],
});

conversationHistory.push({
  role: "user",
  parts: [{ text: "What is my project called?" }],
});

console.log(JSON.stringify(conversationHistory, null, 2));
