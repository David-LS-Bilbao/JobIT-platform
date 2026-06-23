import { URL } from "node:url";

import type {
  JoobleJobPayload,
  NormalizedExternalJob,
  RemoteTypeDto
} from "./jooble.types.js";

/** Error de normalización a nivel de un job individual de Jooble. */
export class JoobleNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JoobleNormalizationError";
  }
}

export interface NormalizeOptions {
  ingestedAt: Date;
}

const HYBRID_HINTS = ["hibrido", "híbrido", "hybrid"];
const REMOTE_HINTS = ["remoto", "remote", "teletrabajo", "100% remoto", "en remoto"];
const ON_SITE_HINTS = ["presencial", "on-site", "on site", "onsite", "oficina"];

/** Elimina tags HTML básicos y normaliza los espacios. */
const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Parseo conservador de un rango salarial que llega como string.
 * Solo devuelve cifras si hay exactamente dos números inequívocos
 * (p. ej. "45000-60000 €"). En cualquier otro caso, null/null (no se inventa).
 */
const parseSalaryRange = (raw: string): { min: number | null; max: number | null } => {
  const matches = raw.match(/\d[\d.,\s]*\d|\d/g);
  if (!matches || matches.length !== 2) {
    return { min: null, max: null };
  }

  const numbers = matches.map((match) => Number(match.replace(/[.,\s]/g, "")));
  if (numbers.some((value) => !Number.isFinite(value))) {
    return { min: null, max: null };
  }

  return { min: Math.min(...numbers), max: Math.max(...numbers) };
};

/**
 * Infiere la modalidad remota a partir de `location`, `type` y `snippet`.
 * Prioridad: HYBRID > REMOTE > ON_SITE > UNSPECIFIED.
 * Sin evidencia clara, no se asume presencial: UNSPECIFIED.
 */
const inferRemoteType = (location: string, type: string, snippet: string): RemoteTypeDto => {
  const text = `${location} ${type} ${snippet}`.toLowerCase();
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
    throw new JoobleNormalizationError(`Campo requerido vacío: ${field}`);
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
    throw new JoobleNormalizationError(`URL no absoluta en ${field}: ${trimmed}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new JoobleNormalizationError(`Protocolo no http(s) en ${field}`);
  }
  return trimmed;
};

/** Normaliza un string opcional: vacío (tras trim) → null. */
const nullIfEmpty = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

/** `type` → contractType: vacío → "unspecified"; si no, el valor sin inventar mapeos. */
const normalizeContractType = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? "unspecified" : trimmed;
};

/**
 * Normaliza una oferta cruda de Jooble a `NormalizedExternalJob`.
 *
 * Función pura: sin red, sin Prisma, sin env, sin filesystem. Lanza
 * `JoobleNormalizationError` ante datos de identidad inválidos (`id`/`link`);
 * el servicio de ingesta (Fase 4) capturará y descartará esos registros.
 */
export function normalizeJoobleJob(
  jobPayload: JoobleJobPayload,
  options: NormalizeOptions
): NormalizedExternalJob {
  const { ingestedAt } = options;
  const { min: salaryMin, max: salaryMax } = parseSalaryRange(jobPayload.salary);

  return {
    source: "JOOBLE",
    externalId: requireNonEmpty(jobPayload.id, "id"),
    sourceUrl: validateAbsoluteUrl(jobPayload.link, "link"),
    ingestedAt,
    title: requireNonEmpty(jobPayload.title, "title"),
    company: requireNonEmpty(jobPayload.company, "company"),
    location: nullIfEmpty(jobPayload.location),
    description: stripHtml(jobPayload.snippet),
    salaryMin,
    salaryMax,
    remoteType: inferRemoteType(jobPayload.location, jobPayload.type, jobPayload.snippet),
    contractType: normalizeContractType(jobPayload.type),
    postedAt: parseDateOrFallback(jobPayload.updated, ingestedAt),
    rawSource: jobPayload.source.trim()
  };
}
