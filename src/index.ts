#!/usr/bin/env bun

import { Command } from "commander";
import {
  isProviderId,
  providers,
} from "./providers/registry.js";
import {
  loadConfig,
  getApiKey,
  saveApiKey
} from "./config/store.js";
import { password } from "@inquirer/prompts";


const program = new Command();

program
  .name("my-pi")
  .description("A TypeScript Coding Agent")
  .version("0.1.0");

// Providers command
const providerCommand = program
  .command("providers")
  .description("Manage AI providers");

providerCommand
  .command("list")
  .description("List available providers")
  .action(async () => {
    try {
      const config = await loadConfig();

      console.log("Available providers:\n");

      for (const provider of providers) {
        const apiKey = await getApiKey(provider.id);
        const status = apiKey ? "Configured" : "Not configured";

        const isDefault = config.defaultProvider === provider.id ? " (default)" : "";

        console.log(
          `${provider.name}: ${status}${isDefault}`,
        );
      }
    } catch (error) {
      console.error(
        "Failed to list providers:",
        error instanceof Error ? error.message : error,
      );
      process.exitCode = 1;
    }
  });

providerCommand
  .command("login")
  .description("Configure a provider API key")
  .requiredOption("--provider <provider>", "Provider ID")
  .action(async (options: { provider: string }) => {
    try {
      if (!isProviderId(options.provider)) {
        throw new Error(
          `Unsupported provider: ${options.provider}`,
        );
      }

      const provider = providers.find(
        (item) => item.id === options.provider,
      );

      if (!provider) {
        throw new Error("Provider not found");
      }

      const apiKey = await password({
        message: `Enter your ${provider.name} API key:`,
        mask: "*",
      });

      await saveApiKey(provider.id, apiKey);

      console.log(`${provider.name} API key saved successfully.`);
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : error,
      );
      process.exitCode = 1;
    }
  });
// Models command
program
  .command("models")
  .description("List available models")
  .action(() => {
    console.log("Model management is not implemented yet.");
  });

// Agent command
program
  .command("agent")
  .description("Run the agent")
  .option("-p, --prompt <prompt>", "Prompt for the agent")
  .action((options: { prompt?: string }) => {
    if (!options.prompt) {
      console.log('Usage: my-pi agent -p "Your task"');
      return;
    }

    console.log(`Agent task: ${options.prompt}`);
    console.log("Agent execution is not implemented yet.");
  });

await program.parseAsync(process.argv);
