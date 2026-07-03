"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
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
  }, [accessToken, clearSession, router]);

  async function handleToggleSave(jobId: string) {
    if (!accessToken || savingId) return;
    const isSaved = savedIds.has(jobId);
    setSavingId(jobId);
    try {
      if (isSaved) {
        await unsaveJob(accessToken, jobId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        await saveJob(accessToken, jobId);
        setSavedIds((prev) => new Set(prev).add(jobId));
      }
    } catch {
      // Silencioso: el estado no cambia si la operación falla.
    } finally {
      setSavingId(null);
    }
  }

  const body = (() => {
    if (!accessToken) return <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
    if (errored)
      return (
        <p role="alert" className="text-sm text-red-600">
          No se han podido calcular tus matches. Inténtalo de nuevo.
        </p>
      );
    if (matches === null) return <p className="text-sm text-slate-600">Calculando tus matches…</p>;
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
              className="inline-block rounded-lg bg-[#006591] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e]"
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
        <p className="text-xs text-slate-500">{matches.length} ofertas ordenadas por afinidad</p>
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
        {body}
      </div>
    </SiteShell>
  );
}
