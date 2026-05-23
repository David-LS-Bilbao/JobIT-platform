import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { authRouter } from "./auth.router.js";

const testApp = express();
testApp.use(express.json());
testApp.use("/api/auth", authRouter);
testApp.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: { code: "UNHANDLED", message: err.message } });
});

const VALID_EMAIL = "me@example.com";
const VALID_PASSWORD = "ValidPass123";

describe("GET /api/auth/me", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 401 when no Authorization header is provided", async () => {
    const response = await request(testApp).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when token is malformed or invalid", async () => {
    const response = await request(testApp)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 with user data when token is valid", async () => {
    const registerRes = await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const { accessToken } = registerRes.body as { accessToken: string };

    const response = await request(testApp)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.email).toBe(VALID_EMAIL);
    expect(response.body.role).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
  });

  it("does not expose passwordHash in the response", async () => {
    const registerRes = await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const { accessToken } = registerRes.body as { accessToken: string };

    const response = await request(testApp)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });
});
