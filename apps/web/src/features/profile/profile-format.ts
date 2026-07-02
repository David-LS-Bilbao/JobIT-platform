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

// `contractTypes` llega como string[] libre desde el backend: mapeamos los
// valores conocidos y dejamos un fallback seguro para cualquier otro.
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Jornada completa",
  PART_TIME: "Media jornada",
  CONTRACT: "Contrato",
  FREELANCE: "Freelance",
  INTERNSHIP: "Prácticas",
  TEMPORARY: "Temporal"
};

/**
 * Humaniza un valor de enum crudo: usa el catálogo conocido y, si no existe,
 * aplica un fallback seguro (guiones bajos → espacios y capitalización inicial).
 */
export function humanizeEnum(value: string, labels: Record<string, string> = {}): string {
  const known = labels[value];
  if (known) return known;
  const cleaned = value.replace(/_/g, " ").trim().toLowerCase();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : value;
}

/** Etiqueta legible de un tipo de contrato (p. ej. `FULL_TIME` → "Jornada completa"). */
export function formatContractType(value: string): string {
  return humanizeEnum(value, CONTRACT_TYPE_LABELS);
}

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
