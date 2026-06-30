"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { logoutCandidate } from "@/features/auth/auth-api";
import { useAuth } from "@/features/auth/auth-context";

/**
 * Shell de página reutilizable: cabecera con marca + navegación coherente con la
 * sesión y un área principal. La sesión vive en memoria (ADR-0006): al recargar
 * se pierde y la nav vuelve al estado público.
 */
const PUBLIC_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registro" }
];

const PRIVATE_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Inicio" },
  { href: "/dashboard", label: "Dashboard" }
];

// Estética forzada clara, coherente con la landing y las pantallas de auth
// (no depende del tema del sistema): superficie slate-50 + cabecera blanca.
const linkClasses = "font-medium text-slate-600 transition-colors hover:text-slate-900";

export function SiteShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, accessToken, clearSession } = useAuth();
  const router = useRouter();
  const links = isAuthenticated ? PRIVATE_LINKS : PUBLIC_LINKS;

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

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white">
              J
            </span>
            <span className="text-lg">JobIT</span>
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClasses}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cerrar sesión
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
