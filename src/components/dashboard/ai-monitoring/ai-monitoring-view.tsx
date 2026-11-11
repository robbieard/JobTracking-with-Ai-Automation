"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  CircleDollarSign,
  Cpu,
  FileSearch,
  LoaderCircle,
  Mail,
  PenLine,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppPreferences } from "@/components/app-preferences";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  LatencyBars,
  RequestVolumeChart,
  UsageDonut,
  type ChartSeries,
} from "@/components/dashboard/ai-monitoring/charts";
import { ProviderLogo } from "@/components/dashboard/ai-monitoring/provider-logo";
import {
  formatLatency,
  type AiEventKind,
  type AiEventStatus,
  type AiMonitoringData,
} from "@/lib/ai/monitoring";
import { AI_PROVIDERS, type AiProviderId } from "@/lib/ai/providers";

type AiMonitoringViewProps = {
  data: AiMonitoringData;
  configured: Record<AiProviderId, boolean>;
};

type Agent = {
  name: string;
  description: string;
  provider: AiProviderId;
  icon: LucideIcon;
};

const AGENTS: Agent[] = [
  {
    name: "Job Matcher",
    description: "Mencocokkan lowongan dengan profil",
    provider: "gemini",
    icon: Sparkles,
  },
  {
    name: "Resume Screener",
    description: "Menyaring CV dan ringkasan kandidat",
    provider: "groq",
    icon: FileSearch,
  },
  {
    name: "Application Writer",
    description: "Menyusun draft lamaran",
    provider: "openrouter",
    icon: PenLine,
  },
  {
    name: "Inbox Classifier",
    description: "Mengklasifikasi email masuk",
    provider: "cloudflare",
    icon: Mail,
  },
  {
    name: "Fallback Router",
    description: "Routing ke model cadangan",
    provider: "openrouter",
    icon: Route,
  },
];

const EVENT_LABELS: Record<AiEventKind, string> = {
  job_match: "Job matching",
  application_draft: "Application draft",
  job_ingestion: "Job ingestion",
  email_alert: "Email alert",
  error: "Error",
  ai_ping: "Health check",
};

const providerMap = new Map(AI_PROVIDERS.map((provider) => [provider.id, provider] as const));

function formatCount(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;

  return String(value);
}

function formatCost(value: number) {
  return `$${value.toFixed(2)}`;
}

function statusMeta(status: AiEventStatus) {
  if (status === "succeeded") return { className: "success", label: "Berhasil" };
  if (status === "failed") return { className: "failed", label: "Gagal" };

  return { className: "running", label: "Berjalan" };
}

function AiEmpty({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="ai-empty">
      <Icon size={20} />
      <strong>{title}</strong>
      <span>{hint}</span>
    </div>
  );
}

