"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { AvailabilityStatus, CandidateProfileDto, UpdateProfileBasicInfoInput } from "@/types/api";

import { getMyProfile, updateMyProfile } from "./profile-api";
import { ProfileCompletionCard } from "./profile-completion-card";
import { ProfileEmptyState } from "./profile-empty-state";
import { REMOTE_PREFERENCE_LABELS, SENIORITY_LABELS } from "./profile-format";
import { ProfilePreview } from "./profile-preview";
import { ProfileEducationSection } from "./profile-education-section";
import { ProfileExperienceSection } from "./profile-experience-section";
import { ProfileLinksSection } from "./profile-links-section";
import { ProfileProjectsSection } from "./profile-projects-section";
import { NextPhaseBadge, ProfileSectionCard } from "./profile-section-card";
import { ProfileSkillsSection } from "./profile-skills-section";

const AVAILABILITY_OPTIONS: ReadonlyArray<{ value: AvailabilityStatus; label: string }> = [
  { value: "ACTIVE", label: "Disponible" },
  { value: "OPEN", label: "Abierto a oportunidades" },
  { value: "NOT_LOOKING", label: "No buscando" }
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/40";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

type SaveState = "idle" | "saving" | "saved" | "error";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-700">{children}</dd>
    </div>
  );
}

function orDash(arr: string[]): string {
  return arr.length > 0 ? arr.join(", ") : "—";
}

