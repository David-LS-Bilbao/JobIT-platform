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
import { apiRequest } from "@/lib/api-client";
import type { CandidateProfileDto, UpdateProfileBasicInfoInput } from "@/types/api";

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
