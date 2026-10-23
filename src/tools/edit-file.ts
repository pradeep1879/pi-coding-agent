
import path from "node:path";
import fs from "node:fs/promises";
import { securePath } from "./secure-path";

export async function editFileTool(
  filePath: string,
  oldText: string,
  newText: string,
): Promise<string> {
  try {
    if (!filePath.trim()) {
      throw new Error("File path cannot be empty.");
    }

    if (!oldText) {
      throw new Error("oldText cannot be empty.");
    }

    const safePath = securePath(filePath);
    const stats = await fs.stat(safePath);

    if (!stats.isFile()) {
      throw new Error("The target must be a regular file.");
    }

    const originalContent = await fs.readFile(safePath, "utf8");

    const firstMatch = originalContent.indexOf(oldText);

    if (firstMatch === -1) {
      throw new Error(
        "The specified old text was not found. No changes made.",
      );
    }

    const secondMatch = originalContent.indexOf(
      oldText,
      firstMatch + oldText.length,
    );

    if (secondMatch !== -1) {
      throw new Error(
        "oldText appears more than once. Provide a more specific text snippet.",
      );
    }

    const updatedContent =
      originalContent.slice(0, firstMatch) +
      newText +
      originalContent.slice(firstMatch + oldText.length);

    await fs.writeFile(safePath, updatedContent, "utf8");

    const relativePath = path.relative(process.cwd(), safePath);

    return `Successfully edited ${relativePath}`;
  } catch (error) {
    return `Error editing file: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}
