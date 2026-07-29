/**
 * Landing pública candidate-first.
 *
 * Superficie estática y honesta sobre capacidades actuales y roadmap. No usa
 * backend, datos reales, dominios no acreditados, imágenes remotas ni estado.
 */
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";

const PAGE_TITLE = "JobIT | Perfil tech vivo y match explicable";
const PAGE_DESCRIPTION =
  "Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende tu afinidad mediante reglas visibles.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION
  }
};

const STACK = ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"];

const NAV_ITEMS = [
  { label: "Producto", href: "#producto" },
  { label: "Capacidades", href: "#capacidades" },
  { label: "Cómo funciona", href: "#funcionamiento" },
  { label: "Roadmap", href: "#roadmap" }
] as const;

const FOCUS_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
const FOCUS_LIGHT =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jobit-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7 3h7l4 4v14H7zM14 3v5h4M9.5 12h6M9.5 16h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600"
      aria-hidden="true"
    >
      <path
        d="M5 12.5l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

const AVAILABLE_CAPABILITIES = [
  "Perfil y CV tech",
  "Skills, experiencia y educación",
  "Proyectos y enlaces técnicos",
  "Buscador de ofertas y guardados",
  "Match explicable básico"
];

const ROADMAP_CAPABILITIES = [
  "Herramientas para recruiters y empresas",
  "Radar de mercado ampliado",
  "Comunidad profesional",
  "Administración y monetización",
  "Experiencia móvil dedicada"
];

