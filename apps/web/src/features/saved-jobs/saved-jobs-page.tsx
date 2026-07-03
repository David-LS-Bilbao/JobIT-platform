"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/features/auth/auth-context";
import { JobCard } from "@/features/jobs/job-card";
import { isSessionExpiredError } from "@/lib/api-client";
import type { SavedJobDto } from "@/types/api";

import { getSavedJobs, unsaveJob } from "./saved-jobs-api";

/** `/saved-jobs`: listado privado de ofertas guardadas, con quitar y estado vacío. */
export function SavedJobsPage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [items, setItems] = useState<SavedJobDto[] | null>(null);
  const [errored, setErrored] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  // El estado de carga se deriva de `items === null` (evita setState síncrono en el efecto).
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getSavedJobs(accessToken)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
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

  async function handleRemove(jobId: string) {
    if (!accessToken || removingId) return;
    setRemovingId(jobId);
    try {
      await unsaveJob(accessToken, jobId);
      setItems((prev) => (prev ? prev.filter((item) => item.job.id !== jobId) : prev));
    } catch {
      // Silencioso: si falla, la oferta permanece en la lista.
    } finally {
      setRemovingId(null);
    }
  }

  let body;
  if (!accessToken) {
    body = <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
  } else if (errored) {
    body = (
      <p role="alert" className="text-sm text-red-600">
        No se han podido cargar tus ofertas guardadas. Inténtalo de nuevo.
      </p>
    );
  } else if (items === null) {
    body = <p className="text-sm text-slate-600">Cargando ofertas guardadas…</p>;
  } else if (items.length === 0) {
    body = (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">Aún no has guardado ninguna oferta.</p>
        <Link
          href="/jobs"
          className="mt-4 inline-block rounded-lg bg-[#006591] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e]"
        >
          Explorar ofertas
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">{items.length} guardadas</p>
        {items.map((item) => (
          <JobCard
            key={item.job.id}
            job={item.job}
            saved
            saving={removingId === item.job.id}
            onToggleSave={() => handleRemove(item.job.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <SiteShell title="Ofertas guardadas" subtitle="Tus oportunidades favoritas.">
      {body}
    </SiteShell>
  );
}
