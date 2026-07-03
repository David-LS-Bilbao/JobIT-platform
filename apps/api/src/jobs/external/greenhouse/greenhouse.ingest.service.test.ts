import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../lib/prisma.js";
import { truncateTables } from "../../../tests/setup.js";
import type { GreenhouseClientDeps } from "./greenhouse.client.js";
import type { GreenhouseCompany } from "./greenhouse.companies.js";
import type { GreenhouseBoardResponseInput } from "./greenhouse.schemas.js";
import type { GreenhouseJobPayload } from "./greenhouse.types.js";
import { ingestGreenhouseBoards } from "./greenhouse.ingest.service.js";

/**
 * Tests del servicio de ingesta de Greenhouse (backend-only, manual/controlado).
 *
 * NO se invoca desde routers ni requests: usa Prisma real de test y un `fetch` inyectado
 * (sin red). Verifica upsert idempotente por `(source, externalId)`, ingesta de varios
 * boards en serie, tolerancia a fallo parcial de un board y cap por board.
 */

const rawJob = (overrides: Partial<GreenhouseJobPayload> = {}): GreenhouseJobPayload => ({
  id: "5001",
  title: "Backend Engineer",
  updated_at: "2026-06-20T09:30:00-04:00",
  absolute_url: "https://boards.greenhouse.io/acme/jobs/5001",
  location: { name: "Remote" },
  content: "&lt;p&gt;Remote role&lt;/p&gt;",
  departments: [{ name: "Engineering" }],
  offices: [{ name: "Remote" }],
  ...overrides
});

const boardOf = (jobs: GreenhouseJobPayload[]): GreenhouseBoardResponseInput => ({
  jobs,
  meta: { total: jobs.length }
});

const company = (boardToken: string, name: string): GreenhouseCompany => ({
  boardToken,
  company: name
});

/** `fetch` inyectado: devuelve por board token; un `Error` en el mapa simula fallo. */
const fetchFromMap = (map: Record<string, GreenhouseBoardResponseInput | Error>) =>
  vi.fn(async (boardToken: string, _deps?: GreenhouseClientDeps) => {
    const entry = map[boardToken];
    if (entry instanceof Error) {
      throw entry;
    }
    if (!entry) {
      throw new Error(`unexpected board ${boardToken}`);
    }
    return entry;
  });

describe("ingestGreenhouseBoards", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // a) Persistencia de jobs válidos con procedencia GREENHOUSE
  it("normalizes and persists valid jobs as GREENHOUSE with provenance", async () => {
    const fetch = fetchFromMap({
      acme: boardOf([rawJob({ id: "5001" }), rawJob({ id: "5002" })])
    });

    const summary = await ingestGreenhouseBoards([company("acme", "Acme Inc.")], { fetch });

    expect(summary.boardsProcessed).toBe(1);
    expect(summary.boardsFailed).toBe(0);
    expect(summary.fetched).toBe(2);
    expect(summary.normalized).toBe(2);
    expect(summary.created).toBe(2);
    expect(summary.updated).toBe(0);

    const stored = await prisma.job.findMany({ where: { source: "GREENHOUSE" } });
    expect(stored).toHaveLength(2);
    const first = await prisma.job.findFirstOrThrow({
      where: { source: "GREENHOUSE", externalId: "5001" }
    });
    expect(first.company).toBe("Acme Inc.");
    expect(first.sourceUrl).toBe("https://boards.greenhouse.io/acme/jobs/5001");
    expect(first.ingestedAt).not.toBeNull();
  });

  // b) Upsert idempotente por (source, externalId)
  it("upserts idempotently by (source, externalId) on re-ingestion", async () => {
    const fetch = fetchFromMap({ acme: boardOf([rawJob({ id: "dup-1" })]) });

    const first = await ingestGreenhouseBoards([company("acme", "Acme Inc.")], { fetch });
    expect(first.created).toBe(1);
    expect(first.updated).toBe(0);

    const second = await ingestGreenhouseBoards([company("acme", "Acme Inc.")], { fetch });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);

    const count = await prisma.job.count({ where: { source: "GREENHOUSE" } });
    expect(count).toBe(1);
  });

  // c) Registro inválido individual no aborta el resto
  it("skips records that fail normalization without aborting the rest", async () => {
    const fetch = fetchFromMap({
      acme: boardOf([rawJob({ id: "5001" }), rawJob({ id: "5002", absolute_url: "" })])
    });

    const summary = await ingestGreenhouseBoards([company("acme", "Acme Inc.")], { fetch });

    expect(summary.fetched).toBe(2);
    expect(summary.normalized).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.created).toBe(1);

    const count = await prisma.job.count({ where: { source: "GREENHOUSE" } });
    expect(count).toBe(1);
  });

  // d) Varios boards en serie con resumen agregado
  it("processes multiple boards in series and aggregates the summary", async () => {
    const fetch = fetchFromMap({
      acme: boardOf([rawJob({ id: "a-1" })]),
      globex: boardOf([rawJob({ id: "g-1" }), rawJob({ id: "g-2" })])
    });

    const summary = await ingestGreenhouseBoards(
      [company("acme", "Acme Inc."), company("globex", "Globex")],
      { fetch }
    );

    expect(summary.boardsProcessed).toBe(2);
    expect(summary.boardsFailed).toBe(0);
    expect(summary.created).toBe(3);

    const globexJob = await prisma.job.findFirstOrThrow({
      where: { source: "GREENHOUSE", externalId: "g-1" }
    });
    expect(globexJob.company).toBe("Globex");
  });

  // e) Fallo parcial de un board tolerado
  it("tolerates a failing board and continues with the rest", async () => {
    const fetch = fetchFromMap({
      broken: new Error("network down"),
      globex: boardOf([rawJob({ id: "g-1" })])
    });

    const summary = await ingestGreenhouseBoards(
      [company("broken", "Broken"), company("globex", "Globex")],
      { fetch }
    );

    expect(summary.boardsFailed).toBe(1);
    expect(summary.boardsProcessed).toBe(1);
    expect(summary.created).toBe(1);

    const count = await prisma.job.count({ where: { source: "GREENHOUSE" } });
    expect(count).toBe(1);
  });

  // f) Cap por board (ING_LIMIT)
  it("caps jobs per board with limitPerBoard", async () => {
    const fetch = fetchFromMap({
      acme: boardOf([rawJob({ id: "1" }), rawJob({ id: "2" }), rawJob({ id: "3" })])
    });

    const summary = await ingestGreenhouseBoards([company("acme", "Acme Inc.")], {
      fetch,
      limitPerBoard: 2
    });

    expect(summary.fetched).toBe(2);
    expect(summary.created).toBe(2);

    const count = await prisma.job.count({ where: { source: "GREENHOUSE" } });
    expect(count).toBe(2);
  });
});
