/**
 * Cliente API tipado del frontend (Sprint 07).
 *
 * - Base URL desde `NEXT_PUBLIC_API_BASE_URL` (sin hardcodear; sin secretos).
 * - `credentials: "include"` para que viaje la cookie httpOnly del backend.
 * - `Authorization: Bearer <token>` solo si se pasa un token (nunca se loguea).
 * - Soporta 204 sin cuerpo y respuestas JSON "bare" o envueltas.
 * - Ante respuesta no-ok, parsea `{ error: { code, message, details? } }` y
 *   lanza `ApiClientError` con status/code/message/details.
 */
import type { ApiErrorBody } from "@/types/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** True si el error corresponde a una sesión expirada / no autorizada (401). */
export function isSessionExpiredError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.status === 401;
}

/** Alias semántico de {@link isSessionExpiredError}. */
export const isUnauthorizedError = isSessionExpiredError;

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
        body.details
      );
    }
  }
  return new ApiClientError(status, "UNKNOWN", `Error de API (HTTP ${status}).`);
}

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal, headers: extraHeaders } = options;

  const headers: Record<string, string> = { Accept: "application/json", ...extraHeaders };
  const hasBody = body !== undefined && body !== null;
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    credentials: "include",
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal
  });

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
