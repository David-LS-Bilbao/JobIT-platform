import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integración del rate limiting sobre la aplicación real (B3-ABUSE-01).
 *
 * La app se importa dinámicamente DESPUÉS de fijar las variables de entorno,
 * porque la configuración se resuelve al cargar el módulo. `vi.resetModules()`
 * garantiza que cada bloque obtiene una instancia limpia, con stores vacíos.
 *
 * Se usan límites diminutos vía entorno: así se demuestra el montaje real sin
 * tener que agotar los defaults de test (que son deliberadamente altos) y sin
 * esperar a que expire ninguna ventana.
 */

type App = Awaited<ReturnType<typeof loadApp>>;

const ENV_KEYS = [
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX",
  "AUTH_LOGIN_WINDOW_MS",
  "AUTH_LOGIN_MAX",
  "AUTH_REGISTER_WINDOW_MS",
  "AUTH_REGISTER_MAX",
  "PUBLIC_READ_WINDOW_MS",
  "PUBLIC_READ_MAX",
  "TRUST_PROXY_HOPS"
] as const;

const snapshot: Record<string, string | undefined> = {};

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const original = snapshot[key];
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
}

/** Carga una instancia fresca de la app con las variables ya fijadas. */
async function loadApp() {
  vi.resetModules();
  const module = await import("../app.js");
  return module.app;
}

const RATE_LIMITED_BODY = {
  error: {
    code: "RATE_LIMITED",
    message: "Demasiadas solicitudes. Inténtalo de nuevo más tarde."
  }
};

beforeAll(() => {
  for (const key of ENV_KEYS) snapshot[key] = process.env[key];
  process.env["JWT_ACCESS_SECRET"] ??= "test-integration-secret";
});

afterAll(() => {
  restoreEnv();
});

