import path from "node:path";
import fs from "node:fs/promises";

export async function writeFileTool(
  filePath: string,
  content: string,
): Promise<string> {
  try {
    const projectRoot = process.cwd();
    const targetPath = path.resolve(projectRoot, filePath);

    const relativePath = path.relative(projectRoot, targetPath);

  //     path.relative(
  //   "/Users/pradeep/pi",
  //   "/Users/pradeep/pi/src/utils.ts",
  // ); // src/utils.ts

    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      return "Error: Cannot write outside the project directory.";
    }

    await fs.mkdir(path.dirname(targetPath), {
      recursive: true,
    });

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