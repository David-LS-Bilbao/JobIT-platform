/**
 * Helpers de Auth sobre el cliente API (Sprint 07). Sin estado: reciben el token
 * cuando hace falta. La sesión se gestiona en `auth-context`.
 */
import { apiRequest } from "@/lib/api-client";
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto, UserDto } from "@/types/api";

export function registerCandidate(input: RegisterRequestDto): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/api/auth/register", { method: "POST", body: input });
}

export function loginCandidate(input: LoginRequestDto): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/api/auth/login", { method: "POST", body: input });
}

/** Logout: el backend revoca el refresh_token (cookie) y devuelve 204. */
export function logoutCandidate(token?: string | null): Promise<void> {
  return apiRequest<void>("/api/auth/logout", { method: "POST", token });
}

export function getCurrentUser(token: string): Promise<UserDto> {
  return apiRequest<UserDto>("/api/auth/me", { method: "GET", token });
}
