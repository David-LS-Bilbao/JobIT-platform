import express, { type Express, type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createRateLimiter, RATE_LIMITED_BODY } from "./rate-limit.middleware.js";

/**
 * Tests del middleware de rate limiting aislado (B3-ABUSE-01).
 *
 * Cada test construye su propia app Express mínima y su propio limitador, de
 * modo que el store nace vacío en cada caso: no hay estado compartido entre
 * tests ni dependencia del orden de ejecución.
 *
 * Ningún test espera a que expire una ventana real: se usan límites diminutos
 * y peticiones consecutivas.
 */

/** App mínima con un limitador y un endpoint 200 detrás. */
function buildApp(limiter: RequestHandler, options: { trustProxyHops?: number } = {}): Express {
  const app = express();
  app.set("trust proxy", options.trustProxyHops ?? 0);
  app.use(express.json());
  app.use(limiter);
  app.get("/probe", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.post("/probe", (req, res) => {
    // Permite simular respuestas correctas y fallidas para skipSuccessfulRequests.
    const shouldFail = (req.body as { fail?: boolean } | undefined)?.fail === true;
    res.status(shouldFail ? 401 : 200).json({ ok: !shouldFail });
  });
  return app;
}

const IPV4_A = "203.0.113.10";
const IPV4_B = "203.0.113.11";
// Dos direcciones dentro del MISMO /56 (difieren en el bloque 5, dentro de la máscara).
const IPV6_SAME_PREFIX_A = "2001:db8:1111:2200::1";
const IPV6_SAME_PREFIX_B = "2001:db8:1111:2211::9";
// Dirección en un /56 DISTINTO.
const IPV6_OTHER_PREFIX = "2001:db8:1111:9900::1";

describe("createRateLimiter", () => {
  describe("comportamiento básico del límite", () => {
    it("permite las peticiones por debajo del límite", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 3 }));

      for (let i = 0; i < 3; i += 1) {
        const response = await request(app).get("/probe");
        expect(response.status).toBe(200);
      }
    });

    it("devuelve 429 en la primera petición que supera el límite", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 2 }));

      await request(app).get("/probe");
      await request(app).get("/probe");
      const blocked = await request(app).get("/probe");

      expect(blocked.status).toBe(429);
    });

    it("mantiene el 429 en peticiones sucesivas dentro de la ventana", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(app).get("/probe");
      expect((await request(app).get("/probe")).status).toBe(429);
      expect((await request(app).get("/probe")).status).toBe(429);
    });
  });

  describe("contrato de la respuesta 429", () => {
    it("devuelve el cuerpo exacto acordado", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(app).get("/probe");
      const blocked = await request(app).get("/probe");

      expect(blocked.body).toEqual({
        error: {
          code: "RATE_LIMITED",
          message: "Demasiadas solicitudes. Inténtalo de nuevo más tarde."
        }
      });
    });

    it("expone el cuerpo como constante reutilizable", () => {
      expect(RATE_LIMITED_BODY).toEqual({
        error: {
          code: "RATE_LIMITED",
          message: "Demasiadas solicitudes. Inténtalo de nuevo más tarde."
        }
      });
    });

    it("incluye la cabecera RateLimit estándar", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(app).get("/probe");
      const blocked = await request(app).get("/probe");

      expect(blocked.headers["ratelimit"]).toBeDefined();
    });

    it("incluye la cabecera Retry-After", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(app).get("/probe");
      const blocked = await request(app).get("/probe");

      expect(blocked.headers["retry-after"]).toBeDefined();
    });

    it("no emite cabeceras legacy X-RateLimit-*", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      const allowed = await request(app).get("/probe");
      const blocked = await request(app).get("/probe");

      for (const response of [allowed, blocked]) {
        expect(response.headers["x-ratelimit-limit"]).toBeUndefined();
        expect(response.headers["x-ratelimit-remaining"]).toBeUndefined();
        expect(response.headers["x-ratelimit-reset"]).toBeUndefined();
      }
    });

    it("no expone detalles internos en el cuerpo", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(app).get("/probe");
      const blocked = await request(app).get("/probe");
      const serialized = JSON.stringify(blocked.body);

      expect(Object.keys(blocked.body)).toEqual(["error"]);
      expect(Object.keys(blocked.body.error).sort()).toEqual(["code", "message"]);
      expect(serialized).not.toContain("127.0.0.1");
      expect(serialized).not.toContain("windowMs");
      expect(serialized).not.toContain("store");
      expect(serialized).not.toMatch(/\bat \//);
    });

    it("el mensaje es neutro y no revela el límite ni la ventana", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(app).get("/probe");
      const blocked = await request(app).get("/probe");

      expect(blocked.body.error.message).not.toMatch(/\d/);
    });
  });

  describe("aislamiento entre clientes", () => {
    it("un cliente agotado no afecta a otro cliente con IP distinta", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      await request(app).get("/probe").set("X-Forwarded-For", IPV4_A);
      const blockedA = await request(app).get("/probe").set("X-Forwarded-For", IPV4_A);
      const allowedB = await request(app).get("/probe").set("X-Forwarded-For", IPV4_B);

      expect(blockedA.status).toBe(429);
      expect(allowedB.status).toBe(200);
    });

    it("cada limitador creado tiene un store independiente", async () => {
      const first = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));
      const second = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }));

      await request(first).get("/probe");
      expect((await request(first).get("/probe")).status).toBe(429);
      // El segundo limitador arranca limpio pese a compartir IP de origen.
      expect((await request(second).get("/probe")).status).toBe(200);
    });
  });

  describe("skipSuccessfulRequests", () => {
    it("cuenta todos los intentos cuando está desactivado (política de registro)", async () => {
      const app = buildApp(
        createRateLimiter({ windowMs: 60_000, limit: 2, skipSuccessfulRequests: false })
      );

      expect((await request(app).post("/probe").send({})).status).toBe(200);
      expect((await request(app).post("/probe").send({})).status).toBe(200);
      expect((await request(app).post("/probe").send({})).status).toBe(429);
    });

    it("cuenta los intentos fallidos cuando está desactivado", async () => {
      const app = buildApp(
        createRateLimiter({ windowMs: 60_000, limit: 2, skipSuccessfulRequests: false })
      );

      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(401);
      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(401);
      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(429);
    });

    it("cuenta los intentos fallidos cuando está activado (política de login)", async () => {
      const app = buildApp(
        createRateLimiter({ windowMs: 60_000, limit: 2, skipSuccessfulRequests: true })
      );

      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(401);
      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(401);
      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(429);
    });

    it("los intentos correctos no consumen el límite reforzado cuando está activado", async () => {
      const app = buildApp(
        createRateLimiter({ windowMs: 60_000, limit: 2, skipSuccessfulRequests: true })
      );

      for (let i = 0; i < 6; i += 1) {
        const response = await request(app).post("/probe").send({});
        expect(response.status).toBe(200);
      }
    });

    it("tras muchos éxitos, el cupo de fallos sigue intacto", async () => {
      const app = buildApp(
        createRateLimiter({ windowMs: 60_000, limit: 2, skipSuccessfulRequests: true })
      );

      for (let i = 0; i < 5; i += 1) {
        await request(app).post("/probe").send({});
      }

      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(401);
      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(401);
      expect((await request(app).post("/probe").send({ fail: true })).status).toBe(429);
    });
  });

  describe("identificación por IP", () => {
    it("IPv4: distingue direcciones completas", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      await request(app).get("/probe").set("X-Forwarded-For", IPV4_A);

      expect((await request(app).get("/probe").set("X-Forwarded-For", IPV4_A)).status).toBe(429);
      expect((await request(app).get("/probe").set("X-Forwarded-For", IPV4_B)).status).toBe(200);
    });

    it("IPv6: dos direcciones del mismo /56 comparten cupo", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      await request(app).get("/probe").set("X-Forwarded-For", IPV6_SAME_PREFIX_A);
      const blocked = await request(app).get("/probe").set("X-Forwarded-For", IPV6_SAME_PREFIX_B);

      expect(blocked.status).toBe(429);
    });

    it("IPv6: dos direcciones de /56 distintos no comparten cupo", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      await request(app).get("/probe").set("X-Forwarded-For", IPV6_SAME_PREFIX_A);
      const allowed = await request(app).get("/probe").set("X-Forwarded-For", IPV6_OTHER_PREFIX);

      expect(allowed.status).toBe(200);
    });

    it("IPv4 mapeada en IPv6: se trata como IPv4 y agota su propio cupo", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      await request(app).get("/probe").set("X-Forwarded-For", `::ffff:${IPV4_A}`);
      const blocked = await request(app).get("/probe").set("X-Forwarded-For", `::ffff:${IPV4_A}`);

      expect(blocked.status).toBe(429);
    });

    it("regresión CVE-2026-30827: dos IPv4 mapeadas distintas NO colapsan en la misma cubeta", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      // Con el bug, ambas caían en ::/56 y la segunda recibía 429.
      await request(app).get("/probe").set("X-Forwarded-For", `::ffff:${IPV4_A}`);
      const other = await request(app).get("/probe").set("X-Forwarded-For", `::ffff:${IPV4_B}`);

      expect(other.status).toBe(200);
    });
  });

  describe("proxy y X-Forwarded-For", () => {
    it("con un salto de proxy confiable, separa clientes por la cabecera", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 1 });

      await request(app).get("/probe").set("X-Forwarded-For", IPV4_A);

      expect((await request(app).get("/probe").set("X-Forwarded-For", IPV4_A)).status).toBe(429);
      expect((await request(app).get("/probe").set("X-Forwarded-For", IPV4_B)).status).toBe(200);
    });

    it("sin proxy confiable (hops=0), X-Forwarded-For se ignora y no permite bypass", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 0 });

      // Todas las peticiones llegan del mismo socket real; variar la cabecera
      // NO debe crear claves distintas.
      await request(app).get("/probe").set("X-Forwarded-For", IPV4_A);
      const spoofed = await request(app).get("/probe").set("X-Forwarded-For", IPV4_B);

      expect(spoofed.status).toBe(429);
    });

    it("sin proxy confiable, una cadena larga de X-Forwarded-For tampoco permite bypass", async () => {
      const app = buildApp(createRateLimiter({ windowMs: 60_000, limit: 1 }), { trustProxyHops: 0 });

      await request(app).get("/probe");
      const spoofed = await request(app)
        .get("/probe")
        .set("X-Forwarded-For", `${IPV4_A}, ${IPV4_B}, 198.51.100.7`);

      expect(spoofed.status).toBe(429);
    });
  });
});
