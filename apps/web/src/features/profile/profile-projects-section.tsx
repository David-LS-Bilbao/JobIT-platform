"use client";

import { useState, type KeyboardEvent } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { CreateProfileProjectInput, ProfileProjectDto } from "@/types/api";

import { addProfileProject, deleteProfileProject, updateProfileProject } from "./profile-api";

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

const URL_CLEAR_BLOCKED =
  "Para quitar una URL existente hace falta soporte backend. Sustitúyela por otra URL válida o cancela.";

interface ProjectFormValues {
  name: string;
  description: string;
  technologies: string; // texto separado por comas
  url: string;
  repoUrl: string;
}

const EMPTY_VALUES: ProjectFormValues = { name: "", description: "", technologies: "", url: "", repoUrl: "" };

function fromDto(project: ProfileProjectDto): ProjectFormValues {
  return {
    name: project.name,
    description: project.description ?? "",
    technologies: project.technologies.join(", "),
    url: project.url ?? "",
    repoUrl: project.repoUrl ?? ""
  };
}

/** Convierte "React, Node.js ,, React," en ["React","Node.js"] (trim, sin vacíos, sin duplicados exactos). */
function parseTechnologies(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(",")) {
    const tech = part.trim();
    if (tech && !seen.has(tech)) {
      seen.add(tech);
      result.push(tech);
    }
  }
  return result;
}

/** URL http/https válida (validación cliente; el backend es la fuente de verdad). */
function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Validación común de alta/edición: nombre, ≥1 tecnología y URLs con formato válido. */
function baseValidate(v: ProjectFormValues): { error: string | null; technologies: string[] } {
  const technologies = parseTechnologies(v.technologies);
  if (!v.name.trim()) return { error: "Indica el nombre del proyecto.", technologies };
  if (technologies.length === 0) return { error: "Añade al menos una tecnología.", technologies };
  if (v.url.trim() && !isValidUrl(v.url.trim())) return { error: "La URL de demo no es válida.", technologies };
  if (v.repoUrl.trim() && !isValidUrl(v.repoUrl.trim())) {
    return { error: "La URL del repositorio no es válida.", technologies };
  }
  return { error: null, technologies };
}

/**
 * Construye el payload. `name` y `technologies` siempre. `url`/`repoUrl` solo si
 * no están vacíos (el backend no acepta "" ni null). `description` se omite en
 * alta si está vacío; en edición (`keepEmptyDescription`) se envía como "" para
 * poder persistir su vaciado.
 */
function buildInput(
  v: ProjectFormValues,
  technologies: string[],
  { keepEmptyDescription = false }: { keepEmptyDescription?: boolean } = {}
): CreateProfileProjectInput {
  const description = v.description.trim();
  const url = v.url.trim();
  const repoUrl = v.repoUrl.trim();
  return {
    name: v.name.trim(),
    technologies,
    ...(description || keepEmptyDescription ? { description } : {}),
    ...(url ? { url } : {}),
    ...(repoUrl ? { repoUrl } : {})
  };
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 400) return "Revisa los datos del proyecto.";
    return err.message;
  }
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

