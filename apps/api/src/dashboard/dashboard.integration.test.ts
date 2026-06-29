import request from "supertest";
import { type Job, type Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests RED de integración de `GET /api/dashboard/me` (Sprint 06).
 *
 * Fijan el contrato del dashboard del candidato autenticado antes de existir
 * router/servicio/módulo: endpoint privado (requireAuth), `userId` del token,
 * agregación de Profile (completionPercentage), Saved Jobs (total + recent máx 3,
 * savedAt desc), Match (máx 3, score desc, explicable) y nextActions determinista;
 * jobs embebidos con contrato público (JobPublicDto, sin externalId/ingestedAt);
 * sin exponer secretos. Mientras la ruta no esté montada las peticiones caen en
 * notFoundMiddleware (404): como ningún caso espera un 404 de dominio, todos
 * fallan de forma natural (RED). Sin red externa: los fixtures se crean con Prisma
 * o vía endpoints reales de Auth/Profile.
 */

const PASSWORD = "ValidPass123";

type AuthUser = { accessToken: string; userId: string };

async function registerUser(email: string): Promise<AuthUser> {
  const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
  return { accessToken: res.body.accessToken, userId: res.body.user.id };
}

function addSkill(accessToken: string, name: string): request.Test {
  return request(app)
    .post("/api/profile/me/skills")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name });
}

