import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/auth-context";

import RegisterPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>
}));
vi.mock("@/features/auth/auth-api", () => ({ registerCandidate: vi.fn() }));

function renderPage() {
  return render(
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}

afterEach(() => vi.clearAllMocks());

describe("RegisterPage", () => {
  it("muestra el título principal con la marca JobIT", () => {
    renderPage();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/crea tu perfil tech/i);
    expect(h1).toHaveTextContent(/JobIT/i);
  });

  it("renderiza el formulario (email, contraseña, confirmar y botón Crear cuenta)", () => {
    renderPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  it("enlaza a /login para iniciar sesión", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
  });

  it("no muestra login social (Google/GitHub) todavía", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /github/i })).not.toBeInTheDocument();
  });

  it("no muestra meta-copy interna ni anuncios no accionables (21A: VIS-09 / AUTH-01 / LAND-01)", () => {
    renderPage();
    // VIS-09: el badge interno de desarrollo no aparece en Auth.
    expect(screen.queryByText("MVP candidate-first")).not.toBeInTheDocument();
    // AUTH-01: sin anuncio de Google "próximamente" (no accionable).
    expect(screen.queryByText(/acceso con google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument();
    // LAND-01 (parte Auth): el módulo usa el naming real del producto.
    expect(screen.queryByText("JobIT Talent")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
