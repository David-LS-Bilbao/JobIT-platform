import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getJobMatches } from "@/features/match/match-api";
import { getMyProfile } from "@/features/profile/profile-api";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { ApiClientError } from "@/lib/api-client";
import type {
  CandidateProfileDto,
  JobPublicDto,
  MatchLevel,
  ProfileJobMatchDto,
  ProfileSkillDto,
  SavedJobDto,
  UserDto
} from "@/types/api";

import { MatchPage } from "./match-page";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/match" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/match/match-api", () => ({ getJobMatches: vi.fn(), DEFAULT_MATCH_LIMIT: 20 }));
vi.mock("@/features/saved-jobs/saved-jobs-api", () => ({
  getSavedJobs: vi.fn(),
  saveJob: vi.fn(),
  unsaveJob: vi.fn()
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));
vi.mock("@/features/auth/auth-identity", () => ({ loadCandidateIdentity: vi.fn(() => new Promise(() => {})) }));
// Sprint 21C: MatchPage necesitará el nº de skills del perfil (getMyProfile). Se
// preservan los demás exports reales (los usa el SiteShell) y solo se stubbea getMyProfile.
vi.mock("@/features/profile/profile-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/profile/profile-api")>();
  return { ...actual, getMyProfile: vi.fn() };
});

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

function makeJob(id: string, title: string, company: string): JobPublicDto {
  return {
    id,
    title,
    company,
    location: "Bilbao",
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

function makeMatch(
  id: string,
  title: string,
  company: string,
  overrides: Partial<Omit<ProfileJobMatchDto, "job">> & { level?: MatchLevel } = {}
): ProfileJobMatchDto {
  return {
    job: makeJob(id, title, company),
    score: overrides.score ?? 72,
    level: overrides.level ?? "GOOD",
    matchedSkills: overrides.matchedSkills ?? ["typescript"],
    missingSkills: overrides.missingSkills ?? ["aws"]
  };
}

const ONE_SKILL: ProfileSkillDto[] = [{ id: "s1", name: "TypeScript", level: null, category: null }];

function makeProfile(skills: ProfileSkillDto[] = ONE_SKILL): CandidateProfileDto {
  return {
    id: "p1",
    userId: "u1",
    firstName: "Ana",
    lastName: "Pérez",
    headline: null,
    summary: null,
    location: null,
    locationRemote: false,
    availabilityStatus: "ACTIVE",
    avatarUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    completionPercentage: 40,
    skills,
    experiences: [],
    education: [],
    projects: [],
    links: [],
    preferences: null
  };
}

function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-match", user: sessionUser })}>
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
      <MatchPage />
    </AuthProvider>
  );
  return utils;
}

