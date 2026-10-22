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



export const listFileDeclaration: FunctionDeclaration = {
  name: "list_files",
  description:
    "List files and directories inside the current project. Use this to discover the project structure before reading files.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      directory: {
        type: Type.STRING,
        description:
          'The relative directory to list, such as "." or "src". Use "." to list the project root.',
      },
    },
  },
};


export const writeFileDeclaration: FunctionDeclaration = {
  name: "write_file",
  description:
    "Create a new file inside the project with the provided content. Never overwrites an existing file.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description: "Relative path of the file to create",
      },
      content: {
        type: Type.STRING,
        description: "Complete content to write into the file",
      },
    },
    required: ["filePath", "content"]
  }
}


export const editFileDeclaration: FunctionDeclaration = {
  name: "edit_file",
  description:
    "Replace one unique occurrence of specific text in an existing project file. Does not create files. Fails if the old text is missing or appears multiple times.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description: "Relative path of the existing file to edit",
      },
      oldText: {
        type: Type.STRING,
        description: "Exact existing text to replace",
      },
      newText: {
        type: Type.STRING,
        description: "Replacement text",
      },
    },
    required: ["filePath", "oldText", "newText"],
  },
};



export const runCommandDeclaration: FunctionDeclaration = {
  name: "run_command",
  description:
    "Execute a terminal command in the project directory and return its output and exit code.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description: "The terminal command to execute.",
      },
    },
    required: ["command"],
  },
};
