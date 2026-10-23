
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  mkdtemp,
  mkdir,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { listFilesToo } from "../tools/list-files";

let testDirectory: string;

function relativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

beforeEach(async () => {
  testDirectory = await mkdtemp(
    path.join(process.cwd(), ".my-pi-list-test-"),
  );
});

afterEach(async () => {
  await rm(testDirectory, { recursive: true, force: true });
});

describe("listFilesToo", () => {
  test("lists files in a directory", async () => {
    await writeFile(path.join(testDirectory, "hello.txt"), "hello");
    await mkdir(path.join(testDirectory, "src"));
    await writeFile(path.join(testDirectory, "src", "index.ts"), "export {};");

    const result = await listFilesToo(relativePath(testDirectory));
    const entries = result.split("\n");

    expect(entries).toContain(path.join(relativePath(testDirectory), "hello.txt"));
    expect(entries).toContain(path.join(relativePath(testDirectory), "src") + path.sep);
    expect(entries).toContain(
      path.join(relativePath(testDirectory), "src", "index.ts"),
    );
  });

  test("rejects paths outside the project", async () => {
    await expect(listFilesToo("../../")).rejects.toThrow();
  });

  test("rejects absolute paths", async () => {
    await expect(listFilesToo("/tmp")).rejects.toThrow();
  });

  test("rejects a file instead of a directory", async () => {
    const filePath = path.join(testDirectory, "hello.txt");
    await writeFile(filePath, "hello");

    await expect(
      listFilesToo(relativePath(filePath)),
    ).rejects.toThrow("not a directory");
  });

  test("ignores dependency and build directories", async () => {
    await mkdir(path.join(testDirectory, "node_modules"));
    await mkdir(path.join(testDirectory, "dist"));
    await writeFile(
      path.join(testDirectory, "node_modules", "ignored.js"),
      "",
    );
    await writeFile(path.join(testDirectory, "dist", "ignored.js"), "");

    const result = await listFilesToo(relativePath(testDirectory));

    expect(result).not.toContain("node_modules");
    expect(result).not.toContain("dist/");
  });

  test("does not follow symbolic links", async () => {
    const outsideDirectory = path.join(testDirectory, "outside");
    const insideDirectory = path.join(testDirectory, "inside");

    await mkdir(outsideDirectory);
    await mkdir(insideDirectory);
    await writeFile(path.join(outsideDirectory, "secret.txt"), "secret");

    await symlink(
      outsideDirectory,
      path.join(insideDirectory, "linked"),
      "dir",
    );

    const result = await listFilesToo(relativePath(insideDirectory));

    expect(result).not.toContain("secret.txt");
    expect(result).not.toContain("linked/");
  });

  test("respects the maximum entry count", async () => {
    const directory = path.join(testDirectory, "many");
    await mkdir(directory);

    await Promise.all(
      Array.from({ length: 210 }, (_, index) =>
        writeFile(path.join(directory, `file-${index}.txt`), ""),
      ),
    );

    const result = await listFilesToo(relativePath(directory));
    const entries = result.split("\n").filter(Boolean);

    expect(entries.length).toBeLessThanOrEqual(200);
  });
});
