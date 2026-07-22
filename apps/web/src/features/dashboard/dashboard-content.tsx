import Link from "next/link";
import type { ReactNode } from "react";

import { locationLabel } from "@/features/jobs/jobs-format";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import type { CandidateDashboardDto } from "@/types/api";

interface DashboardContentProps {
  dashboard: CandidateDashboardDto;
}

/**
 * Rutas de las `nextActions` del catálogo aprobado (spec Dashboard 17C).
 * Una acción desconocida se muestra sin navegación (no rompe la UI).
 */
const NEXT_ACTION_ROUTES: Record<string, string> = {
  complete_profile: "/profile",
  add_experience: "/profile",
  add_projects: "/profile",
  add_links: "/profile",
  publish_portfolio: "/profile/portfolio",
  explore_jobs: "/jobs",
  review_matches: "/match"
};

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
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-jobit-green" aria-hidden="true">
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
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Primitivos visuales (Nexus Professional: claro, teal/green)               */
/* -------------------------------------------------------------------------- */

/**
 * Métrica de resumen. Con `href` (17D.2) es un enlace real hacia su módulo;
 * `ariaLabel` da un nombre accesible legible (los spans contiguos concatenarían
 * "80%Perfil" — 17D.2b).
 */
function Metric({
  icon,
  value,
  label,
  href,
  ariaLabel
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  href?: string;
  ariaLabel?: string;
}) {
  const className =
    "flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md";
  const inner = (
    <>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jobit-brand-soft text-jobit-brand">
        {icon}
      </span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="mt-1 text-xs font-medium text-slate-500">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
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
          enabled ? "bg-jobit-brand-soft text-jobit-brand" : "bg-slate-100 text-slate-500"
        }`}
      >
        {enabled ? "Siguiente" : "Pendiente"}
      </span>
      <span className={enabled ? "text-jobit-brand" : "text-slate-500"}>{icon}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={`${base} transition-colors hover:border-jobit-brand`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={label}
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
            available ? "bg-jobit-brand-soft text-jobit-brand" : "border border-slate-100 bg-slate-50 text-slate-500"
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
      <Link href={href} className={`${base} border-2 border-jobit-brand transition-shadow hover:shadow-md`}>
        {content}
      </Link>
    );
  }
  return <div className={`${base} border border-slate-200 opacity-80`}>{content}</div>;
}

/**
 * Card de Portfolio con estado real (17C: sin configurar / sin publicar /
 * publicado). No reutiliza el wrapper-Link de ModuleCard porque el estado
 * "publicado" añade un segundo enlace (la página pública) y anidar links es
 * HTML inválido: la gestión y la página pública son enlaces explícitos del pie.
 */
function PortfolioCard({ portfolio }: { portfolio: CandidateDashboardDto["portfolio"] }) {
  const status = !portfolio ? "unset" : portfolio.isPublished ? "published" : "unpublished";
  const badge =
    status === "published"
      ? { text: "Publicado", className: "bg-emerald-100 text-emerald-700" }
      : status === "unpublished"
        ? { text: "Sin publicar", className: "bg-slate-100 text-slate-600" }
        : { text: "Sin configurar", className: "bg-slate-100 text-slate-500" };
  const description =
    status === "published"
      ? "Tu JobIT CV está publicado como página pública con tu enlace y código QR."
      : status === "unpublished"
        ? "Portfolio configurado sin publicar. Publícalo para compartir tu enlace público."
        : "Publica tu JobIT CV como página pública con tu enlace y código QR.";

  return (
    <div className="relative block overflow-hidden rounded-xl border-2 border-jobit-brand bg-white p-6 shadow-sm">
      <span
        className={`absolute right-4 top-4 rounded px-2 py-1 text-xs font-bold ${badge.className}`}
      >
        {badge.text}
      </span>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-jobit-brand-soft text-jobit-brand">
          <IconGlobe />
        </span>
        <h4 className="text-lg font-semibold text-slate-900">Portfolio público</h4>
      </div>
      <p className="text-sm text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        <Link
          href="/profile/portfolio"
          className="text-sm font-medium text-jobit-brand hover:underline"
        >
          Gestionar portfolio →
        </Link>
        {status === "published" && portfolio ? (
          <Link
            href={portfolio.publicUrlPath}
            className="text-sm font-medium text-jobit-brand hover:underline"
          >
            Ver página pública →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/**
 * CTA hacia /profile. El hero usa el copy por defecto; otros bloques lo varían
 * para no repetir "Preparar JobIT CV" con el mismo peso (dedupe 17D.2).
 */
function PrepareCvButton({ label = "Preparar JobIT CV" }: { label?: string }) {
  return (
    <Link
      href="/profile"
      className="inline-flex w-fit items-center gap-2 rounded-lg bg-jobit-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
    >
      {label}
      <IconArrowRight />
    </Link>
  );
}

function ChecklistItem({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li data-done={done} className="flex items-center gap-2 text-sm text-slate-600">
      {done ? <IconCheckCircle /> : <IconCircle />}
      {children}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hub                                                                        */
/* -------------------------------------------------------------------------- */

/** Canvas privado del candidato (bento): resumen, acciones y preview de CV. */
export function DashboardContent({ dashboard }: DashboardContentProps) {
  const { profile, skills, savedJobs, matches, cvSections, portfolio, nextActions } = dashboard;

  const greetingName = profile.firstName?.trim() ? profile.firstName : "candidato tech";
  const pct = profile.completionPercentage;
  const skillsCount = skills.length;
  const savedCount = savedJobs.total;
  const hasSkills = skillsCount > 0;
  // DASH-01: sin skills el backend aún puntúa ofertas a 0/100; no se presentan
  // como "matches" (umbral de presentación en frontend, sin tocar el DTO).
  const presentableMatches = hasSkills ? matches : [];
  const matchesCount = presentableMatches.length;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || "Candidato tech";

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Hero */}
      <section className="relative col-span-12 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-jobit-brand/5 blur-3xl"
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
              <span className="text-xl font-bold text-jobit-brand">{pct}%</span>
            </div>
            <div
              className="mb-6 h-3 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Completitud del perfil"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-3 rounded-full bg-jobit-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            <PrepareCvButton />
          </div>
        </div>
      </section>

      {/* Métricas (datos reales) */}
      <section className="col-span-12 grid grid-cols-2 gap-4 lg:col-span-4">
        <Metric
          icon={<IconPerson />}
          value={`${pct}%`}
          label="Perfil"
          href="/profile"
          ariaLabel={`Ver perfil: ${pct}% completado`}
        />
        <Metric
          icon={<IconBolt />}
          value={skillsCount}
          label="Skills"
          href="/profile#skills"
          ariaLabel={`Ver skills: ${skillsCount}`}
        />
        <Metric
          icon={<IconBookmark />}
          value={savedCount}
          label="Guardadas"
          href="/saved-jobs"
          ariaLabel={`Ver ofertas guardadas: ${savedCount}`}
        />
        <Metric
          icon={<IconStar />}
          value={matchesCount}
          label="Matches"
          href="/match"
          ariaLabel={`Ver matches: ${matchesCount}`}
        />
      </section>

      {/* Acciones rápidas */}
      <section className="col-span-12">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Acciones rápidas</h3>
        {/* NAV-01: sin "Preparar JobIT CV" (duplica el CTA primario del hero). */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickAction icon={<IconPlus />} label="Añadir skills" href="/profile#skills" />
          <QuickAction icon={<IconSearch />} label="Explorar ofertas" href="/jobs" />
          <QuickAction icon={<IconTarget />} label="Revisar matches" href="/match" />
        </div>
      </section>

      {/* Sugerencias del backend (`nextActions`) mapeadas a rutas reales */}
      {nextActions.length > 0 ? (
        <section className="col-span-12">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">Sugerencias</h3>
          <div className="flex flex-wrap gap-3">
            {nextActions.map((next) => {
              const route = NEXT_ACTION_ROUTES[next.action];
              if (!route) {
                // Acción desconocida: visible pero sin navegación (no rompe la UI).
                return (
                  <span
                    key={next.action}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500"
                  >
                    {next.label}
                  </span>
                );
              }
              return (
                <Link
                  key={next.action}
                  href={route}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-jobit-brand shadow-sm transition-colors hover:border-jobit-brand"
                >
                  {next.label}
                  <IconArrowRight />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Actividad real: guardadas recientes (datos ya entregados por el DTO) */}
      <section className="col-span-12 lg:col-span-6">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Guardadas recientes</h3>
        <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {savedJobs.recent.length > 0 ? (
            <>
              <ul className="space-y-3">
                {savedJobs.recent.slice(0, 3).map((item) => (
                  <li
                    key={item.job.id}
                    className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <Link
                      href={`/jobs/${item.job.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-jobit-brand hover:underline"
                    >
                      {item.job.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.job.company} · {locationLabel(item.job)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href="/saved-jobs"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-jobit-brand hover:underline"
              >
                Ver todas las guardadas
                <IconArrowRight />
              </Link>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">Aún no has guardado ninguna oferta.</p>
              <Link
                href="/jobs"
                className="mt-3 inline-block rounded-lg bg-jobit-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
              >
                Buscar ofertas
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Actividad real: mejores matches (score y skills del DTO, sin recalcular) */}
      <section className="col-span-12 lg:col-span-6">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Tus mejores matches</h3>
        <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {presentableMatches.length > 0 ? (
            <>
              <ul className="space-y-3">
                {presentableMatches.slice(0, 3).map((match) => (
                  <li
                    key={match.job.id}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${match.job.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-jobit-brand hover:underline"
                      >
                        {match.job.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{match.job.company}</p>
                      {match.matchedSkills.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {match.matchedSkills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="rounded bg-jobit-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-jobit-brand"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-md bg-jobit-brand-soft px-2 py-1 text-xs font-bold text-jobit-brand">
                      {match.score}%
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/match"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-jobit-brand hover:underline"
              >
                Ver todos los matches
                <IconArrowRight />
              </Link>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">Todavía no hay matches para tu perfil.</p>
              <p className="mt-1 text-xs text-slate-500">
                Añade skills a tu JobIT CV para mejorar tus resultados.
              </p>
              <Link
                href="/profile"
                className="mt-3 inline-block rounded-lg bg-jobit-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
              >
                Completar perfil
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tu próximo paso */}
      <section className="col-span-12">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Tu próximo paso</h3>
        <div className="rounded-xl border border-slate-200 border-t-4 border-t-jobit-brand bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="md:w-1/2">
              {/* DASH-04: badge en flujo (antes 'absolute', solapaba el copy a 390 px). */}
              <span className="mb-3 inline-flex rounded bg-jobit-brand-soft px-2 py-1 text-xs font-bold text-jobit-brand">
                Siguiente
              </span>
              <p className="mb-4 text-slate-600">
                Completa tu JobIT CV para mejorar tu perfil, destacar tus skills y preparar mejores oportunidades.
              </p>
              <PrepareCvButton label="Mejorar tu JobIT CV" />
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 md:w-1/2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Progreso</span>
                <span className="text-sm font-bold text-jobit-brand">{pct}%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-1.5 rounded-full bg-jobit-brand" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-2">
                <ChecklistItem done={cvSections.basics}>Datos profesionales</ChecklistItem>
                <ChecklistItem done={cvSections.skills}>Skills</ChecklistItem>
                <ChecklistItem done={cvSections.experience}>Experiencia</ChecklistItem>
                <ChecklistItem done={cvSections.projects}>Proyectos</ChecklistItem>
                <ChecklistItem done={cvSections.links}>Enlaces</ChecklistItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vista previa de JobIT CV (read-only) */}
      <section className="col-span-12">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Vista previa de JobIT CV</h3>
        <div className="rounded-xl border border-jobit-brand-border border-t-4 border-t-jobit-brand bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <ProfileAvatar
              name={displayName}
              avatarUrl={profile.avatarUrl}
              imgClassName="h-24 w-24 shrink-0 rounded-2xl object-cover"
              fallbackClassName="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-jobit-brand-muted text-3xl font-bold text-jobit-brand-dark"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-slate-900">{displayName}</h4>
                <p className="mt-1 text-lg font-medium text-slate-600">
                  {profile.headline?.trim() ? profile.headline : "Añade tu titular profesional (rol y stack)."}
                </p>
              </div>
              {profile.summary?.trim() ? (
                <p className="text-sm leading-relaxed text-slate-700">{profile.summary}</p>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Añade un resumen profesional para destacar tu perfil.
                </div>
              )}
              {hasSkills ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-jobit-brand-soft px-3 py-1.5 text-sm font-medium text-jobit-brand"
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
                {cvSections.projects
                  ? "Proyectos añadidos a tu JobIT CV"
                  : "Añade tu primer proyecto destacado"}
              </div>
              <div
                className={`pt-2 text-sm font-medium ${
                  cvSections.links ? "text-jobit-brand" : "text-slate-400"
                }`}
              >
                {cvSections.links
                  ? "Enlaces profesionales añadidos"
                  : "Añade tus enlaces profesionales (GitHub, LinkedIn, portfolio)"}
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
        <ModuleCard
          href="/jobs"
          icon={<IconWork />}
          name="JobIT Jobs"
          description="Buscador de ofertas tech con filtros básicos."
        />
        <ModuleCard
          href="/saved-jobs"
          icon={<IconBookmark className="h-5 w-5" />}
          name="Guardadas"
          description="Guarda oportunidades para revisarlas después."
        />
        <ModuleCard
          href="/match"
          icon={<IconTarget />}
          name="JobIT Match"
          description="Entiende por qué una oferta encaja con tu perfil."
        />
        <PortfolioCard portfolio={portfolio} />
      </section>
    </div>
  );
}
