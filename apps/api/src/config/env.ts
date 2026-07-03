import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 4000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return port;
};

// Opcional: normaliza string vacío o con espacios a undefined.
const optionalString = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Host/base URL global por defecto de la API de Jooble (comportamiento histórico). */
export const DEFAULT_JOOBLE_API_BASE_URL = "https://jooble.org/api";

/**
 * Resuelve el host/base URL de Jooble desde `JOOBLE_API_BASE_URL` (opcional).
 * - Si falta o está vacío → usa el default global (compatibilidad).
 * - Debe ser una URL `http:`/`https:` válida (se recomienda https); para keys
 *   regionales, p. ej. España: `https://es.jooble.org/api`.
 * - Se normaliza sin barra final para no generar doble slash al construir `base/{apiKey}`.
 * - Ante un valor inválido, falla de forma explícita (fail-fast, como `parsePort`):
 *   preferible a ingerir contra un host equivocado. No contiene secretos.
 */
export const parseJoobleBaseUrl = (value: string | undefined): string => {
  const raw = value?.trim();
  if (!raw) {
    return DEFAULT_JOOBLE_API_BASE_URL;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("JOOBLE_API_BASE_URL must be a valid http(s) URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("JOOBLE_API_BASE_URL must use http or https.");
  }
  return raw.replace(/\/+$/, "");
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parsePort(process.env.PORT),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  // Opcional y solo backend: si falta no rompe dev/test. Se exige al ejecutar la
  // ingesta real de Jooble. Nunca loguear ni exponer su valor.
  JOOBLE_API_KEY: optionalString(process.env.JOOBLE_API_KEY),
  // Host de Jooble (opcional). Default global; regionales p. ej. https://es.jooble.org/api.
  // No es secreto, pero define contra qué host se ingiere.
  JOOBLE_API_BASE_URL: parseJoobleBaseUrl(process.env.JOOBLE_API_BASE_URL)
};
