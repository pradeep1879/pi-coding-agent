export type ProviderId = "gemini" | "openai" | "anthropic";

export interface ProviderDefiniation {
  id: ProviderId;
  name: string;
  envKey: string;
}