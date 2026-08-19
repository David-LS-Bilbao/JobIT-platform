import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { authRouter } from "./auth.router.js";
import { logout, refreshSession } from "./auth.service.js";
import { hashRefreshToken } from "./refresh-token.util.js";

const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());
testApp.use("/api/auth", authRouter);
testApp.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: { code: "UNHANDLED", message: err.message } });
});

const VALID_EMAIL = "logout@example.com";
const VALID_PASSWORD = "ValidPass123";

describe("POST /api/auth/logout", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("revokes the refresh token in DB and clears the cookie when called with a valid refresh token cookie", async () => {
    const registerRes = await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const cookies = registerRes.headers["set-cookie"] as unknown as string[];

    const response = await request(testApp)
      .post("/api/auth/logout")
      .set("Cookie", cookies);

    expect(response.status).toBe(204);

    const setCookieHeader = response.headers["set-cookie"] as string[] | undefined;
    expect(setCookieHeader).toBeDefined();
    const refreshTokenCleared = setCookieHeader?.some((c) => c.startsWith("refresh_token=;"));
    expect(refreshTokenCleared).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: VALID_EMAIL } });
    const unrevokedCount = await prisma.refreshToken.count({
      where: { userId: user!.id, revokedAt: null }
    });
    expect(unrevokedCount).toBe(0);
  });

  it("returns 204 without error when called without a session", async () => {
    const response = await request(testApp).post("/api/auth/logout");

    expect(response.status).toBe(204);
  });

  // ── B28-B29, B32, B41 · familia, concurrencia e interleaving determinista ────

  function readRefreshCookie(setCookie: string[] | undefined): string | null {
    if (!setCookie) return null;
    const raw = setCookie.find((c) => c.startsWith("refresh_token="));
    if (!raw) return null;
    const value = raw.slice("refresh_token=".length).split(";")[0] ?? "";
    return value.length > 0 ? decodeURIComponent(value) : null;
  }

  async function registerSession(email: string) {
    const res = await request(testApp)
      .post("/api/auth/register")
      .send({ email, password: VALID_PASSWORD });
    expect(res.status).toBe(201);
    const token = readRefreshCookie(res.headers["set-cookie"] as unknown as string[])!;
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(token) } });
    return { token, familyId: row!.familyId };
  }

  function usableCount(familyId: string): Promise<number> {
    return prisma.refreshToken.count({
      where: { familyId, revokedAt: null, expiresAt: { gt: new Date() } }
    });
  }

  function deferred(): { promise: Promise<void>; resolve: () => void } {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  function onceHook(signal: () => void, gate: Promise<void>): () => Promise<void> {
    let fired = false;
    return async () => {
      if (fired) return;
      fired = true;
      signal();
      await gate;
    };
  }

  it("B28 · logout tras una rotación revoca la familia completa", async () => {
    const s = await registerSession("logout-rotated@example.com");
    const rotated = await refreshSession(s.token);
    expect(rotated.outcome).toBe("ROTATED");
    const current = rotated.outcome === "ROTATED" ? rotated.token : "";

    const response = await request(testApp)
      .post("/api/auth/logout")
      .set("Cookie", `refresh_token=${current}`);

    expect(response.status).toBe(204);
    expect(await usableCount(s.familyId)).toBe(0);
    const after = await refreshSession(current);
    expect(after.outcome).not.toBe("ROTATED");
  });

  it("B28b · logout con un predecessor localiza y revoca su familia", async () => {
    const s = await registerSession("logout-predecessor@example.com");
    const rotated = await refreshSession(s.token);
    expect(rotated.outcome).toBe("ROTATED");

    const response = await request(testApp)
      .post("/api/auth/logout")
      .set("Cookie", `refresh_token=${s.token}`);

    expect(response.status).toBe(204);
    expect(await usableCount(s.familyId)).toBe(0);
  });

  it("B28c · logout no alcanza a otras familias del mismo usuario", async () => {
    const a = await registerSession("logout-multi@example.com");
    const login = await request(testApp)
      .post("/api/auth/login")
      .send({ email: "logout-multi@example.com", password: VALID_PASSWORD })
      .expect(200);
    const tokenB = readRefreshCookie(login.headers["set-cookie"] as unknown as string[])!;
    const rowB = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(tokenB) }
    });

    await request(testApp)
      .post("/api/auth/logout")
      .set("Cookie", `refresh_token=${a.token}`)
      .expect(204);

    expect(await usableCount(a.familyId)).toBe(0);
    expect(await usableCount(rowB!.familyId)).toBe(1);
  });

  it("B29 · logout concurrente con refresh: la sesión muere en ambos órdenes", async () => {
    for (const logoutFirst of [true, false]) {
      await truncateTables(prisma);
      const s = await registerSession(`logout-race-${logoutFirst}@example.com`);

      const ops = logoutFirst
        ? [logout(s.token), refreshSession(s.token)]
        : [refreshSession(s.token), logout(s.token)];
      await Promise.all(ops);

      expect(await usableCount(s.familyId)).toBe(0);
    }
  });

  it("B32 · stress LOGOUT vs ROTATION: el invariante de familia se cumple siempre", async () => {
    for (let i = 0; i < 8; i++) {
      await truncateTables(prisma);
      const s = await registerSession(`logout-stress-${i}@example.com`);

      await Promise.all([logout(s.token), refreshSession(s.token)]);

      expect(await usableCount(s.familyId)).toBe(0);
      for (const row of await prisma.refreshToken.findMany({ where: { familyId: s.familyId } })) {
        expect(row.revokedAt).not.toBeNull();
      }
    }
  });

  it("B41 · determinista LOGOUT vs ROTATION: el logout alcanza al successor concurrente", async () => {
    const s = await registerSession("logout-deterministic@example.com");

    const rotationReachedClaim = deferred();
    const logoutReachedRevoke = deferred();
    const gateRotation = deferred();
    const gateLogout = deferred();

    // 1. La rotación reclama el current y se detiene ANTES de comprometer.
    const pRotation = refreshSession(s.token, {
      hooks: { afterClaim: onceHook(rotationReachedClaim.resolve, gateRotation.promise) }
    });
    await rotationReachedClaim.promise;

    // 2. El logout llega JUSTO ANTES de revocar la familia y se detiene.
    const pLogout = logout(s.token, {
      hooks: { beforeFamilyRevoke: onceHook(logoutReachedRevoke.resolve, gateLogout.promise) }
    });
    await logoutReachedRevoke.promise;

    // 3. Se libera la rotación: crea el successor y COMPROMETE.
    gateRotation.resolve();
    const rotation = await pRotation;

    // 4. Solo ahora se libera la revocación de familia del logout.
    gateLogout.resolve();
    await pLogout;

    // INVARIANTE I9 tras el logout satisfactorio.
    expect(await usableCount(s.familyId)).toBe(0);
    if (rotation.outcome === "ROTATED") {
      const after = await refreshSession(rotation.token);
      expect(after.outcome).not.toBe("ROTATED");
    }
  });
});
