import request from "supertest";
import { type Job, type Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests RED de la política de visibilidad API de Jobs (Sprint 03.6).
 *
 * Fijan el contrato público: list/detail deben servir un DTO público (sin
 * `externalId` ni `ingestedAt`, con `source`/`sourceUrl`) y soportar el filtro
 * `source=INTERNAL|JOOBLE`. Falla mientras la API devuelva la entidad Prisma
 * completa y `source` no exista como query param. Sin red ni JOOBLE_API_KEY:
 * los fixtures se crean directamente con Prisma.
 */

const PASSWORD = "ValidPass123";

type AuthUser = { accessToken: string; userId: string };

async function registerUser(email: string): Promise<AuthUser> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: PASSWORD });
  return { accessToken: res.body.accessToken, userId: res.body.user.id };
}

function jobInput(overrides: Partial<Prisma.JobCreateInput> = {}): Prisma.JobCreateInput {
  return {
    title: "Visibility Role",
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
  };
}

const createJob = (overrides: Partial<Prisma.JobCreateInput> = {}): Promise<Job> =>
  prisma.job.create({ data: jobInput(overrides) });

function listJobs(accessToken: string, query: Record<string, unknown> = {}): request.Test {
  return request(app)
    .get("/api/jobs")
    .set("Authorization", `Bearer ${accessToken}`)
    .query(query);
}

function getJob(accessToken: string, id: string): request.Test {
  return request(app)
    .get(`/api/jobs/${id}`)
    .set("Authorization", `Bearer ${accessToken}`);
}

async function seedInternalAndJooble(): Promise<{ internal: Job; jooble: Job }> {
  const internal = await createJob({
    title: "Internal Visibility Role",
    source: "INTERNAL",
    externalId: null,
    sourceUrl: null,
    ingestedAt: null
  });
  const jooble = await createJob({
    title: "Jooble Visibility Role",
    source: "JOOBLE",
    externalId: "jooble-visibility-1",
    sourceUrl: "https://jooble.org/jdp/visibility-1",
    ingestedAt: new Date()
  });
  return { internal, jooble };
}

describe("Jobs API external visibility policy", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // a) GET /api/jobs no expone campos internos
  it("does not expose internal fields (externalId, ingestedAt) in the list", async () => {
    const { accessToken } = await registerUser("vis-list-internal@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken);

    expect(res.status).toBe(200);
    const data = res.body.data as Array<Record<string, unknown>>;
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(item).not.toHaveProperty("externalId");
      expect(item).not.toHaveProperty("ingestedAt");
    }
    expect(JSON.stringify(res.body)).not.toContain("externalId");
    expect(JSON.stringify(res.body)).not.toContain("ingestedAt");
  });

  // b) GET /api/jobs sí expone source y sourceUrl
  it("exposes public provenance fields (source, sourceUrl) in the list", async () => {
    const { accessToken } = await registerUser("vis-list-source@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken);

    expect(res.status).toBe(200);
    const data = res.body.data as Array<{
      source: string;
      sourceUrl: string | null;
    }>;
    for (const item of data) {
      expect(item).toHaveProperty("source");
      expect(item).toHaveProperty("sourceUrl");
    }

    const internal = data.find((j) => j.source === "INTERNAL");
    const jooble = data.find((j) => j.source === "JOOBLE");
    expect(internal?.sourceUrl).toBeNull();
    expect(jooble?.sourceUrl).toBe("https://jooble.org/jdp/visibility-1");
  });

  // c) GET /api/jobs/:id aplica la misma política
  it("applies the same policy on the detail endpoint", async () => {
    const { accessToken } = await registerUser("vis-detail@example.com");
    const { jooble } = await seedInternalAndJooble();

    const res = await getJob(accessToken, jooble.id);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("externalId");
    expect(res.body).not.toHaveProperty("ingestedAt");
    expect(res.body).toHaveProperty("source", "JOOBLE");
    expect(res.body).toHaveProperty("sourceUrl", "https://jooble.org/jdp/visibility-1");
    expect(JSON.stringify(res.body)).not.toContain("externalId");
    expect(JSON.stringify(res.body)).not.toContain("ingestedAt");
  });

  // d) Filtro source=INTERNAL
  it("filters by source=INTERNAL", async () => {
    const { accessToken } = await registerUser("vis-filter-internal@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken, { source: "INTERNAL" });

    expect(res.status).toBe(200);
    const data = res.body.data as Array<{ source: string }>;
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((j) => j.source === "INTERNAL")).toBe(true);
    expect(data.some((j) => j.source === "JOOBLE")).toBe(false);
  });

  // e) Filtro source=JOOBLE
  it("filters by source=JOOBLE", async () => {
    const { accessToken } = await registerUser("vis-filter-jooble@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken, { source: "JOOBLE" });

    expect(res.status).toBe(200);
    const data = res.body.data as Array<{ source: string }>;
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((j) => j.source === "JOOBLE")).toBe(true);
    expect(data.some((j) => j.source === "INTERNAL")).toBe(false);
  });

  // f) source inválido → error de validación
  it("returns 400 when source is invalid", async () => {
    const { accessToken } = await registerUser("vis-filter-invalid@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken, { source: "INVALID" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // g) No regresión de paginación
  it("keeps pagination shape { data, total, page, limit }", async () => {
    const { accessToken } = await registerUser("vis-pagination@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken, { page: 1, limit: 1 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);
  });

  // h) No regresión de filtro existente (q)
  it("keeps the existing q filter working", async () => {
    const { accessToken } = await registerUser("vis-qfilter@example.com");
    await seedInternalAndJooble();

    const res = await listJobs(accessToken, { q: "Internal" });

    expect(res.status).toBe(200);
    const data = res.body.data as Array<{ title: string }>;
    expect(data).toHaveLength(1);
    expect(data[0]?.title).toBe("Internal Visibility Role");
  });
});
