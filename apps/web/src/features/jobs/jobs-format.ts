import type { JobPublicDto, JobSeniority, JobSource, RemoteType } from "@/types/api";

export const REMOTE_TYPE_LABELS: Record<RemoteType, string> = {
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
  ON_SITE: "Presencial",
  UNSPECIFIED: "Sin especificar"
};

export const SENIORITY_LABELS: Record<JobSeniority, string> = {
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
  ANY: "Cualquiera"
};

export const JOB_SOURCE_LABELS: Record<JobSource, string> = {
  INTERNAL: "JobIT",
  JOOBLE: "Jooble"
};

// `contractType` llega como string libre; humanizamos los valores conocidos.
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Jornada completa",
  PART_TIME: "Media jornada",
  CONTRACT: "Contrato",
  FREELANCE: "Freelance",
  INTERNSHIP: "Prácticas",
  TEMPORARY: "Temporal"
};

export function formatContractType(value: string): string {
  const known = CONTRACT_TYPE_LABELS[value];
  if (known) return known;
  const cleaned = value.replace(/_/g, " ").trim().toLowerCase();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : value;
}

export function formatSalary(min: number | null, max: number | null): string | null {
  const fmt = (n: number): string => `${n.toLocaleString("es-ES")} €`;
  if (min != null && max != null) return `${min.toLocaleString("es-ES")} – ${fmt(max)}`;
  if (min != null) return `Desde ${fmt(min)}`;
  if (max != null) return `Hasta ${fmt(max)}`;
  return null;
}

export function formatPostedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

/** Ubicación legible: "Ciudad · Modalidad" o solo la modalidad si no hay ciudad. */
export function locationLabel(job: Pick<JobPublicDto, "location" | "remoteType">): string {
  const remote = REMOTE_TYPE_LABELS[job.remoteType];
  return job.location?.trim() ? `${job.location} · ${remote}` : remote;
}
