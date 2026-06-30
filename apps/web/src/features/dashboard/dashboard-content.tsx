import type { ReactNode } from "react";

import type { CandidateDashboardDto } from "@/types/api";

import { DashboardCard } from "./dashboard-card";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardSection } from "./dashboard-section";

interface DashboardContentProps {
  dashboard: CandidateDashboardDto;
}

/**
 * CTA honesta para funciones aún no implementadas en UI. No navega (la pantalla
 * llega en una fase posterior): botón deshabilitado y marcado como "próxima fase"
 * para evitar enlaces rotos.
 */
function ComingSoonCta({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Disponible en una próxima fase"
      className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-zinc-500 opacity-70 dark:border-white/15"
    >
      {children}
      <span className="text-[10px] uppercase tracking-wide text-zinc-400">próxima fase</span>
    </button>
  );
}

/** Presentación pura del dashboard candidate-first (recibe el DTO por props). */
export function DashboardContent({ dashboard }: DashboardContentProps) {
  const { profile, skills, savedJobs, matches, nextActions } = dashboard;
  const greetingName = profile.firstName?.trim() ? profile.firstName : "candidato tech";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {greetingName}</h1>
        {profile.headline ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{profile.headline}</p>
        ) : null}
        <p className="mt-1 text-sm text-zinc-500">
          Perfil completado al {profile.completionPercentage}%.
        </p>
      </header>

      <DashboardSection title="Tu perfil">
        <div className="space-y-3">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
            role="progressbar"
            aria-valuenow={profile.completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${profile.completionPercentage}%` }}
            />
          </div>
          {profile.completionPercentage < 100 ? (
            <div className="space-y-2">
              <DashboardEmptyState>
                Completa tu perfil para mejorar tus matches.
              </DashboardEmptyState>
              <ComingSoonCta>Completar perfil</ComingSoonCta>
            </div>
          ) : (
            <p className="text-sm text-green-600 dark:text-green-400">Tu perfil está completo.</p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Tus skills">
        {skills.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill} className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            <DashboardEmptyState>Aún no has añadido skills.</DashboardEmptyState>
            <ComingSoonCta>Añadir skills</ComingSoonCta>
          </div>
        )}
      </DashboardSection>

      <DashboardSection title={`Ofertas guardadas (${savedJobs.total})`}>
        {savedJobs.recent.length > 0 ? (
          <ul className="space-y-2">
            {savedJobs.recent.map((saved) => (
              <DashboardCard key={saved.job.id}>
                <span className="font-medium">{saved.job.title}</span>
                <span className="text-zinc-500"> · {saved.job.company}</span>
                {saved.job.location ? <span className="text-zinc-500"> · {saved.job.location}</span> : null}
              </DashboardCard>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            <DashboardEmptyState>Todavía no has guardado ofertas.</DashboardEmptyState>
            <ComingSoonCta>Explorar ofertas</ComingSoonCta>
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Mejores matches">
        {matches.length > 0 ? (
          <ul className="space-y-2">
            {matches.map((match) => (
              <DashboardCard key={match.job.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {match.job.title} · {match.job.company}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {match.score}/100 · {match.level}
                  </span>
                </div>
                {match.matchedSkills.length > 0 ? (
                  <p className="mt-1 text-xs text-zinc-500">Coincides en: {match.matchedSkills.join(", ")}</p>
                ) : null}
                {match.missingSkills.length > 0 ? (
                  <p className="text-xs text-zinc-500">Te falta: {match.missingSkills.join(", ")}</p>
                ) : null}
              </DashboardCard>
            ))}
          </ul>
        ) : (
          <DashboardEmptyState>
            Aún no hay matches. Completa tu perfil y añade skills para mejorarlos.
          </DashboardEmptyState>
        )}
      </DashboardSection>

      <DashboardSection title="Próximos pasos">
        {nextActions.length > 0 ? (
          <ol className="space-y-1">
            {nextActions.map((action) => (
              <li key={action.action} className="text-sm">
                • {action.label}
              </li>
            ))}
          </ol>
        ) : (
          <DashboardEmptyState>¡Todo al día! No hay acciones pendientes.</DashboardEmptyState>
        )}
      </DashboardSection>
    </div>
  );
}
