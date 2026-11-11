import { AiRequestError, type AdapterOutput, extractProviderError } from "./shared";
import type { AiMessage } from "../types";

type GeminiInput = {
  apiKey: string;
  model: string;
  messages: AiMessage[];
  temperature: number;
  maxOutputTokens: number;
  json: boolean;
  signal: AbortSignal;
};

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

export async function callGemini(input: GeminiInput): Promise<AdapterOutput> {
  const systemPrompt = input.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  const contents = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        contents,
        generationConfig: {
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
          ...(input.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      signal: input.signal,
    },
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new AiRequestError("gemini", extractProviderError(raw), response.status);
  }

  let payload: GeminiResponse;

  try {
    payload = JSON.parse(raw) as GeminiResponse;
  } catch {
    throw new AiRequestError("gemini", "Respons Gemini bukan JSON yang valid.");
  }

  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new AiRequestError("gemini", "Gemini mengembalikan jawaban kosong.");
  }

  return {
    text,
    model: input.model,
    inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
