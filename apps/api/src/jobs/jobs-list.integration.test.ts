import request from "supertest";
import { type Prisma } from "@prisma/client";
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
const daysFromNow = (n: number): Date => new Date(Date.now() + n * DAY);

function jobFixture(overrides: Partial<Prisma.JobCreateManyInput> = {}): Prisma.JobCreateManyInput {
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

async function seedJobs(list: Prisma.JobCreateManyInput[]): Promise<void> {
  await prisma.job.createMany({ data: list });
}

function listJobs(
  accessToken: string,
  query: Record<string, unknown> = {}
): request.Test {
  return request(app)
    .get("/api/jobs")
    .set("Authorization", `Bearer ${accessToken}`)
    .query(query);
}

describe("GET /api/jobs", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // 1
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/jobs");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // 2
  it("returns only ACTIVE non-expired jobs (excludes CLOSED and expired)", async () => {
    const { accessToken } = await registerUser("jobs-list-active@example.com");
    await seedJobs([
      jobFixture({ title: "Active Valid", status: "ACTIVE" }),
      jobFixture({ title: "Active With Future Expiry", status: "ACTIVE", expiresAt: daysFromNow(30) }),
      jobFixture({ title: "Closed Role", status: "CLOSED" }),
      jobFixture({ title: "Expired Role", status: "ACTIVE", expiresAt: daysAgo(5) })
    ]);

    const res = await listJobs(accessToken);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const titles = (res.body.data as Array<{ title: string }>).map((j) => j.title);
    expect(titles).toContain("Active Valid");
    expect(titles).toContain("Active With Future Expiry");
    expect(titles).not.toContain("Closed Role");
    expect(titles).not.toContain("Expired Role");
  });

  // 3
  it("filters by q over title and description, case-insensitive", async () => {
    const { accessToken } = await registerUser("jobs-list-q@example.com");
    await seedJobs([
      jobFixture({ title: "React Developer", description: "Frontend role" }),
      jobFixture({ title: "Backend Engineer", description: "Works with Kubernetes" }),
      jobFixture({ title: "Designer", description: "UI/UX" })
    ]);

    const byTitle = await listJobs(accessToken, { q: "react" });
    expect(byTitle.status).toBe(200);
    expect(byTitle.body.total).toBe(1);
    expect(byTitle.body.data[0].title).toBe("React Developer");

    const byDescription = await listJobs(accessToken, { q: "KUBERNETES" });
    expect(byDescription.status).toBe(200);
    expect(byDescription.body.total).toBe(1);
    expect(byDescription.body.data[0].title).toBe("Backend Engineer");
  });

  // 4
  it("filters by remote (mapped to remoteType)", async () => {
    const { accessToken } = await registerUser("jobs-list-remote@example.com");
    await seedJobs([
      jobFixture({ title: "Remote One", remoteType: "REMOTE" }),
      jobFixture({ title: "Hybrid One", remoteType: "HYBRID" }),
      jobFixture({ title: "Onsite One", remoteType: "ON_SITE" })
    ]);

    const res = await listJobs(accessToken, { remote: "REMOTE" });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toBe("Remote One");
  });

  // 5
  it("filters by seniority returning the requested level plus ANY", async () => {
    const { accessToken } = await registerUser("jobs-list-seniority@example.com");
    await seedJobs([
      jobFixture({ title: "Junior Role", seniority: "JUNIOR" }),
      jobFixture({ title: "Senior Role", seniority: "SENIOR" }),
      jobFixture({ title: "Any Role", seniority: "ANY" })
    ]);

    const res = await listJobs(accessToken, { seniority: "JUNIOR" });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const titles = (res.body.data as Array<{ title: string }>).map((j) => j.title);
    expect(titles).toContain("Junior Role");
    expect(titles).toContain("Any Role");
    expect(titles).not.toContain("Senior Role");
  });

  // 6
  it("filters by contractType", async () => {
    const { accessToken } = await registerUser("jobs-list-contract@example.com");
    await seedJobs([
      jobFixture({ title: "Full Time", contractType: "FULL_TIME" }),
      jobFixture({ title: "Part Time", contractType: "PART_TIME" }),
      jobFixture({ title: "Contract", contractType: "CONTRACT" }),
      jobFixture({ title: "Freelance", contractType: "FREELANCE" })
    ]);

    const res = await listJobs(accessToken, { contractType: "FREELANCE" });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toBe("Freelance");
  });

  // 7
  it("filters by tags with OR semantics", async () => {
    const { accessToken } = await registerUser("jobs-list-tags@example.com");
    await seedJobs([
      jobFixture({ title: "TS Node", tags: ["TypeScript", "Node.js"] }),
      jobFixture({ title: "React Only", tags: ["React"] }),
      jobFixture({ title: "Kotlin Only", tags: ["Kotlin"] }),
      jobFixture({ title: "DevOps Only", tags: ["DevOps"] })
    ]);

    const res = await listJobs(accessToken, { tags: ["React", "Kotlin"] });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const titles = (res.body.data as Array<{ title: string }>).map((j) => j.title);
    expect(titles).toContain("React Only");
    expect(titles).toContain("Kotlin Only");
    expect(titles).not.toContain("TS Node");
    expect(titles).not.toContain("DevOps Only");
  });

  // 8
  it("paginates with page/limit and returns { data, total, page, limit }", async () => {
    const { accessToken } = await registerUser("jobs-list-pagination@example.com");
    await seedJobs([
      jobFixture({ title: "Job A", postedAt: daysAgo(1) }),
      jobFixture({ title: "Job B", postedAt: daysAgo(2) }),
      jobFixture({ title: "Job C", postedAt: daysAgo(3) }),
      jobFixture({ title: "Job D", postedAt: daysAgo(4) }),
      jobFixture({ title: "Job E", postedAt: daysAgo(5) })
    ]);

    const page1 = await listJobs(accessToken, { page: 1, limit: 2 });
    expect(page1.status).toBe(200);
    expect(page1.body.total).toBe(5);
    expect(page1.body.page).toBe(1);
    expect(page1.body.limit).toBe(2);
    expect(page1.body.data).toHaveLength(2);

    const page2 = await listJobs(accessToken, { page: 2, limit: 2 });
    expect(page2.status).toBe(200);
    expect(page2.body.data).toHaveLength(2);

    const page3 = await listJobs(accessToken, { page: 3, limit: 2 });
    expect(page3.status).toBe(200);
    expect(page3.body.data).toHaveLength(1);
  });

  // 9
  it("returns 400 when page is invalid", async () => {
    const { accessToken } = await registerUser("jobs-list-badpage@example.com");

    const res = await listJobs(accessToken, { page: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 10
  it("returns 400 when limit is invalid", async () => {
    const { accessToken } = await registerUser("jobs-list-badlimit@example.com");

    const res = await listJobs(accessToken, { limit: 500 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
