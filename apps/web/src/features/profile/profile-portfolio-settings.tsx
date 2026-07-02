"use client";

import Link from "next/link";
import { useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { PortfolioSettingsDto, UpdatePortfolioSettingsInput } from "@/types/api";

import {
  buildPublicPortfolioUrl,
  publishMyPortfolio,
  unpublishMyPortfolio,
  updateMyPortfolioSettings
} from "./profile-api";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-shadow focus:border-[#006591] focus:ring-2 focus:ring-[#006591]/40";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const primaryBtn =
  "rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e] disabled:opacity-60";
const ghostBtn =
  "rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60";

// Requisitos del mínimo publicable (la fuente de verdad es el backend; esto es guía).
const PUBLISH_CHECKLIST: ReadonlyArray<{ field: string; label: string }> = [
  { field: "name", label: "Nombre profesional" },
  { field: "headline", label: "Titular profesional" },
  { field: "skills", label: "Al menos una skill" },
  { field: "projectsOrExperience", label: "Al menos un proyecto o experiencia" }
];

const VISIBILITY_FLAGS: ReadonlyArray<{ key: "showLocation" | "showAvailability" | "showPreferences"; label: string }> = [
  { key: "showLocation", label: "Mostrar ubicación" },
  { key: "showAvailability", label: "Mostrar disponibilidad" },
  { key: "showPreferences", label: "Mostrar preferencias" }
];

function slugErrorMessage(err: ApiClientError): string {
  if (err.code === "INVALID_SLUG") return "El slug solo puede contener letras, números y guiones.";
  if (err.code === "SLUG_TAKEN") return "Ese enlace ya está en uso. Prueba con otro.";
  return err.message || "No se han podido guardar los cambios.";
}

export function ProfilePortfolioSettings({
  settings: initial,
  token
}: {
  settings: PortfolioSettingsDto;
  token: string;
}) {
  const [settings, setSettings] = useState(initial);
  const [slug, setSlug] = useState(initial.slug);
  const [flags, setFlags] = useState({
    showLocation: initial.showLocation,
    showAvailability: initial.showAvailability,
    showPreferences: initial.showPreferences
  });
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyPublish, setBusyPublish] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = buildPublicPortfolioUrl(settings.publicUrlPath);

  async function handleSave() {
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const input: UpdatePortfolioSettingsInput = {
        slug: slug.trim(),
        showLocation: flags.showLocation,
        showAvailability: flags.showAvailability,
        showPreferences: flags.showPreferences
      };
      const updated = await updateMyPortfolioSettings(token, input);
      setSettings(updated);
      setSlug(updated.slug);
      setSaveOk(true);
    } catch (err) {
      setSaveError(err instanceof ApiClientError ? slugErrorMessage(err) : "No se han podido guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishError(null);
    setMissingFields(null);
    setBusyPublish(true);
    try {
      const updated = await publishMyPortfolio(token);
      setSettings(updated);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "PORTFOLIO_NOT_READY") {
        setMissingFields(err.missingFields ?? []);
      } else {
        setPublishError(err instanceof ApiClientError ? err.message : "No se ha podido publicar el portfolio.");
      }
    } finally {
      setBusyPublish(false);
    }
  }

  async function handleUnpublish() {
    setPublishError(null);
    setBusyPublish(true);
    try {
      const updated = await unpublishMyPortfolio(token);
      setSettings(updated);
    } catch (err) {
      setPublishError(err instanceof ApiClientError ? err.message : "No se ha podido despublicar el portfolio.");
    } finally {
      setBusyPublish(false);
    }
  }

  async function handleCopy() {
    setCopied(false);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
      }
    } catch {
      // La URL visible permite copiarla a mano; no bloqueamos la UI.
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Estado + enlace público */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Estado:</span>
            {settings.isPublished ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Publicado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                No publicado
              </span>
            )}
          </div>
          {settings.isPublished ? (
            <button type="button" onClick={handleUnpublish} disabled={busyPublish} className={ghostBtn}>
              {busyPublish ? "Despublicando…" : "Despublicar portfolio"}
            </button>
          ) : (
            <button type="button" onClick={handlePublish} disabled={busyPublish} className={primaryBtn}>
              {busyPublish ? "Publicando…" : "Publicar portfolio"}
            </button>
          )}
        </div>

        <div className="mt-4 space-y-1">
          <span className={labelClass}>Enlace público</span>
          <div className="flex flex-wrap items-center gap-3">
            <code className="max-w-full break-all rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700">
              {publicUrl}
            </code>
            <button type="button" onClick={handleCopy} className={ghostBtn}>
              Copiar enlace
            </button>
            {copied ? <span className="text-xs font-medium text-emerald-600">Enlace copiado</span> : null}
          </div>
          <p className="text-xs text-slate-500">Ruta pública: {settings.publicUrlPath}</p>
          {settings.isPublished ? (
            <p className="text-xs text-slate-500">Comparte este enlace: tu portfolio está publicado.</p>
          ) : (
            <p className="text-xs text-slate-500">
              Este enlace no será visible públicamente hasta que publiques tu portfolio.
            </p>
          )}
        </div>

        {publishError ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {publishError}
          </p>
        ) : null}
      </section>

      {/* Checklist de publicación */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Para publicar necesitas:</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {PUBLISH_CHECKLIST.map((item) => {
            const pending = missingFields?.includes(item.field) ?? false;
            const resolved = missingFields !== null && !pending;
            return (
              <li key={item.field} className="flex items-center gap-2">
                <span aria-hidden="true" className={pending ? "text-red-600" : resolved ? "text-emerald-600" : "text-slate-400"}>
                  {pending ? "✗" : resolved ? "✓" : "•"}
                </span>
                <span className={pending ? "font-medium text-red-700" : "text-slate-700"}>{item.label}</span>
              </li>
            );
          })}
        </ul>
        {missingFields && missingFields.length > 0 ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            Completa los campos marcados en tu JobIT CV para poder publicar.
          </p>
        ) : null}
      </section>

      {/* Slug + flags de visibilidad */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="pf-slug" className={labelClass}>
            Enlace público (slug)
          </label>
          <input
            id="pf-slug"
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="tu-nombre"
            autoComplete="off"
          />
          <p className="text-xs text-slate-500">Solo letras, números y guiones. Cambiarlo altera tu enlace público.</p>
        </div>

        <fieldset className="mt-4">
          <legend className={labelClass}>Visibilidad</legend>
          <div className="mt-2 space-y-2">
            {VISIBILITY_FLAGS.map((flag) => (
              <label key={flag.key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={flags[flag.key]}
                  onChange={(e) => setFlags((prev) => ({ ...prev, [flag.key]: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#006591] focus:ring-[#006591]"
                />
                <span className="text-sm text-slate-700">{flag.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saving} className={primaryBtn}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link href="/profile/portfolio" className="text-sm font-medium text-[#006591] hover:underline">
            Ver preview privada
          </Link>
          {saveOk ? <span className="text-xs font-medium text-emerald-600">Cambios guardados</span> : null}
          {saveError ? (
            <span role="alert" className="text-xs font-medium text-red-600">
              {saveError}
            </span>
          ) : null}
        </div>
      </section>
    </div>
  );
}