export default function AiMonitoringView({ data, configured }: AiMonitoringViewProps) {
  const { t } = useAppPreferences();
  const { showToast } = useDashboard();
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const chartSeries: ChartSeries[] = AI_PROVIDERS.map((provider) => ({
    key: provider.id,
    label: provider.name,
    color: provider.color,
    values: data.providers[provider.id].daily,
  }));

  const donutItems = AI_PROVIDERS.map((provider) => {
    const requests = data.providers[provider.id].requests;

    return {
      key: provider.id,
      name: provider.name,
      requests,
      share: data.totalRequests > 0 ? Math.round((requests / data.totalRequests) * 1000) / 10 : 0,
      color: provider.color,
    };
  });

  const latencyItems = AI_PROVIDERS.flatMap((provider) => {
    const stats = data.providers[provider.id];

    if (stats.avgLatencyMs === null) return [];

    return [
      {
        key: provider.id,
        name: provider.name,
        latency: formatLatency(stats.avgLatencyMs),
        latencyValue: stats.avgLatencyMs,
        color: provider.color,
      },
    ];
  });

  const configuredCount = AI_PROVIDERS.filter((provider) => configured[provider.id]).length;
  const hasTelemetry = data.totalRequests > 0;

  async function testConnections() {
    setTesting(true);

    try {
      const response = await fetch("/api/ai/health", { method: "POST" });
      const payload = (await response.json()) as {
        results?: { ok: boolean; configured: boolean }[];
        error?: string;
      };

      if (!response.ok) {
        showToast(payload.error ?? t("Gagal menjalankan test koneksi."));
        return;
      }

      const results = payload.results ?? [];
      const configuredResults = results.filter((result) => result.configured);

      if (configuredResults.length === 0) {
        showToast(t("Belum ada provider yang dikonfigurasi."));
        return;
      }

      if (configuredResults.every((result) => result.ok)) {
        showToast(t("Semua provider terhubung."));
      } else {
        showToast(t("Sebagian provider gagal."));
      }

      router.refresh();
    } catch {
      showToast(t("Gagal menjalankan test koneksi."));
    } finally {
      setTesting(false);
    }
  }

  function refresh() {
    startRefresh(() => router.refresh());
  }

  return (
    <>
      <section className="welcome-row ai-welcome">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />{t("AI MONITORING")}</p>
          <h1>{t("AI Control Center")}</h1>
          <p className="welcome-subtitle">
            {t("Pantau model, agent, dan performa AI yang bekerja untuk pencarian kerjamu.")}
          </p>
        </div>
        <div className="ai-header-actions">
          <span className="ai-live-badge"><i />{t("Live")}</span>
          <button className="ai-test" disabled={testing} onClick={testConnections} type="button">
            {testing ? <LoaderCircle className="ai-spin" size={13} /> : <Zap size={13} />}
            {testing ? t("Menguji...") : t("Test koneksi")}
          </button>
          <button className="ai-refresh" disabled={refreshing} onClick={refresh} type="button">
            <RefreshCw className={refreshing ? "ai-spin" : undefined} size={13} />
            {t("Refresh")}
          </button>
        </div>
      </section>

      <section className="ai-stats-grid" aria-label={t("Ringkasan performa AI")}>
        <article className="stat-card ai-stat-card">
          <div className="stat-top">
            <span>{t("Total request")}</span>
            <span className="stat-icon blue-icon"><Cpu size={17} /></span>
          </div>
          <div className="stat-value">{formatCount(data.totalRequests)}</div>
          <div className="ai-stat-foot">
            <span className="ai-stat-trend"><TrendingUp size={11} />{configuredCount}/{AI_PROVIDERS.length}</span>
            {t("provider aktif")}
          </div>
        </article>

        <article className="stat-card ai-stat-card">
          <div className="stat-top">
            <span>{t("Success rate")}</span>
            <span className="stat-icon green-icon"><ShieldCheck size={17} /></span>
          </div>
          <div className="stat-value">
            {data.successRate === null ? (
              "—"
            ) : (
              <>
                {data.successRate.toFixed(1)}
                <span className="stat-percent">%</span>
              </>
            )}
          </div>
          <div className="ai-stat-foot">{data.failedRequests} {t("request gagal")}</div>
        </article>

        <article className="stat-card ai-stat-card">
          <div className="stat-top">
            <span>{t("Rata-rata latensi")}</span>
            <span className="stat-icon coral-icon"><Timer size={17} /></span>
          </div>
          <div className="stat-value">{formatLatency(data.avgLatencyMs)}</div>
          <div className="ai-stat-foot">{formatTokens(data.totalTokens)} {t("token")}</div>
        </article>

        <article className="stat-card ai-stat-card">
          <div className="stat-top">
            <span>{t("Estimasi biaya")}</span>
            <span className="stat-icon blue-icon"><CircleDollarSign size={17} /></span>
          </div>
          <div className="stat-value">{formatCost(data.totalCostUsd)}</div>
          <div className="ai-stat-foot">{t("Estimasi dari harga model")}</div>
        </article>
      </section>

      <section className="ai-section">
        <div className="section-heading">
          <div>
            <div className="section-title-line">
              <h2>{t("Model & provider")}</h2>
              <span className="new-count">{configuredCount}/{AI_PROVIDERS.length} {t("terkonfigurasi")}</span>
            </div>
            <p>{t("Model yang saat ini terhubung ke sistem.")}</p>
          </div>
          <span className="ai-updated">
            {data.lastEventTime ? `${t("Terakhir")} ${data.lastEventTime}` : t("Belum ada telemetry")}
          </span>
        </div>

        <div className="ai-providers-grid">
          {AI_PROVIDERS.map((provider) => {
            const stats = data.providers[provider.id];
            const isConfigured = configured[provider.id];
            const status = !isConfigured
              ? "unconfigured"
              : stats.lastStatus === "failed"
                ? "degraded"
                : stats.requests > 0
                  ? "operational"
                  : "ready";
            const statusLabel = !isConfigured
              ? t("Belum dikonfigurasi")
              : stats.lastStatus === "failed"
                ? t("Degraded")
                : stats.requests > 0
                  ? t("Operational")
                  : t("Siap");
            const maxDaily = Math.max(1, ...stats.daily);

            return (
              <article
                className="ai-provider-card"
                key={provider.id}
                style={{ "--provider-color": provider.color } as CSSProperties}
              >
                <div className="ai-provider-head">
                  <span className="ai-provider-logo"><ProviderLogo provider={provider.id} size={19} /></span>
                  <div className="ai-provider-title">
                    <strong>{provider.name}</strong>
                    <span>{t(provider.role)}</span>
                  </div>
                  <span className={`ai-status ${status}`}>
                    <i />{statusLabel}
                  </span>
                </div>

                <div className="ai-provider-model">{stats.lastModel ?? provider.defaultModel}</div>

                <div className="ai-provider-metrics">
                  <div className="ai-provider-metric">
                    <span>{t("Request")}</span>
                    <strong>{formatCount(stats.requests)}</strong>
                  </div>
                  <div className="ai-provider-metric">
                    <span>{t("Latensi")}</span>
                    <strong>{formatLatency(stats.avgLatencyMs)}</strong>
                  </div>
                  <div className="ai-provider-metric">
                    <span>{t("Sukses")}</span>
                    <strong>{formatPercent(stats.successRate)}</strong>
                  </div>
                </div>

                <div className="ai-provider-spark" aria-hidden="true">
                  {stats.daily.map((value, index) => (
                    <span
                      key={index}
                      style={{ height: `${Math.max(8, (value / maxDaily) * 100)}%` }}
                    />
                  ))}
                </div>

                <div className="ai-provider-foot">
                  <span>{formatTokens(stats.tokens)} {t("token")}</span>
                  <span>{formatCost(stats.costUsd)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ai-charts-grid">
        <article className="ai-panel">
          <div className="ai-panel-head">
            <div>
              <h2>{t("Volume request AI")}</h2>
              <p>{t("Request per hari, 7 hari terakhir")}</p>
            </div>
            <div className="ai-chart-legend">
              {AI_PROVIDERS.map((provider) => (
                <span key={provider.id}>
                  <i style={{ background: provider.color }} />
                  {provider.name}
                </span>
              ))}
            </div>
          </div>
          {hasTelemetry ? (
            <RequestVolumeChart
              ariaLabel={t("Volume request AI")}
              labels={data.daily.map((point) => point.label)}
              series={chartSeries}
            />
          ) : (
            <AiEmpty
              hint={t("Jalankan test koneksi untuk mulai mengumpulkan data.")}
              icon={Activity}
              title={t("Belum ada telemetry")}
            />
          )}
        </article>

        <article className="ai-panel">
          <div className="ai-panel-head">
            <div>
              <h2>{t("Distribusi penggunaan")}</h2>
              <p>{t("Berdasarkan total request")}</p>
            </div>
          </div>
          {hasTelemetry ? (
            <UsageDonut
              ariaLabel={t("Distribusi penggunaan")}
              items={donutItems}
              total={data.totalRequests}
            />
          ) : (
            <AiEmpty
              hint={t("Jalankan test koneksi untuk mulai mengumpulkan data.")}
              icon={Activity}
              title={t("Belum ada telemetry")}
            />
          )}
        </article>
      </section>

      <section className="ai-secondary-grid">
        <article className="ai-panel">
          <div className="ai-panel-head">
            <div>
              <h2>{t("Rata-rata latensi")}</h2>
              <p>{t("Per provider, 7 hari terakhir")}</p>
            </div>
          </div>
          {latencyItems.length > 0 ? (
            <LatencyBars items={latencyItems} />
          ) : (
            <AiEmpty
              hint={t("Jalankan test koneksi untuk mulai mengumpulkan data.")}
              icon={Timer}
              title={t("Belum ada telemetry")}
            />
          )}
        </article>

        <article className="ai-panel">
          <div className="ai-panel-head">
            <div>
              <h2>{t("Agent pipeline")}</h2>
              <p>{t("Agent yang berjalan di balik layar")}</p>
            </div>
          </div>
          <div className="ai-agent-list">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const provider = providerMap.get(agent.provider);
              const ready = configured[agent.provider];

              return (
                <div className="ai-agent-row" key={agent.name}>
                  <span className="ai-agent-icon"><Icon size={14} /></span>
                  <div className="ai-agent-copy">
                    <strong>{t(agent.name)}</strong>
                    <span>{t(agent.description)}</span>
                  </div>
                  <span className="ai-agent-model">
                    <span
                      className="ai-provider-logo"
                      style={{ "--provider-color": provider?.color ?? "var(--green)" } as CSSProperties}
                    >
                      <ProviderLogo provider={agent.provider} size={11} />
                    </span>
                    {provider?.defaultModel ?? "—"}
                  </span>
                  <span className={`ai-agent-status ${ready ? "" : "standby"}`}>
                    {ready ? t("Siap") : t("Belum siap")}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="ai-panel ai-log-panel">
        <div className="ai-panel-head">
          <div>
            <h2>{t("Aktivitas terbaru")}</h2>
            <p>{t("Log request AI terakhir")}</p>
          </div>
          <span className="ai-log-count">{data.recent.length} {t("event")}</span>
        </div>

        {data.recent.length === 0 ? (
          <AiEmpty
            hint={t("Data monitoring akan muncul setelah AI mulai digunakan.")}
            icon={Activity}
            title={t("Belum ada aktivitas AI")}
          />
        ) : (
          <div className="ai-log-scroll">
            <table className="ai-log-table">
              <thead>
                <tr>
                  <th scope="col">{t("Waktu")}</th>
                  <th scope="col">{t("Provider & model")}</th>
                  <th scope="col">{t("Event")}</th>
                  <th scope="col">{t("Status")}</th>
                  <th scope="col">{t("Latensi")}</th>
                  <th scope="col">{t("Token")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((log) => {
                  const provider = log.provider ? providerMap.get(log.provider) : undefined;
                  const status = statusMeta(log.status);

                  return (
                    <tr key={log.id}>
                      <td className="ai-log-time">{log.time}</td>
                      <td>
                        <div className="ai-log-provider">
                          <span
                            className="ai-log-logo"
                            style={{ "--provider-color": provider?.color ?? "var(--green)" } as CSSProperties}
                          >
                            {log.provider ? (
                              <ProviderLogo provider={log.provider} size={13} />
                            ) : (
                              <Bot size={13} />
                            )}
                          </span>
                          <div>
                            <strong>{log.model ?? "—"}</strong>
                            <span>{provider?.name ?? t("Tidak diketahui")}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ai-log-event">
                          <strong>{t(EVENT_LABELS[log.kind])}</strong>
                          <span>{log.message ?? t("Tanpa detail")}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`ai-log-status ${status.className}`}>
                          <i />{t(status.label)}
                        </span>
                      </td>
                      <td>{formatLatency(log.latencyMs)}</td>
                      <td>{log.tokens === null ? "—" : formatTokens(log.tokens)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
