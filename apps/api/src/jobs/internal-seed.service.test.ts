import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { UnsafeDatabaseTargetError } from "../lib/database-safety.js";
import {
  INTERNAL_SEED_JOBS,
  SEED_REFERENCE_DATE,
  formatSeedFailure,
  runInternalSeed,
  seedInternalJobs,
  type InternalSeedPrismaClient
} from "./internal-seed.service.js";

/**
 * Suite DB-free de DATA-04. Ningún test crea un `PrismaClient` real ni se
 * conecta a PostgreSQL: se usa un cliente fake en memoria que implementa
 * exactamente `InternalSeedPrismaClient`. Todas las credenciales/hosts son
 * ficticios y no operativos.
 */

interface FakeJobRecord {
  id: string;
  source: string;
  externalId: string | null;
  [key: string]: unknown;
}

function createFakeClient(initial: FakeJobRecord[] = []) {
  const jobs = new Map<string, FakeJobRecord>(initial.map((j) => [j.id, { ...j }]));
  let nextId = 1;

  const findFirst = vi.fn(
    async ({ where }: { where: { source: string; externalId: string } }) => {
      for (const job of jobs.values()) {
        if (job.source === where.source && job.externalId === where.externalId) {
          return { id: job.id };
        }
      }
      return null;
    }
  );

  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const id = `fake-${nextId++}`;
    const record = { id, ...data } as FakeJobRecord;
    jobs.set(id, record);
    return { id };
  });

  const update = vi.fn(
    async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const existing = jobs.get(where.id);
      if (!existing) {
        throw new Error("fake record not found");
      }
      const updated = { ...existing, ...data };
      jobs.set(where.id, updated);
      return { id: where.id };
    }
  );

  const $disconnect = vi.fn(async () => undefined);

  const client: InternalSeedPrismaClient = { job: { findFirst, update, create }, $disconnect };
  return { client, jobs, spies: { findFirst, create, update, $disconnect } };
}

describe("INTERNAL_SEED_JOBS", () => {
  it("contains exactly 14 records", () => {
    expect(INTERNAL_SEED_JOBS).toHaveLength(14);
  });

  it("has 14 unique externalId values", () => {
    const ids = INTERNAL_SEED_JOBS.map((job) => job.externalId);
    expect(new Set(ids).size).toBe(14);
  });

  it("uses exactly jobit-seed-001 through jobit-seed-014", () => {
    const ids = [...INTERNAL_SEED_JOBS.map((job) => job.externalId)].sort();
    const expected = Array.from(
      { length: 14 },
      (_, i) => `jobit-seed-${String(i + 1).padStart(3, "0")}`
    ).sort();
    expect(ids).toEqual(expected);
  });

  it("marks every record as source INTERNAL", () => {
    expect(INTERNAL_SEED_JOBS.every((job) => job.source === "INTERNAL")).toBe(true);
  });

  it("derives postedAt from the fixed SEED_REFERENCE_DATE, not from the current instant", () => {
    const first = INTERNAL_SEED_JOBS[0];
    expect(first).toBeDefined();
    const oneDayMs = 24 * 60 * 60 * 1000;
    expect(first?.postedAt.getTime()).toBe(SEED_REFERENCE_DATE.getTime() - oneDayMs);
  });

  it("produces identical temporal values across two independent reads of the dataset", () => {
    const a = INTERNAL_SEED_JOBS.map((job) => job.postedAt.getTime());
    const b = INTERNAL_SEED_JOBS.map((job) => job.postedAt.getTime());
    expect(a).toEqual(b);
    const now = Date.now();
    for (const t of a) {
      expect(Math.abs(now - t)).toBeGreaterThan(24 * 60 * 60 * 1000);
    }
  });
});

describe("seedInternalJobs — first run", () => {
  it("creates all 14 records when none exist", async () => {
    const { client, jobs } = createFakeClient([]);
    const summary = await seedInternalJobs(client);
    expect(summary).toEqual({ created: 14, updated: 0, total: 14 });
    expect(jobs.size).toBe(14);
  });

  it("never calls a delete-like operation (the client interface exposes none)", () => {
    const { client } = createFakeClient([]);
    expect(client.job).not.toHaveProperty("delete");
    expect(client.job).not.toHaveProperty("deleteMany");
  });
});

