
import { describe, expect, test } from "bun:test";

import path from "node:path";
import { securePath } from "../tools/secure-path";

describe("securePath", () => {
  test("allows an existing project file", () => {
    expect(securePath("package.json")).toBe(
      path.join(process.cwd(), "package.json"),
    );
  });

  test("allows a new file in the project root", () => {
    expect(securePath("new-test-file.txt", {
      allowNewFile: true,
    })).toBe(path.join(process.cwd(), "new-test-file.txt"));
  });

  test("rejects paths outside the project", () => {
    expect(() => securePath("../../.ssh/")).toThrow();
  });

  test("rejects absolute paths", () => {
    expect(() => securePath("/etc/passwd")).toThrow();
  });

  test("rejects empty paths", () => {
    expect(() => securePath("")).toThrow();
    expect(() => securePath("   ")).toThrow();
  });

  test("rejects missing files when new files are not allowed", () => {
    expect(() => securePath("missing-test-file.txt")).toThrow();
  });
});
