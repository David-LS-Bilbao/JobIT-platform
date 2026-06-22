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

const VALID_EXPERIENCE = {
  company: "Acme",
  role: "Frontend Developer",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  current: false,
  description: "Worked on frontend features",
  location: "Bilbao"
} as const;

async function createExperience(
  accessToken: string,
  body: Record<string, unknown>
): Promise<request.Response> {
  return request(app)
    .post("/api/profile/me/experience")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

function isoDate(value: unknown): string {
  return new Date(value as string).toISOString().slice(0, 10);
}

describe("POST /api/profile/me/experience", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // A
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/profile/me/experience")
      .send(VALID_EXPERIENCE);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // B
  it("creates an experience, returns a flat response and persists it for the authenticated user (lazy profile)", async () => {
    const { accessToken, userId } = await registerUser("exp-create@example.com");

    const res = await createExperience(accessToken, { ...VALID_EXPERIENCE });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.company).toBe("Acme");
    expect(res.body.role).toBe("Frontend Developer");
    expect(isoDate(res.body.startDate)).toBe("2024-01-01");
    expect(isoDate(res.body.endDate)).toBe("2024-12-31");
    expect(res.body.current).toBe(false);
    expect(res.body.description).toBe("Worked on frontend features");
    expect(res.body.location).toBe("Bilbao");

    // CandidateProfile creado lazy y experiencia asociada a él
    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { experiences: true }
    });
    expect(profile.experiences).toHaveLength(1);
    expect(profile.experiences[0]?.id).toBe(res.body.id);
    expect(profile.experiences[0]?.company).toBe("Acme");
  });

  // C
  it("returns 400 when startDate is after endDate", async () => {
    const { accessToken } = await registerUser("exp-baddates@example.com");

    const res = await createExperience(accessToken, {
      ...VALID_EXPERIENCE,
      startDate: "2024-12-31",
      endDate: "2024-01-01",
      current: false
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // D
  it("forces endDate to null when current is true even if an endDate is sent", async () => {
    const { accessToken, userId } = await registerUser("exp-current@example.com");

    const res = await createExperience(accessToken, {
      ...VALID_EXPERIENCE,
      current: true,
      endDate: "2024-12-31"
    });

    expect(res.status).toBe(201);
    expect(res.body.current).toBe(true);
    expect(res.body.endDate).toBeNull();

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { experiences: true }
    });
    expect(profile.experiences[0]?.current).toBe(true);
    expect(profile.experiences[0]?.endDate).toBeNull();
  });

  // E
  it("returns 400 when company is empty", async () => {
    const { accessToken } = await registerUser("exp-nocompany@example.com");

    const res = await createExperience(accessToken, {
      ...VALID_EXPERIENCE,
      company: "   "
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // F
  it("returns 400 when role is empty", async () => {
    const { accessToken } = await registerUser("exp-norole@example.com");

    const res = await createExperience(accessToken, {
      ...VALID_EXPERIENCE,
      role: "   "
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // M
  it("ignores userId/profileId sent in the body and binds the experience to the authenticated user", async () => {
    const { accessToken, userId } = await registerUser("exp-owner@example.com");
    const foreignUserId = "00000000-0000-0000-0000-000000000000";
    const foreignProfileId = "11111111-1111-1111-1111-111111111111";

    const res = await createExperience(accessToken, {
      ...VALID_EXPERIENCE,
      userId: foreignUserId,
      profileId: foreignProfileId
    });

    expect(res.status).toBe(201);

    // La experiencia pertenece al perfil del usuario autenticado
    const ownProfile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { experiences: true }
    });
    expect(ownProfile.experiences).toHaveLength(1);
    expect(ownProfile.experiences[0]?.id).toBe(res.body.id);

    // No se ha creado nada para el userId/profileId enviados en el body
    const foreignByUser = await prisma.candidateProfile.findUnique({
      where: { userId: foreignUserId }
    });
    expect(foreignByUser).toBeNull();

    const foreignByProfile = await prisma.experience.findFirst({
      where: { profileId: foreignProfileId }
    });
    expect(foreignByProfile).toBeNull();
  });
});

describe("PUT /api/profile/me/experience/:experienceId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // G
  it("updates the user's own experience and persists the changes", async () => {
    const { accessToken } = await registerUser("exp-put-own@example.com");

    const created = await createExperience(accessToken, { ...VALID_EXPERIENCE });
    const experienceId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/experience/${experienceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        company: "Globex",
        role: "Senior Frontend Developer",
        description: "Led the design system",
        current: true,
        endDate: "2025-06-01"
      });

    expect(res.status).toBe(200);
    expect(res.body.company).toBe("Globex");
    expect(res.body.role).toBe("Senior Frontend Developer");
    expect(res.body.description).toBe("Led the design system");
    expect(res.body.current).toBe(true);
    expect(res.body.endDate).toBeNull();

    const stored = await prisma.experience.findUniqueOrThrow({
      where: { id: experienceId }
    });
    expect(stored.company).toBe("Globex");
    expect(stored.role).toBe("Senior Frontend Developer");
    expect(stored.current).toBe(true);
    expect(stored.endDate).toBeNull();
  });

  // H
  it("returns 403 when updating an experience owned by another user", async () => {
    const userA = await registerUser("exp-put-a@example.com");
    const userB = await registerUser("exp-put-b@example.com");

    const created = await createExperience(userA.accessToken, { ...VALID_EXPERIENCE });
    const experienceId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/experience/${experienceId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`)
      .send({ company: "Hacked Inc" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stored = await prisma.experience.findUniqueOrThrow({
      where: { id: experienceId }
    });
    expect(stored.company).toBe("Acme");
  });

  // I
  it("returns 400 when startDate is after endDate on update", async () => {
    const { accessToken } = await registerUser("exp-put-baddates@example.com");

    const created = await createExperience(accessToken, { ...VALID_EXPERIENCE });
    const experienceId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/experience/${experienceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        startDate: "2024-12-31",
        endDate: "2024-01-01",
        current: false
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/profile/me/experience/:experienceId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // J
  it("deletes the user's own experience and returns 204", async () => {
    const { accessToken } = await registerUser("exp-del-own@example.com");

    const created = await createExperience(accessToken, { ...VALID_EXPERIENCE });
    const experienceId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/experience/${experienceId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const stored = await prisma.experience.findUnique({
      where: { id: experienceId }
    });
    expect(stored).toBeNull();
  });

  // K
  it("returns 403 when deleting an experience owned by another user", async () => {
    const userA = await registerUser("exp-del-a@example.com");
    const userB = await registerUser("exp-del-b@example.com");

    const created = await createExperience(userA.accessToken, { ...VALID_EXPERIENCE });
    const experienceId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/experience/${experienceId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stillExists = await prisma.experience.findUnique({
      where: { id: experienceId }
    });
    expect(stillExists).not.toBeNull();
  });

  // L
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).delete(
      "/api/profile/me/experience/00000000-0000-0000-0000-000000000000"
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
