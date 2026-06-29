"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-context";

/** Providers de cliente que envuelven toda la app (Sprint 07). */
export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
