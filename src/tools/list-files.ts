
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { securePath } from "./secure-path";

const MAX_LIMIT = 200;
const MAX_DEPTH = 3;

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

export async function listFilesToo(
  directory = ".",
  depth = 0,
  files: string[] = [],
): Promise<string> {
  if (depth > MAX_DEPTH || files.length >= MAX_LIMIT) {
    return files.join("\n");
  }

  const targetPath = securePath(directory);
  const directoryInfo = await stat(targetPath);

  if (!directoryInfo.isDirectory()) {
    throw new Error("The requested path is not a directory.");
  }

  const entries = await readdir(targetPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (files.length >= MAX_LIMIT) {
      break;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (
      entry.isDirectory() &&
      IGNORED_DIRS.has(entry.name)
    ) {
      continue;
    }

    const absolutePath = path.join(targetPath, entry.name);
    const relativePath = path.relative(process.cwd(), absolutePath);

    // Validate each entry before inspecting or traversing it.
    let safeEntryPath: string;

    try {
      safeEntryPath = securePath(relativePath);
    } catch {
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath);
    } else if (entry.isDirectory()) {
      files.push(`${relativePath}/`);

      if (depth < MAX_DEPTH) {
        await listFilesToo(
          relativePath,  //The problem is that safeEntryPath is an absolute path, but securePath() rejects absolute paths.
          depth + 1,
          files,
        );
      }
    }
  }

  return files.join("\n");
}
