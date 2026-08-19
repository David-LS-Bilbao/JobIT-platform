/**
 * Navegación de sesión (FLOW-02, Sprint 21D). Centraliza las redirecciones a
 * `/login` con el motivo contextual, evitando implementaciones divergentes en las
 * guardas y handlers 401 de las rutas privadas. El access token sigue sin
 * persistirse (ADR-0006); la sesión se recupera al arrancar desde la cookie
 * httpOnly (ADR-0014).
 *
 * La decisión de CUÁNDO redirigir vive en `use-session-guard.ts`: solo el estado
 * terminal `anonymous` redirige. Ni el arranque en curso (`bootstrapping`) ni un
 * fallo transitorio (`unavailable`) permiten concluir que no hay sesión.
 */

export type LoginReason = "required" | "expired";
export type SessionEndReason = "logout" | "expired" | null;

/** Contrato mínimo del router (solo el método real usado); evita tipos internos de next/dist. */
export interface RouterLike {
  push: (href: string) => void;
}

/** Redirige a `/login`, opcionalmente con un motivo contextual. */
export function redirectToLogin(router: RouterLike, reason?: LoginReason): void {
  router.push(reason ? `/login?reason=${reason}` : "/login");
}

/**
 * Redirección de una guarda privada ante sesión TERMINALMENTE ausente, respetando
 * el motivo de fin de sesión: un logout intencional ya navegó sin aviso; una
 * expiración muestra `expired`; la ausencia genuina (deep-link, o recarga sin
 * cookie válida) muestra `required`.
 *
 * No debe invocarse durante el arranque ni ante un fallo transitorio: en ambos
 * casos la ausencia de token no significa ausencia de sesión.
 */
export function redirectOnMissingSession(router: RouterLike, endReason: SessionEndReason): void {
  if (endReason === "logout") return;
  redirectToLogin(router, endReason === "expired" ? "expired" : "required");
}
