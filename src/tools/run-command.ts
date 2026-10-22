
import { spawn } from "node:child_process";
import { parseCommand } from "./validate-command";

const MAX_OUTPUT_SIZE = 100 * 1024;
const TIMEOUT_MS = 10 * 1000;

export type ApprovalCallback = (command: string) => Promise<boolean>;

export async function runCommand(
  command: string,
  requestApproval: ApprovalCallback,
): Promise<{ output: string; code: number | null }> {
  const parts = parseCommand(command);

  if(!parts){
    return {
      output: `Command rejected by safety validation: ${command}`,
      code: null,
    };
  }

  let approved = false;

  try {
    approved = await requestApproval(command);
  } catch {
    return {
      output: "Command rejected: approval could not be obtained.",
      code: null,
    };
  }

  if (approved !== true) {
    return {
      output: "Command rejected: user denied approval.",
      code: null,
    };
  }

  const executable = parts[0]!;
  const args = parts.slice(1);

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      shell: false,
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
        return;
      }

      let chunk = data.subarray(0, remainingBytes);

      while (chunk.length > 0) {
        const decoded = chunk.toString("utf8");

        if (!decoded.includes("\uFFFD")) {
          output += decoded;
          break;
        }

        chunk = chunk.subarray(0, chunk.length - 1);
      }

      outputTruncated = true;
    };

    child.stdout.on("data", collectOutput);
    child.stderr.on("data", collectOutput);

    child.on("error", (error) => {
      if (finished) return;

      finished = true;
      clearTimeout(timer);

      resolve({
        output: timedOut
          ? `${output}\n[Command timed out after 10 seconds.]`
          : error.message,
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
