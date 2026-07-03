/**
 * Lógica pura y testeable de la ingesta Jooble por MÚLTIPLES ubicaciones.
 *
 * No tiene efectos de arranque (no llama a red ni a DB al importarse): el runner
 * (`ingest-jooble-locations.ts`) inyecta la función de ingesta real. Así el parseo
 * de config y la orquestación se testean sin red y sin `JOOBLE_API_KEY`.
 */
import type { JoobleIngestSummary } from "../external/jooble/jooble.ingest.service.js";

/** Resultado de ingerir una ubicación (éxito con resumen, o fallo con mensaje seguro). */
export interface LocationIngestResult {
  location: string;
  ok: boolean;
  summary?: JoobleIngestSummary;
  /** Mensaje de error saneado (nunca contiene la API key: el cliente ya la excluye). */
  error?: string;
}

/** Resumen agregado de toda la ejecución multi-ubicación. */
export interface AggregatedIngestReport {
  totalLocations: number;
  succeeded: number;
  failed: number;
  fetched: number;
  normalized: number;
  created: number;
  updated: number;
  skipped: number;
  results: LocationIngestResult[];
}

/** Nº de ofertas por ubicación por defecto (el servicio/proveedor acota el máximo). */
export const DEFAULT_ING_LIMIT = 20;
const MAX_ING_LIMIT = 50;
export const DEFAULT_ING_KEYWORDS = "developer";
export const DEFAULT_ING_LOCATION = "España";

type IngestEnv = {
  ING_LOCATIONS?: string;
  ING_LOCATION?: string;
  ING_KEYWORDS?: string;
  ING_LIMIT?: string;
};

/**
 * Parsea las ubicaciones objetivo:
 * - Fuente: `ING_LOCATIONS` (CSV); si está vacía, `ING_LOCATION`; si tampoco, default.
 * - Separa por coma, hace trim, descarta vacías y **deduplica conservando el orden**
 *   (comparación insensible a mayúsculas; se conserva la primera forma vista).
 * - Nunca devuelve lista vacía: como mínimo `["España"]`.
 */
export function parseLocations(env: IngestEnv): string[] {
  const raw = env.ING_LOCATIONS?.trim() ? env.ING_LOCATIONS : env.ING_LOCATION;
  const items = (raw ?? DEFAULT_ING_LOCATION)
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const location of items) {
    const key = location.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(location);
    }
  }
  return unique.length > 0 ? unique : [DEFAULT_ING_LOCATION];
}

/** `ING_KEYWORDS` con default; nunca vacío. */
export function resolveKeywords(env: IngestEnv): string {
  return env.ING_KEYWORDS?.trim() || DEFAULT_ING_KEYWORDS;
}

/** `ING_LIMIT` por ubicación: entero en [1, 50]; ante valor inválido, usa el default. */
export function resolveLimit(env: IngestEnv): number {
  const parsed = Number(env.ING_LIMIT ?? DEFAULT_ING_LIMIT);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_ING_LIMIT;
  }
  return Math.min(parsed, MAX_ING_LIMIT);
}

export interface IngestOneParams {
  keywords: string;
  location: string;
  resultOnPage: number;
}

export type IngestOneFn = (params: IngestOneParams) => Promise<JoobleIngestSummary>;

/**
 * Orquesta la ingesta por ubicación **en serie** (no en paralelo: evita rate limiting
 * y mantiene logs legibles). Si una ubicación falla, registra el error saneado y
 * **continúa** con la siguiente (fallo parcial, no aborta). Acumula totales.
 * `ingestOne` se inyecta (el runner pasa la ingesta real; los tests, un doble).
 */
export async function orchestrateIngestion(
  locations: string[],
  opts: { keywords: string; resultOnPage: number },
  ingestOne: IngestOneFn,
  onResult?: (result: LocationIngestResult) => void
): Promise<AggregatedIngestReport> {
  const report: AggregatedIngestReport = {
    totalLocations: locations.length,
    succeeded: 0,
    failed: 0,
    fetched: 0,
    normalized: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    results: []
  };

  for (const location of locations) {
    let result: LocationIngestResult;
    try {
      const summary = await ingestOne({ keywords: opts.keywords, location, resultOnPage: opts.resultOnPage });
      report.succeeded += 1;
      report.fetched += summary.fetched;
      report.normalized += summary.normalized;
      report.created += summary.created;
      report.updated += summary.updated;
      report.skipped += summary.skipped;
      result = { location, ok: true, summary };
    } catch (err) {
      report.failed += 1;
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      result = { location, ok: false, error: message };
    }
    report.results.push(result);
    onResult?.(result);
  }

  return report;
}
