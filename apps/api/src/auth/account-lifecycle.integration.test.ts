import { access } from "node:fs/promises";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { resolveAvatarFilePath } from "../profile/avatar.storage.js";
import { truncateTables } from "../tests/setup.js";
import { deleteAccount } from "./auth.service.js";
import { signAccessToken } from "./jwt.util.js";

/**
 * Account lifecycle — borrado permanente y exportacion.
 * Spec: `docs/specs/features/account-lifecycle.md`.
 */

const PASSWORD = "ValidPass123";
const GENERIC_401 = { error: { code: "UNAUTHORIZED", message: "Authentication required." } };

let seq = 0;
const nextEmail = (): string => `lifecycle-${Date.now()}-${seq++}@example.com`;

type Session = { email: string; userId: string; token: string; cookie: string };

function readRefreshCookie(setCookie: string[] | undefined): string {
  const raw = (setCookie ?? []).find((c) => c.startsWith("refresh_token="));
  return raw ? (raw.split(";")[0] ?? "") : "";
}

function authH(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function registerUser(email = nextEmail()): Promise<Session> {
  const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  return {
    email,
    userId: res.body.user.id as string,
    token: res.body.accessToken as string,
    cookie: readRefreshCookie(res.headers["set-cookie"] as unknown as string[])
  };
}

/** PNG minimo valido para `sniffImageMime` (magic bytes + relleno hasta 12 bytes). */
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
]);

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Perfil publicable + avatar + oferta guardada: el estado completo de un titular. */
async function seedFullAccount(session: Session): Promise<{ slug: string; avatarUrl: string }> {
  await request(app)
    .put("/api/profile/me")
    .set(authH(session.token))
    .send({ firstName: "Ana", lastName: "Pérez", headline: "Frontend Developer" });
  await request(app).post("/api/profile/me/skills").set(authH(session.token)).send({ name: "React" });
  await request(app)
    .post("/api/profile/me/projects")
    .set(authH(session.token))
    .send({ name: "design-system", technologies: ["React"] });

  const avatarRes = await request(app)
    .post("/api/profile/me/avatar")
    .set(authH(session.token))
    .attach("avatar", PNG_BYTES, { filename: "a.png", contentType: "image/png" });
  expect(avatarRes.status).toBe(200);

  const publishRes = await request(app)
    .post("/api/profile/me/portfolio/publish")
    .set(authH(session.token))
    .send({});
  expect(publishRes.status).toBe(200);

  const job = await prisma.job.create({
    data: {
      title: "Frontend Engineer",
      company: "ACME",
      remoteType: "REMOTE",
      description: "Sintetico",
      requirements: [],
      seniority: "MID",
      contractType: "FULL_TIME"
    }
  });
  const savedRes = await request(app).post(`/api/saved-jobs/${job.id}`).set(authH(session.token));
  expect([200, 201]).toContain(savedRes.status);

  return { slug: publishRes.body.slug as string, avatarUrl: avatarRes.body.avatarUrl as string };
}

