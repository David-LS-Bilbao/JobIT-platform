import type { CandidateDashboardDto } from "@/types/api";

import { DashboardCard } from "./dashboard-card";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardSection } from "./dashboard-section";

interface DashboardContentProps {
  dashboard: CandidateDashboardDto;
  onLogout: () => void;
}

/** Presentación pura del dashboard candidate-first (recibe el DTO por props). */
export function DashboardContent({ dashboard, onLogout }: DashboardContentProps) {
  const { profile, skills, savedJobs, matches, nextActions } = dashboard;
  const greetingName = profile.firstName?.trim() ? profile.firstName : "candidato tech";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola, {greetingName}</h1>
          {profile.headline ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{profile.headline}</p>
          ) : null}
          <p className="mt-1 text-sm text-zinc-500">
            Perfil completado al {profile.completionPercentage}%.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
        >
          Cerrar sesión
        </button>
      </header>

      <DashboardSection title="Tu perfil">
        <div className="space-y-2">
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
            <DashboardEmptyState>Completa tu perfil para mejorar tus matches.</DashboardEmptyState>
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
          <DashboardEmptyState>Aún no has añadido skills.</DashboardEmptyState>
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
          <DashboardEmptyState>Todavía no has guardado ofertas.</DashboardEmptyState>
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
          <DashboardEmptyState>Aún no hay matches. Completa tu perfil para mejorarlos.</DashboardEmptyState>
        )}
      </DashboardSection>

      <DashboardSection title="Próximos pasos">
        {nextActions.length > 0 ? (
          <ul className="space-y-1">
            {nextActions.map((action) => (
              <li key={action.action} className="text-sm">
                • {action.label}
              </li>
            ))}
          </ul>
        ) : (
          <DashboardEmptyState>¡Todo al día! No hay acciones pendientes.</DashboardEmptyState>
        )}
      </DashboardSection>
    </div>
  );
}
