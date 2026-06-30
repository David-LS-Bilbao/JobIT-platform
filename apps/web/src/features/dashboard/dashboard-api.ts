/**
 * Helper del Dashboard del candidato (Sprint 07).
 * `GET /api/dashboard/me` (Bearer) → CandidateDashboardDto (respuesta bare).
 */
import { apiRequest } from "@/lib/api-client";
import type { CandidateDashboardDto } from "@/types/api";

export function getCandidateDashboard(token: string): Promise<CandidateDashboardDto> {
  return apiRequest<CandidateDashboardDto>("/api/dashboard/me", { method: "GET", token });
}
