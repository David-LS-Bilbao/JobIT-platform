import type {
  CandidateProfile,
  Education,
  Experience,
  JobPreferences,
  Link,
  Project,
  Skill
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";

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
