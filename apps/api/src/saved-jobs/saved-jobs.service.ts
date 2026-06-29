import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { serializeJob, type JobPublicDto } from "../jobs/jobs.serializer.js";

export class SavedJobsError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "SavedJobsError";
  }
}

/** DTO de salida de un guardado: metadato `savedAt` + oferta con contrato público. */
export interface SavedJobDto {
  savedAt: Date;
  job: JobPublicDto;
}

export interface SaveJobResult {
  statusCode: 200 | 201;
  savedJob: SavedJobDto;
}

/**
 * Lista los guardados del usuario autenticado, más recientes primero. No filtra
 * por estado: las ofertas CLOSED/expiradas previamente guardadas se conservan
 * (el cliente decide el indicador de "no disponible" a partir de status/expiresAt).
 * El `Job` embebido se serializa con `serializeJob` (sin externalId ni ingestedAt).
 */
export async function listSavedJobs(userId: string): Promise<SavedJobDto[]> {
  const saved = await prisma.savedJob.findMany({
    where: { userId },
    include: { job: true },
    orderBy: { savedAt: "desc" }
  });

  return saved.map((entry) => ({ savedAt: entry.savedAt, job: serializeJob(entry.job) }));
}

/**
 * Guarda una oferta para el usuario autenticado. Idempotente: si ya estaba
 * guardada devuelve 200 sin duplicar; si la crea devuelve 201. La oferta debe
 * existir (si no, 404). La condición de carrera del índice único `(userId, jobId)`
 * se resuelve como idempotente (P2002 → consulta el registro y devuelve 200).
 */
export async function saveJob(userId: string, jobId: string): Promise<SaveJobResult> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new SavedJobsError("NOT_FOUND", 404, "Oferta no encontrada");
  }

  const existing = await prisma.savedJob.findUnique({
    where: { userId_jobId: { userId, jobId } }
  });
  if (existing) {
    return { statusCode: 200, savedJob: { savedAt: existing.savedAt, job: serializeJob(job) } };
  }

  try {
    const created = await prisma.savedJob.create({ data: { userId, jobId } });
    return { statusCode: 201, savedJob: { savedAt: created.savedAt, job: serializeJob(job) } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const conflict = await prisma.savedJob.findUnique({
        where: { userId_jobId: { userId, jobId } }
      });
      if (conflict) {
        return { statusCode: 200, savedJob: { savedAt: conflict.savedAt, job: serializeJob(job) } };
      }
    }
    throw err;
  }
}

/**
 * Quita un guardado propio. El borrado se acota al par `(userId, jobId)`: si el
 * usuario no tiene esa oferta guardada (aunque otro usuario sí), devuelve 404 y
 * no afecta a registros ajenos.
 */
export async function deleteSavedJob(userId: string, jobId: string): Promise<void> {
  const existing = await prisma.savedJob.findUnique({
    where: { userId_jobId: { userId, jobId } },
    select: { id: true }
  });
  if (!existing) {
    throw new SavedJobsError("NOT_FOUND", 404, "No tienes esta oferta guardada");
  }

  await prisma.savedJob.delete({ where: { id: existing.id } });
}
