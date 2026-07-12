import type { CandidateProfileDto } from "@/types/api";

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-jobit-green" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPending() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-300" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/** Card lateral de progreso del perfil: % real + checklist derivado de datos. */
export function ProfileCompletionCard({ profile }: { profile: CandidateProfileDto }) {
  const pct = profile.completionPercentage;
  const checklist: ReadonlyArray<{ label: string; done: boolean }> = [
    { label: "Datos profesionales", done: Boolean(profile.firstName && profile.lastName) },
    { label: "Skills principales", done: profile.skills.length > 0 },
    { label: "Experiencia", done: profile.experiences.length > 0 },
    { label: "Educación", done: profile.education.length > 0 },
    { label: "Proyectos", done: profile.projects.length > 0 },
    { label: "Enlaces", done: profile.links.length > 0 }
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progreso del perfil</h3>
        <span className="text-xl font-bold text-jobit-brand">{pct}%</span>
      </div>
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Progreso del perfil"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-jobit-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 space-y-3">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-sm text-slate-700">
            {item.done ? <IconCheck /> : <IconPending />}
            <span>
              {item.label}
              {item.done ? "" : " (pendiente)"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
