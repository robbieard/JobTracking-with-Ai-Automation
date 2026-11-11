import { NextResponse } from "next/server";

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_HCAPTCHA_SITE_KEY",
  "HCAPTCHA_SECRET_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

export function GET() {
  const missing = requiredVariables.filter((name) => !process.env[name]);

  return NextResponse.json(
    { ready: missing.length === 0, missing },
    { headers: { "Cache-Control": "no-store" } },
  );
}