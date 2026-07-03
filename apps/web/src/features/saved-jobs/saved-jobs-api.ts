import { apiRequest } from "@/lib/api-client";
import type { SavedJobDto } from "@/types/api";

/** `GET /api/saved-jobs` (privado) → ofertas guardadas del usuario. */
export async function getSavedJobs(token: string): Promise<SavedJobDto[]> {
  const res = await apiRequest<{ data: SavedJobDto[] }>("/api/saved-jobs", { token });
  return res.data;
}

/** `POST /api/saved-jobs/:jobId` (privado) → guarda la oferta (idempotente). */
export async function saveJob(token: string, jobId: string): Promise<void> {
  await apiRequest<unknown>(`/api/saved-jobs/${encodeURIComponent(jobId)}`, { method: "POST", token });
}

/** `DELETE /api/saved-jobs/:jobId` (privado) → quita la oferta guardada (204). */
export async function unsaveJob(token: string, jobId: string): Promise<void> {
  await apiRequest<unknown>(`/api/saved-jobs/${encodeURIComponent(jobId)}`, { method: "DELETE", token });
}
