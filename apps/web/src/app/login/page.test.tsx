import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth/auth-context";

import LoginPage from "./page";

const { searchParamsMock } = vi.hoisted(() => ({ searchParamsMock: { current: new URLSearchParams() } }));
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => searchParamsMock.current
}));
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

describe("LoginPage · aviso de sesión y marca (Sprint 21D RED)", () => {
  afterEach(() => {
    searchParamsMock.current = new URLSearchParams();
  });

  it("F1: reason=required muestra 'Inicia sesión para continuar.' sin sustituir el formulario", () => {
    searchParamsMock.current = new URLSearchParams("reason=required");
    renderPage();
    expect(screen.getByText("Inicia sesión para continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("F2: reason=expired muestra 'Tu sesión ha finalizado. Vuelve a iniciar sesión.'", () => {
    searchParamsMock.current = new URLSearchParams("reason=expired");
    renderPage();
    expect(screen.getByText("Tu sesión ha finalizado. Vuelve a iniciar sesión.")).toBeInTheDocument();
  });

  it("F3: sin reason no muestra aviso de sesión", () => {
    renderPage();
    expect(screen.queryByText("Inicia sesión para continuar.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Tu sesión ha finalizado/)).not.toBeInTheDocument();
  });

  it("F4: reason desconocido no muestra aviso", () => {
    searchParamsMock.current = new URLSearchParams("reason=whatever");
    renderPage();
    expect(screen.queryByText("Inicia sesión para continuar.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Tu sesión ha finalizado/)).not.toBeInTheDocument();
  });

  it("G3: el logo de Auth usa el gradiente canónico (sin from-sky-400)", () => {
    const { container } = renderPage();
    expect(container.querySelector(".from-jobit-brand")).not.toBeNull();
    expect(container.querySelector(".from-sky-400")).toBeNull();
  });

  it("A5: el aviso de sesión es una región anunciable (role=status, aria-live polite)", () => {
    searchParamsMock.current = new URLSearchParams("reason=required");
    renderPage();
    const notice = screen.getByText("Inicia sesión para continuar.");
    const region = notice.closest("[role='status']");
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("A6: sin reason no se renderiza ninguna región de aviso vacía", () => {
    renderPage();
    // El formulario no debe crear una live region de sesión cuando no hay motivo.
    for (const region of screen.queryAllByRole("status")) {
      expect(region).not.toHaveTextContent(/Inicia sesión para continuar|Tu sesión ha finalizado/);
    }
  });
});

describe("LoginPage · accesibilidad (Sprint 21E.2 RED)", () => {
  it("A11Y-02: expone exactamente un landmark principal <main>", () => {
    renderPage();
    // AuthFormShell debe envolver el contenido en un único <main> (hoy ausente).
    expect(screen.queryAllByRole("main")).toHaveLength(1);
  });
});
