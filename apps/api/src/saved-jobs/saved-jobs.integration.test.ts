import request from "supertest";
import { type Job, type Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests RED de Saved Jobs (Sprint 04).
 *
 * Fijan el contrato de `/api/saved-jobs` antes de existir router/servicio:
 * GET (listado propio), POST /:jobId (guardar idempotente) y DELETE /:jobId
 * (quitar). Mientras las rutas no estén montadas, las peticiones caen en el
 * notFoundMiddleware (404 con mensaje "Route ... not found."). Por eso:
 *   - los casos que esperan 401/400/200/201/204 fallan de forma natural;
 *   - los casos que esperan 404 usan `assertContract404`, que exige un mensaje
 *     de dominio y descarta el 404 genérico de ruta inexistente, evitando un
 *     falso verde en RED.
 *
 * Sin red ni JOOBLE_API_KEY: los fixtures se crean directamente con Prisma.
 */

const PASSWORD = "ValidPass123";
// UUID con forma válida pero inexistente (debe resolver 404, no 400).
const NONEXISTENT_JOB_ID = "11111111-1111-1111-1111-111111111111";
// Identificador sin forma de UUID (debe resolver 400).
const INVALID_JOB_ID = "not-a-uuid";

type AuthUser = { accessToken: string; userId: string };

interface ErrorBody {
  error?: { code?: string; message?: string };
}

async function registerUser(email: string): Promise<AuthUser> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: PASSWORD });
  return { accessToken: res.body.accessToken, userId: res.body.user.id };
}

