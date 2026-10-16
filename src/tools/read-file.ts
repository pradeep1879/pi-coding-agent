import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const MAX_FILE_SIZE = 100 * 1024;

export async function readFileTool(filePath:string): Promise<string> {
  if(!filePath.trim()){
    throw new Error("file path cannot be empty");
  }

  const projectRoot = await realpath(process.cwd());

   const resolvedPath = await realpath(
    path.resolve(projectRoot, filePath),
  );


  // Prevent reading files outside the project.
  if (
    resolvedPath !== projectRoot &&
    !resolvedPath.startsWith(projectRoot + path.sep)
  ) {
    throw new Error("Cannot read files outside the project directory");
  }

  const fileInfo = await stat(resolvedPath);

  if (!fileInfo.isFile()) {
    throw new Error("The requested path is not a file");
  }

  if (fileInfo.size > MAX_FILE_SIZE) {
    throw new Error("File is too large to read (maximum 100 KB)");
  }

  return await readFile(resolvedPath, "utf8");
}