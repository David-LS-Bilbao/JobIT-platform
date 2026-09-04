/**
 * Ciclo de vida de la cuenta: exportación y borrado permanente.
 *
 * Spec: `docs/specs/features/account-lifecycle.md`.
 *
 * Ambas operaciones exigen step-up con la contraseña actual. La contraseña viaja
 * en el cuerpo de un `POST`/`DELETE`, nunca en la URL: así no acaba en el
 * historial del navegador ni en un log de acceso.
 */
import { apiRequest } from "@/lib/api-client";

export interface AccountExportDto {
  version: string;
  exportedAt: string;
  account: { id: string; email: string; role: string; createdAt: string };
  profile: Record<string, unknown> | null;
  portfolio: Record<string, unknown> | null;
  savedJobs: unknown[];
}

/** `POST /api/auth/me/export` → documento con los datos del titular. */
export function exportMyAccount(token: string, password: string): Promise<AccountExportDto> {
  return apiRequest<AccountExportDto>("/api/auth/me/export", {
    method: "POST",
    token,
    body: { password }
  });
}

/**
 * `DELETE /api/auth/me` → 204. Irreversible.
 *
 * `confirmation` viaja fijo desde aquí: el backend exige la palabra exacta y la
 * interfaz ya ha comprobado que la persona la tecleó.
 */
export function deleteMyAccount(token: string, password: string): Promise<void> {
  return apiRequest<void>("/api/auth/me", {
    method: "DELETE",
    token,
    body: { password, confirmation: "DELETE" }
  });
}

/** Nombre estable del fichero de exportación descargado. */
export function accountExportFilename(exportedAt: string): string {
  const stamp = exportedAt.slice(0, 10);
  return `jobit-datos-${stamp}.json`;
}