const gridPattern = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
  backgroundSize: "44px 44px"
} as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#contenido-principal"
        className={`sr-only fixed left-4 top-4 z-50 rounded-md bg-white px-4 py-3 font-semibold text-slate-950 shadow-xl focus:not-sr-only ${FOCUS_LIGHT}`}
      >
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 text-white backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="JobIT"
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md font-bold tracking-tight ${FOCUS_DARK}`}
          >
            <BrandMark />
            <span className="text-lg">JobIT</span>
          </Link>

          <nav
            aria-label="Secciones"
            className="hidden items-center gap-1 text-sm text-slate-300 md:flex lg:gap-3"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 items-center rounded-md px-2 transition-colors hover:text-white ${FOCUS_DARK}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
            <a
              href="/login"
              className={`inline-flex min-h-11 items-center rounded-md px-2 font-medium text-slate-200 transition-colors hover:text-white md:hidden ${FOCUS_DARK}`}
            >
              Acceder
            </a>
            <a
              href="/login"
              className={`hidden min-h-11 items-center rounded-md px-2 font-medium text-slate-200 transition-colors hover:text-white md:inline-flex ${FOCUS_DARK}`}
            >
              Iniciar sesión
            </a>
            <a
              href="/register"
              className={`inline-flex min-h-11 items-center rounded-full bg-white px-3 font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100 sm:px-4 ${FOCUS_DARK}`}
            >
              Crear cuenta
            </a>
          </div>
        </div>
      </header>

      <main id="contenido-principal" tabIndex={-1} className="focus:outline-none">
        <section
          id="producto"
          className="relative isolate scroll-mt-20 bg-slate-950 text-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-60" style={gridPattern} />
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" />
            <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-[86vh] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid min-w-0 items-center gap-14 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-sky-300">
                    Plataforma candidate-first
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
                    Match explicable
                  </span>
                </div>

                <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Tu perfil tech vivo para explorar oportunidades en{" "}
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    JobIT
                  </span>
                </h1>

                <p className="max-w-xl text-lg text-slate-300">
                  Construye tu perfil y CV, reúne skills y proyectos, explora ofertas y entiende tu
                  afinidad con reglas visibles.
                </p>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="/register"
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-7 py-3.5 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02] sm:w-auto motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:scale-100 ${FOCUS_DARK}`}
                  >
                    Crear mi perfil
                  </a>
                  <a
                    href="#capacidades"
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto ${FOCUS_DARK}`}
                  >
                    Ver capacidades
                  </a>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-300">
                    Tecnología actual
                  </span>
                  {STACK.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              </div>

              <figure
                data-testid="product-preview"
                className="relative min-w-0 max-w-full"
                aria-labelledby="preview-caption"
              >
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 blur-2xl"
                />
                <div className="relative min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-2xl ring-1 ring-white/10">
                  <div className="min-w-0 overflow-hidden rounded-xl bg-white text-slate-900">
                    <div
                      aria-hidden="true"
                      className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2.5 sm:px-4"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-auto min-w-0 truncate rounded bg-white px-2 py-0.5 text-[11px] text-slate-600 sm:mx-auto sm:px-3">
                        Vista ilustrativa de JobIT
                      </span>
                    </div>

                    <div className="min-w-0 space-y-4 p-4 sm:p-5">
                      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:flex-nowrap">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white"
                        >
                          AE
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">Alex Ejemplo</p>
                          <p className="text-xs text-slate-600">
                            Desarrollo frontend · Ubicación flexible
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                          />
                          Ejemplo
                        </span>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                          <span>Progreso ilustrativo</span>
                          <span className="font-semibold text-slate-700">82%</span>
                        </div>
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                          aria-hidden="true"
                        >
                          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {["Frontend", "Accesibilidad", "CSS"].map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                        <div className="min-w-0 rounded-xl border border-slate-200 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-600">
                            Proyecto
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold">proyecto-ejemplo</p>
                          <p className="text-xs text-slate-600">Interfaz · Accesibilidad</p>
                        </div>
                        <div className="min-w-0 rounded-xl border border-slate-200 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-600">
                            Oferta guardada
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold">
                            Frontend · Empresa Ejemplo
                          </p>
                          <p className="text-xs text-slate-600">Ubicación flexible</p>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="min-w-0 break-words text-xs font-semibold text-slate-700">
                            Frontend Engineer · Empresa Ejemplo
                          </p>
                          <span className="shrink-0 rounded-full bg-emerald-700 px-2 py-1 text-xs font-bold text-white">
                            Afinidad ilustrativa: 82/100
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          Coincidencias de ejemplo: frontend y accesibilidad.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <figcaption
                  id="preview-caption"
                  className="relative mt-3 text-center text-sm font-medium text-slate-300"
                >
                  Ejemplo ilustrativo · datos ficticios
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section
          id="capacidades"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Capacidades actuales
            </h2>
            <p className="mt-3 text-slate-600">
              Herramientas disponibles hoy para organizar tu perfil y explorar oportunidades.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {MODULES.map((module) => (
              <article
                key={module.name}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 sm:p-8 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${module.accent}`}
                  >
                    {module.icon}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Disponible ahora
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{module.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                <ul className="mt-4 space-y-2">
                  {module.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="funcionamiento" className="scroll-mt-20 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cómo funciona</h2>
              <p className="mt-3 text-slate-600">
                Del registro a tu primer encaje, en pasos claros.
              </p>
            </div>

            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-emerald-50 p-6 sm:p-8 lg:col-span-2 lg:row-span-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  1
                </span>
                <h3 className="mt-4 text-2xl font-bold">Crea tu perfil vivo</h3>
                <p className="mt-2 max-w-md text-slate-600">
                  Regístrate y construye tu CV tech: datos profesionales, experiencia, educación,
                  skills, proyectos y enlaces. Tu perfil crece contigo.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Perfil", "Skills", "Experiencia", "Proyectos", "Enlaces"].map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  2
                </span>
                <h3 className="mt-3 font-semibold">Completa tu CV</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Skills, experiencia, educación y proyectos.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  3
                </span>
                <h3 className="mt-3 font-semibold">Explora y guarda ofertas</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Buscador con filtros y guardados.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-900 bg-slate-900 p-6 text-white lg:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-emerald-300">
                      4
                    </span>
                    <h3 className="mt-3 text-xl font-bold">Revisa tu match explicable</h3>
                    <p className="mt-1 text-sm text-white/80">
                      Score, nivel y tus gaps para cada oferta. Reglas visibles.
                    </p>
                  </div>
                  <span className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-2xl font-bold text-emerald-300">
                    82/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="roadmap"
          className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Disponible ahora y en el roadmap
            </h2>
            <p className="mt-3 text-slate-600">
              Qué puedes usar hoy y qué forma parte de la evolución prevista del producto.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Disponible ahora
              </span>
              <h3 className="mt-4 text-2xl font-bold">Capacidades disponibles ahora</h3>
              <ul className="mt-5 space-y-2.5">
                {AVAILABLE_CAPABILITIES.map((capability) => (
                  <li key={capability} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check />
                    {capability}
                  </li>
                ))}
              </ul>
              <a
                href="/register"
                className={`mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 ${FOCUS_LIGHT}`}
              >
                Crear mi perfil
              </a>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-300">
                En el roadmap
              </span>
              <h3 className="mt-4 text-2xl font-bold">Líneas previstas de evolución</h3>
              <ul className="mt-5 space-y-2.5">
                {ROADMAP_CAPABILITIES.map((capability) => (
                  <li key={capability} className="flex items-start gap-2 text-sm text-white/80">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/50"
                    />
                    {capability}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-xs text-slate-300">
                Estas capacidades no están disponibles actualmente y su alcance puede evolucionar.
              </p>
            </article>
          </div>
        </section>

        <section className="relative isolate bg-slate-950 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-50" style={gridPattern} />
            <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
          </div>
          <div className="relative mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empieza por tu perfil tech
            </h2>
            <p className="mt-3 text-slate-300">
              Crea tu cuenta y reúne tu experiencia, skills y proyectos en JobIT.
            </p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/register"
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02] sm:w-auto motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:scale-100 ${FOCUS_DARK}`}
              >
                Crear mi perfil
              </a>
              <a
                href="/login"
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto ${FOCUS_DARK}`}
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="JobIT"
              className={`inline-flex min-h-11 items-center gap-2 rounded-md font-bold ${FOCUS_LIGHT}`}
            >
              <BrandMark className="h-7 w-7 text-xs" />
              <span>JobIT</span>
            </Link>
            <p className="mt-2 text-sm text-slate-600">
              Tu perfil tech vivo para explorar oportunidades con más contexto.
            </p>
          </div>

          <nav aria-label="Pie" className="flex flex-wrap gap-x-2 text-sm text-slate-600">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 items-center rounded-md px-2 hover:text-slate-900 ${FOCUS_LIGHT}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-600">
          © 2026 JobIT
        </div>
      </footer>
    </div>
  );
}
