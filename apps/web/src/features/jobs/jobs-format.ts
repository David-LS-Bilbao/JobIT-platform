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
  ANY: "Cualquier nivel"
};

export const JOB_SOURCE_LABELS: Record<JobSource, string> = {
  INTERNAL: "JobIT",
  JOOBLE: "Jooble",
  GREENHOUSE: "Greenhouse"
};

// `contractType` llega como string libre; humanizamos los valores conocidos.
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Jornada completa",
  PART_TIME: "Media jornada",
  CONTRACT: "Contrato",
  FREELANCE: "Freelance",
  INTERNSHIP: "Prácticas",
  TEMPORARY: "Temporal",
  UNSPECIFIED: "Sin especificar"
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

/**
 * Línea compacta de metadatos de una oferta (cards y detalle): solo dimensiones
 * con dato útil, unidas por " · ". Modalidad y contrato `UNSPECIFIED` se omiten
 * (son "sin dato" de ingesta); seniority se muestra siempre — `ANY` es
 * información real ("Cualquier nivel"), no un desconocido.
 */
export function jobMetadataLabel(
  job: Pick<JobPublicDto, "location" | "remoteType" | "seniority" | "contractType">
): string {
  const parts: string[] = [];
  const location = job.location?.trim();
  if (location) parts.push(location);
  if (job.remoteType !== "UNSPECIFIED") parts.push(REMOTE_TYPE_LABELS[job.remoteType]);
  parts.push(SENIORITY_LABELS[job.seniority]);
  const contract = job.contractType?.trim();
  if (contract && contract.toUpperCase() !== "UNSPECIFIED") parts.push(formatContractType(contract));
  return parts.join(" · ");
}

/**
 * Texto del CTA para abrir la oferta en su fuente original, según procedencia.
 * Jooble → "Abrir en Jooble"; Greenhouse → "Abrir en Greenhouse" (la oferta vive
 * en el job board de la empresa alojado por Greenhouse); el resto usa un copy
 * genérico. No inventa fuentes: solo los valores del contrato (`JobSource`).
 */
export function externalSourceCtaLabel(source: JobSource): string {
  if (source === "JOOBLE") return "Abrir en Jooble";
  if (source === "GREENHOUSE") return "Abrir en Greenhouse";
  return "Ver oferta original";
}

/**
 * Valida que una URL externa sea segura para renderizar como enlace: debe ser
 * parseable y usar protocolo `http:`/`https:`. Bloquea `javascript:`, `data:`,
 * etc. Devuelve `false` para null/undefined/vacío o URLs no válidas.
 */
export function isSafeExternalUrl(value: string | null | undefined): boolean {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
