import { Router, type NextFunction, type Request, type Response } from "express";

import { requireAuth, type AuthenticatedRequest } from "../auth/require-auth.middleware.js";
import { getCandidateDashboard } from "./dashboard.service.js";

export const dashboardRouter = Router();

// El userId procede siempre del token verificado; body/query/params se ignoran.
function authUserId(req: Request): string {
  return (req as AuthenticatedRequest).auth.userId;
}

dashboardRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dashboard = await getCandidateDashboard(authUserId(req));
      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  }
);
