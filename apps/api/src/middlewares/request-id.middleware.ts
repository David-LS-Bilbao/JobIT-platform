import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Identificador de correlacion por peticion (`AUDIT05-OPS-PROD-ERROR-LOG-01`).
 *
 * Permite unir una respuesta `500` generica —que no revela nada al cliente— con
 * la traza estructurada del servidor. Sin el, diagnosticar un fallo en staging
 * obligaria a filtrar detalle en la respuesta.
 *
 * El identificador se GENERA siempre en el servidor y nunca se hereda de una
 * cabecera entrante: aceptar un valor del cliente permitiria inyectar contenido
 * arbitrario en los logs o falsear la correlacion.
 *
 * Se devuelve en `X-Request-Id` para que quien reporte una incidencia pueda
 * citarlo. Es un UUID aleatorio: no contiene datos personales ni identifica a la
 * persona usuaria.
 */

export const REQUEST_ID_HEADER = "X-Request-Id";

export type RequestWithId = Request & { requestId: string };

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  (req as RequestWithId).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

/** Lee el identificador ya asignado; `unknown` si el middleware no llego a correr. */
export function readRequestId(req: Request): string {
  const value = (req as Partial<RequestWithId>).requestId;
  return typeof value === "string" && value.length > 0 ? value : "unknown";
}
