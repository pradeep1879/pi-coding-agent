import {
  chmod,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { ProviderId } from "../providers/types.js";

const configDir = path.join(os.homedir(), ".my-pi");
const configPath = path.join(configDir, "config.json");
const authPath = path.join(configDir, "auth.json");

export interface AppConfig {
  defaultProvider: ProviderId;
}

type AuthStore = Partial<Record<ProviderId, string>>;

async function ensureConfigDir() {
  await mkdir(configDir, {
    recursive: true,
    mode: 0o700,
  });

  await chmod(configDir, 0o700);
}

async function writePrivateFile(
  filePath: string,
  content: string,
) {
  await writeFile(filePath, content, {
    mode: 0o600,
  });

  await chmod(filePath, 0o600);
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const content = await readFile(configPath, "utf8");
    const parsed: unknown = JSON.parse(content);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "defaultProvider" in parsed &&
      typeof parsed.defaultProvider === "string" &&
      ["gemini", "openai", "anthropic"].includes(
        parsed.defaultProvider,
      )
    ) {
      return parsed as AppConfig;
    }

    throw new Error("Invalid configuration in ~/.my-pi/config.json");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { defaultProvider: "gemini" };
    }

    throw error;
  }
}

export async function saveConfig(config: AppConfig) {
  await ensureConfigDir();

  await writePrivateFile(
    configPath,
    JSON.stringify(config, null, 2),
  );
}

async function loadAuth(): Promise<AuthStore> {
  try {
    const content = await readFile(authPath, "utf8");
    const parsed: unknown = JSON.parse(content);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Invalid provider credentials file");
    }

    return parsed as AuthStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function getApiKey(
  provider: ProviderId,
): Promise<string | undefined> {
  const auth = await loadAuth();
  return auth[provider];
}

export async function saveApiKey(
  provider: ProviderId,
  apiKey: string,
) {
  if (!apiKey.trim()) {
    throw new Error("API key cannot be empty");
  }

  await ensureConfigDir();

  const auth = await loadAuth();
  auth[provider] = apiKey.trim();

  await writePrivateFile(
    authPath,
    JSON.stringify(auth, null, 2),
  );
}

export async function removeApiKey(provider: ProviderId) {
  await ensureConfigDir();

  const auth = await loadAuth();
  delete auth[provider];

  await writePrivateFile(
    authPath,
    JSON.stringify(auth, null, 2),
  );
}