function jobInput(overrides: Partial<Prisma.JobCreateInput> = {}): Prisma.JobCreateInput {
  return {
    title: "Saved Role",
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

function createSavedJob(userId: string, jobId: string, savedAt?: Date): Promise<{ id: string }> {
  return prisma.savedJob.create({
    data: { userId, jobId, ...(savedAt ? { savedAt } : {}) },
    select: { id: true }
  });
}

async function seedJobs(): Promise<{ internal: Job; jooble: Job; closed: Job }> {
  const internal = await createJob({
    title: "Internal Saved Role",
    source: "INTERNAL",
    externalId: null,
    sourceUrl: null,
    ingestedAt: null
  });
  const jooble = await createJob({
    title: "Jooble Saved Role",
    source: "JOOBLE",
    externalId: "jooble-saved-1",
    sourceUrl: "https://jooble.org/jdp/saved-1",
    ingestedAt: new Date()
  });
  const closed = await createJob({
    title: "Closed Saved Role",
    status: "CLOSED",
    source: "INTERNAL",
    externalId: null,
    sourceUrl: null,
    ingestedAt: null
  });
  return { internal, jooble, closed };
}

// Petición sin cabecera de autenticación.
const listSavedNoAuth = (): request.Test => request(app).get("/api/saved-jobs");
const postSavedNoAuth = (jobId: string): request.Test =>
  request(app).post(`/api/saved-jobs/${jobId}`);
const deleteSavedNoAuth = (jobId: string): request.Test =>
  request(app).delete(`/api/saved-jobs/${jobId}`);

const listSaved = (token: string): request.Test =>
  request(app).get("/api/saved-jobs").set("Authorization", `Bearer ${token}`);
const postSaved = (token: string, jobId: string): request.Test =>
  request(app).post(`/api/saved-jobs/${jobId}`).set("Authorization", `Bearer ${token}`);
const deleteSaved = (token: string, jobId: string): request.Test =>
  request(app).delete(`/api/saved-jobs/${jobId}`).set("Authorization", `Bearer ${token}`);

/** Extrae la lista de guardados tolerando `{ data: [...] }` o array directo. */
function itemsOf(body: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(body)) {
    return body as Array<Record<string, unknown>>;
  }
  const data = (body as { data?: unknown }).data;
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

/** Verifica que un objeto Job embebido cumple el contrato público (JobPublicDto). */
function assertPublicJob(job: Record<string, unknown> | undefined): void {
  expect(job).toBeDefined();
  const j = job as Record<string, unknown>;
  expect(j).toHaveProperty("id");
  expect(j).toHaveProperty("title");
  expect(j).toHaveProperty("company");
  expect(j).toHaveProperty("status");
  expect(j).toHaveProperty("source");
  expect(j).toHaveProperty("sourceUrl");
  expect(j).not.toHaveProperty("externalId");
  expect(j).not.toHaveProperty("ingestedAt");
  const serialized = JSON.stringify(j);
  expect(serialized).not.toContain("externalId");
  expect(serialized).not.toContain("ingestedAt");
}

/**
 * 404 de contrato (recurso/registro no encontrado), NO el 404 genérico de ruta
 * no montada. Descarta el mensaje "Route ... not found." del notFoundMiddleware
 * para que estos casos sigan en RED hasta que exista la implementación real.
 */
function assertContract404(res: { status: number; body: ErrorBody }): void {
  expect(res.status).toBe(404);
  const message = String(res.body?.error?.message ?? "");
  expect(message).not.toContain("Route ");
  expect(message.toLowerCase()).not.toContain("not found");
}

describe("Saved Jobs API", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  describe("GET /api/saved-jobs", () => {
    it("returns 401 without session", async () => {
      const res = await listSavedNoAuth();
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 200 with an empty collection when the user has no saved jobs", async () => {
      const { accessToken } = await registerUser("saved-get-empty@example.com");

      const res = await listSaved(accessToken);

      expect(res.status).toBe(200);
      expect(itemsOf(res.body)).toHaveLength(0);
    });

    it("returns 200 ordered by savedAt desc", async () => {
      const a = await registerUser("saved-get-order@example.com");
      const { internal, jooble } = await seedJobs();
      // internal guardado antes (más antiguo), jooble después (más reciente).
      await createSavedJob(a.userId, internal.id, new Date("2026-01-01T00:00:00.000Z"));
      await createSavedJob(a.userId, jooble.id, new Date("2026-02-01T00:00:00.000Z"));

      const res = await listSaved(a.accessToken);

      expect(res.status).toBe(200);
      const items = itemsOf(res.body);
      expect(items).toHaveLength(2);
      expect((items[0]?.["job"] as Record<string, unknown>)?.["id"]).toBe(jooble.id);
      expect((items[1]?.["job"] as Record<string, unknown>)?.["id"]).toBe(internal.id);
    });

    it("returns only the authenticated user's saved jobs", async () => {
      const a = await registerUser("saved-get-owner-a@example.com");
      const b = await registerUser("saved-get-owner-b@example.com");
      const { internal, jooble } = await seedJobs();
      await createSavedJob(a.userId, internal.id);
      await createSavedJob(b.userId, jooble.id);

      const res = await listSaved(a.accessToken);

      expect(res.status).toBe(200);
      const items = itemsOf(res.body);
      expect(items).toHaveLength(1);
      expect((items[0]?.["job"] as Record<string, unknown>)?.["id"]).toBe(internal.id);
    });

    it("includes INTERNAL and JOOBLE saved offers with the public contract", async () => {
      const a = await registerUser("saved-get-sources@example.com");
      const { internal, jooble } = await seedJobs();
      await createSavedJob(a.userId, internal.id);
      await createSavedJob(a.userId, jooble.id);

      const res = await listSaved(a.accessToken);

      expect(res.status).toBe(200);
      const items = itemsOf(res.body);
      expect(items).toHaveLength(2);
      for (const item of items) {
        expect(item).toHaveProperty("savedAt");
        expect(item).toHaveProperty("job");
        assertPublicJob(item["job"] as Record<string, unknown>);
      }
      const sources = items.map((i) => (i["job"] as Record<string, unknown>)["source"]);
      expect(sources).toContain("INTERNAL");
      expect(sources).toContain("JOOBLE");
      expect(JSON.stringify(res.body)).not.toContain("externalId");
      expect(JSON.stringify(res.body)).not.toContain("ingestedAt");
    });

    it("keeps a saved CLOSED offer in the list with status available", async () => {
      const a = await registerUser("saved-get-closed@example.com");
      const { closed } = await seedJobs();
      await createSavedJob(a.userId, closed.id);

      const res = await listSaved(a.accessToken);

      expect(res.status).toBe(200);
      const items = itemsOf(res.body);
      expect(items).toHaveLength(1);
      const job = items[0]?.["job"] as Record<string, unknown>;
      assertPublicJob(job);
      expect(job["status"]).toBe("CLOSED");
      expect(job).toHaveProperty("expiresAt");
    });
  });

  describe("POST /api/saved-jobs/:jobId", () => {
    it("returns 401 without session", async () => {
      const { internal } = await seedJobs();
      const res = await postSavedNoAuth(internal.id);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 when jobId has an invalid shape", async () => {
      const { accessToken } = await registerUser("saved-post-invalid@example.com");
      const res = await postSaved(accessToken, INVALID_JOB_ID);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 (contract) when the offer does not exist", async () => {
      const { accessToken } = await registerUser("saved-post-missing@example.com");
      const res = await postSaved(accessToken, NONEXISTENT_JOB_ID);
      assertContract404(res);
    });

    it("returns 201 and creates a SavedJob with the correct userId for an INTERNAL offer", async () => {
      const a = await registerUser("saved-post-internal@example.com");
      const { internal } = await seedJobs();

      const res = await postSaved(a.accessToken, internal.id);

      expect(res.status).toBe(201);
      assertPublicJob((res.body as { job?: Record<string, unknown> }).job ?? res.body);
      const saved = await prisma.savedJob.findFirst({
        where: { userId: a.userId, jobId: internal.id }
      });
      expect(saved).not.toBeNull();
    });

    it("returns 201 and creates a SavedJob for a persisted JOOBLE offer", async () => {
      const a = await registerUser("saved-post-jooble@example.com");
      const { jooble } = await seedJobs();

      const res = await postSaved(a.accessToken, jooble.id);

      expect(res.status).toBe(201);
      const saved = await prisma.savedJob.findFirst({
        where: { userId: a.userId, jobId: jooble.id }
      });
      expect(saved).not.toBeNull();
    });

    it("is idempotent: saving the same offer twice returns 200 and does not duplicate", async () => {
      const a = await registerUser("saved-post-idempotent@example.com");
      const { internal } = await seedJobs();

      const first = await postSaved(a.accessToken, internal.id);
      expect(first.status).toBe(201);

      const second = await postSaved(a.accessToken, internal.id);
      expect(second.status).toBe(200);

      const count = await prisma.savedJob.count({
        where: { userId: a.userId, jobId: internal.id }
      });
      expect(count).toBe(1);
    });

    it("lets different users save the same offer without conflict", async () => {
      const a = await registerUser("saved-post-shared-a@example.com");
      const b = await registerUser("saved-post-shared-b@example.com");
      const { internal } = await seedJobs();

      const resA = await postSaved(a.accessToken, internal.id);
      const resB = await postSaved(b.accessToken, internal.id);

      expect(resA.status).toBe(201);
      expect(resB.status).toBe(201);
      const total = await prisma.savedJob.count({ where: { jobId: internal.id } });
      expect(total).toBe(2);
    });

    it("ignores userId from the body and uses the authenticated user", async () => {
      const a = await registerUser("saved-post-body-a@example.com");
      const b = await registerUser("saved-post-body-b@example.com");
      const { internal } = await seedJobs();

      const res = await postSaved(a.accessToken, internal.id).send({ userId: b.userId });

      expect(res.status).toBe(201);
      const forA = await prisma.savedJob.findFirst({
        where: { userId: a.userId, jobId: internal.id }
      });
      const forB = await prisma.savedJob.findFirst({
        where: { userId: b.userId, jobId: internal.id }
      });
      expect(forA).not.toBeNull();
      expect(forB).toBeNull();
    });

    it("ignores userId from the query string and uses the authenticated user", async () => {
      const a = await registerUser("saved-post-query-a@example.com");
      const b = await registerUser("saved-post-query-b@example.com");
      const { internal } = await seedJobs();

      const res = await postSaved(a.accessToken, internal.id).query({ userId: b.userId });

      expect(res.status).toBe(201);
      const forB = await prisma.savedJob.findFirst({
        where: { userId: b.userId, jobId: internal.id }
      });
      expect(forB).toBeNull();
    });

    it("does not expose externalId or ingestedAt in the response", async () => {
      const a = await registerUser("saved-post-noleak@example.com");
      const { jooble } = await seedJobs();

      const res = await postSaved(a.accessToken, jooble.id);

      expect(res.status).toBe(201);
      expect(JSON.stringify(res.body)).not.toContain("externalId");
      expect(JSON.stringify(res.body)).not.toContain("ingestedAt");
    });
  });

  describe("DELETE /api/saved-jobs/:jobId", () => {
    it("returns 401 without session", async () => {
      const { internal } = await seedJobs();
      const res = await deleteSavedNoAuth(internal.id);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 when jobId has an invalid shape", async () => {
      const { accessToken } = await registerUser("saved-del-invalid@example.com");
      const res = await deleteSaved(accessToken, INVALID_JOB_ID);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 204 and removes only the user's own saved record", async () => {
      const a = await registerUser("saved-del-own@example.com");
      const { internal, jooble } = await seedJobs();
      await createSavedJob(a.userId, internal.id);
      await createSavedJob(a.userId, jooble.id);

      const res = await deleteSaved(a.accessToken, internal.id);

      expect(res.status).toBe(204);
      const remaining = await prisma.savedJob.findMany({ where: { userId: a.userId } });
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.jobId).toBe(jooble.id);
    });

    it("returns 404 (contract) when the offer is not saved by the user", async () => {
      const a = await registerUser("saved-del-notsaved@example.com");
      const { internal } = await seedJobs();

      const res = await deleteSaved(a.accessToken, internal.id);

      assertContract404(res);
    });

    it("returns 404 (contract) and keeps B's record when A tries to delete B's saved job", async () => {
      const a = await registerUser("saved-del-cross-a@example.com");
      const b = await registerUser("saved-del-cross-b@example.com");
      const { internal } = await seedJobs();
      await createSavedJob(b.userId, internal.id);

      const res = await deleteSaved(a.accessToken, internal.id);

      assertContract404(res);
      const stillThere = await prisma.savedJob.findFirst({
        where: { userId: b.userId, jobId: internal.id }
      });
      expect(stillThere).not.toBeNull();
    });

    it("returns 404 (contract) when repeating DELETE after removal", async () => {
      const a = await registerUser("saved-del-repeat@example.com");
      const { internal } = await seedJobs();
      await createSavedJob(a.userId, internal.id);

      const first = await deleteSaved(a.accessToken, internal.id);
      expect(first.status).toBe(204);

      const second = await deleteSaved(a.accessToken, internal.id);
      assertContract404(second);
    });

    it("ignores userId from the body and only scopes to the authenticated user", async () => {
      const a = await registerUser("saved-del-body-a@example.com");
      const b = await registerUser("saved-del-body-b@example.com");
      const { internal } = await seedJobs();
      await createSavedJob(b.userId, internal.id);

      const res = await deleteSaved(a.accessToken, internal.id).send({ userId: b.userId });

      assertContract404(res);
      const forB = await prisma.savedJob.findFirst({
        where: { userId: b.userId, jobId: internal.id }
      });
      expect(forB).not.toBeNull();
    });

    it("ignores userId from the query string and only scopes to the authenticated user", async () => {
      const a = await registerUser("saved-del-query-a@example.com");
      const b = await registerUser("saved-del-query-b@example.com");
      const { internal } = await seedJobs();
      await createSavedJob(b.userId, internal.id);

      const res = await deleteSaved(a.accessToken, internal.id).query({ userId: b.userId });

      assertContract404(res);
      const forB = await prisma.savedJob.findFirst({
        where: { userId: b.userId, jobId: internal.id }
      });
      expect(forB).not.toBeNull();
    });
  });
});
