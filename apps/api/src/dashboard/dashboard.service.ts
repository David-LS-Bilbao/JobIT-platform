import { getTopMatchesForUser } from "../match/match.service.js";
import {
  calculateCompletionPercentage,
  getOrCreateCandidateProfile
} from "../profile/profile.service.js";
import { listSavedJobs } from "../saved-jobs/saved-jobs.service.js";
import type { CandidateDashboardDto, DashboardNextAction } from "./dashboard.types.js";

/**
 * Servicio del Candidate Dashboard (Sprint 06). Backend-only, determinista y de
 * solo lectura: compone servicios existentes de Profile/CV, Saved Jobs y Match.
 * No persiste nada, no llama a red externa, no usa IA y nunca acepta `userId`
 * del cliente (lo recibe ya resuelto desde el token).
 */

const SAVED_JOBS_RECENT_LIMIT = 3;
const TOP_MATCHES_LIMIT = 3;

/**
 * Próximos pasos orientativos derivados del estado del candidato. Determinista:
 * el mismo estado produce siempre las mismas acciones. Sin ranking ni evaluación.
 */
function buildNextActions(
  completionPercentage: number,
  savedJobsTotal: number,
  matchesCount: number
): DashboardNextAction[] {
  const actions: DashboardNextAction[] = [];

  if (completionPercentage < 100) {
    actions.push({ action: "complete_profile", label: "Completa tu perfil profesional" });
  }

  if (savedJobsTotal === 0 || matchesCount === 0) {
    actions.push({ action: "explore_jobs", label: "Explora ofertas disponibles" });
  }

  return actions;
}

/**
 * Agrega el dashboard del candidato autenticado. Reutiliza
 * `calculateCompletionPercentage` (sin duplicar la lógica de completitud) y los
 * contratos públicos de Saved Jobs y Match (jobs ya serializados con `serializeJob`).
 */
export async function getCandidateDashboard(userId: string): Promise<CandidateDashboardDto> {
  const profile = await getOrCreateCandidateProfile(userId);
  const completionPercentage = calculateCompletionPercentage(profile);

  const savedJobs = await listSavedJobs(userId);
  const matches = await getTopMatchesForUser(userId, TOP_MATCHES_LIMIT);

  const skills = profile.skills.map((skill) => skill.normalizedName);

  return {
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      completionPercentage
    },
    skills,
    savedJobs: {
      total: savedJobs.length,
      recent: savedJobs.slice(0, SAVED_JOBS_RECENT_LIMIT)
    },
    matches,
    nextActions: buildNextActions(completionPercentage, savedJobs.length, matches.length)
  };
}
