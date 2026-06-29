import type { ProfileJobMatchDto } from "../match/match.types.js";
import type { SavedJobDto } from "../saved-jobs/saved-jobs.service.js";

/**
 * DTOs del Candidate Dashboard (Sprint 06). El dashboard es un agregador de solo
 * lectura: reutiliza los contratos públicos ya estabilizados de Saved Jobs
 * (`SavedJobDto`, que embebe `JobPublicDto`) y Match (`ProfileJobMatchDto`), por
 * lo que nunca expone `externalId`/`ingestedAt` ni secretos de Auth.
 */

/** Cabecera del candidato + completitud (reutiliza el cálculo de Profile/CV). */
export interface DashboardProfileDto {
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  /** Entero 0..100, coherente con `GET /api/profile/me` (no `completeness`). */
  completionPercentage: number;
}

/** Resumen de guardadas: total real + las más recientes (máx 3, savedAt desc). */
export interface DashboardSavedJobsDto {
  total: number;
  recent: SavedJobDto[];
}

/** Sugerencia orientativa de navegación. No es evaluación ni ranking. */
export interface DashboardNextAction {
  action: string;
  label: string;
}

export interface CandidateDashboardDto {
  profile: DashboardProfileDto;
  skills: string[];
  savedJobs: DashboardSavedJobsDto;
  matches: ProfileJobMatchDto[];
  nextActions: DashboardNextAction[];
}
