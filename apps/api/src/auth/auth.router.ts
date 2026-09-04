import { Router, type CookieOptions, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { prisma } from "../lib/prisma.js";
import { deleteAvatarImage } from "../profile/avatar.storage.js";
import { deleteAccountSchema, loginSchema, registerSchema, stepUpSchema } from "./auth.schemas.js";
import {
  AppError,
  deleteAccount,
  exportAccountData,
  login,
  logout,
  refreshSession,
  register
} from "./auth.service.js";
import { signAccessToken } from "./jwt.util.js";
import { requireAuth, type AuthenticatedRequest } from "./require-auth.middleware.js";

export const authRouter = Router();

const REFRESH_COOKIE = "refresh_token";
const REFRESH_TOKEN_MAX_AGE_SEC = 604800;

/**
 * Opciones base de la cookie de refresh. Unico origen: emision, rotacion y
 * limpieza comparten estos atributos para que no puedan divergir.
 */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production"
  };
}

/** Emision inicial (login/register): vida completa del refresh token. */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...refreshCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_SEC * 1000
  });
}

/**
 * Cookie rotada: caduca EXACTAMENTE con el token. Se usa `expires` con la
 * expiracion absoluta heredada, no `maxAge`, porque reutilizar la vida completa
 * en cada rotacion la convertiria en expiracion deslizante.
 */
function setRotatedRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, { ...refreshCookieOptions(), expires: expiresAt });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

/**
 * Clase A — fallo terminal de sesion. Cuerpo identico al de `requireAuth` para
 * TODAS las causas: no se revela cual fue.
 */
function sendTerminalSessionFailure(res: Response): void {
  clearRefreshCookie(res);
  sendError(res, 401, "UNAUTHORIZED", "Authentication required.");
}

/**
 * Clase B — fallo interno, de invariante o transaccional. NO es una sesion
 * invalida: tras el rollback el predecessor sigue siendo current. Por eso no se
 * limpia la cookie ni se revoca nada.
 *
 * Se responde aqui y no via `next(err)` para que el cuerpo sea identico en
 * desarrollo y en produccion y para que el objeto de error de Prisma —que puede
 * arrastrar parametros de consulta— no llegue a ningun log.
 */
function sendInternalFailure(res: Response): void {
  sendError(res, 500, "INTERNAL_ERROR", "Internal server error.");
}

authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = registerSchema.parse(req.body);
      const result = await register(body.email, body.password);
      setRefreshCookie(res, result.refreshToken);
      res.status(201).json({ accessToken: result.accessToken, user: result.user });
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
        });
        return;
      }
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.code, err.message);
        return;
      }
      next(err);
    }
  }
);

authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);
      const result = await login(body.email, body.password);
      setRefreshCookie(res, result.refreshToken);
      res.status(200).json({ accessToken: result.accessToken, user: result.user });
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
        });
        return;
      }
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.code, err.message);
        return;
      }
      next(err);
    }
  }
);

/**
 * Renovacion del access token.
 *
 * La UNICA credencial admitida es la cookie `refresh_token` (httpOnly). El
 * handler solo lee `req.cookies`: no accede a `req.body`, ni a `req.query`, ni a
 * `Authorization`, ni a ninguna cabecera propia del frontend. No monta
 * `requireAuth`: un access token expirado es el caso normal de uso.
 */
authRouter.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies[REFRESH_COOKIE] as string | undefined;
  const result = await refreshSession(refreshToken);

  switch (result.outcome) {
    case "ROTATED":
      setRotatedRefreshCookie(res, result.token, result.expiresAt);
      res.status(200).json({ accessToken: signAccessToken(result.user.id), user: result.user });
      return;

    case "LEGITIMATE_CONCURRENT_REFRESH":
      // El perdedor de una carrera legitima: access token nuevo, sin Set-Cookie,
      // sin rotacion y sin escrituras. La cookie del navegador ya contiene el
      // current emitido por el ganador.
      res.status(200).json({ accessToken: signAccessToken(result.user.id), user: result.user });
      return;

    case "REPLAY":
    case "FAIL":
      sendTerminalSessionFailure(res);
      return;

    case "INTERNAL_TRANSACTION_FAILURE":
      sendInternalFailure(res);
      return;
  }
});

authRouter.post("/logout", async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies[REFRESH_COOKIE] as string | undefined;
  const outcome = await logout(refreshToken);

  // Asimetria deliberada respecto al refresh: en logout la intencion explicita
  // del usuario es destruir la credencial en este terminal, y retirarla es
  // siempre la accion protectora, incluso si la revocacion en servidor fallo.
  clearRefreshCookie(res);

  if (outcome === "INTERNAL_TRANSACTION_FAILURE") {
    sendInternalFailure(res);
    return;
  }
  res.status(204).send();
});

authRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        sendError(res, 404, "NOT_FOUND", "User not found");
        return;
      }
      res.status(200).json({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Exportacion de los datos del titular (`ACCOUNT_LIFECYCLE_V1`).
 *
 * Spec: `docs/specs/features/account-lifecycle.md`.
 *
 * Es POST y no GET porque transporta la contraseña en el cuerpo: nunca en la
 * query string, nunca en la URL y por tanto nunca en un log de acceso ni en el
 * historial del navegador.
 */
authRouter.post(
  "/me/export",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const body = stepUpSchema.parse(req.body);
      const document = await exportAccountData(userId, body.password);
      res.status(200).json(document);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
        });
        return;
      }
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.code, err.message);
        return;
      }
      next(err);
    }
  }
);

/**
 * Borrado permanente e irreversible de la cuenta.
 *
 * Orden deliberado: primero se consolida el borrado en base de datos y solo
 * despues se limpia el fichero del avatar. El estado autoritativo es la fila; un
 * fallo de sistema de ficheros NO revierte una cuenta ya borrada ni convierte la
 * respuesta en un error, porque dejaria a la persona con la cuenta destruida y
 * un 500 en pantalla. El fichero huerfano es el residuo aceptado de ese orden.
 */
authRouter.delete(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const body = deleteAccountSchema.parse(req.body);
      const { avatarUrl } = await deleteAccount(userId, body.password);

      await deleteAvatarImage(avatarUrl).catch(() => undefined);

      clearRefreshCookie(res);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
        });
        return;
      }
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.code, err.message);
        return;
      }
      next(err);
    }
  }
);
