
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { securePath } from "./secure-path";
import type { PackageJson, ProjectInspection } from "../types/types";


async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function inspectProject(
  directory = process.cwd(),
): Promise<ProjectInspection> {
  const root = path.resolve(directory);
  const notes: string[] = [];

  const projectFile = (fileName: string) =>
    path.join(root, fileName);

  let packageJson: PackageJson | null = null;

  if (await exists(projectFile("package.json"))) {
    try {
      const content = await readFile(
        projectFile("package.json"),
        "utf8",
      );
      packageJson = JSON.parse(content) as PackageJson;
    } catch {
      notes.push("package.json exists but could not be parsed.");
    }
  }

  const frameworks = new Set<string>();
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  };

  if (dependencies.react) frameworks.add("React");
  if (dependencies.next) frameworks.add("Next.js");
  if (dependencies.vue) frameworks.add("Vue");
  if (dependencies.svelte) frameworks.add("Svelte");
  if (dependencies.express) frameworks.add("Express");
  if (dependencies["@nestjs/core"]) frameworks.add("NestJS");
  if (dependencies.prisma || dependencies["@prisma/client"]) {
    frameworks.add("Prisma");
  }
  if (dependencies.vite) frameworks.add("Vite");
  if (dependencies.typescript) frameworks.add("TypeScript");

  let packageManager = packageJson?.packageManager?.split("@")[0] ?? null;

  if (!packageManager) {
    if (
      (await exists(projectFile("bun.lock"))) ||
      (await exists(projectFile("bun.lockb")))
    ) {
      packageManager = "Bun";
    } else if (await exists(projectFile("pnpm-lock.yaml"))) {
      packageManager = "pnpm";
    } else if (await exists(projectFile("yarn.lock"))) {
      packageManager = "Yarn";
    } else if (await exists(projectFile("package-lock.json"))) {
      packageManager = "npm";
    }
  }

  if (!packageJson && !packageManager) {
    notes.push(
      "No package.json or recognized package-manager lockfile was found. This may be an empty workspace or a non-Node project.",
    );
  }

  if (packageJson && !packageManager) {
    notes.push(
      "No package manager could be identified from package.json or lockfiles.",
    );
  }

  const kind = packageJson
    ? "node-project"
    : packageManager
      ? "node-project"
      : "unknown";

  const scripts = packageJson?.scripts ?? {};

  return {
    root: path.basename(root),
    kind,
    packageManager,
    frameworks: [...frameworks],
    scripts,
    packageName: packageJson?.name ?? null,
    notes,
  };
}
