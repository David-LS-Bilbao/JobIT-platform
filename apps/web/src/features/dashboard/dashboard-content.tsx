import type { ReactNode } from "react";

import type { CandidateDashboardDto } from "@/types/api";

interface DashboardContentProps {
  dashboard: CandidateDashboardDto;
}

/* -------------------------------------------------------------------------- */
/*  Iconos inline (sin fuentes/CDN externas, MVP-safe)                        */
/* -------------------------------------------------------------------------- */

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M5 21V10M12 21V4M19 21v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M6 4h12v16l-6-4-6 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7 3h7l4 4v14H7zM14 3v5h4M9.5 12h6M9.5 16h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Primitivos visuales (claros, alineados con landing/login)                 */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES: Record<string, string> = {
  Disponible: "bg-emerald-100 text-emerald-700",
  "En curso": "bg-sky-100 text-sky-700",
  Siguiente: "bg-violet-100 text-violet-700",
  Pendiente: "bg-slate-100 text-slate-500"
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}

/**
 * CTA honesta para funciones aún no implementadas en UI. No navega (la pantalla
 * llega en una fase posterior): botón deshabilitado, sin enlace roto.
 */
function ComingSoonCta({ children, full = false }: { children: ReactNode; full?: boolean }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Disponible en una próxima fase"
      className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 ${
        full ? "w-full" : ""
      }`}
    >
      {children}
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Próxima fase</span>
    </button>
  );
}

/** Tarjeta de sección clara con título. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

/** KPI de resumen (bento). */
function StatCard({
  icon,
  accent,
  label,
  value,
  children
}: {
  icon: ReactNode;
  accent: string;
  label: string;
  value: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accent}`}>{icon}</span>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {children}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Datos de navegación (estado honesto, sin rutas inexistentes)              */
/* -------------------------------------------------------------------------- */

// Módulos MVP candidate-first. Ninguno enlaza a rutas inexistentes: CTA
// deshabilitada con badge de estado hasta que su vista exista.
const MODULES: ReadonlyArray<{
  name: string;
  state: "Siguiente" | "Pendiente";
  description: string;
  cta: string;
  icon: ReactNode;
  accent: string;
}> = [
  {
    name: "JobIT CV",
    state: "Siguiente",
    description: "Completa tu perfil tech: skills, experiencia, educación, proyectos y enlaces.",
    cta: "Preparar JobIT CV",
    icon: <IconDoc />,
    accent: "text-violet-700 bg-violet-50 ring-violet-100"
  },
  {
    name: "JobIT Jobs",
    state: "Pendiente",
    description: "Explora ofertas tech con filtros básicos.",
    cta: "Próximamente",
    icon: <IconSearch />,
    accent: "text-emerald-700 bg-emerald-50 ring-emerald-100"
  },
  {
    name: "Saved Jobs",
    state: "Pendiente",
    description: "Guarda oportunidades para revisarlas después.",
    cta: "Próximamente",
    icon: <IconBookmark />,
    accent: "text-sky-700 bg-sky-50 ring-sky-100"
  },
  {
    name: "JobIT Match",
    state: "Pendiente",
    description: "Entiende por qué una oferta encaja con tu perfil.",
    cta: "Próximamente",
    icon: <IconTarget />,
    accent: "text-amber-700 bg-amber-50 ring-amber-100"
  }
];

// Roadmap interno del MVP (estado de navegación, no funcionalidades activas).
const ROADMAP: ReadonlyArray<{ label: string; status: "Disponible" | "En curso" | "Siguiente" | "Pendiente" }> = [
  { label: "Autenticación", status: "Disponible" },
  { label: "Landing", status: "Disponible" },
  { label: "Dashboard", status: "En curso" },
  { label: "Perfil/CV", status: "Siguiente" },
  { label: "Buscador de empleo", status: "Pendiente" },
  { label: "Guardadas", status: "Pendiente" },
  { label: "Encaje", status: "Pendiente" }
];

const MATCH_LEVEL_LABELS: Record<string, string> = {
  VERY_GOOD: "Muy bueno",
  GOOD: "Bueno",
  LOW: "Bajo",
  VERY_LOW: "Muy bajo"
};

