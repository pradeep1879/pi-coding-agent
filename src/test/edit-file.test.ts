
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { editFileTool } from "../tools/edit-file";

let testDirectory: string;

function relativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

beforeEach(async () => {
  testDirectory = await mkdtemp(
    path.join(process.cwd(), ".my-pi-edit-test-"),
  );
});

afterEach(async () => {
  await rm(testDirectory, { recursive: true, force: true });
});

describe("editFileTool", () => {
  test("replaces a unique text snippet", async () => {
    const filePath = path.join(testDirectory, "sample.txt");
    await writeFile(filePath, "Hello world", "utf8");

    const result = await editFileTool(
      relativePath(filePath),
      "world",
      "my-pi",
    );

    expect(result).toContain("Successfully edited");
    expect(await readFile(filePath, "utf8")).toBe("Hello my-pi");
  });

  test("rejects text that does not exist", async () => {
    const filePath = path.join(testDirectory, "sample.txt");
    await writeFile(filePath, "Hello world", "utf8");

    const result = await editFileTool(
      relativePath(filePath),
      "missing",
      "replacement",
    );

    expect(result).toContain("not found");
    expect(await readFile(filePath, "utf8")).toBe("Hello world");
  });

  test("rejects text that appears more than once", async () => {
    const filePath = path.join(testDirectory, "sample.txt");
    await writeFile(filePath, "foo bar foo", "utf8");

    const result = await editFileTool(
      relativePath(filePath),
      "foo",
      "baz",
    );

    expect(result).toContain("more than once");
    expect(await readFile(filePath, "utf8")).toBe("foo bar foo");
  });

  test("rejects paths outside the project", async () => {
    const result = await editFileTool(
      "../../outside-test-file.txt",
      "old",
      "new",
    );

    expect(result).toContain("Error");
  });

  test("rejects absolute paths", async () => {
    const result = await editFileTool(
      "/etc/passwd",
      "old",
      "new",
    );

    expect(result).toContain("Error");
  });

  test("rejects empty oldText", async () => {
    const filePath = path.join(testDirectory, "sample.txt");
    await writeFile(filePath, "Hello world", "utf8");

    const result = await editFileTool(
      relativePath(filePath),
      "",
      "replacement",
    );

    expect(result).toContain("oldText cannot be empty");
    expect(await readFile(filePath, "utf8")).toBe("Hello world");
  });
});
