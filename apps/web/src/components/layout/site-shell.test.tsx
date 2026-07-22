import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { logoutCandidate } from "@/features/auth/auth-api";
import type { UserDto } from "@/types/api";

import { SiteShell } from "./site-shell";

// routerMock estable entre renders (como el useRouter real de Next). El pathname
// es parametrizable por test (17C: estados activos de la navegación privada).
const { pushMock, routerMock, pathnameMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push }, pathnameMock: { current: "/dashboard" } };
});
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => pathnameMock.current
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));
vi.mock("@/features/auth/auth-identity", () => ({ loadCandidateIdentity: vi.fn(() => new Promise(() => {})) }));

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
  pathnameMock.current = "/dashboard";
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

  it("sin placeholders 'futuro' y con las 6 rutas principales (17D.1)", () => {
    renderPrivate();
    // Retirados en 17D.1: ruido no accionable.
    expect(screen.queryByText(/ajustes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ayuda/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/futuro/i)).not.toBeInTheDocument();
    // Las 6 rutas principales siguen presentes.
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "JobIT CV" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute("href", "/profile/portfolio");
    expect(screen.getByRole("link", { name: "JobIT Jobs" })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: "Guardadas" })).toHaveAttribute("href", "/saved-jobs");
    expect(screen.getByRole("link", { name: "JobIT Match" })).toHaveAttribute("href", "/match");
  });

  it("muestra Portfolio en la navegación privada como enlace real (17C)", () => {
    renderPrivate();
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "href",
      "/profile/portfolio"
    );
  });

  it("en /profile/portfolio activa Portfolio y NO JobIT CV (prefijo más largo gana)", () => {
    pathnameMock.current = "/profile/portfolio";
    renderPrivate();
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "JobIT CV" })).not.toHaveAttribute("aria-current");
  });

  it("en /profile activa JobIT CV y no Portfolio", () => {
    pathnameMock.current = "/profile";
    renderPrivate();
    expect(screen.getByRole("link", { name: "JobIT CV" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Portfolio" })).not.toHaveAttribute("aria-current");
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

describe("SiteShell · Sprint 21D (RED estructura/marca)", () => {
  it("D1: breakpoint del shell en lg (no md) en las 4 clases coordinadas", () => {
    renderPrivate();
    expect(document.getElementById("app-sidebar")).toHaveClass("lg:flex");
    expect(screen.getByRole("main").parentElement).toHaveClass("lg:ml-64");
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveClass("lg:hidden");
    expect(screen.getByRole("button", { name: "Ocultar menú" })).toHaveClass("lg:inline-flex");
  });

  it("D2: header anti-overflow (min-w-0 / truncate / shrink-0) con logout visible", () => {
    renderPrivate();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.parentElement).toHaveClass("min-w-0");
    expect(h1).toHaveClass("truncate");
    const logout = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(logout.parentElement).toHaveClass("shrink-0");
    expect(logout).toBeVisible();
  });

  it("D6: sin CTA 'Preparar JobIT CV' en el pie del sidebar; el ítem 'JobIT CV' permanece", () => {
    renderPrivate();
    expect(screen.queryByRole("link", { name: "Preparar JobIT CV" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "JobIT CV" })).toHaveAttribute("href", "/profile");
  });

  it("G2: el shell usa el gradiente canónico jobit-brand→jobit-green, sin sky→emerald", () => {
    renderPrivate();
    expect(document.querySelector(".from-jobit-brand")).not.toBeNull();
    expect(document.querySelector(".from-sky-400")).toBeNull();
  });
});

describe("SiteShell · a11y navegación móvil (Sprint 21D.5)", () => {
  it("A1: el botón de abrir expone aria-expanded y aria-controls al panel móvil", async () => {
    const user = userEvent.setup();
    renderPrivate();
    const trigger = screen.getByRole("button", { name: "Abrir menú" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const controls = trigger.getAttribute("aria-controls");
    expect(controls).toBeTruthy();

    await user.click(trigger);
    // El mismo control refleja el estado abierto y su aria-controls apunta al panel real.
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("dialog", { name: "Menú de navegación" });
    expect(panel).toHaveAttribute("id", controls as string);
    expect(document.getElementById(controls as string)).toBe(panel);
  });

  it("A2: al abrir el drawer, el foco pasa al control de cierre", async () => {
    const user = userEvent.setup();
    renderPrivate();
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveFocus();
  });

  it("A3: Escape cierra el drawer y devuelve el foco al botón de abrir", async () => {
    const user = userEvent.setup();
    renderPrivate();
    const trigger = screen.getByRole("button", { name: "Abrir menú" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("A4: cerrar con el botón devuelve el foco al botón de abrir", async () => {
    const user = userEvent.setup();
    renderPrivate();
    const trigger = screen.getByRole("button", { name: "Abrir menú" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  // aria-modal="true" (mini-spec §10) exige que el foco no alcance el fondo:
  // contención de foco local mínima (Tab/Shift+Tab ciclan dentro del drawer).
  it("A7: Shift+Tab desde el control de cierre no escapa al contenido de fondo", async () => {
    const user = userEvent.setup();
    renderPrivate();
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    const dialog = screen.getByRole("dialog");
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("A8: Tab desde el último control del drawer vuelve al primero (cierre)", async () => {
    const user = userEvent.setup();
    renderPrivate();
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    const dialog = screen.getByRole("dialog");
    const links = within(dialog).getAllByRole("link");
    links[links.length - 1].focus();
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveFocus();
  });
});