/* -------------------------------------------------------------------------- */
/*  Hub                                                                        */
/* -------------------------------------------------------------------------- */

/** Hub privado del candidato: resumen, módulos, roadmap y datos reales. */
export function DashboardContent({ dashboard }: DashboardContentProps) {
  const { profile, skills, savedJobs, matches, nextActions } = dashboard;
  const greetingName = profile.firstName?.trim() ? profile.firstName : "candidato tech";
  const pct = profile.completionPercentage;

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Hola, {greetingName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {profile.headline?.trim() ? profile.headline : "Bienvenido de nuevo a tu panel de candidato."}
        </p>
      </header>

      {/* Resumen bento (datos reales) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IconChart />}
          accent="text-sky-700 bg-sky-50 ring-sky-100"
          label="Perfil completado"
          value={`${pct}%`}
        >
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Perfil completado"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </StatCard>
        <StatCard
          icon={<IconSpark />}
          accent="text-violet-700 bg-violet-50 ring-violet-100"
          label="Skills"
          value={skills.length}
        />
        <StatCard
          icon={<IconBookmark />}
          accent="text-emerald-700 bg-emerald-50 ring-emerald-100"
          label="Ofertas guardadas"
          value={savedJobs.total}
        />
        <StatCard
          icon={<IconTarget />}
          accent="text-amber-700 bg-amber-50 ring-amber-100"
          label="Matches"
          value={matches.length}
        />
      </section>

      {/* Módulos MVP (navegación futura, sin enlaces rotos) */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Módulos</h2>
          <span className="text-xs text-slate-400">Se activan a medida que se publican</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <article
              key={m.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${m.accent}`}>
                  {m.icon}
                </span>
                <StatusBadge status={m.state} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{m.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">{m.description}</p>
              <div className="mt-4">
                <ComingSoonCta full>{m.cta}</ComingSoonCta>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Roadmap del MVP */}
      <Section title="Tu progreso en JobIT">
        <ul className="flex flex-wrap gap-2">
          {ROADMAP.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
            >
              <span className="font-medium text-slate-700">{item.label}</span>
              <StatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Datos reales: split principal + lateral */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Skills */}
          <Section title="Tus skills">
            {skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <li key={skill} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                <EmptyState>Aún no has añadido skills.</EmptyState>
                <ComingSoonCta>Añadir skills</ComingSoonCta>
              </div>
            )}
          </Section>

          {/* Ofertas guardadas */}
          <Section title={`Ofertas guardadas (${savedJobs.total})`}>
            {savedJobs.recent.length > 0 ? (
              <ul className="space-y-3">
                {savedJobs.recent.map((saved) => (
                  <li key={saved.job.id} className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{saved.job.title}</p>
                    <p className="text-xs text-slate-500">
                      {saved.job.company}
                      {saved.job.location ? ` · ${saved.job.location}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                <EmptyState>Todavía no has guardado ofertas.</EmptyState>
                <ComingSoonCta>Explorar ofertas</ComingSoonCta>
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          {/* Matches */}
          <Section title="Mejores matches">
            {matches.length > 0 ? (
              <ul className="space-y-3">
                {matches.map((match) => (
                  <li key={match.job.id} className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{match.job.title}</p>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                        {match.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {match.job.company} · {MATCH_LEVEL_LABELS[match.level] ?? match.level}
                    </p>
                    {match.matchedSkills.length > 0 ? (
                      <p className="mt-1 text-xs text-emerald-700">Coincides: {match.matchedSkills.join(", ")}</p>
                    ) : null}
                    {match.missingSkills.length > 0 ? (
                      <p className="text-xs text-slate-500">Te falta: {match.missingSkills.join(", ")}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>Aún no hay matches. Completa tu perfil y añade skills para mejorarlos.</EmptyState>
            )}
          </Section>

          {/* Siguiente paso */}
          <Section title="Siguiente paso">
            {nextActions.length > 0 ? (
              <ol className="space-y-2">
                {nextActions.map((action) => (
                  <li key={action.action} className="flex items-start gap-2 text-sm text-slate-700">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500" />
                    {action.label}
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState>¡Todo al día! No hay acciones pendientes.</EmptyState>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}
