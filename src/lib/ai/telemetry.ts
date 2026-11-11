import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { AiCallResult, AiProviderId } from "./types";

export type AiTelemetryKind =
  | "job_match"
  | "application_draft"
  | "job_ingestion"
  | "email_alert"
  | "error"
  | "ai_ping";

export type AiTelemetryStatus = "started" | "succeeded" | "failed";

type LogAiEventInput = {
  userId: string | null;
  jobId?: string | null;
  kind: AiTelemetryKind;
  status: AiTelemetryStatus;
  provider?: AiProviderId;
  model?: string | null;
  result?: AiCallResult;
  latencyMs?: number | null;
  message?: string | null;
  metadata?: Record<string, Json | undefined>;
};

/**
 * Best-effort telemetry write. A logging failure must never break the AI call
 * that produced it, so errors are reported to the server log and swallowed.
 */
export async function logAiEvent(input: LogAiEventInput) {
  try {
    const metadata: Record<string, Json> = {};

    if (input.provider) metadata.provider = input.provider;

    for (const [key, value] of Object.entries(input.metadata ?? {})) {
      if (value !== undefined) metadata[key] = value;
    }

    const admin = createAdminClient();
    const { error } = await admin.from("ai_monitoring_events").insert({
      user_id: input.userId,
      job_id: input.jobId ?? null,
      kind: input.kind,
      status: input.status,
      model: input.result?.model ?? input.model ?? null,
      input_tokens: input.result?.usage.inputTokens ?? null,
      output_tokens: input.result?.usage.outputTokens ?? null,
      cost_usd: input.result?.costUsd ?? null,
      latency_ms: input.result?.latencyMs ?? input.latencyMs ?? null,
      message: input.message ?? null,
      metadata,
    });

    if (error) {
      console.error("[ai-telemetry] gagal menyimpan event:", error.message);
    }
  } catch (error) {
    console.error(
      "[ai-telemetry] gagal menyimpan event:",
      error instanceof Error ? error.message : error,
    );
  }
}
