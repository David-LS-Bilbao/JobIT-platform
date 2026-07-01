"use client";

import { useState, type KeyboardEvent } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { ProfileSkillDto, SkillLevel } from "@/types/api";

import { addProfileSkill, deleteProfileSkill } from "./profile-api";
import { SKILL_LEVEL_LABELS } from "./profile-format";

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const LEVEL_OPTIONS: ReadonlyArray<{ value: SkillLevel; label: string }> = [
  { value: "BASIC", label: "Básico" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzado" }
];

const inputClass =
  "rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition-shadow focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/40";

function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 409) return "Ya has añadido esa skill.";
    if (err.status === 400) return "Revisa los datos de la skill.";
    return err.message;
  }
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

/**
 * Sección Skills funcional: lista chips reales, permite añadir (POST) y eliminar
 * (DELETE). Tras cada cambio, `onChanged` re-obtiene el perfil (para refrescar
 * preview y completitud, que dependen del backend).
 */
export function ProfileSkillsSection({
  skills,
  token,
  onChanged
}: {
  skills: ReadonlyArray<ProfileSkillDto>;
  token: string;
  onChanged: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<SkillLevel | "">("");
  const [category, setCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = adding || deletingId !== null;

  async function handleAdd() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Indica el nombre de la skill.");
      return;
    }
    setError(null);
    setAdding(true);
    try {
      await addProfileSkill(token, {
        name: trimmedName,
        ...(level ? { level } : {}),
        ...(category.trim() ? { category: category.trim() } : {})
      });
      setName("");
      setLevel("");
      setCategory("");
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(skill: ProfileSkillDto) {
    setError(null);
    setDeletingId(skill.id);
    try {
      await deleteProfileSkill(token, skill.id);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function onEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // evita enviar el form de datos básicos
      void handleAdd();
    }
  }

  return (
    <div className="space-y-4">
      {skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 py-1.5 pl-3 pr-1.5 text-sm text-slate-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#006591]" aria-hidden="true" />
                <span>{skill.name}</span>
                {skill.level ? <span className="text-xs text-slate-500">· {SKILL_LEVEL_LABELS[skill.level]}</span> : null}
                {skill.category ? <span className="text-xs text-slate-400">· {skill.category}</span> : null}
                <button
                  type="button"
                  onClick={() => void handleDelete(skill)}
                  disabled={busy}
                  aria-label={`Eliminar ${skill.name}`}
                  className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-red-600 disabled:opacity-50"
                >
                  <IconClose />
                </button>
              </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Aún no has añadido skills.</p>
      )}

      <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            className={`${inputClass} w-full min-w-0 sm:flex-1 sm:basis-48`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Nueva skill (p. ej. React)"
            aria-label="Nombre de la skill"
            maxLength={60}
          />
          <select
            className={`${inputClass} w-full sm:w-auto`}
            value={level}
            onChange={(e) => setLevel(e.target.value as SkillLevel | "")}
            aria-label="Nivel de la skill"
          >
            <option value="">Nivel (opcional)</option>
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass} w-full min-w-0 sm:flex-1 sm:basis-40`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Categoría (opcional)"
            aria-label="Categoría de la skill"
            maxLength={40}
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding}
            className="w-full shrink-0 whitespace-nowrap rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60 sm:w-auto"
          >
            {adding ? "Añadiendo…" : "Añadir skill"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
