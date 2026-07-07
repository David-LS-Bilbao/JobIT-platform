"use client";

import Link from "next/link";

import { SENIORITY_LABELS, formatContractType, locationLabel } from "@/features/jobs/jobs-format";
import type { ProfileJobMatchDto } from "@/types/api";

import { MATCH_LEVEL_BADGE_CLASS, MATCH_LEVEL_BAR_CLASS, MATCH_LEVEL_LABELS, clampScore } from "./match-format";

/**
 * Tarjeta de match: oferta + puntuación básica explicable (score/level y skills
 * coincidentes/faltantes que devuelve el backend). No calcula score en cliente
 * ni inventa razones. El toggle de guardado lo gestiona el padre (reutiliza el
 * contrato de Saved Jobs con el `job.id`).
 */
export function MatchCard({
  match,
  saved,
  saving,
  onToggleSave
}: {
  match: ProfileJobMatchDto;
  saved: boolean;
  saving: boolean;
  onToggleSave: () => void;
}) {
  const { job, level, matchedSkills, missingSkills } = match;
  const score = clampScore(match.score);
  const levelLabel = MATCH_LEVEL_LABELS[level];
  const hasSkillSignal = matchedSkills.length > 0 || missingSkills.length > 0;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-900">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-slate-600">{job.company}</p>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          disabled={saving}
          aria-pressed={saved}
          // Durante la operación el texto visible es "…": nombre accesible real (17D.5).
          aria-label={saving ? (saved ? "Quitando de guardadas" : "Guardando oferta") : undefined}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            saved
              ? "border-jobit-brand bg-jobit-brand-soft text-jobit-brand hover:bg-jobit-brand-muted"
              : "border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {saving ? "…" : saved ? "Quitar" : "Guardar"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {locationLabel(job)} · {SENIORITY_LABELS[job.seniority]} · {formatContractType(job.contractType)}
      </p>

      {/* Score básico explicable: nivel + puntuación + barra (sin recálculo en cliente). */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${MATCH_LEVEL_BADGE_CLASS[level]}`}>
            Afinidad {levelLabel}
          </span>
          <span className="text-xs font-semibold text-slate-700">{score}/100</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Afinidad ${levelLabel}: ${score} de 100`}
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div className={`h-full rounded-full ${MATCH_LEVEL_BAR_CLASS[level]}`} style={{ width: `${score}%` }} />
        </div>
      </div>

      {matchedSkills.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600">Skills que coinciden</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {matchedSkills.slice(0, 8).map((skill, i) => (
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

      {missingSkills.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-semibold text-slate-600">Skills que podrías sumar</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {missingSkills.slice(0, 8).map((skill, i) => (
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
        <p className="mt-3 text-xs text-slate-500">
          El backend ordena esta oferta por una puntuación básica; añade skills a tu perfil para afinar el match.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-end">
        <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-jobit-brand hover:underline">
          Ver oferta →
        </Link>
      </div>
    </article>
  );
}
