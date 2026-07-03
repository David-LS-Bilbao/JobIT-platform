import { apiRequest } from "@/lib/api-client";
import type { ProfileJobMatchDto } from "@/types/api";

/** Nº de matches que pide la UI por defecto (el backend admite hasta 50). */
export const DEFAULT_MATCH_LIMIT = 20;

/**
 * `GET /api/profile/me/matches` (privado) → mejores ofertas para el candidato
 * autenticado, ya ordenadas por `score` descendente en el backend. La respuesta
 * viaja envuelta en `{ data }`. `limit` es opcional (backend: default 10, máx 50).
 * Los errores (401/400/500) se propagan como `ApiClientError` y los gestiona la UI.
 */
export async function getJobMatches(
  token: string,
  limit: number = DEFAULT_MATCH_LIMIT
): Promise<ProfileJobMatchDto[]> {
  const qs = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  const res = await apiRequest<{ data: ProfileJobMatchDto[] }>(`/api/profile/me/matches${qs}`, {
    token
  });
  return res.data;
}
