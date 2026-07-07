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

  it("las cards muestran la fuente de la oferta", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(within(screen.getByRole("main")).getByText(/Fuente: JobIT/)).toBeInTheDocument();
  });

  it("muestra el estado de carga mientras pide las ofertas", async () => {
    let resolve: (res: JobsListResponse) => void = () => {};
    vi.mocked(getJobs).mockReturnValueOnce(
      new Promise<JobsListResponse>((r) => {
        resolve = r;
      })
    );
    renderWithSession();
    // 17D.3: LoadingState accesible (role=status + aria-busy).
    expect(await screen.findByText("Cargando ofertas")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    resolve(listOf([makeJob("j1", "Frontend Developer", "ACME")]));
    await waitFor(() => expect(screen.queryByText("Cargando ofertas")).not.toBeInTheDocument());
  });

  it("ante un error muestra Reintentar y relanza la carga (17D.3)", async () => {
    vi.mocked(getJobs).mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    const user = userEvent.setup();
    renderWithSession();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se han podido cargar las ofertas");

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(getJobs).toHaveBeenCalledTimes(2);
  });

  it("con filtros activos y 0 resultados ofrece Limpiar filtros y resetea (17D.3)", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    // Buscar algo sin resultados → empty con filtros activos.
    vi.mocked(getJobs).mockResolvedValueOnce(listOf([]));
    await user.type(screen.getByLabelText("Buscar ofertas"), "cobol");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(
      await screen.findByText("No hay ofertas que coincidan con tu búsqueda.")
    ).toBeInTheDocument();
    const clear = screen.getByRole("button", { name: "Limpiar filtros" });

    await user.click(clear);

    // Resetea filtros (última llamada sin filtros) y limpia los inputs.
    await waitFor(() => expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", {}));
    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar ofertas")).toHaveValue("");
  });

  it("sin filtros activos el estado vacío NO ofrece Limpiar filtros", async () => {
    vi.mocked(getJobs).mockResolvedValue(listOf([]));
    renderWithSession();
    await screen.findByText("No hay ofertas que coincidan con tu búsqueda.");
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
  });

  it("si guardar falla muestra un error accesible y no marca la card (17D.3)", async () => {
    vi.mocked(saveJob).mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    await user.click(main.getByRole("button", { name: "Guardar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se ha podido guardar la oferta. Inténtalo de nuevo.");
    // Sin cambio optimista que revertir: la card sigue sin marcar.
    expect(main.getByRole("button", { name: "Guardar" })).toHaveAttribute("aria-pressed", "false");
  });

  it("guardar con éxito anuncia el estado con role=status (17D.3)", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    await user.click(main.getByRole("button", { name: "Guardar" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Oferta guardada.");
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

  it("buscar por ubicación pide /api/jobs con location y page:1", async () => {
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    await user.type(screen.getByLabelText("Ubicación"), "Madrid");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() =>
      expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ location: "Madrid", page: 1 }))
    );
  });

  it("ya no muestra el selector de Fuente en los filtros", async () => {
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(screen.queryByLabelText("Fuente")).not.toBeInTheDocument();
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
