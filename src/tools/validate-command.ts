
import path from "node:path";
import { realpathSync } from "node:fs";

const ALLOWED_COMMANDS = new Set([
  "pwd",
  "ls",
  "cat",
  "git",
  "bun",
]);

const ALLOWED_LS_FLAGS = new Set(["-l", "-a", "-la", "-al"]);
const ALLOWED_GIT_SUBCOMMANDS = new Set([
  "status",
  "diff",
  "log",
]);

const ALLOWED_GIT_LOG_FLAGS = new Set([
  "--oneline",
  "--stat",
  "-5",
  "-10",
]);

const ALLOWED_GIT_DIFF_FLAGS = new Set([
  "--stat",
  "--name-only",
]);

function isInsideProject(filePath: string): boolean {
  try {
    const root = realpathSync(process.cwd());
    const resolved = realpathSync(path.resolve(root, filePath));

    return (
      resolved === root ||
      resolved.startsWith(root + path.sep)
    );
  } catch {
    return false;
  }
}

export function parseCommand(command: string): string[] | null {
  const normalized = command.trim();

  if (!normalized) return null;

  // only simple whitespace-separated arguments are supported.
  // quotes, shell operators, and escape sequences are rejected.
  if (/[;&|><`$\\'"()\n\r]/.test(normalized)) {
    return null;
  }

  const args = normalized.split(/\s+/);

  if (!ALLOWED_COMMANDS.has(args[0]!)) {
    return null;
  }

  const [executable, ...rest] = args;

  if (executable === "pwd") {
    return rest.length === 0 ? args : null;
  }

  if (executable === "ls") {
    let pathCount = 0;

    for (const arg of rest) {
      if (ALLOWED_LS_FLAGS.has(arg)) continue;

      if (arg.startsWith("-")) return null;
      if (!isInsideProject(arg)) return null;

      pathCount++;
      if (pathCount > 1) return null;
    }

    return args;
  }

  if (executable === "cat") {
    if (rest.length !== 1) return null;

    const filePath = rest[0]!;

    if (filePath.startsWith("-")) return null;
    if (!isInsideProject(filePath)) return null;

    return args;
  }

  if (executable === "git") {
    const [subcommand, ...options] = rest;

    if (!subcommand || !ALLOWED_GIT_SUBCOMMANDS.has(subcommand)) {
      return null;
    }

    if (subcommand === "status") {
      return options.length === 0 ? args : null;
    }

    if (subcommand === "log") {
      return options.every((option) =>
        ALLOWED_GIT_LOG_FLAGS.has(option)
      )
        ? args
        : null;
    }

    if (subcommand === "diff") {
      return options.every((option) =>
        ALLOWED_GIT_DIFF_FLAGS.has(option)
      )
        ? args
        : null;
    }
  }

  if (executable === "bun") {
    return rest.length === 1 && rest[0] === "test"
      ? args
      : null;
  }

  return null;
}

export function validateCommand(command: string): boolean {
  return parseCommand(command) !== null;
}
