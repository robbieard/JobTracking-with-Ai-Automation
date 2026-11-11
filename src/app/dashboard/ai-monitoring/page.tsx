import { connection } from "next/server";
import AiMonitoringView from "@/components/dashboard/ai-monitoring/ai-monitoring-view";
import { getConfiguredAiProviders } from "@/lib/ai/credentials";
import {
  buildAiMonitoringData,
  monitoringSince,
  type AiMonitoringEvent,
} from "@/lib/ai/monitoring";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Monitoring | JobTracking",
};

export default async function AiMonitoringPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("ai_monitoring_events")
    .select(
      "id, user_id, job_id, kind, status, model, input_tokens, output_tokens, cost_usd, latency_ms, message, metadata, created_at",
    )
    .eq("user_id", user.id)
    .gte("created_at", monitoringSince())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[ai-monitoring] gagal memuat telemetry:", error.message);
  }

  const monitoring = buildAiMonitoringData((data ?? []) as AiMonitoringEvent[]);

  return <AiMonitoringView configured={getConfiguredAiProviders()} data={monitoring} />;
}
