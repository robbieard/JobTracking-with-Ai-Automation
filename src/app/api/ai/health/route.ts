import { NextResponse } from "next/server";
import { getConfiguredAiProviders, isAiProviderConfigured } from "@/lib/ai/credentials";
import { generateAi } from "@/lib/ai/gateway";
import { AI_PROVIDER_IDS, AI_PROVIDERS, getAiProvider, isAiProviderId, type AiProviderId } from "@/lib/ai/providers";
import { logAiEvent } from "@/lib/ai/telemetry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PING_MESSAGES = [
  {
    role: "system" as const,
    content: "You are a health check endpoint for JobTracking. Reply with exactly one word: OK",
  },
  { role: "user" as const, content: "ping" },
];

const RATE_LIMIT_MS = 10_000;

type PingResult = {
  provider: AiProviderId;
  name: string;
  configured: boolean;
  ok: boolean;
  model: string;
  latencyMs: number | null;
  text?: string;
  error?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Sesi kamu sudah berakhir." }, { status: 401 });
  }

  const configured = getConfiguredAiProviders();

  return NextResponse.json({
    providers: AI_PROVIDERS.map((provider) => ({
      id: provider.id,
      name: provider.name,
      model: provider.defaultModel,
      configured: configured[provider.id],
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Sesi kamu sudah berakhir." }, { status: 401 });
  }

  let requested: AiProviderId[] | null = null;

  try {
    const body = (await request.json()) as { providers?: unknown };

    if (Array.isArray(body.providers)) {
      requested = body.providers.filter(isAiProviderId);
    }
  } catch {
    // An empty or malformed body means "check every provider".
  }

  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
    const { count } = await admin
      .from("ai_monitoring_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "ai_ping")
      .gte("created_at", since);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Tunggu beberapa detik sebelum menguji koneksi lagi." },
        { status: 429 },
      );
    }
  } catch {
    // The ai_ping enum may not be applied yet; skip the guard instead of blocking.
  }

  const targets = requested && requested.length > 0 ? requested : AI_PROVIDER_IDS;

  const results = await Promise.all(
    targets.map(async (provider): Promise<PingResult> => {
      const definition = getAiProvider(provider);

      if (!isAiProviderConfigured(provider)) {
        return {
          provider,
          name: definition.name,
          configured: false,
          ok: false,
          model: definition.defaultModel,
          latencyMs: null,
          error: "Belum dikonfigurasi.",
        };
      }

      try {
        const result = await generateAi({
          provider,
          messages: PING_MESSAGES,
          temperature: 0,
          maxOutputTokens: 8,
          timeoutMs: 15_000,
        });

        await logAiEvent({
          userId: user.id,
          kind: "ai_ping",
          status: "succeeded",
          result,
          message: result.text.slice(0, 120),
          metadata: { source: "health_check" },
        });

        return {
          provider,
          name: definition.name,
          configured: true,
          ok: true,
          model: result.model,
          latencyMs: result.latencyMs,
          text: result.text.slice(0, 120),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Koneksi gagal.";

        await logAiEvent({
          userId: user.id,
          kind: "ai_ping",
          status: "failed",
          provider,
          model: definition.defaultModel,
          message: message.slice(0, 300),
          metadata: { source: "health_check" },
        });

        return {
          provider,
          name: definition.name,
          configured: true,
          ok: false,
          model: definition.defaultModel,
          latencyMs: null,
          error: message.slice(0, 300),
        };
      }
    }),
  );

  return NextResponse.json({ checkedAt: new Date().toISOString(), results });
}
