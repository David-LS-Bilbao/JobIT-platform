"use client";

import { useState, type KeyboardEvent } from "react";

import { ApiClientError } from "@/lib/api-client";
import type {
  PreferenceSeniority,
  ProfilePreferencesDto,
  PutProfilePreferencesInput,
  RemotePreference
} from "@/types/api";

import { updateProfilePreferences } from "./profile-api";

const REMOTE_OPTIONS: ReadonlyArray<{ value: RemotePreference; label: string }> = [
  { value: "ANY", label: "Cualquiera" },
  { value: "REMOTE", label: "Remoto" },
  { value: "HYBRID", label: "Híbrido" },
  { value: "ON_SITE", label: "Presencial" }
];

const SENIORITY_OPTIONS: ReadonlyArray<{ value: PreferenceSeniority | ""; label: string }> = [
  { value: "", label: "Sin preferencia" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MID", label: "Mid" },
  { value: "SENIOR", label: "Senior" }
];

const CONTRACT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "FULL_TIME", label: "Jornada completa" },
  { value: "PART_TIME", label: "Media jornada" },
  { value: "CONTRACT", label: "Contrato/proyecto" },
  { value: "FREELANCE", label: "Freelance" }
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition-shadow focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/40";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

/** "Frontend, Frontend , Backend," → ["Frontend","Backend"] (trim, sin vacíos, sin duplicados exactos). */
function parseList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

/** "" → null; entero positivo → number; en otro caso, inválido. */
function parseSalary(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n <= 0) return { ok: false };
  return { ok: true, value: n };
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 400) return "Revisa los datos de preferencias.";
    return err.message;
  }
  return "No se han podido guardar las preferencias. Inténtalo de nuevo.";
}

/**
 * Sección Preferencias. El backend expone `PUT /api/profile/me/preferences`
 * (upsert). Se editan todos los campos en local y se persisten de una vez; los
 * arrays se envían aunque estén vacíos (el backend acepta vaciar preferencias).
 * Tras guardar, `onChanged` re-obtiene el perfil (preview + completitud).
 */
export function ProfilePreferencesSection({
  preferences,
  token,
  onChanged
}: {
  preferences: ProfilePreferencesDto | null;
  token: string;
  onChanged: () => Promise<void> | void;
}) {
  const [desiredRoles, setDesiredRoles] = useState(preferences?.desiredRoles.join(", ") ?? "");
  const [preferredLocations, setPreferredLocations] = useState(preferences?.preferredLocations.join(", ") ?? "");
  const [remotePreference, setRemotePreference] = useState<RemotePreference>(preferences?.remotePreference ?? "ANY");
  const [seniority, setSeniority] = useState<PreferenceSeniority | "">(preferences?.seniority ?? "");
  const [salaryMin, setSalaryMin] = useState(preferences?.salaryMin != null ? String(preferences.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState(preferences?.salaryMax != null ? String(preferences.salaryMax) : "");
  const [contractTypes, setContractTypes] = useState<string[]>(preferences ? [...preferences.contractTypes] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleContract(value: string) {
    setError(null);
    setContractTypes((cs) => (cs.includes(value) ? cs.filter((c) => c !== value) : [...cs, value]));
  }

  function onEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault(); // evita enviar el form de datos básicos
    }
  }

  async function handleSave() {
    const min = parseSalary(salaryMin);
    if (!min.ok) {
      setError("El salario mínimo debe ser un número entero positivo.");
      return;
    }
    const max = parseSalary(salaryMax);
    if (!max.ok) {
      setError("El salario máximo debe ser un número entero positivo.");
      return;
    }
    if (min.value != null && max.value != null && max.value < min.value) {
      setError("El salario máximo no puede ser menor que el salario mínimo.");
      return;
    }
    const input: PutProfilePreferencesInput = {
      desiredRoles: parseList(desiredRoles),
      preferredLocations: parseList(preferredLocations),
      remotePreference,
      seniority: seniority === "" ? null : seniority,
      salaryMin: min.value,
      salaryMax: max.value,
      contractTypes
    };
    setError(null);
    setSaving(true);
    try {
      await updateProfilePreferences(token, input);
      await onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="pref-roles" className={labelClass}>
            Roles deseados
          </label>
          <input
            id="pref-roles"
            className={inputClass}
            value={desiredRoles}
            onChange={(e) => setDesiredRoles(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Frontend Developer, Full Stack Developer"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="pref-locations" className={labelClass}>
            Ubicaciones preferidas
          </label>
          <input
            id="pref-locations"
            className={inputClass}
            value={preferredLocations}
            onChange={(e) => setPreferredLocations(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Bilbao, Remoto, Madrid"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="pref-remote" className={labelClass}>
            Modalidad
          </label>
          <select
            id="pref-remote"
            className={inputClass}
            value={remotePreference}
            onChange={(e) => setRemotePreference(e.target.value as RemotePreference)}
          >
            {REMOTE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="pref-seniority" className={labelClass}>
            Seniority
          </label>
          <select
            id="pref-seniority"
            className={inputClass}
            value={seniority}
            onChange={(e) => setSeniority(e.target.value as PreferenceSeniority | "")}
          >
            {SENIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="pref-salary-min" className={labelClass}>
            Salario mínimo
          </label>
          <input
            id="pref-salary-min"
            type="number"
            min={0}
            className={inputClass}
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            onKeyDown={onEnter}
            placeholder="35000"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="pref-salary-max" className={labelClass}>
            Salario máximo
          </label>
          <input
            id="pref-salary-max"
            type="number"
            min={0}
            className={inputClass}
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            onKeyDown={onEnter}
            placeholder="50000"
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Tipos de contrato</legend>
        <div className="flex flex-wrap gap-3">
          {CONTRACT_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <input
                type="checkbox"
                checked={contractTypes.includes(o.value)}
                onChange={() => toggleContract(o.value)}
                className="h-4 w-4 rounded border-slate-300 text-[#006591] focus:ring-[#006591]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar preferencias"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
