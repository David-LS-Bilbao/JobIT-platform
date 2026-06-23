import {
  joobleSearchResponseSchema,
  type JoobleSearchResponseInput
} from "./jooble.schemas.js";

/**
 * Cliente HTTP de Jooble (Fase 4C).
 *
 * Función `searchJoobleJobs` instrumentable: `fetchFn` y `apiKey` se inyectan por
 * `deps` (no se lee `process.env`), de modo que los tests no usan red ni la key real.
 * La API key viaja en el path de la URL servidor→Jooble; NUNCA se loguea ni se
 * incluye en mensajes de error. Sin lógica de negocio: solo obtiene y valida la forma.
 */

const DEFAULT_BASE_URL = "https://jooble.org/api";
const DEFAULT_TIMEOUT_MS = 10000;

/** Error base de la integración HTTP con Jooble. */
export class JoobleClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JoobleClientError";
  }
}

/** Falta la API key (ausente, vacía o solo espacios). La llamada no se intenta. */
export class JoobleConfigError extends JoobleClientError {
  constructor(message = "Jooble API key is missing") {
    super(message);
    this.name = "JoobleConfigError";
  }
}

/** Respuesta HTTP no 2xx. Expone `status`; nunca incluye la API key. */
export class JoobleHttpError extends JoobleClientError {
  constructor(public readonly status: number) {
    super(`Jooble request failed with status ${status}`);
    this.name = "JoobleHttpError";
  }
}

/** La petición se abortó por timeout. */
export class JoobleTimeoutError extends JoobleClientError {
  constructor(message = "Jooble request timed out") {
    super(message);
    this.name = "JoobleTimeoutError";
  }
}

/** La respuesta no cumple el contrato (`joobleSearchResponseSchema`). */
export class JoobleResponseError extends JoobleClientError {
  constructor(message = "Invalid Jooble response payload") {
    super(message);
    this.name = "JoobleResponseError";
  }
}

export interface JoobleSearchParams {
  keywords: string;
  location?: string;
  page?: number;
  resultOnPage?: number;
}

/**
 * Forma de `fetch` que necesita el cliente: `(url, init) => Promise<Response>`.
 * Más estrecha que `typeof fetch` (solo URL string), lo que facilita inyectar
 * un mock en los tests; el `fetch` global sigue siendo asignable como default.
 */
export type JoobleFetch = (url: string, init: RequestInit) => Promise<Response>;

export interface JoobleClientDeps {
  apiKey: string;
  fetchFn?: JoobleFetch;
  baseUrl?: string;
  timeoutMs?: number;
}

function buildRequestBody(params: JoobleSearchParams): Record<string, unknown> {
  const body: Record<string, unknown> = { keywords: params.keywords };
  if (params.location !== undefined) {
    body.location = params.location;
  }
  if (params.page !== undefined) {
    body.page = params.page;
  }
  if (params.resultOnPage !== undefined) {
    body.ResultOnPage = params.resultOnPage;
  }
  return body;
}

export async function searchJoobleJobs(
  params: JoobleSearchParams,
  deps: JoobleClientDeps
): Promise<JoobleSearchResponseInput> {
  const {
    apiKey,
    fetchFn = fetch,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = deps;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new JoobleConfigError();
  }

  const url = `${baseUrl}/${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(params)),
      signal: controller.signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new JoobleTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  // No 2xx: nunca se incluye la URL (con la key) ni la key en el error.
  if (!response.ok) {
    throw new JoobleHttpError(response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new JoobleResponseError();
  }

  const parsed = joobleSearchResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new JoobleResponseError();
  }

  return parsed.data;
}
