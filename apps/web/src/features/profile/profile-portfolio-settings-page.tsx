"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { redirectToLogin } from "@/features/auth/auth-navigation";
import { useSessionGuard } from "@/features/auth/use-session-guard";
import { getMyPortfolioSettings } from "@/features/profile/profile-api";
import { ProfilePortfolioSettings } from "@/features/profile/profile-portfolio-settings";
import { isSessionExpiredError } from "@/lib/api-client";
import type { PortfolioSettingsDto } from "@/types/api";

type LoadError = "generic" | "expired";

/**
 * `/profile/portfolio/settings`: gestión privada de publicación del portfolio
 * (JobIT Portfolio V1). Reutiliza el guard/fetch del resto de la zona privada y
 * consume los endpoints `/api/profile/me/portfolio`.
 */
export function ProfilePortfolioSettingsPage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [settings, setSettings] = useState<PortfolioSettingsDto | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  // Reintento manual (17D.4): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);

  // Guarda unica de ruta privada (ADR-0014): distingue arranque, sesion terminal
  // y fallo transitorio, de modo que ni se redirige durante el bootstrap ni se
  // trata un error de infraestructura como sesion invalida.
  const sessionGuard = useSessionGuard(router);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getMyPortfolioSettings(accessToken)
      .then((data) => {
        if (!cancelled) setSettings(data);
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
    setSettings(null);
    setReloadKey((key) => key + 1);
  }

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
        title="No se ha podido cargar la publicación de tu portfolio."
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={handleRetry}
      />
    );
  } else if (!settings) {
    body = (
      <LoadingState
        title="Cargando la publicación de tu portfolio"
        description="Estamos preparando el estado de tu página pública."
      />
    );
  } else {
    body = <ProfilePortfolioSettings settings={settings} token={sessionGuard.accessToken} />;
  }

  return (
    <SiteShell title="Publicación del portfolio" subtitle="Publica y comparte tu JobIT CV.">
      {body}
    </SiteShell>
  );
}
