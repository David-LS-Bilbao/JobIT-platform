import type { ReactNode } from "react";

/**
 * Tarjeta de sección del JobIT CV. Cabecera con título + acción opcional
 * (p. ej. badge "Próxima fase" para lo que aún no es editable) y cuerpo.
 */
export function ProfileSectionCard({
  id,
  title,
  action,
  children
}: {
  id?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Badge honesto para acciones que llegan en una fase posterior. */
export function NextPhaseBadge({ children = "Próxima fase" }: { children?: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
      {children}
    </span>
  );
}
