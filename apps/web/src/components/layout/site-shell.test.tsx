import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { logoutCandidate } from "@/features/auth/auth-api";
import type { UserDto } from "@/types/api";

import { SiteShell } from "./site-shell";

// routerMock estable entre renders (como el useRouter real de Next).
const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

// Siembra la sesión desde un manejador de evento (no en render ni efecto).
function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-nav", user: sessionUser })}>
      seed-session
    </button>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("SiteShell navegación auth-aware", () => {
  it("sin sesión muestra Login y Registro y oculta Dashboard/Cerrar sesión", () => {
    render(
      <AuthProvider>
        <SiteShell>contenido</SiteShell>
      </AuthProvider>
    );
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Registro" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("con sesión muestra Dashboard y Cerrar sesión y oculta Login/Registro", () => {
    render(
      <AuthProvider>
        <SeedSessionButton />
        <SiteShell>contenido</SiteShell>
      </AuthProvider>
    );
    fireEvent.click(screen.getByText("seed-session"));
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Registro" })).not.toBeInTheDocument();
  });

  it("cerrar sesión llama a logout, limpia la sesión y redirige a /login", async () => {
    vi.mocked(logoutCandidate).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SeedSessionButton />
        <SiteShell>contenido</SiteShell>
      </AuthProvider>
    );
    fireEvent.click(screen.getByText("seed-session"));
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(logoutCandidate).toHaveBeenCalledWith("tok-nav");
    // Tras el logout la nav vuelve al estado público.
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("no usa localStorage ni sessionStorage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(
      <AuthProvider>
        <SeedSessionButton />
        <SiteShell>contenido</SiteShell>
      </AuthProvider>
    );
    fireEvent.click(screen.getByText("seed-session"));
    expect(setItem).not.toHaveBeenCalled();
  });
});
