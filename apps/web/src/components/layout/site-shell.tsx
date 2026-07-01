"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { logoutCandidate } from "@/features/auth/auth-api";
import { useAuth } from "@/features/auth/auth-context";

/**
 * App shell reutilizable de la zona privada. Sistema visual "Nexus Professional"
 * (claro, teal/green), coherente con landing y auth; no depende del tema del SO.
 *
 * - Sin sesión: cabecera superior pública (Inicio / Login / Registro).
 * - Con sesión: layout privado con navegación real y responsive:
 *     · desktop → sidebar fija;
 *     · móvil   → botón "Abrir menú" + drawer con overlay.
 *
 * La navegación es una única fuente (PRIVATE_NAV) compartida por sidebar y drawer.
 * El estado activo se deriva de la ruta (`usePathname`), no está hardcodeado.
 * Título/subtítulo del header son parametrizables (por defecto, "Dashboard").
 * Sesión en memoria (ADR-0006): al recargar vuelve al estado público.
 */

const PUBLIC_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registro" }
];

/* --- iconos inline (sin fuentes/CDN externas, MVP-safe) ------------------- */
function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7zM14 3v5h4M9.5 12h6M9.5 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconWork() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M6 4h12v16l-6-4-6 4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.3M12 17h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#006591] to-[#006c49] text-sm font-bold text-white">
      J
    </span>
  );
}

/* --- navegación privada (única fuente compartida) ------------------------- */
type NavStatus = "available" | "next" | "pending";

interface PrivateNavItem {
  label: string;
  href: string;
  status: NavStatus;
  icon: ReactNode;
}

// Solo `available` es enlace real. `next`/`pending` se muestran deshabilitados
// con badge para no crear rutas rotas (aún no existen esas vistas).
const PRIVATE_NAV: ReadonlyArray<PrivateNavItem> = [
  { label: "Dashboard", href: "/dashboard", status: "available", icon: <IconDashboard /> },
  { label: "JobIT CV", href: "/profile", status: "next", icon: <IconDoc /> },
  { label: "JobIT Jobs", href: "/jobs", status: "pending", icon: <IconWork /> },
  { label: "Guardadas", href: "/saved-jobs", status: "pending", icon: <IconBookmark /> },
  { label: "JobIT Match", href: "/match", status: "pending", icon: <IconTarget /> }
];

const activeNavClass =
  "flex items-center gap-3 rounded-lg border-r-4 border-[#006591] bg-[#eff4ff] px-3 py-2.5 font-semibold text-[#006591]";
const inactiveNavClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-50";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function StatusBadge({ status }: { status: Exclude<NavStatus, "available"> }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
        status === "next" ? "bg-[#eff4ff] text-[#006591]" : "bg-slate-100 text-slate-500"
      }`}
    >
      {status === "next" ? "Siguiente" : "Pendiente"}
    </span>
  );
}

/** Lista de navegación privada, reutilizada en sidebar (desktop) y drawer (móvil). */
function PrivateNav({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegación privada" className="flex-1 space-y-1">
      {PRIVATE_NAV.map((item) => {
        if (item.status === "available") {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={active ? activeNavClass : inactiveNavClass}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        }
        return (
          <div
            key={item.href}
            aria-disabled="true"
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
              item.status === "pending" ? "text-slate-500 opacity-70" : "text-slate-600"
            }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </span>
            <StatusBadge status={item.status} />
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="mb-8 flex items-center gap-3 px-2">
      <BrandMark />
      <div>
        <p className="text-lg font-extrabold tracking-tight text-[#004c6e]">JobIT</p>
        <p className="text-xs text-slate-500">Perfil tech vivo</p>
      </div>
    </div>
  );
}

function SidebarBottom() {
  return (
    <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
      {/* CTA deshabilitada mientras /profile no exista (sin ruta rota) */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Disponible en una próxima fase"
        className="mb-3 w-full cursor-not-allowed rounded-lg bg-[#006591] px-4 py-2.5 text-sm font-semibold text-white opacity-60"
      >
        Preparar JobIT CV
      </button>
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 opacity-70">
        <IconSettings />
        <span className="text-sm">Ajustes (futuro)</span>
      </div>
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 opacity-70">
        <IconHelp />
        <span className="text-sm">Ayuda (futuro)</span>
      </div>
    </div>
  );
}

export function SiteShell({
  children,
  title = "Dashboard",
  subtitle = "Tu centro de control para construir y activar tu perfil tech."
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { isAuthenticated, accessToken, clearSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false); // drawer móvil
  const [desktopNavOpen, setDesktopNavOpen] = useState(true); // sidebar desktop (ocultable)

  async function handleLogout() {
    try {
      await logoutCandidate(accessToken);
    } catch {
      // Aunque el logout del servidor falle, limpiamos la sesión local igualmente.
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  // --- Shell público (sin sesión) ------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <BrandMark />
              <span className="text-lg">JobIT</span>
            </Link>
            <nav aria-label="Navegación principal" className="flex items-center gap-4 text-sm">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      </div>
    );
  }

  // --- Shell privado (con sesión): sidebar desktop + drawer móvil ----------
  return (
    <div className="min-h-dvh bg-[#f8f9ff] text-slate-900">
      {/* Sidebar desktop (ocultable) */}
      <aside
        id="app-sidebar"
        className={`fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 ${
          desktopNavOpen ? "md:flex" : ""
        }`}
      >
        <SidebarBrand />
        <PrivateNav pathname={pathname} />
        <SidebarBottom />
      </aside>

      {/* Drawer móvil */}
      {menuOpen ? (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-slate-900/40"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85%] flex-col border-r border-slate-200 bg-white px-4 py-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
              >
                <IconClose />
              </button>
            </div>
            <PrivateNav pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <SidebarBottom />
          </aside>
        </div>
      ) : null}

      {/* Columna de contenido */}
      <div
        className={`flex min-h-dvh flex-col transition-[margin] duration-200 ${
          desktopNavOpen ? "md:ml-64" : "md:ml-0"
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            {/* Toggle desktop: oculta/muestra la sidebar */}
            <button
              type="button"
              onClick={() => setDesktopNavOpen((open) => !open)}
              aria-label={desktopNavOpen ? "Ocultar menú" : "Mostrar menú"}
              aria-expanded={desktopNavOpen}
              aria-controls="app-sidebar"
              className="hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:inline-flex"
            >
              <IconMenu />
            </button>
            {/* Toggle móvil: abre el drawer */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            >
              <IconMenu />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h1>
              <p className="hidden text-sm text-slate-500 md:block">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-md bg-[#eff4ff] px-2.5 py-1 text-xs font-semibold text-[#006591] sm:inline-block">
              MVP candidate-first
            </span>
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
              <span className="text-sm font-medium text-slate-700">Candidato tech</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9ff] text-sm font-bold text-[#004c6e]">
                CT
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main
          className="mx-auto w-full max-w-[1440px] flex-1 p-4 md:p-6"
          style={{
            backgroundImage: "radial-gradient(rgba(148,163,184,0.25) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
