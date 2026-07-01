"use client";

import { useState, type KeyboardEvent } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { CreateProfileEducationInput, ProfileEducationDto } from "@/types/api";

import { addProfileEducation, deleteProfileEducation, updateProfileEducation } from "./profile-api";
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
  "w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition-shadow focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/40";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

interface EducationFormValues {
  institution: string;
  title: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

const EMPTY_VALUES: EducationFormValues = {
  institution: "",
  title: "",
  field: "",
  startDate: "",
  endDate: "",
  current: false
};

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function fromDto(edu: ProfileEducationDto): EducationFormValues {
  return {
    institution: edu.institution,
    title: edu.title,
    field: edu.field ?? "",
    startDate: toDateInput(edu.startDate),
    endDate: toDateInput(edu.endDate),
    current: edu.current
  };
}

function validate(v: EducationFormValues): string | null {
  if (!v.institution.trim() || !v.title.trim() || !v.startDate) {
    return "Institución, título y fecha de inicio son obligatorios.";
  }
  if (!v.current && v.endDate && v.startDate > v.endDate) {
    return "La fecha de fin no puede ser anterior a la de inicio.";
  }
  return null;
}

/**
 * Construye el payload. En alta se omite `field` vacío; en edición
 * (`keepEmptyOptionals`) se envía como "" para poder persistir su vaciado.
 */
function buildInput(
  v: EducationFormValues,
  { keepEmptyOptionals = false }: { keepEmptyOptionals?: boolean } = {}
): CreateProfileEducationInput {
  const field = v.field.trim();
  return {
    institution: v.institution.trim(),
    title: v.title.trim(),
    startDate: v.startDate,
    current: v.current,
    endDate: v.current ? null : v.endDate ? v.endDate : null,
    ...(field || keepEmptyOptionals ? { field } : {})
  };
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 400) return "Revisa los datos de la formación.";
    return err.message;
  }
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

/** Campos controlados compartidos por el formulario de alta y el de edición. */
function EducationFields({
  values,
  onPatch,
  idPrefix
}: {
  values: EducationFormValues;
  onPatch: (patch: Partial<EducationFormValues>) => void;
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
        <label htmlFor={`${idPrefix}-institution`} className={labelClass}>
          Institución
        </label>
        <input
          id={`${idPrefix}-institution`}
          className={inputClass}
          value={values.institution}
          onChange={(e) => onPatch({ institution: e.target.value })}
          onKeyDown={onEnter}
          placeholder="UPV/EHU"
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-title`} className={labelClass}>
          Título
        </label>
        <input
          id={`${idPrefix}-title`}
          className={inputClass}
          value={values.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          onKeyDown={onEnter}
          placeholder="Grado en Informática"
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-field`} className={labelClass}>
          Área / campo (opcional)
        </label>
        <input
          id={`${idPrefix}-field`}
          className={inputClass}
          value={values.field}
          onChange={(e) => onPatch({ field: e.target.value })}
          onKeyDown={onEnter}
          placeholder="Ingeniería del Software"
          maxLength={120}
        />
      </div>
      <div className="flex items-end">
        <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-100">
          <input
            type="checkbox"
            checked={values.current}
            onChange={(e) => onPatch({ current: e.target.checked, ...(e.target.checked ? { endDate: "" } : {}) })}
            className="h-4 w-4 rounded border-slate-300 text-[#006591] focus:ring-[#006591]"
          />
          <span className="text-sm text-slate-700">Formación en curso</span>
        </label>
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
    </div>
  );
}

/**
 * Sección Educación con CRUD frontend completo: listar, añadir (POST), editar
 * inline (PUT) y eliminar (DELETE). "Formación en curso" fuerza endDate nulo.
 * Tras cada cambio, `onChanged` re-obtiene el perfil (preview + completitud).
 */
export function ProfileEducationSection({
  education,
  token,
  onChanged
}: {
  education: ReadonlyArray<ProfileEducationDto>;
  token: string;
  onChanged: () => Promise<void> | void;
}) {
  const [addValues, setAddValues] = useState<EducationFormValues>(EMPTY_VALUES);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EducationFormValues>(EMPTY_VALUES);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const busy = adding || savingEdit || deletingId !== null;

  const patchAdd = (patch: Partial<EducationFormValues>) => setAddValues((v) => ({ ...v, ...patch }));
  const patchEdit = (patch: Partial<EducationFormValues>) => setEditValues((v) => ({ ...v, ...patch }));

  async function handleAdd() {
    const err = validate(addValues);
    if (err) {
      setAddError(err);
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await addProfileEducation(token, buildInput(addValues));
      setAddValues(EMPTY_VALUES);
      await onChanged();
    } catch (e) {
      setAddError(errorMessage(e));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(edu: ProfileEducationDto) {
    setEditError(null);
    setEditingId(edu.id);
    setEditValues(fromDto(edu));
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
      await updateProfileEducation(token, editingId, buildInput(editValues, { keepEmptyOptionals: true }));
      await onChanged();
      setEditingId(null);
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(edu: ProfileEducationDto) {
    setEditError(null);
    setDeletingId(edu.id);
    try {
      await deleteProfileEducation(token, edu.id);
      await onChanged();
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {education.length > 0 ? (
        <ul className="space-y-4">
          {education.map((edu) =>
            editingId === edu.id ? (
              <li key={edu.id} className="border-l-2 border-[#006591] pl-4">
                <div role="group" aria-label={`Editar formación en ${edu.institution}`} className="space-y-3">
                  <EducationFields values={editValues} onPatch={patchEdit} idPrefix={`edu-edit-${edu.id}`} />
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
                      className="rounded-lg bg-[#006591] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60"
                    >
                      {savingEdit ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              </li>
            ) : (
              <li key={edu.id} className="border-l-2 border-slate-100 pl-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{edu.title}</p>
                    <p className="text-sm text-slate-600">
                      {edu.institution}
                      {edu.field?.trim() ? ` · ${edu.field}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateRange(edu.startDate, edu.endDate, edu.current)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(edu)}
                      disabled={busy}
                      aria-label={`Editar ${edu.title} en ${edu.institution}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#006591] disabled:opacity-50"
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(edu)}
                      disabled={busy}
                      aria-label={`Eliminar formación en ${edu.institution}`}
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
        <p className="text-sm text-slate-500">Aún no has añadido formación.</p>
      )}

      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <EducationFields values={addValues} onPatch={patchAdd} idPrefix="edu-add" />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding}
            className="w-full whitespace-nowrap rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60 sm:w-auto"
          >
            {adding ? "Añadiendo…" : "Añadir formación"}
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
