import { type Job } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { serializeJob } from "../jobs/jobs.serializer.js";
import { getActiveJobById } from "../jobs/jobs.service.js";
import {
  getOrCreateCandidateProfile,
  type ProfileWithRelations
} from "../profile/profile.service.js";
import { calculateJobMatch, type MatchScoringInput } from "./match.scoring.js";
import type { JobMatchDto, ProfileJobMatchDto } from "./match.types.js";

/**
 * Servicio de Match (Sprint 05). Backend-only, determinista y explicable.
 * No persiste nada (cálculo en tiempo de petición), no llama a Jooble ni a red
 * externa, y nunca acepta `userId` del cliente: lo recibe ya resuelto del token.
 */

/** Mapea el perfil real del candidato al input del scoring puro. */
function toScoringCandidate(profile: ProfileWithRelations): MatchScoringInput["candidate"] {
  const preferences = profile.preferences;
  return {
    skills: profile.skills.map((skill) => skill.normalizedName),
    preferences: preferences
      ? {
          remotePreference: preferences.remotePreference,
          seniority: preferences.seniority,
          preferredLocations: preferences.preferredLocations
        }
      : null
  };
}

/** Mapea una oferta real al input del scoring puro (solo campos relevantes). */
function toScoringJob(job: Job): MatchScoringInput["job"] {
  return {
    tags: job.tags,
    remoteType: job.remoteType,
    seniority: job.seniority,
    location: job.location
  };
}

/** Ofertas disponibles: ACTIVE y vigentes (mismo criterio que jobs.service). */
function findAvailableJobs(): Promise<Job[]> {
  return prisma.job.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
    },
    orderBy: [{ postedAt: "desc" }, { id: "asc" }]
  });
}

/**
 * Match entre el candidato autenticado y una oferta concreta.
 * Reutiliza `getActiveJobById` (lanza 404 "Oferta no disponible" si no procede).
 */
export async function getJobMatchForUser(userId: string, jobId: string): Promise<JobMatchDto> {
  const job = await getActiveJobById(jobId);
  const profile = await getOrCreateCandidateProfile(userId);

  const result = calculateJobMatch({
    candidate: toScoringCandidate(profile),
    job: toScoringJob(job)
  });

  return { jobId: job.id, ...result };
}

/**
 * Mejores N matches del candidato autenticado entre las ofertas disponibles.
 * Ordena por `score` desc y serializa cada oferta con el contrato público.
 */
export async function getTopMatchesForUser(
  userId: string,
  limit: number
): Promise<ProfileJobMatchDto[]> {
  const profile = await getOrCreateCandidateProfile(userId);
  const candidate = toScoringCandidate(profile);
  const jobs = await findAvailableJobs();

  const matches: ProfileJobMatchDto[] = jobs.map((job) => {
    const result = calculateJobMatch({ candidate, job: toScoringJob(job) });
    return {
      job: serializeJob(job),
      score: result.score,
      level: result.level,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills
    };
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
