import request from "supertest";
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

describe("GET /api/profile/me", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/profile/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 and lazily creates an empty profile when none exists", async () => {
    const { accessToken, userId } = await registerUser("lazy@example.com");

    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.firstName).toBeNull();
    expect(res.body.lastName).toBeNull();
    expect(res.body.completionPercentage).toBe(0);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");

    const count = await prisma.candidateProfile.count({ where: { userId } });
    expect(count).toBe(1);
  });

  it("is idempotent and does not duplicate the profile on repeated calls", async () => {
    const { accessToken, userId } = await registerUser("idempotent@example.com");

    const first = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`);
    const second = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    const count = await prisma.candidateProfile.count({ where: { userId } });
    expect(count).toBe(1);
  });
});

describe("PUT /api/profile/me", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .send({ firstName: "Ada", lastName: "Lovelace" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("updates basic data and reflects completion = 14", async () => {
    const { accessToken } = await registerUser("basic@example.com");

    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        firstName: "Ada",
        lastName: "Lovelace",
        headline: "Engineer",
        summary: "Short summary",
        location: "London",
        locationRemote: true,
        availabilityStatus: "OPEN"
      });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("Ada");
    expect(res.body.lastName).toBe("Lovelace");
    expect(res.body.completionPercentage).toBe(14);

    const profile = await prisma.candidateProfile.findFirst({
      where: { firstName: "Ada" }
    });
    expect(profile).not.toBeNull();
    expect(profile?.lastName).toBe("Lovelace");
  });

  it("returns 400 when firstName is too short", async () => {
    const { accessToken } = await registerUser("badfirst@example.com");

    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ firstName: "A", lastName: "Lovelace" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when lastName is missing", async () => {
    const { accessToken } = await registerUser("badlast@example.com");

    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ firstName: "Ada", lastName: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when summary exceeds 1000 characters", async () => {
    const { accessToken } = await registerUser("longsummary@example.com");

    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        firstName: "Ada",
        lastName: "Lovelace",
        summary: "x".repeat(1001)
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("ignores userId sent in the body and updates only the authenticated user's profile", async () => {
    const { accessToken, userId } = await registerUser("owner@example.com");
    const foreignUserId = "00000000-0000-0000-0000-000000000000";

    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ userId: foreignUserId, firstName: "Ada", lastName: "Lovelace" });

    expect(res.status).toBe(200);

    const ownProfile = await prisma.candidateProfile.findUnique({ where: { userId } });
    expect(ownProfile?.firstName).toBe("Ada");

    const foreignProfile = await prisma.candidateProfile.findUnique({
      where: { userId: foreignUserId }
    });
    expect(foreignProfile).toBeNull();
  });
});
