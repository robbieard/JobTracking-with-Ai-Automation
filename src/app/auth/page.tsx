import { Suspense } from "react";
import AuthFlow from "@/components/auth-flow";

export const metadata = {
  title: "Masuk atau daftar | JobTracking",
};

export default function AuthPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  return (
    <Suspense fallback={<main className="auth-page"><div className="auth-loading">Memuat...</div></main>}>
      <AuthFlowFromParams searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthFlowFromParams({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  const authIntent = intent === "login" ? "login" : "signup";
  return <AuthFlow key={authIntent} intent={authIntent} />;
}