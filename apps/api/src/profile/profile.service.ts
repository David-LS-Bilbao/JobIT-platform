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
import { deleteAvatarImage } from "./avatar.storage.js";
import { ProfileError } from "./profile.ownership.js";
import {
  findOwnedEducationOrThrow,
  findOwnedExperienceOrThrow,
  findOwnedProjectOrThrow,
  findOwnedSkillOrThrow
} from "./profile.ownership.js";
import type {
  CreateEducationInput,
  CreateExperienceInput,
  CreateProjectInput,
  CreateSkillInput,
  PutLinksInput,
  PutPreferencesInput,
  UpdateBasicInfoInput,
  UpdateEducationInput,
  UpdateExperienceInput,
  UpdateProjectInput
} from "./profile.schemas.js";

// Orden estable de las relaciones para el read model de `GET /api/profile/me`.
// Nota: los subrecursos no tienen timestamps en el schema; se ordena por campos
// existentes (name/type) y por relevancia (current desc, startDate desc).
const PROFILE_RELATIONS = {
  skills: { orderBy: { name: "asc" } },
  experiences: { orderBy: [{ current: "desc" }, { startDate: "desc" }] },
  education: { orderBy: [{ current: "desc" }, { startDate: "desc" }] },
  projects: { orderBy: { name: "asc" } },
  links: { orderBy: { type: "asc" } },
  preferences: true
} satisfies Prisma.CandidateProfileInclude;

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

/**
 * Borra el fichero del avatar anterior cuando deja de estar referenciado.
 *
 * Spec: `docs/specs/features/account-lifecycle.md` §"Avatar cleanup". Se invoca
 * SIEMPRE despues del commit en base de datos: el estado autoritativo es la fila,
 * y el fichero es un efecto derivado. Por eso un fallo de sistema de ficheros no
 * revierte una actualizacion ya consolidada; se absorbe aqui de forma explicita.
 *
 * `deleteAvatarImage` ignora por diseno cualquier URL que no sea un avatar
 * interno, de modo que un `avatarUrl` externo nunca intenta tocar disco.
 */
async function cleanupReplacedAvatarFile(
  previousAvatarUrl: string | null,
  nextAvatarUrl: string | null
): Promise<void> {
  if (!previousAvatarUrl || previousAvatarUrl === nextAvatarUrl) return;
  try {
    await deleteAvatarImage(previousAvatarUrl);
  } catch {
    // Efecto secundario no critico y posterior al commit: no se propaga para no
    // convertir una actualizacion correcta en un 500.
  }
}

export async function updateCandidateProfileBasicInfo(
  userId: string,
  input: UpdateBasicInfoInput
): Promise<ProfileWithRelations> {
  const current = await getOrCreateCandidateProfile(userId);

  const updated = await prisma.candidateProfile.update({
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
      // avatarUrl es condicional: omitirlo NO lo borra (así una imagen subida vía
      // POST /me/avatar sobrevive a un guardado de datos básicos). `null` lo limpia.
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl })
    },
    include: PROFILE_RELATIONS
  });

  // Sustituir el avatar interno por una URL externa, o limpiarlo con `null`,
  // tambien deja huerfano el fichero anterior.
  if (input.avatarUrl !== undefined) {
    await cleanupReplacedAvatarFile(current.avatarUrl, updated.avatarUrl);
  }

  return updated;
}

