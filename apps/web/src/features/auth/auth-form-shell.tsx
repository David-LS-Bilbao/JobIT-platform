import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";

interface AuthFormShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Marco visual compartido por login y register dentro del SiteShell. */
export function AuthFormShell({ title, subtitle, children, footer }: AuthFormShellProps) {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">{footer}</div>
      </div>
    </SiteShell>
  );
}
