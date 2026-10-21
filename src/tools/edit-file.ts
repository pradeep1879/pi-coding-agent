import path from "node:path";
import fs from "node:fs/promises";

export async function editFileTool(
  filePath: string,
  oldText: string,
  newText: string,
): Promise<string> {
  try {
    const projectRoot = process.cwd();
    const targetPath = path.resolve(projectRoot, filePath);

    const relativePath = path.relative(projectRoot, targetPath);

    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      return "Error: Cannot edit files outside the project directory.";
    }

    const realProjectRoot = await fs.realpath(projectRoot);
    const realTargetPath = await fs.realpath(targetPath);

    const realRelativePath = path.relative(
      realProjectRoot,
      realTargetPath,
    );

    if (
      realRelativePath === ".." ||
      realRelativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(realRelativePath)
    ) {
      return "Error: Cannot edit files outside the project directory.";
    }

    const stats = await fs.stat(realTargetPath);

    if (!stats.isFile()) {
      return "Error: The target must be a regular file.";
    }

    if (!oldText) {
      return "Error: oldText cannot be empty.";
    }

    const originalContent = await fs.readFile(realTargetPath, "utf8");

    const firstMatch = originalContent.indexOf(oldText);

    if (firstMatch === -1) {
      return "Error: The specified old text was not found. No changes made.";
    }

    const secondMatch = originalContent.indexOf(
      oldText,
      firstMatch + oldText.length,
    );

    if (secondMatch !== -1) {
      return "Error: oldText appears more than once. Provide a more specific text snippet.";
    }

    const updatedContent =
      originalContent.slice(0, firstMatch) +
      newText +
      originalContent.slice(firstMatch + oldText.length);

    await fs.writeFile(realTargetPath, updatedContent, "utf8");

    return `Successfully edited ${relativePath}`;
  } catch (error) {
    return `Error editing file: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}