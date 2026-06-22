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

const VALID_EDUCATION = {
  institution: "Ilerna Online",
  title: "Desarrollo de Aplicaciones Multiplataforma",
  field: "Software Development",
  startDate: "2023-09-01",
  endDate: "2025-06-01",
  current: false
} as const;

async function createEducation(
  accessToken: string,
  body: Record<string, unknown>
): Promise<request.Response> {
  return request(app)
    .post("/api/profile/me/education")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

function isoDate(value: unknown): string {
  return new Date(value as string).toISOString().slice(0, 10);
}

describe("POST /api/profile/me/education", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // A
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/profile/me/education")
      .send(VALID_EDUCATION);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // B
  it("creates an education, returns a flat response and persists it for the authenticated user (lazy profile)", async () => {
    const { accessToken, userId } = await registerUser("edu-create@example.com");

    const res = await createEducation(accessToken, { ...VALID_EDUCATION });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.institution).toBe("Ilerna Online");
    expect(res.body.title).toBe("Desarrollo de Aplicaciones Multiplataforma");
    expect(res.body.field).toBe("Software Development");
    expect(isoDate(res.body.startDate)).toBe("2023-09-01");
    expect(isoDate(res.body.endDate)).toBe("2025-06-01");
    expect(res.body.current).toBe(false);
    expect(res.body.profileId).toBeUndefined();
    expect(res.body.userId).toBeUndefined();

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { education: true }
    });
    expect(profile.education).toHaveLength(1);
    expect(profile.education[0]?.id).toBe(res.body.id);
    expect(profile.education[0]?.institution).toBe("Ilerna Online");
  });

  // C
  it("forces endDate to null when current is true even if an endDate is sent", async () => {
    const { accessToken, userId } = await registerUser("edu-current@example.com");

    const res = await createEducation(accessToken, {
      institution: "The Bridge",
      title: "Full Stack Developer Bootcamp",
      field: "Web Development",
      startDate: "2026-01-01",
      endDate: "2026-06-01",
      current: true
    });

    expect(res.status).toBe(201);
    expect(res.body.current).toBe(true);
    expect(res.body.endDate).toBeNull();

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { education: true }
    });
    expect(profile.education[0]?.current).toBe(true);
    expect(profile.education[0]?.endDate).toBeNull();
  });

  // D
  it("returns 400 when institution is empty", async () => {
    const { accessToken } = await registerUser("edu-noinstitution@example.com");

    const res = await createEducation(accessToken, {
      ...VALID_EDUCATION,
      institution: "   "
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // E
  it("returns 400 when title is empty", async () => {
    const { accessToken } = await registerUser("edu-notitle@example.com");

    const res = await createEducation(accessToken, {
      ...VALID_EDUCATION,
      title: "   "
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // F
  it("returns 400 when startDate is after endDate and current is not true", async () => {
    const { accessToken } = await registerUser("edu-baddates@example.com");

    const res = await createEducation(accessToken, {
      ...VALID_EDUCATION,
      startDate: "2025-06-01",
      endDate: "2023-09-01",
      current: false
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // G
  it("ignores userId/profileId sent in the body and binds the education to the authenticated user", async () => {
    const { accessToken, userId } = await registerUser("edu-owner@example.com");
    const foreignUserId = "00000000-0000-0000-0000-000000000000";
    const foreignProfileId = "11111111-1111-1111-1111-111111111111";

    const res = await createEducation(accessToken, {
      ...VALID_EDUCATION,
      userId: foreignUserId,
      profileId: foreignProfileId
    });

    expect(res.status).toBe(201);

    const ownProfile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { education: true }
    });
    expect(ownProfile.education).toHaveLength(1);
    expect(ownProfile.education[0]?.id).toBe(res.body.id);

    const foreignByUser = await prisma.candidateProfile.findUnique({
      where: { userId: foreignUserId }
    });
    expect(foreignByUser).toBeNull();

    const foreignByProfile = await prisma.education.findFirst({
      where: { profileId: foreignProfileId }
    });
    expect(foreignByProfile).toBeNull();
  });
});

describe("PUT /api/profile/me/education/:educationId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // H
  it("updates the user's own education and persists the changes", async () => {
    const { accessToken } = await registerUser("edu-put-own@example.com");

    const created = await createEducation(accessToken, { ...VALID_EDUCATION });
    const educationId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/education/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        institution: "UOC",
        title: "Grado en Ingeniería Informática",
        field: "Computer Science"
      });

    expect(res.status).toBe(200);
    expect(res.body.institution).toBe("UOC");
    expect(res.body.title).toBe("Grado en Ingeniería Informática");
    expect(res.body.field).toBe("Computer Science");

    const stored = await prisma.education.findUniqueOrThrow({
      where: { id: educationId }
    });
    expect(stored.institution).toBe("UOC");
    expect(stored.title).toBe("Grado en Ingeniería Informática");
  });

  // I
  it("forces endDate to null when current is true on update", async () => {
    const { accessToken } = await registerUser("edu-put-current@example.com");

    const created = await createEducation(accessToken, { ...VALID_EDUCATION });
    const educationId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/education/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ current: true, endDate: "2025-06-01" });

    expect(res.status).toBe(200);
    expect(res.body.current).toBe(true);
    expect(res.body.endDate).toBeNull();

    const stored = await prisma.education.findUniqueOrThrow({
      where: { id: educationId }
    });
    expect(stored.current).toBe(true);
    expect(stored.endDate).toBeNull();
  });

  // J
  it("returns 403 when updating an education owned by another user", async () => {
    const userA = await registerUser("edu-put-a@example.com");
    const userB = await registerUser("edu-put-b@example.com");

    const created = await createEducation(userA.accessToken, { ...VALID_EDUCATION });
    const educationId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/education/${educationId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`)
      .send({ institution: "Hacked University" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stored = await prisma.education.findUniqueOrThrow({
      where: { id: educationId }
    });
    expect(stored.institution).toBe("Ilerna Online");
  });

  // K
  it("returns 400 when startDate is after endDate on update and current is not true", async () => {
    const { accessToken } = await registerUser("edu-put-baddates@example.com");

    const created = await createEducation(accessToken, { ...VALID_EDUCATION });
    const educationId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/education/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        startDate: "2025-06-01",
        endDate: "2023-09-01",
        current: false
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/profile/me/education/:educationId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // L
  it("deletes the user's own education and returns 204", async () => {
    const { accessToken } = await registerUser("edu-del-own@example.com");

    const created = await createEducation(accessToken, { ...VALID_EDUCATION });
    const educationId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/education/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const stored = await prisma.education.findUnique({
      where: { id: educationId }
    });
    expect(stored).toBeNull();
  });

  // M
  it("returns 403 when deleting an education owned by another user", async () => {
    const userA = await registerUser("edu-del-a@example.com");
    const userB = await registerUser("edu-del-b@example.com");

    const created = await createEducation(userA.accessToken, { ...VALID_EDUCATION });
    const educationId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/education/${educationId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stillExists = await prisma.education.findUnique({
      where: { id: educationId }
    });
    expect(stillExists).not.toBeNull();
  });

  // N
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).delete(
      "/api/profile/me/education/00000000-0000-0000-0000-000000000000"
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
