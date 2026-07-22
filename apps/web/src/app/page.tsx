/**
 * Landing pública candidate-first (Sprint 11 · rework visual).
 *
 * Estática (sin backend/estado). Estética SaaS tech alineada al mock de Stitch
 * (hero oscuro potente con gradientes/grid/glows, preview de producto tipo
 * ventana de app, bento, módulos grandes), con CONTENIDO MVP-safe: sin pricing
 * real, sin promesas de IA, sin integración GitHub real, sin testimonios.
 * Sin imágenes remotas, sin dependencias, sin CDN ni fuentes externas.
 */
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";

const STACK = ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"];

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7zM14 3v5h4M9.5 12h6M9.5 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true">
      <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MODULES: ReadonlyArray<{
  icon: ReactNode;
  name: string;
  description: string;
  points: string[];
  accent: string;
}> = [
  {
    icon: <IconUser />,
    name: "Dashboard",
    description: "Tu panel de candidato.",
    points: ["Estado del perfil y preferencias", "Ofertas guardadas y recomendaciones"],
    accent: "text-sky-700 bg-sky-50 ring-sky-100"
  },
  {
    icon: <IconDoc />,
    name: "JobIT CV",
    description: "Tu perfil tech vivo, siempre actualizado.",
    points: ["Skills, experiencia, educación", "Proyectos y enlaces, con preview"],
    accent: "text-violet-700 bg-violet-50 ring-violet-100"
  },
  {
    icon: <IconSearch />,
    name: "JobIT Jobs",
    description: "Encuentra ofertas tech relevantes.",
    points: ["Buscador con filtros", "Detalle de oferta y guardados"],
    accent: "text-emerald-700 bg-emerald-50 ring-emerald-100"
  },
  {
    icon: <IconTarget />,
    name: "JobIT Match",
    description: "Entiende tu encaje con cada oferta.",
    points: ["Score y nivel explicables", "Tus gaps, sin cajas negras"],
    accent: "text-amber-700 bg-amber-50 ring-amber-100"
  }
];

const MVP_INCLUDES = [
  "Perfil y CV tech",
  "Skills, experiencia y educación",
  "Proyectos y enlaces técnicos",
  "Buscador de ofertas y guardados",
  "Match explicable básico"
];

const FUTURE_INCLUDES = [
  "Recruit completo / ATS",
  "Radar avanzado de mercado",
  "IA avanzada",
  "Comunidad y administración",
  "Monetización y app móvil"
];

