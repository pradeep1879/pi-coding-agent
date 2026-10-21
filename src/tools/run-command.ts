
import { spawn } from "node:child_process";

const MAX_OUTPUT_SIZE = 100 * 1024; // 100 KB
const TIMEOUT_MS = 10 * 1000;

export function runCommand(command: string) {
  return new Promise<{ output: string; code: number | null }>((resolve) => {
    const child = spawn(command, {
      shell: true,
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let finished = false;
    let timedOut = false;
    let outputTruncated = false;

    const timer = setTimeout(() => {
      if (finished) return;

      timedOut = true;
      child.kill("SIGTERM");
    }, TIMEOUT_MS);

    const collectOutput = (data: Buffer) => {
      const remainingBytes =
        MAX_OUTPUT_SIZE - Buffer.byteLength(output, "utf8");

      if (remainingBytes <= 0) {
        outputTruncated = true;
        return;
      }

      if (data.length <= remainingBytes) {
        output += data.toString("utf8");
      } else {
        // Keep only the bytes that fit.
        let chunk = data.subarray(0, remainingBytes);

        // Avoid decoding an incomplete UTF-8 character.
        while (chunk.length > 0) {
          const decoded = chunk.toString("utf8");

          if (!decoded.includes("\uFFFD")) {
            output += decoded;
            break;
          }

          chunk = chunk.subarray(0, chunk.length - 1);
        }

        outputTruncated = true;
      }
    };

    child.stdout.on("data", collectOutput);
    child.stderr.on("data", collectOutput);

    child.on("error", (error) => {
      if (finished) return;

      finished = true;
      clearTimeout(timer);

      resolve({
        output: error.message,
        code: null,
      });
    });

    child.on("close", (code) => {
      if (finished) return;

      finished = true;
      clearTimeout(timer);

      let finalOutput = output;

      if (outputTruncated) {
        finalOutput += "\n[Output truncated: maximum size is 100 KB.]";
      }

      if (timedOut) {
        finalOutput += "\n[Command timed out after 10 seconds.]";
      }

      resolve({
        output: finalOutput,
        code: timedOut ? null : code,
      });
    });
  });
}
