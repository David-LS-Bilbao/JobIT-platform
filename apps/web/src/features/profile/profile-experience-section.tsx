"use client";

import { useState, type KeyboardEvent } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { CreateProfileExperienceInput, ProfileExperienceDto } from "@/types/api";

import { addProfileExperience, deleteProfileExperience, updateProfileExperience } from "./profile-api";
import { formatDateRange } from "./profile-format";

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M4 20h4L18 10l-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition-shadow focus:border-jobit-brand focus:ring-2 focus:ring-jobit-brand/40";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

interface ExperienceFormValues {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string;
}

const EMPTY_VALUES: ExperienceFormValues = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  current: false,
  location: "",
  description: ""
};

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function fromDto(exp: ProfileExperienceDto): ExperienceFormValues {
  return {
    company: exp.company,
    role: exp.role,
    startDate: toDateInput(exp.startDate),
    endDate: toDateInput(exp.endDate),
    current: exp.current,
    location: exp.location ?? "",
    description: exp.description ?? ""
  };
}

function validate(v: ExperienceFormValues): string | null {
  if (!v.company.trim() || !v.role.trim() || !v.startDate) {
    return "Empresa, puesto y fecha de inicio son obligatorios.";
  }
  if (!v.current && v.endDate && v.startDate > v.endDate) {
    return "La fecha de fin no puede ser anterior a la de inicio.";
  }
  return null;
}

/**
 * Construye el payload. En alta se omiten los opcionales vacíos; en edición
 * (`keepEmptyOptionals`) se envían como "" para poder persistir su vaciado.
 */
function buildInput(
  v: ExperienceFormValues,
  { keepEmptyOptionals = false }: { keepEmptyOptionals?: boolean } = {}
): CreateProfileExperienceInput {
  const description = v.description.trim();
  const location = v.location.trim();
  return {
    company: v.company.trim(),
    role: v.role.trim(),
    startDate: v.startDate,
    current: v.current,
    endDate: v.current ? null : v.endDate ? v.endDate : null,
    ...(description || keepEmptyOptionals ? { description } : {}),
    ...(location || keepEmptyOptionals ? { location } : {})
  };
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 400) return "Revisa los datos de la experiencia.";
    return err.message;
  }
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