describe("seedInternalJobs — second run (idempotency)", () => {
  it("does not duplicate, updates the 14 existing records, and preserves their ids", async () => {
    const { client, jobs } = createFakeClient([]);
    await seedInternalJobs(client);
    const idsAfterFirst = [...jobs.keys()].sort();

    const summary = await seedInternalJobs(client);

    expect(summary).toEqual({ created: 0, updated: 14, total: 14 });
    expect(jobs.size).toBe(14);
    expect([...jobs.keys()].sort()).toEqual(idsAfterFirst);
  });
});

describe("seedInternalJobs — controlled update", () => {
  it("updates by id without touching source/externalId/postedAt/expiresAt", async () => {
    const { client, jobs, spies } = createFakeClient([]);
    await seedInternalJobs(client);
    const [firstId, firstRecord] = [...jobs.entries()][0] as [string, FakeJobRecord];
    const original = { ...firstRecord };

    spies.update.mockClear();
    await seedInternalJobs(client);

    expect(spies.update).toHaveBeenCalled();
    for (const call of spies.update.mock.calls) {
      const args = call[0] as { data: Record<string, unknown> };
      expect(args.data).not.toHaveProperty("source");
      expect(args.data).not.toHaveProperty("externalId");
      expect(args.data).not.toHaveProperty("postedAt");
      expect(args.data).not.toHaveProperty("expiresAt");
      expect(args.data).not.toHaveProperty("id");
    }

    const record = jobs.get(firstId);
    expect(record?.["postedAt"]).toBe(original["postedAt"]);
    expect(record?.["expiresAt"]).toBe(original["expiresAt"]);
    expect(record?.["externalId"]).toBe(original["externalId"]);
    expect(record?.["source"]).toBe(original["source"]);
  });

  it("updates mutable content when the dataset entry differs from the stored record", async () => {
    const seedEntry = INTERNAL_SEED_JOBS[0];
    expect(seedEntry).toBeDefined();
    const { client, jobs } = createFakeClient([
      {
        id: "existing-1",
        source: "INTERNAL",
        externalId: seedEntry?.externalId ?? "",
        title: "Stale Title"
      }
    ]);

    await seedInternalJobs(client);

    const record = jobs.get("existing-1");
    expect(record?.["title"]).toBe(seedEntry?.title);
    expect(record?.["title"]).not.toBe("Stale Title");
  });
});

describe("seedInternalJobs — foreign data protection", () => {
  it("leaves JOOBLE, GREENHOUSE, and out-of-namespace INTERNAL jobs untouched", async () => {
    const foreignJobs: FakeJobRecord[] = [
      { id: "jooble-1", source: "JOOBLE", externalId: "jooble-ext-1", title: "Jooble Job" },
      { id: "greenhouse-1", source: "GREENHOUSE", externalId: "gh-ext-1", title: "Greenhouse Job" },
      {
        id: "internal-foreign-1",
        source: "INTERNAL",
        externalId: "some-other-internal-id",
        title: "Foreign Internal Job"
      }
    ];
    const { client, jobs, spies } = createFakeClient(foreignJobs);

    await seedInternalJobs(client);

    expect(jobs.get("jooble-1")).toEqual(foreignJobs[0]);
    expect(jobs.get("greenhouse-1")).toEqual(foreignJobs[1]);
    expect(jobs.get("internal-foreign-1")).toEqual(foreignJobs[2]);

    const touchedIds = spies.update.mock.calls.map((call) => (call[0] as { where: { id: string } }).where.id);
    expect(touchedIds).not.toContain("jooble-1");
    expect(touchedIds).not.toContain("greenhouse-1");
    expect(touchedIds).not.toContain("internal-foreign-1");
  });
});

describe("seedInternalJobs — Saved Jobs preservation (DB-free evidence)", () => {
  it("updates existing controlled records by id instead of recreating them across runs", async () => {
    const { client, jobs } = createFakeClient([]);
    await seedInternalJobs(client);
    const idsAfterFirst = new Set(jobs.keys());

    await seedInternalJobs(client);

    expect(new Set(jobs.keys())).toEqual(idsAfterFirst);
  });

  it("exposes no delete-like operation across the whole run (structural guarantee)", async () => {
    const { client } = createFakeClient([]);
    await seedInternalJobs(client);
    await seedInternalJobs(client);
    expect(client.job).not.toHaveProperty("delete");
    expect(client.job).not.toHaveProperty("deleteMany");
  });
});

