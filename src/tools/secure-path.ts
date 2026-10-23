
import path from "node:path";
import {
  existsSync,
  lstatSync,
  realpathSync,
} from "node:fs";

const PROJECT_ROOT = realpathSync(process.cwd());

function isInsideProject(targetPath: string): boolean {
  return (
    targetPath === PROJECT_ROOT ||
    targetPath.startsWith(PROJECT_ROOT + path.sep)
  );
}

export function securePath(
  requestedPath: string,
  options: { 
    allowNewFile?: boolean;
    allowNewDirectories?: boolean;
   } = {},
): string {
  if (!requestedPath.trim()) {
    throw new Error("Path cannot be empty.");
  }

  if (requestedPath.includes("\0") || path.isAbsolute(requestedPath)) {
    throw new Error("Absolute paths and invalid path characters are not allowed.");
  }

  const resolved = path.resolve(PROJECT_ROOT, requestedPath);

  if (!isInsideProject(resolved)) {
    throw new Error("Access outside the project directory is not allowed.");
  }

  const relative = path.relative(PROJECT_ROOT, resolved);
  const segments = relative ? relative.split(path.sep) : [];
  let current = PROJECT_ROOT;

  for (let i = 0; i < segments.length; i++) {
    current = path.join(current, segments[i]!);

    if (!existsSync(current)) {
        const isFinalSegment = i === segments.length - 1;

        if (options.allowNewDirectories) {
          const parent = realpathSync(path.dirname(current));

          if (!isInsideProject(parent)) {
            throw new Error("Parent directory is outside the project.");
          }

          if (isFinalSegment && !options.allowNewFile) {
            throw new Error(`Path does not exist: ${requestedPath}`);
          }

          return resolved;
        }

        if (options.allowNewFile && isFinalSegment) {
          const parent = realpathSync(path.dirname(current));

          if (!isInsideProject(parent)) {
            throw new Error("Parent directory is outside the project.");
          }

          return current;
        }

        throw new Error(`Path does not exist: ${requestedPath}`);
    }

    if (lstatSync(current).isSymbolicLink()) {
      const real = realpathSync(current);

      if (!isInsideProject(real)) {
        throw new Error("Symbolic links outside the project are not allowed.");
      }

      current = real;
    }
  }

  const real = realpathSync(resolved);

  if (!isInsideProject(real)) {
    throw new Error("Access outside the project directory is not allowed.");
  }

  return real;
}