/** Campos controlados compartidos por el formulario de alta y el de edición. */
function ExperienceFields({
  values,
  onPatch,
  idPrefix
}: {
  values: ExperienceFormValues;
  onPatch: (patch: Partial<ExperienceFormValues>) => void;
  idPrefix: string;
}) {
  function onEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // evita enviar el form de datos básicos
    }
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-company`} className={labelClass}>
          Empresa
        </label>
        <input
          id={`${idPrefix}-company`}
          className={inputClass}
          value={values.company}
          onChange={(e) => onPatch({ company: e.target.value })}
          onKeyDown={onEnter}
          placeholder="ACME"
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-role`} className={labelClass}>
          Puesto
        </label>
        <input
          id={`${idPrefix}-role`}
          className={inputClass}
          value={values.role}
          onChange={(e) => onPatch({ role: e.target.value })}
          onKeyDown={onEnter}
          placeholder="Frontend Developer"
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-start`} className={labelClass}>
          Fecha de inicio
        </label>
        <input
          id={`${idPrefix}-start`}
          type="date"
          className={inputClass}
          value={values.startDate}
          onChange={(e) => onPatch({ startDate: e.target.value })}
          onKeyDown={onEnter}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-end`} className={labelClass}>
          Fecha de fin
        </label>
        <input
          id={`${idPrefix}-end`}
          type="date"
          className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
          value={values.endDate}
          disabled={values.current}
          onChange={(e) => onPatch({ endDate: e.target.value })}
          onKeyDown={onEnter}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-location`} className={labelClass}>
          Ubicación (opcional)
        </label>
        <input
          id={`${idPrefix}-location`}
          className={inputClass}
          value={values.location}
          onChange={(e) => onPatch({ location: e.target.value })}
          onKeyDown={onEnter}
          placeholder="Bilbao · Remoto"
          maxLength={120}
        />
      </div>
      <div className="flex items-end">
        <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-100">
          <input
            type="checkbox"
            checked={values.current}
            onChange={(e) => onPatch({ current: e.target.checked, ...(e.target.checked ? { endDate: "" } : {}) })}
            className="h-4 w-4 rounded border-slate-300 text-jobit-brand focus:ring-jobit-brand"
          />
          <span className="text-sm text-slate-700">Actualmente trabajo aquí</span>
        </label>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
          Descripción (opcional)
        </label>
        <textarea
          id={`${idPrefix}-description`}
          rows={2}
          className={inputClass}
          value={values.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          placeholder="Responsabilidades y logros principales…"
          maxLength={1000}
        />
      </div>
    </div>
  );
}

/**
 * Sección Experiencia con CRUD frontend completo: listar, añadir (POST), editar
 * inline (PUT) y eliminar (DELETE). "Actualmente trabajo aquí" fuerza endDate
 * nulo. Tras cada cambio, `onChanged` re-obtiene el perfil (preview + completitud).
 */
export function ProfileExperienceSection({
  experiences,
  token,
  onChanged
}: {
  experiences: ReadonlyArray<ProfileExperienceDto>;
  token: string;
  onChanged: () => Promise<void> | void;
}) {
  const [addValues, setAddValues] = useState<ExperienceFormValues>(EMPTY_VALUES);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ExperienceFormValues>(EMPTY_VALUES);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const busy = adding || savingEdit || deletingId !== null;

  const patchAdd = (patch: Partial<ExperienceFormValues>) => setAddValues((v) => ({ ...v, ...patch }));
  const patchEdit = (patch: Partial<ExperienceFormValues>) => setEditValues((v) => ({ ...v, ...patch }));

  async function handleAdd() {
    const err = validate(addValues);
    if (err) {
      setAddError(err);
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await addProfileExperience(token, buildInput(addValues));
      setAddValues(EMPTY_VALUES);
      await onChanged();
    } catch (e) {
      setAddError(errorMessage(e));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(exp: ProfileExperienceDto) {
    setEditError(null);
    setEditingId(exp.id);
    setEditValues(fromDto(exp));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const err = validate(editValues);
    if (err) {
      setEditError(err);
      return;
    }
    setEditError(null);
    setSavingEdit(true);
    try {
      await updateProfileExperience(token, editingId, buildInput(editValues, { keepEmptyOptionals: true }));
      await onChanged();
      setEditingId(null);
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(experience: ProfileExperienceDto) {
    setDeletingId(experience.id);
    try {
      await deleteProfileExperience(token, experience.id);
      await onChanged();
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {experiences.length > 0 ? (
        <ul className="space-y-4">
          {experiences.map((exp) =>
            editingId === exp.id ? (
              <li key={exp.id} className="border-l-2 border-jobit-brand pl-4">
                <div role="group" aria-label={`Editar experiencia en ${exp.company}`} className="space-y-3">
                  <ExperienceFields values={editValues} onPatch={patchEdit} idPrefix={`exp-edit-${exp.id}`} />
                  {editError ? (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {editError}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit()}
                      disabled={savingEdit}
                      className="rounded-lg bg-jobit-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark disabled:opacity-60"
                    >
                      {savingEdit ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              </li>
            ) : (
              <li key={exp.id} className="border-l-2 border-slate-100 pl-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{exp.role}</p>
                    <p className="text-sm text-slate-600">
                      {exp.company}
                      {exp.location?.trim() ? ` · ${exp.location}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</p>
                    {exp.description?.trim() ? <p className="mt-1 text-sm text-slate-600">{exp.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(exp)}
                      disabled={busy}
                      aria-label={`Editar ${exp.role} en ${exp.company}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-jobit-brand disabled:opacity-50"
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(exp)}
                      disabled={busy}
                      aria-label={`Eliminar experiencia en ${exp.company}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
                    >
                      <IconClose />
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Aún no has añadido experiencia profesional.</p>
      )}

      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <ExperienceFields values={addValues} onPatch={patchAdd} idPrefix="exp-add" />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding}
            className="w-full whitespace-nowrap rounded-lg bg-jobit-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark disabled:opacity-60 sm:w-auto"
          >
            {adding ? "Añadiendo…" : "Añadir experiencia"}
          </button>
        </div>
        {addError ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {addError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
