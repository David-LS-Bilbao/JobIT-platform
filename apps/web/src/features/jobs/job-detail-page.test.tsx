import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getJobById } from "@/features/jobs/jobs-api";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { ApiClientError } from "@/lib/api-client";
import type { JobPublicDto, SavedJobDto, UserDto } from "@/types/api";

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

  it("el enlace a la oferta original abre en pestaña nueva de forma segura", async () => {
    renderWithSession();
    await screen.findByRole("heading", { name: "Senior React Engineer" });
    const external = screen.getByRole("link", { name: "Ver oferta original" });
    expect(external).toHaveAttribute("href", "https://jooble.org/jobs/senior-react-engineer");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
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
});
