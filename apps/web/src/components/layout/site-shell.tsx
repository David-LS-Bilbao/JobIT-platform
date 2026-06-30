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

const linkClasses =
  "text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400";

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
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            JobIT
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
                className="rounded-full border border-black/10 px-3 py-1.5 font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                Cerrar sesión
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
