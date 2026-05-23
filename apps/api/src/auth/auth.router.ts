import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { registerSchema, loginSchema } from "./auth.schemas.js";
import { AppError, login, register } from "./auth.service.js";

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
