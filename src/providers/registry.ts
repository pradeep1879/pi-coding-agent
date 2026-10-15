import type { ProviderDefiniation, ProviderId } from "./types";

export const providers: ProviderDefiniation[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    envKey: "Gemini_key"
  },
  {
    id: "openai",
    name: "OpenAI",
    envKey: "openai_key"
  },
  {
    id: "anthropic",
    name: "Antropic",
    envKey: "anthropic_key"
  }
]

export function getProvider(id: string) {
  return providers.find((providers) => providers.id === id);
};

export function isProviderId(id: string): id is ProviderId {
  return providers.some((provider) => provider.id === id);
}