describe("seedInternalJobs — P2002 race handling", () => {
  it("re-locates and updates by id when create fails with P2002, without duplicating", async () => {
    const { client, jobs, spies } = createFakeClient([]);
    const targetExternalId = INTERNAL_SEED_JOBS[0]?.externalId ?? "";

    spies.create.mockImplementationOnce(async () => {
      jobs.set("race-winner-1", {
        id: "race-winner-1",
        source: "INTERNAL",
        externalId: targetExternalId
      });
      throw { code: "P2002" };
    });

    await seedInternalJobs(client);

    const withThatExternalId = [...jobs.values()].filter(
      (job) => job.source === "INTERNAL" && job.externalId === targetExternalId
    );
    expect(withThatExternalId).toHaveLength(1);
    expect(withThatExternalId[0]?.id).toBe("race-winner-1");
  });

  it("propagates errors that are not P2002", async () => {
    const { client, spies } = createFakeClient([]);
    spies.create.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    await expect(seedInternalJobs(client)).rejects.toThrow("boom");
  });
});

describe("runInternalSeed", () => {
  const FAKE_USER = "fake-user";
  const FAKE_PASSWORD = "fake-password";
  const url = (name: string): string =>
    `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@invalid.local:5432/${name}`;

  function fakeClientFactory(overrides: Partial<InternalSeedPrismaClient["job"]> = {}) {
    const disconnect = vi.fn(async () => undefined);
    const createClient = vi.fn(
      (): InternalSeedPrismaClient => ({
        job: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({ id: "x" }),
          create: vi.fn().mockResolvedValue({ id: "x" }),
          ...overrides
        },
        $disconnect: disconnect
      })
    );
    return { createClient, disconnect };
  }

  it("creates a client for a DEVELOPMENT target", async () => {
    const { createClient } = fakeClientFactory();
    await runInternalSeed({ env: { DATABASE_URL: url("jobit_dev") }, createClient });
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("creates a client for an E2E target", async () => {
    const { createClient } = fakeClientFactory();
    await runInternalSeed({ env: { DATABASE_URL: url("jobit_e2e") }, createClient });
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("blocks a TEST target before creating a client", async () => {
    const { createClient } = fakeClientFactory();
    await expect(
      runInternalSeed({ env: { DATABASE_URL: url("jobit_test") }, createClient })
    ).rejects.toThrow(UnsafeDatabaseTargetError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("blocks a STAGING target before creating a client", async () => {
    const { createClient } = fakeClientFactory();
    await expect(
      runInternalSeed({ env: { DATABASE_URL: url("jobit_staging") }, createClient })
    ).rejects.toThrow(UnsafeDatabaseTargetError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("blocks a PRODUCTION target before creating a client", async () => {
    const { createClient } = fakeClientFactory();
    await expect(
      runInternalSeed({ env: { DATABASE_URL: url("jobit_production") }, createClient })
    ).rejects.toThrow(UnsafeDatabaseTargetError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("blocks an UNKNOWN target before creating a client", async () => {
    const { createClient } = fakeClientFactory();
    await expect(
      runInternalSeed({ env: { DATABASE_URL: url("customer_data") }, createClient })
    ).rejects.toThrow(UnsafeDatabaseTargetError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("blocks an AMBIGUOUS target before creating a client", async () => {
    const { createClient } = fakeClientFactory();
    await expect(
      runInternalSeed({ env: { DATABASE_URL: url("jobit_test_prod") }, createClient })
    ).rejects.toThrow(UnsafeDatabaseTargetError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("blocks when NODE_ENV is production before creating a client", async () => {
    const { createClient } = fakeClientFactory();
    await expect(
      runInternalSeed({
        env: { DATABASE_URL: url("jobit_dev"), NODE_ENV: "production" },
        createClient
      })
    ).rejects.toThrow(UnsafeDatabaseTargetError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("disconnects the client after a successful run", async () => {
    const { createClient, disconnect } = fakeClientFactory();
    await runInternalSeed({ env: { DATABASE_URL: url("jobit_dev") }, createClient });
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("disconnects the client even when the service throws", async () => {
    const { createClient, disconnect } = fakeClientFactory({
      findFirst: vi.fn().mockRejectedValue(new Error("boom"))
    });

    await expect(
      runInternalSeed({ env: { DATABASE_URL: url("jobit_dev") }, createClient })
    ).rejects.toThrow("boom");
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("never includes credentials or the full URL in a rejection", async () => {
    const { createClient } = fakeClientFactory();
    try {
      await runInternalSeed({ env: { DATABASE_URL: url("jobit_production") }, createClient });
      expect.unreachable("expected runInternalSeed to reject");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain(FAKE_USER);
      expect(message).not.toContain(FAKE_PASSWORD);
      expect(message).not.toContain(url("jobit_production"));
    }
  });
});

describe("formatSeedFailure", () => {
  const FAKE_USER = "fake-user";
  const FAKE_PASSWORD = "fake-password";
  const FAKE_URL = `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@invalid.local:5432/jobit_production`;
  const GENERIC = "[seed] FAILED: SEED_OPERATION_FAILED";
  /** Los dos únicos formatos de salida permitidos por la spec. */
  const CLOSED_FORMAT = /^\[seed\] FAILED: (SEED_OPERATION_FAILED|UNSAFE_DATABASE_TARGET:[A-Z_]+)$/;

  it("returns the safe prefix and code for a known UnsafeDatabaseTargetError", () => {
    const err = new UnsafeDatabaseTargetError(
      "PRODUCTION_ENVIRONMENT",
      "Seeding is not allowed when NODE_ENV is production."
    );
    expect(formatSeedFailure(err)).toBe("[seed] FAILED: UNSAFE_DATABASE_TARGET:PRODUCTION_ENVIRONMENT");
  });

  it("does not expose a fake URL carried in an ordinary error", () => {
    const err = new Error(`connection refused for ${FAKE_URL}`);
    const formatted = formatSeedFailure(err);
    expect(formatted).toBe(GENERIC);
    expect(formatted).not.toContain(FAKE_URL);
  });

  it("does not expose a fake username carried in an ordinary error", () => {
    const err = new Error(`authentication failed for user ${FAKE_USER}`);
    expect(formatSeedFailure(err)).not.toContain(FAKE_USER);
  });

  it("does not expose a fake password carried in an ordinary error", () => {
    const err = new Error(`password rejected: ${FAKE_PASSWORD}`);
    expect(formatSeedFailure(err)).not.toContain(FAKE_PASSWORD);
  });

  it("does not expose a sensitive stack trace", () => {
    const err = new Error("boom");
    err.stack = `Error: boom\n    at /secret/path/with/${FAKE_PASSWORD}/seed.ts:1:1`;
    const formatted = formatSeedFailure(err);
    expect(formatted).toBe(GENERIC);
    expect(formatted).not.toContain(FAKE_PASSWORD);
    expect(formatted).not.toContain("at ");
  });

  it("does not expose an error cause", () => {
    const err = new Error("outer", { cause: new Error(`inner with ${FAKE_URL}`) });
    const formatted = formatSeedFailure(err);
    expect(formatted).toBe(GENERIC);
    expect(formatted).not.toContain(FAKE_URL);
  });

  it("returns the generic message for a sensitive string", () => {
    expect(formatSeedFailure(`connection string ${FAKE_URL}`)).toBe(GENERIC);
  });

  it("returns the generic message for a sensitive object", () => {
    expect(formatSeedFailure({ url: FAKE_URL, password: FAKE_PASSWORD })).toBe(GENERIC);
  });

  it("returns the generic message for null", () => {
    expect(formatSeedFailure(null)).toBe(GENERIC);
  });

  it("returns the generic message for undefined", () => {
    expect(formatSeedFailure(undefined)).toBe(GENERIC);
  });

  it("returns the generic message for a Prisma-shaped error", () => {
    expect(formatSeedFailure({ code: "P2002", message: `unique constraint on ${FAKE_URL}` })).toBe(
      GENERIC
    );
  });

  it("never copies the original message verbatim", () => {
    const original = "super secret database password xyz";
    expect(formatSeedFailure(new Error(original))).not.toContain(original);
  });

  it.each([
    new UnsafeDatabaseTargetError("MISSING", "missing"),
    new UnsafeDatabaseTargetError("UNSAFE_CLASSIFICATION", `unsafe ${FAKE_URL}`),
    new Error(FAKE_URL),
    "a string",
    { some: "object" },
    null,
    undefined,
    42
  ])("only ever produces one of the approved closed formats (%#)", (value) => {
    expect(formatSeedFailure(value)).toMatch(CLOSED_FORMAT);
  });
});

describe("static regression: no destructive global operations in seed sources", () => {
  it("apps/api/prisma/seed.ts contains no global delete/deleteMany/TRUNCATE", () => {
    const source = readFileSync(fileURLToPath(new URL("../../prisma/seed.ts", import.meta.url)), "utf8");
    expect(source).not.toMatch(/job\.deleteMany/);
    expect(source).not.toMatch(/job\.delete\(/);
    expect(source).not.toMatch(/TRUNCATE/);
  });

  it("internal-seed.service.ts contains no global delete/deleteMany/TRUNCATE", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./internal-seed.service.ts", import.meta.url)),
      "utf8"
    );
    expect(source).not.toMatch(/job\.deleteMany/);
    expect(source).not.toMatch(/job\.delete\(/);
    expect(source).not.toMatch(/TRUNCATE/);
  });

  it("apps/api/prisma/seed.ts never references a raw error's message or stack directly", () => {
    const source = readFileSync(fileURLToPath(new URL("../../prisma/seed.ts", import.meta.url)), "utf8");
    expect(source).not.toMatch(/\.stack\b/);
    expect(source).not.toMatch(/\berr(or)?\.message\b/);
  });
});

/**
 * Fase C — marcado sintetico y convergencia del dataset gestionado.
 * Spec: `docs/specs/features/staging-technical-readiness.md` §9.1 y §9.2.
 */

const SYNTHETIC_COMPANY_PREFIX = "JobIT Synthetic · ";
const SYNTHETIC_DESCRIPTION_PREFIX = "[SYNTHETIC TEST DATA] ";

describe("INTERNAL_SEED_JOBS — marcado sintetico", () => {
  it("marca la empresa de las 14 ofertas con el prefijo canonico", () => {
    for (const job of INTERNAL_SEED_JOBS) {
      expect(job.company.startsWith(SYNTHETIC_COMPANY_PREFIX)).toBe(true);
    }
  });

  it("marca la descripcion de las 14 ofertas con el prefijo canonico", () => {
    for (const job of INTERNAL_SEED_JOBS) {
      expect(job.description.startsWith(SYNTHETIC_DESCRIPTION_PREFIX)).toBe(true);
    }
  });

  it("el prefijo va al PRINCIPIO de company: el truncado de la tarjeta recorta por el final", () => {
    for (const job of INTERNAL_SEED_JOBS) {
      expect(job.company.indexOf(SYNTHETIC_COMPANY_PREFIX)).toBe(0);
    }
  });

  it("conserva la empresa original detras del marcador", () => {
    const companies = INTERNAL_SEED_JOBS.map((job) =>
      job.company.slice(SYNTHETIC_COMPANY_PREFIX.length)
    );
    expect(companies).toContain("Nova Labs");
    expect(companies).toContain("Datapeak");
    expect(companies.every((company) => company.length > 0)).toBe(true);
  });

  it("no marca dos veces si el dataset se lee repetidamente", () => {
    for (const job of INTERNAL_SEED_JOBS) {
      expect(job.company.split(SYNTHETIC_COMPANY_PREFIX).length - 1).toBe(1);
      expect(job.description.split(SYNTHETIC_DESCRIPTION_PREFIX).length - 1).toBe(1);
    }
  });

  it("conserva source, externalId y titulo intactos", () => {
    expect(INTERNAL_SEED_JOBS).toHaveLength(14);
    for (const job of INTERNAL_SEED_JOBS) {
      expect(job.source).toBe("INTERNAL");
      expect(job.externalId).toMatch(/^jobit-seed-\d{3}$/);
      expect(job.title.startsWith(SYNTHETIC_COMPANY_PREFIX)).toBe(false);
      expect(job.title.length).toBeGreaterThan(0);
    }
  });

  it("no introduce el marcador en tags ni en requirements", () => {
    for (const job of INTERNAL_SEED_JOBS) {
      for (const value of [...job.tags, ...job.requirements]) {
        expect(value).not.toContain("SYNTHETIC");
        expect(value).not.toContain("JobIT Synthetic");
      }
    }
  });

  it("conserva la logica salarial y los casos especiales del dataset", () => {
    const closed = INTERNAL_SEED_JOBS.filter((job) => job.status === "CLOSED");
    const expired = INTERNAL_SEED_JOBS.filter(
      (job) => job.status === "ACTIVE" && job.expiresAt !== null && job.expiresAt < SEED_REFERENCE_DATE
    );
    expect(closed).toHaveLength(1);
    expect(expired).toHaveLength(1);
    expect(INTERNAL_SEED_JOBS.filter((job) => job.salaryMin === null)).toHaveLength(1);
  });
});

describe("seedInternalJobs — convergencia del dataset gestionado", () => {
  it("converge una fila gestionada con valores antiguos SIN marcar al valor canonico, sin duplicar", async () => {
    const canonical = INTERNAL_SEED_JOBS[0];
    expect(canonical).toBeDefined();
    if (!canonical) return;

    // Estado tipico de una base persistente sembrada ANTES del marcado.
    const stale: FakeJobRecord = {
      id: "persisted-1",
      source: "INTERNAL",
      externalId: canonical.externalId,
      title: canonical.title,
      company: "Nova Labs",
      description: "Desarrollo de interfaces con React y TypeScript para producto SaaS.",
      status: "ACTIVE"
    };

    const { client, jobs } = createFakeClient([stale]);
    await seedInternalJobs(client);

    // Misma fila logica: mismo id, sin duplicado.
    const matching = [...jobs.values()].filter(
      (job) => job.source === "INTERNAL" && job.externalId === canonical.externalId
    );
    expect(matching).toHaveLength(1);
    expect(matching[0]?.id).toBe("persisted-1");

    // Valores canonicos marcados restaurados.
    expect(matching[0]?.["company"]).toBe(canonical.company);
    expect(matching[0]?.["description"]).toBe(canonical.description);
    expect(String(matching[0]?.["company"])).toContain(SYNTHETIC_COMPANY_PREFIX);
    expect(String(matching[0]?.["description"])).toContain(SYNTHETIC_DESCRIPTION_PREFIX);
  });

  it("converge las 14 filas gestionadas cuando TODAS estan sin marcar", async () => {
    const staleAll: FakeJobRecord[] = INTERNAL_SEED_JOBS.map((job, index) => ({
      id: `persisted-${index}`,
      source: "INTERNAL",
      externalId: job.externalId,
      company: job.company.slice(SYNTHETIC_COMPANY_PREFIX.length),
      description: job.description.slice(SYNTHETIC_DESCRIPTION_PREFIX.length)
    }));

    const { client, jobs } = createFakeClient(staleAll);
    const summary = await seedInternalJobs(client);

    expect(summary).toEqual({ created: 0, updated: 14, total: 14 });
    expect(jobs.size).toBe(14);
    for (const job of jobs.values()) {
      expect(String(job["company"]).startsWith(SYNTHETIC_COMPANY_PREFIX)).toBe(true);
      expect(String(job["description"]).startsWith(SYNTHETIC_DESCRIPTION_PREFIX)).toBe(true);
    }
  });

  it("no toca una oferta ajena: ni externa por proveedor ni interna fuera del namespace", async () => {
    const providerJob: FakeJobRecord = {
      id: "provider-1",
      source: "JOOBLE",
      externalId: "jooble-42",
      company: "Empresa Real S.L.",
      description: "Oferta de proveedor externo."
    };
    const foreignInternal: FakeJobRecord = {
      id: "internal-foreign-1",
      source: "INTERNAL",
      externalId: "otro-namespace-001",
      company: "Empresa Ajena",
      description: "Oferta interna fuera del namespace gestionado."
    };
    const providerSnapshot = { ...providerJob };
    const foreignSnapshot = { ...foreignInternal };

    const { client, jobs } = createFakeClient([providerJob, foreignInternal]);
    await seedInternalJobs(client);

    expect(jobs.get("provider-1")).toEqual(providerSnapshot);
    expect(jobs.get("internal-foreign-1")).toEqual(foreignSnapshot);
    // 2 ajenas + 14 gestionadas creadas.
    expect(jobs.size).toBe(16);
  });

  it("es idempotente: una segunda ejecucion no crea filas nuevas ni cambia valores", async () => {
    const { client, jobs } = createFakeClient();
    const first = await seedInternalJobs(client);
    const afterFirst = new Map([...jobs.entries()].map(([id, job]) => [id, { ...job }]));

    const second = await seedInternalJobs(client);

    expect(first).toEqual({ created: 14, updated: 0, total: 14 });
    expect(second).toEqual({ created: 0, updated: 14, total: 14 });
    expect(jobs.size).toBe(14);
    for (const [id, job] of jobs.entries()) {
      expect(job).toEqual(afterFirst.get(id));
    }
  });

  it("no ejecuta ningun borrado: el cliente gestionado no expone delete ni deleteMany", () => {
    const { client } = createFakeClient();
    const jobDelegate = client.job as unknown as Record<string, unknown>;
    expect(jobDelegate["delete"]).toBeUndefined();
    expect(jobDelegate["deleteMany"]).toBeUndefined();
    expect(Object.keys(jobDelegate).sort()).toEqual(["create", "findFirst", "update"]);
  });
});
