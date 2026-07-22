import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";

/**
 * Marco visual de las pantallas públicas de auth (login/register), alineado con
 * la landing: split-screen con panel de marca oscuro (desktop) + card de
 * formulario clara. MVP-safe: sin OAuth, sin imágenes externas. La lógica del
 * formulario vive en los componentes hijos (LoginForm / RegisterForm).
 */
interface AuthFormShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  /** Aviso contextual opcional (FLOW-02); se renderiza sobre el formulario. */
  notice?: ReactNode;
}

const PANEL_MODULES: ReadonlyArray<{ name: string; description: string }> = [
  { name: "Dashboard", description: "Tu panel de candidato" },
  { name: "JobIT CV", description: "Tu perfil tech vivo" },
  { name: "JobIT Jobs", description: "Ofertas y guardados" },
  { name: "JobIT Match", description: "Encaje explicable" }
];

const gridPattern = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
  backgroundSize: "40px 40px"
} as const;

export function AuthFormShell({ title, subtitle, children, footer, notice }: AuthFormShellProps) {
  return (
    <div className="grid min-h-dvh bg-slate-50 lg:grid-cols-2">
      {/* Panel de marca (desktop) */}
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={gridPattern} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

        <Link href="/" className="relative flex w-fit items-center gap-2 font-bold tracking-tight">
          <BrandMark />
          <span className="text-lg">JobIT</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Tu perfil tech vivo, en un solo lugar.
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Construye tu CV, busca ofertas y entiende tu encaje. Claro, explicable y sin humo.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {PANEL_MODULES.map((m) => (
              <div key={m.name} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">© 2026 JobIT</p>
      </section>

      {/* Card de formulario */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          {/* Marca en móvil */}
          <Link href="/" className="mb-8 flex w-fit items-center gap-2 font-bold tracking-tight lg:hidden">
            <BrandMark />
            <span className="text-lg">JobIT</span>
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
            {notice}
            <div className="mt-6">{children}</div>
            <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">{footer}</div>
          </div>

          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-slate-500 transition-colors hover:text-slate-900">
              ← Volver a inicio
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
