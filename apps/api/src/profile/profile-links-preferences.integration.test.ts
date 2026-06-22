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

const VALID_LINKS = {
  links: [
    { type: "GITHUB", url: "https://github.com/David-LS-Bilbao" },
    { type: "LINKEDIN", url: "https://www.linkedin.com/in/david-lopez-sotelo-256a70154/" },
    { type: "PORTFOLIO", url: "https://david.davlos.es" }
  ]
} as const;

const VALID_PREFERENCES = {
  desiredRoles: ["Frontend Developer", "Android Developer"],
  preferredLocations: ["Bilbao", "Remote"],
  remotePreference: "HYBRID",
  seniority: "JUNIOR",
  salaryMin: 22000,
  salaryMax: 32000,
  contractTypes: ["FULL_TIME", "INTERNSHIP"]
} as const;

async function putLinks(
  accessToken: string,
  body: Record<string, unknown>
): Promise<request.Response> {
  return request(app)
    .put("/api/profile/me/links")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

async function putPreferences(
  accessToken: string,
  body: Record<string, unknown>
): Promise<request.Response> {
  return request(app)
    .put("/api/profile/me/preferences")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

describe("PUT /api/profile/me/links", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // 1
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).put("/api/profile/me/links").send(VALID_LINKS);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // 2
  it("upserts valid links, returns a flat array and persists them (lazy profile)", async () => {
    const { accessToken, userId } = await registerUser("links-create@example.com");

    const res = await putLinks(accessToken, { ...VALID_LINKS });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.links)).toBe(true);
    expect(res.body.links).toHaveLength(3);
    expect(res.body.links[0].id).toBeDefined();
    expect(res.body.links[0].type).toBe("GITHUB");
    expect(res.body.links[0].url).toBe("https://github.com/David-LS-Bilbao");
    expect(JSON.stringify(res.body)).not.toContain("profileId");
    expect(JSON.stringify(res.body)).not.toContain("userId");

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { links: true }
    });
    expect(profile.links).toHaveLength(3);
  });

  // 3
  it("replaces the previous links on a second PUT without duplicating", async () => {
    const { accessToken, userId } = await registerUser("links-replace@example.com");

    await putLinks(accessToken, { ...VALID_LINKS });
    const res = await putLinks(accessToken, {
      links: [{ type: "OTHER", url: "https://example.com" }]
    });

    expect(res.status).toBe(200);
    expect(res.body.links).toHaveLength(1);
    expect(res.body.links[0].type).toBe("OTHER");

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { links: true }
    });
    expect(profile.links).toHaveLength(1);
    expect(profile.links[0]?.type).toBe("OTHER");
  });

  // 4
  it("returns 400 when a link url is invalid", async () => {
    const { accessToken } = await registerUser("links-badurl@example.com");

    const res = await putLinks(accessToken, {
      links: [{ type: "GITHUB", url: "not-a-url" }]
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 5
  it("returns 400 when a link type is invalid", async () => {
    const { accessToken } = await registerUser("links-badtype@example.com");

    const res = await putLinks(accessToken, {
      links: [{ type: "INSTAGRAM", url: "https://instagram.com/x" }]
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 6
  it("ignores userId/profileId sent in the body and binds links to the authenticated user", async () => {
    const { accessToken, userId } = await registerUser("links-owner@example.com");
    const foreignUserId = "00000000-0000-0000-0000-000000000000";
    const foreignProfileId = "11111111-1111-1111-1111-111111111111";

    const res = await putLinks(accessToken, {
      ...VALID_LINKS,
      userId: foreignUserId,
      profileId: foreignProfileId
    });

    expect(res.status).toBe(200);

    const ownProfile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { links: true }
    });
    expect(ownProfile.links).toHaveLength(3);

    const foreignByUser = await prisma.candidateProfile.findUnique({
      where: { userId: foreignUserId }
    });
    expect(foreignByUser).toBeNull();

    const foreignByProfile = await prisma.link.findFirst({
      where: { profileId: foreignProfileId }
    });
    expect(foreignByProfile).toBeNull();
  });

  // 7
  it("does not modify another user's links", async () => {
    const userA = await registerUser("links-a@example.com");
    const userB = await registerUser("links-b@example.com");

    await putLinks(userA.accessToken, { ...VALID_LINKS });
    await putLinks(userB.accessToken, {
      links: [{ type: "OTHER", url: "https://b.example.com" }]
    });

    const profileA = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId: userA.userId },
      include: { links: true }
    });
    expect(profileA.links).toHaveLength(3);
  });
});

describe("PUT /api/profile/me/preferences", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // 8
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .put("/api/profile/me/preferences")
      .send(VALID_PREFERENCES);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // 9
  it("upserts valid preferences, returns a flat response and persists them (lazy profile)", async () => {
    const { accessToken, userId } = await registerUser("prefs-create@example.com");

    const res = await putPreferences(accessToken, { ...VALID_PREFERENCES });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.desiredRoles).toEqual(["Frontend Developer", "Android Developer"]);
    expect(res.body.preferredLocations).toEqual(["Bilbao", "Remote"]);
    expect(res.body.remotePreference).toBe("HYBRID");
    expect(res.body.seniority).toBe("JUNIOR");
    expect(res.body.salaryMin).toBe(22000);
    expect(res.body.salaryMax).toBe(32000);
    expect(res.body.contractTypes).toEqual(["FULL_TIME", "INTERNSHIP"]);
    expect(res.body.profileId).toBeUndefined();
    expect(res.body.userId).toBeUndefined();

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { preferences: true }
    });
    expect(profile.preferences).not.toBeNull();
    expect(profile.preferences?.salaryMin).toBe(22000);
  });

  // 10
  it("updates the existing preferences on a second PUT without duplicating", async () => {
    const { accessToken, userId } = await registerUser("prefs-update@example.com");

    await putPreferences(accessToken, { ...VALID_PREFERENCES });
    const res = await putPreferences(accessToken, {
      ...VALID_PREFERENCES,
      salaryMin: 25000,
      salaryMax: 40000
    });

    expect(res.status).toBe(200);
    expect(res.body.salaryMin).toBe(25000);
    expect(res.body.salaryMax).toBe(40000);

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { preferences: true }
    });
    expect(profile.preferences?.salaryMin).toBe(25000);

    const count = await prisma.jobPreferences.count({
      where: { profile: { userId } }
    });
    expect(count).toBe(1);
  });

  // 11
  it("returns 400 when salaryMin is not positive", async () => {
    const { accessToken } = await registerUser("prefs-badmin@example.com");

    const res = await putPreferences(accessToken, {
      ...VALID_PREFERENCES,
      salaryMin: 0
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 12
  it("returns 400 when salaryMax is lower than salaryMin", async () => {
    const { accessToken } = await registerUser("prefs-badmax@example.com");

    const res = await putPreferences(accessToken, {
      ...VALID_PREFERENCES,
      salaryMin: 30000,
      salaryMax: 20000
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 13
  it("returns 400 when remotePreference is invalid", async () => {
    const { accessToken } = await registerUser("prefs-badremote@example.com");

    const res = await putPreferences(accessToken, {
      ...VALID_PREFERENCES,
      remotePreference: "MOON"
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 14
  it("returns 400 when seniority is invalid", async () => {
    const { accessToken } = await registerUser("prefs-badseniority@example.com");

    const res = await putPreferences(accessToken, {
      ...VALID_PREFERENCES,
      seniority: "PRINCIPAL"
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // 15
  it("ignores userId/profileId sent in the body and binds preferences to the authenticated user", async () => {
    const { accessToken, userId } = await registerUser("prefs-owner@example.com");
    const foreignUserId = "00000000-0000-0000-0000-000000000000";
    const foreignProfileId = "11111111-1111-1111-1111-111111111111";

    const res = await putPreferences(accessToken, {
      ...VALID_PREFERENCES,
      userId: foreignUserId,
      profileId: foreignProfileId
    });

    expect(res.status).toBe(200);

    const ownProfile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { preferences: true }
    });
    expect(ownProfile.preferences).not.toBeNull();

    const foreignByUser = await prisma.candidateProfile.findUnique({
      where: { userId: foreignUserId }
    });
    expect(foreignByUser).toBeNull();

    const foreignByProfile = await prisma.jobPreferences.findFirst({
      where: { profileId: foreignProfileId }
    });
    expect(foreignByProfile).toBeNull();
  });

  // 16
  it("does not modify another user's preferences", async () => {
    const userA = await registerUser("prefs-a@example.com");
    const userB = await registerUser("prefs-b@example.com");

    await putPreferences(userA.accessToken, { ...VALID_PREFERENCES });
    await putPreferences(userB.accessToken, {
      ...VALID_PREFERENCES,
      salaryMin: 50000,
      salaryMax: 60000
    });

    const profileA = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId: userA.userId },
      include: { preferences: true }
    });
    expect(profileA.preferences?.salaryMin).toBe(22000);
  });
});

describe("GET /api/profile/me completion after links + preferences", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // 17
  it("reflects completionPercentage = 29 with only links and preferences completed", async () => {
    const { accessToken } = await registerUser("completion-lp@example.com");

    const before = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(before.status).toBe(200);
    expect(before.body.completionPercentage).toBe(0);

    await putLinks(accessToken, { ...VALID_LINKS });
    await putPreferences(accessToken, { ...VALID_PREFERENCES });

    const after = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(after.status).toBe(200);
    // 2 de 7 secciones completas => Math.round((2 / 7) * 100) = 29
    expect(after.body.completionPercentage).toBe(29);
  });
});
