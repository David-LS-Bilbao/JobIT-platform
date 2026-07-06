import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  profile: {
    firstName: "Ana",
    lastName: "Pérez",
    headline: "Frontend dev",
    completionPercentage: 80,
    summary: "Frontend con foco en producto.",
    avatarUrl: null
  },
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
  cvSections: {
    basics: true,
    skills: true,
    experience: true,
    education: false,
    projects: false,
    links: false,
    preferences: false
  },
  portfolio: null,
  nextActions: [{ action: "complete_profile", label: "Completa tu perfil profesional" }]
};

const emptyDto: CandidateDashboardDto = {
  profile: {
    firstName: null,
    lastName: null,
    headline: null,
    completionPercentage: 0,
    summary: null,
    avatarUrl: null
  },
  skills: [],
  savedJobs: { total: 0, recent: [] },
  matches: [],
  cvSections: {
    basics: false,
    skills: false,
    experience: false,
    education: false,
    projects: false,
    links: false,
    preferences: false
  },
  portfolio: null,
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
    // Módulos operativos (Sprint 17B): las QuickActions enlazan a sus rutas reales
    expect(screen.getByRole("link", { name: /explorar ofertas/i })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: /revisar matches/i })).toHaveAttribute("href", "/match");

    // Empty states accionables de la actividad (guardadas y matches a cero)
    expect(screen.getByRole("link", { name: /buscar ofertas/i })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: /completar perfil/i })).toHaveAttribute("href", "/profile");
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
    // …y Match también es enlace real desde el Sprint 15C.
    expect(links.some((l) => l.getAttribute("href") === "/match")).toBe(true);

    // Sprint 17B: el CONTENIDO del hub también enlaza (QuickActions + ModuleCards),
    // no solo la sidebar → al menos 2 enlaces por destino operativo.
    expect(links.filter((l) => l.getAttribute("href") === "/jobs").length).toBeGreaterThanOrEqual(2);
    expect(links.filter((l) => l.getAttribute("href") === "/saved-jobs").length).toBeGreaterThanOrEqual(2);
    expect(links.filter((l) => l.getAttribute("href") === "/match").length).toBeGreaterThanOrEqual(2);

    // Ningún módulo operativo aparece ya como "Pendiente"
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
  });

  it("renderiza las guardadas recientes con enlace al detalle y CTA a /saved-jobs", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByRole("link", { name: "Frontend Developer" })).toHaveAttribute(
      "href",
      "/jobs/j1"
    );
    expect(screen.getByText(/ACME/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver todas las guardadas/i })).toHaveAttribute(
      "href",
      "/saved-jobs"
    );
  });

  it("renderiza los mejores matches con score, skills coincidentes y CTA a /match", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByRole("link", { name: "React Engineer" })).toHaveAttribute(
      "href",
      "/jobs/j2"
    );

    // Score y skill coincidente, acotados a la sección (el 80% y "React" existen también fuera)
    const section = screen.getByText("Tus mejores matches").closest("section");
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByText("80%")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("React")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /ver todos los matches/i })).toHaveAttribute(
      "href",
      "/match"
    );
  });

  it("renderiza nextActions conocidas como enlaces y tolera acciones desconocidas", async () => {
    const dto: CandidateDashboardDto = {
      ...fullDto,
      nextActions: [
        { action: "complete_profile", label: "Completa tu perfil profesional" },
        { action: "explore_jobs", label: "Explora ofertas disponibles" },
        { action: "future_action", label: "Acción futura" }
      ]
    };
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(dto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(
      screen.getByRole("link", { name: /completa tu perfil profesional/i })
    ).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: /explora ofertas disponibles/i })).toHaveAttribute(
      "href",
      "/jobs"
    );
    // Acción desconocida: visible pero sin enlace (no rompe la UI ni navega)
    expect(screen.getByText("Acción futura")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /acción futura/i })).not.toBeInTheDocument();
  });

  it("muestra el CTA de gestión de Portfolio hacia /profile/portfolio", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByRole("link", { name: /gestionar portfolio/i })).toHaveAttribute(
      "href",
      "/profile/portfolio"
    );
  });

  it("muestra el summary real en la preview del CV", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByText("Frontend con foco en producto.")).toBeInTheDocument();
    expect(screen.queryByText(/añade un resumen profesional/i)).not.toBeInTheDocument();
  });

  it("muestra placeholder honesto cuando summary es null", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(emptyDto);
    renderWithSession();
    await screen.findByText("Hola, candidato tech");

    expect(screen.getByText(/añade un resumen profesional/i)).toBeInTheDocument();
  });

  it("el checklist refleja cvSections reales (no valores fijos)", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByText("Datos profesionales").closest("li")).toHaveAttribute("data-done", "true");
    expect(screen.getByText("Experiencia").closest("li")).toHaveAttribute("data-done", "true");
    expect(screen.getByText("Proyectos").closest("li")).toHaveAttribute("data-done", "false");
    expect(screen.getByText("Enlaces").closest("li")).toHaveAttribute("data-done", "false");
  });

  it("muestra la foto real cuando avatarUrl existe", async () => {
    const dto: CandidateDashboardDto = {
      ...fullDto,
      profile: { ...fullDto.profile, avatarUrl: "/uploads/avatars/ana.png" }
    };
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(dto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    const img = screen.getByRole("img", { name: "Ana Pérez" });
    expect(img).toHaveAttribute("src", expect.stringContaining("/uploads/avatars/ana.png"));
  });

  it("portfolio sin configurar muestra CTA de gestión y ningún enlace público", async () => {
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(fullDto); // portfolio: null
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByText("Sin configurar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gestionar portfolio/i })).toHaveAttribute(
      "href",
      "/profile/portfolio"
    );
    expect(screen.queryByRole("link", { name: /ver página pública/i })).not.toBeInTheDocument();
  });

  it("portfolio configurado sin publicar muestra su estado sin enlace público", async () => {
    const dto: CandidateDashboardDto = {
      ...fullDto,
      portfolio: { isPublished: false, slug: "ana-dev", publicUrlPath: "/u/ana-dev" }
    };
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(dto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByText("Sin publicar")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ver página pública/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gestionar portfolio/i })).toHaveAttribute(
      "href",
      "/profile/portfolio"
    );
  });

  it("portfolio publicado muestra el enlace público a /u/<slug>", async () => {
    const dto: CandidateDashboardDto = {
      ...fullDto,
      portfolio: { isPublished: true, slug: "ana-perez", publicUrlPath: "/u/ana-perez" }
    };
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(dto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver página pública/i })).toHaveAttribute(
      "href",
      "/u/ana-perez"
    );
  });

  it("mapea las nextActions nuevas del catálogo a sus rutas", async () => {
    const dto: CandidateDashboardDto = {
      ...fullDto,
      nextActions: [
        { action: "add_projects", label: "Añade proyectos destacados" },
        { action: "publish_portfolio", label: "Publica tu portfolio" },
        { action: "review_matches", label: "Revisa tus mejores matches" }
      ]
    };
    vi.mocked(getCandidateDashboard).mockResolvedValueOnce(dto);
    renderWithSession();
    await screen.findByText("Hola, Ana");

    expect(screen.getByRole("link", { name: "Añade proyectos destacados" })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.getByRole("link", { name: "Publica tu portfolio" })).toHaveAttribute(
      "href",
      "/profile/portfolio"
    );
    expect(screen.getByRole("link", { name: "Revisa tus mejores matches" })).toHaveAttribute(
      "href",
      "/match"
    );
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
