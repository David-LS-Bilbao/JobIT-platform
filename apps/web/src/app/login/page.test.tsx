import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/auth-context";

import LoginPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>
}));
vi.mock("@/features/auth/auth-api", () => ({ loginCandidate: vi.fn() }));

function renderPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

afterEach(() => vi.clearAllMocks());

describe("LoginPage", () => {
  it("muestra el título principal con la marca JobIT", () => {
    renderPage();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/inicia sesión/i);
    expect(h1).toHaveTextContent(/JobIT/i);
  });

  it("renderiza el formulario (email, contraseña y botón Iniciar sesión)", () => {
    renderPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("enlaza a /register para crear cuenta", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/register");
  });

  it("no muestra login social (Google/GitHub) todavía", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /github/i })).not.toBeInTheDocument();
  });
});
