/**
 * Helper de JobIT CV (Sprint 13B).
 * - `GET  /api/profile/me` → read model completo (respuesta bare).
 * - `PUT  /api/profile/me` → actualiza datos básicos y devuelve el read model.
 * Sigue el patrón por feature del repo (cf. dashboard-api.ts) sobre `apiRequest`.
 *
 * Hardening: normalizamos la respuesta para tolerar backends que aún no
 * incluyan todas las relaciones (listas → [], preferences → null). No inventa
 * datos: solo evita accesos a `undefined` en la UI.
 */
import { apiBaseUrlOrNull, apiRequest, apiUpload } from "@/lib/api-client";
import type {
  CandidateProfileDto,
  CreateProfileEducationInput,
  CreateProfileExperienceInput,
  CreateProfileProjectInput,
  CreateProfileSkillInput,
  ProfileEducationDto,
  ProfileExperienceDto,
  ProfileProjectDto,
  ProfileSkillDto,
  UpdateProfileBasicInfoInput,
  UpdateProfileEducationInput,
  UpdateProfileExperienceInput,
  UpdateProfileProjectInput,
  PutProfileLinksInput,
  PutProfileLinksResponse,
  PutProfilePreferencesInput,
  ProfilePreferencesDto,
  UploadAvatarResponse,
  PortfolioSettingsDto,
  UpdatePortfolioSettingsInput,
  PublicPortfolioDto
} from "@/types/api";

function normalizeProfile(raw: Partial<CandidateProfileDto>): CandidateProfileDto {
  return {
    id: raw.id ?? "",
    userId: raw.userId ?? "",
    firstName: raw.firstName ?? null,
    lastName: raw.lastName ?? null,
    headline: raw.headline ?? null,
    summary: raw.summary ?? null,
    location: raw.location ?? null,
    locationRemote: raw.locationRemote ?? false,
    availabilityStatus: raw.availabilityStatus ?? "ACTIVE",
    avatarUrl: raw.avatarUrl ?? null,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
    completionPercentage: raw.completionPercentage ?? 0,
    skills: raw.skills ?? [],
    experiences: raw.experiences ?? [],
    education: raw.education ?? [],
    projects: raw.projects ?? [],
    links: raw.links ?? [],
    preferences: raw.preferences ?? null
  };
}

export async function getMyProfile(token: string): Promise<CandidateProfileDto> {
  const raw = await apiRequest<Partial<CandidateProfileDto>>("/api/profile/me", { method: "GET", token });
  return normalizeProfile(raw);
}

export async function updateMyProfile(
  token: string,
  input: UpdateProfileBasicInfoInput
): Promise<CandidateProfileDto> {
  const raw = await apiRequest<Partial<CandidateProfileDto>>("/api/profile/me", {
    method: "PUT",
    token,
    body: input
  });
  return normalizeProfile(raw);
}

/** `POST /api/profile/me/avatar` (multipart, campo `avatar`) → nueva `avatarUrl`. */
export function uploadProfileAvatar(token: string, file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiUpload<UploadAvatarResponse>("/api/profile/me/avatar", formData, { token });
}

/**
 * Resuelve la URL pintable de un avatar:
 * - http(s) → tal cual (URL externa);
 * - `/uploads/...` → se prefija con la base de la API (imagen interna servida por el backend);
 * - vacío → null.
 */
export function resolveProfileImageUrl(avatarUrl: string | null | undefined): string | null {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/uploads")) {
    const base = apiBaseUrlOrNull();
    return base ? `${base}${trimmed}` : trimmed;
  }
  return trimmed;
}

// --- JobIT Portfolio V1: ajustes de publicación (endpoints privados) ---------

/** `GET /api/profile/me/portfolio` → ajustes (se crean si no existen). */
export function getMyPortfolioSettings(token: string): Promise<PortfolioSettingsDto> {
  return apiRequest<PortfolioSettingsDto>("/api/profile/me/portfolio", { token });
}

/** `PUT /api/profile/me/portfolio` → actualiza slug/flags (no publica). */
export function updateMyPortfolioSettings(
  token: string,
  input: UpdatePortfolioSettingsInput
): Promise<PortfolioSettingsDto> {
  return apiRequest<PortfolioSettingsDto>("/api/profile/me/portfolio", { method: "PUT", token, body: input });
}

/** `POST /api/profile/me/portfolio/publish` → publica si cumple el mínimo. */
export function publishMyPortfolio(token: string): Promise<PortfolioSettingsDto> {
  return apiRequest<PortfolioSettingsDto>("/api/profile/me/portfolio/publish", { method: "POST", token });
}

/** `POST /api/profile/me/portfolio/unpublish` → despublica. */
export function unpublishMyPortfolio(token: string): Promise<PortfolioSettingsDto> {
  return apiRequest<PortfolioSettingsDto>("/api/profile/me/portfolio/unpublish", { method: "POST", token });
}

/**
 * URL pública absoluta del portfolio a partir de `publicUrlPath` (relativo):
 * - `NEXT_PUBLIC_PUBLIC_BASE_URL` si está configurada;
 * - si no, `window.location.origin` en cliente;
 * - fallback SSR/test: la propia ruta relativa.
 */