describe("rate limiting — integración sobre la app real", () => {
  describe("GET /health está exento del limitador general", () => {
    let app: App;

    beforeEach(async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "2";
      process.env["RATE_LIMIT_WINDOW_MS"] = "60000";
      app = await loadApp();
    });

    it("responde 200 muchas veces por encima del límite general", async () => {
      for (let i = 0; i < 8; i += 1) {
        const response = await request(app).get("/health");
        expect(response.status).toBe(200);
      }
    });

    it("nunca devuelve 429", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 8; i += 1) {
        statuses.push((await request(app).get("/health")).status);
      }

      expect(statuses).not.toContain(429);
    });

    it("no emite cabeceras de rate limiting", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["ratelimit"]).toBeUndefined();
      expect(response.headers["x-ratelimit-limit"]).toBeUndefined();
    });

    it("conserva su contrato de respuesta", async () => {
      const response = await request(app).get("/health");

      expect(response.body).toEqual({ status: "ok", service: "jobit-api" });
    });
  });

  describe("limitador general sobre /api", () => {
    let app: App;

    beforeEach(async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "3";
      process.env["RATE_LIMIT_WINDOW_MS"] = "60000";
      app = await loadApp();
    });

    it("corta con 429 al superar el límite en una ruta privada de lectura", async () => {
      // Sin token: la ruta responde 401, pero el limitador actúa antes de llegar al router.
      const statuses: number[] = [];
      for (let i = 0; i < 5; i += 1) {
        statuses.push((await request(app).get("/api/jobs")).status);
      }

      expect(statuses.at(-1)).toBe(429);
    });

    it("corta con 429 al superar el límite en una mutación privada", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i += 1) {
        statuses.push((await request(app).post("/api/saved-jobs/some-id").send({})).status);
      }

      expect(statuses.at(-1)).toBe(429);
    });

    it("devuelve el cuerpo exacto del contrato 429", async () => {
      let blocked;
      for (let i = 0; i < 5; i += 1) {
        blocked = await request(app).get("/api/jobs");
      }

      expect(blocked?.status).toBe(429);
      expect(blocked?.body).toEqual(RATE_LIMITED_BODY);
    });

    it("incluye RateLimit y Retry-After al bloquear", async () => {
      let blocked;
      for (let i = 0; i < 5; i += 1) {
        blocked = await request(app).get("/api/jobs");
      }

      expect(blocked?.headers["ratelimit"]).toBeDefined();
      expect(blocked?.headers["retry-after"]).toBeDefined();
    });

    it("no emite cabeceras legacy", async () => {
      const first = await request(app).get("/api/jobs");

      expect(first.headers["x-ratelimit-limit"]).toBeUndefined();
      expect(first.headers["x-ratelimit-remaining"]).toBeUndefined();
      expect(first.headers["x-ratelimit-reset"]).toBeUndefined();
    });

    it("cubre también /uploads", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i += 1) {
        statuses.push((await request(app).get("/uploads/no-existe.png")).status);
      }

      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe("limitador reforzado de registro", () => {
    let app: App;

    beforeEach(async () => {
      restoreEnv();
      // General holgado para demostrar que corta el reforzado, no el general.
      process.env["RATE_LIMIT_MAX"] = "1000";
      process.env["AUTH_REGISTER_MAX"] = "2";
      process.env["AUTH_REGISTER_WINDOW_MS"] = "60000";
      app = await loadApp();
    });

    it("corta POST /api/auth/register al superar su límite específico", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i += 1) {
        statuses.push(
          (await request(app).post("/api/auth/register").send({ email: "x", password: "y" })).status
        );
      }

      expect(statuses.at(-1)).toBe(429);
    });

    it("el 429 del registro respeta el contrato", async () => {
      let blocked;
      for (let i = 0; i < 4; i += 1) {
        blocked = await request(app).post("/api/auth/register").send({ email: "x", password: "y" });
      }

      expect(blocked?.body).toEqual(RATE_LIMITED_BODY);
    });

    it("no afecta a otras rutas bajo /api", async () => {
      for (let i = 0; i < 4; i += 1) {
        await request(app).post("/api/auth/register").send({ email: "x", password: "y" });
      }

      const other = await request(app).get("/api/jobs");
      expect(other.status).not.toBe(429);
    });
  });

  describe("limitador reforzado de login", () => {
    let app: App;

    beforeEach(async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "1000";
      process.env["AUTH_LOGIN_MAX"] = "2";
      process.env["AUTH_LOGIN_WINDOW_MS"] = "60000";
      app = await loadApp();
    });

    it("corta POST /api/auth/login tras superar los intentos fallidos", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i += 1) {
        statuses.push(
          (
            await request(app)
              .post("/api/auth/login")
              .send({ email: "nadie@example.com", password: "MalaPass123" })
          ).status
        );
      }

      expect(statuses.at(-1)).toBe(429);
    });

    it("el 429 del login respeta el contrato y no revela si el email existe", async () => {
      let blocked;
      for (let i = 0; i < 4; i += 1) {
        blocked = await request(app)
          .post("/api/auth/login")
          .send({ email: "nadie@example.com", password: "MalaPass123" });
      }

      expect(blocked?.body).toEqual(RATE_LIMITED_BODY);
      expect(JSON.stringify(blocked?.body)).not.toContain("nadie@example.com");
    });
  });

  describe("limitador de portfolio público", () => {
    let app: App;

    beforeEach(async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "1000";
      process.env["PUBLIC_READ_MAX"] = "2";
      process.env["PUBLIC_READ_WINDOW_MS"] = "60000";
      app = await loadApp();
    });

    it("corta GET /api/public/portfolios/:slug al superar su límite", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i += 1) {
        statuses.push((await request(app).get("/api/public/portfolios/inexistente")).status);
      }

      expect(statuses.at(-1)).toBe(429);
    });

    it("mantiene el 404 uniforme mientras queda cupo", async () => {
      const first = await request(app).get("/api/public/portfolios/inexistente");

      expect(first.status).toBe(404);
      expect(first.body).toEqual({
        error: { code: "NOT_FOUND", message: "Portfolio no encontrado." }
      });
    });
  });

  describe("proxy e identificación de cliente", () => {
    it("con TRUST_PROXY_HOPS=0 la cabecera falsificada no permite bypass", async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "2";
      process.env["RATE_LIMIT_WINDOW_MS"] = "60000";
      process.env["TRUST_PROXY_HOPS"] = "0";
      const app = await loadApp();

      await request(app).get("/api/jobs").set("X-Forwarded-For", "203.0.113.10");
      await request(app).get("/api/jobs").set("X-Forwarded-For", "203.0.113.11");
      const spoofed = await request(app).get("/api/jobs").set("X-Forwarded-For", "203.0.113.12");

      expect(spoofed.status).toBe(429);
    });

    it("con un salto de proxy confiable, dos clientes no comparten cupo", async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "1";
      process.env["RATE_LIMIT_WINDOW_MS"] = "60000";
      process.env["TRUST_PROXY_HOPS"] = "1";
      const app = await loadApp();

      await request(app).get("/api/jobs").set("X-Forwarded-For", "203.0.113.10");
      const blocked = await request(app).get("/api/jobs").set("X-Forwarded-For", "203.0.113.10");
      const otherClient = await request(app).get("/api/jobs").set("X-Forwarded-For", "203.0.113.11");

      expect(blocked.status).toBe(429);
      expect(otherClient.status).not.toBe(429);
    });

    it("dos clientes IPv4 mapeados en IPv6 distintos no colapsan", async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "1";
      process.env["RATE_LIMIT_WINDOW_MS"] = "60000";
      process.env["TRUST_PROXY_HOPS"] = "1";
      const app = await loadApp();

      await request(app).get("/api/jobs").set("X-Forwarded-For", "::ffff:203.0.113.10");
      const blocked = await request(app).get("/api/jobs").set("X-Forwarded-For", "::ffff:203.0.113.10");
      const otherClient = await request(app)
        .get("/api/jobs")
        .set("X-Forwarded-For", "::ffff:203.0.113.11");

      expect(blocked.status).toBe(429);
      expect(otherClient.status).not.toBe(429);
    });
  });

  describe("no contaminación y contratos preservados", () => {
    it("una instancia nueva de la app arranca con los stores vacíos", async () => {
      restoreEnv();
      process.env["RATE_LIMIT_MAX"] = "1";
      process.env["RATE_LIMIT_WINDOW_MS"] = "60000";

      const first = await loadApp();
      await request(first).get("/api/jobs");
      expect((await request(first).get("/api/jobs")).status).toBe(429);

      const second = await loadApp();
      expect((await request(second).get("/api/jobs")).status).not.toBe(429);
    });

    it("con cupo disponible, los routers existentes conservan su contrato", async () => {
      restoreEnv();
      const app = await loadApp();

      // Ruta privada sin token: sigue respondiendo 401, no 429.
      const unauthorized = await request(app).get("/api/jobs");
      expect(unauthorized.status).toBe(401);

      // Ruta inexistente: sigue resolviendo el notFoundMiddleware.
      const notFound = await request(app).get("/api/ruta-que-no-existe");
      expect(notFound.status).toBe(404);
    });
  });
});
