"use client";

/**
 * Sesión del candidato en memoria (Sprint 07; ampliada en 21D).
 *
 * Decisión cerrada (ADR-0006): el `accessToken` vive SOLO en estado de React.
 * No se usa localStorage, sessionStorage ni cookies desde JS. Al recargar la
 * página la sesión se pierde y el candidato debe re-loguearse.
 *
 * Sprint 21D añade, sin persistencia:
 * - `candidateIdentity`: snapshot ligero (nombre/headline/avatar) para el header
 *   (NAV-02), cargado una vez por sesión con `getMyProfile`.
 * - `endReason`: motivo de fin de sesión ("logout" | "expired" | null) para el
 *   aviso contextual de /login (FLOW-02), sin cambiar ADR-0006.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isSessionExpiredError } from "@/lib/api-client";
import type { AuthResponseDto, UserDto } from "@/types/api";

import { loadCandidateIdentity, type CandidateIdentity } from "./auth-identity";
import type { SessionEndReason } from "./auth-navigation";

export type { CandidateIdentity };

export interface AuthContextValue {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  candidateIdentity: CandidateIdentity | null;
  identityResolved: boolean;
  endReason: SessionEndReason;
  setSession: (auth: AuthResponseDto) => void;
  clearSession: (reason?: Exclude<SessionEndReason, null>) => void;
  updateCandidateIdentity: (identity: CandidateIdentity) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [candidateIdentity, setCandidateIdentity] = useState<CandidateIdentity | null>(null);
  const [identityResolved, setIdentityResolved] = useState(false);
  const [endReason, setEndReason] = useState<SessionEndReason>(null);

  const setSession = useCallback((auth: AuthResponseDto) => {
    setAccessToken(auth.accessToken);
    setUser(auth.user);
    setCandidateIdentity(null);
    setIdentityResolved(false);
    setEndReason(null);
  }, []);

  const clearSession = useCallback((reason?: Exclude<SessionEndReason, null>) => {
    setAccessToken(null);
    setUser(null);
    setCandidateIdentity(null);
    setIdentityResolved(false);
    setEndReason(reason ?? null);
  }, []);

  const updateCandidateIdentity = useCallback((identity: CandidateIdentity) => {
    setCandidateIdentity(identity);
    setIdentityResolved(true);
  }, []);

  // Identidad session-scoped: una lectura por sesión autenticada. No bloquea el
  // contenido privado (el header usa fallbacks hasta resolver). 401 → expired;
  // error no-401 → fallback (sesión intacta).
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    loadCandidateIdentity(accessToken)
      .then((identity) => {
        if (cancelled) return;
        setCandidateIdentity(identity);
        setIdentityResolved(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isSessionExpiredError(err)) {
          clearSession("expired");
          return;
        }
        setCandidateIdentity(null);
        setIdentityResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: accessToken !== null,
      candidateIdentity,
      identityResolved,
      endReason,
      setSession,
      clearSession,
      updateCandidateIdentity
    }),
    [
      accessToken,
      user,
      candidateIdentity,
      identityResolved,
      endReason,
      setSession,
      clearSession,
      updateCandidateIdentity
    ]
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