export function buildPublicPortfolioUrl(publicUrlPath: string): string {
  const base = (process.env.NEXT_PUBLIC_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (base) return `${base}${publicUrlPath}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${publicUrlPath}`;
  }
  return publicUrlPath;
}

/**
 * `GET /api/public/portfolios/:slug` → portfolio público (sin auth).
 * Lanza `ApiClientError` con status 404 si no existe o no está publicado.
 */
export function getPublicPortfolio(slug: string): Promise<PublicPortfolioDto> {
  return apiRequest<PublicPortfolioDto>(`/api/public/portfolios/${encodeURIComponent(slug)}`);
}

/** `POST /api/profile/me/skills` → skill creada (201). */
export function addProfileSkill(token: string, input: CreateProfileSkillInput): Promise<ProfileSkillDto> {
  return apiRequest<ProfileSkillDto>("/api/profile/me/skills", { method: "POST", token, body: input });
}

/** `DELETE /api/profile/me/skills/:skillId` → 204 sin cuerpo. */
export function deleteProfileSkill(token: string, skillId: string): Promise<void> {
  return apiRequest<void>(`/api/profile/me/skills/${encodeURIComponent(skillId)}`, {
    method: "DELETE",
    token
  });
}

/** `POST /api/profile/me/experience` → experiencia creada (201). */
export function addProfileExperience(
  token: string,
  input: CreateProfileExperienceInput
): Promise<ProfileExperienceDto> {
  return apiRequest<ProfileExperienceDto>("/api/profile/me/experience", { method: "POST", token, body: input });
}

/** `PUT /api/profile/me/experience/:id` → experiencia actualizada. */
export function updateProfileExperience(
  token: string,
  experienceId: string,
  input: UpdateProfileExperienceInput
): Promise<ProfileExperienceDto> {
  return apiRequest<ProfileExperienceDto>(
    `/api/profile/me/experience/${encodeURIComponent(experienceId)}`,
    { method: "PUT", token, body: input }
  );
}

/** `DELETE /api/profile/me/experience/:id` → 204 sin cuerpo. */
export function deleteProfileExperience(token: string, experienceId: string): Promise<void> {
  return apiRequest<void>(`/api/profile/me/experience/${encodeURIComponent(experienceId)}`, {
    method: "DELETE",
    token
  });
}

/** `POST /api/profile/me/education` → formación creada (201). */
export function addProfileEducation(
  token: string,
  input: CreateProfileEducationInput
): Promise<ProfileEducationDto> {
  return apiRequest<ProfileEducationDto>("/api/profile/me/education", { method: "POST", token, body: input });
}

/** `PUT /api/profile/me/education/:id` → formación actualizada. */
export function updateProfileEducation(
  token: string,
  educationId: string,
  input: UpdateProfileEducationInput
): Promise<ProfileEducationDto> {
  return apiRequest<ProfileEducationDto>(
    `/api/profile/me/education/${encodeURIComponent(educationId)}`,
    { method: "PUT", token, body: input }
  );
}

/** `DELETE /api/profile/me/education/:id` → 204 sin cuerpo. */
export function deleteProfileEducation(token: string, educationId: string): Promise<void> {
  return apiRequest<void>(`/api/profile/me/education/${encodeURIComponent(educationId)}`, {
    method: "DELETE",
    token
  });
}

/** `POST /api/profile/me/projects` → proyecto creado (201). */
export function addProfileProject(
  token: string,
  input: CreateProfileProjectInput
): Promise<ProfileProjectDto> {
  return apiRequest<ProfileProjectDto>("/api/profile/me/projects", { method: "POST", token, body: input });
}

/** `PUT /api/profile/me/projects/:id` → proyecto actualizado. (Preparado para 13F-02.) */
export function updateProfileProject(
  token: string,
  projectId: string,
  input: UpdateProfileProjectInput
): Promise<ProfileProjectDto> {
  return apiRequest<ProfileProjectDto>(
    `/api/profile/me/projects/${encodeURIComponent(projectId)}`,
    { method: "PUT", token, body: input }
  );
}

/** `DELETE /api/profile/me/projects/:id` → 204 sin cuerpo. */
export function deleteProfileProject(token: string, projectId: string): Promise<void> {
  return apiRequest<void>(`/api/profile/me/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    token
  });
}

/** `PUT /api/profile/me/links` → reemplaza toda la lista; devuelve los enlaces resultantes. */
export function replaceProfileLinks(
  token: string,
  input: PutProfileLinksInput
): Promise<PutProfileLinksResponse> {
  return apiRequest<PutProfileLinksResponse>("/api/profile/me/links", { method: "PUT", token, body: input });
}

/** `PUT /api/profile/me/preferences` → upsert de preferencias; devuelve las preferencias resultantes. */
export function updateProfilePreferences(
  token: string,
  input: PutProfilePreferencesInput
): Promise<ProfilePreferencesDto> {
  return apiRequest<ProfilePreferencesDto>("/api/profile/me/preferences", { method: "PUT", token, body: input });
}
