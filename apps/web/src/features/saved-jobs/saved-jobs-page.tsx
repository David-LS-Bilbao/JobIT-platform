"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
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
  const [actionMsg, setActionMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );
  // Reintento manual (17D.3): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [accessToken, reloadKey, clearSession, router]);

  function handleRetry() {
    setErrored(false);
    setItems(null);
    setReloadKey((key) => key + 1);
  }

  async function handleRemove(jobId: string) {
    if (!accessToken || removingId) return;
    setRemovingId(jobId);
    setActionMsg(null);
    try {
      await unsaveJob(accessToken, jobId);
      setItems((prev) => (prev ? prev.filter((item) => item.job.id !== jobId) : prev));
      setActionMsg({ kind: "success", text: "Oferta quitada de guardadas." });
    } catch {
      // 17D.3: sin fallos silenciosos — la oferta permanece y se comunica el error.
      setActionMsg({
        kind: "error",
        text: "No se ha podido quitar la oferta. Inténtalo de nuevo."
      });
    } finally {
      setRemovingId(null);
    }
  }

  let body;
  if (!accessToken) {
    body = <p className="text-sm text-slate-600">Redirigiendo al login…</p>;
  } else if (errored) {
    body = (
      <ErrorState
        title="No se han podido cargar tus ofertas guardadas."
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={handleRetry}
      />
    );
  } else if (items === null) {
    body = (
      <LoadingState
        title="Cargando ofertas guardadas"
        description="Estamos recuperando tus oportunidades seleccionadas."
      />
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        title="Aún no has guardado ninguna oferta."
        actionHref="/jobs"
        actionLabel="Explorar ofertas"
      />
    );
  } else {
    body = (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          {items.length === 1 ? "1 guardada" : `${items.length} guardadas`}
        </p>
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
      <div className="space-y-4">
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
