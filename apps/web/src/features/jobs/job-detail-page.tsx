"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { JobMatchPanel } from "@/features/match/job-match-panel";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { ApiClientError, isSessionExpiredError } from "@/lib/api-client";
import type { JobPublicDto } from "@/types/api";

import { getJobById } from "./jobs-api";
import {
  JOB_SOURCE_LABELS,
  externalSourceCtaLabel,
  formatPostedDate,
  formatSalary,
  isSafeExternalUrl,
  jobMetadataLabel
} from "./jobs-format";

type LoadError = "notfound" | "generic";

/** `/jobs/[id]`: detalle privado de una oferta con guardar/quitar y enlace externo. */
export function JobDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [job, setJob] = useState<JobPublicDto | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );
  // Reintento manual (17D.3): incrementarlo relanza la carga de la oferta.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getJobById(accessToken, id)
      .then((data) => {
        if (!cancelled) {
          setJob(data);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isSessionExpiredError(err)) {
          clearSession();
          router.push("/login");
          return;
        }
        setLoadError(err instanceof ApiClientError && err.status === 404 ? "notfound" : "generic");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id, reloadKey, clearSession, router]);

  function handleRetry() {
    setLoadError(null);
    setJob(null);
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getSavedJobs(accessToken)
      .then((list) => {
        if (!cancelled) setSaved(list.some((s) => s.job.id === id));
      })
      .catch(() => {
        // Sin datos de guardadas: el botón muestra "Guardar" por defecto.
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  async function handleToggleSave() {
    if (!accessToken || saving) return;
    setSaving(true);
    setActionMsg(null);
    try {
      if (saved) {
        await unsaveJob(accessToken, id);
        setSaved(false);
        setActionMsg({ kind: "success", text: "Oferta quitada de guardadas." });
      } else {
        await saveJob(accessToken, id);
        setSaved(true);
        setActionMsg({ kind: "success", text: "Oferta guardada." });
      }
    } catch {
      // 17D.3: sin fallos silenciosos — se comunica el error (el estado no cambia).
      setActionMsg({
        kind: "error",
        text: saved
          ? "No se ha podido quitar la oferta. Inténtalo de nuevo."
          : "No se ha podido guardar la oferta. Inténtalo de nuevo."
      });
    } finally {
      setSaving(false);
    }
  }

  let body;
  if (!accessToken) {
    body = <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
  } else if (loadError === "notfound") {
    body = (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Oferta no disponible</h1>
        <p className="mt-2 text-sm text-slate-600">Esta oferta no existe o ya no está activa.</p>
        <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-jobit-brand hover:underline">
          ← Volver a ofertas
        </Link>
      </div>
    );
  } else if (loadError === "generic") {
    body = (
      <ErrorState
        title="No se ha podido cargar la oferta."
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={handleRetry}
      />
    );
  } else if (!job) {
    body = (
      <LoadingState
        title="Cargando oferta"
        description="Estamos recuperando el detalle de la oportunidad."
      />
    );
  } else {
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    body = (
      <div className="space-y-6">
        <Link href="/jobs" className="text-sm font-medium text-jobit-brand hover:underline">
          ← Volver a ofertas
        </Link>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
              <p className="text-base font-medium text-slate-600">{job.company}</p>
            </div>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              aria-pressed={saved}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                saved
                  ? "border-jobit-brand bg-jobit-brand-soft text-jobit-brand hover:bg-jobit-brand-muted"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {saving ? "…" : saved ? "Quitar de guardadas" : "Guardar oferta"}
            </button>
          </div>

          {actionMsg ? (
            actionMsg.kind === "error" ? (
              <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                {actionMsg.text}
              </p>
            ) : (
              <p role="status" className="mt-2 text-sm font-medium text-emerald-700">
                {actionMsg.text}
              </p>
            )
          ) : null}

          <p className="mt-2 text-sm text-slate-500">{jobMetadataLabel(job)}</p>
          {salary ? <p className="mt-1 text-base font-semibold text-slate-800">{salary}</p> : null}
          <p className="mt-1 text-xs text-slate-400">
            Fuente: {JOB_SOURCE_LABELS[job.source]}
            {job.postedAt ? ` · Publicada el ${formatPostedDate(job.postedAt)}` : ""}
          </p>

          {job.description ? (
            <section className="mt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Descripción</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{job.description}</p>
            </section>
          ) : null}

          {job.requirements.length > 0 ? (
            <section className="mt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Requisitos</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                {job.requirements.map((req, i) => (
                  <li key={`${req}-${i}`}>{req}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.tags.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {job.tags.map((tag, i) => (
                <li
                  key={`${tag}-${i}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {isSafeExternalUrl(job.sourceUrl) ? (
            <a
              href={job.sourceUrl as string}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-lg bg-jobit-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
            >
              {externalSourceCtaLabel(job.source)}
            </a>
          ) : (
            // Sin enlace externo usable: aviso honesto según procedencia (no CTA engañoso).
            <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {job.source === "INTERNAL"
                ? "Oferta de ejemplo para el MVP. No tiene enlace externo de inscripción."
                : "Esta oferta no incluye un enlace externo de inscripción."}
            </p>
          )}
        </article>

        {/* Panel de match explicable: autocontenido; su fallo no rompe el detalle.
            `key={id}` lo remonta con estado limpio al navegar a otra oferta. */}
        {accessToken ? <JobMatchPanel key={id} jobId={id} token={accessToken} /> : null}
      </div>
    );
  }

  return (
    <SiteShell title="Oferta" subtitle="Detalle de la oferta.">
      {body}
    </SiteShell>
  );
}
