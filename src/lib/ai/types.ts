import type { AiProviderId } from "./providers";

export type { AiProviderId } from "./providers";

export type AiMessageRole = "system" | "user" | "assistant";

export type AiMessage = {
  role: AiMessageRole;
  content: string;
};

export type AiGenerateRequest = {
  provider: AiProviderId;
  model?: string;
  messages: AiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  json?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type AiCallResult = {
  text: string;
  provider: AiProviderId;
  model: string;
  usage: AiUsage;
  costUsd: number | null;
  latencyMs: number;
};

export type AiRoute = {
  provider: AiProviderId;
  model?: string;
};

export type AiFallbackAttempt = {
  provider: AiProviderId;
  model: string;
  error: string;
};
