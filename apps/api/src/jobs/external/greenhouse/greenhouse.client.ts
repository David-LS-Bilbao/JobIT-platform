import {
  greenhouseBoardResponseSchema,
  type GreenhouseBoardResponseInput
} from "./greenhouse.schemas.js";

/**
 * Cliente HTTP del Job Board API público de Greenhouse.
 *
 * `fetchGreenhouseBoardJobs(boardToken, deps)` con `fetchFn`/`baseUrl`/`timeoutMs`
 * inyectables por `deps` (no lee `process.env`), de modo que los tests no usan red. El
 * endpoint es PÚBLICO y sin credenciales (no hay API key que proteger). Solo obtiene y
 * valida la forma; sin lógica de negocio.
 */

const DEFAULT_BASE_URL = "https://boards-api.greenhouse.io/v1/boards";
const DEFAULT_TIMEOUT_MS = 10000;

/** Error base de la integración HTTP con Greenhouse. */
export class GreenhouseClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GreenhouseClientError";
  }
}

/** Falta el board token (ausente, vacío o solo espacios). La llamada no se intenta. */
export class GreenhouseConfigError extends GreenhouseClientError {
  constructor(message = "Greenhouse board token is missing") {
    super(message);
    this.name = "GreenhouseConfigError";
  }
}

/** Respuesta HTTP no 2xx. Expone `status`. */
export class GreenhouseHttpError extends GreenhouseClientError {
  constructor(public readonly status: number) {
    super(`Greenhouse request failed with status ${status}`);
    this.name = "GreenhouseHttpError";
  }
}

/** La petición se abortó por timeout. */
export class GreenhouseTimeoutError extends GreenhouseClientError {
  constructor(message = "Greenhouse request timed out") {
    super(message);
    this.name = "GreenhouseTimeoutError";
  }
}

/** La respuesta no cumple el contrato (`greenhouseBoardResponseSchema`). */
export class GreenhouseResponseError extends GreenhouseClientError {
  constructor(message = "Invalid Greenhouse response payload") {
    super(message);
    this.name = "GreenhouseResponseError";
  }
}

/**
 * Forma de `fetch` que necesita el cliente: `(url, init) => Promise<Response>`. Más
 * estrecha que `typeof fetch`, lo que facilita inyectar un mock en los tests; el `fetch`
 * global sigue siendo asignable como default.
 */
export type GreenhouseFetch = (url: string, init: RequestInit) => Promise<Response>;

export interface GreenhouseClientDeps {
  fetchFn?: GreenhouseFetch;
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * Lista las ofertas de un board público de Greenhouse
 * (`/{board_token}/jobs?content=true`). `content=true` incluye la descripción completa,
 * departamentos y oficinas.
 */
export async function fetchGreenhouseBoardJobs(
  boardToken: string,
  deps: GreenhouseClientDeps = {}
): Promise<GreenhouseBoardResponseInput> {
  const { fetchFn = fetch, baseUrl = DEFAULT_BASE_URL, timeoutMs = DEFAULT_TIMEOUT_MS } = deps;

  const token = boardToken?.trim();
  if (!token) {
    throw new GreenhouseConfigError();
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const url = `${normalizedBase}/${encodeURIComponent(token)}/jobs?content=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GreenhouseTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new GreenhouseHttpError(response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new GreenhouseResponseError();
  }

  const parsed = greenhouseBoardResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new GreenhouseResponseError();
  }

  return parsed.data;
}