describe("Account lifecycle", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  describe("POST /api/auth/me/export", () => {
    it("returns 401 without authentication", async () => {
      const res = await request(app).post("/api/auth/me/export").send({ password: PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    });

    it("returns the same generic 401 when the password is wrong", async () => {
      const session = await registerUser();
      const res = await request(app)
        .post("/api/auth/me/export")
        .set(authH(session.token))
        .send({ password: "WrongPass123" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    });

    it("returns 400 when the password field is missing", async () => {
      const session = await registerUser();
      const res = await request(app).post("/api/auth/me/export").set(authH(session.token)).send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("exports the owner's data with a correct password", async () => {
      const session = await registerUser();
      const { slug } = await seedFullAccount(session);

      const res = await request(app)
        .post("/api/auth/me/export")
        .set(authH(session.token))
        .send({ password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.version).toBe("1");
      expect(res.body.account.email).toBe(session.email);
      expect(res.body.account.id).toBe(session.userId);
      expect(res.body.profile.firstName).toBe("Ana");
      expect(res.body.profile.skills).toHaveLength(1);
      expect(res.body.profile.projects[0].name).toBe("design-system");
      expect(res.body.portfolio.slug).toBe(slug);
      expect(res.body.portfolio.isPublished).toBe(true);
      expect(res.body.savedJobs).toHaveLength(1);
      expect(res.body.savedJobs[0].job.title).toBe("Frontend Engineer");
    });

    // Invariante critico: ningun material de credenciales puede salir del sistema.
    it("never exports credential material", async () => {
      const session = await registerUser();
      await seedFullAccount(session);

      const res = await request(app)
        .post("/api/auth/me/export")
        .set(authH(session.token))
        .send({ password: PASSWORD });

      expect(res.status).toBe(200);
      const serialized = JSON.stringify(res.body);
      for (const forbidden of [
        "passwordHash",
        "tokenHash",
        "familyId",
        "replacedById",
        "refreshToken",
        "refresh_token",
        "accessToken"
      ]) {
        expect(serialized).not.toContain(forbidden);
      }
      // Y tampoco el valor real del hash ni el del refresh token.
      const stored = await prisma.user.findUnique({ where: { id: session.userId } });
      expect(serialized).not.toContain(stored?.passwordHash ?? "__absent__");
      const refresh = await prisma.refreshToken.findFirst({ where: { userId: session.userId } });
      expect(serialized).not.toContain(refresh?.tokenHash ?? "__absent__");
    });

    it("exports only the authenticated owner's data", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      await request(app)
        .put("/api/profile/me")
        .set(authH(other.token))
        .send({ firstName: "Otra", lastName: "Persona" });

      const res = await request(app)
        .post("/api/auth/me/export")
        .set(authH(owner.token))
        .send({ password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.account.email).toBe(owner.email);
      expect(JSON.stringify(res.body)).not.toContain(other.email);
      expect(JSON.stringify(res.body)).not.toContain("Otra");
    });
  });

  describe("DELETE /api/auth/me", () => {
    it("returns 401 without authentication", async () => {
      const res = await request(app)
        .delete("/api/auth/me")
        .send({ password: PASSWORD, confirmation: "DELETE" });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    });

    it("returns 400 when the confirmation word is not exactly DELETE", async () => {
      const session = await registerUser();
      const res = await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "delete" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(await prisma.user.findUnique({ where: { id: session.userId } })).not.toBeNull();
    });

    it("returns the same generic 401 when the password is wrong, and deletes nothing", async () => {
      const session = await registerUser();
      const res = await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: "WrongPass123", confirmation: "DELETE" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
      expect(await prisma.user.findUnique({ where: { id: session.userId } })).not.toBeNull();
    });

    it("hard-deletes the account and every owned row, preserving the job catalogue", async () => {
      const session = await registerUser();
      await seedFullAccount(session);

      const jobsBefore = await prisma.job.count();

      const res = await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      expect(res.status).toBe(204);
      expect(await prisma.user.findUnique({ where: { id: session.userId } })).toBeNull();
      expect(await prisma.refreshToken.count({ where: { userId: session.userId } })).toBe(0);
      expect(await prisma.candidateProfile.findUnique({ where: { userId: session.userId } })).toBeNull();
      expect(await prisma.portfolioSettings.findUnique({ where: { userId: session.userId } })).toBeNull();
      expect(await prisma.savedJob.count({ where: { userId: session.userId } })).toBe(0);
      expect(await prisma.skill.count()).toBe(0);
      expect(await prisma.project.count()).toBe(0);
      // El catalogo global no pertenece a la persona y sobrevive.
      expect(await prisma.job.count()).toBe(jobsBefore);
    });

    it("clears the refresh cookie", async () => {
      const session = await registerUser();
      const res = await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      expect(res.status).toBe(204);
      const cleared = (res.headers["set-cookie"] as unknown as string[]) ?? [];
      expect(cleared.some((c) => c.startsWith("refresh_token=;"))).toBe(true);
    });

    it("removes every refresh family across all devices", async () => {
      const session = await registerUser();
      // Segunda y tercera autenticacion: cada login abre su propia familia.
      await request(app).post("/api/auth/login").send({ email: session.email, password: PASSWORD });
      await request(app).post("/api/auth/login").send({ email: session.email, password: PASSWORD });
      expect(await prisma.refreshToken.count({ where: { userId: session.userId } })).toBe(3);

      await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      expect(await prisma.refreshToken.count({ where: { userId: session.userId } })).toBe(0);
    });
  });

  describe("session invalidation after deletion", () => {
    it("rejects a previously issued access token on the next protected request", async () => {
      const session = await registerUser();
      const previousToken = session.token;

      await request(app)
        .delete("/api/auth/me")
        .set(authH(previousToken))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      const res = await request(app).get("/api/profile/me").set(authH(previousToken));
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    });

    it("rejects a freshly minted token for the deleted user (signature alone is not enough)", async () => {
      const session = await registerUser();
      await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      // Token nuevo, firma impecable, usuario inexistente.
      const res = await request(app).get("/api/dashboard/me").set(authH(signAccessToken(session.userId)));
      expect(res.status).toBe(401);
    });

    it("cannot recover the session through refresh", async () => {
      const session = await registerUser();
      await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      const res = await request(app).post("/api/auth/refresh").set("Cookie", session.cookie);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    });
  });

  describe("public portfolio", () => {
    it("becomes unavailable immediately after the commit", async () => {
      const session = await registerUser();
      const { slug } = await seedFullAccount(session);

      const before = await request(app).get(`/api/public/portfolios/${slug}`);
      expect(before.status).toBe(200);

      await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      const after = await request(app).get(`/api/public/portfolios/${slug}`);
      expect(after.status).toBe(404);
    });
  });

  describe("avatar physical cleanup", () => {
    it("removes the avatar file when the account is deleted", async () => {
      const session = await registerUser();
      const { avatarUrl } = await seedFullAccount(session);
      const filePath = resolveAvatarFilePath(avatarUrl);
      expect(filePath).not.toBeNull();
      expect(await fileExists(filePath as string)).toBe(true);

      await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      expect(await fileExists(filePath as string)).toBe(false);
    });

    it("removes the previous file when the avatar is replaced", async () => {
      const session = await registerUser();
      const first = await request(app)
        .post("/api/profile/me/avatar")
        .set(authH(session.token))
        .attach("avatar", PNG_BYTES, { filename: "first.png", contentType: "image/png" });
      const firstPath = resolveAvatarFilePath(first.body.avatarUrl as string) as string;
      expect(await fileExists(firstPath)).toBe(true);

      const second = await request(app)
        .post("/api/profile/me/avatar")
        .set(authH(session.token))
        .attach("avatar", PNG_BYTES, { filename: "second.png", contentType: "image/png" });
      const secondPath = resolveAvatarFilePath(second.body.avatarUrl as string) as string;

      expect(firstPath).not.toBe(secondPath);
      expect(await fileExists(firstPath)).toBe(false);
      expect(await fileExists(secondPath)).toBe(true);
    });

    it("removes the previous file when the avatar is cleared through the profile", async () => {
      const session = await registerUser();
      const uploaded = await request(app)
        .post("/api/profile/me/avatar")
        .set(authH(session.token))
        .attach("avatar", PNG_BYTES, { filename: "cleared.png", contentType: "image/png" });
      const filePath = resolveAvatarFilePath(uploaded.body.avatarUrl as string) as string;
      expect(await fileExists(filePath)).toBe(true);

      await request(app)
        .put("/api/profile/me")
        .set(authH(session.token))
        .send({ firstName: "Ana", lastName: "Pérez", avatarUrl: null });

      expect(await fileExists(filePath)).toBe(false);
    });

    it("deletes an account whose avatar file is already gone", async () => {
      const session = await registerUser();
      const { avatarUrl } = await seedFullAccount(session);
      const filePath = resolveAvatarFilePath(avatarUrl) as string;

      // Alguien ya limpio el fichero por fuera: el ciclo de vida no puede romperse.
      const { unlink } = await import("node:fs/promises");
      await unlink(filePath);

      const res = await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      expect(res.status).toBe(204);
      expect(await prisma.user.findUnique({ where: { id: session.userId } })).toBeNull();
    });
  });

  describe("concurrency", () => {
    // Caso A — el refresh commitea ANTES del borrado. Puede emitir credenciales
    // nuevas; el borrado se las lleva por cascada y el access token recien
    // emitido deja de autorizar en la siguiente peticion protegida.
    it("refresh committing before delete still ends with no usable session", async () => {
      const session = await registerUser();

      const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", session.cookie);
      expect(refreshed.status).toBe(200);
      const freshAccessToken = refreshed.body.accessToken as string;
      const freshCookie = readRefreshCookie(refreshed.headers["set-cookie"] as unknown as string[]);

      const deleted = await request(app)
        .delete("/api/auth/me")
        .set(authH(freshAccessToken))
        .send({ password: PASSWORD, confirmation: "DELETE" });
      expect(deleted.status).toBe(204);

      expect((await request(app).get("/api/profile/me").set(authH(freshAccessToken))).status).toBe(401);
      expect((await request(app).post("/api/auth/refresh").set("Cookie", freshCookie)).status).toBe(401);
      expect(await prisma.refreshToken.count({ where: { userId: session.userId } })).toBe(0);
    });

    // Caso B — el borrado commitea PRIMERO. El refresh en vuelo ya no encuentra
    // al usuario y termina en fallo generico de sesion, sin revelar la causa.
    it("delete committing first makes an in-flight refresh fail generically", async () => {
      const session = await registerUser();

      await request(app)
        .delete("/api/auth/me")
        .set(authH(session.token))
        .send({ password: PASSWORD, confirmation: "DELETE" });

      const res = await request(app).post("/api/auth/refresh").set("Cookie", session.cookie);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    });

    // Interleaving determinista: un refresh se consolida entre el step-up del
    // borrado y el borrado en si. El resultado debe ser el mismo.
    it("a refresh interleaved inside the delete does not leave a usable session", async () => {
      const session = await registerUser();
      let refreshedToken: string | null = null;

      await deleteAccount(session.userId, PASSWORD, {
        hooks: {
          beforeUserDelete: async () => {
            const res = await request(app).post("/api/auth/refresh").set("Cookie", session.cookie);
            expect(res.status).toBe(200);
            refreshedToken = res.body.accessToken as string;
          }
        }
      });

      expect(refreshedToken).not.toBeNull();
      expect(await prisma.user.findUnique({ where: { id: session.userId } })).toBeNull();
      expect(await prisma.refreshToken.count({ where: { userId: session.userId } })).toBe(0);
      const res = await request(app).get("/api/profile/me").set(authH(refreshedToken as unknown as string));
      expect(res.status).toBe(401);
    });

    // Una peticion protegida YA autorizada antes del commit termina su trabajo:
    // la invalidacion es para autenticaciones iniciadas despues, no retroactiva.
    it("a second delete of the same account answers with the generic 401", async () => {
      const session = await registerUser();
      const token = session.token;

      const first = await request(app)
        .delete("/api/auth/me")
        .set(authH(token))
        .send({ password: PASSWORD, confirmation: "DELETE" });
      expect(first.status).toBe(204);

      const second = await request(app)
        .delete("/api/auth/me")
        .set(authH(token))
        .send({ password: PASSWORD, confirmation: "DELETE" });
      expect(second.status).toBe(401);
      expect(second.body).toEqual(GENERIC_401);
    });
  });
});
