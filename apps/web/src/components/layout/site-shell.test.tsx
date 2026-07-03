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
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
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

function renderPrivate() {
  render(
    <AuthProvider>
      <SeedSessionButton />
      <SiteShell>contenido</SiteShell>
    </AuthProvider>
  );
  fireEvent.click(screen.getByText("seed-session"));
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
    renderPrivate();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Registro" })).not.toBeInTheDocument();
  });

  it("cerrar sesión llama a logout, limpia la sesión y redirige a /login", async () => {
    vi.mocked(logoutCandidate).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderPrivate();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(logoutCandidate).toHaveBeenCalledWith("tok-nav");
    // Tras el logout la nav vuelve al estado público.
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("no usa localStorage ni sessionStorage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderPrivate();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("muestra la marca JobIT y 'Perfil tech vivo' en la zona privada", () => {
    renderPrivate();
    expect(screen.getAllByText("JobIT").length).toBeGreaterThan(0);
    expect(screen.getByText("Perfil tech vivo")).toBeInTheDocument();
  });

  it("Dashboard es enlace real a /dashboard y marca aria-current=page cuando está activo", () => {
    renderPrivate();
    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboard).toHaveAttribute("href", "/dashboard");
    expect(dashboard).toHaveAttribute("aria-current", "page");
  });

  it("JobIT CV, Jobs, Guardadas y Match son enlaces reales", () => {
    renderPrivate();
    // Rutas ya reales.
    expect(screen.getByRole("link", { name: "JobIT CV" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "JobIT Jobs" })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: "Guardadas" })).toHaveAttribute("href", "/saved-jobs");
    // Match ya está disponible (Sprint 15C): enlace real a /match, sin badge "Pendiente".
    expect(screen.getByRole("link", { name: "JobIT Match" })).toHaveAttribute("href", "/match");
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
  });

  it("en móvil abre y cierra el drawer con el botón de menú", async () => {
    const user = userEvent.setup();
    renderPrivate();
    // Cerrado: existe el botón de abrir y NO el de cerrar.
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar menú" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(screen.getByRole("dialog", { name: "Menú de navegación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(screen.queryByRole("button", { name: "Cerrar menú" })).not.toBeInTheDocument();
  });

  it("en escritorio permite ocultar y mostrar la sidebar", async () => {
    const user = userEvent.setup();
    renderPrivate();
    // Por defecto la sidebar está visible → botón "Ocultar menú" con aria-expanded=true.
    const toggle = screen.getByRole("button", { name: "Ocultar menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", "app-sidebar");

    await user.click(toggle);
    // Ahora está oculta → el mismo botón pasa a "Mostrar menú" con aria-expanded=false.
    const toggleClosed = screen.getByRole("button", { name: "Mostrar menú" });
    expect(toggleClosed).toHaveAttribute("aria-expanded", "false");

    await user.click(toggleClosed);
    expect(screen.getByRole("button", { name: "Ocultar menú" })).toHaveAttribute("aria-expanded", "true");
  });
});
