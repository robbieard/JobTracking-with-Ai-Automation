"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppPreferences } from "@/components/app-preferences";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { JobList } from "@/components/dashboard/job-list";
import type { Job } from "@/lib/jobs";

// Sumber data lowongan akan dihubungkan ke backend.
const findJobJobs: Job[] = [];

export default function FindJobPage() {
  const { t } = useAppPreferences();
  const { user } = useDashboard();
  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />{t("CARI LOWONGAN")}</p>
          <h1>{t("Temukan peran berikutnya, ")}{firstName} <span className="wave">✳</span></h1>
          <p className="welcome-subtitle">{t("Semua lowongan yang tersedia untukmu saat ini.")}</p>
        </div>
        <Link className="outline-button" href="/dashboard"><ArrowLeft size={16} />{t("Kembali ke dashboard")}</Link>
      </section>

      <section className="jobs-section find-job-section">
        <div className="section-heading">
          <div>
            <div className="section-title-line">
              <h2>{t("Semua lowongan")}</h2>
              {findJobJobs.length > 0 && <span className="new-count">{findJobJobs.length} {t("baru")}</span>}
            </div>
            <p>{t("Cari dan filter lowongan sesuai preferensimu")}</p>
          </div>
        </div>
        <JobList jobs={findJobJobs} />
      </section>
    </>
  );
}
