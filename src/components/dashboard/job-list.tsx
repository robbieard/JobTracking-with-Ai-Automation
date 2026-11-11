"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, MapPin, Plus, Search, Settings2, Sparkles } from "lucide-react";
import { useAppPreferences } from "@/components/app-preferences";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { jobFilters, type Job } from "@/lib/jobs";

type JobListProps = {
  jobs: Job[];
};

export function JobList({ jobs }: JobListProps) {
  const { t } = useAppPreferences();
  const { showToast } = useDashboard();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const visibleJobs = useMemo(() => {
    const searchTerm = query.toLowerCase().trim();
    let result = jobs.filter((job) =>
      `${job.company} ${job.role} ${job.location} ${job.tags.join(" ")}`.toLowerCase().includes(searchTerm),
    );

    if (activeFilter === "Paling cocok") result = [...result].sort((a, b) => b.match - a.match);
    if (activeFilter === "Remote") result = result.filter((job) => job.location.toLowerCase().includes("remote"));
    if (activeFilter === "Baru diposting") result = result.filter((job) => job.posted !== "Kemarin");

    return result;
  }, [activeFilter, jobs, query]);

  const toggleSaved = (role: string) => {
    setSavedJobs((current) =>
      current.includes(role) ? current.filter((saved) => saved !== role) : [...current, role],
    );
  };

  const hasJobs = jobs.length > 0;

  return (
    <>
      {hasJobs && (
        <div className="job-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Cari posisi, perusahaan, atau skill")}
              aria-label={t("Cari lowongan")}
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="filter-list" role="group" aria-label={t("Filter lowongan")}>
            {jobFilters.map((filter) => (
              <button
                key={filter}
                className={`filter-chip ${activeFilter === filter ? "selected" : ""}`}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter === "Paling cocok" && <Sparkles size={13} />}
                {t(filter)}
              </button>
            ))}
            <button
              className="filter-settings"
              type="button"
              aria-label={t("Pengaturan filter")}
              onClick={() => showToast(t("Filter lanjutan segera tersedia."))}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="job-list">
        {visibleJobs.map((job) => {
          const isSaved = savedJobs.includes(job.role);

          return (
            <article className="job-card" key={`${job.company}-${job.role}`}>
              <div className={`company-logo logo-${job.color}`}>{job.initials}</div>
              <div className="job-main">
                <div className="job-company-row">
                  <span className="company-name">{job.company}</span>
                  <span className="verified"><Check size={10} /></span>
                  <span className="job-posted">{t(job.posted)}</span>
                </div>
                <h3>{job.role}</h3>
                <div className="job-meta">
                  <span><MapPin size={13} />{t(job.location)}</span>
                  <span className="meta-dot" />
                  <span>{job.salary}</span>
                </div>
                <div className="job-tags">
                  {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="job-match">
                <div className="match-ring" style={{ "--match": `${job.match}%` } as React.CSSProperties}>
                  <span>{job.match}<small>%</small></span>
                </div>
                <span>{t("cocok")}</span>
              </div>
              <div className="job-actions">
                <button
                  className={`save-button ${isSaved ? "saved" : ""}`}
                  type="button"
                  aria-label={t(isSaved ? "Hapus lowongan tersimpan" : "Simpan lowongan")}
                  onClick={() => toggleSaved(job.role)}
                >
                  {isSaved ? <Check size={16} /> : <Plus size={17} />}
                </button>
                <button
                  className="apply-button"
                  type="button"
                  onClick={() => showToast(`${t("Draft lamaran ")}${job.role}${t(" akan disiapkan.")}`)}
                >
                  {t("Lihat detail")} <ArrowRight size={14} />
                </button>
              </div>
            </article>
          );
        })}

        {!hasJobs && (
          <div className="empty-jobs">
            <Search size={20} />
            <strong>{t("Belum ada lowongan")}</strong>
            <span>{t("Lowongan akan muncul di sini setelah tersedia.")}</span>
          </div>
        )}

        {hasJobs && visibleJobs.length === 0 && (
          <div className="empty-jobs">
            <Search size={20} />
            <strong>{t("Belum ada lowongan yang cocok")}</strong>
            <span>{t("Coba kata kunci atau filter lainnya.")}</span>
          </div>
        )}
      </div>
    </>
  );
}
