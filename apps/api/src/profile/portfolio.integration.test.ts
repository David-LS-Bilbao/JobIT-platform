import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";

const PASSWORD = "ValidPass123";
const BASE = "/api/profile/me/portfolio";

type Auth = { token: string; userId: string };

async function registerUser(email: string): Promise<Auth> {
  const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

function authH(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function setBasics(token: string, firstName: string, lastName: string, headline?: string): Promise<void> {
  await request(app).put("/api/profile/me").set(authH(token)).send({ firstName, lastName, headline });
}

async function makePublishable(token: string): Promise<void> {
  await setBasics(token, "Ana", "Pérez", "Frontend Developer");
  await request(app).post("/api/profile/me/skills").set(authH(token)).send({ name: "React" });
  await request(app)
    .post("/api/profile/me/projects")
    .set(authH(token))
    .send({ name: "design-system", technologies: ["React"] });
}

describe("Portfolio settings (/api/profile/me/portfolio)", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  describe("GET", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get(BASE);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("lazily creates settings (unpublished) and exposes a relative public path", async () => {
      const { token } = await registerUser("create@example.com");
      const res = await request(app).get(BASE).set(authH(token));

      expect(res.status).toBe(200);
      expect(typeof res.body.slug).toBe("string");
      expect(res.body.slug.length).toBeGreaterThanOrEqual(3);
      expect(res.body.isPublished).toBe(false);
      expect(res.body.publishedAt).toBeNull();
      expect(res.body.publicUrlPath).toBe(`/u/${res.body.slug}`);
    });

    it("is idempotent (same slug on repeated calls)", async () => {
      const { token } = await registerUser("idem@example.com");
      const first = await request(app).get(BASE).set(authH(token));
      const second = await request(app).get(BASE).set(authH(token));
      expect(second.body.slug).toBe(first.body.slug);
    });

    it("generates the slug from first/last name", async () => {
      const { token } = await registerUser("named@example.com");
      await setBasics(token, "Ana", "Pérez");
      const res = await request(app).get(BASE).set(authH(token));
      expect(res.body.slug).toBe("ana-perez");
    });

    it("keeps slugs unique on collision (suffix -2)", async () => {
      const a = await registerUser("a-collide@example.com");
      await setBasics(a.token, "Ana", "Pérez");
      const resA = await request(app).get(BASE).set(authH(a.token));
      expect(resA.body.slug).toBe("ana-perez");

      const b = await registerUser("b-collide@example.com");
      await setBasics(b.token, "Ana", "Pérez");
      const resB = await request(app).get(BASE).set(authH(b.token));
      expect(resB.body.slug).toBe("ana-perez-2");
    });
  });

  describe("PUT", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).put(BASE).send({ slug: "whatever" });
      expect(res.status).toBe(401);
    });

    it("updates a valid slug and normalizes it", async () => {
      const { token } = await registerUser("put-ok@example.com");
      const res = await request(app).put(BASE).set(authH(token)).send({ slug: "  David López  " });
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("david-lopez");
      expect(res.body.publicUrlPath).toBe("/u/david-lopez");
    });

    it("rejects an invalid slug (400)", async () => {
      const { token } = await registerUser("put-bad@example.com");
      const res = await request(app).put(BASE).set(authH(token)).send({ slug: "ab" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_SLUG");
    });

    it("rejects a reserved word (400)", async () => {
      const { token } = await registerUser("put-reserved@example.com");
      const res = await request(app).put(BASE).set(authH(token)).send({ slug: "admin" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_SLUG");
    });

    it("returns 409 when the slug is taken by another user", async () => {
      const a = await registerUser("owner@example.com");
      await request(app).put(BASE).set(authH(a.token)).send({ slug: "shared-slug" });

      const b = await registerUser("other@example.com");
      const res = await request(app).put(BASE).set(authH(b.token)).send({ slug: "shared-slug" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("SLUG_TAKEN");
    });

    it("allows keeping the user's own slug", async () => {
      const { token } = await registerUser("own-slug@example.com");
      await request(app).put(BASE).set(authH(token)).send({ slug: "my-slug" });
      const res = await request(app).put(BASE).set(authH(token)).send({ slug: "my-slug" });
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("my-slug");
    });

    it("updates visibility flags and does not auto-publish", async () => {
      const { token } = await registerUser("flags@example.com");
      const res = await request(app)
        .put(BASE)
        .set(authH(token))
        .send({ showLocation: false, showAvailability: false, showPreferences: true });
      expect(res.status).toBe(200);
      expect(res.body.showLocation).toBe(false);
      expect(res.body.showAvailability).toBe(false);
      expect(res.body.showPreferences).toBe(true);
      expect(res.body.isPublished).toBe(false);
    });
  });

  describe("PUBLISH", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).post(`${BASE}/publish`);
      expect(res.status).toBe(401);
    });

    it("returns 400 with missing fields when the profile is incomplete", async () => {
      const { token } = await registerUser("incomplete@example.com");
      const res = await request(app).post(`${BASE}/publish`).set(authH(token));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("PORTFOLIO_NOT_READY");
      expect(res.body.error.missingFields).toEqual(
        expect.arrayContaining(["name", "headline", "skills", "projectsOrExperience"])
      );
    });

    it("publishes when the minimum profile is met", async () => {
      const { token } = await registerUser("ready@example.com");
      await makePublishable(token);
      const res = await request(app).post(`${BASE}/publish`).set(authH(token));
      expect(res.status).toBe(200);
      expect(res.body.isPublished).toBe(true);
      expect(res.body.publishedAt).not.toBeNull();
    });
  });

  describe("UNPUBLISH", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).post(`${BASE}/unpublish`);
      expect(res.status).toBe(401);
    });

    it("unpublishes (isPublished=false, publishedAt=null)", async () => {
      const { token } = await registerUser("unpub@example.com");
      await makePublishable(token);
      await request(app).post(`${BASE}/publish`).set(authH(token));

      const res = await request(app).post(`${BASE}/unpublish`).set(authH(token));
      expect(res.status).toBe(200);
      expect(res.body.isPublished).toBe(false);
      expect(res.body.publishedAt).toBeNull();
    });
  });

  describe("privacy / scope", () => {
    it("does not expose userId, email, tokens or password", async () => {
      const { token } = await registerUser("privacy@example.com");
      const res = await request(app).get(BASE).set(authH(token));
      const body = JSON.stringify(res.body);
      expect(body).not.toContain("userId");
      expect(body).not.toContain("privacy@example.com");
      expect(body).not.toContain("passwordHash");
      expect(body).not.toContain("token");
      expect(Object.keys(res.body).sort()).toEqual(
        [
          "isPublished",
          "publicUrlPath",
          "publishedAt",
          "showAvailability",
          "showLocation",
          "showPreferences",
          "slug"
        ].sort()
      );
    });
  });
});
