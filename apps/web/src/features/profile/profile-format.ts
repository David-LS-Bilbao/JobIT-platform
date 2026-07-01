/**
 * Helpers de presentación del JobIT CV: etiquetas legibles de los enums y
 * formato de fechas. Las fechas se leen en UTC para evitar desfases de zona.
 */
import type {
  AvailabilityStatus,
  CandidateProfileDto,
  PreferenceSeniority,
  ProfileLinkType,
  RemotePreference,
  SkillLevel
} from "@/types/api";

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  ACTIVE: "Disponible",
  OPEN: "Abierto a oportunidades",
  NOT_LOOKING: "No buscando"
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BASIC: "Básico",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado"
};

export const LINK_TYPE_LABELS: Record<ProfileLinkType, string> = {
  GITHUB: "GitHub",
  LINKEDIN: "LinkedIn",
  PORTFOLIO: "Portfolio",
  OTHER: "Enlace"
};

export const REMOTE_PREFERENCE_LABELS: Record<RemotePreference, string> = {
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
  ON_SITE: "Presencial",
  ANY: "Indiferente"
};

export const SENIORITY_LABELS: Record<PreferenceSeniority, string> = {
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior"
};

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${MONTHS_ES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Rango "inicio — fin" con "Actualidad" cuando el registro está en curso. */
export function formatDateRange(startDate: string, endDate: string | null, current: boolean): string {
  const start = formatMonthYear(startDate);
  const end = current ? "Actualidad" : endDate ? formatMonthYear(endDate) : "—";
  return `${start} — ${end}`;
}

export function fullName(profile: Pick<CandidateProfileDto, "firstName" | "lastName">): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
}

export function displayName(profile: Pick<CandidateProfileDto, "firstName" | "lastName">): string {
  return fullName(profile) || "Candidato tech";
}

export function initialsFrom(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "CT";
}
