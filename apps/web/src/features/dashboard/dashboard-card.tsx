import type { ReactNode } from "react";

/** Item de lista (oferta guardada o match) dentro de una sección. */
export function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-md border border-black/10 px-4 py-3 text-sm dark:border-white/15">{children}</li>
  );
}
