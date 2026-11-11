"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, LayoutDashboard, LogOut, Search, Sparkles, Activity } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { PreferenceControls, useAppPreferences } from "@/components/app-preferences";
import { DashboardContext } from "@/components/dashboard/dashboard-context";
import { ProfileDialog } from "@/components/dashboard/profile-dialog";
import { getInitials, type DashboardUser } from "@/lib/user-profile";
import type { ReactNode } from "react";

type DashboardShellProps = {
  user: DashboardUser;
  children: ReactNode;
};

export function DashboardShell({ user: initialUser, children }: DashboardShellProps) {
  const { t } = useAppPreferences();
  const pathname = usePathname();
  const [nameOverride, setNameOverride] = useState<{ name: string; initials: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);

  const user = useMemo(
    () => (nameOverride ? { ...initialUser, ...nameOverride } : initialUser),
    [initialUser, nameOverride],
  );

  useEffect(() => {
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  const setName = useCallback((name: string) => {
    setNameOverride({ name, initials: getInitials(name) });
  }, []);

  const showToast = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2800);
  }, []);

  const contextValue = useMemo(
    () => ({ user, setName, showToast }),
    [user, setName, showToast],
  );

  const isDashboard = pathname === "/dashboard";
  const isFindJob = pathname.startsWith("/dashboard/find-job");
  const isAiMonitoring = pathname.startsWith("/dashboard/ai-monitoring");
  const breadcrumbLabel = isFindJob
    ? t("Cari lowongan")
    : isAiMonitoring
      ? t("AI Monitoring")
      : t("Dashboard");

  return (
    <DashboardContext.Provider value={contextValue}>
      <main className="app-shell">
        <aside className="sidebar" data-initials={user.initials}>
          <Link className="brand" href="/dashboard" aria-label="JobTracking beranda">
            <span className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></span>
            <span>Job<span className="brand-accent">Tracking</span></span>
          </Link>

          <button
            className="profile-switcher"
            type="button"
            aria-label={t("Pengaturan profil")}
            onClick={() => setProfileOpen(true)}
          >
            <span className="avatar avatar-profile">{user.initials}</span>
            <span className="profile-copy">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </span>
            <ChevronDown size={16} className="muted-icon" />
          </button>

          <div className="nav-label">{t("WORKSPACE")}</div>
          <nav className="nav-list" aria-label={t("Navigasi utama")}>
            <Link className={`nav-item ${isDashboard ? "active" : ""}`} href="/dashboard">
              <LayoutDashboard size={18} />
              {t("Dashboard")}
              {isDashboard && <span className="nav-active-dot" />}
            </Link>
            <Link className={`nav-item ${isFindJob ? "active" : ""}`} href="/dashboard/find-job">
              <Search size={18} />
              {t("Cari lowongan")}
              {isFindJob && <span className="nav-active-dot" />}
            </Link>
            <Link className={`nav-item ${isAiMonitoring ? "active" : ""}`} href="/dashboard/ai-monitoring">
              <Activity size={18} />
              {t("AI Monitoring")}
              {isAiMonitoring && <span className="nav-active-dot" />}
            </Link>
          </nav>

          <div className="sidebar-bottom">
            <form className="logout-form" action={logout}>
              <button className="nav-item" type="submit">
                <LogOut size={18} />
                {t("Keluar")}
              </button>
            </form>
            <div className="sidebar-footer">© 2026 JobTracking <span>·</span> by RBDev</div>
          </div>
        </aside>

        <section className="main-area" id="home">
          <header className="topbar">
            <div className="breadcrumb">
              <span>{t("Workspace")}</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{breadcrumbLabel}</strong>
            </div>
            <div className="topbar-actions">
              <PreferenceControls />
              <span className="topbar-divider" />
              <button
                className="user-menu"
                type="button"
                aria-label={t("Pengaturan profil")}
                onClick={() => setProfileOpen(true)}
              >
                <span className="avatar avatar-small">{user.initials}</span>
                <ChevronDown size={15} />
              </button>
            </div>
          </header>

          <div className="page-content">{children}</div>
        </section>

        <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

        {notice && (
          <div className="toast" role="status">
            <span className="toast-check"><Check size={13} /></span>
            {notice}
          </div>
        )}
      </main>
    </DashboardContext.Provider>
  );
}
