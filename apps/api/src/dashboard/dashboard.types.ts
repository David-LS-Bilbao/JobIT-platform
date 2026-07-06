import type { ProfileJobMatchDto } from "../match/match.types.js";
import type { ProfileSectionFlags } from "../profile/profile.service.js";
import type { SavedJobDto } from "../saved-jobs/saved-jobs.service.js";

/**
 * DTOs del Candidate Dashboard (Sprint 06; contrato ampliado en Sprint 17C de
 * forma aditiva). El dashboard es un agregador de solo lectura: reutiliza los
 * contratos públicos ya estabilizados de Saved Jobs (`SavedJobDto`, que embebe
 * `JobPublicDto`) y Match (`ProfileJobMatchDto`), por lo que nunca expone
 * `externalId`/`ingestedAt` ni secretos de Auth.
 */

/** Cabecera del candidato + completitud (reutiliza el cálculo de Profile/CV). */
export interface DashboardProfileDto {
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  /** Entero 0..100, coherente con `GET /api/profile/me` (no `completeness`). */
  completionPercentage: number;
  /** Resumen profesional del CV; null si el candidato no lo ha escrito (17C). */
  summary: string | null;
  /** Avatar del candidato (URL pública o ruta `/uploads/...`); null si no hay (17C). */
  avatarUrl: string | null;
}

/**
 * Flags reales por sección del CV (17C). Alias del tipo de Profile: las mismas
 * reglas que `completionPercentage` por construcción (única fuente en
 * `getProfileSectionFlags`).
 */
export type DashboardCvSectionsDto = ProfileSectionFlags;

/**
 * Estado del portfolio para el hub (17C). `null` = sin configurar: la lectura
 * del dashboard NUNCA crea el registro (prohibido `getOrCreatePortfolioSettings`).
 */
export interface DashboardPortfolioDto {
  isPublished: boolean;
  slug: string;
  /** Ruta pública relativa, patrón existente `/u/<slug>`. */
  publicUrlPath: string;
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
  cvSections: DashboardCvSectionsDto;
  portfolio: DashboardPortfolioDto | null;
  nextActions: DashboardNextAction[];
}
