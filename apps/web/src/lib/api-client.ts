/**
 * Cliente API tipado del frontend (Sprint 07; recuperación de sesión añadida por
 * la unidad SESSION_CONTINUITY_AND_401_RECOVERY).
 *
 * - Base URL desde `NEXT_PUBLIC_API_BASE_URL` (sin hardcodear; sin secretos).
 * - `credentials: "include"` para que viaje la cookie httpOnly del backend.
 * - `Authorization: Bearer <token>` solo si se pasa un token (nunca se loguea).
 * - Soporta 204 sin cuerpo y respuestas JSON "bare" o envueltas.
 * - Ante respuesta no-ok, parsea `{ error: { code, message, details? } }` y
 *   lanza `ApiClientError` con status/code/message/details.
 * - Recuperación centralizada de `401` para `apiRequest` y `apiUpload`: un solo
 *   refresh compartido (single-flight) y un único reintento de la petición
 *   original. Ver `docs/specs/features/session-continuity-401-recovery.md`.
 *
 * Este módulo no importa nada de React: el puente con el contexto de sesión se
 * inyecta desde fuera mediante `registerAuthBridge`.
 */
import type { ApiErrorBody, AuthResponseDto } from "@/types/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly missingFields?: string[];

  constructor(status: number, code: string, message: string, details?: unknown, missingFields?: string[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.missingFields = missingFields;
  }
}

/** True si el error corresponde a una sesión expirada / no autorizada (401). */
export function isSessionExpiredError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.status === 401;
}

/** Alias semántico de {@link isSessionExpiredError}. */
export const isUnauthorizedError = isSessionExpiredError;

/**
 * Error de un refresh que no pudo completarse por causas transitorias (5xx, red,
 * configuración ausente). Lleva `status 0` a propósito: NO es un 401, de modo que
 * `isSessionExpiredError` devuelve `false` y las features lo tratan por su rama de
 * error genérico con reintento manual, sin declarar la sesión inválida.
 */
export const REFRESH_UNAVAILABLE = "REFRESH_UNAVAILABLE";
export const SESSION_RECOVERY_CANCELLED = "SESSION_RECOVERY_CANCELLED";

export function isRefreshUnavailableError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.code === REFRESH_UNAVAILABLE;
}

function refreshUnavailableError(): ApiClientError {
  return new ApiClientError(
    0,
    REFRESH_UNAVAILABLE,
    "No se ha podido verificar tu sesión. Inténtalo de nuevo."
  );
}

function sessionRecoveryCancelledError(): ApiClientError {
  return new ApiClientError(
    0,
    SESSION_RECOVERY_CANCELLED,
    "La recuperación de sesión se canceló porque la sesión cambió."
  );
}

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base || base.trim().length === 0) {
    throw new ApiClientError(
      0,
      "CONFIG_ERROR",
      "NEXT_PUBLIC_API_BASE_URL no está configurada. Define la URL base del backend."
    );
  }
  return base.trim().replace(/\/+$/, "");
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}

/** Base URL del backend normalizada, o "" si no está configurada (para URLs de assets). */
export function apiBaseUrlOrNull(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  return base && base.trim().length > 0 ? base.trim().replace(/\/+$/, "") : "";
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toApiError(status: number, data: unknown): ApiClientError {
  if (data && typeof data === "object" && "error" in data) {
    const raw = (data as { error: unknown }).error;
    if (raw && typeof raw === "object") {
      const body = raw as Partial<ApiErrorBody>;
      return new ApiClientError(
        status,
        typeof body.code === "string" ? body.code : "UNKNOWN",
        typeof body.message === "string" ? body.message : "Error de API",
        body.details,
        Array.isArray(body.missingFields) ? body.missingFields : undefined
      );
    }
  }
  return new ApiClientError(status, "UNKNOWN", `Error de API (HTTP ${status}).`);
}

async function parseResponse<T>(response: Response): Promise<T> {
  // 204 No Content (logout, delete): sin cuerpo que parsear.
  const isNoBody = response.status === 204;
  let data: unknown;
  if (!isNoBody) {
    const text = await response.text();
    data = text.length > 0 ? safeJsonParse(text) : undefined;
  }

  if (!response.ok) {
    throw toApiError(response.status, data);
  }

  return (isNoBody ? undefined : data) as T;
}

// ─── Puente con el contexto de sesión ────────────────────────────────────────

export interface AuthBridge {
  /**
   * Generación de sesión vigente. Se captura al INICIAR un refresh y se devuelve
   * al proveedor al terminar, para que un refresh que resuelva después de un
   * logout no pueda reinstalar la sesión cerrada.
   */
  getSessionGeneration(): number;
  /** Sesión renovada. Se ignora si la generación ya no es vigente. */
  onRefreshed(auth: AuthResponseDto, generation: number): void;
  /** Fallo TERMINAL de sesión. No se invoca ante fallos transitorios. */
  onSessionLost(generation: number): void;
}

let authBridge: AuthBridge | null = null;

export function registerAuthBridge(bridge: AuthBridge | null): void {
  authBridge = bridge;
}

// ─── Single-flight del refresh ───────────────────────────────────────────────

export const REFRESH_PATH = "/api/auth/refresh";

/**
 * Resultado discriminado del refresh. La distinción entre `session-lost` y
 * `transient` es lo que impide que un error de infraestructura se presente como
 * sesión inválida.
 */
export type RefreshOutcome =
  | { status: "refreshed"; accessToken: string; generation: number }
  | { status: "session-lost" }
  | { status: "transient" };

let refreshInFlight: Promise<RefreshOutcome> | null = null;

/** Solo para tests: limpia el estado de módulo entre casos. */
export function resetRefreshStateForTests(): void {
  refreshInFlight = null;
}

/**
 * Petición de bajo nivel SIN manejador de `401`. La llamada de refresh la usa,
 * de modo que es estructuralmente imposible que el refresh se intercepte a sí
 * mismo. Primera de las tres barreras contra la recursión.
 */
async function rawRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), { credentials: "include", ...init });
  return parseResponse<T>(response);
}

