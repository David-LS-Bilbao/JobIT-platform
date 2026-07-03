import { apiRequest } from "@/lib/api-client";
import type { JobFilters, JobPublicDto, JobsListResponse } from "@/types/api";

function toQueryString(filters: JobFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.location?.trim()) params.set("location", filters.location.trim());
  if (filters.remote) params.set("remote", filters.remote);
  if (filters.seniority) params.set("seniority", filters.seniority);
  if (filters.contractType) params.set("contractType", filters.contractType);
  if (filters.source) params.set("source", filters.source);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** `GET /api/jobs` (privado) → ofertas paginadas con filtros opcionales. */
export function getJobs(token: string, filters: JobFilters = {}): Promise<JobsListResponse> {
  return apiRequest<JobsListResponse>(`/api/jobs${toQueryString(filters)}`, { token });
}

/** `GET /api/jobs/:id` (privado) → detalle de oferta. Lanza `ApiClientError` 404 si no disponible. */
export function getJobById(token: string, id: string): Promise<JobPublicDto> {
  return apiRequest<JobPublicDto>(`/api/jobs/${encodeURIComponent(id)}`, { token });
}
