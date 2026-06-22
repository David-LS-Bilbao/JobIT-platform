import { Prisma, type Job } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import type { ListJobsQuery } from "./jobs.schemas.js";

export interface PaginatedJobs {
  data: Job[];
  total: number;
  page: number;
  limit: number;
}

function buildJobsWhere(query: ListJobsQuery): Prisma.JobWhereInput {
  const { q, remote, seniority, contractType, tags } = query;

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
