import { prisma } from "../lib/prisma.js";
import { getTopMatchesForUser } from "../match/match.service.js";
import { isPortfolioPublishable } from "../profile/portfolio.service.js";
import {
  calculateCompletionPercentage,
  getOrCreateCandidateProfile,
  getProfileSectionFlags
} from "../profile/profile.service.js";
import { listSavedJobs } from "../saved-jobs/saved-jobs.service.js";
import type {
  CandidateDashboardDto,
  DashboardCvSectionsDto,
  DashboardNextAction,
  DashboardPortfolioDto
} from "./dashboard.types.js";

/**
 * Servicio del Candidate Dashboard (Sprint 06). Backend-only, determinista y de
 * solo lectura: compone servicios existentes de Profile/CV, Saved Jobs y Match.
 * No persiste nada, no llama a red externa, no usa IA y nunca acepta `userId`
 * del cliente (lo recibe ya resuelto desde el token).
 */

const SAVED_JOBS_RECENT_LIMIT = 3;
const TOP_MATCHES_LIMIT = 3;
const NEXT_ACTIONS_LIMIT = 3;

interface NextActionsInput {
  cvSections: DashboardCvSectionsDto;
  portfolio: DashboardPortfolioDto | null;
  portfolioPublishable: boolean;
  savedJobsTotal: number;
  matchesCount: number;
}

/**
 * Próximos pasos orientativos (catálogo aprobado en la spec 17C). Determinista:
 * el mismo estado produce siempre las mismas acciones en el mismo orden de
 * prioridad, con un máximo de `NEXT_ACTIONS_LIMIT`. Solo se emite UNA acción de
 * sección de CV faltante por respuesta (orden experience > projects > links).
 * El mapeo acción→ruta vive en el frontend. Sin ranking ni evaluación.
 */
function buildNextActions(input: NextActionsInput): DashboardNextAction[] {
  const { cvSections, portfolio, portfolioPublishable, savedJobsTotal, matchesCount } = input;
  const actions: DashboardNextAction[] = [];

  // 1. Faltan básicos (nombre y apellidos) o skills → completar el perfil.
  if (!cvSections.basics || !cvSections.skills) {
    actions.push({ action: "complete_profile", label: "Completa tu perfil profesional" });
  }

  // 2. Primera sección de CV faltante (una sola por respuesta).
  if (!cvSections.experience) {
    actions.push({ action: "add_experience", label: "Añade tu experiencia" });
  } else if (!cvSections.projects) {
    actions.push({ action: "add_projects", label: "Añade proyectos destacados" });
  } else if (!cvSections.links) {
    actions.push({ action: "add_links", label: "Añade tus enlaces profesionales" });
  }

  // 3. Portfolio publicable (regla real de `publishPortfolio`) y aún no publicado.
  if (portfolioPublishable && (!portfolio || !portfolio.isPublished)) {
    actions.push({ action: "publish_portfolio", label: "Publica tu portfolio" });
  }

  // 4. Sin ofertas guardadas → explorar (label existente, sin cambios).
  if (savedJobsTotal === 0) {
    actions.push({ action: "explore_jobs", label: "Explora ofertas disponibles" });
  }

  // 5. Ciclo activo (hay matches y guardadas) → revisar los mejores matches.
  if (matchesCount > 0 && savedJobsTotal > 0) {
    actions.push({ action: "review_matches", label: "Revisa tus mejores matches" });
  }

  return actions.slice(0, NEXT_ACTIONS_LIMIT);
}

/**
 * Estado del portfolio para el hub (17C): lectura segura por `userId` con
 * `findUnique`. NUNCA usa `getOrCreatePortfolioSettings` (crearía fila y slug
 * como efecto colateral de una lectura). `null` = sin configurar.
 */
async function findPortfolioStatus(userId: string): Promise<DashboardPortfolioDto | null> {
  const settings = await prisma.portfolioSettings.findUnique({
    where: { userId },
    select: { slug: true, isPublished: true }
  });
  if (!settings) {
    return null;
  }
  return {
    isPublished: settings.isPublished,
    slug: settings.slug,
    // Mismo patrón que `serializePortfolioSettings` (`/u/<slug>`).
    publicUrlPath: `/u/${settings.slug}`
  };
}

/**
 * Agrega el dashboard del candidato autenticado. Reutiliza
 * `calculateCompletionPercentage`/`getProfileSectionFlags` (única fuente de las
 * reglas de completitud: `cvSections` y el % no pueden divergir) y los contratos
 * públicos de Saved Jobs y Match (jobs ya serializados con `serializeJob`).
 */
export async function getCandidateDashboard(userId: string): Promise<CandidateDashboardDto> {
  const profile = await getOrCreateCandidateProfile(userId);
  const completionPercentage = calculateCompletionPercentage(profile);
  const cvSections = getProfileSectionFlags(profile);

  const savedJobs = await listSavedJobs(userId);
  const matches = await getTopMatchesForUser(userId, TOP_MATCHES_LIMIT);
  const portfolio = await findPortfolioStatus(userId);
  const portfolioPublishable = isPortfolioPublishable(profile);

  const skills = profile.skills.map((skill) => skill.normalizedName);

  return {
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      completionPercentage,
      summary: profile.summary,
      avatarUrl: profile.avatarUrl
    },
    skills,
    savedJobs: {
      total: savedJobs.length,
      recent: savedJobs.slice(0, SAVED_JOBS_RECENT_LIMIT)
    },
    matches,
    cvSections,
    portfolio,
    nextActions: buildNextActions({
      cvSections,
      portfolio,
      portfolioPublishable,
      savedJobsTotal: savedJobs.length,
      matchesCount: matches.length
    })
  };
}
