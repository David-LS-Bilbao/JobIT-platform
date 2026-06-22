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

async function addSkill(
  accessToken: string,
  body: Record<string, unknown>
): Promise<request.Response> {
  return request(app)
    .post("/api/profile/me/skills")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

describe("POST /api/profile/me/skills", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/profile/me/skills")
      .send({ name: "React" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("creates a skill, persists normalizedName and does not expose it", async () => {
    const { accessToken, userId } = await registerUser("skill@example.com");

    const res = await addSkill(accessToken, {
      name: "React",
      level: "INTERMEDIATE",
      category: "Frontend"
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("React");
    expect(res.body.level).toBe("INTERMEDIATE");
    expect(res.body.category).toBe("Frontend");
    expect(JSON.stringify(res.body)).not.toContain("normalizedName");

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { skills: true }
    });
    expect(profile.skills).toHaveLength(1);
    expect(profile.skills[0]?.normalizedName).toBe("react");
  });

  it("returns 409 on an exact duplicate skill", async () => {
    const { accessToken, userId } = await registerUser("dupexact@example.com");

    await addSkill(accessToken, { name: "React" });
    const res = await addSkill(accessToken, { name: "React" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");

    const count = await prisma.skill.count({
      where: { profile: { userId } }
    });
    expect(count).toBe(1);
  });

  it("returns 409 on a case-insensitive duplicate skill", async () => {
    const { accessToken, userId } = await registerUser("dupcase@example.com");

    await addSkill(accessToken, { name: "React" });
    const res = await addSkill(accessToken, { name: "react" });

    expect(res.status).toBe(409);

    const count = await prisma.skill.count({
      where: { profile: { userId } }
    });
    expect(count).toBe(1);
  });

  it("returns 400 when name is empty", async () => {
    const { accessToken } = await registerUser("emptyname@example.com");

    const res = await addSkill(accessToken, { name: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/profile/me/skills/:skillId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).delete(
      "/api/profile/me/skills/00000000-0000-0000-0000-000000000000"
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("deletes the user's own skill and returns 204", async () => {
    const { accessToken, userId } = await registerUser("delown@example.com");

    const created = await addSkill(accessToken, { name: "React" });
    const skillId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/skills/${skillId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const count = await prisma.skill.count({
      where: { profile: { userId } }
    });
    expect(count).toBe(0);
  });

  it("returns 403 when deleting a skill owned by another user", async () => {
    const userA = await registerUser("owner-a@example.com");
    const userB = await registerUser("intruder-b@example.com");

    const created = await addSkill(userA.accessToken, { name: "React" });
    const skillId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/skills/${skillId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stillExists = await prisma.skill.findUnique({ where: { id: skillId } });
    expect(stillExists).not.toBeNull();
  });
});
