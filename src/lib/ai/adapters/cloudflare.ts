import { AiRequestError, type AdapterOutput, estimateTokens, extractProviderError } from "./shared";
import type { AiMessage } from "../types";

type CloudflareInput = {
  apiKey: string;
  accountId: string;
  model: string;
  messages: AiMessage[];
  temperature: number;
  maxOutputTokens: number;
  signal: AbortSignal;
};

type CloudflareResponse = {
  success?: boolean;
  result?: {
    response?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
    };
  };
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  errors?: { message?: string }[];
};

export async function callCloudflare(input: CloudflareInput): Promise<AdapterOutput> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${input.accountId}/ai/run/${input.model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.maxOutputTokens,
      }),
      signal: input.signal,
    },
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new AiRequestError("cloudflare", extractProviderError(raw), response.status);
  }

  let payload: CloudflareResponse;

  try {
    payload = JSON.parse(raw) as CloudflareResponse;
  } catch {
    throw new AiRequestError("cloudflare", "Respons Cloudflare bukan JSON yang valid.");
  }

  if (payload.success === false) {
    const message = payload.errors?.[0]?.message ?? "Cloudflare menolak request.";
    throw new AiRequestError("cloudflare", message);
  }

  const text = payload.result?.response?.trim();

  if (!text) {
    throw new AiRequestError("cloudflare", "Cloudflare mengembalikan jawaban kosong.");
  }

  const usage = payload.result?.usage ?? payload.usage;
  const prompt = input.messages.map((message) => message.content).join("\n");

  return {
    text,
    model: input.model,
    inputTokens: usage?.prompt_tokens ?? estimateTokens(prompt),
    outputTokens: usage?.completion_tokens ?? estimateTokens(text),
  };
}