beforeEach(() => {
  vi.mocked(getSavedJobs).mockResolvedValue([]);
  vi.mocked(getJobMatches).mockResolvedValue([makeMatch("j1", "Frontend Developer", "ACME")]);
  // Default: perfil con ≥1 skill ⇒ estado poblado, preservando los tests previos.
  vi.mocked(getMyProfile).mockResolvedValue(makeProfile(ONE_SKILL));
  vi.mocked(saveJob).mockResolvedValue(undefined);
  vi.mocked(unsaveJob).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MatchPage (/match)", () => {
  it("sin sesión redirige a /login y no pide matches", async () => {
    render(
      <AuthProvider>
        <MatchPage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?reason=required"));
    expect(getJobMatches).not.toHaveBeenCalled();
  });

  it("con sesión pide /api/profile/me/matches con el token y renderiza la lista", async () => {
    renderWithSession();
    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(getJobMatches).toHaveBeenCalledWith("tok-match");
    // VIS-04: concordancia singular del contador (antes fijaba "1 ofertas…").
    expect(within(screen.getByRole("main")).getByText("1 oferta ordenada por afinidad")).toBeInTheDocument();
  });

  it("pluraliza el contador con más de un match (VIS-04)", async () => {
    vi.mocked(getJobMatches).mockResolvedValue([
      makeMatch("j1", "Frontend Developer", "ACME"),
      makeMatch("j2", "Backend Developer", "Globex")
    ]);
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(within(screen.getByRole("main")).getByText("2 ofertas ordenadas por afinidad")).toBeInTheDocument();
  });

  it("muestra el estado de carga mientras calcula los matches", async () => {
    let resolve: (res: ProfileJobMatchDto[]) => void = () => {};
    vi.mocked(getJobMatches).mockReturnValueOnce(
      new Promise<ProfileJobMatchDto[]>((r) => {
        resolve = r;
      })
    );
    renderWithSession();
    // 17D.5: LoadingState accesible (role=status + aria-busy).
    expect(await screen.findByText("Calculando tus matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    resolve([makeMatch("j1", "Frontend Developer", "ACME")]);
    await waitFor(() => expect(screen.queryByText("Calculando tus matches")).not.toBeInTheDocument());
  });

  it("muestra el score y el nivel de afinidad de cada match", async () => {
    vi.mocked(getJobMatches).mockResolvedValue([
      makeMatch("j1", "Backend Developer", "ACME", { score: 81, level: "VERY_GOOD" })
    ]);
    renderWithSession();
    await screen.findByText("Backend Developer");
    expect(screen.getByText("81/100")).toBeInTheDocument();
    expect(screen.getByText("Afinidad Muy buena")).toBeInTheDocument();
    // Barra de progreso accesible con el valor real.
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "81");
  });

  it("muestra las skills coincidentes y las que faltan (razones del backend)", async () => {
    vi.mocked(getJobMatches).mockResolvedValue([
      makeMatch("j1", "Fullstack", "ACME", { matchedSkills: ["typescript", "node.js"], missingSkills: ["aws"] })
    ]);
    renderWithSession();
    await screen.findByText("Fullstack");
    expect(screen.getByText("Skills que coinciden")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
    expect(screen.getByText("node.js")).toBeInTheDocument();
    expect(screen.getByText("Skills que podrías sumar")).toBeInTheDocument();
    expect(screen.getByText("aws")).toBeInTheDocument();
  });

  it("perfil sin skills: no repite el aviso de puntuación básica por tarjeta (muestra la guía)", async () => {
    // Contrato MATCH-01: el escenario de N tarjetas a 0/100 con aviso repetido se
    // sustituye por una guía única; no debe legitimarse el disclaimer ×20.
    vi.mocked(getMyProfile).mockResolvedValue(makeProfile([]));
    vi.mocked(getJobMatches).mockResolvedValue([
      makeMatch("j1", "DevOps", "ACME", { score: 0, level: "VERY_LOW", matchedSkills: [], missingSkills: [] }),
      makeMatch("j2", "SRE", "Globex", { score: 0, level: "VERY_LOW", matchedSkills: [], missingSkills: [] })
    ]);
    renderWithSession();
    await screen.findByText("Añade skills para calcular tu afinidad", undefined, { timeout: 2000 });
    expect(screen.queryByText(/puntuación básica/i)).not.toBeInTheDocument();
    expect(screen.queryByText("DevOps")).not.toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay matches", async () => {
    vi.mocked(getJobMatches).mockResolvedValue([]);
    renderWithSession();
    expect(await screen.findByText("Todavía no hay ofertas con afinidad para tu perfil.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Completar perfil" })).toHaveAttribute("href", "/profile");
  });

  it("muestra un error genérico si el cálculo falla, sin filtrar el mensaje interno", async () => {
    vi.mocked(getJobMatches).mockRejectedValue(
      new ApiClientError(500, "INTERNAL_ERROR", "stack trace interno con secretos")
    );
    renderWithSession();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se han podido calcular tus matches");
    expect(screen.queryByText(/stack trace interno/i)).not.toBeInTheDocument();
  });

  it("ante un error muestra Reintentar y relanza la carga (17D.5)", async () => {
    vi.mocked(getJobMatches).mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    const user = userEvent.setup();
    renderWithSession();

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(getJobMatches).toHaveBeenCalledTimes(2);
  });

  it("si guardar falla muestra un error accesible y la card no cambia (17D.5)", async () => {
    vi.mocked(saveJob).mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    await user.click(main.getByRole("button", { name: "Guardar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se ha podido guardar la oferta. Inténtalo de nuevo.");
    expect(main.getByRole("button", { name: "Guardar" })).toHaveAttribute("aria-pressed", "false");
  });

  it("guardar con éxito anuncia el estado con role=status (17D.5)", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    await user.click(main.getByRole("button", { name: "Guardar" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Oferta guardada.");
  });

  it("'Ver oferta' enlaza al detalle /jobs/[id]", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    const verOferta = screen.getByRole("link", { name: "Ver oferta →" });
    expect(verOferta).toHaveAttribute("href", "/jobs/j1");
  });

  it("guardar una oferta desde la card llama a saveJob y marca el botón como guardado", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    const saveBtn = main.getByRole("button", { name: "Guardar" });
    expect(saveBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(saveBtn);
    await waitFor(() => expect(saveJob).toHaveBeenCalledWith("tok-match", "j1"));
    expect(await main.findByRole("button", { name: "Quitar" })).toHaveAttribute("aria-pressed", "true");
  });

  it("quitar una oferta ya guardada llama a unsaveJob", async () => {
    const saved: SavedJobDto[] = [
      { savedAt: "2026-01-02T00:00:00.000Z", job: makeJob("j1", "Frontend Developer", "ACME") }
    ];
    vi.mocked(getSavedJobs).mockResolvedValue(saved);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    const removeBtn = await main.findByRole("button", { name: "Quitar" });
    await user.click(removeBtn);
    await waitFor(() => expect(unsaveJob).toHaveBeenCalledWith("tok-match", "j1"));
  });

  it("ante sesión caducada (401) limpia la sesión y redirige a /login?reason=expired (FLOW-02)", async () => {
    vi.mocked(getJobMatches).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "x"));
    renderWithSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?reason=expired"));
  });

  it("es honesta: explica que es match básico y NO reclama recomendaciones por IA", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    // Disclaimer honesto presente.
    expect(screen.getByText(/No usa inteligencia artificial/i)).toBeInTheDocument();
    // Sin claims de IA avanzada.
    expect(screen.queryByText(/recomendad[oa] por ia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/powered by ai/i)).not.toBeInTheDocument();
  });

  it("no expone el accessToken en el DOM", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(document.body.textContent).not.toContain("tok-match");
  });
});

describe("MatchPage · Sprint 21C — perfil incompleto (RED)", () => {
  it("carga conjunta: pide el perfil y los matches con el token", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(getJobMatches).toHaveBeenCalledWith("tok-match");
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledWith("tok-match"), { timeout: 2000 });
  });

  it("perfil sin skills muestra la guía y ninguna oferta", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(makeProfile([]));
    vi.mocked(getJobMatches).mockResolvedValue([
      makeMatch("j1", "Frontend Developer", "ACME", { score: 0, level: "VERY_LOW", matchedSkills: [], missingSkills: [] }),
      makeMatch("j2", "Backend Developer", "Globex", { score: 0, level: "VERY_LOW", matchedSkills: [], missingSkills: [] })
    ]);
    renderWithSession();
    const heading = await screen.findByText("Añade skills para calcular tu afinidad", undefined, {
      timeout: 2000
    });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Añadir skills al JobIT CV" })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    expect(screen.queryByText("Backend Developer")).not.toBeInTheDocument();
    expect(screen.queryByText(/ordenadas por afinidad/i)).not.toBeInTheDocument();
  });

  it("perfil con skills conserva el listado poblado (regresión)", async () => {
    renderWithSession();
    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByText("1 oferta ordenada por afinidad")).toBeInTheDocument();
  });

  it("muestra los pesos del match una sola vez con perfil poblado (MATCH-02)", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    const weights = await screen.findByText(
      "Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%",
      undefined,
      { timeout: 2000 }
    );
    expect(weights).toBeInTheDocument();
    expect(
      screen.getAllByText("Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%")
    ).toHaveLength(1);
    expect(screen.getByText(/ponderación básica y fija/i)).toBeInTheDocument();
    expect(screen.getByText(/sin IA/i)).toBeInTheDocument();
  });

  it("muestra los pesos también en el estado guía (perfil sin skills)", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(makeProfile([]));
    renderWithSession();
    expect(
      await screen.findByText("Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%", undefined, {
        timeout: 2000
      })
    ).toBeInTheDocument();
  });

  it("error al cargar el perfil muestra ErrorState y ni cards ni guía", async () => {
    vi.mocked(getMyProfile).mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    renderWithSession();
    expect(await screen.findByRole("alert", undefined, { timeout: 2000 })).toHaveTextContent(
      "No se han podido calcular tus matches"
    );
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    expect(screen.queryByText("Añade skills para calcular tu afinidad")).not.toBeInTheDocument();
  });

  it("Reintentar vuelve a solicitar perfil y matches", async () => {
    vi.mocked(getMyProfile)
      .mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"))
      .mockResolvedValue(makeProfile(ONE_SKILL));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByRole("alert", undefined, { timeout: 2000 });
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => {
      expect(getMyProfile).toHaveBeenCalledTimes(2);
      expect(getJobMatches).toHaveBeenCalledTimes(2);
    });
  });

  it("con el perfil pendiente mantiene LoadingState y no pinta lista parcial", async () => {
    let resolveProfile: (p: CandidateProfileDto) => void = () => {};
    vi.mocked(getMyProfile).mockReturnValueOnce(
      new Promise<CandidateProfileDto>((resolve) => {
        resolveProfile = resolve;
      })
    );
    vi.mocked(getJobMatches).mockResolvedValue([makeMatch("j1", "Frontend Developer", "ACME")]);
    renderWithSession();
    await waitFor(() => expect(getJobMatches).toHaveBeenCalledWith("tok-match"));
    await waitFor(() => expect(screen.getByText("Calculando tus matches")).toBeInTheDocument(), {
      timeout: 2000
    });
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    resolveProfile(makeProfile(ONE_SKILL));
  });
});

