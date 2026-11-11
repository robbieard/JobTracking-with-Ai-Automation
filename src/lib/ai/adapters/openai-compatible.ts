import { AiRequestError, type AdapterOutput, extractProviderError } from "./shared";
import type { AiMessage, AiProviderId } from "../types";

type OpenAiCompatibleInput = {
  provider: AiProviderId;
  url: string;
  apiKey: string;
  model: string;
  messages: AiMessage[];
  temperature: number;
  maxOutputTokens: number;
  json: boolean;
  signal: AbortSignal;
  headers?: Record<string, string>;
  includeCost?: boolean;
};

type OpenAiContent = string | { type?: string; text?: string }[] | null;

type OpenAiCompatibleResponse = {
  model?: string;
  choices?: {
    message?: {
      content?: OpenAiContent;
    };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
  };
};

function readContent(content: OpenAiContent | undefined) {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? "").join("");
  }

  return "";
}

export async function callOpenAiCompatible(input: OpenAiCompatibleInput): Promise<AdapterOutput> {
  const response = await fetch(input.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
      ...input.headers,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.maxOutputTokens,
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
      ...(input.includeCost ? { usage: { include: true } } : {}),
    }),
    signal: input.signal,
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new AiRequestError(
      input.provider,
      extractProviderError(raw),
      response.status,
    );
  }

  let payload: OpenAiCompatibleResponse;

  try {
    payload = JSON.parse(raw) as OpenAiCompatibleResponse;
  } catch {
    throw new AiRequestError(input.provider, "Respons provider bukan JSON yang valid.");
  }

  const text = readContent(payload.choices?.[0]?.message?.content).trim();

  if (!text) {
    throw new AiRequestError(input.provider, "Provider mengembalikan jawaban kosong.");
  }

  return {
    text,
    model: payload.model ?? input.model,
    inputTokens: payload.usage?.prompt_tokens ?? 0,
    outputTokens: payload.usage?.completion_tokens ?? 0,
    costUsd: typeof payload.usage?.cost === "number" ? payload.usage.cost : null,
  };
}
