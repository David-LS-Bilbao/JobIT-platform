import { describe, expect, it, vi } from "vitest";

import {
  buildServerErrorLogRecord,
  logServerError,
  sanitizeRoutePath
} from "./server-error-log.js";

/**
 * Observabilidad segura de errores de servidor (`AUDIT05-OPS-PROD-ERROR-LOG-01`).
 */

describe("sanitizeRoutePath", () => {
  it("conserva los segmentos estaticos de la superficie HTTP", () => {
    expect(sanitizeRoutePath("/api/auth/login")).toBe("/api/auth/login");
    expect(sanitizeRoutePath("/api/profile/me/portfolio/publish")).toBe(
      "/api/profile/me/portfolio/publish"
    );
  });

  // El slug lo elige la persona usuaria y suele derivar de su nombre: es el
  // caso mas claro de dato personal que no puede acabar en un log.
  it("enmascara el slug de un portfolio publico", () => {
    expect(sanitizeRoutePath("/api/public/portfolios/ana-perez")).toBe(
      "/api/public/portfolios/:param"
    );
  });

  it("enmascara identificadores", () => {
    expect(sanitizeRoutePath("/api/jobs/9f1c0f8e-1b3d-4a7c-9c2e-1f0d5b6a7c8d/match")).toBe(
      "/api/jobs/:param/match"
    );
    expect(sanitizeRoutePath("/uploads/avatars/user_abc.png")).toBe("/uploads/avatars/:param");
  });

  it("descarta la query string entera", () => {
    expect(sanitizeRoutePath("/api/jobs?search=ana%40example.com&page=2")).toBe("/api/jobs");
  });

  it("enmascara por defecto cualquier segmento no reconocido", () => {
    expect(sanitizeRoutePath("/api/unknown/thing")).toBe("/api/:param/:param");
    expect(sanitizeRoutePath("/")).toBe("/");
    expect(sanitizeRoutePath("")).toBe("/");
  });
});

describe("buildServerErrorLogRecord", () => {
  it("emite exactamente los campos permitidos", () => {
    const record = buildServerErrorLogRecord(
      {
        requestId: "req-1",
        method: "POST",
        path: "/api/auth/login",
        status: 500,
        code: "INTERNAL_ERROR",
        errorName: "PrismaClientKnownRequestError"
      },
      new Date("2026-09-04T10:00:00.000Z")
    );

    expect(Object.keys(record).sort()).toEqual(
      ["code", "errorName", "level", "method", "path", "requestId", "status", "timestamp"].sort()
    );
    expect(record.timestamp).toBe("2026-09-04T10:00:00.000Z");
    expect(record.level).toBe("error");
  });

  it("sanea la ruta al construir el registro", () => {
    const record = buildServerErrorLogRecord({
      requestId: "req-2",
      method: "GET",
      path: "/api/public/portfolios/ana-perez?x=1",
      status: 500,
      code: "INTERNAL_ERROR"
    });
    expect(record.path).toBe("/api/public/portfolios/:param");
  });

  it("usa un nombre de error por defecto cuando no se aporta", () => {
    const record = buildServerErrorLogRecord({
      requestId: "req-3",
      method: "GET",
      path: "/api/jobs",
      status: 500,
      code: "INTERNAL_ERROR"
    });
    expect(record.errorName).toBe("UnknownError");
  });
});

describe("logServerError", () => {
  // Invariante central del finding: la traza existe, pero nunca puede filtrar
  // credenciales, cabeceras, cuerpos ni parametros de consulta.
  it("nunca emite campos sensibles", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logServerError({
      requestId: "req-4",
      method: "POST",
      // Todo lo sensible que podria colarse por la ruta: credenciales en query,
      // email y slug personal.
      path: "/api/auth/login?password=SuperSecret123&token=abc.def.ghi&email=ana@example.com",
      status: 500,
      code: "INTERNAL_ERROR",
      errorName: "PrismaClientKnownRequestError"
    });

    expect(spy).toHaveBeenCalledOnce();
    const emitted = String(spy.mock.calls[0]?.[0]);

    for (const forbidden of [
      "password",
      "SuperSecret123",
      "token=",
      "abc.def.ghi",
      "ana@example.com",
      "Authorization",
      "Cookie",
      "tokenHash",
      "familyId",
      "DATABASE_URL"
    ]) {
      expect(emitted).not.toContain(forbidden);
    }

    // Y lo que SI debe estar, para que la traza sirva de algo.
    const parsed = JSON.parse(emitted) as Record<string, unknown>;
    expect(parsed["requestId"]).toBe("req-4");
    expect(parsed["path"]).toBe("/api/auth/login");
    expect(parsed["code"]).toBe("INTERNAL_ERROR");
    expect(parsed["status"]).toBe(500);

    spy.mockRestore();
  });

  it("emite una unica linea JSON parseable", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logServerError({
      requestId: "req-5",
      method: "GET",
      path: "/api/dashboard/me",
      status: 500,
      code: "INTERNAL_ERROR"
    });
    const emitted = String(spy.mock.calls[0]?.[0]);
    expect(emitted).not.toContain("\n");
    expect(() => JSON.parse(emitted)).not.toThrow();
    spy.mockRestore();
  });
});
