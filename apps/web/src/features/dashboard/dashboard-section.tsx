import type { ReactNode } from "react";

/** Sección con título del dashboard. */
export function DashboardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-black/10 p-5 dark:border-white/15">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}
