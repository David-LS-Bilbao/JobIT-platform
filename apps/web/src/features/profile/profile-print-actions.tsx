"use client";

import Link from "next/link";

/** Barra de acciones del portfolio. Oculta en impresión (`print:hidden`). */
export function ProfilePrintActions() {
  return (
    <div className="mb-6 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/profile" className="text-sm font-medium text-jobit-brand hover:underline">
            ← Volver a editar
          </Link>
          <Link
            href="/profile/portfolio/settings"
            className="text-sm font-medium text-jobit-brand hover:underline"
          >
            Gestionar publicación
          </Link>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-jobit-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jobit-brand-dark"
        >
          Imprimir / Guardar PDF
        </button>
      </div>
      <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 print:hidden">
        Para un PDF limpio, en el diálogo de impresión desactiva “Encabezados y pies de página” y usa tamaño A4.
      </p>
    </div>
  );
}
