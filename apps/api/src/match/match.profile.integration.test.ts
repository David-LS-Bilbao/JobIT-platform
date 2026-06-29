import request from "supertest";
import { type Job, type Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests RED de integración de `GET /api/profile/me/matches` (Sprint 05).
 *
 * Fijan el contrato del endpoint antes de existir router/servicio: privado,
 * `userId` del token, `limit` validado (default 10, máx 50), `{ data: [...] }`
 * ordenado por `score` desc, cada item con `job` (JobPublicDto), `score`, `level`,
 * `matchedSkills`, `missingSkills`; solo ofertas activas; INTERNAL y JOOBLE; sin
 * `externalId`/`ingestedAt`; aislamiento por usuario. Mientras la ruta no esté
 * montada, las peticiones caen en notFoundMiddleware (404): como ningún caso de
 * este endpoint espera 404, todos fallan de forma natural (RED). Sin red externa.
 */

const PASSWORD = "ValidPass123";

type AuthUser = { accessToken: string; userId: string };

async function registerUser(email: string): Promise<AuthUser> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: PASSWORD });
  return { accessToken: res.body.accessToken, userId: res.body.user.id };
}

function addSkill(accessToken: string, name: string): request.Test {
  return request(app)
    .post("/api/profile/me/skills")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name });
}

