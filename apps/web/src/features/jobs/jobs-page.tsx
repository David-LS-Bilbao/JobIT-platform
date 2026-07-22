"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { redirectOnMissingSession, redirectToLogin } from "@/features/auth/auth-navigation";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { isSessionExpiredError } from "@/lib/api-client";
import type { JobContractType, JobFilters, JobPublicDto, JobRemoteFilter, JobSeniorityFilter } from "@/types/api";

import { getJobs } from "./jobs-api";
import { JobCard } from "./job-card";

const selectClass =
  "rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700 outline-none focus:border-jobit-brand focus:ring-2 focus:ring-jobit-brand/30";

/** Feedback local de guardar/quitar (17D.3): error visible, éxito anunciado. */
type ActionMsg = { kind: "success" | "error"; text: string };

/** `/jobs`: listado privado de ofertas con filtros básicos y guardar/quitar. */
export function JobsPage() {
  const router = useRouter();
  const { accessToken, clearSession, endReason } = useAuth();

  const [filters, setFilters] = useState<JobFilters>({});
  const [qInput, setQInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [jobs, setJobs] = useState<JobPublicDto[] | null>(null);
  const [total, setTotal] = useState(0);
  // Página/limit confirmados por la última respuesta (JOBS-01): el limit lo
  // decide la API (no se hardcodea) y la página se protege a 1..totalPages.
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 0 });
  const [errored, setErrored] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<ActionMsg | null>(null);
  // Reintento manual (17D.3): incrementarlo relanza el efecto de carga.
  const [reloadKey, setReloadKey] = useState(0);
  // Inicio de resultados (contador) para el retorno tras paginar (21B.3).
  const resultsStartRef = useRef<HTMLParagraphElement | null>(null);
  // Navegación paginada pendiente de retorno al listado. No es estado React:
  // no afecta al render, solo al efecto de scroll post-respuesta.
  const pendingPaginationScrollRef = useRef(false);

  useEffect(() => {
    if (!accessToken) redirectOnMissingSession(router, endReason);
  }, [accessToken, endReason, router]);

  // Ofertas guardadas (una vez) para reflejar el estado del toggle en las cards.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getSavedJobs(accessToken)
      .then((saved) => {
        if (!cancelled) setSavedIds(new Set(saved.map((s) => s.job.id)));
      })
      .catch(() => {
        // Si falla, las cards muestran "Guardar" por defecto; no bloquea el listado.
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Listado (re-fetch al cambiar filtros). El estado de carga se deriva de `jobs === null`.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getJobs(accessToken, filters)
      .then((res) => {
        if (cancelled) return;
        setJobs(res.data);
        setTotal(res.total);
        setPageInfo({ page: res.page, limit: res.limit });
        setErrored(false);
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
  }, [accessToken, filters, reloadKey, clearSession, router]);

  function handleRetry() {
    setErrored(false);
    setJobs(null);
    setReloadKey((key) => key + 1);
  }

  function applyFilter(patch: Partial<JobFilters>) {
    // Cambiar filtros no desplaza: se anula cualquier retorno paginado pendiente.
    pendingPaginationScrollRef.current = false;
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.location || filters.remote || filters.seniority || filters.contractType
  );

  // Derivados de paginación (JOBS-01). safeLimit evita divisiones inválidas si
  // la API devolviera un limit no positivo; nunca se hardcodea el 20 por defecto.
  const safeLimit = pageInfo.limit > 0 ? pageInfo.limit : 1;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const currentPage = Math.min(Math.max(pageInfo.page, 1), totalPages);

  function handlePageChange(requested: number) {
    const bounded = Math.min(Math.max(requested, 1), totalPages);
    if (bounded === currentPage) return;
    // Feedback inmediato: LoadingState (jobs === null) retira listado y nav
    // durante la transición, con lo que las pulsaciones repetidas son inocuas.
    pendingPaginationScrollRef.current = true;
    setJobs(null);
    // Solo cambia `page`; el efecto centralizado relanza la petición con todos
    // los filtros intactos (y el retry conserva la página por el mismo motivo).
    setFilters((previous) => ({ ...previous, page: bounded }));
  }

  // Retorno al inicio de resultados tras una paginación exitosa (21B.3/21B.4):
  // solo cuando hay navegación pendiente y la página nueva ya está renderizada.
  // Restaura el contexto del usuario de teclado (los controles desaparecieron
  // durante el LoadingState) enfocando el contador sin desplazar, y después
  // ejecuta el retorno visual. Un fallo conserva el pendiente (el retry exitoso
  // completa ambos efectos); los handlers de filtros lo limpian. Sin smooth.
  useEffect(() => {
    if (jobs === null) return;
    if (!pendingPaginationScrollRef.current) return;
    pendingPaginationScrollRef.current = false;
    const node = resultsStartRef.current;
    node?.focus({ preventScroll: true });
    node?.scrollIntoView?.({ behavior: "auto", block: "start" });
  }, [jobs]);

  function handleClearFilters() {
    pendingPaginationScrollRef.current = false;
    setQInput("");
    setLocationInput("");
    setJobs(null);
    setFilters({});
  }

  function handleSearch(event: SyntheticEvent) {
    event.preventDefault();
    applyFilter({ q: qInput.trim() || undefined, location: locationInput.trim() || undefined });
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
      // 17D.3: sin fallos silenciosos — se comunica el error (el estado no cambia).
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
          title="No se han podido cargar las ofertas."
          description="Revisa tu conexión e inténtalo de nuevo."
          onRetry={handleRetry}
        />
      );
    if (jobs === null)
      return (
        <LoadingState
          title="Cargando ofertas"
          description="Estamos preparando las oportunidades disponibles para tu perfil."
        />
      );
    if (jobs.length === 0)
      return (
        <EmptyState title="No hay ofertas que coincidan con tu búsqueda.">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 inline-block rounded-lg bg-jobit-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
            >
              Limpiar filtros
            </button>
          ) : null}
        </EmptyState>
      );
    return (
      <div className="space-y-4">
        {/* Foco programático tras paginar (21B.4): fuera de la tabulación normal. */}
        <p ref={resultsStartRef} tabIndex={-1} className="text-xs text-slate-500">
          {total === 1 ? "1 oferta" : `${total} ofertas`}
        </p>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            saved={savedIds.has(job.id)}
            saving={savingId === job.id}
            onToggleSave={() => handleToggleSave(job.id)}
          />
        ))}
        {totalPages > 1 ? (
          <nav
            aria-label="Paginación de ofertas"
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              ← Anterior
            </button>
            <span role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              Siguiente →
            </button>
          </nav>
        ) : null}
      </div>
    );
  })();

  return (
    <SiteShell title="Ofertas tech" subtitle="Encuentra tu próxima oportunidad.">
      <div className="space-y-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Buscar ofertas"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-jobit-brand focus:ring-2 focus:ring-jobit-brand/30"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Buscar por título o descripción…"
            />
            <input
              aria-label="Ubicación"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-jobit-brand focus:ring-2 focus:ring-jobit-brand/30 sm:max-w-56"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Ubicación (ciudad)"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-jobit-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
            >
              Buscar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <select
              aria-label="Modalidad"
              className={selectClass}
              value={filters.remote ?? ""}
              onChange={(e) => applyFilter({ remote: (e.target.value || undefined) as JobRemoteFilter | undefined })}
            >
              <option value="">Modalidad</option>
              <option value="REMOTE">Remoto</option>
              <option value="HYBRID">Híbrido</option>
              <option value="ON_SITE">Presencial</option>
            </select>
            <select
              aria-label="Seniority"
              className={selectClass}
              value={filters.seniority ?? ""}
              onChange={(e) => applyFilter({ seniority: (e.target.value || undefined) as JobSeniorityFilter | undefined })}
            >
              <option value="">Seniority</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
            <select
              aria-label="Contrato"
              className={selectClass}
              value={filters.contractType ?? ""}
              onChange={(e) => applyFilter({ contractType: (e.target.value || undefined) as JobContractType | undefined })}
            >
              <option value="">Contrato</option>
              <option value="FULL_TIME">Jornada completa</option>
              <option value="PART_TIME">Media jornada</option>
              <option value="CONTRACT">Contrato</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>
        </form>

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
