import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { authRouter } from "./auth.router.js";

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
});
