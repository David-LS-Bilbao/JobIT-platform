import type { ErrorRequestHandler } from "express";

import { logServerError } from "../lib/server-error-log.js";
import { readRequestId } from "./request-id.middleware.js";

/**
 * Manejador final de errores.
 *
 * Dos propiedades que no pueden romperse:
 *
 * 1. La respuesta en produccion es GENERICA. El mensaje real del error puede
 *    arrastrar parametros de consulta de Prisma o rutas internas.
 * 2. El fallo SIEMPRE deja traza, tambien en produccion y staging
 *    (`AUDIT05-OPS-PROD-ERROR-LOG-01`). Antes solo se registraba fuera de
 *    produccion, de modo que un `500` real era indiagnosticable.
 *
 * Lo que se registra pasa por la allowlist de `server-error-log`: nunca el
 * mensaje del error, ni cabeceras, ni cuerpo, ni query string.
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  const message = err instanceof Error ? err.message : "Unexpected error.";
  const isProduction = process.env.NODE_ENV === "production";

  logServerError({
    requestId: readRequestId(req),
    method: req.method,
    path: req.originalUrl,
    status: 500,
    code: "INTERNAL_ERROR",
    errorName: err instanceof Error ? err.name : typeof err
  });

  // Fuera de produccion se conserva el volcado completo: es lo que hace
  // depurable el desarrollo local y no llega a ningun entorno desplegado.
  if (!isProduction) {
    console.error(err);
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Internal server error." : message
    }
  });
};
