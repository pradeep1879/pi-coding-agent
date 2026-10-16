import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "../config/store.js";
import { readFileDeclaration } from "../tools/definations.js";
import { readFileTool } from "../tools/read-file.js";

const MODEL = "gemini-2.5-flash";

export async function streamGemini(
  prompt: string,
):Promise<void> {
  const apiKey = await getApiKey("gemini")
  if(!apiKey){
    throw new Error("Gemini api key is not configured")
  }

  const ai = new GoogleGenAI({apiKey});


  // first step ask gemini whether it needs a tool.
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [
        {
          functionDeclarations: [readFileDeclaration]
        }
      ]
    }
  });


  const functionCall = response.functionCalls?.[0];
  console.dir(functionCall, { depth: null });

  // if gemini doesn't ask for tool then prints its response

  if(!functionCall){
    console.log(response.text ?? "No response received.");
    return;
  }


  if(functionCall.name !== "read_file"){
    throw new Error(`Unsupported tool: ${functionCall.name}`)
  }

  const filePath = functionCall.args?.filePath;


  if (typeof filePath !== "string") {
    throw new Error("Gemini returned an invalid file path");
  }


  console.log(`Reading file: ${filePath}\n`);

  // step 3; execute the requested tool in our application
  let result: string;

  try {
    result  = await readFileTool(filePath);

  } catch (error) {
    result = `Tool error: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  // step 4; send the tool result back to Gemini and steam its answer.

  const modelContent = response.candidates?.[0]?.content;

  if(!modelContent){
    throw new Error("Gemini did not return the tool-call conversation");
  }

  const stream  = await ai.models.generateContentStream({
    model: MODEL,
    contents: [
      {
        role: "user", parts: [{ text: prompt }]
      },
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: "read_file",
              response: { result },
            }
          }
        ]
      }
    ]
  })

  for await (const chunk of stream){
    if(chunk.text){
      process.stdout.write(chunk.text);
    }
  }
  process.stdout.write("\n");
}