async function doRefresh(): Promise<RefreshOutcome> {
  // Generación en el momento de arrancar: cualquier logout posterior la invalida.
  const generation = authBridge?.getSessionGeneration() ?? 0;
  try {
    // Sin `Authorization`, sin body y sin query: la única credencial es la cookie.
    const auth = await rawRequest<AuthResponseDto>(REFRESH_PATH, {
      method: "POST",
      headers: { Accept: "application/json" }
    });
    authBridge?.onRefreshed(auth, generation);
    return { status: "refreshed", accessToken: auth.accessToken, generation };
  } catch (error) {
    // Solo un 401 del propio refresh significa que la sesión no es recuperable.
    if (error instanceof ApiClientError && error.status === 401) {
      authBridge?.onSessionLost(generation);
      return { status: "session-lost" };
    }
    // 5xx, red o configuración: NO se declara la sesión inválida.
    return { status: "transient" };
  }
}

/**
 * Refresh compartido. N peticiones que reciben `401` producen una sola llamada y
 * comparten el mismo resultado. No rechaza nunca: traduce cualquier fallo a un
 * `RefreshOutcome`.
 */
export function ensureRefreshed(): Promise<RefreshOutcome> {
  // No hay `await` entre la comprobación y la asignación: sin ventana de carrera.
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      // Sin este saneamiento, un fallo transitorio bloquearía la sesión para siempre.
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Opciones internas, no observables por las features. */
interface InternalFlags {
  /** Retry máximo = 1 por petición original. */
  __retried?: boolean;
}

function isRecoverable(error: unknown, path: string, hadToken: boolean, flags: InternalFlags): boolean {
  return (
    error instanceof ApiClientError &&
    error.status === 401 &&
    hadToken && // la petición pretendía estar autenticada (protege login/register)
    !flags.__retried && // retry máximo = 1
    path !== REFRESH_PATH // tercera barrera contra la recursión
  );
}

/**
 * Ejecuta la recuperación tras un `401`: un refresh compartido y, si tiene éxito,
 * un único reintento con el token nuevo. Devuelve el token fresco o lanza.
 */
async function recoverOrThrow(originalError: unknown): Promise<string> {
  const outcome = await ensureRefreshed();
  if (outcome.status === "refreshed") {
    const currentGeneration = authBridge?.getSessionGeneration() ?? outcome.generation;
    if (currentGeneration !== outcome.generation) {
      throw sessionRecoveryCancelledError();
    }
    return outcome.accessToken;
  }
  if (outcome.status === "transient") {
    throw refreshUnavailableError();
  }
  throw originalError; // session-lost: se propaga el 401 original
}

// ─── API pública ─────────────────────────────────────────────────────────────

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return requestWithRecovery<T>(path, options, {});
}

async function requestWithRecovery<T>(
  path: string,
  options: ApiRequestOptions,
  flags: InternalFlags
): Promise<T> {
  const { method = "GET", body, token, signal, headers: extraHeaders } = options;

  const headers: Record<string, string> = { Accept: "application/json", ...extraHeaders };
  const hasBody = body !== undefined && body !== null;
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildUrl(path), {
      method,
      credentials: "include",
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal
    });
    return await parseResponse<T>(response);
  } catch (error) {
    if (!isRecoverable(error, path, Boolean(token), flags)) throw error;
    const freshToken = await recoverOrThrow(error);
    return requestWithRecovery<T>(path, { ...options, token: freshToken }, { __retried: true });
  }
}

/**
 * Sube `multipart/form-data` (p. ej. imagen de avatar). No fija `Content-Type`:
 * el navegador añade el boundary automáticamente. Comparte con `apiRequest` la
 * recuperación de `401`, el single-flight y el retry máximo de 1; el mismo
 * `FormData` se reutiliza en el reintento.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { token?: string | null; signal?: AbortSignal } = {}
): Promise<T> {
  return uploadWithRecovery<T>(path, formData, options, {});
}

async function uploadWithRecovery<T>(
  path: string,
  formData: FormData,
  options: { token?: string | null; signal?: AbortSignal },
  flags: InternalFlags
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
      signal: options.signal
    });
    return await parseResponse<T>(response);
  } catch (error) {
    if (!isRecoverable(error, path, Boolean(options.token), flags)) throw error;
    const freshToken = await recoverOrThrow(error);
    return uploadWithRecovery<T>(path, formData, { ...options, token: freshToken }, { __retried: true });
  }
}
