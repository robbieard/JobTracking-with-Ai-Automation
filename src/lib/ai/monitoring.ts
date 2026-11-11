import type { Enums, Tables } from "@/lib/supabase/database.types";
import { AI_PROVIDER_IDS, isAiProviderId, type AiProviderId } from "./providers";

export type AiMonitoringEvent = Tables<"ai_monitoring_events">;
export type AiEventStatus = Enums<"ai_event_status">;
export type AiEventKind = Enums<"ai_event_kind">;

export const MONITORING_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export type ProviderStats = {
  provider: AiProviderId;
  requests: number;
  succeeded: number;
  failed: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  tokens: number;
  costUsd: number;
  lastModel: string | null;
  lastStatus: AiEventStatus | null;
  lastEventAt: string | null;
  daily: number[];
};

export type DailyPoint = {
  date: string;
  label: string;
  total: number;
  counts: Record<AiProviderId, number>;
};

export type RecentAiEvent = {
  id: string;
  createdAt: string;
  time: string;
  kind: AiEventKind;
  status: AiEventStatus;
  provider: AiProviderId | null;
  model: string | null;
  message: string | null;
  latencyMs: number | null;
  tokens: number | null;
};

export type AiMonitoringData = {
  windowDays: number;
  totalRequests: number;
  successRate: number | null;
  failedRequests: number;
  avgLatencyMs: number | null;
  totalTokens: number;
  totalCostUsd: number;
  providers: Record<AiProviderId, ProviderStats>;
  daily: DailyPoint[];
  recent: RecentAiEvent[];
  lastEventAt: string | null;
  lastEventTime: string | null;
};

function resolveProvider(row: AiMonitoringEvent): AiProviderId | null {
  const metadata = row.metadata;

  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const provider = (metadata as Record<string, unknown>).provider;

    if (isAiProviderId(provider)) return provider;
  }

  const model = (row.model ?? "").toLowerCase();

  if (model.includes("gemini")) return "gemini";
  if (model.includes("@cf/") || model.includes("cloudflare") || model.includes("workers ai")) {
    return "cloudflare";
  }
  if (model.includes("/")) return "openrouter";
  if (model.includes("llama") || model.includes("groq")) return "groq";

  return null;
}

function emptyProviderStats(provider: AiProviderId): ProviderStats {
  return {
    provider,
    requests: 0,
    succeeded: 0,
    failed: 0,
    successRate: null,
    avgLatencyMs: null,
    tokens: 0,
    costUsd: 0,
    lastModel: null,
    lastStatus: null,
    lastEventAt: null,
    daily: Array.from({ length: MONITORING_WINDOW_DAYS }, () => 0),
  };
}

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function labelForDate(key: string) {
  const [, month, day] = key.split("-");

  return `${day} ${MONTHS[Number(month) - 1] ?? month}`;
}

function timeInJakarta(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatLatency(ms: number | null) {
  if (ms === null || Number.isNaN(ms)) return "—";
  if (ms < 1_000) return `${Math.round(ms)}ms`;

  return `${(ms / 1_000).toFixed(1)}s`;
}

export function monitoringSince(days = MONITORING_WINDOW_DAYS) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

export function buildAiMonitoringData(rows: AiMonitoringEvent[]): AiMonitoringData {
  const sorted = [...rows].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );

  const today = new Date();
  const dayKeys = Array.from({ length: MONITORING_WINDOW_DAYS }, (_, index) => {
    const offset = MONITORING_WINDOW_DAYS - 1 - index;
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - offset * DAY_MS,
    );

    return date.toISOString().slice(0, 10);
  });
  const dayIndex = new Map(dayKeys.map((key, index) => [key, index]));

  const providers = AI_PROVIDER_IDS.reduce(
    (result, provider) => {
      result[provider] = emptyProviderStats(provider);
      return result;
    },
    {} as Record<AiProviderId, ProviderStats>,
  );

  const daily: DailyPoint[] = dayKeys.map((key) => ({
    date: key,
    label: labelForDate(key),
    total: 0,
    counts: AI_PROVIDER_IDS.reduce(
      (counts, provider) => {
        counts[provider] = 0;
        return counts;
      },
      {} as Record<AiProviderId, number>,
    ),
  }));

  const latencySamples: number[] = [];
  let succeeded = 0;
  let failed = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;

  for (const row of sorted) {
    const provider = resolveProvider(row);
    const key = dateKey(row.created_at);
    const index = dayIndex.get(key);

    if (index !== undefined) {
      daily[index].total += 1;
      if (provider) daily[index].counts[provider] += 1;
    }

    if (row.status === "succeeded") succeeded += 1;
    if (row.status === "failed") failed += 1;

    const tokens = (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
    totalTokens += tokens;
    totalCostUsd += Number(row.cost_usd ?? 0);

    if (typeof row.latency_ms === "number") latencySamples.push(row.latency_ms);

    if (!provider) continue;

    const stats = providers[provider];
    stats.requests += 1;
    if (row.status === "succeeded") stats.succeeded += 1;
    if (row.status === "failed") stats.failed += 1;
    stats.tokens += tokens;
    stats.costUsd += Number(row.cost_usd ?? 0);

    if (index !== undefined) stats.daily[index] += 1;
    if (!stats.lastEventAt) {
      stats.lastEventAt = row.created_at;
      stats.lastStatus = row.status;
      stats.lastModel = row.model;
    }
  }

  for (const provider of AI_PROVIDER_IDS) {
    const stats = providers[provider];
    const completed = stats.succeeded + stats.failed;
    const providerLatency: number[] = [];

    for (const row of sorted) {
      if (resolveProvider(row) !== provider || typeof row.latency_ms !== "number") continue;
      providerLatency.push(row.latency_ms);
    }

    stats.successRate = completed > 0 ? (stats.succeeded / completed) * 100 : null;
    stats.avgLatencyMs =
      providerLatency.length > 0
        ? providerLatency.reduce((sum, value) => sum + value, 0) / providerLatency.length
        : null;
  }

  const completed = succeeded + failed;
  const recent: RecentAiEvent[] = sorted.slice(0, 12).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    time: timeInJakarta(row.created_at),
    kind: row.kind,
    status: row.status,
    provider: resolveProvider(row),
    model: row.model,
    message: row.message,
    latencyMs: row.latency_ms,
    tokens:
      row.input_tokens === null && row.output_tokens === null
        ? null
        : (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
  }));

  return {
    windowDays: MONITORING_WINDOW_DAYS,
    totalRequests: sorted.length,
    successRate: completed > 0 ? (succeeded / completed) * 100 : null,
    failedRequests: failed,
    avgLatencyMs:
      latencySamples.length > 0
        ? latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length
        : null,
    totalTokens,
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
    providers,
    daily,
    recent,
    lastEventAt: sorted[0]?.created_at ?? null,
    lastEventTime: sorted[0] ? timeInJakarta(sorted[0].created_at) : null,
  };
}
