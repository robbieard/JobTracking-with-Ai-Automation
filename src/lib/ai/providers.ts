export type AiProviderId = "gemini" | "groq" | "openrouter" | "cloudflare";

export type AiModelPricing = {
  /** USD per one million input tokens. */
  inputPerMTok: number;
  /** USD per one million output tokens. */
  outputPerMTok: number;
};

export type AiModelDefinition = {
  id: string;
  label: string;
  /** `null` means the provider returns the real cost or it cannot be estimated reliably. */
  pricing: AiModelPricing | null;
};

export type AiProviderDefinition = {
  id: AiProviderId;
  name: string;
  role: string;
  color: string;
  /** Environment variables that must all be present for this provider to work. */
  envKeys: string[];
  defaultModel: string;
  models: AiModelDefinition[];
};

export const AI_PROVIDERS: AiProviderDefinition[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    role: "Penalaran & pencocokan lowongan",
    color: "#8E75B2",
    envKeys: ["GEMINI_API_KEY"],
    defaultModel: "gemini-2.5-flash",
    models: [
      {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        pricing: { inputPerMTok: 0.3, outputPerMTok: 2.5 },
      },
      {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        pricing: { inputPerMTok: 1.25, outputPerMTok: 10 },
      },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    role: "Screening cepat & ringkasan",
    color: "#F43E01",
    envKeys: ["GROQ_API_KEY"],
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B",
        pricing: { inputPerMTok: 0.59, outputPerMTok: 0.79 },
      },
      {
        id: "llama-3.1-8b-instant",
        label: "Llama 3.1 8B Instant",
        pricing: { inputPerMTok: 0.05, outputPerMTok: 0.08 },
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    role: "Fallback & routing model",
    color: "#64748B",
    envKeys: ["OPENROUTER_API_KEY"],
    defaultModel: "openrouter/auto",
    models: [
      {
        id: "openrouter/auto",
        label: "Auto router",
        pricing: null,
      },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    role: "Klasifikasi di edge",
    color: "#F38020",
    envKeys: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"],
    defaultModel: "@cf/meta/llama-3.1-8b-instruct",
    models: [
      {
        id: "@cf/meta/llama-3.1-8b-instruct",
        label: "Workers AI · Llama 3.1 8B",
        pricing: null,
      },
    ],
  },
];

export const AI_PROVIDER_IDS = AI_PROVIDERS.map((provider) => provider.id);

const providerMap = new Map<AiProviderId, AiProviderDefinition>(
  AI_PROVIDERS.map((provider) => [provider.id, provider]),
);

export function isAiProviderId(value: unknown): value is AiProviderId {
  return typeof value === "string" && providerMap.has(value as AiProviderId);
}

export function getAiProvider(provider: AiProviderId): AiProviderDefinition {
  const definition = providerMap.get(provider);

  if (!definition) {
    throw new Error(`Provider AI tidak dikenal: ${provider}`);
  }

  return definition;
}

export function getAiModel(provider: AiProviderId, model?: string | null): AiModelDefinition {
  const definition = getAiProvider(provider);

  return (
    definition.models.find((item) => item.id === model) ?? {
      id: model ?? definition.defaultModel,
      label: model ?? definition.defaultModel,
      pricing: null,
    }
  );
}
