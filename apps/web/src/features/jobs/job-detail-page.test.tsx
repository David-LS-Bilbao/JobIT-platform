import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getJobById } from "@/features/jobs/jobs-api";
import { getJobMatch } from "@/features/match/match-api";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { ApiClientError } from "@/lib/api-client";
import type { JobMatchDto, JobPublicDto, SavedJobDto, UserDto } from "@/types/api";

import { JobDetailPage } from "./job-detail-page";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/jobs/j1" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/jobs/jobs-api", () => ({ getJobById: vi.fn() }));
vi.mock("@/features/saved-jobs/saved-jobs-api", () => ({
  getSavedJobs: vi.fn(),
  saveJob: vi.fn(),
  unsaveJob: vi.fn()
}));
vi.mock("@/features/match/match-api", () => ({ getJobMatch: vi.fn() }));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

const job: JobPublicDto = {
  id: "j1",
  title: "Senior React Engineer",
  company: "TechCo",
  location: "Madrid",
  remoteType: "HYBRID",
  description: "Buscamos una persona con experiencia en React.",
  requirements: ["3+ años con React", "TypeScript"],
  seniority: "SENIOR",
  contractType: "FULL_TIME",
  salaryMin: 45000,
  salaryMax: 60000,
  tags: ["React", "TypeScript"],
  status: "ACTIVE",
  postedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: null,
  source: "JOOBLE",
  sourceUrl: "https://jooble.org/jobs/senior-react-engineer"
};

const matchDto: JobMatchDto = {
  jobId: "j1",
  score: 72,
  level: "GOOD",
  matchedSkills: ["react", "typescript"],
  missingSkills: ["aws"],
  factors: [
    { name: "skills", match: true, detail: "2 de 3 skills coinciden" },
    { name: "remote", match: true, detail: "Modalidad compatible con tu preferencia" },
    { name: "seniority", match: false, detail: "Seniority no coincide" },
    { name: "location", match: null, detail: "Sin datos de ubicación" }
  ],
  explanation: "Afinidad GOOD con una puntuación de 72/100."
};

function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-detail", user: sessionUser })}>
      seed-session
    </button>
  );
}

function renderWithSession(id = "j1") {
  const utils = render(
    <AuthProvider>
      <SeedSessionButton />
    </AuthProvider>
  );
  fireEvent.click(screen.getByText("seed-session"));
  utils.rerender(
    <AuthProvider>
      <JobDetailPage id={id} />
    </AuthProvider>
  );
  return utils;
}

