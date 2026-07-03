import { URL } from "node:url";

import type {
  GreenhouseJobPayload,
  GreenhouseNamed,
  NormalizedExternalJob,
  RemoteTypeDto
} from "./greenhouse.types.js";

/** Error de normalización a nivel de una oferta individual de Greenhouse. */
export class GreenhouseNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GreenhouseNormalizationError";
  }
}

export interface NormalizeOptions {
  /** Empresa inyectada desde la lista curada (el job de Greenhouse no la trae). */
  company: string;
  ingestedAt: Date;
}

const HYBRID_HINTS = ["hibrido", "híbrido", "hybrid"];
const REMOTE_HINTS = ["remoto", "remote", "teletrabajo", "100% remoto", "en remoto"];
const ON_SITE_HINTS = ["presencial", "on-site", "on site", "onsite", "oficina"];

/** Convierte un code point a carácter; ante valor inválido devuelve "". */
const fromCodePoint = (value: number): string => {
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) {
    return "";
  }
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
};

/**
 * Decodifica de forma conservadora las entidades HTML más comunes (sin dependencias).
 * `&amp;` se resuelve al final para no re-decodificar entidades ya expandidas.
 */
const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

/**
 * Limpia el `content` de Greenhouse (HTML entity-encoded): decodifica entidades, elimina
 * tags y colapsa espacios. Conservador: no interpreta ni ejecuta nada.
 */
const cleanHtmlContent = (value: string): string =>
  decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Infiere la modalidad remota a partir de la ubicación y la descripción.
 * Prioridad: HYBRID > REMOTE > ON_SITE > UNSPECIFIED. Sin evidencia, UNSPECIFIED.
 */
const inferRemoteType = (location: string, description: string): RemoteTypeDto => {
  const text = `${location} ${description}`.toLowerCase();
  const includesAny = (hints: readonly string[]): boolean =>
    hints.some((hint) => text.includes(hint));

  if (includesAny(HYBRID_HINTS)) {
    return "HYBRID";
  }
  if (includesAny(REMOTE_HINTS)) {
    return "REMOTE";
  }
  if (includesAny(ON_SITE_HINTS)) {
    return "ON_SITE";
  }
  return "UNSPECIFIED";
};

/** Devuelve la fecha de `value` si es válida; si no, el fallback (ingestedAt). */
const parseDateOrFallback = (value: string, fallback: Date): Date => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

/** Exige un string no vacío (tras trim) para campos de identidad fuerte. */
const requireNonEmpty = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new GreenhouseNormalizationError(`Campo requerido vacío: ${field}`);
  }
  return trimmed;
};

/** Valida y devuelve una URL absoluta http(s); si no lo es, lanza. */
const validateAbsoluteUrl = (value: string, field: string): string => {
  const trimmed = value.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new GreenhouseNormalizationError(`URL no absoluta en ${field}: ${trimmed}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GreenhouseNormalizationError(`Protocolo no http(s) en ${field}`);
  }
  return trimmed;
};

/** Normaliza un string opcional: vacío (tras trim) → null. */
const nullIfEmpty = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

/** Deduplica y limpia una lista de tags (departamentos/oficinas). */
const toTags = (names: readonly GreenhouseNamed[]): string[] => {
  const cleaned = names.map((node) => node.name.trim()).filter((name) => name.length > 0);
  return Array.from(new Set(cleaned));
};

/**
 * Normaliza una oferta cruda de un board de Greenhouse a `NormalizedExternalJob`.
 *
 * Función pura: sin red, sin Prisma, sin env. `company` se inyecta (el payload no la
 * trae). Lanza `GreenhouseNormalizationError` ante identidad inválida (`id`, `title`,
 * `absolute_url`); el ingest service capturará y descartará esos registros (`skipped`).
 */
export function normalizeGreenhouseJob(
  job: GreenhouseJobPayload,
  options: NormalizeOptions
): NormalizedExternalJob {
  const { company, ingestedAt } = options;
  const locationName = job.location?.name ?? "";
  const description = job.content ? cleanHtmlContent(job.content) : "";

  return {
    source: "GREENHOUSE",
    externalId: requireNonEmpty(job.id, "id"),
    sourceUrl: validateAbsoluteUrl(job.absolute_url, "absolute_url"),
    ingestedAt,
    title: requireNonEmpty(job.title, "title"),
    company: requireNonEmpty(company, "company"),
    location: nullIfEmpty(locationName),
    description,
    salaryMin: null,
    salaryMax: null,
    remoteType: inferRemoteType(locationName, description),
    contractType: "unspecified",
    postedAt: parseDateOrFallback(job.updated_at, ingestedAt),
    tags: toTags([...job.departments, ...job.offices])
  };
}
