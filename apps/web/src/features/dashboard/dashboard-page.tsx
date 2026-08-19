"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { redirectToLogin } from "@/features/auth/auth-navigation";
import { useSessionGuard } from "@/features/auth/use-session-guard";
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
  // Reintento manual (17D.2): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);

  // Guarda unica de ruta privada (ADR-0014): distingue arranque, sesion terminal
  // y fallo transitorio, de modo que ni se redirige durante el bootstrap ni se
  // trata un error de infraestructura como sesion invalida.
  const sessionGuard = useSessionGuard(router);

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
          clearSession("expired");
          setLoadError("expired");
          redirectToLogin(router, "expired");
          return;
        }
        setLoadError("generic");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey, clearSession, router]);

  function handleRetry() {
    setLoadError(null);
    setDashboard(null);
    setReloadKey((key) => key + 1);
  }

  // Estado de carga derivado: hay sesión, sin error y aún sin datos.
  let body: ReactNode;
  if (loadError === "expired") {
    body = <p className="text-sm text-slate-600">Tu sesión ha caducado. Vuelve a iniciar sesión.</p>;
  } else if (sessionGuard.state === "unavailable") {
    body = (
      <ErrorState
        title="No se ha podido verificar tu sesión."
        description="No hemos podido comprobar si tu sesión sigue activa. Revisa tu conexión e inténtalo de nuevo."
        onRetry={sessionGuard.retry}
      />
    );
  } else if (sessionGuard.state !== "ready") {
    body = <p className="text-sm text-slate-600">Comprobando tu sesión…</p>;
  } else if (loadError === "generic") {
    body = (
      <ErrorState
        title="No se ha podido cargar tu panel."
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={handleRetry}
      />
    );
  } else if (!dashboard) {
    body = (
      <LoadingState
        title="Cargando tu panel"
        description="Estamos preparando tu resumen, guardadas y matches."
      />
    );
  } else {
    body = <DashboardContent dashboard={dashboard} />;
  }

  return <SiteShell>{body}</SiteShell>;
}