beforeEach(() => {
  vi.mocked(getSavedJobs).mockResolvedValue([]);
  vi.mocked(getJobById).mockResolvedValue(job);
  vi.mocked(getJobMatch).mockResolvedValue(matchDto);
  vi.mocked(saveJob).mockResolvedValue(undefined);
  vi.mocked(unsaveJob).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("JobDetailPage (/jobs/[id])", () => {
  it("sin sesión redirige a /login y no pide la oferta", async () => {
    render(
      <AuthProvider>
        <JobDetailPage id="j1" />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getJobById).not.toHaveBeenCalled();
  });

  it("con sesión pide /api/jobs/:id con el token y renderiza el detalle", async () => {
    renderWithSession();
    expect(await screen.findByRole("heading", { name: "Senior React Engineer" })).toBeInTheDocument();
    expect(getJobById).toHaveBeenCalledWith("tok-detail", "j1");
    const main = within(screen.getByRole("main"));
    expect(main.getByText("TechCo")).toBeInTheDocument();
    expect(main.getByText("Buscamos una persona con experiencia en React.")).toBeInTheDocument();
    expect(main.getByText("3+ años con React")).toBeInTheDocument();
  });

  it("con una oferta inexistente (404) muestra 'Oferta no disponible' y enlace de vuelta", async () => {
    vi.mocked(getJobById).mockRejectedValue(new ApiClientError(404, "NOT_FOUND", "x"));
    renderWithSession("desconocida");
    expect(await screen.findByText("Oferta no disponible")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Volver a ofertas" })).toHaveAttribute("href", "/jobs");
  });

  it("ante un error genérico muestra un aviso", async () => {
    vi.mocked(getJobById).mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    renderWithSession();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se ha podido cargar la oferta");
  });

  it("la oferta Jooble muestra 'Abrir en Jooble' con target/rel seguros y la fuente", async () => {
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });
    expect(screen.getByText(/Fuente: Jooble/)).toBeInTheDocument();
    const external = screen.getByRole("link", { name: "Abrir en Jooble" });
    expect(external).toHaveAttribute("href", "https://jooble.org/jobs/senior-react-engineer");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("una oferta interna sin sourceUrl muestra aviso honesto y NO enlace externo", async () => {
    vi.mocked(getJobById).mockResolvedValue({ ...job, source: "INTERNAL", sourceUrl: null });
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });
    expect(screen.getByText(/Fuente: JobIT/)).toBeInTheDocument();
    expect(
      screen.getByText("Oferta de ejemplo para el MVP. No tiene enlace externo de inscripción.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Abrir en|Ver oferta original/ })).not.toBeInTheDocument();
  });

  it("una oferta interna con sourceUrl válido muestra 'Ver oferta original' seguro", async () => {
    vi.mocked(getJobById).mockResolvedValue({
      ...job,
      source: "INTERNAL",
      sourceUrl: "https://empresa.example.com/oferta/1"
    });
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });
    const external = screen.getByRole("link", { name: "Ver oferta original" });
    expect(external).toHaveAttribute("href", "https://empresa.example.com/oferta/1");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("una sourceUrl con protocolo peligroso NO se renderiza como enlace", async () => {
    vi.mocked(getJobById).mockResolvedValue({ ...job, source: "JOOBLE", sourceUrl: "javascript:alert(1)" });
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });
    expect(
      screen.queryByRole("link", { name: /Abrir en Jooble|Ver oferta original/ })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Esta oferta no incluye un enlace externo de inscripción.")).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("javascript:alert");
  });

  it("si la oferta ya está guardada muestra 'Quitar de guardadas' y llama a unsaveJob", async () => {
    const saved: SavedJobDto[] = [{ savedAt: "2026-01-02T00:00:00.000Z", job }];
    vi.mocked(getSavedJobs).mockResolvedValue(saved);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });

    const removeBtn = await screen.findByRole("button", { name: "Quitar de guardadas" });
    expect(removeBtn).toHaveAttribute("aria-pressed", "true");
    await user.click(removeBtn);
    await waitFor(() => expect(unsaveJob).toHaveBeenCalledWith("tok-detail", "j1"));
  });

  it("guardar la oferta desde el detalle llama a saveJob y marca el botón", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });

    const saveBtn = screen.getByRole("button", { name: "Guardar oferta" });
    expect(saveBtn).toHaveAttribute("aria-pressed", "false");
    await user.click(saveBtn);
    await waitFor(() => expect(saveJob).toHaveBeenCalledWith("tok-detail", "j1"));
    expect(await screen.findByRole("button", { name: "Quitar de guardadas" })).toBeInTheDocument();
  });

  it("ante sesión caducada (401) limpia la sesión y redirige a /login", async () => {
    vi.mocked(getJobById).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "x"));
    renderWithSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("carga el panel de match: pide GET /api/jobs/:id/match con el token y muestra score y nivel", async () => {
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });

    expect(await screen.findByText("Match con tu perfil")).toBeInTheDocument();
    await waitFor(() => expect(getJobMatch).toHaveBeenCalledWith("tok-detail", "j1"));
    expect(screen.getByText("Afinidad Buena")).toBeInTheDocument();
    expect(screen.getByText("72/100")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "72");
  });

  it("muestra la explicación y el desglose de factores del backend", async () => {
    renderWithSession();
    await screen.findByText("Match con tu perfil");
    expect(await screen.findByText("Afinidad GOOD con una puntuación de 72/100.")).toBeInTheDocument();
    // Factores con su estado legible (coincide / no coincide / sin datos).
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Seniority")).toBeInTheDocument();
    expect(screen.getByText("Ubicación")).toBeInTheDocument();
    expect(screen.getByText("2 de 3 skills coinciden")).toBeInTheDocument();
    expect(screen.getAllByText("· Coincide").length).toBeGreaterThan(0);
    expect(screen.getByText("· No coincide")).toBeInTheDocument();
    expect(screen.getByText("· Sin datos")).toBeInTheDocument();
  });

  it("muestra skills coincidentes y faltantes del match", async () => {
    renderWithSession();
    await screen.findByText("Match con tu perfil");
    await screen.findByText("Afinidad Buena");
    const main = within(screen.getByRole("main"));
    expect(main.getByText("Skills que coinciden")).toBeInTheDocument();
    expect(main.getByText("Skills que podrías sumar")).toBeInTheDocument();
    expect(main.getByText("aws")).toBeInTheDocument();
  });

  it("si el match falla, el detalle de la oferta sigue renderizando con aviso suave", async () => {
    vi.mocked(getJobMatch).mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "stack interno secreto"));
    renderWithSession();
    // El detalle de la oferta se mantiene.
    expect(await screen.findByRole("heading", { name: "Senior React Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Buscamos una persona con experiencia en React.")).toBeInTheDocument();
    // El panel muestra un aviso suave sin filtrar el mensaje interno.
    expect(await screen.findByText("No hemos podido calcular el match de esta oferta ahora.")).toBeInTheDocument();
    expect(screen.queryByText(/stack interno secreto/i)).not.toBeInTheDocument();
  });

  it("el panel es honesto (sin claims de IA) y no expone el token", async () => {
    renderWithSession();
    await screen.findByText("Match con tu perfil");
    await screen.findByText("Afinidad Buena");
    expect(screen.getByText(/No usa IA avanzada/i)).toBeInTheDocument();
    expect(screen.queryByText(/IA recomienda/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/algoritmo avanzado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/predicción de contratación/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("tok-detail");
  });
});
