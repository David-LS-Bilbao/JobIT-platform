import { Prisma } from "@prisma/client";

import { env } from "../../../config/env.js";
import { prisma } from "../../../lib/prisma.js";
import {
  searchJoobleJobs,
  JoobleConfigError,
  type JoobleSearchParams
} from "./jooble.client.js";
import { normalizeJoobleJob, JoobleNormalizationError } from "./jooble.normalizer.js";
import type { NormalizedExternalJob } from "./jooble.types.js";

/**
 * Servicio de ingesta de Jooble (Fase 4E).
 *
 * Backend-only y manual/controlado: NO se invoca desde routers ni desde requests
 * del candidato. Obtiene ofertas con el cliente inyectable, las normaliza (descarta
 * los registros inválidos sin abortar) y las persiste como `source = JOOBLE` con
 * upsert idempotente por `(source, externalId)`. La API key nunca se loguea ni se
 * incluye en errores; sin red en tests (cliente inyectado).
 */

export interface JoobleIngestDeps {
  apiKey?: string;
  search?: typeof searchJoobleJobs;
  now?: () => Date;
}

export interface JoobleIngestSummary {
  fetched: number;
  normalized: number;
  skipped: number;
  created: number;
  updated: number;
}

/** Mapea el DTO normalizado a una fila `Job` con defaults seguros. */
function toJobData(dto: NormalizedExternalJob): Prisma.JobCreateInput {
  return {
    title: dto.title,
    company: dto.company,
    location: dto.location,
    remoteType: dto.remoteType,
    description: dto.description,
    requirements: [],
    seniority: "ANY",
    contractType: dto.contractType,
    salaryMin: dto.salaryMin,
    salaryMax: dto.salaryMax,
    tags: [],
    status: "ACTIVE",
    postedAt: dto.postedAt,
    source: "JOOBLE",
    externalId: dto.externalId,
    sourceUrl: dto.sourceUrl,
    ingestedAt: dto.ingestedAt
  };
}

/**
 * Upsert manual por `(source, externalId)`: Prisma no expone el índice único
 * parcial como clave compuesta, así que se busca y se crea/actualiza. La carrera
 * de concurrencia queda protegida por el índice parcial (P2002 → se reintenta update).
 */
async function upsertJoobleJob(dto: NormalizedExternalJob): Promise<"created" | "updated"> {
  const data = toJobData(dto);

  const existing = await prisma.job.findFirst({
    where: { source: "JOOBLE", externalId: dto.externalId },
    select: { id: true }
  });

  if (existing) {
    await prisma.job.update({ where: { id: existing.id }, data });
    return "updated";
  }

  try {
    await prisma.job.create({ data });
    return "created";
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const conflict = await prisma.job.findFirst({
        where: { source: "JOOBLE", externalId: dto.externalId },
        select: { id: true }
      });
      if (conflict) {
        await prisma.job.update({ where: { id: conflict.id }, data });
        return "updated";
      }
    }
    throw err;
  }
}

export async function ingestJoobleJobs(
  params: JoobleSearchParams,
  deps: JoobleIngestDeps = {}
): Promise<JoobleIngestSummary> {
  const apiKey = deps.apiKey ?? env.JOOBLE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new JoobleConfigError();
  }

  const search = deps.search ?? searchJoobleJobs;
  const response = await search(params, { apiKey });

  const ingestedAt = deps.now ? deps.now() : new Date();
  const summary: JoobleIngestSummary = {
    fetched: response.jobs.length,
    normalized: 0,
    skipped: 0,
    created: 0,
    updated: 0
  };

  for (const rawJob of response.jobs) {
    let dto: NormalizedExternalJob;
    try {
      dto = normalizeJoobleJob(rawJob, { ingestedAt });
    } catch (err) {
      if (err instanceof JoobleNormalizationError) {
        summary.skipped += 1;
        continue;
      }
      throw err;
    }

    summary.normalized += 1;
    const outcome = await upsertJoobleJob(dto);
    if (outcome === "created") {
      summary.created += 1;
    } else {
      summary.updated += 1;
    }
  }

  return summary;
}
