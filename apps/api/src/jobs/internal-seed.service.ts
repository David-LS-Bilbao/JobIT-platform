import type { Prisma } from "@prisma/client";

import {
  assertSeedableDatabaseUrl,
  UnsafeDatabaseTargetError,
  type EnvLike
} from "../lib/database-safety.js";

/**
 * Dataset controlado del seed de desarrollo (Sprint 23 — DATA-04).
 *
 * Cada entrada declara su propio `externalId` estático (namespace reservado
 * `jobit-seed-*`), nunca derivado de título, empresa ni posición en el array.
 * Las fechas parten de `SEED_REFERENCE_DATE`, una constante fija: no dependen
 * del instante de ejecución, por lo que dos ejecuciones en procesos distintos
 * producen el mismo dataset lógico.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha de referencia fija del dataset. No usar `new Date()`/`Date.now()` aquí. */
export const SEED_REFERENCE_DATE: Date = new Date("2026-01-15T12:00:00.000Z");

const beforeReference = (days: number): Date => new Date(SEED_REFERENCE_DATE.getTime() - days * DAY_MS);
const afterReference = (days: number): Date => new Date(SEED_REFERENCE_DATE.getTime() + days * DAY_MS);

export interface InternalSeedJob {
  readonly source: "INTERNAL";
  readonly externalId: string;
  readonly title: string;
  readonly company: string;
  readonly location: string | null;
  readonly remoteType: "REMOTE" | "HYBRID" | "ON_SITE";
  readonly description: string;
  readonly requirements: readonly string[];
  readonly seniority: "JUNIOR" | "MID" | "SENIOR" | "ANY";
  readonly contractType: string;
  readonly salaryMin: number | null;
  readonly salaryMax: number | null;
  readonly tags: readonly string[];
  readonly status: "ACTIVE" | "CLOSED";
  readonly postedAt: Date;
  readonly expiresAt: Date | null;
}

