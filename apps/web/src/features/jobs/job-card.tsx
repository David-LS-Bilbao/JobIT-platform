"use client";

import Link from "next/link";

import type { JobPublicDto } from "@/types/api";

import {
  JOB_SOURCE_LABELS,
  SENIORITY_LABELS,
  formatContractType,
  formatPostedDate,
  formatSalary,
  locationLabel
} from "./jobs-format";

/** Tarjeta de oferta para el listado. El toggle de guardado lo gestiona el padre. */
export function JobCard({
  job,
  saved,
  saving,
  onToggleSave
}: {
  job: JobPublicDto;
  saved: boolean;
  saving: boolean;
  onToggleSave: () => void;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);

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
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            saved
              ? "border-[#006591] bg-[#eff4ff] text-[#006591] hover:bg-[#dce9ff]"
              : "border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {saving ? "…" : saved ? "Quitar" : "Guardar"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {locationLabel(job)} · {SENIORITY_LABELS[job.seniority]} · {formatContractType(job.contractType)}
      </p>

      {salary ? <p className="mt-1 text-sm font-medium text-slate-700">{salary}</p> : null}

      {job.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 6).map((tag, i) => (
            <li
              key={`${tag}-${i}`}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400">
          Fuente: {JOB_SOURCE_LABELS[job.source]}
          {job.postedAt ? ` · ${formatPostedDate(job.postedAt)}` : ""}
        </span>
        <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-[#006591] hover:underline">
          Ver detalle →
        </Link>
      </div>
    </article>
  );
}
