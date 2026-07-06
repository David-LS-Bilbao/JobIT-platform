import type { PortfolioSettings, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import type { UpdatePortfolioInput } from "./portfolio.schemas.js";
import { baseSlugFromName, isValidSlug, slugify } from "./portfolio.slug.js";
import { getOrCreateCandidateProfile, type ProfileWithRelations } from "./profile.service.js";

/** Error de dominio del portfolio (código + status HTTP + campos faltantes opcionales). */
export class PortfolioError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly missingFields?: string[]
  ) {
    super(message);
    this.name = "PortfolioError";
  }
}

/** Devuelve un slug libre a partir de `base`, añadiendo sufijos `-2`, `-3`… si colisiona. */
async function ensureUniqueSlug(base: string, userId: string): Promise<string> {
  let candidate = base;
  for (let n = 2; n <= 1000; n += 1) {
    const existing = await prisma.portfolioSettings.findUnique({ where: { slug: candidate } });
    if (!existing || existing.userId === userId) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Ajustes del portfolio del usuario; se crean con un slug generado si no existen. */
export async function getOrCreatePortfolioSettings(userId: string): Promise<PortfolioSettings> {
  const existing = await prisma.portfolioSettings.findUnique({ where: { userId } });
  if (existing) return existing;

  const profile = await getOrCreateCandidateProfile(userId);
  const base = baseSlugFromName(profile.firstName, profile.lastName, userId);
  const slug = await ensureUniqueSlug(base, userId);
  return prisma.portfolioSettings.create({ data: { userId, slug } });
}

/** Actualiza slug (normalizado/validado) y flags de visibilidad. No publica. */
export async function updatePortfolioSettings(
  userId: string,
  input: UpdatePortfolioInput
): Promise<PortfolioSettings> {
  await getOrCreatePortfolioSettings(userId);

  const data: Prisma.PortfolioSettingsUpdateInput = {};

  if (input.slug !== undefined) {
    const normalized = slugify(input.slug);
    if (!isValidSlug(normalized)) {
      throw new PortfolioError("INVALID_SLUG", 400, "El enlace no es válido o está reservado.");
    }
    const taken = await prisma.portfolioSettings.findUnique({ where: { slug: normalized } });
    if (taken && taken.userId !== userId) {
      throw new PortfolioError("SLUG_TAKEN", 409, "Ese enlace ya está en uso.");
    }
    data.slug = normalized;
  }
  if (input.showLocation !== undefined) data.showLocation = input.showLocation;
  if (input.showAvailability !== undefined) data.showAvailability = input.showAvailability;
  if (input.showPreferences !== undefined) data.showPreferences = input.showPreferences;

  return prisma.portfolioSettings.update({ where: { userId }, data });
}

/** Mínimo publicable: nombre + headline + ≥1 skill + (≥1 proyecto o experiencia). */
function checkPublishable(profile: ProfileWithRelations): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const hasName = Boolean((profile.firstName ?? "").trim() || (profile.lastName ?? "").trim());
  if (!hasName) missing.push("name");
  if (!(profile.headline ?? "").trim()) missing.push("headline");
  if (profile.skills.length === 0) missing.push("skills");
  if (profile.projects.length === 0 && profile.experiences.length === 0) {
    missing.push("projectsOrExperience");
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Regla real de publicabilidad (la misma que aplica `publishPortfolio`), expuesta
 * solo para lectura (Sprint 17C: condición de `publish_portfolio` en el Dashboard).
 * No crea ni modifica datos y no cambia el comportamiento de los endpoints.
 */
export function isPortfolioPublishable(profile: ProfileWithRelations): boolean {
  return checkPublishable(profile).ok;
}

/** Publica el portfolio si el perfil cumple el mínimo publicable; si no, 400 accionable. */
export async function publishPortfolio(userId: string): Promise<PortfolioSettings> {
  await getOrCreatePortfolioSettings(userId);
  const profile = await getOrCreateCandidateProfile(userId);
  const { ok, missing } = checkPublishable(profile);
  if (!ok) {
    throw new PortfolioError(
      "PORTFOLIO_NOT_READY",
      400,
      "Completa los campos mínimos para publicar tu portfolio.",
      missing
    );
  }
  return prisma.portfolioSettings.update({
    where: { userId },
    data: { isPublished: true, publishedAt: new Date() }
  });
}

/** Despublica el portfolio (isPublished=false, publishedAt=null). */
export async function unpublishPortfolio(userId: string): Promise<PortfolioSettings> {
  await getOrCreatePortfolioSettings(userId);
  return prisma.portfolioSettings.update({
    where: { userId },
    data: { isPublished: false, publishedAt: null }
  });
}

/** Read model privado de los ajustes. `publicUrlPath` es relativo (`/u/<slug>`). */
export function serializePortfolioSettings(settings: PortfolioSettings): Record<string, unknown> {
  return {
    slug: settings.slug,
    isPublished: settings.isPublished,
    publishedAt: settings.publishedAt,
    showLocation: settings.showLocation,
    showAvailability: settings.showAvailability,
    showPreferences: settings.showPreferences,
    publicUrlPath: `/u/${settings.slug}`
  };
}
