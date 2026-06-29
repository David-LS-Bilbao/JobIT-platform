import type { Job, JobSource, JobStatus, JobSeniority, RemoteType } from "@prisma/client";

/**
 * DTO público de una oferta (`Job`).
 *
 * Contrato de salida de la API de Jobs: desacopla la respuesta del modelo Prisma.
 * Incluye `source` y `sourceUrl` (atribución de procedencia) y NUNCA expone los
 * campos internos de ingesta `externalId` ni `ingestedAt`.
 * Ver docs/specs/features/jobs-api-visibility.md.
 */
export interface JobPublicDto {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remoteType: RemoteType;
  description: string;
  requirements: string[];
  seniority: JobSeniority;
  contractType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  status: JobStatus;
  postedAt: Date;
  expiresAt: Date | null;
  source: JobSource;
  sourceUrl: string | null;
}

/** Serializa una entidad `Job` a su DTO público (sin campos internos). */
export function serializeJob(job: Job): JobPublicDto {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remoteType: job.remoteType,
    description: job.description,
    requirements: job.requirements,
    seniority: job.seniority,
    contractType: job.contractType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    tags: job.tags,
    status: job.status,
    postedAt: job.postedAt,
    expiresAt: job.expiresAt,
    source: job.source,
    sourceUrl: job.sourceUrl
  };
}
