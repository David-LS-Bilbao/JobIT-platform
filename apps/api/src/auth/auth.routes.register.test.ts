import express from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { authRouter } from "./auth.router.js";

const testApp = express();
testApp.use(express.json());
testApp.use("/api/auth", authRouter);

describe("POST /api/auth/register", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("returns 201, access token, sets refresh cookie, stores hashed password", async () => {
    const response = await request(testApp)
      .post("/api/auth/register")
      .send({ email: "user@example.com", password: "ValidPass123" });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe("user@example.com");
    expect(response.headers["set-cookie"]).toBeDefined();

    const user = await prisma.user.findUnique({ where: { email: "user@example.com" } });
    expect(user).not.toBeNull();
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe("ValidPass123");
  });

  it("returns conflict error without confirming email existence on duplicate", async () => {
    await request(testApp)
      .post("/api/auth/register")
      .send({ email: "user@example.com", password: "ValidPass123" });

    const response = await request(testApp)
      .post("/api/auth/register")
      .send({ email: "user@example.com", password: "AnotherPass456" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    expect(response.body.error.message).not.toMatch(/email/i);
    expect(response.body.error.message).not.toMatch(/exist/i);
  });

  it("returns 400 on weak password", async () => {
    const response = await request(testApp)
      .post("/api/auth/register")
      .send({ email: "user@example.com", password: "weak" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("normalizes email to lowercase before storing", async () => {
    const response = await request(testApp)
      .post("/api/auth/register")
      .send({ email: "User@EXAMPLE.COM", password: "ValidPass123" });

    expect(response.status).toBe(201);

    const user = await prisma.user.findUnique({ where: { email: "user@example.com" } });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("user@example.com");
  });
});
