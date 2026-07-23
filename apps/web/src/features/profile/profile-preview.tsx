import type { CandidateProfileDto } from "@/types/api";

import { ProfileAvatar } from "./profile-avatar";
import { AVAILABILITY_LABELS, displayName } from "./profile-format";

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Preview read-only del JobIT CV (columna derecha, refleja los edits en vivo). */
export function ProfilePreview({ profile }: { profile: CandidateProfileDto }) {
  const name = displayName(profile);
  const locationBits = [profile.location?.trim() || null, profile.locationRemote ? "Remoto" : null].filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Vista previa</p>
      <div className="flex items-start gap-4">
        <ProfileAvatar
          name={name}
          avatarUrl={profile.avatarUrl}
          imgClassName="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
          fallbackClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-jobit-brand to-jobit-brand-dark text-lg font-bold text-white shadow-sm"
        />
        <div className="min-w-0">
          <h4 className="truncate text-lg font-bold text-slate-900">{name}</h4>
          <p className="truncate text-sm font-medium text-jobit-brand">
            {profile.headline?.trim() ? profile.headline : "Añade tu titular profesional"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <IconPin />
            {locationBits.length > 0 ? locationBits.join(" • ") : "Ubicación por definir"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        {profile.summary?.trim()
          ? profile.summary
          : "Añade un resumen profesional destacando tu experiencia y objetivos."}
      </p>

      <div className="mt-3 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {AVAILABILITY_LABELS[profile.availabilityStatus]}
        </span>
      </div>

      <div className="mt-4">
        {profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 6).map((skill) => (
              <span
                key={skill.id}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
              >
                {skill.name}
              </span>
            ))}
            {profile.skills.length > 6 ? (
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                +{profile.skills.length - 6}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Añade tus skills para mostrarlas aquí.</p>
        )}
      </div>

      {profile.projects.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Proyectos destacados</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {profile.projects.slice(0, 3).map((project) => (
              <li key={project.id} className="truncate">
                {project.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {profile.links.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4 text-sm font-medium text-jobit-brand">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {profile.links.map((link) => (
              <span key={link.id}>{link.type.charAt(0) + link.type.slice(1).toLowerCase()}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
