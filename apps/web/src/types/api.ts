/**
 * Tipos espejo de los contratos backend cerrados (SDD Review · Sprint 07).
 * Fuente de verdad: apps/api/src/**. Las fechas viajan como string ISO en JSON.
 * Recordatorio de envoltorios: las listas usan `{ data }` (jobs añade total/page/limit);
 * dashboard, auth/me, detalle y resultado de guardar son respuestas "bare".
 */

// --- Errores -----------------------------------------------------------------

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  // El backend podría introducir otros códigos; no cerramos la unión.
  | (string & {});

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

// --- Auth --------------------------------------------------------------------

export type UserRole = "CANDIDATE" | (string & {});

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserDto;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

// --- Jobs --------------------------------------------------------------------

export type RemoteType = "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";
export type JobSeniority = "JUNIOR" | "MID" | "SENIOR" | "ANY";
export type JobSource = "INTERNAL" | "JOOBLE";
export type JobStatus = "ACTIVE" | "CLOSED" | (string & {});

export interface JobPublicDto {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remoteType: RemoteType;
  description: string;
  requirements: string[];
  seniority: JobSeniority;
  contractType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  status: JobStatus;
  postedAt: string;
  expiresAt: string | null;
  source: JobSource;
  sourceUrl: string | null;
}

// --- Saved Jobs --------------------------------------------------------------

export interface SavedJobDto {
  savedAt: string;
  job: JobPublicDto;
}

// --- Match -------------------------------------------------------------------

export type MatchLevel = "VERY_LOW" | "LOW" | "GOOD" | "VERY_GOOD";
export type MatchFactorName = "skills" | "remote" | "seniority" | "location";

export interface MatchFactorDto {
  name: MatchFactorName;
  match: boolean | null;
  detail: string;
}

/** Item del listado `GET /api/profile/me/matches`. */
export interface ProfileJobMatchDto {
  job: JobPublicDto;
  score: number; // 0..100
  level: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
}

/** Respuesta bare de `GET /api/jobs/:id/match`. */
export interface JobMatchDto {
  jobId: string;
  score: number; // 0..100
  level: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
  factors: MatchFactorDto[];
  explanation: string;
}

// --- Dashboard ---------------------------------------------------------------

export interface DashboardProfileDto {
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  completionPercentage: number; // 0..100
}

export interface DashboardSavedJobsDto {
  total: number;
  recent: SavedJobDto[];
}

export interface DashboardNextActionDto {
  action: string;
  label: string;
}

export interface CandidateDashboardDto {
  profile: DashboardProfileDto;
  skills: string[];
  savedJobs: DashboardSavedJobsDto;
  matches: ProfileJobMatchDto[];
  nextActions: DashboardNextActionDto[];
}

// --- Envoltorios de colección ------------------------------------------------

/** Lista genérica envuelta: saved-jobs y matches usan `{ data }`. */
export interface ListResponseDto<T> {
  data: T[];
}

export type SavedJobsListResponseDto = ListResponseDto<SavedJobDto>;
export type ProfileMatchesResponseDto = ListResponseDto<ProfileJobMatchDto>;

/** `GET /api/jobs`: lista con metadatos de paginación. */
export interface PaginatedJobsResponseDto {
  data: JobPublicDto[];
  total: number;
  page: number;
  limit: number;
}
