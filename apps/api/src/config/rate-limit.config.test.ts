import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveRateLimitConfig } from "./rate-limit.config.js";

/**
 * Tests de la configuración de rate limiting (B3-ABUSE-01).
 *
 * `resolveRateLimitConfig` es una función pura: recibe un `EnvLike` por
 * parámetro y no lee `process.env` directamente. Eso permite probar cada caso
 * sin mutar el entorno del proceso. El último bloque verifica explícitamente
 * que `process.env` no queda alterado.
 */

const PROD_ENV = { NODE_ENV: "production" } as const;
const TEST_ENV = { NODE_ENV: "test" } as const;

describe("resolveRateLimitConfig", () => {
  describe("defaults productivos", () => {
    it("resuelve los valores productivos cuando no hay variables definidas", () => {
      const config = resolveRateLimitConfig(PROD_ENV);

      expect(config.general).toEqual({ windowMs: 900_000, limit: 300 });
      expect(config.login).toEqual({ windowMs: 900_000, limit: 10 });
      expect(config.register).toEqual({ windowMs: 3_600_000, limit: 5 });
      expect(config.publicRead).toEqual({ windowMs: 900_000, limit: 60 });
      expect(config.trustProxyHops).toBe(0);
    });

    it("usa los defaults productivos también cuando NODE_ENV no está definido", () => {
      const config = resolveRateLimitConfig({});

      expect(config.general.limit).toBe(300);
      expect(config.login.limit).toBe(10);
      expect(config.register.limit).toBe(5);
      expect(config.publicRead.limit).toBe(60);
    });
  });

  describe("defaults con NODE_ENV=test", () => {
    it("eleva los umbrales para no interferir con la suite de integración", () => {
      const config = resolveRateLimitConfig(TEST_ENV);

      expect(config.general).toEqual({ windowMs: 900_000, limit: 1000 });
      expect(config.login).toEqual({ windowMs: 900_000, limit: 100 });
      expect(config.register).toEqual({ windowMs: 3_600_000, limit: 100 });
      expect(config.publicRead).toEqual({ windowMs: 900_000, limit: 1000 });
    });

    it("mantiene trustProxyHops en 0 por defecto en test", () => {
      expect(resolveRateLimitConfig(TEST_ENV).trustProxyHops).toBe(0);
    });

    it("no desactiva el rate limiting en test: los límites siguen siendo finitos", () => {
      const config = resolveRateLimitConfig(TEST_ENV);

      expect(Number.isFinite(config.general.limit)).toBe(true);
      expect(config.general.limit).toBeGreaterThan(0);
    });
  });

  describe("precedencia de variables explícitas", () => {
    it("una variable explícita prevalece sobre el default de test", () => {
      const config = resolveRateLimitConfig({ ...TEST_ENV, RATE_LIMIT_MAX: "7" });

      expect(config.general.limit).toBe(7);
    });

    it("una variable explícita prevalece sobre el default productivo", () => {
      const config = resolveRateLimitConfig({ ...PROD_ENV, AUTH_LOGIN_MAX: "3" });

      expect(config.login.limit).toBe(3);
    });

    it("resuelve todas las variables explícitas de forma independiente", () => {
      const config = resolveRateLimitConfig({
        ...PROD_ENV,
        RATE_LIMIT_WINDOW_MS: "1000",
        RATE_LIMIT_MAX: "1",
        AUTH_LOGIN_WINDOW_MS: "2000",
        AUTH_LOGIN_MAX: "2",
        AUTH_REGISTER_WINDOW_MS: "3000",
        AUTH_REGISTER_MAX: "3",
        PUBLIC_READ_WINDOW_MS: "4000",
        PUBLIC_READ_MAX: "4",
        TRUST_PROXY_HOPS: "1"
      });

      expect(config.general).toEqual({ windowMs: 1000, limit: 1 });
      expect(config.login).toEqual({ windowMs: 2000, limit: 2 });
      expect(config.register).toEqual({ windowMs: 3000, limit: 3 });
      expect(config.publicRead).toEqual({ windowMs: 4000, limit: 4 });
      expect(config.trustProxyHops).toBe(1);
    });
  });

  describe("límites de rango admitidos", () => {
    it("acepta el valor mínimo válido de ventana", () => {
      expect(resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_WINDOW_MS: "1000" }).general.windowMs).toBe(1000);
    });

    it("acepta el valor máximo válido de ventana general", () => {
      expect(resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_WINDOW_MS: "3600000" }).general.windowMs).toBe(3_600_000);
    });

    it("acepta la ventana máxima ampliada de registro", () => {
      expect(
        resolveRateLimitConfig({ ...PROD_ENV, AUTH_REGISTER_WINDOW_MS: "86400000" }).register.windowMs
      ).toBe(86_400_000);
    });

    it("acepta el máximo mínimo válido", () => {
      expect(resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "1" }).general.limit).toBe(1);
    });
  });

  describe("valores fuera de rango", () => {
    it("rechaza una ventana por debajo del mínimo", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_WINDOW_MS: "999" })).toThrow(
        /RATE_LIMIT_WINDOW_MS/
      );
    });

    it("rechaza una ventana por encima del máximo", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_WINDOW_MS: "3600001" })).toThrow(
        /RATE_LIMIT_WINDOW_MS/
      );
    });

    it("rechaza una ventana de registro por encima de su máximo ampliado", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, AUTH_REGISTER_WINDOW_MS: "86400001" })).toThrow(
        /AUTH_REGISTER_WINDOW_MS/
      );
    });

    it("rechaza un máximo igual a cero", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "0" })).toThrow(/RATE_LIMIT_MAX/);
    });

    it("rechaza un máximo negativo", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, AUTH_LOGIN_MAX: "-1" })).toThrow(/AUTH_LOGIN_MAX/);
    });

    it("rechaza una ventana negativa", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, PUBLIC_READ_WINDOW_MS: "-1000" })).toThrow(
        /PUBLIC_READ_WINDOW_MS/
      );
    });
  });

  describe("valores mal formados", () => {
    it("rechaza decimales", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "10.5" })).toThrow(/RATE_LIMIT_MAX/);
    });

    it("rechaza una cadena vacía", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "" })).toThrow(/RATE_LIMIT_MAX/);
    });

    it("rechaza una cadena de solo espacios", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "   " })).toThrow(/RATE_LIMIT_MAX/);
    });

    it("rechaza un valor parcialmente numérico", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "10abc" })).toThrow(/RATE_LIMIT_MAX/);
    });

    it("rechaza un valor no numérico", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, AUTH_REGISTER_MAX: "muchos" })).toThrow(
        /AUTH_REGISTER_MAX/
      );
    });

    it("rechaza notación científica", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "1e3" })).toThrow(/RATE_LIMIT_MAX/);
    });
  });

  describe("TRUST_PROXY_HOPS", () => {
    it("acepta 0", () => {
      expect(resolveRateLimitConfig({ ...PROD_ENV, TRUST_PROXY_HOPS: "0" }).trustProxyHops).toBe(0);
    });

    it("acepta 1 (Nginx Proxy Manager, un único salto)", () => {
      expect(resolveRateLimitConfig({ ...PROD_ENV, TRUST_PROXY_HOPS: "1" }).trustProxyHops).toBe(1);
    });

    it("acepta 10 (máximo admitido)", () => {
      expect(resolveRateLimitConfig({ ...PROD_ENV, TRUST_PROXY_HOPS: "10" }).trustProxyHops).toBe(10);
    });

    it("rechaza 11 por estar fuera de rango", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, TRUST_PROXY_HOPS: "11" })).toThrow(/TRUST_PROXY_HOPS/);
    });

    it("rechaza un valor negativo", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, TRUST_PROXY_HOPS: "-1" })).toThrow(/TRUST_PROXY_HOPS/);
    });

    it("rechaza el booleano true, que sería una configuración insegura", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, TRUST_PROXY_HOPS: "true" })).toThrow(
        /TRUST_PROXY_HOPS/
      );
    });
  });

  describe("fail-fast y mensajes", () => {
    it("falla en la primera variable inválida encontrada", () => {
      expect(() => resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "nope" })).toThrow(Error);
    });

    it("el mensaje de error nombra la variable e indica el valor esperado", () => {
      let message = "";
      try {
        resolveRateLimitConfig({ ...PROD_ENV, AUTH_LOGIN_MAX: "nope" });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain("AUTH_LOGIN_MAX");
      expect(message.length).toBeGreaterThan(0);
    });

    it("el mensaje de error no incluye el valor de variables sensibles del entorno", () => {
      let message = "";
      try {
        resolveRateLimitConfig({
          ...PROD_ENV,
          JWT_ACCESS_SECRET: "no-debe-aparecer",
          DATABASE_URL: "postgresql://user:pass@host:5432/db",
          RATE_LIMIT_MAX: "nope"
        });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).not.toContain("no-debe-aparecer");
      expect(message).not.toContain("pass");
    });
  });

  describe("ausencia de efectos secundarios sobre process.env", () => {
    const snapshot = { ...process.env };

    beforeEach(() => {
      delete process.env["RATE_LIMIT_MAX"];
    });

    afterEach(() => {
      for (const key of Object.keys(process.env)) {
        if (!(key in snapshot)) delete process.env[key];
      }
      Object.assign(process.env, snapshot);
    });

    it("no escribe en process.env al resolver la configuración", () => {
      resolveRateLimitConfig({ ...PROD_ENV, RATE_LIMIT_MAX: "42" });

      expect(process.env["RATE_LIMIT_MAX"]).toBeUndefined();
    });

    it("no muta el objeto de entorno recibido", () => {
      const env = { ...PROD_ENV, RATE_LIMIT_MAX: "42" };
      const before = { ...env };

      resolveRateLimitConfig(env);

      expect(env).toEqual(before);
    });
  });
});
