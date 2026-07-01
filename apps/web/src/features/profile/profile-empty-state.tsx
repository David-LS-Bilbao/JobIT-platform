import type { ReactNode } from "react";

/** Estado vacío de una sección del JobIT CV (caja punteada, tono discreto). */
export function ProfileEmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
