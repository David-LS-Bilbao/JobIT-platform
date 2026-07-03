import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { getSavedJobs, unsaveJob } from "@/features/saved-jobs/saved-jobs-api";
import { ApiClientError } from "@/lib/api-client";
import type { JobPublicDto, SavedJobDto, UserDto } from "@/types/api";

import { SavedJobsPage } from "./saved-jobs-page";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/saved-jobs" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/saved-jobs/saved-jobs-api", () => ({
  getSavedJobs: vi.fn(),
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

function savedOf(jobs: JobPublicDto[]): SavedJobDto[] {
  return jobs.map((job) => ({ savedAt: "2026-01-02T00:00:00.000Z", job }));
}

function SeedSessionButton() {
  const { setSession } = useAuth();
  return (
    <button type="button" onClick={() => setSession({ accessToken: "tok-saved", user: sessionUser })}>
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
      <SavedJobsPage />
    </AuthProvider>
  );
  return utils;
}

beforeEach(() => {
  vi.mocked(getSavedJobs).mockResolvedValue(savedOf([makeJob("j1", "Frontend Developer", "ACME")]));
  vi.mocked(unsaveJob).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SavedJobsPage (/saved-jobs)", () => {
  it("sin sesión redirige a /login y no pide las guardadas", async () => {
    render(
      <AuthProvider>
        <SavedJobsPage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getSavedJobs).not.toHaveBeenCalled();
  });

  it("con sesión pide /api/saved-jobs con el token y renderiza la lista", async () => {
    vi.mocked(getSavedJobs).mockResolvedValue(
      savedOf([makeJob("j1", "Frontend Developer", "ACME"), makeJob("j2", "Backend Developer", "Globex")])
    );
    renderWithSession();
    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(getSavedJobs).toHaveBeenCalledWith("tok-saved");
    const main = within(screen.getByRole("main"));
    expect(main.getByText("2 guardadas")).toBeInTheDocument();
    expect(main.getByText("Backend Developer")).toBeInTheDocument();
  });

  it("con la lista vacía muestra el estado vacío con CTA a /jobs", async () => {
    vi.mocked(getSavedJobs).mockResolvedValue([]);
    renderWithSession();
    expect(await screen.findByText("Aún no has guardado ninguna oferta.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar ofertas" })).toHaveAttribute("href", "/jobs");
  });

  it("muestra un error si la carga falla", async () => {
    vi.mocked(getSavedJobs).mockRejectedValue(new ApiClientError(500, "INTERNAL_ERROR", "x"));
    renderWithSession();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se han podido cargar tus ofertas guardadas");
  });

  it("quitar una oferta llama a unsaveJob y la elimina de la lista", async () => {
    vi.mocked(getSavedJobs).mockResolvedValue(
      savedOf([makeJob("j1", "Frontend Developer", "ACME"), makeJob("j2", "Backend Developer", "Globex")])
    );
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Frontend Developer");

    const main = within(screen.getByRole("main"));
    const card = main.getByText("Frontend Developer").closest("article") as HTMLElement;
    await user.click(within(card).getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(unsaveJob).toHaveBeenCalledWith("tok-saved", "j1"));
    await waitFor(() => expect(main.queryByText("Frontend Developer")).not.toBeInTheDocument());
    expect(main.getByText("Backend Developer")).toBeInTheDocument();
  });

  it("ante sesión caducada (401) limpia la sesión y redirige a /login", async () => {
    vi.mocked(getSavedJobs).mockRejectedValue(new ApiClientError(401, "UNAUTHORIZED", "x"));
    renderWithSession();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
