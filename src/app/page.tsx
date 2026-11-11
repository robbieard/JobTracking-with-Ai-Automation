"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PreferenceControls, useAppPreferences } from "@/components/app-preferences";

export default function LandingPage() {
  const { t } = useAppPreferences();

  return (
    <main className="simple-landing">
      <header className="simple-header">
        <Link className="simple-brand" href="/" aria-label="JobTracking beranda">
          <span className="simple-brand-mark"><Sparkles size={16} /></span>
          <span>JobTracking</span>
        </Link>
        <PreferenceControls />
      </header>

      <section className="simple-entry">
        <p className="simple-eyebrow">JOBTRACKING <span>BY RBDEV</span></p>
        <h1>{t("Mulai dari langkah berikutnya.")}</h1>
        <p className="simple-description">{t("Masuk atau buat akun untuk mengelola pencarian kerjamu.")}</p>
        <div className="simple-actions">
          <Link className="simple-primary" href="/auth?intent=signup">Sign in <ArrowRight size={15} /></Link>
          <Link className="simple-secondary" href="/auth?intent=login">Login</Link>
        </div>
      </section>

      <footer className="simple-footer">© 2025 JobTracking <span>{t("Dikembangkan oleh RBDev")}</span></footer>
    </main>
  );
}