import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { logoutCandidate } from "@/features/auth/auth-api";
import { type AuthContextValue, useAuth } from "@/features/auth/auth-context";

import { SiteShell } from "./site-shell";

// Sprint 21D: identidad real del header. Mockeamos useAuth para controlar el
// snapshot de identidad y el logout, sin depender del AuthProvider real.
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/dashboard"
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));
vi.mock("@/features/auth/auth-context", () => ({ useAuth: vi.fn() }));

const clearSessionMock = vi.fn();

function mockAuth(overrides: Record<string, unknown> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    accessToken: "tok-id",
    user: { id: "u1", email: "ana@jobit.dev", role: "CANDIDATE", createdAt: "2026-01-01T00:00:00.000Z" },
    candidateIdentity: null,
    identityResolved: true,
    endReason: null,
    setSession: vi.fn(),
    clearSession: clearSessionMock,
    updateCandidateIdentity: vi.fn(),
    ...overrides
  } as unknown as AuthContextValue);
}

afterEach(() => vi.clearAllMocks());

describe("SiteShell · identidad real del header (Sprint 21D RED)", () => {
  it("D3: con identidad real muestra nombre, headline e iniciales; sin 'Candidato tech' ni email", () => {
    mockAuth({
      candidateIdentity: { firstName: "Ana", lastName: "Rivas", headline: "Frontend developer", avatarUrl: null }
    });
    render(<SiteShell>contenido</SiteShell>);
    expect(screen.getByText("Ana Rivas")).toBeInTheDocument();
    expect(screen.getByText("Frontend developer")).toBeInTheDocument();
    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.queryByText("Candidato tech")).not.toBeInTheDocument();
    expect(screen.queryByText(/ana@jobit\.dev/)).not.toBeInTheDocument();
  });

  it("D4: sin identidad útil usa fallback 'Candidato tech' / 'CT'", () => {
    mockAuth({ candidateIdentity: null, identityResolved: true });
    render(<SiteShell>contenido</SiteShell>);
    expect(screen.getByText("Candidato tech")).toBeInTheDocument();
    expect(screen.getByText("CT")).toBeInTheDocument();
  });

  it("D5: identidad no resuelta no bloquea el shell ni los children (sin loading global)", () => {
    mockAuth({ candidateIdentity: null, identityResolved: false });
    render(<SiteShell>contenido-visible</SiteShell>);
    expect(screen.getByText("contenido-visible")).toBeInTheDocument();
    expect(screen.getByText("Candidato tech")).toBeInTheDocument();
    expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
  });

  it("D8: el avatar del header es decorativo (alt='') porque el nombre ya está en texto visible", () => {
    mockAuth({
      candidateIdentity: {
        firstName: "Ana",
        lastName: "Rivas",
        headline: "Frontend developer",
        avatarUrl: "https://cdn.test/ana.png"
      }
    });
    const { container } = render(<SiteShell>contenido</SiteShell>);
    // El nombre accesible de la persona lo aporta el texto visible, no el alt de la imagen.
    expect(screen.getByText("Ana Rivas")).toBeInTheDocument();
    const img = container.querySelector("header img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    // No se duplica el nombre como texto alternativo de la imagen.
    expect(screen.queryByAltText("Ana Rivas")).not.toBeInTheDocument();
  });

  it("D7: 'Cerrar sesión' llama a clearSession('logout') y navega a /login sin reason", async () => {
    vi.mocked(logoutCandidate).mockResolvedValueOnce(undefined);
    mockAuth();
    const user = userEvent.setup();
    render(<SiteShell>contenido</SiteShell>);
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(clearSessionMock).toHaveBeenCalledWith("logout"));
    const calls = pushMock.mock.calls;
    expect(calls.some((c) => c[0] === "/login")).toBe(true);
    expect(calls.some((c) => String(c[0]).includes("reason="))).toBe(false);
  });
});
