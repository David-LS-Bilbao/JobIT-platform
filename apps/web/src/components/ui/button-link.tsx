import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  children: ReactNode;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors";

const variantClasses: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:opacity-90",
  secondary: "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
};

/** Enlace con apariencia de botón. Primitiva UI mínima reutilizable. */
export function ButtonLink({ href, variant = "secondary", className, children, ...rest }: ButtonLinkProps) {
  return (
    <a href={href} className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`.trim()} {...rest}>
      {children}
    </a>
  );
}
