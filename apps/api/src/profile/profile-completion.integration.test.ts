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

async function getProfile(accessToken: string): Promise<request.Response> {
  return request(app)
    .get("/api/profile/me")
    .set("Authorization", `Bearer ${accessToken}`);
}

const VALID_BASIC_INFO = {
  firstName: "David",
  lastName: "López"
} as const;

const VALID_SKILL = {
  name: "React",
  level: "INTERMEDIATE",
  category: "Frontend"
} as const;

const VALID_EXPERIENCE = {
  company: "Acme",
  role: "Frontend Developer",
  startDate: "2024-01-01"
} as const;

const VALID_EDUCATION = {
  institution: "Ilerna Online",
  title: "Desarrollo de Aplicaciones Multiplataforma",
  startDate: "2023-09-01"
} as const;

const VALID_PROJECT = {
  name: "PymeTask",
  technologies: ["Kotlin", "Jetpack Compose", "Firebase"]
} as const;

const VALID_LINKS = {
  links: [{ type: "GITHUB", url: "https://github.com/David-LS-Bilbao" }]
} as const;

const VALID_PREFERENCES = {
  desiredRoles: ["Frontend Developer"],
  preferredLocations: ["Bilbao"],
  remotePreference: "HYBRID",
  seniority: "JUNIOR",
  salaryMin: 22000,
  salaryMax: 32000,
  contractTypes: ["FULL_TIME"]
} as const;

describe("GET /api/profile/me completionPercentage", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // A
  it("returns completionPercentage 0 for an empty profile", async () => {
    const { accessToken } = await registerUser("completion-empty@example.com");

    const res = await getProfile(accessToken);

    expect(res.status).toBe(200);
    expect(res.body.completionPercentage).toBe(0);
  });

  // B
  it("returns completionPercentage 14 with only basicInfo completed", async () => {
    const { accessToken } = await registerUser("completion-basic@example.com");

    const put = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_BASIC_INFO });
    expect(put.status).toBe(200);

    const res = await getProfile(accessToken);

    expect(res.status).toBe(200);
    // 1 de 7 secciones => Math.round((1 / 7) * 100) = 14
    expect(res.body.completionPercentage).toBe(14);
  });

  // C
  it("returns completionPercentage 29 with only links and preferences completed", async () => {
    const { accessToken } = await registerUser("completion-lp@example.com");

    const links = await request(app)
      .put("/api/profile/me/links")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_LINKS });
    expect(links.status).toBe(200);

    const prefs = await request(app)
      .put("/api/profile/me/preferences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_PREFERENCES });
    expect(prefs.status).toBe(200);

    const res = await getProfile(accessToken);

    expect(res.status).toBe(200);
    // 2 de 7 secciones => Math.round((2 / 7) * 100) = 29
    expect(res.body.completionPercentage).toBe(29);
  });

  // D
  it("returns completionPercentage 100 with all sections completed", async () => {
    const { accessToken } = await registerUser("completion-full@example.com");

    const basic = await request(app)
      .put("/api/profile/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_BASIC_INFO });
    expect(basic.status).toBe(200);

    const skill = await request(app)
      .post("/api/profile/me/skills")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_SKILL });
    expect(skill.status).toBe(201);

    const experience = await request(app)
      .post("/api/profile/me/experience")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_EXPERIENCE });
    expect(experience.status).toBe(201);

    const education = await request(app)
      .post("/api/profile/me/education")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_EDUCATION });
    expect(education.status).toBe(201);

    const project = await request(app)
      .post("/api/profile/me/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_PROJECT });
    expect(project.status).toBe(201);

    const links = await request(app)
      .put("/api/profile/me/links")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_LINKS });
    expect(links.status).toBe(200);

    const prefs = await request(app)
      .put("/api/profile/me/preferences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...VALID_PREFERENCES });
    expect(prefs.status).toBe(200);

    const res = await getProfile(accessToken);

    expect(res.status).toBe(200);
    // 7 de 7 secciones => Math.round((7 / 7) * 100) = 100
    expect(res.body.completionPercentage).toBe(100);
  });

  // E
  it("does not count preferences as completed when they are not meaningful (empty body / remotePreference ANY)", async () => {
    const { accessToken } = await registerUser("completion-emptyprefs@example.com");

    // El schema permite body vacío (todos los campos opcionales); por defecto
    // remotePreference = ANY y el resto vacío, lo que NO cuenta como sección completa.
    const prefs = await request(app)
      .put("/api/profile/me/preferences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ remotePreference: "ANY" });
    expect(prefs.status).toBe(200);

    const res = await getProfile(accessToken);

    expect(res.status).toBe(200);
    expect(res.body.completionPercentage).toBe(0);
  });
});
