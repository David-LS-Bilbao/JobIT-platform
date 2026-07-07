"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { getMyProfile } from "@/features/profile/profile-api";
import { ProfileContent } from "@/features/profile/profile-content";
import { isSessionExpiredError } from "@/lib/api-client";
import type { CandidateProfileDto } from "@/types/api";

type LoadError = "generic" | "expired";

/** JobIT CV (`/profile`): vista + edición de datos básicos del perfil tech vivo. */
export function ProfilePage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [profile, setProfile] = useState<CandidateProfileDto | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  // Reintento manual (17D.4): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);

  // Guard: sin sesión en memoria (p. ej. tras recargar) → login.
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
  }, [accessToken, reloadKey, clearSession, router]);

  function handleRetry() {
    setLoadError(null);
    setProfile(null);
    setReloadKey((key) => key + 1);
  }

  let body: ReactNode;
  if (loadError === "expired") {
    body = <p className="text-sm text-slate-600">Tu sesión ha caducado. Vuelve a iniciar sesión.</p>;
  } else if (!accessToken) {
    body = <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
  } else if (loadError === "generic") {
    body = (
      <ErrorState
        title="No se ha podido cargar tu JobIT CV."
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={handleRetry}
      />
    );
  } else if (!profile) {
    body = (
      <LoadingState
        title="Cargando tu JobIT CV"
        description="Estamos recuperando tu perfil, skills, experiencia y proyectos."
      />
    );
  } else {
    body = <ProfileContent profile={profile} token={accessToken} />;
  }

  return (
    <SiteShell title="JobIT CV" subtitle="Construye tu perfil tech vivo.">
      {body}
    </SiteShell>
  );
}