function formatSalary(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min} – ${max}`;
  if (min != null) return `Desde ${min}`;
  if (max != null) return `Hasta ${max}`;
  return "—";
}

/** JobIT CV: vista + edición de datos profesionales básicos (PUT). Subrecursos read-only. */
export function ProfileContent({ profile: initialProfile, token }: { profile: CandidateProfileDto; token: string }) {
  const [profile, setProfile] = useState<CandidateProfileDto>(initialProfile);
  const [firstName, setFirstName] = useState(initialProfile.firstName ?? "");
  const [lastName, setLastName] = useState(initialProfile.lastName ?? "");
  const [headline, setHeadline] = useState(initialProfile.headline ?? "");
  const [location, setLocation] = useState(initialProfile.location ?? "");
  const [locationRemote, setLocationRemote] = useState(initialProfile.locationRemote);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(initialProfile.availabilityStatus);
  const [summary, setSummary] = useState(initialProfile.summary ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pct = profile.completionPercentage;

  // Preview en vivo: fusiona los cambios en edición sobre el perfil guardado.
  const previewProfile: CandidateProfileDto = {
    ...profile,
    firstName: firstName.trim() || null,
    lastName: lastName.trim() || null,
    headline: headline.trim() || null,
    location: location.trim() || null,
    locationRemote,
    availabilityStatus,
    summary: summary.trim() || null
  };

  // Re-obtiene el perfil tras mutar subrecursos (skills): refresca listas,
  // preview y completitud (calculada en backend). Si falla, mantiene el estado.
  async function refreshProfile() {
    try {
      const fresh = await getMyProfile(token);
      setProfile(fresh);
    } catch {
      // La sección que mutó muestra su propio error; no bloqueamos la vista.
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setErrorMsg(null);
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setSaveState("error");
      setErrorMsg("Nombre y apellidos son obligatorios (mínimo 2 caracteres).");
      return;
    }
    setSaveState("saving");
    const input: UpdateProfileBasicInfoInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      headline: headline.trim() || undefined,
      summary: summary.trim() || undefined,
      location: location.trim() || undefined,
      locationRemote,
      availabilityStatus
    };
    try {
      const updated = await updateMyProfile(token, input);
      setProfile(updated);
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "No se han podido guardar los cambios. Inténtalo de nuevo."
      );
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tu perfil tech vivo</h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Perfil en progreso
            </span>
          </div>
          <div className="flex items-center gap-3 md:w-72">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Completitud del perfil"
              aria-valuenow={pct as unknown as number}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-[#006591]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-slate-600">{pct}%</span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 md:items-end">
          <button
            type="submit"
            disabled={saveState === "saving"}
            className="w-full rounded-lg bg-[#006591] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60 md:w-auto"
          >
            {saveState === "saving" ? "Guardando…" : "Guardar cambios"}
          </button>
          {saveState === "saved" ? (
            <span className="text-xs font-medium text-emerald-600">Cambios guardados</span>
          ) : null}
          {saveState === "error" && errorMsg ? (
            <span role="alert" className="text-xs font-medium text-red-600">
              {errorMsg}
            </span>
          ) : null}
        </div>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor + secciones read-only */}
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <ProfileSectionCard title="Datos profesionales">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="pf-firstName" className={labelClass}>
                  Nombre
                </label>
                <input
                  id="pf-firstName"
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pf-lastName" className={labelClass}>
                  Apellidos
                </label>
                <input
                  id="pf-lastName"
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pf-headline" className={labelClass}>
                  Rol actual / deseado
                </label>
                <input
                  id="pf-headline"
                  className={inputClass}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Frontend Developer"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pf-location" className={labelClass}>
                  Ubicación
                </label>
                <input
                  id="pf-location"
                  className={inputClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bilbao"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pf-availability" className={labelClass}>
                  Disponibilidad
                </label>
                <select
                  id="pf-availability"
                  className={inputClass}
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                >
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={locationRemote}
                    onChange={(e) => setLocationRemote(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#006591] focus:ring-[#006591]"
                  />
                  <span className="text-sm text-slate-700">Disponible para remoto</span>
                </label>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="pf-summary" className={labelClass}>
                  Resumen profesional
                </label>
                <textarea
                  id="pf-summary"
                  rows={3}
                  className={inputClass}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia y objetivos…"
                  maxLength={1000}
                />
              </div>
            </div>
          </ProfileSectionCard>

          <ProfileSectionCard id="skills" title="Skills principales">
            <ProfileSkillsSection skills={profile.skills} token={token} onChanged={refreshProfile} />
          </ProfileSectionCard>

          <ProfileSectionCard title="Experiencia profesional">
            <ProfileExperienceSection experiences={profile.experiences} token={token} onChanged={refreshProfile} />
          </ProfileSectionCard>

          <ProfileSectionCard title="Educación">
            <ProfileEducationSection education={profile.education} token={token} onChanged={refreshProfile} />
          </ProfileSectionCard>

          <ProfileSectionCard title="Proyectos">
            <ProfileProjectsSection projects={profile.projects} token={token} onChanged={refreshProfile} />
          </ProfileSectionCard>

          <ProfileSectionCard title="Enlaces">
            <ProfileLinksSection links={profile.links} token={token} onChanged={refreshProfile} />
          </ProfileSectionCard>

          <ProfileSectionCard title="Preferencias" action={<NextPhaseBadge />}>
            {profile.preferences ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Roles deseados">{orDash(profile.preferences.desiredRoles)}</Field>
                <Field label="Ubicaciones">{orDash(profile.preferences.preferredLocations)}</Field>
                <Field label="Modalidad">{REMOTE_PREFERENCE_LABELS[profile.preferences.remotePreference]}</Field>
                <Field label="Seniority">
                  {profile.preferences.seniority ? SENIORITY_LABELS[profile.preferences.seniority] : "—"}
                </Field>
                <Field label="Salario">{formatSalary(profile.preferences.salaryMin, profile.preferences.salaryMax)}</Field>
                <Field label="Tipos de contrato">{orDash(profile.preferences.contractTypes)}</Field>
              </dl>
            ) : (
              <ProfileEmptyState title="Preferencias" description="Define qué buscas en tu próxima oportunidad." />
            )}
          </ProfileSectionCard>
        </div>

        {/* Progreso + preview */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
          <ProfileCompletionCard profile={profile} />
          <ProfilePreview profile={previewProfile} />
        </div>
      </div>
    </form>
  );
}
