import type { AiMessage, AiProviderId } from "../types";

export type AdapterOutput = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number | null;
};

export class AiRequestError extends Error {
  provider: AiProviderId;
  status?: number;

  constructor(provider: AiProviderId, message: string, status?: number) {
    super(message);
    this.name = "AiRequestError";
    this.provider = provider;
    this.status = status;
  }
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function extractProviderError(raw: string) {
  const trimmed = raw.trim();

  if (!trimmed) return "Provider tidak mengembalikan respons.";

  try {
    const payload = JSON.parse(trimmed) as {
      error?: { message?: string } | string;
      message?: string;
      errors?: { message?: string }[];
    };

    if (typeof payload.error === "string") return payload.error;
    if (payload.error?.message) return payload.error.message;
    if (payload.errors?.[0]?.message) return payload.errors[0].message;
    if (payload.message) return payload.message;
  } catch {
    // Fall through to the raw body.
  }

  return trimmed.slice(0, 300);
}

export function normalizeMessages(messages: AiMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}
