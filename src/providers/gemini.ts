import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "../config/store.js";

const MODEL = "gemini-2.5-flash";

export async function* streamGemini(
  prompt: string,
):AsyncGenerator<string> {
  const apiKey = await getApiKey("gemini")
  if(!apiKey){
    throw new Error("Gemini api key is not configured")
  }

  const ai = new GoogleGenAI({apiKey});

  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: prompt,
  });

  for await (const chunk of stream){
    if(chunk.text){
      yield chunk.text;
    }
  }

}
