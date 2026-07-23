"use client";

import { useState, type KeyboardEvent } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { ProfileLinkDto, ProfileLinkType } from "@/types/api";

import { replaceProfileLinks } from "./profile-api";

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const TYPE_OPTIONS: ReadonlyArray<{ value: ProfileLinkType; label: string }> = [
  { value: "GITHUB", label: "GitHub" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "OTHER", label: "Otro" }
];

const controlClass =
  "rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition-shadow focus:border-jobit-brand focus:ring-2 focus:ring-jobit-brand/40";

interface LinkRow {
  type: ProfileLinkType;
  url: string;
}

/** URL http/https válida (validación cliente; el backend es la fuente de verdad). */
function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 400) return "Revisa los datos de los enlaces.";
    return err.message;
  }
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

/**
 * Sección Enlaces. El backend expone `PUT /api/profile/me/links`, que REEMPLAZA
 * la lista completa (no hay endpoints por-enlace). Editamos la lista en local
 * (añadir/editar/eliminar filas) y persistimos todo de una vez. El backend exige
 * ≥1 enlace, así que no se permite guardar una lista vacía. Tras guardar,
 * `onChanged` re-obtiene el perfil (preview + completitud).
 */
export function ProfileLinksSection({
  links,
  token,
  onChanged
}: {
  links: ReadonlyArray<ProfileLinkDto>;
  token: string;
  onChanged: () => Promise<void> | void;
}) {
  const [rows, setRows] = useState<LinkRow[]>(() => links.map((l) => ({ type: l.type, url: l.url })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchRow(index: number, patch: Partial<LinkRow>) {
    setError(null);
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setError(null);
    setRows((rs) => [...rs, { type: "GITHUB", url: "" }]);
  }
  function removeRow(index: number) {
    setError(null);
    setRows((rs) => rs.filter((_, i) => i !== index));
  }
  function onEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // evita enviar el form de datos básicos
    }
  }

  async function handleSave() {
    if (rows.length === 0) {
      setError("Añade al menos un enlace válido.");
      return;
    }
    if (rows.some((r) => !r.url.trim())) {
      setError("Completa la URL o elimina la fila.");
      return;
    }
    if (rows.some((r) => !isValidHttpUrl(r.url.trim()))) {
      setError("La URL debe empezar por http:// o https://.");
      return;
    }
    const cleaned = rows.map((r) => ({ type: r.type, url: r.url.trim() }));
    setError(null);
    setSaving(true);
    try {
      await replaceProfileLinks(token, { links: cleaned });
      await onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className={`${controlClass} w-full sm:w-40`}
                value={row.type}
                onChange={(e) => patchRow(index, { type: e.target.value as ProfileLinkType })}
                aria-label={`Tipo del enlace ${index + 1}`}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                className={`${controlClass} w-full min-w-0 sm:flex-1`}
                value={row.url}
                onChange={(e) => patchRow(index, { url: e.target.value })}
                onKeyDown={onEnter}
                placeholder="https://github.com/tu-usuario"
                aria-label={`URL del enlace ${index + 1}`}
                inputMode="url"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={saving}
                aria-label={`Eliminar enlace ${index + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 disabled:opacity-50 sm:self-auto"
              >
                <IconClose />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Aún no has añadido enlaces. Añade tu GitHub, LinkedIn o portfolio.</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={addRow}
          disabled={saving}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          + Añadir enlace
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-jobit-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar enlaces"}
        </button>
      </div>
      <p className="text-xs text-slate-600">Los cambios se guardan al pulsar «Guardar».</p>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
