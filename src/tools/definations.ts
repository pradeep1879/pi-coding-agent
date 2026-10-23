import { Type, type FunctionDeclaration } from "@google/genai";

export const listFileDeclaration: FunctionDeclaration = {
  name: "list_files",
  description:
    "Inspect the current project directory and discover its files and subdirectories. Use this first when understanding an unfamiliar workspace. Paths must be relative to the project root.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      directory: {
        type: Type.STRING,
        description:
          'Relative directory to inspect, such as "." or "src".',
      },
    },
  },
};

export const readFileDeclaration: FunctionDeclaration = {
  name: "read_file",
  description:
    "Read a UTF-8 text file inside the current project. Inspect package.json, configuration, and relevant source files before making changes. Never assume file contents.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description:
          "Project-relative path, such as package.json or src/index.ts.",
      },
    },
    required: ["filePath"],
  },
};

export const writeFileDeclaration: FunctionDeclaration = {
  name: "write_file",
  description:
    "Create a new project file with the complete requested content. This tool does not overwrite existing files and may require user approval. Use edit_file for existing files.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description: "Relative path of the new file.",
      },
      content: {
        type: Type.STRING,
        description: "Complete content to write into the new file.",
      },
    },
    required: ["filePath", "content"],
  },
};

export const editFileDeclaration: FunctionDeclaration = {
  name: "edit_file",
  description:
    "Modify an existing project file by replacing one unique exact text snippet. Read the file first. The operation fails if the snippet is missing or appears more than once and may require user approval.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description: "Relative path of the existing file.",
      },
      oldText: {
        type: Type.STRING,
        description: "Exact existing text to replace.",
      },
      newText: {
        type: Type.STRING,
        description: "Replacement text.",
      },
    },
    required: ["filePath", "oldText", "newText"],
  },
};

export const runCommandDeclaration: FunctionDeclaration = {
  name: "run_command",
  description:
    "Run a supported terminal command in the current project and return its output and exit code. Use this to install dependencies with approval, run tests, check types, build the application, and diagnose errors. Only commands accepted by the command validator can execute.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description:
          "A supported terminal command, such as bun test or bun run build.",
      },
    },
    required: ["command"],
  },
};



export const inspectProjectDeclaration: FunctionDeclaration = {
  name: "inspect_project",
  description:
    "Inspect a project directory before planning changes. Identify the package name, project type, frameworks, package manager, available scripts, and any inspection notes. Use this before modifying project files.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      directory: {
        type: Type.STRING,
        description:
          'Project-relative directory to inspect. Use "." for the current project root.',
      },
    },
  },
};
