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

const VALID_EMAIL = "user@example.com";
const VALID_PASSWORD = "ValidPass123";

describe("POST /api/auth/login", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 200, access token and sets refresh cookie on valid credentials", async () => {
    await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const response = await request(testApp)
      .post("/api/auth/login")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(VALID_EMAIL);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 with generic error on wrong password", async () => {
    await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const response = await request(testApp)
      .post("/api/auth/login")
      .send({ email: VALID_EMAIL, password: "WrongPassword999" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.body.error.message).toBeDefined();
  });

  it("returns 401 with same generic error when email does not exist", async () => {
    const responseWrongPw = await request(testApp)
      .post("/api/auth/login")
      .send({ email: VALID_EMAIL, password: "WrongPassword999" });

    await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const responseNoUser = await request(testApp)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: VALID_PASSWORD });

    expect(responseNoUser.status).toBe(401);
    expect(responseNoUser.body.error.message).toBe(responseWrongPw.body.error.message);
  });

  it("does not expose passwordHash or tokenHash in response", async () => {
    await request(testApp)
      .post("/api/auth/register")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const response = await request(testApp)
      .post("/api/auth/login")
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("passwordHash");
    expect(body).not.toContain("tokenHash");
  });
});
