
import { GoogleGenAI, type Content } from "@google/genai";
import { getApiKey } from "../config/store.js";
import { readFileDeclaration, listFileDeclaration } from "../tools/definations.js";
import { readFileTool } from "../tools/read-file.js";
import { listFilesToo } from "../tools/list-files.js";
import { systemInstruction } from "../prompt/prompt.js";


const MODEL = "gemini-2.5-flash";
const MAX_ITERATIONS = 10;

export async function streamGemini(
  prompt: string,
): Promise<void> {
  const apiKey = await getApiKey("gemini");

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Keep the complete conversation across model turns.
  const history: Content[] = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: systemInstruction,
        tools: [
          {
            functionDeclarations: [
              readFileDeclaration,
              listFileDeclaration 
            ],
          },
        ],
      },
    });

    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new Error("Gemini returned no conversation content");
    }

    // Preserve Gemini's response, including any function calls.
    history.push(modelContent);

    const functionCalls = response.functionCalls ?? [];

    // No tool calls means Gemini has finished this task.
    if (functionCalls.length === 0) {
      const finalText = response.text;

      if (finalText) {
        process.stdout.write(finalText);
        process.stdout.write("\n");
      } else {
        console.log("No text response received.");
      }

      return;
    }

    // Execute every tool requested in this model turn.
    const functionResponses = [];

    for (const call of functionCalls) {
      
    if (call.name === "list_files") {
      const args = call.args;
      const directory = args?.directory;

      if (
        directory !== undefined &&
        (typeof directory !== "string" || !directory.trim())
      ) {
        functionResponses.push({
          functionResponse: {
            name: "list_files",
            response: { error: "Invalid directory argument" },
          },
        });

        continue;
      }

      console.log(`\n[Tool] Listing ${directory ?? "."}`);

  try {
    const result = await listFilesToo(directory ?? ".");

    functionResponses.push({
      functionResponse: {
        name: "list_files",
        response: { result },
      },
    });
  } catch (error) {
    functionResponses.push({
      functionResponse: {
        name: "list_files",
        response: {
          error: error instanceof Error
            ? error.message
            : String(error),
        },
      },
    });
  }

  continue;
}

if (call.name !== "read_file") {
  functionResponses.push({
    functionResponse: {
      name: call.name ?? "unknown",
      response: {
        error: `Unsupported tool: ${call.name ?? "unknown"}`,
      },
    },
  });

  continue;
}

      const args = call.args;
      let filePath = args?.filePath;

      // Tolerate the nested argument shape seen during debugging.
      if (
        typeof filePath === "object" &&
        filePath !== null &&
        "filePath" in filePath
      ) {
        filePath = filePath.filePath;
      }

      if (typeof filePath !== "string" || !filePath.trim()) {
        functionResponses.push({
          functionResponse: {
            name: "read_file",
            response: {
              error: "Invalid filePath argument",
            },
          },
        });

        continue;
      }

      console.log(`\n[Tool] Reading ${filePath}`);

      try {
        const result = await readFileTool(filePath);

        functionResponses.push({
          functionResponse: {
            name: "read_file",
            response: { result },
          },
        });
      } catch (error) {
        functionResponses.push({
          functionResponse: {
            name: "read_file",
            response: {
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          },
        });
      }
    }

    // Return the tool results to Gemini on the next iteration.
    history.push({
      role: "user",
      parts: functionResponses,
    });
  }

  throw new Error(
    `Agent stopped after ${MAX_ITERATIONS} model turns`,
  );
}
