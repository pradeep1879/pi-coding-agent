import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "../config/store.js";

import {
  readFileDeclaration,
  listFileDeclaration,
  writeFileDeclaration,
  editFileDeclaration,
  runCommandDeclaration,
  inspectProjectDeclaration,
} from "../tools/definations.js";

import { readFileTool } from "../tools/read-file.js";
import { listFilesToo } from "../tools/list-files.js";
import { systemInstruction } from "../prompt/prompt.js";
import { conversationHistory } from "../agent/session.js";
import { writeFileTool } from "../tools/write-file.js";
import { editFileTool } from "../tools/edit-file.js";
import { runCommand } from "../tools/run-command.js";
import { inspectProject } from "../tools/inspect-project.js";

type ApprovalCallback = (action: string) => Promise<boolean>;

const MODEL = "gemini-2.5-flash";
const MAX_ITERATIONS = 15;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function streamGemini(
  prompt: string,
  requestApproval: ApprovalCallback = async () => false,
): Promise<void> {
  const apiKey = await getApiKey("gemini");

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }


  const ai = new GoogleGenAI({ apiKey });
  const history = conversationHistory;

  // Inspect the current workspace before Gemini plans the task.
  const inspection = await inspectProject();

  console.log("\n[Tool] Inspecting project");

  history.push({
    role: "user",
    parts: [
      {
        text: `Project inspection results:\n${JSON.stringify(inspection, null, 2)}`,
      },
    ],
  });

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
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                readFileDeclaration,
                listFileDeclaration,
                writeFileDeclaration,
                editFileDeclaration,
                runCommandDeclaration,
                inspectProjectDeclaration
              ],
            },
          ],
        },
      });

      const modelContent = response.candidates?.[0]?.content;

      if (!modelContent) {
        throw new Error("Gemini returned no conversation content.");
      }

      // Preserve Gemini's response and tool calls.
      history.push(modelContent);

      const functionCalls = response.functionCalls ?? [];

      // No tool calls means Gemini has finished responding.
      if (functionCalls.length === 0) {
        const finalText = response.text;

        if (finalText) {
          console.log(finalText);
        } else {
          console.log("No text response received.");
        }

        return;
      }

      const functionResponses = [];

      for (const call of functionCalls) {
        const args = call.args;

        try {
          let result: unknown;

          switch (call.name) {
            case "list_files": {
              const directory = args?.directory;

              if (directory !== undefined && typeof directory !== "string") {
                throw new Error("directory must be a string.");
              }

              console.log(`\n[Tool] Listing ${directory ?? "."}`);

              result = await listFilesToo(directory ?? ".");
              break;
            }

            case "read_file": {
              const filePath = args?.filePath;

              if (typeof filePath !== "string" || !filePath.trim()) {
                throw new Error("filePath must be a non-empty string.");
              }

              console.log(`\n[Tool] Reading ${filePath}`);

              result = await readFileTool(filePath);
              break;
            }

            case "write_file": {
              const filePath = args?.filePath;
              const content = args?.content;

              if (
                typeof filePath !== "string" ||
                !filePath.trim() ||
                typeof content !== "string"
              ) {
                throw new Error(
                  "filePath must be a non-empty string and content must be a string.",
                );
              }

              const approved = await requestApproval(`write_file: ${filePath}`);

              if (approved !== true) {
                throw new Error(`File write rejected by user: ${filePath}`);
              }

              console.log(`\n[Tool] Writing ${filePath}`);

              result = await writeFileTool(filePath, content);
              break;
            }

            case "edit_file": {
              const filePath = args?.filePath;
              const oldText = args?.oldText;
              const newText = args?.newText;

              if (
                typeof filePath !== "string" ||
                !filePath.trim() ||
                typeof oldText !== "string" ||
                !oldText ||
                typeof newText !== "string"
              ) {
                throw new Error(
                  "filePath must be a non-empty string, oldText must be non-empty, and newText must be a string.",
                );
              }

              const approved = await requestApproval(`edit_file: ${filePath}`);

              if (approved !== true) {
                throw new Error(`File edit rejected by user: ${filePath}`);
              }

              console.log(`\n[Tool] Editing ${filePath}`);

              result = await editFileTool(filePath, oldText, newText);
              break;
            }

            case "run_command": {
              const command = args?.command;

              if (typeof command !== "string" || !command.trim()) {
                throw new Error("command must be a non-empty string.");
              }

              console.log(`\n[Tool] Running command: ${command}`);

              const commandResult = await runCommand(command, requestApproval);

              // Include failure information so Gemini can diagnose errors.
              result = {
                command,
                exitCode: commandResult.code,
                output: commandResult.output,
                success: commandResult.code === 0,
                ...(commandResult.code !== 0
                  ? {
                      instruction:
                        "The command failed or did not complete successfully. Analyze the output, fix the cause if possible, and rerun the command when appropriate.",
                    }
                  : {}),
              };

              break;
            }

            case "inspect_project": {
              const inspection = await inspectProject();
              result = JSON.stringify(inspection);
              break;
            }

            default:
              throw new Error(`Unsupported tool: ${call.name ?? "unknown"}`);
          }

          functionResponses.push({
            functionResponse: {
              name: call.name ?? "unknown",
              response: { result },
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: call.name ?? "unknown",
              response: {
                error: getErrorMessage(error),
                instruction:
                  "Review this error. If it is fixable, explain or implement a safe correction and try again when appropriate.",
              },
            },
          });
        }
      }

      // Feed tool results back to Gemini so it can continue working.
      history.push({
        role: "user",
        parts: functionResponses,
      });
    }
  } catch (error) {
    const message = getErrorMessage(error);

    if (message.includes("503") || message.includes("UNAVAILABLE")) {
      throw new Error(
        "Gemini is temporarily unavailable due to high demand. Please try again later.",
      );
    }

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(
        "Gemini API quota or rate limit reached. Check your usage at https://ai.dev/rate-limit.",
      );
    }

    throw new Error(`Gemini request failed: ${message}`);
  }

  throw new Error(
    `Agent stopped after reaching the maximum of ${MAX_ITERATIONS} model turns.`,
  );
}
