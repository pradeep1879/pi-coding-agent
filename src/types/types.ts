export type PackageJson = {
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type ProjectInspection = {
  root: string;
  kind: "empty" | "node-project" | "unknown";
  packageManager: string | null;
  frameworks: string[];
  scripts: Record<string, string>;
  packageName: string | null;
  notes: string[];
};