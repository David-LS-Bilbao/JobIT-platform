import {
  Prisma,
  type CandidateProfile,
  type Education,
  type Experience,
  type JobPreferences,
  type Link,
  type Project,
  type Skill
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { ProfileError } from "./profile.ownership.js";
import { findOwnedExperienceOrThrow, findOwnedSkillOrThrow } from "./profile.ownership.js";
import type {
  CreateExperienceInput,
  CreateSkillInput,
  UpdateBasicInfoInput,
  UpdateExperienceInput
} from "./profile.schemas.js";

const PROFILE_RELATIONS = {
  skills: true,
  experiences: true,
  education: true,
  projects: true,
  links: true,
  preferences: true
} as const;

export type ProfileWithRelations = CandidateProfile & {
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  links: Link[];
  preferences: JobPreferences | null;
};

const COMPLETION_SECTIONS = 7;

export async function getOrCreateCandidateProfile(
  userId: string
): Promise<ProfileWithRelations> {
  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: PROFILE_RELATIONS
  });
  if (existing) {
    return existing;
  }

  return prisma.candidateProfile.create({
    data: { userId },
    include: PROFILE_RELATIONS
  });
}

export async function updateCandidateProfileBasicInfo(
  userId: string,
  input: UpdateBasicInfoInput
): Promise<ProfileWithRelations> {
  await getOrCreateCandidateProfile(userId);

  return prisma.candidateProfile.update({
    where: { userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      headline: input.headline ?? null,
      summary: input.summary ?? null,
      location: input.location ?? null,
      ...(input.locationRemote !== undefined && { locationRemote: input.locationRemote }),
      ...(input.availabilityStatus !== undefined && {
        availabilityStatus: input.availabilityStatus
      }),
      avatarUrl: input.avatarUrl ?? null
    },
    include: PROFILE_RELATIONS
  });
}

export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase();
}

export async function addCandidateSkill(
  userId: string,
  input: CreateSkillInput
): Promise<Skill> {
  const profile = await getOrCreateCandidateProfile(userId);

  try {
    return await prisma.skill.create({
      data: {
        profileId: profile.id,
        name: input.name.trim(),
        normalizedName: normalizeSkillName(input.name),
        level: input.level ?? null,
        category: input.category ?? null
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ProfileError("CONFLICT", 409, "Ya has añadido esa skill.");
    }
    throw err;
  }
}

export async function deleteCandidateSkill(userId: string, skillId: string): Promise<void> {
  await findOwnedSkillOrThrow(userId, skillId);
  await prisma.skill.delete({ where: { id: skillId } });
}

export async function addCandidateExperience(
  userId: string,
  input: CreateExperienceInput
): Promise<Experience> {
  const profile = await getOrCreateCandidateProfile(userId);
  const isCurrent = input.current ?? false;

  return prisma.experience.create({
    data: {
      profileId: profile.id,
      company: input.company.trim(),
      role: input.role.trim(),
      startDate: new Date(input.startDate),
      endDate: isCurrent ? null : input.endDate ? new Date(input.endDate) : null,
      current: isCurrent,
      description: input.description ?? null,
      location: input.location ?? null
    }
  });
}

export async function updateCandidateExperience(
  userId: string,
  experienceId: string,
  input: UpdateExperienceInput
): Promise<Experience> {
  await findOwnedExperienceOrThrow(userId, experienceId);

  const data: Prisma.ExperienceUpdateInput = {};
  if (input.company !== undefined) {
    data.company = input.company.trim();
  }
  if (input.role !== undefined) {
    data.role = input.role.trim();
  }
  if (input.startDate !== undefined) {
    data.startDate = new Date(input.startDate);
  }
  if (input.description !== undefined) {
    data.description = input.description ?? null;
  }
  if (input.location !== undefined) {
    data.location = input.location ?? null;
  }

  if (input.current === true) {
    data.current = true;
    data.endDate = null;
  } else {
    if (input.current === false) {
      data.current = false;
    }
    if (input.endDate !== undefined) {
      data.endDate = input.endDate ? new Date(input.endDate) : null;
    }
  }

  return prisma.experience.update({
    where: { id: experienceId },
    data
  });
}

export async function deleteCandidateExperience(
  userId: string,
  experienceId: string
): Promise<void> {
  await findOwnedExperienceOrThrow(userId, experienceId);
  await prisma.experience.delete({ where: { id: experienceId } });
}

function hasMeaningfulPreferences(preferences: JobPreferences | null): boolean {
  if (!preferences) {
    return false;
  }
  return (
    preferences.desiredRoles.length > 0 ||
    preferences.preferredLocations.length > 0 ||
    preferences.contractTypes.length > 0 ||
    preferences.seniority !== null ||
    preferences.salaryMin !== null ||
    preferences.salaryMax !== null
  );
}

export function calculateCompletionPercentage(
  profile: ProfileWithRelations
): number {
  const completed = [
    Boolean(profile.firstName) && Boolean(profile.lastName),
    profile.skills.length > 0,
    profile.experiences.length > 0,
    profile.education.length > 0,
    profile.projects.length > 0,
    profile.links.length > 0,
    hasMeaningfulPreferences(profile.preferences)
  ].filter(Boolean).length;

  return Math.round((completed / COMPLETION_SECTIONS) * 100);
}
