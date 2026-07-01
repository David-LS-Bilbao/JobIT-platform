import Link from "next/link";
import type { ReactNode } from "react";

import type { CandidateDashboardDto } from "@/types/api";

interface DashboardContentProps {
  dashboard: CandidateDashboardDto;
}

/* -------------------------------------------------------------------------- */
/*  Iconos inline (sin fuentes/CDN externas, MVP-safe)                        */
/* -------------------------------------------------------------------------- */

function IconPerson() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M13 3L5 13h6l-1 8 8-10h-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconBookmark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 4h12v16l-6-4-6 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 20h4L18 10l-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconTarget({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconDoc({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 3h7l4 4v14H7zM14 3v5h4M9.5 12h6M9.5 16h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconWork() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#006c49]" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-300" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Primitivos visuales (Nexus Professional: claro, teal/green)               */
/* -------------------------------------------------------------------------- */

/** Métrica de resumen. */
function Metric({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff4ff] text-[#006591]">
        {icon}
      </span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="mt-1 text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

/**
 * Acción rápida. Si tiene `href` es un enlace real (disponible); si no, es un
 * botón deshabilitado con badge "Pendiente" (sin enlaces rotos).
 */
function QuickAction({ icon, label, href }: { icon: ReactNode; label: string; href?: string }) {
  const enabled = Boolean(href);
  const base =
    "relative flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm";
  const inner = (
    <>
      <span
        className={`absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold ${
          enabled ? "bg-[#eff4ff] text-[#006591]" : "bg-slate-100 text-slate-500"
        }`}
      >
        {enabled ? "Siguiente" : "Pendiente"}
      </span>
      <span className={enabled ? "text-[#006591]" : "text-slate-500"}>{icon}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`${base} transition-colors hover:border-[#006591]`}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Disponible en una próxima fase"
      className={`${base} cursor-not-allowed opacity-70`}
    >
      {inner}
    </button>
  );
}

/** Card de módulo del MVP. Con `href` es enlace disponible (acento teal); si no, pendiente. */
function ModuleCard({
  icon,
  name,
  description,
  href
}: {
  icon: ReactNode;
  name: string;
  description: string;
  href?: string;
}) {
  const available = Boolean(href);
  const content = (
    <>
      <span
        className={`absolute right-4 top-4 rounded px-2 py-1 text-xs font-bold ${
          available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {available ? "Disponible" : "Pendiente"}
      </span>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            available ? "bg-[#eff4ff] text-[#006591]" : "border border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          {icon}
        </span>
        <h4 className={`text-lg font-semibold ${available ? "text-slate-900" : "text-slate-700"}`}>{name}</h4>
      </div>
      <p className={`text-sm ${available ? "text-slate-600" : "text-slate-500"}`}>{description}</p>
    </>
  );
  const base = "relative block overflow-hidden rounded-xl bg-white p-6 shadow-sm";
  if (href) {
    return (
      <Link href={href} className={`${base} border-2 border-[#006591] transition-shadow hover:shadow-md`}>
        {content}
      </Link>
    );
  }
  return <div className={`${base} border border-slate-200 opacity-80`}>{content}</div>;
}

/** CTA principal "Preparar JobIT CV" → /profile (JobIT CV ya disponible). */
function PrepareCvButton() {
  return (
    <Link
      href="/profile"
      className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#006591] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e]"
    >
      Preparar JobIT CV
      <IconArrowRight />
    </Link>
  );
}

function ChecklistItem({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      {done ? <IconCheckCircle /> : <IconCircle />}
      {children}
    </li>
  );
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p.charAt(0).toUpperCase()).join("");
  return letters || "CT";
}

/* -------------------------------------------------------------------------- */
/*  Hub                                                                        */
/* -------------------------------------------------------------------------- */

/** Canvas privado del candidato (bento): resumen, acciones y preview de CV. */
export function DashboardContent({ dashboard }: DashboardContentProps) {
  const { profile, skills, savedJobs, matches } = dashboard;

  const greetingName = profile.firstName?.trim() ? profile.firstName : "candidato tech";
  const pct = profile.completionPercentage;
  const skillsCount = skills.length;
  const savedCount = savedJobs.total;
  const matchesCount = matches.length;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || "Candidato tech";
  const initials = initialsFrom(displayName);
  const hasBasics = Boolean(profile.firstName?.trim());
  const hasSkills = skillsCount > 0;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Hero */}
      <section className="relative col-span-12 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#006591]/5 blur-3xl"
        />
        <div className="relative flex h-full flex-col justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Hola, {greetingName}</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Este es tu panel privado para construir tu JobIT CV, revisar oportunidades y preparar tu encaje.
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-sm font-semibold text-slate-700">Completitud del perfil</span>
              <span className="text-xl font-bold text-[#006591]">{pct}%</span>
            </div>
            <div
              className="mb-6 h-3 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Completitud del perfil"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-3 rounded-full bg-[#006591] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <PrepareCvButton />
          </div>
        </div>
      </section>

      {/* Métricas (datos reales) */}
      <section className="col-span-12 grid grid-cols-2 gap-4 lg:col-span-4">
        <Metric icon={<IconPerson />} value={`${pct}%`} label="Perfil" />
        <Metric icon={<IconBolt />} value={skillsCount} label="Skills" />
        <Metric icon={<IconBookmark />} value={savedCount} label="Guardadas" />
        <Metric icon={<IconStar />} value={matchesCount} label="Matches" />
      </section>

      {/* Acciones rápidas */}
      <section className="col-span-12">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Acciones rápidas</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <QuickAction icon={<IconEdit />} label="Preparar JobIT CV" href="/profile" />
          <QuickAction icon={<IconPlus />} label="Añadir skills" href="/profile#skills" />
          <QuickAction icon={<IconSearch />} label="Explorar ofertas" />
          <QuickAction icon={<IconTarget />} label="Revisar matches" />
        </div>
      </section>

      {/* Tu próximo paso */}
      <section className="col-span-12">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Tu próximo paso</h3>
        <div className="relative rounded-xl border border-slate-200 border-t-4 border-t-[#006591] bg-white p-6 shadow-sm">
          <span className="absolute right-4 top-4 rounded bg-[#eff4ff] px-2 py-1 text-xs font-bold text-[#006591]">
            Siguiente
          </span>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="md:w-1/2">
              <p className="mb-4 text-slate-600">
                Completa tu JobIT CV para mejorar tu perfil, destacar tus skills y preparar mejores oportunidades.
              </p>
              <PrepareCvButton />
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 md:w-1/2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Progreso</span>
                <span className="text-sm font-bold text-[#006591]">{pct}%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-1.5 rounded-full bg-[#006591]" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-2">
                <ChecklistItem done={hasBasics}>Datos profesionales</ChecklistItem>
                <ChecklistItem done={hasSkills}>Skills</ChecklistItem>
                <ChecklistItem done={false}>Experiencia</ChecklistItem>
                <ChecklistItem done={false}>Proyectos</ChecklistItem>
                <ChecklistItem done={false}>Enlaces</ChecklistItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vista previa de JobIT CV (read-only) */}
      <section className="col-span-12">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Vista previa de JobIT CV</h3>
        <div className="rounded-xl border border-[#c8e6ff] border-t-4 border-t-[#006591] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#dce9ff] text-3xl font-bold text-[#004c6e]">
              {initials}
            </span>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-slate-900">{displayName}</h4>
                <p className="mt-1 text-lg font-medium text-slate-600">
                  {profile.headline?.trim() ? profile.headline : "Añade tu titular profesional (rol y stack)."}
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Añade un resumen profesional destacando tu experiencia y objetivos.
              </div>
              {hasSkills ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-[#eff4ff] px-3 py-1.5 text-sm font-medium text-[#006591]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Añade tus skills para mostrarlas aquí.</p>
              )}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <IconFolder />
                Añade tu primer proyecto destacado
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-sm font-medium text-slate-400">
                <span>GitHub</span>
                <span aria-hidden="true">·</span>
                <span>LinkedIn</span>
                <span aria-hidden="true">·</span>
                <span>Portfolio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos del MVP */}
      <section className="col-span-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ModuleCard
          href="/profile"
          icon={<IconDoc />}
          name="JobIT CV"
          description="Perfil vivo con datos profesionales, skills, experiencia, educación, proyectos y enlaces."
        />
        <ModuleCard icon={<IconWork />} name="JobIT Jobs" description="Buscador de ofertas tech con filtros básicos." />
        <ModuleCard
          icon={<IconBookmark className="h-5 w-5" />}
          name="Guardadas"
          description="Guarda oportunidades para revisarlas después."
        />
        <ModuleCard
          icon={<IconTarget />}
          name="JobIT Match"
          description="Entiende por qué una oferta encaja con tu perfil."
        />
      </section>
    </div>
  );
}
