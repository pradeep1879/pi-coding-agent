import { spawn } from "node:child_process";

export function runCommand(command: string){
  return new Promise<{ output: string, code: number | null }>((resolve) =>{
    const child = spawn(command, {
      shell: true,
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = ""

    child.stdout.on("data", (data) =>{
      output += data.toString();
    })

    child.stderr.on("data", (data) =>{
      output += data.toString();
    });

    child.on("close", (code) =>{
      resolve({ output, code });
    })

    child.on("error", (error) =>{
      resolve({
        output: error.message,
        code: null
      })
    });

  })
}