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
import { findOwnedSkillOrThrow } from "./profile.ownership.js";
import type { CreateSkillInput, UpdateBasicInfoInput } from "./profile.schemas.js";

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
