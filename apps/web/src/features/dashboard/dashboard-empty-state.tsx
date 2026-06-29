import type { ReactNode } from "react";

/** Mensaje de estado vacío de una sección del dashboard. */
export function DashboardEmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}
