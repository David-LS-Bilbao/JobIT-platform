import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { app } from "../app.js";
import { createReadyRouter } from "./ready.routes.js";

/**
 * Contrato liveness/readiness (Fase C — bloque 1).
 * Spec: `docs/specs/features/staging-technical-readiness.md` §12.
 *
 * Los caminos de readiness se prueban con una sonda INYECTADA: así el 503 es
 * determinista y no exige tumbar PostgreSQL. Los dos tests que van contra la
 * app real comprueban el montaje y que `/health` no ha cambiado.
 */

function appWithProbe(probe: () => Promise<unknown>) {
  const testApp = express();
  testApp.use(createReadyRouter(probe));
  return testApp;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /health — liveness (contrato existente, sin cambios)", () => {
  it("responde 200 con el cuerpo exacto de siempre", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "jobit-api" });
  });
});

describe("GET /ready — readiness DB-aware", () => {
  it("responde 200 {status:ready} cuando la sonda resuelve", async () => {
    const response = await request(appWithProbe(async () => [{ "?column?": 1 }])).get("/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ready" });
  });

  it("responde 503 {status:not_ready} cuando la sonda lanza", async () => {
    const response = await request(
      appWithProbe(async () => {
        throw new Error("connection refused");
      })
    ).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "not_ready" });
  });

  it("responde 503 tambien cuando la sonda rechaza con un valor no-Error", async () => {
    const response = await request(appWithProbe(async () => Promise.reject("boom"))).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "not_ready" });
  });

  it("no filtra NINGUN detalle del fallo subyacente", async () => {
    const leaky = new Error(
      "Invalid `prisma.$queryRaw()` invocation: can't reach postgresql://user:pass@db-host:5432/jobit_production"
    );
    const response = await request(
      appWithProbe(async () => {
        throw leaky;
      })
    ).get("/ready");

    const serialized = JSON.stringify(response.body) + JSON.stringify(response.headers);
    for (const forbidden of [
      "prisma",
      "Prisma",
      "postgresql",
      "db-host",
      "user:pass",
      "jobit_production",
      "queryRaw",
      "SELECT",
      "stack",
      "Error"
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(Object.keys(response.body)).toEqual(["status"]);
  });

  // Con la base caida el healthcheck sondea cada pocos segundos: si cada fallo
  // escribiera una linea, los logs quedarian inservibles justo durante el incidente.
  it("una sonda fallida no escribe ninguna linea de log", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const failing = appWithProbe(async () => {
      throw new Error("connection refused");
    });
    for (let i = 0; i < 5; i += 1) {
      await request(failing).get("/ready");
    }

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("esta montada en la app real y no la bloquean los limitadores", async () => {
    // 15 llamadas consecutivas: ninguna puede devolver 429. `/ready` queda exenta
    // por montaje, igual que `/health`, no por lista de exclusion.
    for (let i = 0; i < 15; i += 1) {
      const response = await request(app).get("/ready");
      expect(response.status).not.toBe(429);
      expect([200, 503]).toContain(response.status);
    }
  });
});
