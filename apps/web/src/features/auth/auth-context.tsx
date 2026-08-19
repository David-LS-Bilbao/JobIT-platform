"use client";

/**
 * Sesión del candidato en memoria (Sprint 07; ampliada en 21D y por la unidad
 * SESSION_CONTINUITY_AND_401_RECOVERY).
 *
 * Decisión conservada (ADR-0006): el `accessToken` vive SOLO en estado de React.
 * No se usa localStorage, sessionStorage ni cookies desde JS.
 *
 * Novedad (ADR-0014): al arrancar la app se intenta UNA recuperación de sesión
 * contra `POST /api/auth/refresh` usando la cookie httpOnly. El resultado se
 * refleja en `sessionStatus`, que distingue cuatro situaciones y evita tanto
 * mostrar contenido privado sin sesión como declarar la sesión inválida por un
 * fallo transitorio de infraestructura.
 *
 * Sprint 21D se mantiene sin cambios:
 * - `candidateIdentity`: snapshot ligero para el header (NAV-02).
 * - `endReason`: motivo de fin de sesión para el aviso contextual de /login.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import {
  ensureRefreshed,
  isSessionExpiredError,
  registerAuthBridge,
  type AuthBridge
} from "@/lib/api-client";
import type { AuthResponseDto, UserDto } from "@/types/api";

import { loadCandidateIdentity, type CandidateIdentity } from "./auth-identity";
import type { SessionEndReason } from "./auth-navigation";

export type { CandidateIdentity };

/**
 * Estado del arranque de sesión.
 *
 * - `bootstrapping`: se está intentando recuperar la sesión. Ni contenido
 *   privado ni redirección: todavía no se sabe nada.
 * - `authenticated`: hay access token real en memoria.
 * - `anonymous`: TERMINAL. No hay sesión recuperable; procede la redirección.
 * - `unavailable`: TRANSITORIO. No se ha podido determinar el estado (5xx, red).
 *   NO significa sesión inválida: no se limpia nada, no se redirige y la
 *   recuperación es a iniciativa del usuario.
 */
export type SessionStatus = "bootstrapping" | "authenticated" | "anonymous" | "unavailable";

export interface AuthContextValue {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  sessionStatus: SessionStatus;
  candidateIdentity: CandidateIdentity | null;
  identityResolved: boolean;
  endReason: SessionEndReason;
  setSession: (auth: AuthResponseDto) => void;
  clearSession: (reason?: Exclude<SessionEndReason, null>) => void;
  updateCandidateIdentity: (identity: CandidateIdentity) => void;
  /** Reintento manual del arranque, para el estado `unavailable`. */
  retryBootstrap: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [candidateIdentity, setCandidateIdentity] = useState<CandidateIdentity | null>(null);
  const [identityResolved, setIdentityResolved] = useState(false);
  const [endReason, setEndReason] = useState<SessionEndReason>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("bootstrapping");
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  /**
   * Generación de sesión. `clearSession` la incrementa, de modo que un refresh
   * que resuelva DESPUÉS de un logout no pueda reinstalar la sesión cerrada.
   */
  const generationRef = useRef(0);

  const setSession = useCallback((auth: AuthResponseDto) => {
    setAccessToken(auth.accessToken);
    setUser(auth.user);
    setCandidateIdentity(null);
    setIdentityResolved(false);
    setEndReason(null);
    setSessionStatus("authenticated");
  }, []);

  const clearSession = useCallback((reason?: Exclude<SessionEndReason, null>) => {
    generationRef.current += 1;
    setAccessToken(null);
    setUser(null);
    setCandidateIdentity(null);
    setIdentityResolved(false);
    setEndReason(reason ?? null);
    setSessionStatus("anonymous");
  }, []);

  const updateCandidateIdentity = useCallback((identity: CandidateIdentity) => {
    setCandidateIdentity(identity);
    setIdentityResolved(true);
  }, []);

  const retryBootstrap = useCallback(() => {
    setSessionStatus("bootstrapping");
    setBootstrapAttempt((n) => n + 1);
  }, []);

  // Espejo del token para que el bridge lea siempre el valor vigente sin
  // reinstalarse en cada cambio.
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Puente para el cliente API: le permite instalar una sesión renovada y avisar
  // de un fallo TERMINAL, sin que `api-client` dependa de React. La generación
  // se compara con la capturada al iniciar el refresh: si hubo un logout por
  // medio, el resultado se descarta.
  useEffect(() => {
    const bridge: AuthBridge = {
      getAccessToken: () => accessTokenRef.current,
      getSessionGeneration: () => generationRef.current,
      onRefreshed: (auth, generation) => {
        if (generation !== generationRef.current) return;
        setSession(auth);
      },
      onSessionLost: (generation) => {
        if (generation !== generationRef.current) return;
        clearSession("expired");
      }
    };
    registerAuthBridge(bridge);
    return () => registerAuthBridge(null);
  }, [setSession, clearSession]);

  // Arranque: UN solo intento de recuperación por montaje (o por reintento
  // manual). Sin bucle, sin temporizador.
  useEffect(() => {
    let cancelled = false;
    const generationAtStart = generationRef.current;

    ensureRefreshed()
      .then((outcome) => {
        if (cancelled || generationAtStart !== generationRef.current) return;
        if (outcome.status === "refreshed") {
          // `onRefreshed` del bridge ya instaló la sesión; si no llegó a hacerlo
          // (bridge no registrado), el estado se resuelve igualmente.
          setSessionStatus((current) => (current === "bootstrapping" ? "authenticated" : current));
          return;
        }
        if (outcome.status === "transient") {
          // Fallo transitorio: NO se limpia la sesión ni se declara expirada.
          setSessionStatus("unavailable");
          return;
        }
        setSessionStatus("anonymous");
      })
      .catch(() => {
        if (cancelled) return;
        setSessionStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrapAttempt]);

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
      sessionStatus,
      candidateIdentity,
      identityResolved,
      endReason,
      setSession,
      clearSession,
      updateCandidateIdentity,
      retryBootstrap
    }),
    [
      accessToken,
      user,
      sessionStatus,
      candidateIdentity,
      identityResolved,
      endReason,
      setSession,
      clearSession,
      updateCandidateIdentity,
      retryBootstrap
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
