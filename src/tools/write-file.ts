
import path from "node:path";
import fs from "node:fs/promises";
import { securePath } from "./secure-path";

export async function writeFileTool(
  filePath: string,
  content: string,
): Promise<string> {
  if (!filePath.trim()) {
    throw new Error("File path cannot be empty.");
  }

  const targetPath = securePath(filePath, {
    allowNewFile: true,
    allowNewDirectories: true,
  });

  const relativePath = path.relative(process.cwd(), targetPath);

  await fs.mkdir(path.dirname(targetPath), {
    recursive: true,
  });

  // "wx" creates a new file and refuses to overwrite an existing file.
  // Filesystem errors propagate to the agent's tool handler.
  await fs.writeFile(targetPath, content, {
    encoding: "utf8",
    flag: "wx",
  });

  return `Successfully created ${relativePath}`;
}
