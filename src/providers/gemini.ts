import { GoogleGenAI, type Content } from "@google/genai";
import { getApiKey } from "../config/store.js";
import {
  readFileDeclaration,
  listFileDeclaration,
  writeFileDeclaration,
  editFileDeclaration,
  runCommandDeclaration,
} from "../tools/definations.js";
import { readFileTool } from "../tools/read-file.js";
import { listFilesToo } from "../tools/list-files.js";
import { systemInstruction } from "../prompt/prompt.js";
import { conversationHistory } from "../agent/session.js";
import { writeFileTool } from "../tools/write-file.js";
import { editFileTool } from "../tools/edit-file.js";
import { runCommand } from "../tools/run-command.js";

const MODEL = "gemini-2.5-flash";
const MAX_ITERATIONS = 10;

export async function streamGemini(prompt: string): Promise<void> {
  const apiKey = await getApiKey("gemini");

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Keep the complete conversation across model turns.
  const history = conversationHistory;

  history.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
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
              listFileDeclaration,
              writeFileDeclaration,
              editFileDeclaration,
              runCommandDeclaration
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
      const args = call.args;

      // Handle list_files
      if (call.name === "list_files") {
        const directory = args?.directory;

        if (directory !== undefined && typeof directory !== "string") {
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
                error: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }

        continue;
      }

      // Handle read_file
      if (call.name === "read_file") {
        const filePath = args?.filePath;

        if (typeof filePath !== "string" || !filePath.trim()) {
          functionResponses.push({
            functionResponse: {
              name: "read_file",
              response: { error: "Invalid filePath argument" },
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
                error: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }

        continue;
      }

      // Handle write_file
      if (call.name === "write_file") {
        const filePath = args?.filePath;
        const content = args?.content;

        if (
          typeof filePath !== "string" ||
          !filePath.trim() ||
          typeof content !== "string"
        ) {
          functionResponses.push({
            functionResponse: {
              name: "write_file",
              response: {
                error:
                  "filePath must be a non-empty string and content must be a string",
              },
            },
          });
          continue;
        }

        console.log(`\n[Tool] Writing ${filePath}`);

        try {
          const result = await writeFileTool(filePath, content);

          functionResponses.push({
            functionResponse: {
              name: "write_file",
              response: { result },
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: "write_file",
              response: {
                error: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }

        continue;
      }

      // Handle edit_file
      if (call.name === "edit_file") {
        const filePath = call.args?.filePath;
        const oldText = call.args?.oldText;
        const newText = call.args?.newText;

        if (
          typeof filePath !== "string" ||
          !filePath.trim() ||
          typeof oldText !== "string" ||
          !oldText ||
          typeof newText !== "string"
        ) {
          functionResponses.push({
            functionResponse: {
              name: "edit_file",
              response: {
                error:
                  "filePath must be a non-empty string, oldText must be non-empty, and newText must be a string.",
              },
            },
          });

          continue;
        }

        console.log(`\n[Tool] Editing ${filePath}`);

        try {
          const result = await editFileTool(filePath, oldText, newText);

          functionResponses.push({
            functionResponse: {
              name: "edit_file",
              response: { result },
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: "edit_file",
              response: {
                error: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }

        continue;
      }


      // Handle run_command
      if (call.name === "run_command") {
        console.log(call.name, call.args, "handle run_command")
        const command = args?.command;

        if (typeof command !== "string" || !command.trim()) {
          functionResponses.push({
            functionResponse: {
              name: "run_command",
              response: { error: "Invalid command argument" },
            },
          });
          continue;
        }

        console.log(`\n[Tool] Running command: ${command}`);

        try {
          const result = await runCommand(command);

          functionResponses.push({
            functionResponse: {
              name: "run_command",
              response: {
                output: result.output,
                exitCode: result.code,
              },
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: "run_command",
              response: {
                error: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }

        continue;
      }

      

      // Handle unknown tools
      functionResponses.push({
        functionResponse: {
          name: call.name ?? "unknown",
          response: {
            error: `Unsupported tool: ${call.name ?? "unknown"}`,
          },
        },
      });
    }

    // Return the tool results to Gemini on the next iteration.
    history.push({
      role: "user",
      parts: functionResponses,
    });
  }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if(message.includes("503") || message.includes("UNAVAILABLE")) {
      throw new Error(
        "Gemini is temporarily unavailable due to high demand. Please try again later."
      );
    }

    if(message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(
        "Gemini API quota or rate limit reached. Check your usage at https://ai.dev/rate-limit."
      );
    }

    throw new Error(`Gemini request failed: ${message}`);
  }

  throw new Error(
    `Agent stopped after reaching the maximum of ${MAX_ITERATIONS} model turns.`
  );

}
