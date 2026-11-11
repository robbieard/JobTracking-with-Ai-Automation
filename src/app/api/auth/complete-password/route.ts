import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CompletePasswordRequest = {
  password?: unknown;
  captchaToken?: unknown;
};

export async function POST(request: Request) {
  let body: CompletePasswordRequest;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }
    body = parsed as CompletePasswordRequest;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";
  const captchaSecret = process.env.HCAPTCHA_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Password harus terdiri dari 8 sampai 128 karakter." }, { status: 400 });
  }
  if (!captchaToken || !captchaSecret) {
    return NextResponse.json({ error: "Verifikasi hCaptcha belum lengkap." }, { status: 400 });
  }
  if (!supabaseUrl || !supabaseSecret) {
    return NextResponse.json({ error: "Konfigurasi auth server belum lengkap." }, { status: 503 });
  }

  const captchaBody = new URLSearchParams({ secret: captchaSecret, response: captchaToken });
  let captchaResponse: Response;
  try {
    captchaResponse = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: captchaBody,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Layanan hCaptcha tidak dapat dijangkau. Coba lagi." }, { status: 503 });
  }
  if (!captchaResponse.ok) {
    return NextResponse.json({ error: "Verifikasi hCaptcha gagal. Coba lagi." }, { status: 400 });
  }
  const captchaResult = (await captchaResponse.json()) as { success?: boolean };
  if (!captchaResult.success) {
    return NextResponse.json({ error: "Verifikasi hCaptcha gagal. Coba lagi." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Sesi verifikasi email tidak valid. Mulai lagi dari awal." }, { status: 401 });
  }
  if (user.app_metadata.password_setup_complete === true) {
    return NextResponse.json({ error: "Akun ini sudah memiliki password. Masuk dengan password akunmu." }, { status: 409 });
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return NextResponse.json({ error: passwordError.message }, { status: 400 });
  }

  const admin = createSupabaseAdminClient(supabaseUrl, supabaseSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, password_setup_complete: true },
  });
  if (metadataError) {
    return NextResponse.json({ error: "Password tersimpan, tetapi akun belum selesai disiapkan. Coba lagi." }, { status: 500 });
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    return NextResponse.json({ error: "Password tersimpan. Silakan masuk kembali." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}