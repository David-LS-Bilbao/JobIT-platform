"use client";

/**
 * Sesión del candidato en memoria (Sprint 07).
 *
 * Decisión cerrada (ADR-0006): el `accessToken` vive SOLO en estado de React.
 * No se usa localStorage, sessionStorage ni cookies desde JS, y no se lee el
 * refresh_token (httpOnly). Al recargar la página la sesión se pierde y el
 * candidato debe re-loguearse (no hay endpoint de refresh).
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { AuthResponseDto, UserDto } from "@/types/api";

export interface AuthContextValue {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  setSession: (auth: AuthResponseDto) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);

  const setSession = useCallback((auth: AuthResponseDto) => {
    setAccessToken(auth.accessToken);
    setUser(auth.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: accessToken !== null,
      setSession,
      clearSession
    }),
    [accessToken, user, setSession, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return ctx;
}
