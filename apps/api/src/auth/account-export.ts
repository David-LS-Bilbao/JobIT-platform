import { prisma } from "../lib/prisma.js";

/**
 * Documento de exportacion de la cuenta (`ACCOUNT_LIFECYCLE_V1`).
 *
 * Spec: `docs/specs/features/account-lifecycle.md` §"Contenido del export".
 *
 * Regla estructural del modulo: cada campo que sale se nombra UNA a UNA. Nunca
 * se serializa un modelo de Prisma completo ni se hace spread de una fila. El
 * motivo es que un campo nuevo en el schema no debe poder colarse en el export
 * por omision: si manana `User` gana una columna sensible, este fichero seguira
 * exportando exactamente lo mismo hasta que alguien lo edite a proposito.
 *
 * Nunca se incluye: `passwordHash`, refresh tokens, `tokenHash`, `familyId`,
 * `replacedById`, access JWT, cookies ni ningun material interno de credenciales.
 */

export const ACCOUNT_EXPORT_VERSION = "1" as const;

export interface AccountExport {
  version: typeof ACCOUNT_EXPORT_VERSION;
  exportedAt: string;
  account: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
  profile: {
    firstName: string | null;
    lastName: string | null;
    headline: string | null;
    summary: string | null;
    location: string | null;
    locationRemote: boolean;
    availabilityStatus: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
    skills: { name: string; level: string | null; category: string | null }[];
    experiences: {
      company: string;
      role: string;
      startDate: string;
      endDate: string | null;
      current: boolean;
      description: string | null;
      location: string | null;
    }[];
    education: {
      institution: string;
      title: string;
      field: string | null;
      startDate: string | null;
      endDate: string | null;
      current: boolean;
    }[];
    projects: {
      name: string;
      description: string | null;
      technologies: string[];
      url: string | null;
      repoUrl: string | null;
    }[];
    links: { type: string; url: string }[];
    preferences: {
      desiredRoles: string[];
      preferredLocations: string[];
      remotePreference: string;
      seniority: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      contractTypes: string[];
    } | null;
  } | null;
  portfolio: {
    slug: string;
    isPublished: boolean;
    publishedAt: string | null;
    showLocation: boolean;
    showAvailability: boolean;
    showPreferences: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  savedJobs: {
    savedAt: string;
    job: {
      title: string;
      company: string;
      location: string | null;
      source: string;
      sourceUrl: string | null;
    };
  }[];
}

const iso = (value: Date): string => value.toISOString();
const isoOrNull = (value: Date | null): string | null => (value ? value.toISOString() : null);

/**
 * Construye el documento de exportacion del titular.
 *
 * El llamante ya ha verificado identidad y step-up: aqui solo se lee. Todas las
 * consultas van filtradas por el `userId` autenticado, de modo que es imposible
 * exportar datos de otra persona.
 */
export async function buildAccountExport(
  user: { id: string; email: string; role: string; createdAt: Date },
  exportedAt: Date
): Promise<AccountExport> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    include: {
      skills: true,
      experiences: true,
      education: true,
      projects: true,
      links: true,
      preferences: true
    }
  });

  const portfolio = await prisma.portfolioSettings.findUnique({ where: { userId: user.id } });

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: user.id },
    include: { job: true },
    orderBy: { savedAt: "asc" }
  });

  return {
    version: ACCOUNT_EXPORT_VERSION,
    exportedAt: iso(exportedAt),
    account: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: iso(user.createdAt)
    },
    profile: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          headline: profile.headline,
          summary: profile.summary,
          location: profile.location,
          locationRemote: profile.locationRemote,
          availabilityStatus: profile.availabilityStatus,
          avatarUrl: profile.avatarUrl,
          createdAt: iso(profile.createdAt),
          updatedAt: iso(profile.updatedAt),
          skills: profile.skills.map((skill) => ({
            name: skill.name,
            level: skill.level,
            category: skill.category
          })),
          experiences: profile.experiences.map((experience) => ({
            company: experience.company,
            role: experience.role,
            startDate: iso(experience.startDate),
            endDate: isoOrNull(experience.endDate),
            current: experience.current,
            description: experience.description,
            location: experience.location
          })),
          education: profile.education.map((entry) => ({
            institution: entry.institution,
            title: entry.title,
            field: entry.field,
            startDate: isoOrNull(entry.startDate),
            endDate: isoOrNull(entry.endDate),
            current: entry.current
          })),
          projects: profile.projects.map((project) => ({
            name: project.name,
            description: project.description,
            technologies: project.technologies,
            url: project.url,
            repoUrl: project.repoUrl
          })),
          links: profile.links.map((link) => ({ type: link.type, url: link.url })),
          preferences: profile.preferences
            ? {
                desiredRoles: profile.preferences.desiredRoles,
                preferredLocations: profile.preferences.preferredLocations,
                remotePreference: profile.preferences.remotePreference,
                seniority: profile.preferences.seniority,
                salaryMin: profile.preferences.salaryMin,
                salaryMax: profile.preferences.salaryMax,
                contractTypes: profile.preferences.contractTypes
              }
            : null
        }
      : null,
    portfolio: portfolio
      ? {
          slug: portfolio.slug,
          isPublished: portfolio.isPublished,
          publishedAt: isoOrNull(portfolio.publishedAt),
          showLocation: portfolio.showLocation,
          showAvailability: portfolio.showAvailability,
          showPreferences: portfolio.showPreferences,
          createdAt: iso(portfolio.createdAt),
          updatedAt: iso(portfolio.updatedAt)
        }
      : null,
    // Metadatos minimos de la oferta: lo necesario para que la relacion guardada
    // siga siendo comprensible fuera del producto. El catalogo `Job` es global y
    // no pertenece a la persona, asi que no se exporta entero.
    savedJobs: savedJobs.map((saved) => ({
      savedAt: iso(saved.savedAt),
      job: {
        title: saved.job.title,
        company: saved.job.company,
        location: saved.job.location,
        source: saved.job.source,
        sourceUrl: saved.job.sourceUrl
      }
    }))
  };
}
