import { Prisma } from "@prisma/client";

import { env } from "../../../config/env.js";
import { prisma } from "../../../lib/prisma.js";
import type { GreenhouseCompany } from "./greenhouse.companies.js";
import { fetchGreenhouseBoardJobs } from "./greenhouse.client.js";
import { normalizeGreenhouseJob, GreenhouseNormalizationError } from "./greenhouse.normalizer.js";
import type { GreenhouseBoardResponseInput } from "./greenhouse.schemas.js";
import type { NormalizedExternalJob } from "./greenhouse.types.js";

/**
 * Servicio de ingesta de Greenhouse (backend-only, manual/controlado).
 *
 * NO se invoca desde routers ni requests del candidato. Recorre una lista curada de
 * boards EN SERIE (fallo parcial tolerado: si un board falla, se cuenta y se continúa),
 * normaliza cada oferta (`company` inyectada por board) y persiste como `source =
 * GREENHOUSE` con upsert idempotente por `(source, externalId)`. Sin red en tests
 * (cliente inyectado por `deps.fetch`).
 */

export interface GreenhouseIngestDeps {
  /** Base URL del Job Board API; por defecto `env.GREENHOUSE_API_BASE_URL`. */
  baseUrl?: string;
  /** Cliente inyectable (tests sin red). */
  fetch?: typeof fetchGreenhouseBoardJobs;
  /** Cap opcional de ofertas por board (`ING_LIMIT`). */
  limitPerBoard?: number;
  now?: () => Date;
}

export interface GreenhouseIngestSummary {
  boardsProcessed: number;
  boardsFailed: number;
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
    tags: dto.tags,
    status: "ACTIVE",
    postedAt: dto.postedAt,
    source: "GREENHOUSE",
    externalId: dto.externalId,
    sourceUrl: dto.sourceUrl,
    ingestedAt: dto.ingestedAt
  };
}

/**
 * Upsert manual por `(source, externalId)`: Prisma no expone el índice único parcial
 * como clave compuesta, así que se busca y se crea/actualiza. La carrera de concurrencia
 * queda protegida por el índice parcial (P2002 → se reintenta update).
 */
async function upsertGreenhouseJob(dto: NormalizedExternalJob): Promise<"created" | "updated"> {
  const data = toJobData(dto);

  const existing = await prisma.job.findFirst({
    where: { source: "GREENHOUSE", externalId: dto.externalId },
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
        where: { source: "GREENHOUSE", externalId: dto.externalId },
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

/**
 * Ingesta una lista curada de boards de Greenhouse, en serie y con fallo parcial
 * tolerado. Solo aborta ante un error de programación no controlado; un board que falla
 * en red/HTTP se cuenta en `boardsFailed` y no detiene al resto.
 */
export async function ingestGreenhouseBoards(
  companies: readonly GreenhouseCompany[],
  deps: GreenhouseIngestDeps = {}
): Promise<GreenhouseIngestSummary> {
  const baseUrl = deps.baseUrl ?? env.GREENHOUSE_API_BASE_URL;
  const fetchBoard = deps.fetch ?? fetchGreenhouseBoardJobs;
  const ingestedAt = deps.now ? deps.now() : new Date();

  const summary: GreenhouseIngestSummary = {
    boardsProcessed: 0,
    boardsFailed: 0,
    fetched: 0,
    normalized: 0,
    skipped: 0,
    created: 0,
    updated: 0
  };

  for (const company of companies) {
    let response: GreenhouseBoardResponseInput;
    try {
      response = await fetchBoard(company.boardToken, { baseUrl });
    } catch {
      // Fallo de un board (red/HTTP/timeout/forma): se cuenta y se continúa con el resto.
      summary.boardsFailed += 1;
      continue;
    }
    summary.boardsProcessed += 1;

    const rawJobs =
      deps.limitPerBoard && deps.limitPerBoard > 0
        ? response.jobs.slice(0, deps.limitPerBoard)
        : response.jobs;
    summary.fetched += rawJobs.length;

    for (const rawJob of rawJobs) {
      let dto: NormalizedExternalJob;
      try {
        dto = normalizeGreenhouseJob(rawJob, { company: company.company, ingestedAt });
      } catch (err) {
        if (err instanceof GreenhouseNormalizationError) {
          summary.skipped += 1;
          continue;
        }
        throw err;
      }

      summary.normalized += 1;
      const outcome = await upsertGreenhouseJob(dto);
      if (outcome === "created") {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }
    }
  }

  return summary;
}
