import { Router, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../auth/require-auth.middleware.js";
import { updateBasicInfoSchema } from "./profile.schemas.js";
import {
  calculateCompletionPercentage,
  getOrCreateCandidateProfile,
  updateCandidateProfileBasicInfo,
  type ProfileWithRelations
} from "./profile.service.js";

export const profileRouter = Router();

function serializeProfile(profile: ProfileWithRelations): Record<string, unknown> {
  return {
    id: profile.id,
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    headline: profile.headline,
    summary: profile.summary,
    location: profile.location,
    locationRemote: profile.locationRemote,
    availabilityStatus: profile.availabilityStatus,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    completionPercentage: calculateCompletionPercentage(profile)
  };
}

profileRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const profile = await getOrCreateCandidateProfile(userId);
      res.status(200).json(serializeProfile(profile));
    } catch (err) {
      next(err);
    }
  }
);

profileRouter.put(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = updateBasicInfoSchema.parse(req.body);
      const profile = await updateCandidateProfileBasicInfo(userId, input);
      res.status(200).json(serializeProfile(profile));
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
        });
        return;
      }
      next(err);
    }
  }
);
