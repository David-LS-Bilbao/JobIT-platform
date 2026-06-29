import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../auth/require-auth.middleware.js";
import { savedJobIdParamSchema } from "./saved-jobs.schemas.js";
import {
  deleteSavedJob,
  listSavedJobs,
  saveJob,
  SavedJobsError
} from "./saved-jobs.service.js";

export const savedJobsRouter = Router();

function sendValidationError(res: Response, err: ZodError): void {
  res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
  });
}

function sendSavedJobsError(res: Response, err: SavedJobsError): void {
  res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
}

// El userId procede siempre del token verificado; body/query/params se ignoran.
function authUserId(req: Request): string {
  return (req as AuthenticatedRequest).auth.userId;
}

savedJobsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await listSavedJobs(authUserId(req));
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

savedJobsRouter.post(
  "/:jobId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { jobId } = savedJobIdParamSchema.parse(req.params);
      const result = await saveJob(authUserId(req), jobId);
      res.status(result.statusCode).json(result.savedJob);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof SavedJobsError) {
        sendSavedJobsError(res, err);
        return;
      }
      next(err);
    }
  }
);

savedJobsRouter.delete(
  "/:jobId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { jobId } = savedJobIdParamSchema.parse(req.params);
      await deleteSavedJob(authUserId(req), jobId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof SavedJobsError) {
        sendSavedJobsError(res, err);
        return;
      }
      next(err);
    }
  }
);
