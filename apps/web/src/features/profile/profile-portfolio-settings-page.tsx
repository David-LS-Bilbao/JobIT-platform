"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/features/auth/auth-context";
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

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

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

  let body: ReactNode;
  if (loadError === "expired") {
    body = <p className="text-sm text-slate-600">Tu sesión ha caducado. Vuelve a iniciar sesión.</p>;
  } else if (!accessToken) {
    body = <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
  } else if (loadError === "generic") {
    body = (
      <p role="alert" className="text-sm text-red-600">
        No se ha podido cargar la publicación de tu portfolio. Inténtalo de nuevo.
      </p>
    );
  } else if (!settings) {
    body = <p className="text-sm text-slate-600">Cargando la publicación de tu portfolio…</p>;
  } else {
    body = <ProfilePortfolioSettings settings={settings} token={accessToken} />;
  }

  return (
    <SiteShell title="Publicación del portfolio" subtitle="Publica y comparte tu JobIT CV.">
      {body}
    </SiteShell>
  );
}
