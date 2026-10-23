
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { readFileTool } from "../tools/read-file";
import { writeFileTool } from "../tools/write-file";



let testDirectory: string;

function relativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

beforeEach(async () => {
  testDirectory = await mkdtemp(
    path.join(process.cwd(), ".my-pi-test-"),
  );
});

afterEach(async () => {
  await rm(testDirectory, {
    recursive: true,
    force: true,
  });
});

describe("readFileTool", () => {
  test("reads an existing file", async () => {
    const filePath = path.join(testDirectory, "hello.txt");
    await writeFile(filePath, "Hello world", "utf8");

    const result = await readFileTool(relativePath(filePath));

    expect(result).toBe("Hello world");
  });

  test("rejects paths outside the project", async () => {
    await expect(
      readFileTool("../../.ssh/test-key"),
    ).rejects.toThrow();
  });

  test("rejects absolute paths", async () => {
    await expect(
      readFileTool("/etc/passwd"),
    ).rejects.toThrow();
  });

  test("rejects missing files", async () => {
    await expect(
      readFileTool(
        relativePath(path.join(testDirectory, "missing.txt")),
      ),
    ).rejects.toThrow();
  });

  test("rejects files larger than 100 KB", async () => {
    const filePath = path.join(testDirectory, "large.txt");

    await writeFile(filePath, "a".repeat(100 * 1024 + 1), "utf8");

    await expect(
      readFileTool(relativePath(filePath)),
    ).rejects.toThrow("File is too large");
  });

  test("rejects directories instead of files", async () => {
    const nestedDirectory = path.join(testDirectory, "nested");
    await mkdir(nestedDirectory);

    await expect(
      readFileTool(relativePath(nestedDirectory)),
    ).rejects.toThrow("not a file");
  });
});

describe("writeFileTool", () => {
  test("creates a new file", async () => {
    const filePath = path.join(testDirectory, "created.txt");
    const relative = relativePath(filePath);

    const result = await writeFileTool(relative, "New content");

    expect(result).toContain("Successfully created");
    expect(await readFile(filePath, "utf8")).toBe("New content");
  });

  test("refuses to overwrite an existing file", async () => {
    const filePath = path.join(testDirectory, "existing.txt");
    await writeFile(filePath, "Original content", "utf8");

    const result = await writeFileTool(
      relativePath(filePath),
      "Replacement content",
    );

    expect(result).toContain("Refusing to overwrite");
    expect(await readFile(filePath, "utf8")).toBe("Original content");
  });

  test("rejects paths outside the project", async () => {
    const result = await writeFileTool(
      "../../outside-test-file.txt",
      "Should not be written",
    );

    expect(result).toContain("Error");
  });

  test("rejects absolute paths", async () => {
    const result = await writeFileTool(
      "/tmp/my-pi-outside-test.txt",
      "Should not be written",
    );

    expect(result).toContain("Error");
  });

  test("rejects empty paths", async () => {
    const result = await writeFileTool("", "Some content");

    expect(result).toContain("Error");
  });

  test("creates a file inside a new nested directory", async () => {
  const filePath = path.join(
    relativePath(testDirectory),
    "generated",
    "nested",
    "hello.ts",
  );

  const result = await writeFileTool(
    filePath,
    "console.log('hello');",
  );

  expect(result).toContain("Successfully created");

  const content = await readFile(
    path.join(testDirectory, "generated", "nested", "hello.ts"),
    "utf8",
  );

  expect(content).toBe("console.log('hello');");
});
});