export const INTERNAL_SEED_JOBS: readonly InternalSeedJob[] = [
  {
    source: "INTERNAL",
    externalId: "jobit-seed-001",
    title: "Frontend Developer",
    company: "Nova Labs",
    location: "Bilbao",
    remoteType: "HYBRID",
    description: "Desarrollo de interfaces con React y TypeScript para producto SaaS.",
    requirements: ["React", "TypeScript", "CSS"],
    seniority: "JUNIOR",
    contractType: "FULL_TIME",
    salaryMin: 24000,
    salaryMax: 32000,
    tags: ["React", "TypeScript", "Next.js"],
    status: "ACTIVE",
    postedAt: beforeReference(1),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-002",
    title: "Backend Engineer",
    company: "Datapeak",
    location: "Madrid",
    remoteType: "REMOTE",
    description: "APIs en Node.js con PostgreSQL y Prisma. Cultura de testing.",
    requirements: ["Node.js", "PostgreSQL", "Prisma"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 38000,
    salaryMax: 50000,
    tags: ["Node.js", "PostgreSQL", "Prisma", "TypeScript"],
    status: "ACTIVE",
    postedAt: beforeReference(2),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-003",
    title: "Full Stack Developer",
    company: "Orbital",
    location: "Valencia",
    remoteType: "REMOTE",
    description: "Stack TypeScript de extremo a extremo con Next.js y Node.js.",
    requirements: ["TypeScript", "Next.js", "Node.js"],
    seniority: "SENIOR",
    contractType: "FULL_TIME",
    salaryMin: 55000,
    salaryMax: 70000,
    tags: ["TypeScript", "Next.js", "Node.js", "PostgreSQL"],
    status: "ACTIVE",
    postedAt: beforeReference(3),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-004",
    title: "Android Engineer",
    company: "Mobika",
    location: "Bilbao",
    remoteType: "ON_SITE",
    description: "Aplicaciones nativas Android con Kotlin y Jetpack Compose.",
    requirements: ["Kotlin", "Android", "Jetpack Compose"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 36000,
    salaryMax: 48000,
    tags: ["Kotlin", "Android"],
    status: "ACTIVE",
    postedAt: beforeReference(4),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-005",
    title: "DevOps Engineer",
    company: "Cloudforge",
    location: "Remoto",
    remoteType: "REMOTE",
    description: "Infraestructura como código, CI/CD y observabilidad.",
    requirements: ["Docker", "Kubernetes", "Terraform"],
    seniority: "SENIOR",
    contractType: "CONTRACT",
    salaryMin: 60000,
    salaryMax: 80000,
    tags: ["DevOps", "Docker", "PostgreSQL"],
    status: "ACTIVE",
    postedAt: beforeReference(5),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-006",
    title: "Junior QA Engineer",
    company: "Testly",
    location: "Sevilla",
    remoteType: "HYBRID",
    description: "Automatización de pruebas end-to-end y de integración.",
    requirements: ["TypeScript", "Testing"],
    seniority: "JUNIOR",
    contractType: "PART_TIME",
    salaryMin: 18000,
    salaryMax: 24000,
    tags: ["TypeScript", "Testing"],
    status: "ACTIVE",
    postedAt: beforeReference(6),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-007",
    title: "React Native Developer",
    company: "Appnest",
    location: "Barcelona",
    remoteType: "HYBRID",
    description: "Apps móviles multiplataforma con React Native.",
    requirements: ["React", "React Native", "TypeScript"],
    seniority: "MID",
    contractType: "FREELANCE",
    salaryMin: 40000,
    salaryMax: 55000,
    tags: ["React", "TypeScript"],
    status: "ACTIVE",
    postedAt: beforeReference(7),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-008",
    title: "Data Engineer",
    company: "Streamline",
    location: "Madrid",
    remoteType: "REMOTE",
    description: "Pipelines de datos y modelado en PostgreSQL.",
    requirements: ["Python", "PostgreSQL", "SQL"],
    seniority: "SENIOR",
    contractType: "FULL_TIME",
    salaryMin: 58000,
    salaryMax: 75000,
    tags: ["PostgreSQL", "DevOps"],
    status: "ACTIVE",
    postedAt: beforeReference(8),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-009",
    title: "Software Engineer (Open level)",
    company: "Polyglot",
    location: "Remoto",
    remoteType: "REMOTE",
    description: "Buscamos talento de cualquier nivel; te ubicamos según experiencia.",
    requirements: ["TypeScript", "Node.js"],
    seniority: "ANY",
    contractType: "FULL_TIME",
    salaryMin: 30000,
    salaryMax: 65000,
    tags: ["TypeScript", "Node.js", "React"],
    status: "ACTIVE",
    postedAt: beforeReference(1),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-010",
    title: "Platform Engineer",
    company: "Gridscale",
    location: "Bilbao",
    remoteType: "ON_SITE",
    description: "Plataforma interna de desarrollo, tooling y automatización.",
    requirements: ["Go", "Docker", "PostgreSQL"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 42000,
    salaryMax: 56000,
    tags: ["DevOps", "PostgreSQL"],
    status: "ACTIVE",
    postedAt: beforeReference(9),
    expiresAt: null
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-011",
    title: "Frontend Intern",
    company: "Brightside",
    location: "Zaragoza",
    remoteType: "ON_SITE",
    description: "Prácticas en desarrollo frontend con Next.js.",
    requirements: ["JavaScript", "React"],
    seniority: "JUNIOR",
    contractType: "PART_TIME",
    salaryMin: null,
    salaryMax: null,
    tags: ["React", "Next.js"],
    status: "ACTIVE",
    postedAt: beforeReference(2),
    expiresAt: afterReference(30)
  },
  {
    source: "INTERNAL",
    externalId: "jobit-seed-012",
    title: "Lead Backend Engineer",
    company: "Corewave",
    location: "Madrid",
    remoteType: "HYBRID",
    description: "Liderazgo técnico de un equipo backend en Node.js.",
    requirements: ["Node.js", "PostgreSQL", "Prisma", "Leadership"],
    seniority: "SENIOR",
    contractType: "FULL_TIME",
    salaryMin: 70000,
    salaryMax: 90000,
    tags: ["Node.js", "PostgreSQL", "Prisma"],
    status: "ACTIVE",
    postedAt: beforeReference(10),
    expiresAt: null
  },
  {
    // Caso CLOSED (no debe aparecer en listado ni detalle) — a propósito, para pruebas manuales.
    source: "INTERNAL",
    externalId: "jobit-seed-013",
    title: "Closed Role - Fullstack",
    company: "Legacy Systems",
    location: "Bilbao",
    remoteType: "ON_SITE",
    description: "Oferta ya cerrada; sirve para validar el filtrado de status CLOSED.",
    requirements: ["TypeScript"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 35000,
    salaryMax: 45000,
    tags: ["TypeScript"],
    status: "CLOSED",
    postedAt: beforeReference(20),
    expiresAt: null
  },
  {
    // Caso expirado (ACTIVE pero expiresAt en el pasado) — a propósito, para pruebas manuales.
    source: "INTERNAL",
    externalId: "jobit-seed-014",
    title: "Expired Role - Frontend",
    company: "Timeout Inc",
    location: "Remoto",
    remoteType: "REMOTE",
    description: "Oferta vigente por estado pero expirada por fecha; valida la regla de expiración.",
    requirements: ["React"],
    seniority: "JUNIOR",
    contractType: "FREELANCE",
    salaryMin: 28000,
    salaryMax: 36000,
    tags: ["React", "TypeScript"],
    status: "ACTIVE",
    postedAt: beforeReference(40),
    expiresAt: beforeReference(5)
  }
];

export interface InternalSeedPrismaClient {
  job: {
    findFirst(args: {
      where: { source: "INTERNAL"; externalId: string };
      select?: { id: true };
    }): Promise<{ id: string } | null>;
    create(args: { data: Prisma.JobCreateInput }): Promise<{ id: string }>;
    update(args: { where: { id: string }; data: Prisma.JobUpdateInput }): Promise<{ id: string }>;
  };
  $disconnect(): Promise<void>;
}

export interface InternalSeedSummary {
  created: number;
  updated: number;
  total: number;
}

type JobContentFields = Pick<
  Prisma.JobCreateInput,
  | "title"
  | "company"
  | "location"
  | "remoteType"
  | "description"
  | "requirements"
  | "seniority"
  | "contractType"
  | "salaryMin"
  | "salaryMax"
  | "tags"
  | "status"
>;

function toContentFields(job: InternalSeedJob): JobContentFields {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    remoteType: job.remoteType,
    description: job.description,
    requirements: [...job.requirements],
    seniority: job.seniority,
    contractType: job.contractType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    tags: [...job.tags],
    status: job.status
  };
}

function toCreateData(job: InternalSeedJob): Prisma.JobCreateInput {
  return {
    ...toContentFields(job),
    source: job.source,
    externalId: job.externalId,
    postedAt: job.postedAt,
    expiresAt: job.expiresAt
  };
}

/**
 * Payload de actualización: solo contenido mutable. Nunca incluye `id`,
 * `source`, `externalId` ni los campos temporales de creación, para que una
 * actualización nunca produzca deriva ni rompa relaciones existentes.
 */
function toUpdateData(job: InternalSeedJob): Prisma.JobUpdateInput {
  return toContentFields(job);
}

/** Comprobación estructural de conflicto de unicidad, sin depender de la clase de error en runtime. */
function isUniqueConstraintConflict(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

async function upsertOne(
  client: InternalSeedPrismaClient,
  job: InternalSeedJob
): Promise<"created" | "updated"> {
  const existing = await client.job.findFirst({
    where: { source: job.source, externalId: job.externalId },
    select: { id: true }
  });

  if (existing) {
    await client.job.update({ where: { id: existing.id }, data: toUpdateData(job) });
    return "updated";
  }

  try {
    await client.job.create({ data: toCreateData(job) });
    return "created";
  } catch (err) {
    if (isUniqueConstraintConflict(err)) {
      const conflict = await client.job.findFirst({
        where: { source: job.source, externalId: job.externalId },
        select: { id: true }
      });
      if (conflict) {
        await client.job.update({ where: { id: conflict.id }, data: toUpdateData(job) });
        return "updated";
      }
    }
    throw err;
  }
}

/**
 * Siembra o actualiza el dataset controlado, sin ninguna operación global de
 * borrado: cada registro se localiza por `(source, externalId)` y se crea o
 * se actualiza por su propio `id`. Ninguna oferta ajena (otra fuente u otro
 * `externalId`) puede ser alcanzada por estas operaciones.
 */
export async function seedInternalJobs(client: InternalSeedPrismaClient): Promise<InternalSeedSummary> {
  const summary: InternalSeedSummary = { created: 0, updated: 0, total: 0 };
  for (const job of INTERNAL_SEED_JOBS) {
    const outcome = await upsertOne(client, job);
    if (outcome === "created") {
      summary.created += 1;
    } else {
      summary.updated += 1;
    }
    summary.total += 1;
  }
  return summary;
}

export interface RunInternalSeedDeps {
  env: EnvLike;
  createClient: () => InternalSeedPrismaClient;
}

/**
 * Runner del seed CLI: valida el destino antes de crear ningún cliente. Si
 * `assertSeedableDatabaseUrl` lanza, `createClient` nunca se invoca. El
 * cliente creado siempre se desconecta en `finally`, incluso si el servicio
 * falla; el fallo se propaga después de desconectar.
 */
export async function runInternalSeed(deps: RunInternalSeedDeps): Promise<InternalSeedSummary> {
  assertSeedableDatabaseUrl(deps.env);
  const client = deps.createClient();
  try {
    return await seedInternalJobs(client);
  } finally {
    await client.$disconnect();
  }
}

/**
 * Mensaje de fallo de vocabulario cerrado para el entrypoint CLI del seed.
 * Nunca reenvía el texto original de la excepción (ni `message`, `stack`,
 * `cause` o el objeto completo), que podría arrastrar credenciales, URLs o
 * rutas. Para un rechazo de la guarda de destino emite su código ya
 * sanitizado; cualquier otro valor colapsa a un único mensaje genérico.
 * Función pura: no hace logging.
 */
export function formatSeedFailure(error: unknown): string {
  if (error instanceof UnsafeDatabaseTargetError) {
    return `[seed] FAILED: UNSAFE_DATABASE_TARGET:${error.code}`;
  }
  return "[seed] FAILED: SEED_OPERATION_FAILED";
}
