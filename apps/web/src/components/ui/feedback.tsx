import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Componentes pequeños de feedback (Sprint 17D.1). Reutilizables en todo el
 * flujo candidato para unificar carga/error/vacío. Sin dependencias nuevas y
 * sin lógica de negocio: solo presentación + accesibilidad básica.
 */

/** Bloque placeholder de carga (pulsante). Decorativo: oculto a lectores. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

/** Estado de carga accesible: texto + skeleton suave (evita saltos bruscos). */
export function LoadingState({ title, description }: { title: string; description?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Estado de error con reintento opcional. Con `onRetry` muestra el botón
 * "Reintentar"; sin él, solo el mensaje (comportamiento anterior).
 */
export function ErrorState({
  title,
  description,
  onRetry
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm font-semibold text-red-700">{title}</p>
      {description ? <p className="mt-1 text-sm text-red-600">{description}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-jobit-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

/**
 * Estado vacío accionable (mismo patrón visual de los empties existentes:
 * caja punteada centrada). `actionHref`+`actionLabel` pintan el CTA principal;
 * `children` admite una acción secundaria ya construida.
 */
export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm text-slate-600">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block rounded-lg bg-jobit-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
        >
          {actionLabel}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
