import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../lib/prisma.js";
import { truncateTables } from "../../../tests/setup.js";
import { JoobleConfigError, type JoobleClientDeps, type JoobleSearchParams } from "./jooble.client.js";
import type { JoobleSearchResponseInput } from "./jooble.schemas.js";
import type { JoobleJobPayload } from "./jooble.types.js";
import { ingestJoobleJobs } from "./jooble.ingest.service.js";

/**
 * Tests RED del servicio de ingesta de Jooble (Fase 4D-RED).
 *
 * Fijan el contrato de `ingestJoobleJobs(params, deps)` antes de implementar
 * `jooble.ingest.service.ts`. El servicio es **backend-only y manual/controlado**:
 * NO se invoca desde routers ni desde requests del candidato. Por eso este test
 * no toca `app`/endpoints; usa Prisma real de test y un `search` inyectado (sin red,
 * sin `JOOBLE_API_KEY` real; key ficticia por deps).
 *
 * Falla mientras `./jooble.ingest.service.js` no exista (módulo inexistente).
 */

const API_KEY = "test-jooble-key";

const rawJob = (overrides: Partial<JoobleJobPayload> = {}): JoobleJobPayload => ({
  id: "-1000000001",
  title: "Senior Backend Engineer",
  company: "Datapeak",
  location: "Remoto",
  snippet: "Puesto 100% remoto. APIs en Node.js con PostgreSQL y Prisma.",
  salary: "45000-60000 €",
  type: "Full-time",
  link: "https://jooble.org/jdp/1000000001",
  updated: "2026-06-20T09:30:00",
  source: "infojobs",
  ...overrides
});

const payloadOf = (jobs: JoobleJobPayload[]): JoobleSearchResponseInput => ({
  totalCount: jobs.length,
  jobs
});

/** `search` inyectado: misma firma que `searchJoobleJobs`, sin red. */
const searchReturning = (payload: JoobleSearchResponseInput) =>
  vi.fn(async (_params: JoobleSearchParams, _deps: JoobleClientDeps) => payload);

describe("ingestJoobleJobs", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // a) API key ausente
  it("rejects with JoobleConfigError when the API key is missing and does not call search", async () => {
    const search = searchReturning(payloadOf([rawJob()]));

    await expect(
      ingestJoobleJobs({ keywords: "node" }, { apiKey: "   ", search })
    ).rejects.toBeInstanceOf(JoobleConfigError);

    expect(search).not.toHaveBeenCalled();
  });

  // b) Persistencia de jobs válidos
  it("normalizes and persists valid jobs as JOOBLE with provenance", async () => {
    const search = searchReturning(
      payloadOf([rawJob({ id: "-1000000001" }), rawJob({ id: "-1000000002" })])
    );

    const summary = await ingestJoobleJobs({ keywords: "node" }, { apiKey: API_KEY, search });

    expect(summary.fetched).toBe(2);
    expect(summary.normalized).toBe(2);
    expect(summary.skipped).toBe(0);
    expect(summary.created).toBe(2);
    expect(summary.updated).toBe(0);

    const stored = await prisma.job.findMany({ where: { source: "JOOBLE" } });
    expect(stored).toHaveLength(2);
    const first = await prisma.job.findFirstOrThrow({
      where: { source: "JOOBLE", externalId: "-1000000001" }
    });
    expect(first.sourceUrl).toBe("https://jooble.org/jdp/1000000001");
    expect(first.ingestedAt).not.toBeNull();
  });

  // c) Registro inválido individual no aborta la ingesta
  it("skips records that fail normalization without aborting the rest", async () => {
    const search = searchReturning(
      payloadOf([
        rawJob({ id: "-1000000001" }),
        rawJob({ id: "", title: "Broken (empty id)" })
      ])
    );

    const summary = await ingestJoobleJobs({ keywords: "node" }, { apiKey: API_KEY, search });

    expect(summary.fetched).toBe(2);
    expect(summary.normalized).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.created).toBe(1);

    const count = await prisma.job.count({ where: { source: "JOOBLE" } });
    expect(count).toBe(1);
  });

  // d) Upsert idempotente por (source, externalId)
  it("upserts idempotently by (source, externalId) on re-ingestion", async () => {
    const search = searchReturning(payloadOf([rawJob({ id: "-dup-1" })]));

    const first = await ingestJoobleJobs({ keywords: "node" }, { apiKey: API_KEY, search });
    expect(first.created).toBe(1);
    expect(first.updated).toBe(0);

    const second = await ingestJoobleJobs({ keywords: "node" }, { apiKey: API_KEY, search });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);

    const count = await prisma.job.count({ where: { source: "JOOBLE" } });
    expect(count).toBe(1);
  });

  // e) No exposición de la API key en errores
  it("does not leak the API key when search fails", async () => {
    const search = vi.fn(async (_params: JoobleSearchParams, _deps: JoobleClientDeps) => {
      throw new Error("upstream failure");
    });

    let error: unknown;
    try {
      await ingestJoobleJobs({ keywords: "node" }, { apiKey: API_KEY, search });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(API_KEY);
  });
});