const gridPattern = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
  backgroundSize: "44px 44px"
} as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* Navbar sticky */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 text-white backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="#producto" className="flex items-center gap-2 font-bold tracking-tight">
            <BrandMark />
            <span className="text-lg">JobIT</span>
          </a>
          <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#producto" className="transition-colors hover:text-white">Producto</a>
            <a href="#modulos" className="transition-colors hover:text-white">Módulos</a>
            <a href="#mvp" className="transition-colors hover:text-white">MVP</a>
            <a href="#futuro" className="transition-colors hover:text-white">Futuro</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <a href="/login" className="font-medium text-slate-200 transition-colors hover:text-white">
              Iniciar sesión
            </a>
            <a
              href="/register"
              className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
            >
              Crear cuenta
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO oscuro grande */}
        <section id="producto" className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={gridPattern} />
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative mx-auto flex min-h-[86vh] w-full max-w-6xl flex-col justify-center px-6 py-20">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-sky-300">
                    MVP candidate-first
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
                    Match explicable
                  </span>
                </div>
                <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                  Tu perfil tech vivo para encontrar mejores oportunidades en{" "}
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    JobIT
                  </span>
                </h1>
                <p className="max-w-xl text-lg text-slate-300">
                  Construye tu perfil y CV, muestra skills y proyectos, busca ofertas y entiende tu
                  encaje con cada una. Claro, explicable y sin humo.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/register"
                    className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02]"
                  >
                    Crear mi perfil
                  </a>
                  <a
                    href="#modulos"
                    className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Ver módulos
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500">Stack</span>
                  {STACK.map((t) => (
                    <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* PRODUCT PREVIEW protagonista: ventana de app */}
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 blur-2xl" />
                <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-2xl ring-1 ring-white/10">
                  <div className="overflow-hidden rounded-xl bg-white text-slate-900">
                    {/* barra de ventana */}
                    <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="mx-auto rounded bg-white px-3 py-0.5 text-[11px] text-slate-400">jobit.app/dashboard</span>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white">
                          AR
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Ana Rivas</p>
                          <p className="text-xs text-slate-500">Frontend developer · Bilbao</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Disponible
                        </span>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Perfil completado</span>
                          <span className="font-semibold text-slate-700">82%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {["React", "TypeScript", "Node.js", "CSS"].map((s) => (
                          <span key={s} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">Proyecto</p>
                          <p className="mt-1 text-sm font-semibold">design-system</p>
                          <p className="text-xs text-slate-500">React · TypeScript</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">Guardada</p>
                          <p className="mt-1 text-sm font-semibold">Frontend · Acme</p>
                          <p className="text-xs text-slate-500">Remoto · Mid</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700">React Engineer · TechCo</p>
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">82</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">Coincides: React, TypeScript · Te falta: GraphQL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MÓDULOS MVP — protagonistas */}
        <section id="modulos" className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Los módulos del MVP</h2>
            <p className="mt-3 text-slate-600">Cuatro piezas candidate-first, conectadas entre sí.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {MODULES.map((m) => (
              <article
                key={m.name}
                className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${m.accent}`}>
                    {m.icon}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Core MVP
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{m.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                <ul className="mt-4 space-y-2">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA — bento */}
        <section id="mvp" className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cómo funciona</h2>
              <p className="mt-3 text-slate-600">Del registro a tu primer encaje, en pasos claros.</p>
            </div>
            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {/* card grande */}
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-emerald-50 p-8 lg:col-span-2 lg:row-span-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">1</span>
                <h3 className="mt-4 text-2xl font-bold">Crea tu perfil vivo</h3>
                <p className="mt-2 max-w-md text-slate-600">
                  Regístrate y construye tu CV tech: datos profesionales, experiencia, educación,
                  skills, proyectos y enlaces. Tu perfil crece contigo.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Perfil", "Skills", "Experiencia", "Proyectos", "Enlaces"].map((c) => (
                    <span key={c} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">2</span>
                <h3 className="mt-3 font-semibold">Completa tu CV</h3>
                <p className="mt-1 text-sm text-slate-600">Skills, experiencia, educación y proyectos.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</span>
                <h3 className="mt-3 font-semibold">Explora y guarda ofertas</h3>
                <p className="mt-1 text-sm text-slate-600">Buscador con filtros y guardados.</p>
              </div>
              <div className="rounded-3xl border border-slate-900 bg-slate-900 p-6 text-white lg:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-emerald-300">4</span>
                    <h3 className="mt-3 text-xl font-bold">Revisa tu match explicable</h3>
                    <p className="mt-1 text-sm text-white/80">Score, nivel y tus gaps para cada oferta. Reglas visibles.</p>
                  </div>
                  <span className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-2xl font-bold text-emerald-300">82/100</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MVP vs FUTURO */}
        <section id="futuro" className="mx-auto w-full max-w-5xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">En el MVP y después</h2>
            <p className="mt-3 text-slate-600">Qué está disponible hoy y qué está preparado para más adelante. Sin planes de pago.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Disponible ahora
              </span>
              <h3 className="mt-4 text-2xl font-bold">Disponible en el MVP candidate-first</h3>
              <ul className="mt-5 space-y-2.5">
                {MVP_INCLUDES.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check />
                    {p}
                  </li>
                ))}
              </ul>
              <a
                href="/register"
                className="mt-7 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Crear mi perfil
              </a>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-white shadow-sm">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-300">
                Preparado para después
              </span>
              <h3 className="mt-4 text-2xl font-bold">No disponible en el MVP</h3>
              <ul className="mt-5 space-y-2.5">
                {FUTURE_INCLUDES.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-white/75">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-xs text-white/50">Visión modular en el horizonte. Hoy no está implementado.</p>
            </article>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50" style={gridPattern} />
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Empieza creando tu perfil tech</h2>
            <p className="mt-3 text-slate-300">Crea tu cuenta y construye tu perfil candidate-first en JobIT.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/register"
                className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02]"
              >
                Crear mi perfil
              </a>
              <a
                href="/login"
                className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 font-bold">
              <BrandMark className="h-7 w-7 text-xs" />
              JobIT
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Tu perfil tech vivo para encontrar mejores oportunidades. MVP candidate-first.
            </p>
          </div>
          <nav aria-label="Pie" className="flex flex-wrap gap-4 text-sm text-slate-600">
            <a href="#producto" className="hover:text-slate-900">Producto</a>
            <a href="#modulos" className="hover:text-slate-900">Módulos</a>
            <a href="#mvp" className="hover:text-slate-900">MVP</a>
            <a href="#futuro" className="hover:text-slate-900">Futuro</a>
          </nav>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">© 2026 JobIT</div>
      </footer>
    </div>
  );
}
