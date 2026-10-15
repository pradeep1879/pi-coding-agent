#!/usr/bin/env bun  

import { Command } from "commander";
const program = new Command();

program.name("my-pi").description("A Typescript Coding Agent").version("0.1.0");

program
  .command("providers")
  .description("All providers")
  .argument("[action]", "list, login, logout or set")
  .action((action?:string) =>{
    if(!action || action == "list"){
      console.log("Available providers");
      console.log("Gemini is not configured");
      return;
    }
    console.log(`Providers action "${action}" is not implemented yet`);
  });

program
  .command("models")
  .description("List of available models")
  .action((action) => {
    console.log("Modle management is not implemented yet")
  })


program
  .command("agent")
  .description("Run the agent")
  .option("-p, --prompt <prompt>", "Prompt for the agent")
  .action((options: { prompt: string }) =>{
    if (!options.prompt) {
      console.log('Usage: my-pi agent -p "Your task"');
      return;
    }

    console.log(`Agent task: ${options.prompt}`);
    console.log("Agent execution is not implemented yet.");
  })

await program.parseAsync(process.argv);