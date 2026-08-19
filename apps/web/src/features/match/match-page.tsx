"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { redirectToLogin } from "@/features/auth/auth-navigation";
import { useSessionGuard } from "@/features/auth/use-session-guard";
import { getMyProfile } from "@/features/profile/profile-api";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { isSessionExpiredError } from "@/lib/api-client";
import type { CandidateProfileDto, ProfileJobMatchDto } from "@/types/api";

import { getJobMatches } from "./match-api";
import { MatchCard } from "./match-card";

/**
 * `/match`: JobIT Match básico y explicable. Lista las mejores ofertas para el
 * candidato autenticado (`GET /api/profile/me/matches`), ya ordenadas por score
 * en el backend. No calcula score ni razones en cliente ni usa IA: solo pinta
 * lo que devuelve el backend. Reutiliza el guard de auth, los estados y el
 * guardar/quitar de Jobs/Saved Jobs.
 */
export function MatchPage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [profile, setProfile] = useState<CandidateProfileDto | null>(null);
  const [matches, setMatches] = useState<ProfileJobMatchDto[] | null>(null);
  const [errored, setErrored] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );
  // Reintento manual (17D.5): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);

  // Guarda unica de ruta privada (ADR-0014): distingue arranque, sesion terminal
  // y fallo transitorio, de modo que ni se redirige durante el bootstrap ni se
  // trata un error de infraestructura como sesion invalida.
  const sessionGuard = useSessionGuard(router);

  // Ofertas guardadas (una vez) para reflejar el estado del toggle en las cards.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getSavedJobs(accessToken)
      .then((saved) => {
        if (!cancelled) setSavedIds(new Set(saved.map((s) => s.job.id)));
      })
      .catch(() => {
        // Si falla, las cards muestran "Guardar" por defecto; no bloquea la lista.
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Perfil y matches son necesarios para decidir la presentación (guía vs lista):
  // se cargan en paralelo (dos efectos) y el estado de carga se deriva de que
  // cualquiera siga en `null`. Un fallo de cualquiera marca `errored`; "Reintentar"
  // relanza ambos (reloadKey). No se muestra la lista si el perfil se desconoce.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getMyProfile(accessToken)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isSessionExpiredError(err)) {
          clearSession("expired");
          redirectToLogin(router, "expired");
          return;
        }
        setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey, clearSession, router]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getJobMatches(accessToken)
      .then((data) => {
        if (!cancelled) setMatches(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isSessionExpiredError(err)) {
          clearSession("expired");
          redirectToLogin(router, "expired");
          return;
        }
        setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey, clearSession, router]);

  function handleRetry() {
    setErrored(false);
    setProfile(null);
    setMatches(null);
    setReloadKey((key) => key + 1);
  }

  async function handleToggleSave(jobId: string) {
    if (!accessToken || savingId) return;
    const isSaved = savedIds.has(jobId);
    setSavingId(jobId);
    setActionMsg(null);
    try {
      if (isSaved) {
        await unsaveJob(accessToken, jobId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setActionMsg({ kind: "success", text: "Oferta quitada de guardadas." });
      } else {
        await saveJob(accessToken, jobId);
        setSavedIds((prev) => new Set(prev).add(jobId));
        setActionMsg({ kind: "success", text: "Oferta guardada." });
      }
    } catch {
      // 17D.5: sin fallos silenciosos — se comunica el error (el estado no cambia).
      setActionMsg({
        kind: "error",
        text: isSaved
          ? "No se ha podido quitar la oferta. Inténtalo de nuevo."
          : "No se ha podido guardar la oferta. Inténtalo de nuevo."
      });
    } finally {
      setSavingId(null);
    }
  }

  const body = (() => {
    if (sessionGuard.state === "unavailable") {
      return (
        <ErrorState
          title="No se ha podido verificar tu sesión."
          description="No hemos podido comprobar si tu sesión sigue activa. Revisa tu conexión e inténtalo de nuevo."
          onRetry={sessionGuard.retry}
        />
      );
    }
    if (sessionGuard.state !== "ready") {
      return <p className="text-sm text-slate-600">Comprobando tu sesión…</p>;
    }
    if (errored)
      return (
        <ErrorState
          title="No se han podido calcular tus matches."
          description="Revisa tu conexión e inténtalo de nuevo."
          onRetry={handleRetry}
        />
      );
    if (profile === null || matches === null)
      return (
        <LoadingState
          title="Calculando tus matches"
          description="Estamos calculando las ofertas que mejor encajan con tu perfil."
        />
      );
    // MATCH-01: sin skills en el perfil, el backend igualmente puntúa ofertas a
    // 0/100; en vez de listarlas, se guía a completar el perfil.
    if (profile.skills.length === 0)
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="text-base font-semibold text-slate-800">
            Añade skills para calcular tu afinidad
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            El match usa las skills de tu JobIT CV. Añádelas para ordenar las ofertas por afinidad.
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/profile"
              className="inline-block rounded-lg bg-jobit-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
            >
              Añadir skills al JobIT CV
            </Link>
          </div>
        </div>
      );
    if (matches.length === 0)
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">
            Todavía no hay ofertas con afinidad para tu perfil.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Añade skills y preferencias a tu perfil para mejorar tus resultados.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/profile"
              className="inline-block rounded-lg bg-jobit-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
            >
              Completar perfil
            </Link>
            <Link
              href="/jobs"
              className="inline-block rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Explorar ofertas
            </Link>
          </div>
        </div>
      );
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500">
            {matches.length === 1
              ? "1 oferta ordenada por afinidad"
              : `${matches.length} ofertas ordenadas por afinidad`}
          </p>
          {/* MATCH-04: aclara el alcance de la afinidad (una vez, no por tarjeta). */}
          <p className="mt-1 text-xs text-slate-600">
            La afinidad es orientativa: no es una nota ni garantiza avanzar en el proceso.
          </p>
        </div>
        {matches.map((match) => (
          <MatchCard
            key={match.job.id}
            match={match}
            saved={savedIds.has(match.job.id)}
            saving={savingId === match.job.id}
            onToggleSave={() => handleToggleSave(match.job.id)}
          />
        ))}
      </div>
    );
  })();

  return (
    <SiteShell title="JobIT Match" subtitle="Tus ofertas con más afinidad, explicadas.">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p>
            <span className="font-semibold text-slate-800">Match básico y explicable.</span> Ordenamos las
            ofertas con una ponderación básica y fija, sin IA: reglas visibles (skills, seniority, modalidad
            y ubicación). No usa inteligencia artificial ni modelos opacos: es orientativa y no evalúa tu valía.
          </p>
          <p className="mt-2 font-medium text-slate-700">
            Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%
          </p>
        </div>
        {actionMsg ? (
          actionMsg.kind === "error" ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {actionMsg.text}
            </p>
          ) : (
            <p role="status" className="text-sm font-medium text-emerald-700">
              {actionMsg.text}
            </p>
          )
        ) : null}
        {body}
      </div>
    </SiteShell>
  );
}
