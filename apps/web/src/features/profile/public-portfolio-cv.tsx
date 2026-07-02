import type { ReactNode } from "react";

import type { PublicPortfolioProfile } from "@/types/api";

import { ProfileAvatar } from "./profile-avatar";
import {
  AVAILABILITY_LABELS,
  LINK_TYPE_LABELS,
  REMOTE_PREFERENCE_LABELS,
  SKILL_LEVEL_LABELS,
  formatDateRange
} from "./profile-format";

function CvSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#006591]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * CV público, renderizado desde el read model PÚBLICO (whitelist del backend).
 * Los campos ocultos por flags llegan como `null` y no se pintan. Nunca recibe
 * salario ni datos privados.
 */
export function PublicPortfolioCv({ profile }: { profile: PublicPortfolioProfile }) {
  const contactLine = [
    profile.location,
    profile.locationRemote ? "Disponible en remoto" : null,
    profile.availabilityStatus ? AVAILABILITY_LABELS[profile.availabilityStatus] : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex items-center gap-5 border-b-2 border-[#006591] pb-5">
        <ProfileAvatar
          name={profile.name}
          avatarUrl={profile.avatarUrl}
          imgClassName="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
          fallbackClassName="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#dce9ff] text-2xl font-bold text-[#004c6e] ring-1 ring-[#b9d3f2] print:bg-white"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">{profile.name}</h1>
          {profile.headline ? <p className="mt-0.5 text-base font-medium text-[#006591]">{profile.headline}</p> : null}
          {contactLine ? <p className="mt-1 text-xs text-slate-500">{contactLine}</p> : null}
        </div>
      </header>

      {profile.summary ? (
        <CvSection title="Resumen">
          <p className="text-sm leading-relaxed text-slate-700">{profile.summary}</p>
        </CvSection>
      ) : null}

      {profile.skills.length > 0 ? (
        <CvSection title="Skills">
          <ul className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill, i) => (
              <li
                key={`${skill.name}-${i}`}
                className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-700 print:bg-white"
              >
                {skill.name}
                {skill.level ? <span className="text-slate-400"> · {SKILL_LEVEL_LABELS[skill.level]}</span> : null}
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile.experiences.length > 0 ? (
        <CvSection title="Experiencia">
          <ul className="space-y-3">
            {profile.experiences.map((exp, i) => (
              <li key={`${exp.company}-${i}`} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{exp.role}</p>
                  <p className="shrink-0 text-xs text-slate-500">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {exp.company}
                  {exp.location ? ` · ${exp.location}` : ""}
                </p>
                {exp.description ? <p className="mt-0.5 text-sm text-slate-700">{exp.description}</p> : null}
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile.education.length > 0 ? (
        <CvSection title="Educación">
          <ul className="space-y-3">
            {profile.education.map((edu, i) => (
              <li key={`${edu.institution}-${i}`} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{edu.title}</p>
                  <p className="shrink-0 text-xs text-slate-500">
                    {edu.startDate
                      ? formatDateRange(edu.startDate, edu.endDate, edu.current)
                      : edu.current
                        ? "Actualidad"
                        : ""}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {edu.institution}
                  {edu.field?.trim() ? ` · ${edu.field}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile.projects.length > 0 ? (
        <CvSection title="Proyectos">
          <ul className="space-y-3">
            {profile.projects.map((project, i) => (
              <li key={`${project.name}-${i}`} className="break-inside-avoid">
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                {project.description?.trim() ? (
                  <p className="text-sm text-slate-700">{project.description}</p>
                ) : null}
                {project.technologies.length > 0 ? (
                  <p className="text-xs text-slate-500">{project.technologies.join(" · ")}</p>
                ) : null}
                {project.url || project.repoUrl ? (
                  <div className="flex flex-wrap gap-3 text-xs">
                    {project.url ? (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-[#006591] underline">
                        {project.url}
                      </a>
                    ) : null}
                    {project.repoUrl ? (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#006591] underline"
                      >
                        {project.repoUrl}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile.links.length > 0 ? (
        <CvSection title="Enlaces">
          <ul className="space-y-1">
            {profile.links.map((link, i) => (
              <li key={`${link.url}-${i}`} className="text-sm">
                <span className="font-medium text-slate-700">{LINK_TYPE_LABELS[link.type]}: </span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#006591] underline">
                  {link.url}
                </a>
              </li>
            ))}
          </ul>
        </CvSection>
      ) : null}

      {profile.preferences ? (
        <CvSection title="Preferencias">
          <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {profile.preferences.desiredRoles.length > 0 ? (
              <p>
                <span className="text-slate-500">Roles: </span>
                {profile.preferences.desiredRoles.join(", ")}
              </p>
            ) : null}
            {profile.preferences.preferredLocations.length > 0 ? (
              <p>
                <span className="text-slate-500">Ubicaciones: </span>
                {profile.preferences.preferredLocations.join(", ")}
              </p>
            ) : null}
            <p>
              <span className="text-slate-500">Modalidad: </span>
              {REMOTE_PREFERENCE_LABELS[profile.preferences.remotePreference]}
            </p>
          </div>
        </CvSection>
      ) : null}
    </article>
  );
}
