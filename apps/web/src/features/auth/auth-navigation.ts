/**
 * Navegación de sesión (FLOW-02, Sprint 21D). Centraliza las redirecciones a
 * `/login` con el motivo contextual, evitando implementaciones divergentes en las
 * guardas y handlers 401 de las rutas privadas. Sin persistencia (ADR-0006).
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
 * Redirección de una guarda privada ante sesión ausente, respetando el motivo de
 * fin de sesión: un logout intencional ya navegó sin aviso; una expiración muestra
 * `expired`; la ausencia genuina (recarga/deep-link) muestra `required`.
 */
export function redirectOnMissingSession(router: RouterLike, endReason: SessionEndReason): void {
  if (endReason === "logout") return;
  redirectToLogin(router, endReason === "expired" ? "expired" : "required");
}
