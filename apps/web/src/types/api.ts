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
  // Campos de perfil pendientes cuando el portfolio no cumple el mínimo publicable.
  missingFields?: string[];
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

// Valores admitidos por los filtros de `GET /api/jobs` (subconjuntos de los enums).
export type JobRemoteFilter = "REMOTE" | "HYBRID" | "ON_SITE";
export type JobSeniorityFilter = "JUNIOR" | "MID" | "SENIOR";
export type JobContractType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE";

/**
 * Filtros de `GET /api/jobs` (todos opcionales). `q` busca texto libre en
 * título/descripción; `location` filtra por ubicación (eje principal de búsqueda,
 * alineado con fuentes externas tipo Jooble). `source` sigue soportado por el
 * backend pero ya no se expone en la UI (ver docs de fuentes múltiples).
 */
export interface JobFilters {
  q?: string;
  location?: string;
  remote?: JobRemoteFilter;
  seniority?: JobSeniorityFilter;
  contractType?: JobContractType;
  source?: JobSource;
  page?: number;
  limit?: number;
}

/** Respuesta paginada de `GET /api/jobs`. */
export interface JobsListResponse {
  data: JobPublicDto[];
  total: number;
  page: number;
  limit: number;
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

// --- Profile / JobIT CV ------------------------------------------------------
// Read model completo de `GET /api/profile/me` (Sprint 13.5). Espejo exacto de
// los serializadores del backend: subrecursos SIN createdAt/updatedAt,
// `preferences` puede ser null y las listas pueden ser []. Fechas: string ISO.

export type AvailabilityStatus = "ACTIVE" | "OPEN" | "NOT_LOOKING";
export type SkillLevel = "BASIC" | "INTERMEDIATE" | "ADVANCED";
export type ProfileLinkType = "GITHUB" | "LINKEDIN" | "PORTFOLIO" | "OTHER";
export type RemotePreference = "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
export type PreferenceSeniority = "JUNIOR" | "MID" | "SENIOR";

export interface ProfileSkillDto {
  id: string;
  name: string;
  level: SkillLevel | null;
  category: string | null;
}

export interface ProfileExperienceDto {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  location: string | null;
}

export interface ProfileEducationDto {
  id: string;
  institution: string;
  title: string;
  field: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
}

export interface ProfileProjectDto {
  id: string;
  name: string;
  description: string | null;
  technologies: string[];
  url: string | null;
  repoUrl: string | null;
}

export interface ProfileLinkDto {
  id: string;
  type: ProfileLinkType;
  url: string;
}

export interface ProfilePreferencesDto {
  id: string;
  desiredRoles: string[];
  preferredLocations: string[];
  remotePreference: RemotePreference;
  seniority: PreferenceSeniority | null;
  salaryMin: number | null;
  salaryMax: number | null;
  contractTypes: string[];
}

export interface CandidateProfileDto {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  locationRemote: boolean;
  availabilityStatus: AvailabilityStatus;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  completionPercentage: number; // 0..100
  skills: ProfileSkillDto[];
  experiences: ProfileExperienceDto[];
  education: ProfileEducationDto[];
  projects: ProfileProjectDto[];
  links: ProfileLinkDto[];
  preferences: ProfilePreferencesDto | null;
}

/**
 * Cuerpo de `PUT /api/profile/me` (datos básicos). firstName y lastName son
 * obligatorios (mín. 2 en backend); el resto es opcional. No incluye subrecursos.
 */
export interface UpdateProfileBasicInfoInput {
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  locationRemote?: boolean;
  availabilityStatus?: AvailabilityStatus;
  // URL externa (avanzado). `null` limpia el avatar; omitir lo preserva
  // (las imágenes subidas se guardan como ruta interna vía POST /me/avatar).
  avatarUrl?: string | null;
}

/** Respuesta de `POST /api/profile/me/avatar`. */
export interface UploadAvatarResponse {
  avatarUrl: string;
}

/** Ajustes de publicación del portfolio (JobIT Portfolio V1). */
export interface PortfolioSettingsDto {
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  showLocation: boolean;
  showAvailability: boolean;
  showPreferences: boolean;
  publicUrlPath: string; // relativo, p. ej. "/u/ana-perez"
}

/** Body de `PUT /api/profile/me/portfolio` (todos opcionales). */
export interface UpdatePortfolioSettingsInput {
  slug?: string;
  showLocation?: boolean;
  showAvailability?: boolean;
  showPreferences?: boolean;
}

// --- Portfolio público (`GET /api/public/portfolios/:slug`) ------------------
// Read model construido por whitelist en backend: solo campos públicos. Los
// campos ocultos por flags llegan como `null`; nunca incluye salario ni datos
// privados (userId, email, tokens, completitud, saved jobs, matches).

export interface PublicPortfolioProfile {
  name: string;
  headline: string | null;
  summary: string | null;
  avatarUrl: string | null;
  location: string | null;
  availabilityStatus: AvailabilityStatus | null;
  locationRemote: boolean | null;
  skills: { name: string; level: SkillLevel | null }[];
  experiences: {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    current: boolean;
    description: string | null;
    location: string | null;
  }[];
  education: {
    institution: string;
    title: string;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
  }[];
  projects: { name: string; description: string | null; technologies: string[]; url: string | null; repoUrl: string | null }[];
  links: { type: ProfileLinkType; url: string }[];
  preferences: { desiredRoles: string[]; preferredLocations: string[]; remotePreference: RemotePreference } | null;
}

export interface PublicPortfolioDto {
  slug: string;
  publicUrlPath: string;
  publishedAt: string | null;
  profile: PublicPortfolioProfile;
}

/** Cuerpo de `POST /api/profile/me/skills`. Solo `name` es obligatorio. */
export interface CreateProfileSkillInput {
  name: string;
  level?: SkillLevel;
  category?: string;
}

/**
 * Cuerpo de `POST /api/profile/me/experience`. company/role/startDate obligatorios.
 * `current: true` ⇒ el backend fuerza `endDate: null` (no hace falta enviarla).
 */
export interface CreateProfileExperienceInput {
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  description?: string;
  location?: string;
}

/** Cuerpo de `PUT /api/profile/me/experience/:id`. Todos los campos opcionales. */
export type UpdateProfileExperienceInput = Partial<CreateProfileExperienceInput>;

/**
 * Cuerpo de `POST /api/profile/me/education`. institution/title/startDate obligatorios.
 * `current: true` ⇒ el backend fuerza `endDate: null`.
 */
export interface CreateProfileEducationInput {
  institution: string;
  title: string;
  field?: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
}

/** Cuerpo de `PUT /api/profile/me/education/:id`. Todos los campos opcionales. */
export type UpdateProfileEducationInput = Partial<CreateProfileEducationInput>;

/**
 * Cuerpo de `POST /api/profile/me/projects`. `name` y `technologies` (mín. 1)
 * son obligatorios; `url`/`repoUrl` opcionales pero deben ser URL válidas.
 */
export interface CreateProfileProjectInput {
  name: string;
  description?: string;
  technologies: string[];
  url?: string;
  repoUrl?: string;
}

/** Cuerpo de `PUT /api/profile/me/projects/:id`. Todos los campos opcionales. */
export type UpdateProfileProjectInput = Partial<CreateProfileProjectInput>;

/**
 * Cuerpo de `PUT /api/profile/me/links`: reemplaza la lista completa de enlaces.
 * El backend exige mínimo 1 enlace y cada `url` debe ser una URL válida.
 */
export interface PutProfileLinksInput {
  links: Array<{
    type: ProfileLinkType;
    url: string;
  }>;
}

/** Respuesta de `PUT /api/profile/me/links`: la lista resultante de enlaces. */
export interface PutProfileLinksResponse {
  links: ProfileLinkDto[];
}

/**
 * Cuerpo de `PUT /api/profile/me/preferences` (upsert). Todos los campos son
 * opcionales; el backend aplica defaults e ignora campos desconocidos (`.strip()`).
 * La respuesta reutiliza `ProfilePreferencesDto`.
 */
export interface PutProfilePreferencesInput {
  desiredRoles?: string[];
  preferredLocations?: string[];
  remotePreference?: RemotePreference;
  seniority?: PreferenceSeniority | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  contractTypes?: string[];
}