/** Campos controlados compartidos por el formulario de alta y el de edición. */
function ProjectFields({
  values,
  onPatch,
  idPrefix
}: {
  values: ProjectFormValues;
  onPatch: (patch: Partial<ProjectFormValues>) => void;
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
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>
          Nombre del proyecto
        </label>
        <input
          id={`${idPrefix}-name`}
          className={inputClass}
          value={values.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          onKeyDown={onEnter}
          placeholder="design-system"
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-technologies`} className={labelClass}>
          Tecnologías (separadas por comas)
        </label>
        <input
          id={`${idPrefix}-technologies`}
          className={inputClass}
          value={values.technologies}
          onChange={(e) => onPatch({ technologies: e.target.value })}
          onKeyDown={onEnter}
          placeholder="React, Node.js, PostgreSQL"
        />
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
          placeholder="Breve descripción del proyecto…"
          maxLength={500}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-url`} className={labelClass}>
          URL demo (opcional)
        </label>
        <input
          id={`${idPrefix}-url`}
          className={inputClass}
          value={values.url}
          onChange={(e) => onPatch({ url: e.target.value })}
          onKeyDown={onEnter}
          placeholder="https://demo.example.com"
          inputMode="url"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-repo`} className={labelClass}>
          URL repositorio (opcional)
        </label>
        <input
          id={`${idPrefix}-repo`}
          className={inputClass}
          value={values.repoUrl}
          onChange={(e) => onPatch({ repoUrl: e.target.value })}
          onKeyDown={onEnter}
          placeholder="https://github.com/tu/repo"
          inputMode="url"
        />
      </div>
    </div>
  );
}

/**
 * Sección Proyectos con CRUD frontend completo: listar, añadir (POST), editar
 * inline (PUT) y eliminar (DELETE). Las tecnologías se introducen separadas por
 * comas y se normalizan a array. El backend no acepta vaciar `url`/`repoUrl`, así
 * que si un proyecto ya tenía una y se deja en blanco, se bloquea el guardado.
 * Tras cada cambio, `onChanged` re-obtiene el perfil (preview + completitud).
 */
export function ProfileProjectsSection({
  projects,
  token,
  onChanged
}: {
  projects: ReadonlyArray<ProfileProjectDto>;
  token: string;
  onChanged: () => Promise<void> | void;
}) {
  const [addValues, setAddValues] = useState<ProjectFormValues>(EMPTY_VALUES);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState<ProfileProjectDto | null>(null);
  const [editValues, setEditValues] = useState<ProjectFormValues>(EMPTY_VALUES);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const busy = adding || savingEdit || deletingId !== null;

  const patchAdd = (patch: Partial<ProjectFormValues>) => setAddValues((v) => ({ ...v, ...patch }));
  const patchEdit = (patch: Partial<ProjectFormValues>) => setEditValues((v) => ({ ...v, ...patch }));

  async function handleAdd() {
    const { error, technologies } = baseValidate(addValues);
    if (error) {
      setAddError(error);
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await addProfileProject(token, buildInput(addValues, technologies));
      setAddValues(EMPTY_VALUES);
      await onChanged();
    } catch (e) {
      setAddError(errorMessage(e));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(project: ProfileProjectDto) {
    setEditError(null);
    setEditingId(project.id);
    setEditOriginal(project);
    setEditValues(fromDto(project));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditOriginal(null);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingId || !editOriginal) return;
    const { error, technologies } = baseValidate(editValues);
    if (error) {
      setEditError(error);
      return;
    }
    // El backend no acepta vaciar una URL existente (no admite "" ni null).
    if (editOriginal.url && !editValues.url.trim()) {
      setEditError(URL_CLEAR_BLOCKED);
      return;
    }
    if (editOriginal.repoUrl && !editValues.repoUrl.trim()) {
      setEditError(URL_CLEAR_BLOCKED);
      return;
    }
    setEditError(null);
    setSavingEdit(true);
    try {
      await updateProfileProject(token, editingId, buildInput(editValues, technologies, { keepEmptyDescription: true }));
      await onChanged();
      setEditingId(null);
      setEditOriginal(null);
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(project: ProfileProjectDto) {
    setEditError(null);
    setDeletingId(project.id);
    try {
      await deleteProfileProject(token, project.id);
      await onChanged();
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {projects.length > 0 ? (
        <ul className="space-y-4">
          {projects.map((project) =>
            editingId === project.id ? (
              <li key={project.id} className="rounded-lg border border-slate-100 p-4">
                <div role="group" aria-label={`Editar proyecto ${project.name}`} className="space-y-3">
                  <ProjectFields values={editValues} onPatch={patchEdit} idPrefix={`project-edit-${project.id}`} />
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
              <li key={project.id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{project.name}</p>
                    {project.description?.trim() ? (
                      <p className="mt-0.5 text-sm text-slate-600">{project.description}</p>
                    ) : null}
                    {project.technologies.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {project.url || project.repoUrl ? (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {project.url ? (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-[#006591] hover:underline"
                          >
                            Demo
                          </a>
                        ) : null}
                        {project.repoUrl ? (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-[#006591] hover:underline"
                          >
                            Repositorio
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(project)}
                      disabled={busy}
                      aria-label={`Editar proyecto ${project.name}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#006591] disabled:opacity-50"
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project)}
                      disabled={busy}
                      aria-label={`Eliminar proyecto ${project.name}`}
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
        <p className="text-sm text-slate-500">Aún no has añadido proyectos.</p>
      )}

      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <ProjectFields values={addValues} onPatch={patchAdd} idPrefix="project-add" />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding}
            className="w-full whitespace-nowrap rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60 sm:w-auto"
          >
            {adding ? "Añadiendo…" : "Añadir proyecto"}
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
