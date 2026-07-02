"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getPublicPortfolio } from "@/features/profile/profile-api";
import { PublicPortfolioCv } from "@/features/profile/public-portfolio-cv";
import { ApiClientError } from "@/lib/api-client";
import type { PublicPortfolioDto } from "@/types/api";

type State = "loading" | "ok" | "notfound" | "error";

/**
 * Página pública del portfolio (`/u/[slug]`): SIN login, SIN SiteShell privado,
 * SIN redirección. Consume `getPublicPortfolio(slug)` y muestra 404 si el API
 * responde 404 (inexistente o no publicado). Botón de impresión oculto en print.
 */
export function PublicPortfolioPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicPortfolioDto | null>(null);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    getPublicPortfolio(slug)
      .then((dto) => {
        if (!cancelled) {
          setData(dto);
          setState("ok");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(err instanceof ApiClientError && err.status === 404 ? "notfound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-dvh bg-[#f8f9ff] text-slate-900 print:bg-white">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 print:py-0">
        {state === "loading" ? <p className="text-sm text-slate-600">Cargando portfolio…</p> : null}

        {state === "notfound" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Portfolio no disponible</h1>
            <p className="mt-2 text-sm text-slate-600">
              Este enlace no existe o el portfolio no está publicado.
            </p>
          </div>
        ) : null}

        {state === "error" ? (
          <p role="alert" className="text-sm text-red-600">
            No se ha podido cargar el portfolio. Inténtalo de nuevo.
          </p>
        ) : null}

        {state === "ok" && data ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight text-[#004c6e]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-[#006591] to-[#006c49] text-xs font-bold text-white">
                  J
                </span>
                JobIT
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004c6e]"
              >
                Imprimir / Guardar PDF
              </button>
            </div>
            <PublicPortfolioCv profile={data.profile} />
            <footer className="mt-6 text-center text-xs text-slate-400 print:hidden">Generado con JobIT</footer>
          </>
        ) : null}
      </main>
    </div>
  );
}
