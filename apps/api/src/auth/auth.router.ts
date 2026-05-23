import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import { AppError, login, logout, register } from "./auth.service.js";
import { requireAuth, type AuthenticatedRequest } from "./require-auth.middleware.js";

export const authRouter = Router();

const REFRESH_TOKEN_MAX_AGE_SEC = 604800;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: REFRESH_TOKEN_MAX_AGE_SEC * 1000
  });
}

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
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

authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies["refresh_token"] as string | undefined;
      await logout(refreshToken);
      res.clearCookie("refresh_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env["NODE_ENV"] === "production"
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

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
