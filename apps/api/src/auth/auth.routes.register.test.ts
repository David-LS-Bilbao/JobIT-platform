import express from "express";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { authRouter } from "./auth.router.js";
import { registerSchema } from "./auth.schemas.js";

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

/**
 * Fase C — guarda de registro de staging sintetico.
 * Spec: `docs/specs/features/staging-technical-readiness.md` §10.
 */
describe("POST /api/auth/register — guarda de staging sintetico", () => {
  const SYNTHETIC_EMAIL = "candidate@synthetic.jobit.invalid";
  const PASSWORD = "ValidPass123";

  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
    delete process.env["JOBIT_DATA_MODE"];
  });

  afterEach(() => {
    delete process.env["JOBIT_DATA_MODE"];
  });

  // El registro sintetico depende de que el schema acepte el dominio reservado.
  // Si zod dejara de aceptarlo, todo el contrato de identidades caeria aqui.
  it("el schema Zod actual acepta el dominio reservado con subdireccionamiento", () => {
    const parsed = registerSchema.safeParse({
      email: "e2e+abc123@synthetic.jobit.invalid",
      password: PASSWORD
    });
    expect(parsed.success).toBe(true);
  });

  describe("sin modo sintetico (regresion)", () => {
    it("un dominio ordinario sigue registrandose con 201", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "user@example.com", password: PASSWORD });

      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
    });

    it("el dominio reservado tambien se registra con 201", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: SYNTHETIC_EMAIL, password: PASSWORD });

      expect(response.status).toBe(201);
    });
  });

  describe("con JOBIT_DATA_MODE=SYNTHETIC_STAGING", () => {
    beforeEach(() => {
      process.env["JOBIT_DATA_MODE"] = "SYNTHETIC_STAGING";
    });

    it("acepta el dominio reservado exacto", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: SYNTHETIC_EMAIL, password: PASSWORD });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(SYNTHETIC_EMAIL);
    });

    it("acepta subdireccionamiento con + en la parte local", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "e2e+abc123@synthetic.jobit.invalid", password: PASSWORD });

      expect(response.status).toBe(201);
    });

    it("rechaza un dominio ordinario con 400 SYNTHETIC_STAGING_EMAIL_REQUIRED", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "candidate@gmail.com", password: PASSWORD });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("SYNTHETIC_STAGING_EMAIL_REQUIRED");
    });

    it("rechaza el dominio del propio producto", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "candidate@jobit.com", password: PASSWORD });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("SYNTHETIC_STAGING_EMAIL_REQUIRED");
    });

    // Los dos casos que `endsWith` dejaria pasar.
    it("rechaza un subdominio del dominio reservado", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "candidate@sub.synthetic.jobit.invalid", password: PASSWORD });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("SYNTHETIC_STAGING_EMAIL_REQUIRED");
    });

    it("rechaza un sufijo enganoso que solo contiene el dominio reservado", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "candidate@synthetic.jobit.invalid.example.com", password: PASSWORD });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("SYNTHETIC_STAGING_EMAIL_REQUIRED");
    });

    it("no crea ningun usuario cuando rechaza", async () => {
      await request(testApp)
        .post("/api/auth/register")
        .send({ email: "candidate@gmail.com", password: PASSWORD });

      expect(await prisma.user.count()).toBe(0);
    });

    // La guarda no puede convertirse en un oraculo de existencia de cuentas.
    it("responde igual para un dominio rechazado exista o no la cuenta", async () => {
      const first = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "known@example.com", password: PASSWORD });
      expect(first.status).toBe(400);

      delete process.env["JOBIT_DATA_MODE"];
      await request(testApp)
        .post("/api/auth/register")
        .send({ email: "known@example.com", password: PASSWORD });
      process.env["JOBIT_DATA_MODE"] = "SYNTHETIC_STAGING";

      const second = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "known@example.com", password: PASSWORD });

      expect(second.status).toBe(400);
      expect(second.body).toEqual(first.body);
    });

    it("la validacion de contrasena debil sigue teniendo prioridad de schema", async () => {
      const response = await request(testApp)
        .post("/api/auth/register")
        .send({ email: "candidate@gmail.com", password: "weak" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
