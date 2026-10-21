import { spawn } from "node:child_process";

export function runCommand(command: string){
  return new Promise<{ output: string, code: number | null }>((resolve) =>{
    
    const child = spawn(command, {
      shell: true,
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = ""
    let finished = false;
    let timeout = false;

    const timer = setTimeout(() =>{
      if(finished) return;

      timeout = true;
      child.kill("SIGTERM")
    }, 10 * 1000);

    child.stdout.on("data", (data) =>{
      output += data.toString();
    })

    child.stderr.on("data", (data) =>{
      output += data.toString();
    });


    child.on("error", (error) =>{
      if(finished) return;
      finished = true;
      clearTimeout(timer)

      resolve({
        output: timeout ? `${output}\nCommand timed out after 10 seconds.` : error.message,
        code: null
      })
    });

    child.on("close", (code) =>{
      if(finished) return;
      finished = true;
      clearTimeout(timer);

      resolve({ 
        output: timeout ? `${output}\nCommand timed out after 10 seconds.` : output, 
        code 
      });
    })

  })
}