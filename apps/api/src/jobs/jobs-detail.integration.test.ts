import request from "supertest";
import { type Prisma, type Job } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

const PASSWORD = "ValidPass123";

type AuthUser = { accessToken: string; userId: string };

async function registerUser(email: string): Promise<AuthUser> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: PASSWORD });
  return { accessToken: res.body.accessToken, userId: res.body.user.id };
}

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY);

function jobInput(overrides: Partial<Prisma.JobCreateInput> = {}): Prisma.JobCreateInput {
  return {
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
  };
}

async function createJob(overrides: Partial<Prisma.JobCreateInput> = {}): Promise<Job> {
  return prisma.job.create({ data: jobInput(overrides) });
}

const NON_EXISTENT_UUID = "11111111-1111-1111-1111-111111111111";

function getJob(accessToken: string, id: string): request.Test {
  return request(app)
    .get(`/api/jobs/${id}`)
    .set("Authorization", `Bearer ${accessToken}`);
}

describe("GET /api/jobs/:id", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // 1
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/jobs/${NON_EXISTENT_UUID}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // 2
  it("returns 200 with the full detail of an active job", async () => {
    const { accessToken } = await registerUser("jobs-detail-active@example.com");
    const job = await createJob({
      title: "Senior Backend Engineer",
      company: "Datapeak",
      location: "Madrid",
      remoteType: "HYBRID",
      description: "Owns the API platform.",
      requirements: ["Node.js", "PostgreSQL"],
      seniority: "SENIOR",
      contractType: "FULL_TIME",
      salaryMin: 55000,
      salaryMax: 70000,
      tags: ["Node.js", "PostgreSQL"]
    });

    const res = await getJob(accessToken, job.id);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(job.id);
    expect(res.body.title).toBe("Senior Backend Engineer");
    expect(res.body.company).toBe("Datapeak");
    expect(res.body.location).toBe("Madrid");
    expect(res.body.remoteType).toBe("HYBRID");
    expect(res.body.description).toBe("Owns the API platform.");
    expect(res.body.requirements).toEqual(["Node.js", "PostgreSQL"]);
    expect(res.body.seniority).toBe("SENIOR");
    expect(res.body.contractType).toBe("FULL_TIME");
    expect(res.body.salaryMin).toBe(55000);
    expect(res.body.salaryMax).toBe(70000);
    expect(res.body.tags).toEqual(["Node.js", "PostgreSQL"]);
    expect(res.body.status).toBe("ACTIVE");
  });

  // 3
  it("returns 404 when the job does not exist (valid UUID)", async () => {
    const { accessToken } = await registerUser("jobs-detail-missing@example.com");

    const res = await getJob(accessToken, NON_EXISTENT_UUID);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    // Mensaje de negocio (spec): distingue el 404 real del 404 genérico de ruta inexistente.
    expect(res.body.error.message).toBe("Oferta no disponible");
  });

  // 4
  it("returns 404 when the job is CLOSED", async () => {
    const { accessToken } = await registerUser("jobs-detail-closed@example.com");
    const job = await createJob({ title: "Closed Role", status: "CLOSED" });

    const res = await getJob(accessToken, job.id);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toBe("Oferta no disponible");
  });

  // 5
  it("returns 404 when the job is ACTIVE but expired", async () => {
    const { accessToken } = await registerUser("jobs-detail-expired@example.com");
    const job = await createJob({
      title: "Expired Role",
      status: "ACTIVE",
      expiresAt: daysAgo(5)
    });

    const res = await getJob(accessToken, job.id);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toBe("Oferta no disponible");
  });

  // 6
  it("returns 400 when the id is not a valid UUID", async () => {
    const { accessToken } = await registerUser("jobs-detail-baduuid@example.com");

    const res = await getJob(accessToken, "not-a-uuid");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
