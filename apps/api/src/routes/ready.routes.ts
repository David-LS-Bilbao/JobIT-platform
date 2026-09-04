import { Router } from "express";

import { prisma } from "../lib/prisma.js";

/**
 * Readiness DB-aware (Fase C — bloque 1).
 *
 * `GET /health` es LIVENESS y no cambia: responde 200 mientras el proceso Node
 * atienda peticiones, aunque PostgreSQL esté caído. `GET /ready` responde a otra
 * pregunta: si la aplicación puede *servir*. Sin esta separación, el
 * `healthcheck` del contenedor marca `healthy` una API que devuelve 500 en toda
 * superficie que toque la base.
 *
 * Decisiones deliberadas (spec `staging-technical-readiness.md` §12):
 *
 * - La sonda es `SELECT 1`. Nada más. No comprueba migraciones: el estado de
 *   migraciones es un gate de despliegue (`prisma migrate status`), y meterlo
 *   aquí impediría el orden de arranque de ADR-0012, donde la API arranca antes
 *   de que las migraciones se apliquen de forma explícita y supervisada.
 * - Sin caché, sin memoización, sin sondeo en segundo plano, sin máquina de
 *   estados y sin dependencia nueva: la sonda es trivial y el `healthcheck` la
 *   invoca cada diez segundos.
 * - NO emite ninguna línea de log, ni en éxito ni en fallo. Registrar cada sonda
 *   fallida inundaría los logs mientras la base está caída, y registrar solo las
 *   transiciones exigiría estado a nivel de módulo. La diagnosticabilidad se
 *   conserva por otra vía: Docker guarda el historial de healthchecks y los 500
 *   de peticiones reales siguen registrándose por `logServerError`.
 * - El cuerpo es estático en ambos casos: nunca expone el error de Prisma, el
 *   error SQL, el hostname, `DATABASE_URL`, el schema ni la traza.
 */

/** Sonda de disponibilidad. Se inyecta en los tests para no depender de una base. */
export type ReadinessProbe = () => Promise<unknown>;

export const defaultReadinessProbe: ReadinessProbe = () => prisma.$queryRaw`SELECT 1`;

export function createReadyRouter(probe: ReadinessProbe = defaultReadinessProbe): Router {
  const router = Router();

  router.get("/ready", async (_req, res) => {
    try {
      await probe();
      res.status(200).json({ status: "ready" });
    } catch {
      // El error se descarta a propósito: ver la nota sobre logging arriba.
      res.status(503).json({ status: "not_ready" });
    }
  });

  return router;
}

export const readyRouter = createReadyRouter();
