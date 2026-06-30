"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { logoutCandidate } from "@/features/auth/auth-api";
import { useAuth } from "@/features/auth/auth-context";
import { getCandidateDashboard } from "@/features/dashboard/dashboard-api";
import { DashboardContent } from "@/features/dashboard/dashboard-content";
import { isSessionExpiredError } from "@/lib/api-client";
import type { CandidateDashboardDto } from "@/types/api";

type LoadError = "generic" | "expired";

export function DashboardPage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [dashboard, setDashboard] = useState<CandidateDashboardDto | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  // Guard: sin sesión en memoria (p. ej. tras recargar la página) → login.
  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getCandidateDashboard(accessToken)
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isSessionExpiredError(error)) {
          clearSession();
          setLoadError("expired");
          router.push("/login");
          return;
        }
        setLoadError("generic");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession, router]);

  async function handleLogout() {
    try {
      await logoutCandidate(accessToken);
    } catch {
      // Aunque el logout del servidor falle, limpiamos la sesión local igualmente.
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  // Estado de carga derivado: hay sesión, sin error y aún sin datos.
  let body: ReactNode;
  if (loadError === "expired") {
    body = (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Tu sesión ha caducado. Vuelve a iniciar sesión.
      </p>
    );
  } else if (!accessToken) {
    body = <p className="text-sm text-zinc-600 dark:text-zinc-400">Redirigiendo al login…</p>;
  } else if (loadError === "generic") {
    body = (
      <p role="alert" className="text-sm text-red-600">
        No se ha podido cargar tu panel. Inténtalo de nuevo.
      </p>
    );
  } else if (!dashboard) {
    body = <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando tu panel…</p>;
  } else {
    body = <DashboardContent dashboard={dashboard} onLogout={handleLogout} />;
  }

  return <SiteShell>{body}</SiteShell>;
}
