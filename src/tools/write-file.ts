
import path from "node:path";
import fs from "node:fs/promises";
import { securePath } from "./secure-path";

export async function writeFileTool(
  filePath: string,
  content: string,
): Promise<string> {
  try {
    if (!filePath.trim()) {
      throw new Error("File path cannot be empty.");
    }

    // Validate the target path before creating or writing anything.
    const targetPath = securePath(filePath, {
      allowNewFile: true,
      allowNewDirectories: true,
    });

    const relativePath = path.relative(process.cwd(), targetPath);

    // Preserve your existing behavior: create parent directories.
    await fs.mkdir(path.dirname(targetPath), {
      recursive: true,
    });

    // "wx" creates a new file and refuses to overwrite an existing file.
    await fs.writeFile(targetPath, content, {
      encoding: "utf8",
      flag: "wx",
    });

    return `Successfully created ${relativePath}`;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      return `Error: ${filePath} already exists. Refusing to overwrite it.`;
    }

    return `Error writing file: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}
