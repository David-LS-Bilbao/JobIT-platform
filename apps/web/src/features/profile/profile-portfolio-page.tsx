"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/features/auth/auth-context";
import { getMyProfile } from "@/features/profile/profile-api";
import { ProfilePortfolioView } from "@/features/profile/profile-portfolio-view";
import { isSessionExpiredError } from "@/lib/api-client";
import type { CandidateProfileDto } from "@/types/api";

type LoadError = "generic" | "expired";

/**
 * Portfolio JobIT CV (`/profile/portfolio`): vista privada de salida del CV,
 * lista para revisar o imprimir/guardar como PDF con el navegador. Reutiliza el
 * mismo guard/fetch que `/profile` y consume `GET /api/profile/me`.
 */
export function ProfilePortfolioPage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [profile, setProfile] = useState<CandidateProfileDto | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getMyProfile(accessToken)
      .then((data) => {
        if (!cancelled) setProfile(data);
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
        No se ha podido cargar tu portfolio. Inténtalo de nuevo.
      </p>
    );
  } else if (!profile) {
    body = <p className="text-sm text-slate-600">Cargando tu portfolio…</p>;
  } else {
    body = <ProfilePortfolioView profile={profile} />;
  }

  return (
    <SiteShell title="Portfolio JobIT CV" subtitle="Revisa e imprime tu CV tech.">
      {body}
    </SiteShell>
  );
}
