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

function listOf(
  jobs: JobPublicDto[],
  meta: { total?: number; page?: number; limit?: number } = {}
): JobsListResponse {
  return {
    data: jobs,
    total: meta.total ?? jobs.length,
    page: meta.page ?? 1,
    limit: meta.limit ?? 20
  };
}

/** Mock de getJobs que hace eco de la página pedida (multipágina, JOBS-01). */
function mockPagedJobs(total: number) {
  vi.mocked(getJobs).mockImplementation((_token, filters = {}) =>
    Promise.resolve(
      listOf([makeJob("j1", "Frontend Developer", "ACME")], { total, page: filters.page ?? 1 })
    )
  );
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
    // VIS-04: concordancia singular del contador.
    expect(within(screen.getByRole("main")).getByText("1 oferta")).toBeInTheDocument();
  });

  it("pluraliza el contador de resultados con más de una oferta (VIS-04)", async () => {
    vi.mocked(getJobs).mockResolvedValue(
      listOf([makeJob("j1", "Frontend Developer", "ACME"), makeJob("j2", "Backend Developer", "Globex")])
    );
    renderWithSession();
    await screen.findByText("Frontend Developer");
    expect(within(screen.getByRole("main")).getByText("2 ofertas")).toBeInTheDocument();
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

  /**
   * JOBS-01 — Paginación UI (Sprint 21B, mini-spec aprobada).
   * Contrato: nav "Paginación de ofertas" bajo el listado con «Anterior»,
   * «Página X de Y» y «Siguiente»; totalPages = ceil(total/limit); solo se
   * renderiza con más de una página; cambiar de página conserva los filtros;
   * los filtros reinician a page 1; el retry rehace la misma página.
   */
  describe("paginación (JOBS-01)", () => {
    it("con varias páginas muestra la navegación con su estado inicial", async () => {
      mockPagedJobs(56); // 56/20 → 3 páginas
      renderWithSession();
      await screen.findByText("Frontend Developer");

      const nav = screen.getByRole("navigation", { name: "Paginación de ofertas" });
      expect(within(nav).getByText("Página 1 de 3")).toBeInTheDocument();
      expect(within(nav).getByRole("button", { name: /anterior/i })).toBeDisabled();
      expect(within(nav).getByRole("button", { name: /siguiente/i })).toBeEnabled();
    });

    it("pulsar Siguiente pide la página 2 conservando los filtros activos", async () => {
      mockPagedJobs(56);
      const user = userEvent.setup();
      renderWithSession();
      await screen.findByText("Frontend Developer");

      // Filtro real por UI (q) → página 1 filtrada.
      await user.type(screen.getByLabelText("Buscar ofertas"), "react");
      await user.click(screen.getByRole("button", { name: "Buscar" }));
      await waitFor(() =>
        expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ q: "react", page: 1 }))
      );
      await screen.findByText("Frontend Developer");

      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      await waitFor(() =>
        expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ q: "react", page: 2 }))
      );
    });

    it("en la última página Siguiente queda deshabilitado y Anterior habilitado", async () => {
      mockPagedJobs(56);
      const user = userEvent.setup();
      renderWithSession();
      await screen.findByText("Frontend Developer");

      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      await waitFor(() =>
        expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ page: 2 }))
      );
      await screen.findByText("Frontend Developer");

      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      await waitFor(() =>
        expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ page: 3 }))
      );
      await screen.findByText("Frontend Developer");

      const nav = screen.getByRole("navigation", { name: "Paginación de ofertas" });
      expect(within(nav).getByText("Página 3 de 3")).toBeInTheDocument();
      expect(within(nav).getByRole("button", { name: /anterior/i })).toBeEnabled();
      expect(within(nav).getByRole("button", { name: /siguiente/i })).toBeDisabled();
    });

    it("con una sola página no muestra la navegación (blindaje)", async () => {
      renderWithSession(); // default del beforeEach: 1 oferta, total 1
      await screen.findByText("Frontend Developer");
      expect(screen.queryByRole("navigation", { name: "Paginación de ofertas" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
    });

    it("con 0 resultados conserva el EmptyState y no muestra paginación (blindaje)", async () => {
      vi.mocked(getJobs).mockResolvedValue(listOf([], { total: 0 }));
      renderWithSession();
      await screen.findByText("No hay ofertas que coincidan con tu búsqueda.");
      expect(screen.queryByRole("navigation", { name: "Paginación de ofertas" })).not.toBeInTheDocument();
    });

    it("aplicar un filtro desde una página posterior reinicia a page 1", async () => {
      mockPagedJobs(56);
      const user = userEvent.setup();
      renderWithSession();
      await screen.findByText("Frontend Developer");

      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      await waitFor(() =>
        expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ page: 2 }))
      );
      await screen.findByText("Frontend Developer");

      await user.selectOptions(screen.getByLabelText("Modalidad"), "REMOTE");
      await waitFor(() =>
        expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ remote: "REMOTE", page: 1 }))
      );
    });

    it("deriva totalPages del limit real de la respuesta (blindaje: nada de 20 hardcodeado)", async () => {
      vi.mocked(getJobs).mockResolvedValue(
        listOf([makeJob("j1", "Frontend Developer", "ACME")], { total: 12, limit: 5 })
      );
      renderWithSession();
      await screen.findByText("Frontend Developer");
      const nav = screen.getByRole("navigation", { name: "Paginación de ofertas" });
      expect(within(nav).getByText("Página 1 de 3")).toBeInTheDocument();
    });

    it("los límites no generan peticiones fuera de rango (blindaje)", async () => {
      mockPagedJobs(56);
      const user = userEvent.setup();
      renderWithSession();
      await screen.findByText("Frontend Developer");
      expect(getJobs).toHaveBeenCalledTimes(1);

      // «Anterior» en página 1 está disabled: no dispara petición alguna.
      await user.click(screen.getByRole("button", { name: /anterior/i }));
      expect(getJobs).toHaveBeenCalledTimes(1);

      // Hasta la última página (2 navegaciones) y «Siguiente» queda inerte.
      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      await screen.findByText("Frontend Developer");
      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      await screen.findByText("Frontend Developer");
      expect(getJobs).toHaveBeenCalledTimes(3);

      await user.click(screen.getByRole("button", { name: /siguiente/i }));
      expect(getJobs).toHaveBeenCalledTimes(3);
      expect(getJobs).not.toHaveBeenCalledWith("tok-jobs", expect.objectContaining({ page: 4 }));
    });

    it("al paginar muestra el LoadingState inmediato y retira la navegación durante la carga", async () => {
      mockPagedJobs(56);
      const user = userEvent.setup();
      renderWithSession();
      await screen.findByText("Frontend Developer");

      // La petición de la página 2 queda diferida para observar la transición.
      let resolvePage2: (res: JobsListResponse) => void = () => {};
      vi.mocked(getJobs).mockReturnValueOnce(
        new Promise<JobsListResponse>((r) => {
          resolvePage2 = r;
        })
      );

      await user.click(screen.getByRole("button", { name: /siguiente/i }));

      expect(await screen.findByText("Cargando ofertas")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
      expect(
        screen.queryByRole("navigation", { name: "Paginación de ofertas" })
      ).not.toBeInTheDocument();

      resolvePage2(listOf([makeJob("j2", "Backend Developer", "Globex")], { total: 56, page: 2 }));
      expect(await screen.findByText("Backend Developer")).toBeInTheDocument();
      const nav = screen.getByRole("navigation", { name: "Paginación de ofertas" });
      expect(within(nav).getByText("Página 2 de 3")).toBeInTheDocument();
    });

    it("anuncia la página actual con un live region accesible (21B.4)", async () => {
      mockPagedJobs(56);
      renderWithSession();
      await screen.findByText("Frontend Developer");

      const nav = screen.getByRole("navigation", { name: "Paginación de ofertas" });
      const status = within(nav).getByText("Página 1 de 3");
      expect(status).toHaveAttribute("role", "status");
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(status).toHaveAttribute("aria-atomic", "true");
    });

    it("mantiene la semántica y el orden de los controles (blindaje 21B.4)", async () => {
      mockPagedJobs(56);
      renderWithSession();
      await screen.findByText("Frontend Developer");

      const nav = screen.getByRole("navigation", { name: "Paginación de ofertas" });
      const buttons = within(nav).getAllByRole("button");
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent(/anterior/i);
      expect(buttons[1]).toHaveTextContent(/siguiente/i);
      buttons.forEach((b) => expect(b).toHaveAttribute("type", "button"));

      // Orden DOM: Anterior → estado de página → Siguiente.
      const status = within(nav).getByRole("status");
      expect(
        buttons[0].compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(
        status.compareDocumentPosition(buttons[1]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("hace scroll al inicio de resultados solo tras una paginación exitosa", async () => {
      // Mock local de scrollIntoView (jsdom no lo implementa); se restaura al final.
      const proto = Element.prototype as { scrollIntoView?: (options?: ScrollIntoViewOptions) => void };
      const hadOwn = Object.prototype.hasOwnProperty.call(proto, "scrollIntoView");
      const originalScroll = proto.scrollIntoView;
      const scrollSpy = vi.fn();
      proto.scrollIntoView = scrollSpy;
      try {
        mockPagedJobs(56);
        const user = userEvent.setup();
        renderWithSession();
        await screen.findByText("Frontend Developer");
        const main = within(screen.getByRole("main"));
        // Carga inicial: sin scroll automático y sin foco en el contador (21B.4).
        expect(scrollSpy).not.toHaveBeenCalled();
        expect(main.getByText("56 ofertas")).not.toBe(document.activeElement);

        // Aplicar un filtro tampoco desplaza ni enfoca.
        await user.selectOptions(screen.getByLabelText("Modalidad"), "REMOTE");
        await waitFor(() =>
          expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ remote: "REMOTE", page: 1 }))
        );
        await screen.findByText("Frontend Developer");
        expect(scrollSpy).not.toHaveBeenCalled();
        expect(main.getByText("56 ofertas")).not.toBe(document.activeElement);

        // Paginación exitosa: foco en el contador (contexto de teclado) y
        // exactamente un scroll tras renderizar la página nueva.
        await user.click(screen.getByRole("button", { name: /siguiente/i }));
        await waitFor(() =>
          expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ page: 2 }))
        );
        await screen.findByText("Frontend Developer");
        await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
        expect(scrollSpy).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
        expect(document.activeElement).toBe(within(screen.getByRole("main")).getByText("56 ofertas"));
      } finally {
        if (hadOwn) proto.scrollIntoView = originalScroll;
        else delete proto.scrollIntoView;
      }
    });

    it("si falla el cambio de página, Reintentar rehace esa misma página con los filtros", async () => {
      // Spy local de scroll (restaurado al final): el fallo no desplaza; el
      // retry exitoso completa el retorno al listado exactamente una vez.
      const proto = Element.prototype as { scrollIntoView?: (options?: ScrollIntoViewOptions) => void };
      const hadOwn = Object.prototype.hasOwnProperty.call(proto, "scrollIntoView");
      const originalScroll = proto.scrollIntoView;
      const scrollSpy = vi.fn();
      proto.scrollIntoView = scrollSpy;
      try {
        mockPagedJobs(56);
        const user = userEvent.setup();
        renderWithSession();
        await screen.findByText("Frontend Developer");

        await user.type(screen.getByLabelText("Buscar ofertas"), "react");
        await user.click(screen.getByRole("button", { name: "Buscar" }));
        await waitFor(() =>
          expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ q: "react", page: 1 }))
        );
        await screen.findByText("Frontend Developer");

        // La petición de la página 2 falla una vez; después vuelve el eco normal.
        vi.mocked(getJobs).mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "x"));
        await user.click(screen.getByRole("button", { name: /siguiente/i }));
        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("No se han podido cargar las ofertas");
        expect(scrollSpy).not.toHaveBeenCalled();
        // El ErrorState no roba el foco hacia el contador (que ni existe aquí).
        expect(document.activeElement).not.toBe(document.querySelector("main p"));

        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        await waitFor(() =>
          expect(getJobs).toHaveBeenLastCalledWith("tok-jobs", expect.objectContaining({ q: "react", page: 2 }))
        );
        expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
        await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
        // El retry exitoso completa también la restauración de contexto (21B.4).
        expect(document.activeElement).toBe(within(screen.getByRole("main")).getByText("56 ofertas"));
      } finally {
        if (hadOwn) proto.scrollIntoView = originalScroll;
        else delete proto.scrollIntoView;
      }
    });
  });
});
