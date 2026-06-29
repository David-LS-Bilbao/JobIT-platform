import request from "supertest";
import { type Job, type Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests RED de integración de `GET /api/jobs/:id/match` (Sprint 05).
 *
 * Fijan el contrato del endpoint antes de existir router/servicio: privado,
 * `userId` del token, validación UUID-shape, 404 de contrato (oferta no
 * disponible), match contra el perfil del usuario y desglose explicable, sin
 * exponer `externalId`/`ingestedAt`. Mientras la ruta no esté montada, las
 * peticiones caen en notFoundMiddleware (404 "Route ... not found."): por eso
 * los casos 401/400/200 fallan de forma natural y los 404 usan `assertContract404`
 * para descartar el 404 genérico (evita falso verde). Sin red ni JOOBLE_API_KEY.
 */

const PASSWORD = "ValidPass123";
const NONEXISTENT_JOB_ID = "11111111-1111-1111-1111-111111111111";
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

const getMatch = (accessToken: string, id: string): request.Test =>
  request(app).get(`/api/jobs/${id}/match`).set("Authorization", `Bearer ${accessToken}`);

const getMatchNoAuth = (id: string): request.Test => request(app).get(`/api/jobs/${id}/match`);

/** Crea un candidato autenticado con skills y preferencias listas para el match. */
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

function assertMatchContract(body: Record<string, unknown>, jobId: string): void {
  expect(body["jobId"]).toBe(jobId);
  expect(typeof body["score"]).toBe("number");
  expect(body["score"] as number).toBeGreaterThanOrEqual(0);
  expect(body["score"] as number).toBeLessThanOrEqual(100);
  expect(["VERY_LOW", "LOW", "GOOD", "VERY_GOOD"]).toContain(body["level"]);
  expect(Array.isArray(body["matchedSkills"])).toBe(true);
  expect(Array.isArray(body["missingSkills"])).toBe(true);
  expect(typeof body["explanation"]).toBe("string");
  const factors = body["factors"] as Array<{ name: string }>;
  expect(Array.isArray(factors)).toBe(true);
  const names = factors.map((f) => f.name);
  for (const expected of ["skills", "remote", "seniority", "location"]) {
    expect(names).toContain(expected);
  }
}

/** 404 de contrato (oferta no disponible), no el 404 genérico de ruta no montada. */
function assertContract404(res: { status: number; body: ErrorBody }): void {
  expect(res.status).toBe(404);
  const message = String(res.body?.error?.message ?? "");
  expect(message).not.toContain("Route ");
  expect(message.toLowerCase()).not.toContain("not found");
}

describe("GET /api/jobs/:id/match", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 without session", async () => {
    const job = await createJob();
    const res = await getMatchNoAuth(job.id);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when :id has an invalid shape", async () => {
    const { accessToken } = await seedCandidate("match-jobs-invalid@example.com");
    const res = await getMatch(accessToken, INVALID_JOB_ID);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 (contract) for a non-existent offer", async () => {
    const { accessToken } = await seedCandidate("match-jobs-missing@example.com");
    const res = await getMatch(accessToken, NONEXISTENT_JOB_ID);
    assertContract404(res);
  });

  it("returns 404 (contract) for an unavailable (closed) offer", async () => {
    const { accessToken } = await seedCandidate("match-jobs-closed@example.com");
    const closed = await createJob({ status: "CLOSED" });
    const res = await getMatch(accessToken, closed.id);
    assertContract404(res);
  });

  it("returns 200 with the match contract for an INTERNAL offer", async () => {
    const { accessToken } = await seedCandidate("match-jobs-internal@example.com");
    const job = await createJob({
      source: "INTERNAL",
      externalId: null,
      sourceUrl: null,
      ingestedAt: null
    });

    const res = await getMatch(accessToken, job.id);

    expect(res.status).toBe(200);
    assertMatchContract(res.body, job.id);
  });

  it("returns 200 with the match contract for a persisted JOOBLE offer", async () => {
    const { accessToken } = await seedCandidate("match-jobs-jooble@example.com");
    const job = await createJob({
      source: "JOOBLE",
      externalId: "jooble-match-1",
      sourceUrl: "https://jooble.org/jdp/match-1",
      ingestedAt: new Date()
    });

    const res = await getMatch(accessToken, job.id);

    expect(res.status).toBe(200);
    assertMatchContract(res.body, job.id);
  });

  it("does not expose externalId or ingestedAt in the response", async () => {
    const { accessToken } = await seedCandidate("match-jobs-noleak@example.com");
    const job = await createJob({
      source: "JOOBLE",
      externalId: "jooble-match-2",
      sourceUrl: "https://jooble.org/jdp/match-2",
      ingestedAt: new Date()
    });

    const res = await getMatch(accessToken, job.id);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("externalId");
    expect(JSON.stringify(res.body)).not.toContain("ingestedAt");
  });

  it("returns 200 for an incomplete profile, flagging it without blocking", async () => {
    const { accessToken } = await registerUser("match-jobs-incomplete@example.com");
    const job = await createJob();

    const res = await getMatch(accessToken, job.id);

    expect(res.status).toBe(200);
    assertMatchContract(res.body, job.id);
    const factors = res.body.factors as Array<{ name: string; match: boolean | null }>;
    const skills = factors.find((f) => f.name === "skills");
    expect(skills?.match).toBeNull();
    expect(String(res.body.explanation)).toMatch(/perfil/i);
  });

  it("ignores userId from the query string and uses the authenticated user", async () => {
    const a = await seedCandidate("match-jobs-ignore-a@example.com");
    const b = await registerUser("match-jobs-ignore-b@example.com");
    const job = await createJob();

    const withSpoof = await getMatch(a.accessToken, job.id).query({ userId: b.userId });
    const plain = await getMatch(a.accessToken, job.id);

    expect(withSpoof.status).toBe(200);
    expect(plain.status).toBe(200);
    // El resultado no debe depender del userId enviado por query: usa el del token.
    expect(withSpoof.body).toEqual(plain.body);
  });
});