/** Actualiza solo `avatarUrl` (usado por la subida de imagen `POST /me/avatar`). */
export async function setCandidateAvatarUrl(
  userId: string,
  avatarUrl: string
): Promise<ProfileWithRelations> {
  const current = await getOrCreateCandidateProfile(userId);

  const updated = await prisma.candidateProfile.update({
    where: { userId },
    data: { avatarUrl },
    include: PROFILE_RELATIONS
  });

  await cleanupReplacedAvatarFile(current.avatarUrl, updated.avatarUrl);

  return updated;
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

export async function addCandidateEducation(
  userId: string,
  input: CreateEducationInput
): Promise<Education> {
  const profile = await getOrCreateCandidateProfile(userId);
  const isCurrent = input.current ?? false;

  return prisma.education.create({
    data: {
      profileId: profile.id,
      institution: input.institution.trim(),
      title: input.title.trim(),
      field: input.field ?? null,
      startDate: new Date(input.startDate),
      endDate: isCurrent ? null : input.endDate ? new Date(input.endDate) : null,
      current: isCurrent
    }
  });
}

export async function updateCandidateEducation(
  userId: string,
  educationId: string,
  input: UpdateEducationInput
): Promise<Education> {
  await findOwnedEducationOrThrow(userId, educationId);

  const data: Prisma.EducationUpdateInput = {};
  if (input.institution !== undefined) {
    data.institution = input.institution.trim();
  }
  if (input.title !== undefined) {
    data.title = input.title.trim();
  }
  if (input.field !== undefined) {
    data.field = input.field ?? null;
  }
  if (input.startDate !== undefined) {
    data.startDate = new Date(input.startDate);
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

  return prisma.education.update({
    where: { id: educationId },
    data
  });
}

export async function deleteCandidateEducation(
  userId: string,
  educationId: string
): Promise<void> {
  await findOwnedEducationOrThrow(userId, educationId);
  await prisma.education.delete({ where: { id: educationId } });
}

export async function addCandidateProject(
  userId: string,
  input: CreateProjectInput
): Promise<Project> {
  const profile = await getOrCreateCandidateProfile(userId);

  return prisma.project.create({
    data: {
      profileId: profile.id,
      name: input.name.trim(),
      description: input.description ?? null,
      technologies: input.technologies.map((tech) => tech.trim()),
      url: input.url ?? null,
      repoUrl: input.repoUrl ?? null
    }
  });
}

export async function updateCandidateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
  await findOwnedProjectOrThrow(userId, projectId);

  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) {
    data.name = input.name.trim();
  }
  if (input.description !== undefined) {
    data.description = input.description ?? null;
  }
  if (input.technologies !== undefined) {
    data.technologies = input.technologies.map((tech) => tech.trim());
  }
  if (input.url !== undefined) {
    data.url = input.url ?? null;
  }
  if (input.repoUrl !== undefined) {
    data.repoUrl = input.repoUrl ?? null;
  }

  return prisma.project.update({
    where: { id: projectId },
    data
  });
}

export async function deleteCandidateProject(
  userId: string,
  projectId: string
): Promise<void> {
  await findOwnedProjectOrThrow(userId, projectId);
  await prisma.project.delete({ where: { id: projectId } });
}

export async function replaceCandidateLinks(
  userId: string,
  input: PutLinksInput
): Promise<Link[]> {
  const profile = await getOrCreateCandidateProfile(userId);

  return prisma.$transaction(async (tx) => {
    await tx.link.deleteMany({ where: { profileId: profile.id } });
    const created: Link[] = [];
    for (const link of input.links) {
      created.push(
        await tx.link.create({
          data: { profileId: profile.id, type: link.type, url: link.url.trim() }
        })
      );
    }
    return created;
  });
}

export async function upsertCandidatePreferences(
  userId: string,
  input: PutPreferencesInput
): Promise<JobPreferences> {
  const profile = await getOrCreateCandidateProfile(userId);

  const data = {
    desiredRoles: input.desiredRoles ?? [],
    preferredLocations: input.preferredLocations ?? [],
    remotePreference: input.remotePreference ?? "ANY",
    seniority: input.seniority ?? null,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    contractTypes: input.contractTypes ?? []
  };

  return prisma.jobPreferences.upsert({
    where: { profileId: profile.id },
    create: { profileId: profile.id, ...data },
    update: data
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

/**
 * Flags por sección del CV. Única fuente de las reglas de completitud: el
 * porcentaje se deriva de estos mismos booleanos (coherencia garantizada), y el
 * Dashboard los expone como `cvSections` (Sprint 17C).
 */
export interface ProfileSectionFlags {
  basics: boolean;
  skills: boolean;
  experience: boolean;
  education: boolean;
  projects: boolean;
  links: boolean;
  preferences: boolean;
}

export function getProfileSectionFlags(profile: ProfileWithRelations): ProfileSectionFlags {
  return {
    basics: Boolean(profile.firstName) && Boolean(profile.lastName),
    skills: profile.skills.length > 0,
    experience: profile.experiences.length > 0,
    education: profile.education.length > 0,
    projects: profile.projects.length > 0,
    links: profile.links.length > 0,
    preferences: hasMeaningfulPreferences(profile.preferences)
  };
}

export function calculateCompletionPercentage(
  profile: ProfileWithRelations
): number {
  const completed = Object.values(getProfileSectionFlags(profile)).filter(Boolean).length;

  return Math.round((completed / COMPLETION_SECTIONS) * 100);
}