describe("MatchPage · Sprint 21C — robustez (21C.4)", () => {
  it("401 de Profile limpia la sesión, redirige a /login y no muestra guía ni listado", async () => {
    vi.mocked(getMyProfile).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "x"));
    renderWithSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?reason=expired"));
    expect(screen.queryByText("Añade skills para calcular tu afinidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
  });

  it("Reintentar tras fallo de Match vuelve a solicitar perfil y matches", async () => {
    vi.mocked(getJobMatches)
      .mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"))
      .mockResolvedValue([makeMatch("j1", "Frontend Developer", "ACME")]);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Frontend Developer");
    await waitFor(() => {
      expect(getMyProfile).toHaveBeenCalledTimes(2);
      expect(getJobMatches).toHaveBeenCalledTimes(2);
    });
  });

  it("con varias cards la explicación de pesos aparece una sola vez y sin copy metodológico por tarjeta", async () => {
    vi.mocked(getJobMatches).mockResolvedValue([
      makeMatch("j1", "Frontend Developer", "ACME", { matchedSkills: ["ts"], missingSkills: [] }),
      makeMatch("j2", "Backend Developer", "Globex", { matchedSkills: [], missingSkills: [] }),
      makeMatch("j3", "SRE", "Initech", { matchedSkills: [], missingSkills: ["aws"] })
    ]);
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(
      screen.getAllByText("Skills 50% · Seniority 20% · Modalidad 20% · Ubicación 10%")
    ).toHaveLength(1);
    // El disclaimer metodológico por tarjeta se retiró: no se repite por card.
    expect(screen.queryByText(/puntuación básica/i)).not.toBeInTheDocument();
  });

  it("la guía sin skills expone un heading accesible y el CTA como enlace a /profile", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(makeProfile([]));
    renderWithSession();
    expect(
      await screen.findByRole(
        "heading",
        { name: "Añade skills para calcular tu afinidad" },
        { timeout: 2000 }
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Añadir skills al JobIT CV" })).toHaveAttribute(
      "href",
      "/profile"
    );
  });
});