function setBasicInfo(accessToken: string, body: Record<string, unknown>): request.Test {
  return request(app)
    .put("/api/profile/me")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

function setPreferences(accessToken: string, body: Record<string, unknown>): request.Test {
  return request(app)
    .put("/api/profile/me/preferences")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

function jobInput(overrides: Partial<Prisma.JobCreateInput> = {}): Prisma.JobCreateInput {
  return {
    title: "Dashboard Role",
    company: "Acme",
    location: "Bilbao",
    remoteType: "REMOTE",
    description: "Generic job description",
    requirements: ["TypeScript"],
    seniority: "MID",
    contractType: "FULL_TIME",
    tags: ["typescript", "node.js"],
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

const getDashboard = (accessToken: string, query: Record<string, unknown> = {}): request.Test =>
  request(app)
    .get("/api/dashboard/me")
    .set("Authorization", `Bearer ${accessToken}`)
    .query(query);

const getDashboardNoAuth = (): request.Test => request(app).get("/api/dashboard/me");

/** Candidato con skills TS/Node, remoto, MID, Bilbao (perfil parcialmente completo). */
async function seedCandidate(email: string): Promise<AuthUser> {
  const user = await registerUser(email);
  await addSkill(user.accessToken, "TypeScript");
  await addSkill(user.accessToken, "Node.js");
  await setPreferences(user.accessToken, {
    remotePreference: "REMOTE",
    seniority: "MID",
    preferredLocations: ["Bilbao"]
  });
  return user;
}

function assertPublicJob(job: unknown): void {
  expect(job).toBeDefined();
  const j = job as Record<string, unknown>;
  expect(j).toHaveProperty("id");
  expect(j).toHaveProperty("title");
  expect(j).toHaveProperty("company");
  expect(j).toHaveProperty("source");
  expect(j).toHaveProperty("sourceUrl");
  expect(j).not.toHaveProperty("externalId");
  expect(j).not.toHaveProperty("ingestedAt");
}

describe("GET /api/dashboard/me", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  describe("Auth", () => {
    it("returns 401 without a session", async () => {
      const res = await getDashboardNoAuth();
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 with an invalid token", async () => {
      const res = await request(app)
        .get("/api/dashboard/me")
        .set("Authorization", "Bearer not-a-valid-token");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Contract / DTO", () => {
    it("returns 200 with the expected top-level shape", async () => {
      const { accessToken } = await seedCandidate("dash-shape@example.com");
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("profile");
      expect(res.body).toHaveProperty("skills");
      expect(res.body).toHaveProperty("savedJobs");
      expect(res.body).toHaveProperty("matches");
      expect(res.body).toHaveProperty("nextActions");
    });

    it("exposes profile.completionPercentage (not completeness) as an integer 0..100", async () => {
      const { accessToken } = await seedCandidate("dash-completion@example.com");
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(res.body.profile).toHaveProperty("completionPercentage");
      expect(res.body.profile).not.toHaveProperty("completeness");
      const pct = res.body.profile.completionPercentage;
      expect(Number.isInteger(pct)).toBe(true);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });

    it("returns skills as an array, savedJobs with total+recent, matches and nextActions as arrays", async () => {
      const { accessToken } = await seedCandidate("dash-blocks@example.com");
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.skills)).toBe(true);
      expect(res.body.savedJobs).toHaveProperty("total");
      expect(res.body.savedJobs).toHaveProperty("recent");
      expect(typeof res.body.savedJobs.total).toBe("number");
      expect(Array.isArray(res.body.savedJobs.recent)).toBe(true);
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(Array.isArray(res.body.nextActions)).toBe(true);
    });
  });

  describe("Empty states", () => {
    it("returns a stable shape for a freshly registered user (incomplete profile)", async () => {
      const { accessToken } = await registerUser("dash-fresh@example.com");
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(res.body.profile).toHaveProperty("completionPercentage");
      expect(Array.isArray(res.body.skills)).toBe(true);
      expect(res.body.savedJobs.total).toBe(0);
      expect(res.body.savedJobs.recent).toEqual([]);
      expect(res.body.matches).toEqual([]);
      expect(Array.isArray(res.body.nextActions)).toBe(true);
    });

    it("returns savedJobs.total 0 and recent [] when the user has no saved jobs", async () => {
      const { accessToken } = await seedCandidate("dash-no-saved@example.com");
      // Hay ofertas activas (para matches) pero ninguna guardada por el usuario.
      await createJob({ title: "Active but not saved" });
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(res.body.savedJobs.total).toBe(0);
      expect(res.body.savedJobs.recent).toEqual([]);
    });

    it("returns matches [] when there are no active offers", async () => {
      const { accessToken } = await seedCandidate("dash-no-matches@example.com");
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(res.body.matches).toEqual([]);
    });
  });

  describe("Ownership", () => {
    it("only reflects the authenticated user's own data", async () => {
      const userA = await seedCandidate("dash-owner-a@example.com");
      const userB = await seedCandidate("dash-owner-b@example.com");
      const job = await createJob({ title: "A saved this" });
      await createSavedJob(userA.userId, job.id);

      const resA = await getDashboard(userA.accessToken);
      const resB = await getDashboard(userB.accessToken);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resA.body.savedJobs.total).toBe(1);
      // B no guardó nada: no ve la oferta guardada por A.
      expect(resB.body.savedJobs.total).toBe(0);
    });

    it("ignores userId provided via query or body (identity comes from the token)", async () => {
      const userA = await seedCandidate("dash-spoof-a@example.com");
      const userB = await seedCandidate("dash-spoof-b@example.com");
      const job = await createJob({ title: "A saved this too" });
      await createSavedJob(userA.userId, job.id);

      // B intenta suplantar a A por query y por body: debe seguir viendo lo suyo.
      const res = await request(app)
        .get("/api/dashboard/me")
        .set("Authorization", `Bearer ${userB.accessToken}`)
        .query({ userId: userA.userId })
        .send({ userId: userA.userId });

      expect(res.status).toBe(200);
      expect(res.body.savedJobs.total).toBe(0);
    });
  });

  describe("Saved Jobs composition", () => {
    it("counts all saved jobs in total and limits recent to the 3 newest by savedAt desc", async () => {
      const user = await seedCandidate("dash-saved-comp@example.com");
      const base = Date.UTC(2026, 0, 1, 12, 0, 0);
      const jobs: Job[] = [];
      for (let i = 0; i < 4; i += 1) {
        jobs.push(await createJob({ title: `Saved Role ${i}` }));
      }
      // savedAt creciente: jobs[3] es el más reciente.
      for (let i = 0; i < jobs.length; i += 1) {
        await createSavedJob(user.userId, jobs[i]!.id, new Date(base + i * 60_000));
      }

      const res = await getDashboard(user.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.savedJobs.total).toBe(4);
      expect(res.body.savedJobs.recent).toHaveLength(3);

      const savedAts = res.body.savedJobs.recent.map((entry: { savedAt: string }) =>
        new Date(entry.savedAt).getTime()
      );
      const sortedDesc = [...savedAts].sort((a: number, b: number) => b - a);
      expect(savedAts).toEqual(sortedDesc);

      for (const entry of res.body.savedJobs.recent) {
        expect(entry).toHaveProperty("savedAt");
        assertPublicJob(entry.job);
      }
    });
  });

  describe("Match composition", () => {
    it("returns at most 3 matches, ordered by score desc, with public explainable data", async () => {
      const user = await seedCandidate("dash-match-comp@example.com");
      // 5 ofertas activas con afinidad decreciente respecto a skills TS/Node + remoto + MID.
      await createJob({ title: "Strong 1", tags: ["typescript", "node.js"], remoteType: "REMOTE", seniority: "MID" });
      await createJob({ title: "Strong 2", tags: ["typescript", "node.js"], remoteType: "REMOTE", seniority: "MID" });
      await createJob({ title: "Medium", tags: ["typescript"], remoteType: "REMOTE", seniority: "MID" });
      await createJob({ title: "Weak 1", tags: ["python"], remoteType: "ON_SITE", seniority: "SENIOR", location: "Madrid" });
      await createJob({ title: "Weak 2", tags: ["go"], remoteType: "ON_SITE", seniority: "SENIOR", location: "Madrid" });

      const res = await getDashboard(user.accessToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(res.body.matches.length).toBeLessThanOrEqual(3);

      const scores = res.body.matches.map((m: { score: number }) => m.score);
      const sortedDesc = [...scores].sort((a: number, b: number) => b - a);
      expect(scores).toEqual(sortedDesc);

      for (const match of res.body.matches) {
        assertPublicJob(match.job);
        expect(typeof match.score).toBe("number");
        expect(match.score).toBeGreaterThanOrEqual(0);
        expect(match.score).toBeLessThanOrEqual(100);
        expect(["VERY_LOW", "LOW", "GOOD", "VERY_GOOD"]).toContain(match.level);
        expect(Array.isArray(match.matchedSkills)).toBe(true);
        expect(Array.isArray(match.missingSkills)).toBe(true);
      }
    });
  });

  describe("Serialization / Security", () => {
    it("never exposes internal job ingest fields or auth secrets", async () => {
      const user = await seedCandidate("dash-security@example.com");
      // Oferta JOOBLE con campos internos no nulos, guardada y matcheable.
      const jooble = await createJob({
        title: "Jooble Role",
        source: "JOOBLE",
        externalId: "jooble-dash-1",
        sourceUrl: "https://jooble.org/jdp/dash-1",
        ingestedAt: new Date(),
        tags: ["typescript", "node.js"]
      });
      await createSavedJob(user.userId, jooble.id);

      const res = await getDashboard(user.accessToken);
      expect(res.status).toBe(200);

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain("externalId");
      expect(serialized).not.toContain("ingestedAt");
      expect(serialized).not.toContain("passwordHash");
      expect(serialized).not.toContain("tokenHash");
      expect(serialized).not.toContain("refreshToken");
      expect(serialized).not.toContain("refreshTokens");

      // source/sourceUrl sí son públicos dentro de JobPublicDto.
      for (const entry of res.body.savedJobs.recent) {
        assertPublicJob(entry.job);
      }
    });
  });

  describe("nextActions", () => {
    it("suggests completing the profile when it is incomplete", async () => {
      const { accessToken } = await registerUser("dash-actions-incomplete@example.com");
      const res = await getDashboard(accessToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.nextActions)).toBe(true);
      for (const action of res.body.nextActions) {
        expect(action).toHaveProperty("action");
        expect(action).toHaveProperty("label");
      }
      const actions = res.body.nextActions.map((a: { action: string }) => a.action);
      expect(actions).toContain("complete_profile");
    });

    it("is deterministic for the same state and free of recruiter ranking", async () => {
      const { accessToken } = await seedCandidate("dash-actions-determ@example.com");
      const first = await getDashboard(accessToken);
      const second = await getDashboard(accessToken);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(first.body.nextActions).toEqual(second.body.nextActions);

      const serialized = JSON.stringify(first.body.nextActions).toLowerCase();
      expect(serialized).not.toContain("recruiter");
      expect(serialized).not.toContain("ranking");
    });
  });
});
