import { callCloudflare } from "./adapters/cloudflare";
import { callGemini } from "./adapters/gemini";
import { callOpenAiCompatible } from "./adapters/openai-compatible";
import { AiRequestError, type AdapterOutput } from "./adapters/shared";
import { readAiProviderCredentials } from "./credentials";
import { getAiModel, getAiProvider, type AiProviderId } from "./providers";
import type {
  AiCallResult,
  AiFallbackAttempt,
  AiGenerateRequest,
  AiMessage,
  AiRoute,
} from "./types";

export class AiConfigurationError extends Error {
  provider: AiProviderId;

  constructor(provider: AiProviderId) {
    super(`Provider ${getAiProvider(provider).name} belum dikonfigurasi.`);
    this.name = "AiConfigurationError";
    this.provider = provider;
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

function createSignal(request: AiGenerateRequest) {
  const timeout = AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  if (!request.signal) return timeout;

  return AbortSignal.any([request.signal, timeout]);
}

function computeCost(
  provider: AiProviderId,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const pricing = getAiModel(provider, model).pricing;

  if (!pricing) return null;

  const cost =
    (inputTokens / 1_000_000) * pricing.inputPerMTok +
    (outputTokens / 1_000_000) * pricing.outputPerMTok;

  return Math.round(cost * 1_000_000) / 1_000_000;
}

async function callProvider(
  provider: AiProviderId,
  model: string,
  messages: AiMessage[],
  request: AiGenerateRequest,
  signal: AbortSignal,
): Promise<AdapterOutput> {
  const credentials = readAiProviderCredentials(provider);

  if (!credentials) {
    throw new AiConfigurationError(provider);
  }

  const options = {
    model,
    messages,
    temperature: request.temperature ?? 0.4,
    maxOutputTokens: request.maxOutputTokens ?? 1_024,
    json: request.json ?? false,
    signal,
  };

  switch (provider) {
    case "gemini":
      return callGemini({ ...options, apiKey: credentials.apiKey });
    case "groq":
      return callOpenAiCompatible({
        ...options,
        provider,
        apiKey: credentials.apiKey,
        url: "https://api.groq.com/openai/v1/chat/completions",
      });
    case "openrouter":
      return callOpenAiCompatible({
        ...options,
        provider,
        apiKey: credentials.apiKey,
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "JobTracking",
        },
        includeCost: true,
      });
    case "cloudflare":
      return callCloudflare({
        ...options,
        apiKey: credentials.apiKey,
        accountId: credentials.accountId ?? "",
      });
  }
}

export async function generateAi(request: AiGenerateRequest): Promise<AiCallResult> {
  const provider = getAiProvider(request.provider);
  const model = request.model ?? provider.defaultModel;
  const startedAt = Date.now();
  let output: AdapterOutput;

  try {
    output = await callProvider(request.provider, model, request.messages, request, createSignal(request));
  } catch (error) {
    if (error instanceof AiRequestError || error instanceof AiConfigurationError) {
      throw error;
    }

    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new AiRequestError(request.provider, "Request ke provider timeout.");
    }

    throw new AiRequestError(
      request.provider,
      error instanceof Error ? error.message : "Request ke provider gagal.",
    );
  }

  const latencyMs = Date.now() - startedAt;
  const costUsd =
    typeof output.costUsd === "number"
      ? output.costUsd
      : computeCost(request.provider, output.model, output.inputTokens, output.outputTokens);

  return {
    text: output.text,
    provider: request.provider,
    model: output.model,
    usage: {
      inputTokens: output.inputTokens,
      outputTokens: output.outputTokens,
    },
    costUsd,
    latencyMs,
  };
}

export async function generateAiWithFallback(
  routes: AiRoute[],
  request: Omit<AiGenerateRequest, "provider" | "model">,
): Promise<{ result: AiCallResult; attempts: AiFallbackAttempt[] }> {
  const attempts: AiFallbackAttempt[] = [];

  for (const route of routes) {
    const provider = getAiProvider(route.provider);
    const model = route.model ?? provider.defaultModel;

    try {
      const result = await generateAi({ ...request, provider: route.provider, model });

      return { result, attempts };
    } catch (error) {
      attempts.push({
        provider: route.provider,
        model,
        error: error instanceof Error ? error.message : "Request gagal.",
      });
    }
  }

  const summary = attempts.map((attempt) => `${getAiProvider(attempt.provider).name}: ${attempt.error}`).join(" · ");

  throw new Error(summary || "Tidak ada provider AI yang tersedia.");
}
