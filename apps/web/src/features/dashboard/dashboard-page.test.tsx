import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { logoutCandidate } from "@/features/auth/auth-api";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getCandidateDashboard } from "@/features/dashboard/dashboard-api";
import { ApiClientError } from "@/lib/api-client";
import type { CandidateDashboardDto, JobPublicDto, UserDto } from "@/types/api";

import { DashboardPage } from "./dashboard-page";

// `routerMock` debe ser estable entre renders (como el useRouter real de Next):
// DashboardPage usa `router` como dependencia de un efecto.
const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/dashboard" }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>
}));
vi.mock("@/features/dashboard/dashboard-api", () => ({ getCandidateDashboard: vi.fn() }));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

function makeJob(id: string, title: string, company: string, location: string | null): JobPublicDto {
  return {
    id,
    title,
    company,
    location,
    remoteType: "REMOTE",
    description: "desc",
    requirements: [],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    tags: [],
    status: "ACTIVE",
    postedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    source: "INTERNAL",
    sourceUrl: null
  };
}

const fullDto: CandidateDashboardDto = {
  profile: { firstName: "Ana", lastName: "Pérez", headline: "Frontend dev", completionPercentage: 80 },
  skills: ["React", "TypeScript"],
  savedJobs: {
    total: 2,
    recent: [{ savedAt: "2026-01-02T00:00:00.000Z", job: makeJob("j1", "Frontend Developer", "ACME", "Bilbao") }]
  },
  matches: [
    {
      job: makeJob("j2", "React Engineer", "TechCo", null),
      score: 80,
      level: "VERY_GOOD",
      matchedSkills: ["React"],
      missingSkills: ["GraphQL"]
    }
  ],
  nextActions: [{ action: "complete_profile", label: "Completa tu perfil profesional" }]
};

const emptyDto: CandidateDashboardDto = {
  profile: { firstName: null, lastName: null, headline: null, completionPercentage: 0 },
  skills: [],
  savedJobs: { total: 0, recent: [] },
  matches: [],
  nextActions: []
};

// Siembra la sesión desde un manejador de evento (no en un efecto ni reasignando
// una variable global en el render); luego monta DashboardPage ya con sesión.
function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-dash", user: sessionUser })}>
      seed-session
    </button>
  );
}

function renderWithSession() {
  const utils = render(
    <AuthProvider>
      <SeedSessionButton />
    </AuthProvider>
  );
  fireEvent.click(screen.getByText("seed-session"));
  utils.rerender(
    <AuthProvider>
      <DashboardPage />
    </AuthProvider>
  );
  return utils;
}

function renderWithoutSession() {
  return render(
    <AuthProvider>
      <DashboardPage />
    </AuthProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  it("sin sesión redirige a /login y no pide el dashboard", async () => {
    renderWithoutSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getCandidateDashboard).not.toHaveBeenCalled();
  });

  it("muestra el estado de carga mientras pide el dashboard", async () => {
    let resolvePromise: (dto: CandidateDashboardDto) => void = () => {};
    vi.mocked(getCandidateDashboard).mockReturnValueOnce(
      new Promise<CandidateDashboardDto>((resolve) => {
        resolvePromise = resolve;
      })
    );
    renderWithSession();
    expect(await screen.findByText("Cargando tu panel…")).toBeInTheDocument();
    resolvePromise(emptyDto);
    await waitFor(() => expect(screen.queryByText("Cargando tu panel…")).not.toBeInTheDocument());
  });

  it("con sesión pide el dashboard con el token y renderiza el hub", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    expect(await screen.findByText("Hola, Ana")).toBeInTheDocument();
    expect(getCandidateDashboard).toHaveBeenCalledWith("tok-dash");
    // App shell privado
    expect(screen.getByText("Perfil tech vivo")).toBeInTheDocument();
    expect(screen.getByText("MVP candidate-first")).toBeInTheDocument();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    // Secciones del hub
    expect(screen.getByText("Acciones rápidas")).toBeInTheDocument();
    expect(screen.getByText("Tu próximo paso")).toBeInTheDocument();
    expect(screen.getByText("Vista previa de JobIT CV")).toBeInTheDocument();
    // Métricas reales y skill real en la preview de CV
    expect(screen.getByText("Matches")).toBeInTheDocument();
    expect(screen.getAllByText("Skills").length).toBeGreaterThan(0);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("con un dashboard vacío muestra placeholders y navegación honesta a /profile", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(emptyDto);
    renderWithSession();
    expect(await screen.findByText("Hola, candidato tech")).toBeInTheDocument();
    // Placeholder de skills en la preview de CV
    expect(screen.getByText("Añade tus skills para mostrarlas aquí.")).toBeInTheDocument();
    // JobIT CV disponible: sus CTAs enlazan a /profile
    const prepare = screen.getAllByRole("link", { name: /preparar jobit cv/i });
    expect(prepare.length).toBeGreaterThan(0);
    prepare.forEach((link) => expect(link).toHaveAttribute("href", "/profile"));
    expect(screen.getByRole("link", { name: /añadir skills/i })).toHaveAttribute("href", "/profile#skills");
    // Módulos aún no disponibles: siguen deshabilitados (sin rutas rotas)
    expect(screen.getByRole("button", { name: /explorar ofertas/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /revisar matches/i })).toBeDisabled();
  });

  it("muestra los módulos del MVP sin copy de dev ni enlaces rotos", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    // Módulos MVP (algunos también en la sidebar → pueden duplicarse)
    expect(screen.getAllByText("JobIT CV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("JobIT Jobs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Guardadas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("JobIT Match").length).toBeGreaterThan(0);

    // Sin roadmap interno de desarrollo
    expect(screen.queryByText("Estado del MVP")).not.toBeInTheDocument();
    expect(screen.queryByText(/autenticación/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Landing")).not.toBeInTheDocument();

    // Nada fuera de MVP
    expect(screen.queryByText(/expertech/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/export pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ai reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/inteligencia artificial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();

    // JobIT CV (/profile), Jobs y Guardadas ya son enlaces activos desde la sidebar…
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href")?.startsWith("/profile"))).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/jobs")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/saved-jobs")).toBe(true);
    // …pero Match sigue sin enlace.
    expect(links.some((l) => l.getAttribute("href") === "/match")).toBe(false);
  });

  it("ante 401 limpia la sesión y redirige a /login", async () => {
    vi.mocked(getCandidateDashboard).mockRejectedValueOnce(new ApiClientError(401, "UNAUTHORIZED", "x"));
    renderWithSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(
      await screen.findByText("Tu sesión ha caducado. Vuelve a iniciar sesión.")
    ).toBeInTheDocument();
  });

  it("logout limpia la sesión y redirige a /login", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    vi.mocked(logoutCandidate).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Hola, Ana");
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(logoutCandidate).toHaveBeenCalledWith("tok-dash");
  });

  it("no usa localStorage ni sessionStorage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(emptyDto);
    renderWithSession();
    await screen.findByText("Hola, candidato tech");
    expect(setItem).not.toHaveBeenCalled();
  });
});
