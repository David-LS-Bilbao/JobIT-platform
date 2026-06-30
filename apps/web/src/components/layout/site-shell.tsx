import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shell de página reutilizable: cabecera con marca + navegación estática y un
 * área principal. Preparado para las pantallas login/register/dashboard de la
 * siguiente fase (todavía no se monta en la landing).
 */
const NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registro" },
  { href: "/dashboard", label: "Dashboard" }
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            JobIT
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
