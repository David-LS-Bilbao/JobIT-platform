import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getMyProfile } from "@/features/profile/profile-api";
import { ProfilePortfolioPage } from "@/features/profile/profile-portfolio-page";
import type { CandidateProfileDto, UserDto } from "@/types/api";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/profile/portfolio" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/profile/profile-api", async (importOriginal) => ({
  // Mantiene resolveProfileImageUrl real (lo usa ProfileAvatar); mockea solo la red.
  ...(await importOriginal<typeof import("@/features/profile/profile-api")>()),
  getMyProfile: vi.fn()
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

const fullProfile: CandidateProfileDto = {
  id: "p1",
  userId: "u1",
  firstName: "Ana",
  lastName: "Pérez",
  headline: "Frontend Developer",
  summary: "Desarrolladora frontend centrada en React.",
  location: "Bilbao",
  locationRemote: true,
  availabilityStatus: "OPEN",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  completionPercentage: 85,
  skills: [
    { id: "s1", name: "React", level: "ADVANCED", category: "Frontend" },
    { id: "s2", name: "TypeScript", level: "INTERMEDIATE", category: null }
  ],
  experiences: [
    {
      id: "e1",
      company: "ACME",
      role: "Frontend Developer",
      startDate: "2021-01-01T00:00:00.000Z",
      endDate: null,
      current: true,
      description: "Construyendo interfaces.",
      location: "Remoto"
    }
  ],
  education: [
    {
      id: "ed1",
      institution: "UPV/EHU",
      title: "Grado en Informática",
      field: "Software",
      startDate: "2015-09-01T00:00:00.000Z",
      endDate: "2019-06-01T00:00:00.000Z",
      current: false
    }
  ],
  projects: [
    {
      id: "pr1",
      name: "design-system",
      description: "DS interno",
      technologies: ["React", "TypeScript"],
      url: "https://ds.jobit.dev",
      repoUrl: "https://github.com/ana/ds"
    }
  ],
  links: [{ id: "l1", type: "GITHUB", url: "https://github.com/ana" }],
  preferences: {
    id: "pf1",
    desiredRoles: ["Frontend"],
    preferredLocations: ["Bilbao"],
    remotePreference: "REMOTE",
    seniority: "MID",
    salaryMin: 35000,
    salaryMax: 50000,
    contractTypes: ["FULL_TIME", "FREELANCE"]
  }
};

const emptyProfile: CandidateProfileDto = {
  id: "p0",
  userId: "u0",
  firstName: null,
  lastName: null,
  headline: null,
  summary: null,
  location: null,
  locationRemote: false,
  availabilityStatus: "ACTIVE",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completionPercentage: 0,
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  links: [],
  preferences: null
};

function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-cv", user: sessionUser })}>
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
      <ProfilePortfolioPage />
    </AuthProvider>
  );
  return utils;
}

function sectionByHeading(name: string) {
  return within(screen.getByRole("heading", { name }).closest("section") as HTMLElement);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ProfilePortfolioPage (/profile/portfolio · Portfolio JobIT CV)", () => {
  it("es privada: sin sesión redirige al login", async () => {
    render(
      <AuthProvider>
        <ProfilePortfolioPage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it("consume GET /api/profile/me con el token de sesión y renderiza el título", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    expect(screen.getByText("Portfolio JobIT CV")).toBeInTheDocument();
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledWith("tok-cv"));
  });

  it("muestra nombre, headline y resumen del perfil", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    expect(await screen.findByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(screen.getAllByText("Frontend Developer").length).toBeGreaterThan(0);
    expect(screen.getByText("Desarrolladora frontend centrada en React.")).toBeInTheDocument();
  });

  it("muestra skills, experiencia, educación y proyectos", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    await screen.findByRole("heading", { name: "Ana Pérez" });
    // Skills (acotado a su sección para desambiguar de las tecnologías del proyecto)
    expect(sectionByHeading("Skills").getByText(/React/)).toBeInTheDocument();
    expect(sectionByHeading("Skills").getByText(/TypeScript/)).toBeInTheDocument();
    // Experiencia
    expect(screen.getByRole("heading", { name: "Experiencia" })).toBeInTheDocument();
    expect(screen.getByText(/ACME/)).toBeInTheDocument();
    // Educación
    expect(screen.getByText(/UPV\/EHU/)).toBeInTheDocument();
    expect(screen.getByText("Grado en Informática")).toBeInTheDocument();
    // Proyectos
    expect(screen.getByText("design-system")).toBeInTheDocument();
  });

  it("muestra enlaces externos con target=_blank y rel de seguridad", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    const link = await screen.findByRole("link", { name: "https://github.com/ana" });
    expect(link).toHaveAttribute("href", "https://github.com/ana");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("expone el botón Imprimir / Guardar PDF y al pulsarlo llama a window.print", async () => {
    const printMock = vi.fn();
    vi.stubGlobal("print", printMock);
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    await screen.findByRole("heading", { name: "Ana Pérez" });
    const printButton = screen.getByRole("button", { name: "Imprimir / Guardar PDF" });
    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("con perfil vacío usa el fallback 'Candidato tech' y no rompe", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    renderWithSession();

    expect(await screen.findByRole("heading", { name: "Candidato tech" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimir / Guardar PDF" })).toBeInTheDocument();
  });

  it("muestra la ayuda de impresión (A4 / desactivar encabezados) marcada como print:hidden", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    await screen.findByRole("heading", { name: "Ana Pérez" });
    const help = screen.getByText(/desactiva .*Encabezados y pies de página/i);
    expect(help).toBeInTheDocument();
    expect(help).toHaveClass("print:hidden");
  });

  it("humaniza los tipos de contrato y no expone el enum crudo", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    await screen.findByRole("heading", { name: "Ana Pérez" });
    const prefs = sectionByHeading("Preferencias");
    expect(prefs.getByText(/Jornada completa/)).toBeInTheDocument();
    expect(prefs.getByText(/Freelance/)).toBeInTheDocument();
    expect(screen.queryByText(/FULL_TIME/)).not.toBeInTheDocument();
  });

  it("renderiza la imagen con un avatarUrl interno (/uploads) resuelto", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, avatarUrl: "/uploads/avatars/u1_abc.png" });
    renderWithSession();

    const img = await screen.findByAltText("Ana Pérez");
    expect(img.getAttribute("src")).toContain("/uploads/avatars/u1_abc.png");
  });

  it("mantiene las iniciales cuando no hay avatarUrl y no expone input de archivo", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile); // avatarUrl: null
    const { container } = renderWithSession();

    await screen.findByRole("heading", { name: "Ana Pérez" });
    expect(screen.queryByAltText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
    // La subida vive solo en /profile: el portfolio no expone input de archivo.
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it("no expone funcionalidades fuera del MVP candidate-first", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    await screen.findByRole("heading", { name: "Ana Pérez" });
    expect(screen.queryByText(/export pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ai review|inteligencia artificial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan|pricing|suscripción/i)).not.toBeInTheDocument();
  });
});
