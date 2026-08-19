"use client";

/**
 * Guarda unica de las rutas privadas (ADR-0014).
 *
 * Sustituye al efecto duplicado en las ocho paginas privadas. Traduce el
 * `sessionStatus` del contexto en la decision de render y en la redireccion,
 * evitando dos errores concretos:
 *
 * - redirigir durante el arranque, cuando todavia no se sabe si hay sesion;
 * - tratar un fallo transitorio de infraestructura como sesion invalida.
 */
import { useEffect } from "react";

import { useAuth } from "./auth-context";
import { redirectOnMissingSession, type RouterLike } from "./auth-navigation";

/**
 * Que debe pintar la pagina privada.
 *
 * - `loading`: arranque en curso. Ni contenido privado ni redireccion.
 * - `ready`: hay sesion; se pinta el contenido privado.
 * - `redirecting`: sesion terminalmente ausente; ya se ha lanzado la redireccion.
 * - `unavailable`: no se ha podido determinar el estado. Se muestra un error
 *   recuperable con reintento manual; NO se redirige ni se declara sesion
 *   invalida.
 */
export type SessionGuardState = "loading" | "ready" | "redirecting" | "unavailable";

/**
 * Union discriminada: `state: "ready"` garantiza al comprobador de tipos que hay
 * un access token, de modo que las paginas no necesitan una asercion.
 */
export type SessionGuard =
  | { state: "ready"; accessToken: string; retry: () => void }
  | {
      state: Exclude<SessionGuardState, "ready">;
      accessToken: null;
      retry: () => void;
    };

export function useSessionGuard(router: RouterLike): SessionGuard {
  const { accessToken, sessionStatus, endReason, retryBootstrap } = useAuth();

  useEffect(() => {
    // Solo el estado TERMINAL redirige. `bootstrapping` todavia no sabe nada y
    // `unavailable` no autoriza a concluir que la sesion sea invalida.
    if (sessionStatus === "anonymous") {
      redirectOnMissingSession(router, endReason);
    }
  }, [sessionStatus, endReason, router]);

  if (accessToken) {
    return { state: "ready", accessToken, retry: retryBootstrap };
  }
  if (sessionStatus === "unavailable") {
    return { state: "unavailable", accessToken: null, retry: retryBootstrap };
  }
  if (sessionStatus === "anonymous") {
    return { state: "redirecting", accessToken: null, retry: retryBootstrap };
  }
  return { state: "loading", accessToken: null, retry: retryBootstrap };
}
