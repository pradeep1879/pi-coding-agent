
import { readdir, stat, realpath } from "node:fs/promises";
import path from "node:path";

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
  files: string[] = []
): Promise<string> {
  if (depth > MAX_DEPTH) {
    return files.join("\n");
  }

  const projectRoot = await realpath(process.cwd());

  const targetPath = await realpath(
    path.resolve(projectRoot, directory)
  );

  if (
    targetPath !== projectRoot &&
    !targetPath.startsWith(projectRoot + path.sep)
  ) {
    throw new Error("Cannot list directories outside the project");
  }

  const directoryInfo = await stat(targetPath);

  if (!directoryInfo.isDirectory()) {
    throw new Error("The requested path is not a directory");
  }

  const entries = await readdir(targetPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (files.length >= MAX_LIMIT) {
      return files.join("\n");
    }

    if (
      entry.isDirectory() &&
      IGNORED_DIRS.has(entry.name)
    ) {
      continue;
    }

    const relativePath = path.relative(
      ".",
      path.join(directory, entry.name)
    );

    if (entry.isFile()) {
      files.push(relativePath);
    } else if (entry.isDirectory()) {
      files.push(`${relativePath}/`);

      await listFilesToo(
        path.join(directory, entry.name),
        depth + 1,
        files
      );
    }
  }

  return files.join("\n");
}
