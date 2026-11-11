import type { AiProviderId } from "./providers";
import { AI_PROVIDER_IDS } from "./providers";

export type AiProviderCredentials = {
  apiKey: string;
  accountId?: string;
};

/**
 * Server-only. Never import this module from a client component: it reads
 * provider secrets from the environment.
 */
export function readAiProviderCredentials(provider: AiProviderId): AiProviderCredentials | null {
  switch (provider) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      return apiKey ? { apiKey } : null;
    }
    case "groq": {
      const apiKey = process.env.GROQ_API_KEY?.trim();
      return apiKey ? { apiKey } : null;
    }
    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY?.trim();
      return apiKey ? { apiKey } : null;
    }
    case "cloudflare": {
      const apiKey = process.env.CLOUDFLARE_API_TOKEN?.trim();
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
      return apiKey && accountId ? { apiKey, accountId } : null;
    }
  }
}

export function isAiProviderConfigured(provider: AiProviderId) {
  return readAiProviderCredentials(provider) !== null;
}

export function getConfiguredAiProviders(): Record<AiProviderId, boolean> {
  return AI_PROVIDER_IDS.reduce(
    (result, provider) => {
      result[provider] = isAiProviderConfigured(provider);
      return result;
    },
    {} as Record<AiProviderId, boolean>,
  );
}
