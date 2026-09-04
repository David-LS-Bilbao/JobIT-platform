"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { logoutCandidate } from "@/features/auth/auth-api";
import { useAuth } from "@/features/auth/auth-context";
import { redirectToLogin } from "@/features/auth/auth-navigation";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { displayName } from "@/features/profile/profile-format";

/**
 * App shell reutilizable de la zona privada. Sistema visual "Nexus Professional"
 * (claro, teal/green), coherente con landing y auth; no depende del tema del SO.
 *
 * - Sin sesión: cabecera superior pública (Inicio / Login / Registro).
 * - Con sesión: layout privado con navegación real y responsive:
 *     · desktop (≥lg) → sidebar fija;
 *     · móvil/tablet (<lg) → botón "Abrir menú" + drawer con overlay.
 *
 * La navegación es una única fuente (PRIVATE_NAV) compartida por sidebar y drawer.
 * El estado activo se deriva de la ruta (`usePathname`). El header muestra la
 * identidad real del candidato (NAV-02) con fallback "Candidato tech / CT".
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
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
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
  { label: "JobIT CV", href: "/profile", status: "available", icon: <IconDoc /> },
  { label: "Portfolio", href: "/profile/portfolio", status: "available", icon: <IconGlobe /> },
  { label: "JobIT Jobs", href: "/jobs", status: "available", icon: <IconWork /> },
  { label: "Guardadas", href: "/saved-jobs", status: "available", icon: <IconBookmark /> },
  { label: "JobIT Match", href: "/match", status: "available", icon: <IconTarget /> },
  { label: "Cuenta", href: "/profile/account", status: "available", icon: <IconUser /> }
];

const activeNavClass =
  "flex items-center gap-3 rounded-lg border-r-4 border-jobit-brand bg-jobit-brand-soft px-3 py-2.5 font-semibold text-jobit-brand";
const inactiveNavClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-50";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const matches = (candidate: string): boolean =>
    pathname === candidate || pathname.startsWith(`${candidate}/`);
  if (!matches(href)) return false;
  // Prefijo más largo gana (17C): en /profile/portfolio se activa Portfolio y
  // NO JobIT CV (/profile), evitando el doble activo. El resto no cambia.
  return !PRIVATE_NAV.some(
    (item) => item.href !== href && item.href.length > href.length && matches(item.href)
  );
}

function StatusBadge({ status }: { status: Exclude<NavStatus, "available"> }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
        status === "next" ? "bg-jobit-brand-soft text-jobit-brand" : "bg-slate-100 text-slate-500"
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
        <p className="text-lg font-extrabold tracking-tight text-jobit-brand-dark">JobIT</p>
        <p className="text-xs text-slate-500">Perfil tech vivo</p>
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
  const { isAuthenticated, accessToken, clearSession, candidateIdentity, sessionStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false); // drawer móvil/tablet
  const [desktopNavOpen, setDesktopNavOpen] = useState(true); // sidebar desktop (ocultable)

  // Gestión de foco del drawer móvil (a11y, Sprint 21D): al abrir, el foco pasa
  // al control de cierre; al cerrar (botón, overlay o Escape), vuelve al botón que
  // lo abrió. Además, con aria-modal activo, Tab/Shift+Tab quedan contenidos en el
  // panel (no alcanzan el fondo). Es una contención local, no un gestor modal general.
  const openMenuRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    openMenuRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    closeMenuRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }
      // Contención de foco del drawer (aria-modal, §10): con Tab/Shift+Tab el
      // foco cicla entre los controles del panel y no alcanza el fondo. No es un
      // gestor modal general: solo evita la fuga en los bordes.
      if (event.key !== "Tab") return;
      const panel = drawerRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  // Identidad real del header (NAV-02) con fallback seguro.
  const headerName = displayName(candidateIdentity ?? { firstName: null, lastName: null });
  const headerHeadline = candidateIdentity?.headline?.trim() ? candidateIdentity.headline : null;

  async function handleLogout() {
    try {
      await logoutCandidate(accessToken);
    } catch {
      // Aunque el logout del servidor falle, limpiamos la sesión local igualmente.
    } finally {
      clearSession("logout");
      redirectToLogin(router);
    }
  }

  // Durante el arranque todavía no se sabe si hay sesión: se pinta un armazón
  // neutro en lugar del shell público, para no aparentar un cierre de sesión que
  // quizá no ha ocurrido (ADR-0014).
  if (!isAuthenticated && (sessionStatus === "bootstrapping" || sessionStatus === "unavailable")) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <span className="flex items-center gap-2 font-bold tracking-tight">
              <BrandMark />
              <span className="text-lg">JobIT</span>
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          <div role="status" aria-live="polite" className="text-sm text-slate-600">
            {sessionStatus === "unavailable"
              ? "No se ha podido verificar tu sesión."
              : "Comprobando tu sesión…"}
          </div>
          {children}
        </main>
      </div>
    );
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

  // --- Shell privado (con sesión): sidebar desktop + drawer móvil/tablet ----
  return (
    <div className="min-h-dvh bg-jobit-surface text-slate-900">
      {/* Sidebar desktop (≥lg, ocultable) */}
      <aside
        id="app-sidebar"
        className={`fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 print:hidden ${
          desktopNavOpen ? "lg:flex" : ""
        }`}
      >
        <SidebarBrand />
        <PrivateNav pathname={pathname} />
      </aside>

      {/* Drawer móvil/tablet (<lg) */}
      {menuOpen ? (
        <div className="lg:hidden print:hidden">
          <div
            className="fixed inset-0 z-40 bg-slate-900/40"
            aria-hidden="true"
            onClick={closeMenu}
          />
          <aside
            ref={drawerRef}
            id="app-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85%] flex-col border-r border-slate-200 bg-white px-4 py-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <SidebarBrand />
              <button
                ref={closeMenuRef}
                type="button"
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
              >
                <IconClose />
              </button>
            </div>
            <PrivateNav pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Columna de contenido */}
      <div
        className={`flex min-h-dvh flex-col transition-[margin] duration-200 print:ml-0! ${
          desktopNavOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6 print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Toggle desktop: oculta/muestra la sidebar */}
            <button
              type="button"
              onClick={() => setDesktopNavOpen((open) => !open)}
              aria-label={desktopNavOpen ? "Ocultar menú" : "Mostrar menú"}
              aria-expanded={desktopNavOpen}
              aria-controls="app-sidebar"
              className="hidden shrink-0 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:inline-flex"
            >
              <IconMenu />
            </button>
            {/* Toggle móvil/tablet: abre el drawer */}
            <button
              ref={openMenuRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="app-mobile-nav"
              className="shrink-0 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
            >
              <IconMenu />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h1>
              <p className="hidden truncate text-sm text-slate-500 md:block">{subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 lg:flex">
              <div className="min-w-0 text-right">
                <p className="max-w-[12rem] truncate text-sm font-medium text-slate-700">{headerName}</p>
                {headerHeadline ? (
                  <p className="max-w-[12rem] truncate text-xs text-slate-500">{headerHeadline}</p>
                ) : null}
              </div>
              <ProfileAvatar
                name={headerName}
                avatarUrl={candidateIdentity?.avatarUrl ?? null}
                decorative
                imgClassName="h-9 w-9 shrink-0 rounded-full object-cover"
                fallbackClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jobit-brand-muted text-sm font-bold text-jobit-brand-dark"
              />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
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
