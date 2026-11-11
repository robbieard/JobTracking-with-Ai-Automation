"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles, Target } from "lucide-react";
import { useAppPreferences } from "@/components/app-preferences";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { JobList } from "@/components/dashboard/job-list";
import type { Job } from "@/lib/jobs";

// Sumber data lowongan akan dihubungkan ke backend.
const dashboardJobs: Job[] = [];

export default function DashboardPage() {
  const { t } = useAppPreferences();
  const { user } = useDashboard();

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />{t("RINGKASAN HARI INI")}</p>
          <h1>{t("Halo, ")}{user.name} <span className="wave">✳</span></h1>
          <p className="welcome-subtitle">{t("Ringkasan aktivitas pencarian kerjamu.")}</p>
        </div>
      </section>

      <section className="stats-grid" aria-label={t("Ringkasan aktivitas")}>
        <article className="stat-card stat-apps">
          <div className="stat-top"><span>{t("Total lamaran")}</span><span className="stat-icon coral-icon"><BriefcaseBusiness size={17} /></span></div>
          <div className="stat-value">0</div>
          <div className="stat-foot">{t("Belum ada data")}</div>
        </article>
        <article className="stat-card stat-interviews">
          <div className="stat-top"><span>{t("Interview")}</span><span className="stat-icon green-icon"><Target size={17} /></span></div>
          <div className="stat-value">0</div>
          <div className="stat-foot">{t("Belum ada data")}</div>
        </article>
        <article className="stat-card stat-match">
          <div className="stat-top"><span>{t("Rata-rata kecocokan")}</span><span className="stat-icon blue-icon"><Sparkles size={17} /></span></div>
          <div className="stat-value">0<span className="stat-percent">%</span></div>
          <div className="stat-foot">{t("Belum ada data")}</div>
        </article>
      </section>

      <section className="jobs-section" id="lowongan">
        <div className="section-heading">
          <div>
            <div className="section-title-line">
              <h2>{t("Lowongan untukmu")}</h2>
              {dashboardJobs.length > 0 && <span className="new-count">{dashboardJobs.length} {t("baru")}</span>}
            </div>
            <p>{t("Rekomendasi lowongan berdasarkan profilmu.")}</p>
          </div>
          {dashboardJobs.length > 0 && (
            <Link className="text-button" href="/dashboard/find-job">{t("Lihat semua")} <ArrowRight size={15} /></Link>
          )}
        </div>
        <JobList jobs={dashboardJobs} />
      </section>

      <section className="applications-section" id="lamaran">
        <div className="section-heading application-heading">
          <div>
            <div className="section-title-line"><h2>{t("Aktivitas lamaran")}</h2></div>
            <p>{t("Pantau setiap langkah proses rekrutmenmu")}</p>
          </div>
        </div>
        <div className="application-panel">
          <div className="application-empty">
            <BriefcaseBusiness size={20} />
            <strong>{t("Belum ada lamaran")}</strong>
            <span>{t("Lamaran yang kamu kirim akan muncul di sini.")}</span>
          </div>
        </div>
      </section>
    </>
  );
}
