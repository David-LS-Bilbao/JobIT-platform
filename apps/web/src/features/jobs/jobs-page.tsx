"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type SyntheticEvent } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/features/auth/auth-context";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { isSessionExpiredError } from "@/lib/api-client";
import type { JobContractType, JobFilters, JobPublicDto, JobRemoteFilter, JobSeniorityFilter } from "@/types/api";

import { getJobs } from "./jobs-api";
import { JobCard } from "./job-card";

const selectClass =
  "rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700 outline-none focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/30";

/** `/jobs`: listado privado de ofertas con filtros básicos y guardar/quitar. */
export function JobsPage() {
  const router = useRouter();
  const { accessToken, clearSession } = useAuth();

  const [filters, setFilters] = useState<JobFilters>({});
  const [qInput, setQInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [jobs, setJobs] = useState<JobPublicDto[] | null>(null);
  const [total, setTotal] = useState(0);
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
  }, [accessToken, filters, clearSession, router]);

  function applyFilter(patch: Partial<JobFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function handleSearch(event: SyntheticEvent) {
    event.preventDefault();
    applyFilter({ q: qInput.trim() || undefined, location: locationInput.trim() || undefined });
  }

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
          No se han podido cargar las ofertas. Inténtalo de nuevo.
        </p>
      );
    if (jobs === null) return <p className="text-sm text-slate-600">Cargando ofertas…</p>;
    if (jobs.length === 0)
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">No hay ofertas que coincidan con tu búsqueda.</p>
        </div>
      );
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">{total} ofertas</p>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            saved={savedIds.has(job.id)}
            saving={savingId === job.id}
            onToggleSave={() => handleToggleSave(job.id)}
          />
        ))}
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
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/30"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Buscar por título o descripción…"
            />
            <input
              aria-label="Ubicación"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/30 sm:max-w-56"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Ubicación (ciudad)"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[#006591] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e]"
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

        {body}
      </div>
    </SiteShell>
  );
}
