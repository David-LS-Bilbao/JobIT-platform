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

const VALID_PROJECT = {
  name: "PymeTask",
  description: "Aplicación Android para gestión de pequeñas empresas",
  technologies: ["Kotlin", "Jetpack Compose", "Firebase"],
  url: "https://pymetask.example.com",
  repoUrl: "https://github.com/David-LS-Bilbao/PymeTask"
} as const;

async function createProject(
  accessToken: string,
  body: Record<string, unknown>
): Promise<request.Response> {
  return request(app)
    .post("/api/profile/me/projects")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(body);
}

describe("POST /api/profile/me/projects", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // A
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/profile/me/projects")
      .send(VALID_PROJECT);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // B
  it("creates a project, returns a flat response and persists it for the authenticated user (lazy profile)", async () => {
    const { accessToken, userId } = await registerUser("proj-create@example.com");

    const res = await createProject(accessToken, { ...VALID_PROJECT });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("PymeTask");
    expect(res.body.description).toBe(
      "Aplicación Android para gestión de pequeñas empresas"
    );
    expect(res.body.technologies).toEqual(["Kotlin", "Jetpack Compose", "Firebase"]);
    expect(res.body.url).toBe("https://pymetask.example.com");
    expect(res.body.repoUrl).toBe("https://github.com/David-LS-Bilbao/PymeTask");
    expect(res.body.profileId).toBeUndefined();
    expect(res.body.userId).toBeUndefined();

    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { projects: true }
    });
    expect(profile.projects).toHaveLength(1);
    expect(profile.projects[0]?.id).toBe(res.body.id);
    expect(profile.projects[0]?.name).toBe("PymeTask");
  });

  // C
  it("returns 400 when name is empty", async () => {
    const { accessToken } = await registerUser("proj-noname@example.com");

    const res = await createProject(accessToken, {
      ...VALID_PROJECT,
      name: "   "
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // D
  it("returns 400 when technologies is an empty array", async () => {
    const { accessToken } = await registerUser("proj-notech@example.com");

    const res = await createProject(accessToken, {
      ...VALID_PROJECT,
      technologies: []
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // E
  it("returns 400 when url is invalid", async () => {
    const { accessToken } = await registerUser("proj-badurl@example.com");

    const res = await createProject(accessToken, {
      ...VALID_PROJECT,
      url: "not-a-url"
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // F
  it("returns 400 when repoUrl is invalid", async () => {
    const { accessToken } = await registerUser("proj-badrepo@example.com");

    const res = await createProject(accessToken, {
      ...VALID_PROJECT,
      repoUrl: "not-a-url"
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // G
  it("ignores userId/profileId sent in the body and binds the project to the authenticated user", async () => {
    const { accessToken, userId } = await registerUser("proj-owner@example.com");
    const foreignUserId = "00000000-0000-0000-0000-000000000000";
    const foreignProfileId = "11111111-1111-1111-1111-111111111111";

    const res = await createProject(accessToken, {
      ...VALID_PROJECT,
      userId: foreignUserId,
      profileId: foreignProfileId
    });

    expect(res.status).toBe(201);

    const ownProfile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { userId },
      include: { projects: true }
    });
    expect(ownProfile.projects).toHaveLength(1);
    expect(ownProfile.projects[0]?.id).toBe(res.body.id);

    const foreignByUser = await prisma.candidateProfile.findUnique({
      where: { userId: foreignUserId }
    });
    expect(foreignByUser).toBeNull();

    const foreignByProfile = await prisma.project.findFirst({
      where: { profileId: foreignProfileId }
    });
    expect(foreignByProfile).toBeNull();
  });
});

describe("PUT /api/profile/me/projects/:projectId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // H
  it("updates the user's own project and persists the changes", async () => {
    const { accessToken } = await registerUser("proj-put-own@example.com");

    const created = await createProject(accessToken, { ...VALID_PROJECT });
    const projectId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "PymeTask 2",
        description: "Versión renovada",
        technologies: ["Kotlin", "Ktor"],
        url: "https://pymetask2.example.com",
        repoUrl: "https://github.com/David-LS-Bilbao/PymeTask2"
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("PymeTask 2");
    expect(res.body.description).toBe("Versión renovada");
    expect(res.body.technologies).toEqual(["Kotlin", "Ktor"]);
    expect(res.body.url).toBe("https://pymetask2.example.com");

    const stored = await prisma.project.findUniqueOrThrow({
      where: { id: projectId }
    });
    expect(stored.name).toBe("PymeTask 2");
    expect(stored.technologies).toEqual(["Kotlin", "Ktor"]);
  });

  // I
  it("returns 403 when updating a project owned by another user", async () => {
    const userA = await registerUser("proj-put-a@example.com");
    const userB = await registerUser("proj-put-b@example.com");

    const created = await createProject(userA.accessToken, { ...VALID_PROJECT });
    const projectId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`)
      .send({ name: "Hacked Project" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stored = await prisma.project.findUniqueOrThrow({
      where: { id: projectId }
    });
    expect(stored.name).toBe("PymeTask");
  });

  // J
  it("returns 400 when name is empty on update", async () => {
    const { accessToken } = await registerUser("proj-put-noname@example.com");

    const created = await createProject(accessToken, { ...VALID_PROJECT });
    const projectId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  // K
  it("returns 400 when url or repoUrl is invalid on update", async () => {
    const { accessToken } = await registerUser("proj-put-badurl@example.com");

    const created = await createProject(accessToken, { ...VALID_PROJECT });
    const projectId = created.body.id as string;

    const res = await request(app)
      .put(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ url: "not-a-url", repoUrl: "also-not-a-url" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/profile/me/projects/:projectId", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // L
  it("deletes the user's own project and returns 204", async () => {
    const { accessToken } = await registerUser("proj-del-own@example.com");

    const created = await createProject(accessToken, { ...VALID_PROJECT });
    const projectId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const stored = await prisma.project.findUnique({
      where: { id: projectId }
    });
    expect(stored).toBeNull();
  });

  // M
  it("returns 403 when deleting a project owned by another user", async () => {
    const userA = await registerUser("proj-del-a@example.com");
    const userB = await registerUser("proj-del-b@example.com");

    const created = await createProject(userA.accessToken, { ...VALID_PROJECT });
    const projectId = created.body.id as string;

    const res = await request(app)
      .delete(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${userB.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    const stillExists = await prisma.project.findUnique({
      where: { id: projectId }
    });
    expect(stillExists).not.toBeNull();
  });

  // N
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).delete(
      "/api/profile/me/projects/00000000-0000-0000-0000-000000000000"
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
