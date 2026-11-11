"use client";

import { createContext, useContext } from "react";
import type { DashboardUser } from "@/lib/user-profile";

export type DashboardContextValue = {
  user: DashboardUser;
  setName: (name: string) => void;
  showToast: (message: string) => void;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardShell");
  }

  return context;
}
