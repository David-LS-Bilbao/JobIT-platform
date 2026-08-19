import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/auth-context";

import RegisterPage from "./page";

// El AuthProvider intenta recuperar la sesión al montar (ADR-0014). Aquí se
// neutraliza ese arranque para que cada test controle el estado de sesión:
// `session-lost` deja el contexto en anónimo terminal, como antes del bootstrap.
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    ensureRefreshed: vi.fn(async () => ({ status: "session-lost" as const })),
    registerAuthBridge: vi.fn()
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>
}));
vi.mock("@/features/auth/auth-api", () => ({ registerCandidate: vi.fn() }));
vi.mock("@/features/auth/auth-identity", () => ({ loadCandidateIdentity: vi.fn(() => new Promise(() => {})) }));

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

describe("RegisterPage · accesibilidad (Sprint 21E.2 RED)", () => {
  it("A11Y-02: expone exactamente un landmark principal <main>", () => {
    renderPage();
    // AuthFormShell debe envolver el contenido en un único <main> (hoy ausente).
    expect(screen.queryAllByRole("main")).toHaveLength(1);
  });
});
