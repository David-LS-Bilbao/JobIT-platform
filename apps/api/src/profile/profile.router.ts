import { Router, type NextFunction, type Request, type Response } from "express";
import {
  type Education,
  type Experience,
  type JobPreferences,
  type Link,
  type Project,
  type Skill
} from "@prisma/client";
import { ZodError } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../auth/require-auth.middleware.js";
import { ProfileError } from "./profile.ownership.js";
import {
  createEducationSchema,
  createExperienceSchema,
  createProjectSchema,
  createSkillSchema,
  putLinksSchema,
  putPreferencesSchema,
  updateBasicInfoSchema,
  updateEducationSchema,
  updateExperienceSchema,
  updateProjectSchema
} from "./profile.schemas.js";
import {
  addCandidateEducation,
  addCandidateExperience,
  addCandidateProject,
  addCandidateSkill,
  calculateCompletionPercentage,
  deleteCandidateEducation,
  deleteCandidateExperience,
  deleteCandidateProject,
  deleteCandidateSkill,
  getOrCreateCandidateProfile,
  replaceCandidateLinks,
  updateCandidateEducation,
  updateCandidateExperience,
  updateCandidateProject,
  updateCandidateProfileBasicInfo,
  upsertCandidatePreferences,
  type ProfileWithRelations
} from "./profile.service.js";

export const profileRouter = Router();

function sendValidationError(res: Response, err: ZodError): void {
  res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.issues }
  });
}

function sendProfileError(res: Response, err: ProfileError): void {
  res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
}

function serializeSkill(skill: Skill): Record<string, unknown> {
  return {
    id: skill.id,
    name: skill.name,
    level: skill.level,
    category: skill.category
  };
}

function serializeEducation(education: Education): Record<string, unknown> {
  return {
    id: education.id,
    institution: education.institution,
    title: education.title,
    field: education.field,
    startDate: education.startDate,
    endDate: education.endDate,
    current: education.current
  };
}

function serializeProject(project: Project): Record<string, unknown> {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    technologies: project.technologies,
    url: project.url,
    repoUrl: project.repoUrl
  };
}

function serializeLink(link: Link): Record<string, unknown> {
  return {
    id: link.id,
    type: link.type,
    url: link.url
  };
}

function serializePreferences(preferences: JobPreferences): Record<string, unknown> {
  return {
    id: preferences.id,
    desiredRoles: preferences.desiredRoles,
    preferredLocations: preferences.preferredLocations,
    remotePreference: preferences.remotePreference,
    seniority: preferences.seniority,
    salaryMin: preferences.salaryMin,
    salaryMax: preferences.salaryMax,
    contractTypes: preferences.contractTypes
  };
}

function serializeExperience(experience: Experience): Record<string, unknown> {
  return {
    id: experience.id,
    company: experience.company,
    role: experience.role,
    startDate: experience.startDate,
    endDate: experience.endDate,
    current: experience.current,
    description: experience.description,
    location: experience.location
  };
}

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
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.post(
  "/me/skills",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = createSkillSchema.parse(req.body);
      const skill = await addCandidateSkill(userId, input);
      res.status(201).json(serializeSkill(skill));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.delete(
  "/me/skills/:skillId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      await deleteCandidateSkill(userId, req.params["skillId"] as string);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.post(
  "/me/experience",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = createExperienceSchema.parse(req.body);
      const experience = await addCandidateExperience(userId, input);
      res.status(201).json(serializeExperience(experience));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.put(
  "/me/experience/:experienceId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = updateExperienceSchema.parse(req.body);
      const experience = await updateCandidateExperience(
        userId,
        req.params["experienceId"] as string,
        input
      );
      res.status(200).json(serializeExperience(experience));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.delete(
  "/me/experience/:experienceId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      await deleteCandidateExperience(userId, req.params["experienceId"] as string);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.post(
  "/me/education",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = createEducationSchema.parse(req.body);
      const education = await addCandidateEducation(userId, input);
      res.status(201).json(serializeEducation(education));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.put(
  "/me/education/:educationId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = updateEducationSchema.parse(req.body);
      const education = await updateCandidateEducation(
        userId,
        req.params["educationId"] as string,
        input
      );
      res.status(200).json(serializeEducation(education));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.delete(
  "/me/education/:educationId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      await deleteCandidateEducation(userId, req.params["educationId"] as string);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.post(
  "/me/projects",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = createProjectSchema.parse(req.body);
      const project = await addCandidateProject(userId, input);
      res.status(201).json(serializeProject(project));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.put(
  "/me/projects/:projectId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = updateProjectSchema.parse(req.body);
      const project = await updateCandidateProject(
        userId,
        req.params["projectId"] as string,
        input
      );
      res.status(200).json(serializeProject(project));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.delete(
  "/me/projects/:projectId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      await deleteCandidateProject(userId, req.params["projectId"] as string);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ProfileError) {
        sendProfileError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.put(
  "/me/links",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = putLinksSchema.parse(req.body);
      const links = await replaceCandidateLinks(userId, input);
      res.status(200).json({ links: links.map(serializeLink) });
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  }
);

profileRouter.put(
  "/me/preferences",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as unknown as AuthenticatedRequest).auth;
      const input = putPreferencesSchema.parse(req.body);
      const preferences = await upsertCandidatePreferences(userId, input);
      res.status(200).json(serializePreferences(preferences));
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  }
);
