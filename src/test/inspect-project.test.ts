
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { inspectProject } from "../tools/inspect-project";

let testDirectory: string;
let originalDirectory: string;

beforeEach(async () => {
  originalDirectory = process.cwd();
  testDirectory = await mkdtemp(
    path.join(originalDirectory, ".my-pi-inspect-test-"),
  );
  process.chdir(testDirectory);
});

afterEach(async () => {
  process.chdir(originalDirectory);
  await rm(testDirectory, { recursive: true, force: true });
});

describe("inspectProject", () => {
  test("detects framework, package manager, and scripts", async () => {
    await writeFile(
      "package.json",
      JSON.stringify({
        name: "demo-app",
        packageManager: "bun@1.3.14",
        dependencies: {
          react: "19.0.0",
          express: "5.0.0",
        },
        scripts: {
          dev: "vite",
          build: "vite build",
          test: "bun test",
        },
      }),
    );

    const result = await inspectProject(testDirectory);

    expect(result.kind).toBe("node-project");
    expect(result.packageName).toBe("demo-app");
    expect(result.packageManager).toBe("bun");
    expect(result.frameworks).toContain("React");
    expect(result.frameworks).toContain("Express");
    expect(result.scripts.build).toBe("vite build");
  });

  test("detects an empty directory", async () => {
  const emptyDirectory = await mkdtemp(
    path.join(originalDirectory, ".my-pi-empty-test-"),
  );

  try {
    const result = await inspectProject(emptyDirectory);

    expect(result.kind).toBe("empty");
    expect(result.packageName).toBeNull();
    expect(result.frameworks).toEqual([]);
  } finally {
    await rm(emptyDirectory, { recursive: true, force: true });
  }
});

  test("reports a package manager from a lockfile", async () => {
    await writeFile("bun.lock", "");

    const result = await inspectProject();

    expect(result.packageManager).toBe("Bun");
    expect(result.kind).toBe("node-project");
  });

  test("handles a malformed package.json", async () => {
    await writeFile("package.json", "{ invalid json");

    const result = await inspectProject();

    expect(result.packageName).toBeNull();
    expect(result.notes).toContain(
      "package.json exists but could not be parsed.",
    );
  });
});
