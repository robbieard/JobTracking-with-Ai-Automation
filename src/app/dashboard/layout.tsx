import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { toDashboardUser } from "@/lib/user-profile";

export const metadata = {
  title: "Dashboard | JobTracking",
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return <DashboardShell user={toDashboardUser(user)}>{children}</DashboardShell>;
}

function DashboardLoading() {
  return (
    <main className="app-shell">
      <div className="dashboard-loading">
        <span className="dashboard-loading-dot" />
        Memuat dashboard...
      </div>
    </main>
  );
}
