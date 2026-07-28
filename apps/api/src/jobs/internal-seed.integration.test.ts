import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { INTERNAL_SEED_JOBS, seedInternalJobs } from "./internal-seed.service.js";

/**
 * Tests de integración de DATA-04 (Sprint 23) contra la base de test real.
 * Usa el `prisma` compartido del proyecto y `truncateTables` (misma
 * convención que el resto de `*.integration.test.ts`); `DATABASE_URL_TEST`
 * se resuelve por la configuración normal de Vitest — ninguna URL
 * hardcodeada. No se crea ni se ejecuta nada fuera de lo ya autorizado por
 * el resto de la suite: la limpieza previa usa exclusivamente
 * `truncateTables`, nunca un borrado ad-hoc.
 */

describe("seedInternalJobs — integration", () => {
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("first run creates the 14 controlled Jobs", async () => {
    const summary = await seedInternalJobs(prisma);

    expect(summary).toEqual({ created: 14, updated: 0, total: 14 });

    const rows = await prisma.job.findMany({
      where: { source: "INTERNAL", externalId: { startsWith: "jobit-seed-" } }
    });
    expect(rows).toHaveLength(14);
    expect(rows.map((row) => row.externalId).sort()).toEqual(
      INTERNAL_SEED_JOBS.map((job) => job.externalId).sort()
    );
  });

  it("second run does not duplicate, updates the 14 existing records, and keeps their ids", async () => {
    await seedInternalJobs(prisma);
    const first = await prisma.job.findMany({
      where: { source: "INTERNAL", externalId: { startsWith: "jobit-seed-" } },
      select: { id: true }
    });

    const summary = await seedInternalJobs(prisma);

    expect(summary).toEqual({ created: 0, updated: 14, total: 14 });
    const second = await prisma.job.findMany({
      where: { source: "INTERNAL", externalId: { startsWith: "jobit-seed-" } },
      select: { id: true }
    });
    expect(second).toHaveLength(14);
    expect(new Set(second.map((row) => row.id))).toEqual(new Set(first.map((row) => row.id)));
  });

  it("leaves a foreign JOOBLE Job untouched", async () => {
    const foreign = await prisma.job.create({
      data: {
        title: "External Role",
        company: "Acme External",
        remoteType: "REMOTE",
        description: "External offer, not part of the controlled dataset.",
        requirements: [],
        seniority: "MID",
        contractType: "FULL_TIME",
        tags: [],
        status: "ACTIVE",
        source: "JOOBLE",
        externalId: "jooble-external-1",
        sourceUrl: "https://jooble.org/jdp/external-1"
      }
    });

    await seedInternalJobs(prisma);

    const after = await prisma.job.findUnique({ where: { id: foreign.id } });
    expect(after).toEqual(foreign);
  });

  it("leaves an out-of-namespace INTERNAL Job untouched", async () => {
    const foreignInternal = await prisma.job.create({
      data: {
        title: "Manually Added Internal Role",
        company: "Acme Internal",
        remoteType: "ON_SITE",
        description: "Not part of the seed dataset namespace.",
        requirements: [],
        seniority: "MID",
        contractType: "FULL_TIME",
        tags: [],
        status: "ACTIVE",
        source: "INTERNAL",
        externalId: "manually-added-internal-1"
      }
    });

    await seedInternalJobs(prisma);

    const after = await prisma.job.findUnique({ where: { id: foreignInternal.id } });
    expect(after).toEqual(foreignInternal);
  });

  it("preserves a SavedJob across a second seed run", async () => {
    const user = await prisma.user.create({
      data: {
        email: "seed-integration-saved@example.com",
        passwordHash: "not-a-real-hash"
      }
    });

    await seedInternalJobs(prisma);
    const firstSeedJob = INTERNAL_SEED_JOBS[0];
    if (!firstSeedJob) {
      throw new Error("INTERNAL_SEED_JOBS is unexpectedly empty");
    }
    const seededJob = await prisma.job.findFirstOrThrow({
      where: { source: "INTERNAL", externalId: firstSeedJob.externalId }
    });

    const saved = await prisma.savedJob.create({
      data: { userId: user.id, jobId: seededJob.id }
    });

    await seedInternalJobs(prisma);

    const stillThere = await prisma.savedJob.findUnique({ where: { id: saved.id } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.userId).toBe(user.id);
    expect(stillThere?.jobId).toBe(seededJob.id);
  });
});
