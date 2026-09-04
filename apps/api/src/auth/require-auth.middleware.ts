import type { NextFunction, Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "./jwt.util.js";

export type AuthenticatedRequest = Request & { auth: { userId: string } };

/**
 * Fallo de autenticacion. Cuerpo IDENTICO para todas las causas —cabecera
 * ausente, token invalido o expirado, usuario inexistente—: no se revela cual
 * fue. En particular, tras un borrado de cuenta no se distingue de un token mal
 * formado.
 */
function sendUnauthorized(res: Response): void {
  res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
}

/**
 * Autenticacion de las superficies protegidas.
 *
 * Spec: `docs/specs/features/account-lifecycle.md` §"Invalidacion inmediata del
 * access JWT".
 *
 * La firma valida NO basta: se comprueba ademas que el `User` sigue existiendo.
 * Es el mecanismo de invalidacion inmediata tras el borrado permanente de una
 * cuenta. Un access token emitido antes del borrado sigue siendo
 * criptograficamente valido —no se revoca ni se lista en ninguna blacklist—,
 * pero deja de autorizar en la siguiente peticion protegida porque su `User` ya
 * no esta. No hay blacklist de JWT, ni Redis, ni `authVersion`, ni estado
 * persistente adicional.
 *
 * Coste: una consulta por clave primaria indexada con `select: { id: true }`.
 *
 * Un fallo de base de datos NO se convierte en 401: la promesa se rechaza y
 * Express 5 la encamina al manejador de errores, que responde 500. Confundir
 * indisponibilidad con falta de autorizacion cerraria sesiones validas durante
 * una incidencia de infraestructura.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendUnauthorized(res);
    return;
  }

  const token = authHeader.slice(7);

  let userId: string;
  try {
    ({ userId } = verifyAccessToken(token));
  } catch {
    sendUnauthorized(res);
    return;
  }

  // Fuera del try anterior a proposito: un error de Prisma aqui debe propagarse
  // como 500, no quedar capturado por el catch del token.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    sendUnauthorized(res);
    return;
  }

  (req as AuthenticatedRequest).auth = { userId };
  next();
}
