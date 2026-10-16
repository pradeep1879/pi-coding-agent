import { Type, type FunctionDeclaration } from "@google/genai";

export const readFileDeclaration: FunctionDeclaration = {
  name: "read_file",
  description:
    "Read a UTF-8 text file inside the current project directory. Use this when inspecting source code or project configuration.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description:
          "The relative path of the file to read, such as package.json or src/index.ts. Provide the path as a plain string.",
      },
    },
    required: ["filePath"],
  },
};
