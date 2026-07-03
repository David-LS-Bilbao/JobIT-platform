import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getJobs } from "@/features/jobs/jobs-api";
import { getSavedJobs, saveJob, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { ApiClientError } from "@/lib/api-client";
import type { JobPublicDto, JobsListResponse, SavedJobDto, UserDto } from "@/types/api";

import { JobsPage } from "./jobs-page";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/jobs" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/jobs/jobs-api", () => ({ getJobs: vi.fn() }));
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

function listOf(jobs: JobPublicDto[]): JobsListResponse {
  return { data: jobs, total: jobs.length, page: 1, limit: 20 };
}

function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-jobs", user: sessionUser })}>
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
      <JobsPage />
    </AuthProvider>
  );
  return utils;
}

beforeEach(() => {
  vi.mocked(getSavedJobs).mockResolvedValue([]);
  vi.mocked(getJobs).mockResolvedValue(listOf([makeJob("j1", "Frontend Developer", "ACME")]));
  vi.mocked(saveJob).mockResolvedValue(undefined);
  vi.mocked(unsaveJob).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("JobsPage (/jobs)", () => {
  it("sin sesión redirige a /login y no pide ofertas", async () => {
    render(
      <AuthProvider>
        <JobsPage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getJobs).not.toHaveBeenCalled();
  });

  it("con sesión pide /api/jobs con el token y renderiza la lista", async () => {
    renderWithSession();
    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(getJobs).toHaveBeenCalledWith("tok-jobs", {});
    expect(within(screen.getByRole("main")).getByText("1 ofertas")).toBeInTheDocument();
  });

  it("muestra el estado de carga mientras pide las ofertas", async () => {
    let resolve: (res: JobsListResponse) => void = () => {};
    vi.mocked(getJobs).mockReturnValueOnce(
      new Promise<JobsListResponse>((r) => {
        resolve = r;
      })
    );
    renderWithSession();
    expect(await screen.findByText("Cargando ofertas…")).toBeInTheDocument();
    resolve(listOf([makeJob("j1", "Frontend Developer", "ACME")]));
    await waitFor(() => expect(screen.queryByText("Cargando ofertas…")).not.toBeInTheDocument());
  });

  it("muestra el estado vacío cuando no hay ofertas", async () => {
    vi.mocked(getJobs).mockResolvedValue(listOf([]));
    renderWithSession();
    expect(await screen.findByText("No hay ofertas que coincidan con tu búsqueda.")).toBeInTheDocument();
  });

  it("muestra un error si la carga falla", async () => {
    vi.mocked(getJobs).mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    renderWithSession();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se han podido cargar las ofertas");
  });

  it("cambiar la modalidad vuelve a pedir /api/jobs con remote y page:1", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    await user.selectOptions(screen.getByLabelText("Modalidad"), "REMOTE");
    await waitFor(() =>
      expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ remote: "REMOTE", page: 1 }))
    );
  });

  it("buscar por texto pide /api/jobs con q y page:1", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    await user.type(screen.getByLabelText("Buscar ofertas"), "react");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() =>
      expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ q: "react", page: 1 }))
    );
  });

  it("guardar una oferta desde la card llama a saveJob y marca el botón como guardado", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    const saveBtn = main.getByRole("button", { name: "Guardar" });
    expect(saveBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(saveBtn);
    await waitFor(() => expect(saveJob).toHaveBeenCalledWith("tok-jobs", "j1"));
    expect(await main.findByRole("button", { name: "Quitar" })).toHaveAttribute("aria-pressed", "true");
  });

  it("quitar una oferta ya guardada llama a unsaveJob", async () => {
    const saved: SavedJobDto[] = [{ savedAt: "2026-01-02T00:00:00.000Z", job: makeJob("j1", "Frontend Developer", "ACME") }];
    vi.mocked(getSavedJobs).mockResolvedValue(saved);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    const removeBtn = await main.findByRole("button", { name: "Quitar" });
    await user.click(removeBtn);
    await waitFor(() => expect(unsaveJob).toHaveBeenCalledWith("tok-jobs", "j1"));
  });

  it("ante sesión caducada (401) limpia la sesión y redirige a /login", async () => {
    vi.mocked(getJobs).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "x"));
    renderWithSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("la sidebar marca Jobs como ruta activa (enlace real a /jobs)", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(screen.getByRole("link", { name: "JobIT Jobs" })).toHaveAttribute("href", "/jobs");
  });
});
