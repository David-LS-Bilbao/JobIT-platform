import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

import { rateLimitConfig, type RateLimitPolicy } from "../config/rate-limit.config.js";

/**
 * Middleware de rate limiting (B3-ABUSE-01).
 *
 * Spec: `docs/specs/features/api-rate-limiting.md`.
 *
 * Un único punto para la política: la factoría fija explícitamente ventana,
 * límite, cabeceras y handler, sin depender de defaults implícitos de la
 * librería. La identificación del cliente usa el `keyGenerator` por defecto de
 * `express-rate-limit`, que aplica el helper oficial `ipKeyGenerator` sobre
 * `req.ip` (IPv4 completa; IPv6 enmascarada a /56; IPv4 mapeada tratada como
 * IPv4 — ver CVE-2026-30827 en la spec).
 *
 * La IP se usa de forma efímera y en memoria: no se persiste ni se registra.
 */

/** Cuerpo exacto de la respuesta 429. No expone contador, límite ni ventana. */
export const RATE_LIMITED_BODY = {
  error: {
    code: "RATE_LIMITED",
    message: "Demasiadas solicitudes. Inténtalo de nuevo más tarde."
  }
} as const;

export interface RateLimiterOptions extends RateLimitPolicy {
  /**
   * Cuando es `true`, las respuestas con estado < 400 no consumen cupo.
   * Se usa en login para no penalizar a usuarios legítimos tras un NAT
   * compartido, sin debilitar la protección frente a fuerza bruta (los
   * intentos fallidos sí cuentan). Por defecto, `false`.
   */
  readonly skipSuccessfulRequests?: boolean;
}

/**
 * Crea un limitador con store propio. Cada llamada produce una instancia
 * independiente: no comparten estado entre sí.
 */
export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    skipFailedRequests: false,
    // Cabecera `RateLimit` del borrador IETF vigente; las legacy X-RateLimit-*
    // quedan deshabilitadas (no estandarizadas, amplían el fingerprinting).
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // El handler responde y termina el ciclo: no delega en errorHandlerMiddleware,
    // que siempre devolvería 500.
    handler: (_req, res) => {
      res.status(429).json(RATE_LIMITED_BODY);
    }
  });
}

/** Limitador general: todas las peticiones bajo /api y /uploads. */
export const generalRateLimiter = createRateLimiter(rateLimitConfig.general);

/** Reforzado de login: solo cuentan los intentos fallidos. */
export const loginRateLimiter = createRateLimiter({
  ...rateLimitConfig.login,
  skipSuccessfulRequests: true
});

/** Reforzado de registro: cuentan todos los intentos, también los correctos. */
export const registerRateLimiter = createRateLimiter(rateLimitConfig.register);

/** Portfolio público: única superficie pública con datos personales. */
export const publicReadRateLimiter = createRateLimiter(rateLimitConfig.publicRead);
