import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../auth/require-auth.middleware.js";
import { JobsError } from "../jobs/jobs.service.js";
import { matchJobParamSchema, profileMatchesQuerySchema } from "./match.schemas.js";
import { getJobMatchForUser, getTopMatchesForUser } from "./match.service.js";

export const matchRouter = Router();

function sendValidationError(res: Response, err: ZodError): void {
  res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
  });
}

function sendJobsError(res: Response, err: JobsError): void {
  res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
}

// El userId procede siempre del token verificado; body/query/params se ignoran.
function authUserId(req: Request): string {
  return (req as AuthenticatedRequest).auth.userId;
}

matchRouter.get(
  "/jobs/:id/match",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = matchJobParamSchema.parse(req.params);
      const result = await getJobMatchForUser(authUserId(req), id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof JobsError) {
        sendJobsError(res, err);
        return;
      }
      next(err);
    }
  }
);

matchRouter.get(
  "/profile/me/matches",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit } = profileMatchesQuerySchema.parse(req.query);
      const data = await getTopMatchesForUser(authUserId(req), limit);
      res.status(200).json({ data });
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  }
);
