"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { ArrowLeft, ArrowRight, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { HCaptcha as HCaptchaInstance } from "@hcaptcha/react-hcaptcha";
import { createClient } from "@/lib/supabase/client";
import { PreferenceControls, useAppPreferences } from "@/components/app-preferences";

type Step = "email" | "verify" | "password" | "login";
type AuthIntent = "signup" | "login";

const resendDelay = 120;
const minOtpLength = 6;
const maxOtpLength = 10;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kendala. Coba lagi sebentar.";
}

function isInvalidCredentialsError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const authError = error as { code?: string; message?: string };
  return authError.code === "invalid_credentials" || authError.message?.toLowerCase().includes("invalid login credentials") === true;
}

export default function AuthFlow({ intent }: { intent: AuthIntent }) {
  const router = useRouter();
  const { t } = useAppPreferences();
  const captchaRef = useRef<HCaptchaInstance>(null);
  const [step, setStep] = useState<Step>(intent === "login" ? "login" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(resendDelay);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);
  const [missingVariables, setMissingVariables] = useState<string[]>([]);

  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const authConfigured = authReady && Boolean(hcaptchaSiteKey);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status auth tidak tersedia.");
        return response.json() as Promise<{ ready: boolean; missing: string[] }>;
      })
      .then((result) => {
        if (!active) return;
        setAuthReady(result.ready);
        setMissingVariables(result.missing);
      })
      .catch(() => {
        if (!active) return;
        setAuthReady(false);
        setMissingVariables(["API auth tidak dapat diperiksa"]);
      })
      .finally(() => {
        if (active) setConfigChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (step !== "verify" || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, step]);

  const resetCaptcha = () => {
    setCaptchaToken("");
    captchaRef.current?.resetCaptcha();
  };

  const sendCode = async (resend = false) => {
    setErrorMessage("");
    setNotice("");
    if (!captchaToken) {
      setCaptchaError(true);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = resend
        ? await supabase.auth.resend({
            type: "signup",
            email: normalizedEmail,
            options: { captchaToken },
          })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password: Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join(""),
            options: { captchaToken },
          });
      if (error) throw error;
      if (!resend && data.session) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("Konfirmasi email di Supabase perlu diaktifkan untuk pendaftaran akun.");
      }
      setStep("verify");
      setSecondsLeft(resendDelay);
      setCode("");
      setNotice(t(resend ? "Jika email ini belum diverifikasi, kode baru akan dikirim." : "Jika email ini belum terdaftar, kode verifikasi akan dikirim. Sudah punya akun? Pilih Login."));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
      resetCaptcha();
    }
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setNotice("");
    if (code.trim().length < minOtpLength || code.trim().length > maxOtpLength) {
      setErrorMessage(t("Masukkan kode verifikasi 6-10 digit dari emailmu."));
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "signup",
      });
      if (error) throw error;
      if (!data.user?.email_confirmed_at) {
        throw new Error(t("Email belum berhasil diverifikasi. Periksa kode dan coba lagi."));
      }

      setStep("password");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setNotice("");
    if (!captchaToken) {
      setCaptchaError(true);
      return;
    }
    if (intent === "signup" && password.length < 8) {
      setErrorMessage(t("Gunakan password minimal 8 karakter."));
      return;
    }

    setBusy(true);
    try {
      if (intent === "login") {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
          options: { captchaToken },
        });
        if (error) throw error;
      } else {
        const response = await fetch("/api/auth/complete-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, captchaToken }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Password belum berhasil disimpan.");
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(intent === "login" && isInvalidCredentialsError(error)
        ? t("Email atau password mungkin salah.")
        : getErrorMessage(error));
    } finally {
      setBusy(false);
      resetCaptcha();
    }
  };

  const goBack = () => {
    setErrorMessage("");
    setNotice("");
    if (step === "password") {
      setStep("verify");
      setPassword("");
      return;
    }
    setStep(intent === "login" ? "login" : "email");
    setCode("");
  };

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="landing-brand" href="/" aria-label="JobTracking beranda"><span className="landing-brand-mark"><Sparkles size={17} strokeWidth={2.5} /></span><span>Job<span>Tracking</span></span></Link>
        <div className="auth-header-actions"><PreferenceControls /><Link className="auth-back-home" href="/">{t("Kembali ke beranda")} <ArrowRight size={14} /></Link></div>
      </header>

      <section className={`auth-content ${intent === "login" ? "auth-content-login" : ""}`}>
        <div className="auth-intro">
          {intent === "signup" && <div className="auth-step-marker"><span className={step === "email" ? "current" : "done"}>{step === "email" ? "01" : <Check size={12} />}</span><i /><span className={step === "verify" ? "current" : step === "password" ? "done" : ""}>{step === "password" ? <Check size={12} /> : "02"}</span><i /><span className={step === "password" ? "current" : ""}>03</span></div>}
          <p className="auth-kicker">{t(intent === "login" ? "SELAMAT DATANG KEMBALI" : "AKUN JOBTRACKING")}</p>
          <h1>{step === "login" ? <>{t("Login ke")}<br /><em>{t("JobTracking.")}</em></> : step === "email" ? <>{t("Mulai dari")}<br /><em>{t("email kamu.")}</em></> : step === "verify" ? <>{t("Cek kotak")}<br /><em>{t("masukmu.")}</em></> : <>{t("Buat password")}<br /><em>{t("yang aman.")}</em></>}</h1>
          <p>{step === "login" ? t("Masuk dengan email dan password akunmu.") : step === "email" ? t("Daftar dengan email baru. Kami akan kirim kode untuk verifikasi alamat email.") : step === "verify" ? <>{t("Jika alamat ini baru, kode verifikasi dikirim ke ")}<strong>{email}</strong>{t(". Masukkan kode untuk melanjutkan.")}</> : t("Emailmu sudah terverifikasi. Buat password untuk mengamankan akun.")}</p>
          <div className="auth-trust-note"><ShieldCheck size={16} /><span>{t("Data akunmu hanya digunakan untuk perjalanan kariermu.")}</span></div>
        </div>

        <div className="auth-form-panel">
          {step !== "email" && step !== "login" && <button className="auth-back-button" onClick={goBack} type="button"><ArrowLeft size={15} />{t("Kembali")}</button>}
          {step === "login" && <form className="auth-form" onSubmit={submitPassword}>
            <label htmlFor="login-email">{t("Alamat email")}</label>
            <div className="auth-input-wrap"><Mail size={17} /><input id="login-email" type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <label htmlFor="login-password">{t("Password")}</label>
            <input className="auth-text-input" id="login-password" type="password" autoComplete="current-password" placeholder={t("Masukkan password")} value={password} onChange={(event) => setPassword(event.target.value)} required />
            {hcaptchaSiteKey && <div className="auth-captcha"><HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={(token) => { setCaptchaToken(token); setCaptchaError(false); }} onExpire={() => setCaptchaToken("")} onError={() => setCaptchaError(true)} /></div>}
            {captchaError && <p className="auth-error">{t("Selesaikan verifikasi hCaptcha terlebih dahulu.")}</p>}
            {!authConfigured && <p className="auth-config-note">{configChecked ? `${t("Auth belum siap. Lengkapi: ")}${missingVariables.join(", ") || t("site key hCaptcha")}.` : t("Memeriksa konfigurasi auth...")}</p>}
            <button className="auth-submit" type="submit" disabled={busy || !authConfigured}>{busy ? t("Memproses...") : t("Login")}<ArrowRight size={16} /></button>
            <p className="auth-switch">{t("Belum punya akun?")} <Link href="/auth?intent=signup">{t("Sign in")}</Link></p>
          </form>}
          {step === "email" && <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void sendCode(); }}>
            <label htmlFor="auth-email">{t("Alamat email")}</label>
            <div className="auth-input-wrap"><Mail size={17} /><input id="auth-email" type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="auth-field-hint">{t("Gunakan email yang bisa kamu akses sekarang.")}</div>
            {hcaptchaSiteKey && <div className="auth-captcha"><HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={(token) => { setCaptchaToken(token); setCaptchaError(false); }} onExpire={() => setCaptchaToken("")} onError={() => setCaptchaError(true)} /></div>}
            {captchaError && <p className="auth-error">{t("Selesaikan verifikasi hCaptcha terlebih dahulu.")}</p>}
            {!authConfigured && <p className="auth-config-note">{configChecked ? `${t("Auth belum siap. Lengkapi: ")}${missingVariables.join(", ") || t("site key hCaptcha")}.` : t("Memeriksa konfigurasi auth...")}</p>}
            <button className="auth-submit" type="submit" disabled={busy || !authConfigured}>{busy ? t("Mengirim kode...") : t("Buat akun dan kirim kode")}<ArrowRight size={16} /></button>
            <p className="auth-switch">{t("Sudah punya akun?")} <Link href="/auth?intent=login">{t("Login")}</Link></p>
          </form>}

          {step === "verify" && <form className="auth-form" onSubmit={verifyCode}>
            <label htmlFor="auth-code">{t("Kode verifikasi")}</label>
            <input className="otp-input" id="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={maxOtpLength} placeholder="00000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required />
            <div className="otp-timer">{secondsLeft > 0 ? <>{t("Kode berlaku untuk sesi ini")} <strong>{formattedTime}</strong></> : t("Belum menerima kode? Kamu bisa kirim ulang.")}</div>
            {hcaptchaSiteKey && <div className="auth-captcha"><HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={(token) => { setCaptchaToken(token); setCaptchaError(false); }} onExpire={() => setCaptchaToken("")} onError={() => setCaptchaError(true)} /></div>}
            {captchaError && <p className="auth-error">{t("Selesaikan verifikasi hCaptcha terlebih dahulu.")}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? t("Memverifikasi...") : t("Verifikasi email")}<ArrowRight size={16} /></button>
            <button className="auth-resend" type="button" disabled={busy || secondsLeft > 0 || !captchaToken} onClick={() => void sendCode(true)}>{t("Kirim ulang kode")}</button>
            <p className="auth-switch">{t("Sudah punya akun?")} <Link href="/auth?intent=login">{t("Login")}</Link></p>
          </form>}

          {step === "password" && <form className="auth-form" onSubmit={submitPassword}>
            <label htmlFor="auth-password">{t("Buat password")}</label>
            <input className="auth-text-input" id="auth-password" type="password" autoComplete="new-password" placeholder={t("Minimal 8 karakter")} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <div className="auth-field-hint">{t("Minimal 8 karakter. Simpan baik-baik, ya.")}</div>
            {hcaptchaSiteKey && <div className="auth-captcha"><HCaptcha ref={captchaRef} sitekey={hcaptchaSiteKey} onVerify={(token) => { setCaptchaToken(token); setCaptchaError(false); }} onExpire={() => setCaptchaToken("")} onError={() => setCaptchaError(true)} /></div>}
            {captchaError && <p className="auth-error">{t("Selesaikan verifikasi hCaptcha terlebih dahulu.")}</p>}
            <button className="auth-submit" type="submit" disabled={busy || !authConfigured}>{busy ? t("Memproses...") : t("Simpan password")}<ArrowRight size={16} /></button>
          </form>}

          {notice && <p className="auth-success" role="status"><Check size={14} />{notice}</p>}
          {errorMessage && <p className="auth-error" role="alert">{t(errorMessage)}</p>}
          <p className="auth-terms">{t("Dengan melanjutkan, kamu menyetujui ")}<a href="#ketentuan">{t("Ketentuan Layanan")}</a>{t(" dan ")}<a href="#privasi">{t("Kebijakan Privasi")}</a>.</p>
        </div>
      </section>
      <footer className="auth-footer"><span>© 2025 JobTracking</span><span>{t("Dikembangkan oleh RBDev")}</span></footer>
    </main>
  );
}