import express, { type Request, type Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { app } from "../app.js";
import { errorHandlerMiddleware } from "./error-handler.middleware.js";
import { REQUEST_ID_HEADER, requestIdMiddleware } from "./request-id.middleware.js";

/**
 * Observabilidad de errores extremo a extremo (`AUDIT05-OPS-PROD-ERROR-LOG-01`).
 *
 * Lo que se comprueba: que un `500` deja traza estructurada TAMBIEN en
 * produccion, que la respuesta al cliente sigue siendo generica, y que la traza
 * puede correlacionarse con la respuesta mediante el identificador de peticion.
 */

/** App minima con una ruta que revienta a proposito. */
function buildFailingApp(): express.Express {
  const testApp = express();
  testApp.use(requestIdMiddleware);
  testApp.get("/api/public/portfolios/:slug", (_req: Request, _res: Response) => {
    throw new Error("connection to jobit_prod at 10.0.0.5 failed for user jobit_admin");
  });
  testApp.use(errorHandlerMiddleware);
  return testApp;
}

function withNodeEnv(value: string, fn: () => Promise<void>): Promise<void> {
  const previous = process.env["NODE_ENV"];
  process.env["NODE_ENV"] = value;
  return fn().finally(() => {
    process.env["NODE_ENV"] = previous;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("request id", () => {
  it("devuelve un identificador de correlacion en toda respuesta", async () => {
    const res = await request(app).get("/health");
    expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("emite un identificador distinto por peticion", async () => {
    const first = await request(app).get("/health");
    const second = await request(app).get("/health");
    expect(first.headers[REQUEST_ID_HEADER.toLowerCase()]).not.toBe(
      second.headers[REQUEST_ID_HEADER.toLowerCase()]
    );
  });

  // Aceptar el identificador del cliente permitiria inyectar contenido en los
  // logs o falsear la correlacion: siempre se genera en el servidor.
  it("ignora un X-Request-Id entrante", async () => {
    const res = await request(app).get("/health").set(REQUEST_ID_HEADER, "forjado-por-el-cliente");
    expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).not.toBe("forjado-por-el-cliente");
  });
});

describe("error handler en produccion", () => {
  it("responde generico y deja traza segura correlacionable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await withNodeEnv("production", async () => {
      const res = await request(buildFailingApp()).get("/api/public/portfolios/ana-perez");

      expect(res.status).toBe(500);
      // El cliente no recibe NADA del error real.
      expect(res.body).toEqual({
        error: { code: "INTERNAL_ERROR", message: "Internal server error." }
      });
      expect(JSON.stringify(res.body)).not.toContain("jobit_prod");

      // Pero el servidor SI deja traza: era exactamente lo que faltaba.
      expect(spy).toHaveBeenCalled();
      const emitted = String(spy.mock.calls[0]?.[0]);
      const record = JSON.parse(emitted) as Record<string, unknown>;

      expect(record["level"]).toBe("error");
      expect(record["status"]).toBe(500);
      expect(record["code"]).toBe("INTERNAL_ERROR");
      expect(record["method"]).toBe("GET");
      // Slug personal enmascarado.
      expect(record["path"]).toBe("/api/public/portfolios/:param");
      // Correlacionable con la respuesta.
      expect(record["requestId"]).toBe(res.headers[REQUEST_ID_HEADER.toLowerCase()]);

      // El mensaje del error nunca se registra: arrastraria host, base y usuario.
      expect(emitted).not.toContain("jobit_prod");
      expect(emitted).not.toContain("10.0.0.5");
      expect(emitted).not.toContain("jobit_admin");
      expect(emitted).not.toContain("ana-perez");
    });

    spy.mockRestore();
  });

  it("fuera de produccion conserva el volcado completo para depurar", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await withNodeEnv("development", async () => {
      const res = await request(buildFailingApp()).get("/api/public/portfolios/ana-perez");
      expect(res.status).toBe(500);
      // En desarrollo el mensaje real si llega al cliente (comportamiento previo).
      expect(String(res.body.error.message)).toContain("jobit_prod");
      // Se emiten dos llamadas: la traza estructurada y el volcado de desarrollo.
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    spy.mockRestore();
  });
});
