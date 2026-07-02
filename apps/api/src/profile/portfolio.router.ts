import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../auth/require-auth.middleware.js";
import { updatePortfolioSchema } from "./portfolio.schemas.js";
import {
  PortfolioError,
  getOrCreatePortfolioSettings,
  publishPortfolio,
  serializePortfolioSettings,
  unpublishPortfolio,
  updatePortfolioSettings
} from "./portfolio.service.js";

/** Rutas privadas de gestión del portfolio. Montado en `/api/profile/me/portfolio`. */
export const portfolioRouter = Router();

function authUserId(req: Request): string {
  return (req as unknown as AuthenticatedRequest).auth.userId;
}

function sendValidationError(res: Response, err: ZodError): void {
  res
    .status(400)
    .json({ error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues } });
}

function sendPortfolioError(res: Response, err: PortfolioError): void {
  res.status(err.statusCode).json({
    error: {
      code: err.code,
      message: err.message,
      ...(err.missingFields ? { missingFields: err.missingFields } : {})
    }
  });
}

portfolioRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await getOrCreatePortfolioSettings(authUserId(req));
      res.status(200).json(serializePortfolioSettings(settings));
    } catch (err) {
      next(err);
    }
  }
);

portfolioRouter.put(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updatePortfolioSchema.parse(req.body);
      const settings = await updatePortfolioSettings(authUserId(req), input);
      res.status(200).json(serializePortfolioSettings(settings));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof PortfolioError) {
        sendPortfolioError(res, err);
        return;
      }
      next(err);
    }
  }
);

portfolioRouter.post(
  "/publish",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await publishPortfolio(authUserId(req));
      res.status(200).json(serializePortfolioSettings(settings));
    } catch (err) {
      if (err instanceof PortfolioError) {
        sendPortfolioError(res, err);
        return;
      }
      next(err);
    }
  }
);

portfolioRouter.post(
  "/unpublish",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await unpublishPortfolio(authUserId(req));
      res.status(200).json(serializePortfolioSettings(settings));
    } catch (err) {
      next(err);
    }
  }
);
