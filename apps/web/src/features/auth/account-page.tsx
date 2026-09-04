"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { ErrorState } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/auth-context";
import { redirectToLogin } from "@/features/auth/auth-navigation";
import { useSessionGuard } from "@/features/auth/use-session-guard";
import {
  accountExportFilename,
  deleteMyAccount,
  exportMyAccount
} from "@/features/auth/account-api";
import { isSessionExpiredError } from "@/lib/api-client";

/**
 * `/profile/account`: superficie mínima de ciclo de vida de la cuenta.
 *
 * Spec: `docs/specs/features/account-lifecycle.md`.
 *
 * Dos bloques y nada más: exportar los datos y borrar la cuenta. Sin asistente
 * por pasos, sin MFA y sin funcionalidades añadidas. El borrado es irreversible,
 * así que exige contraseña y teclear la palabra exacta `DELETE`.
 */

const CONFIRMATION_WORD = "DELETE";

/** Dispara la descarga del documento de exportación sin dejarlo en ningún servidor. */
function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AccountPage() {
  const router = useRouter();
  const { clearSession } = useAuth();
  const sessionGuard = useSessionGuard(router);

  const [exportPassword, setExportPassword] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const token = sessionGuard.state === "ready" ? sessionGuard.accessToken : null;
  const canDelete = deletePassword.length > 0 && deleteConfirmation === CONFIRMATION_WORD;

  async function handleExport(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!token || exportBusy) return;

    setExportBusy(true);
    setExportError(null);
    setExportDone(false);
    try {
      const document_ = await exportMyAccount(token, exportPassword);
      downloadJson(document_, accountExportFilename(document_.exportedAt));
      setExportPassword("");
      setExportDone(true);
    } catch (error: unknown) {
      // El backend responde con el mismo 401 genérico para token inválido y para
      // contraseña incorrecta. Aquí no se puede —ni se debe— distinguir: el
      // mensaje cubre ambas causas sin confirmar cuál fue.
      setExportError(
        isSessionExpiredError(error)
          ? "No hemos podido verificar tu contraseña. Revísala e inténtalo de nuevo."
          : "No se han podido exportar tus datos. Inténtalo de nuevo."
      );
    } finally {
      setExportBusy(false);
    }
  }

  async function handleDelete(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!token || deleteBusy || !canDelete) return;

    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteMyAccount(token, deletePassword);
      // La cuenta ya no existe: se limpia la sesión local y se sale del área
      // privada. Cualquier petición posterior con el token viejo recibiría 401.
      clearSession("logout");
      redirectToLogin(router);
    } catch (error: unknown) {
      setDeleteError(
        isSessionExpiredError(error)
          ? "No hemos podido verificar tu contraseña. Revísala e inténtalo de nuevo."
          : "No se ha podido borrar la cuenta. Inténtalo de nuevo."
      );
      setDeleteBusy(false);
    }
  }

  let body: ReactNode;
  if (sessionGuard.state === "unavailable") {
    body = (
      <ErrorState
        title="No se ha podido verificar tu sesión."
        description="No hemos podido comprobar si tu sesión sigue activa. Revisa tu conexión e inténtalo de nuevo."
        onRetry={sessionGuard.retry}
      />
    );
  } else if (sessionGuard.state !== "ready") {
    body = <p className="text-sm text-slate-600">Comprobando tu sesión…</p>;
  } else {
    body = (
      <div className="flex flex-col gap-8">
        <section aria-labelledby="my-data-heading" className="rounded-lg border border-slate-200 p-6">
          <h2 id="my-data-heading" className="text-lg font-semibold text-slate-900">
            Mis datos
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Descarga una copia de los datos de tu cuenta: perfil, formación, experiencia, proyectos,
            enlaces, preferencias, portfolio y ofertas guardadas.
          </p>
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleExport}>
            <label className="text-sm font-medium text-slate-700" htmlFor="export-password">
              Confirma tu contraseña
            </label>
            <input
              id="export-password"
              type="password"
              autoComplete="current-password"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={exportPassword}
              onChange={(event) => setExportPassword(event.target.value)}
              required
            />
            {exportError ? (
              <p role="alert" className="text-sm text-red-600">
                {exportError}
              </p>
            ) : null}
            {exportDone ? (
              <p role="status" className="text-sm text-emerald-700">
                Descarga preparada.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={exportBusy || exportPassword.length === 0}
              className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {exportBusy ? "Preparando…" : "Exportar mis datos"}
            </button>
          </form>
        </section>

        <section aria-labelledby="danger-zone-heading" className="rounded-lg border border-red-300 p-6">
          <h2 id="danger-zone-heading" className="text-lg font-semibold text-red-700">
            Zona de peligro
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Borrar tu cuenta es <strong>permanente e irreversible</strong>. Se eliminan tu perfil, tu
            CV, tu portfolio público y tus ofertas guardadas. No se puede deshacer.
          </p>
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleDelete}>
            <label className="text-sm font-medium text-slate-700" htmlFor="delete-password">
              Confirma tu contraseña
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              required
            />
            <label className="text-sm font-medium text-slate-700" htmlFor="delete-confirmation">
              Escribe {CONFIRMATION_WORD} para confirmar
            </label>
            <input
              id="delete-confirmation"
              type="text"
              autoComplete="off"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              required
            />
            {deleteError ? (
              <p role="alert" className="text-sm text-red-600">
                {deleteError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={deleteBusy || !canDelete}
              className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {deleteBusy ? "Borrando…" : "Borrar mi cuenta permanentemente"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <SiteShell title="Cuenta" subtitle="Gestiona tus datos y el ciclo de vida de tu cuenta.">
      {body}
    </SiteShell>
  );
}
