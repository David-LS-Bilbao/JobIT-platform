"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { JobMatchDto } from "@/types/api";

import { getJobMatch } from "./match-api";
import {
  MATCH_FACTOR_LABELS,
  MATCH_LEVEL_BADGE_CLASS,
  MATCH_LEVEL_BAR_CLASS,
  MATCH_LEVEL_LABELS,
  clampScore,
  matchFactorState
} from "./match-format";

/**
 * Panel de match explicable para el detalle de oferta (`/jobs/[id]`).
 *
 * Autocontenido: carga `GET /api/jobs/:id/match` con el token y gestiona su propio
 * estado (carga/fallo/datos), de modo que un fallo del match NO rompe el detalle
 * de la oferta. No calcula score ni razones en cliente ni usa IA: solo presenta
 * lo que devuelve el backend (score, nivel, explicación, factores y skills).
 */
export function JobMatchPanel({ jobId, token }: { jobId: string; token: string }) {
  const [match, setMatch] = useState<JobMatchDto | null>(null);
  const [failed, setFailed] = useState(false);

  // El padre monta el panel con `key={jobId}`, así que el estado arranca limpio por
  // oferta y no hace falta resetear de forma síncrona dentro del efecto.
  useEffect(() => {
    let cancelled = false;
    getJobMatch(token, jobId)
      .then((data) => {
        if (!cancelled) setMatch(data);
      })
      .catch(() => {
        // Cualquier error (401/400/404/500) se degrada a un aviso suave; nunca se
        // filtra el detalle interno ni se rompe el resto de la página de detalle.
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, token]);

  const heading = (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Match con tu perfil</h2>
      <p className="mt-1 text-xs text-slate-500">
        Match básico y explicable basado en tu perfil JobIT CV. No usa IA avanzada ni decide por ti;
        solo compara datos de tu perfil con la oferta.
      </p>
    </div>
  );

  if (failed) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {heading}
        <p className="mt-3 text-sm text-slate-600">No hemos podido calcular el match de esta oferta ahora.</p>
      </section>
    );
  }

  if (!match) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-busy="true">
        {heading}
        <p className="mt-3 text-sm text-slate-600">Calculando tu match…</p>
      </section>
    );
  }

  const score = clampScore(match.score);
  const levelLabel = MATCH_LEVEL_LABELS[match.level];
  const factors = match.factors ?? [];
  const hasSkillSignal = match.matchedSkills.length > 0 || match.missingSkills.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {heading}

      {/* Score y nivel (del backend, sin recálculo). */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${MATCH_LEVEL_BADGE_CLASS[match.level]}`}>
            Afinidad {levelLabel}
          </span>
          <span className="text-sm font-semibold text-slate-700">{score}/100</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Afinidad ${levelLabel}: ${score} de 100`}
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div className={`h-full rounded-full ${MATCH_LEVEL_BAR_CLASS[match.level]}`} style={{ width: `${score}%` }} />
        </div>
      </div>

      {/* Explicación básica que devuelve el backend. */}
      {match.explanation ? <p className="mt-3 text-sm text-slate-700">{match.explanation}</p> : null}

      {/* Desglose por factores, si el backend los devuelve. */}
      {factors.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {factors.map((factor) => {
            const state = matchFactorState(factor.match);
            return (
              <li key={factor.name} className="flex items-start gap-2 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${state.dotClass}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-800">{MATCH_FACTOR_LABELS[factor.name]}</span>{" "}
                  <span className={`text-xs font-semibold ${state.textClass}`}>· {state.label}</span>
                  <span className="block text-slate-600">{factor.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">El backend devuelve una puntuación básica para esta oferta.</p>
      )}

      {match.matchedSkills.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600">Skills que coinciden</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {match.matchedSkills.map((skill, i) => (
              <li
                key={`m-${skill}-${i}`}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {match.missingSkills.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-semibold text-slate-600">Skills que podrías sumar</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {match.missingSkills.map((skill, i) => (
              <li
                key={`g-${skill}-${i}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasSkillSignal ? (
        <p className="mt-4 text-xs text-slate-500">
          Añade skills y preferencias a tu{" "}
          <Link href="/profile" className="font-medium text-jobit-brand hover:underline">
            perfil
          </Link>{" "}
          para afinar el match.
        </p>
      ) : null}
    </section>
  );
}
