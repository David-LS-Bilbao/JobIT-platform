"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { isSessionExpiredError } from "@/lib/api-client";
import type { ProfileJobMatchDto } from "@/types/api";

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

  const [matches, setMatches] = useState<ProfileJobMatchDto[] | null>(null);
  const [errored, setErrored] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );
  // Reintento manual (17D.5): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

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

  // Matches. El estado de carga se deriva de `matches === null`.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getJobMatches(accessToken)
      .then((data) => {
        if (cancelled) return;
        setMatches(data);
        setErrored(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isSessionExpiredError(err)) {
          clearSession();
          router.push("/login");
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
    if (!accessToken) return <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
    if (errored)
      return (
        <ErrorState
          title="No se han podido calcular tus matches."
          description="Revisa tu conexión e inténtalo de nuevo."
          onRetry={handleRetry}
        />
      );
    if (matches === null)
      return (
        <LoadingState
          title="Calculando tus matches"
          description="Estamos calculando las ofertas que mejor encajan con tu perfil."
        />
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
        <p className="text-xs text-slate-500">
          {matches.length === 1
            ? "1 oferta ordenada por afinidad"
            : `${matches.length} ofertas ordenadas por afinidad`}
        </p>
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
            ofertas con una puntuación basada en reglas visibles (skills, modalidad, seniority y ubicación).
            No usa inteligencia artificial ni modelos opacos: es orientativa y no evalúa tu valía.
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