function setPreferences(accessToken: string, body: Record<string, unknown>): request.Test {
  return request(app)
    .put("/api/profile/me/preferences")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

function jobInput(overrides: Partial<Prisma.JobCreateInput> = {}): Prisma.JobCreateInput {
  return {
    title: "Match Role",
    company: "Acme",
    location: null,
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

async function createActiveJobs(count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await createJob({ title: `Active Role ${i}`, tags: ["typescript"] });
  }
}

const getMatches = (accessToken: string, query: Record<string, unknown> = {}): request.Test =>
  request(app)
    .get("/api/profile/me/matches")
    .set("Authorization", `Bearer ${accessToken}`)
    .query(query);

const getMatchesNoAuth = (): request.Test => request(app).get("/api/profile/me/matches");

/** Candidato A: skills TS/Node, remoto, MID, Bilbao. */
async function seedCandidateA(email: string): Promise<AuthUser> {
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

/** Candidato B: skill Python, presencial, SENIOR, Madrid (perfil distinto a A). */
async function seedCandidateB(email: string): Promise<AuthUser> {
  const user = await registerUser(email);
  await addSkill(user.accessToken, "Python");
  await setPreferences(user.accessToken, {
    remotePreference: "ON_SITE",
    seniority: "SENIOR",
    preferredLocations: ["Madrid"]
  });
  return user;
}

function dataOf(body: unknown): Array<Record<string, unknown>> {
  const data = (body as { data?: unknown }).data;
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

function assertPublicJob(job: Record<string, unknown> | undefined): void {
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

function assertMatchItem(item: Record<string, unknown>): void {
  assertPublicJob(item["job"] as Record<string, unknown>);
  expect(typeof item["score"]).toBe("number");
  expect(item["score"] as number).toBeGreaterThanOrEqual(0);
  expect(item["score"] as number).toBeLessThanOrEqual(100);
  expect(["VERY_LOW", "LOW", "GOOD", "VERY_GOOD"]).toContain(item["level"]);
  expect(Array.isArray(item["matchedSkills"])).toBe(true);
  expect(Array.isArray(item["missingSkills"])).toBe(true);
}

describe("GET /api/profile/me/matches", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 without session", async () => {
    const res = await getMatchesNoAuth();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  describe("limit validation", () => {
    it("returns 400 when limit is not a number", async () => {
      const { accessToken } = await seedCandidateA("match-prof-limit-nan@example.com");
      const res = await getMatches(accessToken, { limit: "abc" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when limit is 0", async () => {
      const { accessToken } = await seedCandidateA("match-prof-limit-zero@example.com");
      const res = await getMatches(accessToken, { limit: 0 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when limit exceeds 50", async () => {
      const { accessToken } = await seedCandidateA("match-prof-limit-high@example.com");
      const res = await getMatches(accessToken, { limit: 51 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when limit is negative", async () => {
      const { accessToken } = await seedCandidateA("match-prof-limit-neg@example.com");
      const res = await getMatches(accessToken, { limit: -1 });
      expect(res.status).toBe(400);
    });

    it("accepts limit = 50", async () => {
      const { accessToken } = await seedCandidateA("match-prof-limit-50@example.com");
      await createJob();
      const res = await getMatches(accessToken, { limit: 50 });
      expect(res.status).toBe(200);
    });
  });

  it("returns 200 with an empty data array when there are no active offers", async () => {
    const { accessToken } = await seedCandidateA("match-prof-empty@example.com");
    const res = await getMatches(accessToken);
    expect(res.status).toBe(200);
    expect(dataOf(res.body)).toHaveLength(0);
  });

  it("returns 200 ordered by score descending", async () => {
    const a = await seedCandidateA("match-prof-order@example.com");
    const strong = await createJob({
      title: "Strong Match",
      tags: ["typescript", "node.js"],
      remoteType: "REMOTE",
      seniority: "MID"
    });
    const weak = await createJob({
      title: "Weak Match",
      tags: ["python"],
      remoteType: "ON_SITE",
      seniority: "SENIOR"
    });

    const res = await getMatches(a.accessToken);

    expect(res.status).toBe(200);
    const items = dataOf(res.body);
    expect(items.length).toBeGreaterThanOrEqual(2);
    const scores = items.map((i) => i["score"] as number);
    const sorted = [...scores].sort((x, y) => y - x);
    expect(scores).toEqual(sorted);
    expect((items[0]?.["job"] as Record<string, unknown>)?.["id"]).toBe(strong.id);
    expect((items[items.length - 1]?.["job"] as Record<string, unknown>)?.["id"]).toBe(weak.id);
  });

  it("defaults limit to 10", async () => {
    const { accessToken } = await seedCandidateA("match-prof-default@example.com");
    await createActiveJobs(12);
    const res = await getMatches(accessToken);
    expect(res.status).toBe(200);
    expect(dataOf(res.body).length).toBeLessThanOrEqual(10);
    expect(dataOf(res.body)).toHaveLength(10);
  });

  it("honors an explicit limit", async () => {
    const { accessToken } = await seedCandidateA("match-prof-explicit@example.com");
    await createActiveJobs(3);
    const res = await getMatches(accessToken, { limit: 2 });
    expect(res.status).toBe(200);
    expect(dataOf(res.body)).toHaveLength(2);
  });

  it("each item exposes the match contract", async () => {
    const { accessToken } = await seedCandidateA("match-prof-contract@example.com");
    await createJob();
    const res = await getMatches(accessToken);
    expect(res.status).toBe(200);
    const items = dataOf(res.body);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      assertMatchItem(item);
    }
  });

  it("includes INTERNAL and JOOBLE offers and never leaks internal fields", async () => {
    const { accessToken } = await seedCandidateA("match-prof-sources@example.com");
    await createJob({ title: "Internal Role", source: "INTERNAL", externalId: null, sourceUrl: null, ingestedAt: null });
    await createJob({
      title: "Jooble Role",
      source: "JOOBLE",
      externalId: "jooble-prof-1",
      sourceUrl: "https://jooble.org/jdp/prof-1",
      ingestedAt: new Date()
    });

    const res = await getMatches(accessToken);

    expect(res.status).toBe(200);
    const sources = dataOf(res.body).map((i) => (i["job"] as Record<string, unknown>)["source"]);
    expect(sources).toContain("INTERNAL");
    expect(sources).toContain("JOOBLE");
    expect(JSON.stringify(res.body)).not.toContain("externalId");
    expect(JSON.stringify(res.body)).not.toContain("ingestedAt");
  });

  it("excludes inactive (closed) offers from the results", async () => {
    const { accessToken } = await seedCandidateA("match-prof-active@example.com");
    const active = await createJob({ title: "Active Role" });
    await createJob({ title: "Closed Role", status: "CLOSED" });

    const res = await getMatches(accessToken);

    expect(res.status).toBe(200);
    const items = dataOf(res.body);
    expect(items).toHaveLength(1);
    expect((items[0]?.["job"] as Record<string, unknown>)?.["id"]).toBe(active.id);
  });

  it("isolates results per authenticated user", async () => {
    const a = await seedCandidateA("match-prof-iso-a@example.com");
    const b = await seedCandidateB("match-prof-iso-b@example.com");
    await createJob({ title: "TS Role", tags: ["typescript", "node.js"], remoteType: "REMOTE", seniority: "MID" });

    const resA = await getMatches(a.accessToken);
    const resB = await getMatches(b.accessToken);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    // Cada usuario obtiene su propio cálculo; con perfiles distintos no son iguales.
    expect(resA.body).not.toEqual(resB.body);
  });

  it("ignores userId from the query string and uses the authenticated user", async () => {
    const a = await seedCandidateA("match-prof-spoof-a@example.com");
    const b = await seedCandidateB("match-prof-spoof-b@example.com");
    await createJob({ title: "TS Role", tags: ["typescript", "node.js"], remoteType: "REMOTE", seniority: "MID" });

    const withSpoof = await getMatches(a.accessToken, { userId: b.userId });
    const plain = await getMatches(a.accessToken);

    expect(withSpoof.status).toBe(200);
    expect(plain.status).toBe(200);
    // El userId de query no cambia la identidad: usa la del token (A).
    expect(withSpoof.body).toEqual(plain.body);
  });
});
