import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ProfilePortfolioSettings } from "@/features/profile/profile-portfolio-settings";
import type { PortfolioSettingsDto } from "@/types/api";

/**
 * Mitad visible de `AUDIT03-URL-SCHEME-01`.
 *
 * Cuando el entorno desplegado no tiene una URL publica valida, el builder
 * devuelve `null`. Lo que no puede pasar es que eso degenere en un enlace roto,
 * un `undefined` pintado o un QR que codifique basura: la interfaz debe decir
 * que el enlace no esta disponible.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/profile/portfolio/settings"
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/profile/profile-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/profile/profile-api")>()),
  // Entorno desplegado sin NEXT_PUBLIC_PUBLIC_BASE_URL valida.
  buildPublicPortfolioUrl: () => null,
  updateMyPortfolioSettings: vi.fn(),
  publishMyPortfolio: vi.fn(),
  unpublishMyPortfolio: vi.fn()
}));

const published: PortfolioSettingsDto = {
  slug: "ana-perez",
  isPublished: true,
  publishedAt: "2026-07-02T00:00:00.000Z",
  showLocation: true,
  showAvailability: true,
  showPreferences: false,
  publicUrlPath: "/u/ana-perez"
};

describe("Enlace público no disponible", () => {
  it("avisa en lugar de pintar un enlace degradado", () => {
    render(<ProfilePortfolioSettings settings={published} token="tok" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /el enlace público no está disponible/i
    );
    expect(screen.queryByRole("button", { name: /copiar enlace/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined|null/i)).not.toBeInTheDocument();
  });

  it("no genera QR y explica por qué", () => {
    render(<ProfilePortfolioSettings settings={published} token="tok" />);

    expect(screen.getByText(/no se puede generar el qr/i)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /código qr/i })).not.toBeInTheDocument();
  });

  // La ruta relativa sigue siendo informacion util y no depende de la base.
  it("sigue mostrando la ruta pública relativa", () => {
    render(<ProfilePortfolioSettings settings={published} token="tok" />);
    expect(screen.getByText(/Ruta pública: \/u\/ana-perez/)).toBeInTheDocument();
  });
});
