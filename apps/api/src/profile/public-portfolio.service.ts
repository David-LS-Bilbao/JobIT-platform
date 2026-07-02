import type {
  AvailabilityStatus,
  LinkType,
  PortfolioSettings,
  RemotePreference,
  SkillLevel
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { isValidSlug, slugify } from "./portfolio.slug.js";
import { getOrCreateCandidateProfile, type ProfileWithRelations } from "./profile.service.js";

/**
 * Read model PÚBLICO del portfolio. Se construye por whitelist explícita en el
 * backend: nunca incluye userId, email, tokens, salario, completitud ni datos de
 * otras features. Respeta los flags de visibilidad de `PortfolioSettings`.
 */
export interface PublicPortfolioResult {
  slug: string;
  publicUrlPath: string;
  publishedAt: Date | null;
  profile: {
    name: string;
    headline: string | null;
    summary: string | null;
    avatarUrl: string | null;
    location: string | null;
    availabilityStatus: AvailabilityStatus | null;
    locationRemote: boolean | null;
    skills: { name: string; level: SkillLevel | null }[];
    experiences: {
      company: string;
      role: string;
      startDate: Date;
      endDate: Date | null;
      current: boolean;
      description: string | null;
      location: string | null;
    }[];
    education: {
      institution: string;
      title: string;
      field: string | null;
      startDate: Date | null;
      endDate: Date | null;
      current: boolean;
    }[];
    projects: {
      name: string;
      description: string | null;
      technologies: string[];
      url: string | null;
      repoUrl: string | null;
    }[];
    links: { type: LinkType; url: string }[];
    // Subconjunto seguro; NUNCA incluye salario (V1).
    preferences: { desiredRoles: string[]; preferredLocations: string[]; remotePreference: RemotePreference } | null;
  };
}

function publicName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Candidato tech";
}

function buildPublicPortfolio(
  settings: PortfolioSettings,
  profile: ProfileWithRelations
): PublicPortfolioResult {
  return {
    slug: settings.slug,
    publicUrlPath: `/u/${settings.slug}`,
    publishedAt: settings.publishedAt,
    profile: {
      name: publicName(profile.firstName, profile.lastName),
      headline: profile.headline,
      summary: profile.summary,
      avatarUrl: profile.avatarUrl,
      location: settings.showLocation ? profile.location : null,
      availabilityStatus: settings.showAvailability ? profile.availabilityStatus : null,
      locationRemote: settings.showAvailability ? profile.locationRemote : null,
      skills: profile.skills.map((s) => ({ name: s.name, level: s.level })),
      experiences: profile.experiences.map((e) => ({
        company: e.company,
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        description: e.description,
        location: e.location
      })),
      education: profile.education.map((e) => ({
        institution: e.institution,
        title: e.title,
        field: e.field,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current
      })),
      projects: profile.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        url: p.url,
        repoUrl: p.repoUrl
      })),
      links: profile.links.map((l) => ({ type: l.type, url: l.url })),
      preferences:
        settings.showPreferences && profile.preferences
          ? {
              desiredRoles: profile.preferences.desiredRoles,
              preferredLocations: profile.preferences.preferredLocations,
              remotePreference: profile.preferences.remotePreference
            }
          : null
    }
  };
}

/**
 * Devuelve el portfolio público por slug, o `null` (→ 404 uniforme) si el slug es
 * inválido, no existe o el portfolio no está publicado. No revela si el slug
 * existe pero está despublicado.
 */
export async function getPublicPortfolioBySlug(slug: string): Promise<PublicPortfolioResult | null> {
  const normalized = slugify(slug);
  if (!isValidSlug(normalized)) return null;

  const settings = await prisma.portfolioSettings.findUnique({ where: { slug: normalized } });
  if (!settings || !settings.isPublished) return null;

  const profile = await getOrCreateCandidateProfile(settings.userId);
  return buildPublicPortfolio(settings, profile);
}
