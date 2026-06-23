import { type Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests RED de provenance (Fase 3B-RED).
 *
 * Expresan el contrato de provenance aprobado en Fase 3A antes de tocar Prisma.
 * Mientras no exista la migración `add_job_provenance`, estos tests fallan:
 * los campos `source`, `externalId`, `sourceUrl`, `ingestedAt` y el valor de enum
 * `RemoteType.UNSPECIFIED` aún no existen (fallo de typecheck y/o de Prisma).
 *
 * Sin red, sin JOOBLE_API_KEY, sin cliente HTTP: solo Prisma directo contra la DB de test.
 */

const baseJob = (overrides: Partial<Prisma.JobCreateInput> = {}): Prisma.JobCreateInput => ({
  title: "Software Engineer",
  company: "Acme",
  location: "Bilbao",
  remoteType: "REMOTE",
  description: "Generic job description",
  requirements: ["TypeScript"],
  seniority: "MID",
  contractType: "FULL_TIME",
  tags: ["TypeScript"],
  status: "ACTIVE",
  ...overrides
});

const joobleJob = (externalId: string): Prisma.JobCreateInput =>
  baseJob({
    title: "External Role",
    company: "Jooble Source",
    source: "JOOBLE",
    externalId,
    sourceUrl: `https://jooble.org/jobs/${externalId}`,
    ingestedAt: new Date(),
    remoteType: "UNSPECIFIED"
  });

describe("Job provenance model", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // a) Jobs internos: source por defecto INTERNAL, provenance nula.
  it("defaults an internal job to source INTERNAL with null provenance", async () => {
    const created = await prisma.job.create({ data: baseJob() });

    expect(created.source).toBe("INTERNAL");
    expect(created.externalId).toBeNull();
    expect(created.sourceUrl).toBeNull();
    expect(created.ingestedAt).toBeNull();
  });

  // b) Jobs Jooble/external: provenance completa y remoteType UNSPECIFIED.
  it("persists a Jooble job with full provenance and remoteType UNSPECIFIED", async () => {
    const created = await prisma.job.create({ data: joobleJob("ext-1") });

    const stored = await prisma.job.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.source).toBe("JOOBLE");
    expect(stored.externalId).toBe("ext-1");
    expect(stored.sourceUrl).toBe("https://jooble.org/jobs/ext-1");
    expect(stored.ingestedAt).not.toBeNull();
    expect(stored.remoteType).toBe("UNSPECIFIED");
  });

  // c) Deduplicación: (source=JOOBLE, externalId) único.
  it("rejects duplicate Jooble jobs with the same (source, externalId)", async () => {
    await prisma.job.create({ data: joobleJob("dup-1") });

    await expect(prisma.job.create({ data: joobleJob("dup-1") })).rejects.toThrow();
  });

  // d) Compatibilidad internos: múltiples INTERNAL con externalId null coexisten.
  it("allows multiple internal jobs with null externalId to coexist", async () => {
    await prisma.job.create({ data: baseJob({ title: "Internal A" }) });
    await prisma.job.create({ data: baseJob({ title: "Internal B" }) });

    const internalCount = await prisma.job.count({
      where: { source: "INTERNAL", externalId: null }
    });
    expect(internalCount).toBe(2);
  });
});
