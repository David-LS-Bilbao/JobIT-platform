import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

/**
 * Tests del read model completo de `GET /api/profile/me` (Sprint 13.5).
 * El endpoint debe devolver el perfil básico + relaciones (skills, experiences,
 * education, projects, links, preferences) con sus ids, para alimentar JobIT CV.
 */

const PASSWORD = "ValidPass123";

type AuthUser = { accessToken: string };

async function registerUser(email: string): Promise<AuthUser> {
  const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
  return { accessToken: res.body.accessToken };
}

const auth = (t: string): Record<string, string> => ({ Authorization: `Bearer ${t}` });

const getProfile = (t: string): request.Test =>
  request(app).get("/api/profile/me").set(auth(t));

describe("GET /api/profile/me — read model", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("devuelve 401 sin sesión", async () => {
    const res = await request(app).get("/api/profile/me");
    expect(res.status).toBe(401);
  });

  it("perfil vacío: campos básicos, listas [] y preferences null", async () => {
    const { accessToken } = await registerUser("rm-empty@example.com");
    const res = await getProfile(accessToken);

    expect(res.status).toBe(200);
    // Campos básicos (compatibilidad hacia atrás)
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("userId");
    expect(res.body).toHaveProperty("completionPercentage");
    expect(typeof res.body.completionPercentage).toBe("number");
    // Read model
    expect(res.body.skills).toEqual([]);
    expect(res.body.experiences).toEqual([]);
    expect(res.body.education).toEqual([]);
    expect(res.body.projects).toEqual([]);
    expect(res.body.links).toEqual([]);
    expect(res.body.preferences).toBeNull();
  });

  it("devuelve todas las relaciones con sus campos tras crearlas", async () => {
    const { accessToken } = await registerUser("rm-full@example.com");

    await request(app).put("/api/profile/me").set(auth(accessToken)).send({ firstName: "Ana", lastName: "Rivas" });
    await request(app)
      .post("/api/profile/me/skills")
      .set(auth(accessToken))
      .send({ name: "TypeScript", level: "ADVANCED", category: "Frontend" });
    await request(app)
      .post("/api/profile/me/experience")
      .set(auth(accessToken))
      .send({ company: "Acme", role: "Frontend dev", startDate: "2020-01-01", current: true });
    await request(app)
      .post("/api/profile/me/education")
      .set(auth(accessToken))
      .send({ institution: "Uni", title: "CS", startDate: "2015-09-01", endDate: "2019-06-01" });
    await request(app)
      .post("/api/profile/me/projects")
      .set(auth(accessToken))
      .send({ name: "design-system", technologies: ["React", "TypeScript"] });
    await request(app)
      .put("/api/profile/me/links")
      .set(auth(accessToken))
      .send({ links: [{ type: "GITHUB", url: "https://github.com/ana" }] });
    await request(app)
      .put("/api/profile/me/preferences")
      .set(auth(accessToken))
      .send({ remotePreference: "REMOTE", seniority: "MID" });

    const res = await getProfile(accessToken);
    expect(res.status).toBe(200);

    expect(res.body.firstName).toBe("Ana");

    expect(res.body.skills).toHaveLength(1);
    expect(res.body.skills[0]).toMatchObject({ name: "TypeScript", level: "ADVANCED", category: "Frontend" });
    expect(typeof res.body.skills[0].id).toBe("string");
    expect(res.body.skills[0]).not.toHaveProperty("normalizedName");

    expect(res.body.experiences).toHaveLength(1);
    expect(res.body.experiences[0]).toMatchObject({ company: "Acme", role: "Frontend dev", current: true });
    expect(typeof res.body.experiences[0].id).toBe("string");

    expect(res.body.education).toHaveLength(1);
    expect(res.body.education[0]).toMatchObject({ institution: "Uni", title: "CS" });

    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0]).toMatchObject({ name: "design-system" });
    expect(res.body.projects[0].technologies).toEqual(["React", "TypeScript"]);

    expect(res.body.links).toHaveLength(1);
    expect(res.body.links[0]).toMatchObject({ type: "GITHUB", url: "https://github.com/ana" });
    expect(typeof res.body.links[0].id).toBe("string");

    expect(res.body.preferences).toMatchObject({ remotePreference: "REMOTE", seniority: "MID" });
    expect(res.body.completionPercentage).toBeGreaterThan(0);
  });

  it("aísla los datos por usuario autenticado", async () => {
    const a = await registerUser("rm-a@example.com");
    const b = await registerUser("rm-b@example.com");
    await request(app)
      .post("/api/profile/me/skills")
      .set(auth(a.accessToken))
      .send({ name: "Go" });

    const resB = await getProfile(b.accessToken);
    expect(resB.status).toBe(200);
    expect(resB.body.skills).toEqual([]);
  });

  it("no expone datos sensibles (passwordHash/tokenHash)", async () => {
    const { accessToken } = await registerUser("rm-sec@example.com");
    const res = await getProfile(accessToken);
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("tokenHash");
  });
});
