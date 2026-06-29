import { Prisma, type Job } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import type { ListJobsQuery } from "./jobs.schemas.js";

export class JobsError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "JobsError";
  }
}

export interface PaginatedJobs {
  data: Job[];
  total: number;
  page: number;
  limit: number;
}

function isAvailable(job: Job): boolean {
  if (job.status !== "ACTIVE") {
    return false;
  }
  return job.expiresAt === null || job.expiresAt >= new Date();
}

export async function getActiveJobById(id: string): Promise<Job> {
  const job = await prisma.job.findUnique({ where: { id } });

  // No se distingue ante el cliente entre inexistente, cerrada o expirada.
  if (!job || !isAvailable(job)) {
    throw new JobsError("NOT_FOUND", 404, "Oferta no disponible");
  }

  return job;
}

function buildJobsWhere(query: ListJobsQuery): Prisma.JobWhereInput {
  const { q, remote, seniority, contractType, source, tags } = query;

  const where: Prisma.JobWhereInput = {
    status: "ACTIVE",
    // Vigente: sin fecha de expiración o con expiración en el futuro.
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
  };

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } }
        ]
      }
    ];
  }
  if (remote) {
    where.remoteType = remote;
  }
  if (seniority) {
    // Una oferta ANY es relevante para cualquier nivel solicitado.
    where.seniority = { in: [seniority, "ANY"] };
  }
  if (contractType) {
    where.contractType = contractType;
  }
  if (source) {
    where.source = source;
  }
  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  return where;
}

export async function listJobs(query: ListJobsQuery): Promise<PaginatedJobs> {
  const { page, limit } = query;
  const where = buildJobsWhere(query);

  const [data, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.job.count({ where })
  ]);

  return { data, total, page, limit };
}
