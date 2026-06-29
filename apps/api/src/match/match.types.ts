import type { JobPublicDto } from "../jobs/jobs.serializer.js";
import type { MatchFactor, MatchFactorName, MatchLevel } from "./match.scoring.js";

export type { MatchLevel, MatchFactorName };
export type MatchFactorDto = MatchFactor;

/** Contrato de `GET /api/jobs/:id/match`: match de una oferta concreta. */
export interface JobMatchDto {
  jobId: string;
  score: number;
  level: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
  factors: MatchFactorDto[];
  explanation: string;
}

/** Item resumido del listado `GET /api/profile/me/matches` (job público + score). */
export interface ProfileJobMatchDto {
  job: JobPublicDto;
  score: number;
  level: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ProfileMatchesResponseDto {
  data: ProfileJobMatchDto[];
}
