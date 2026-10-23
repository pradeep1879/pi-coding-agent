
import { readFile, stat } from "node:fs/promises";
import { securePath } from "./secure-path";

const MAX_FILE_SIZE = 100 * 1024; // 100 KB

export async function readFileTool(
  filePath: string,
): Promise<string> {
  if (!filePath.trim()) {
    throw new Error("File path cannot be empty.");
  }

  const safePath = securePath(filePath);
  const fileInfo = await stat(safePath);

  if (!fileInfo.isFile()) {
    throw new Error("The requested path is not a file.");
  }

  if (fileInfo.size > MAX_FILE_SIZE) {
    throw new Error("File is too large to read (maximum 100 KB).");
  }

  try {
    return await readFile(safePath, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read file "${filePath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
