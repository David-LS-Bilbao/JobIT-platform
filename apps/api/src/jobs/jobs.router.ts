import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { requireAuth } from "../auth/require-auth.middleware.js";
import { jobIdParamSchema, listJobsQuerySchema } from "./jobs.schemas.js";
import { serializeJob } from "./jobs.serializer.js";
import { getActiveJobById, JobsError, listJobs } from "./jobs.service.js";

export const jobsRouter = Router();

function sendValidationError(res: Response, err: ZodError): void {
  res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
  });
}

function sendJobsError(res: Response, err: JobsError): void {
  res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
}

jobsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listJobsQuerySchema.parse(req.query);
      const result = await listJobs(query);
      res.status(200).json({
        data: result.data.map(serializeJob),
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  }
);

jobsRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = jobIdParamSchema.parse(req.params);
      const job = await getActiveJobById(id);
      res.status(200).json(serializeJob(job));
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
