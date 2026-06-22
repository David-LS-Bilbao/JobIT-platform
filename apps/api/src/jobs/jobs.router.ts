import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { requireAuth } from "../auth/require-auth.middleware.js";
import { listJobsQuerySchema } from "./jobs.schemas.js";
import { listJobs } from "./jobs.service.js";

export const jobsRouter = Router();

function sendValidationError(res: Response, err: ZodError): void {
  res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
  });
}

jobsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listJobsQuerySchema.parse(req.query);
      const result = await listJobs(query);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  }
);
