import type { Education, Experience, Project, Skill } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

export class ProfileError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

/**
 * Devuelve la Skill solo si pertenece al CandidateProfile del usuario autenticado.
 * - No existe  -> 404 NOT_FOUND
 * - Es de otro -> 403 FORBIDDEN
 * El userId procede siempre del token, nunca del cliente.
 */
export async function findOwnedSkillOrThrow(
  userId: string,
  skillId: string
): Promise<Skill> {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { profile: true }
  });

  if (!skill) {
    throw new ProfileError("NOT_FOUND", 404, "Skill not found.");
  }

  if (skill.profile.userId !== userId) {
    throw new ProfileError("FORBIDDEN", 403, "You do not have access to this resource.");
  }

  return skill;
}

/**
 * Devuelve la Experience solo si pertenece al CandidateProfile del usuario autenticado.
 * - No existe  -> 404 NOT_FOUND
 * - Es de otro -> 403 FORBIDDEN
 * El userId procede siempre del token, nunca del cliente.
 */
export async function findOwnedExperienceOrThrow(
  userId: string,
  experienceId: string
): Promise<Experience> {
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    include: { profile: true }
  });

  if (!experience) {
    throw new ProfileError("NOT_FOUND", 404, "Experience not found.");
  }

  if (experience.profile.userId !== userId) {
    throw new ProfileError("FORBIDDEN", 403, "You do not have access to this resource.");
  }

  return experience;
}

/**
 * Devuelve la Education solo si pertenece al CandidateProfile del usuario autenticado.
 * - No existe  -> 404 NOT_FOUND
 * - Es de otro -> 403 FORBIDDEN
 * El userId procede siempre del token, nunca del cliente.
 */
export async function findOwnedEducationOrThrow(
  userId: string,
  educationId: string
): Promise<Education> {
  const education = await prisma.education.findUnique({
    where: { id: educationId },
    include: { profile: true }
  });

  if (!education) {
    throw new ProfileError("NOT_FOUND", 404, "Education not found.");
  }

  if (education.profile.userId !== userId) {
    throw new ProfileError("FORBIDDEN", 403, "You do not have access to this resource.");
  }

  return education;
}

/**
 * Devuelve el Project solo si pertenece al CandidateProfile del usuario autenticado.
 * - No existe  -> 404 NOT_FOUND
 * - Es de otro -> 403 FORBIDDEN
 * El userId procede siempre del token, nunca del cliente.
 */
export async function findOwnedProjectOrThrow(
  userId: string,
  projectId: string
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { profile: true }
  });

  if (!project) {
    throw new ProfileError("NOT_FOUND", 404, "Project not found.");
  }

  if (project.profile.userId !== userId) {
    throw new ProfileError("FORBIDDEN", 403, "You do not have access to this resource.");
  }

  return project;
}
