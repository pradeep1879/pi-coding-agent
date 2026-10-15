import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export async function promptSecret(
  message: string,
): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("API-key login requires an interactive terminal");
  }

  stdout.write(message);

  const chunks: Buffer[] = [];

  stdin.setRawMode(true);
  stdin.resume();

  try {
    while (true) {
      const chunk = Buffer.alloc(1);
      const count = await new Promise<number>((resolve, reject) => {
        stdin.once("data", (data: Buffer) => {
          data.copy(chunk, 0, 0, 1);
          resolve(1);
        });
        stdin.once("error", reject);
      });

      if (!count) continue;

      const char = chunk.toString();

      if (char === "\u0003") {
        throw new Error("Login cancelled");
      }

      if (char === "\r" || char === "\n") {
        break;
      }

      if (char === "\u007f" || char === "\b") {
        chunks.pop();
        continue;
      }

      if (char >= " ") {
        chunks.push(Buffer.from(char));
      }
    }
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
    stdout.write("\n");
  }

  return Buffer.concat(chunks).toString("utf8");
}