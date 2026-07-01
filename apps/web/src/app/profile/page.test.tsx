import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import {
  addProfileExperience,
  addProfileSkill,
  deleteProfileExperience,
  deleteProfileSkill,
  getMyProfile,
  updateMyProfile,
  updateProfileExperience
} from "@/features/profile/profile-api";
import { ProfilePage } from "@/features/profile/profile-page";
import { ApiClientError } from "@/lib/api-client";
import type { CandidateProfileDto, UserDto } from "@/types/api";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, usePathname: () => "/profile" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/profile/profile-api", () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  addProfileSkill: vi.fn(),
  deleteProfileSkill: vi.fn(),
  addProfileExperience: vi.fn(),
  updateProfileExperience: vi.fn(),
  deleteProfileExperience: vi.fn()
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
    { id: "pr1", name: "design-system", description: "DS interno", technologies: ["React", "TypeScript"], url: null, repoUrl: null }
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
    contractTypes: ["FULL_TIME"]
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
      <ProfilePage />
    </AuthProvider>
  );
  return utils;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProfilePage (/profile · JobIT CV)", () => {
  it("sin sesión redirige a /login y no pide el perfil", async () => {
    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it("muestra el estado de carga mientras pide el perfil", async () => {
    let resolve: (dto: CandidateProfileDto) => void = () => {};
    vi.mocked(getMyProfile).mockReturnValueOnce(
      new Promise<CandidateProfileDto>((r) => {
        resolve = r;
      })
    );
    renderWithSession();
    expect(await screen.findByText("Cargando tu JobIT CV…")).toBeInTheDocument();
    resolve(emptyProfile);
    await waitFor(() => expect(screen.queryByText("Cargando tu JobIT CV…")).not.toBeInTheDocument());
  });

  it("con perfil completo renderiza cabecera, secciones, preview y datos reales", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();

    expect(await screen.findByText("Tu perfil tech vivo")).toBeInTheDocument();
    expect(getMyProfile).toHaveBeenCalledWith("tok-cv");
    expect(screen.getAllByText("JobIT CV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("85%").length).toBeGreaterThan(0);

    // Secciones
    expect(screen.getAllByText("Datos profesionales").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Skills principales").length).toBeGreaterThan(0);
    expect(screen.getByText("Experiencia profesional")).toBeInTheDocument();
    expect(screen.getAllByText("Educación").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Proyectos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enlaces").length).toBeGreaterThan(0);
    expect(screen.getByText("Preferencias")).toBeInTheDocument();
    expect(screen.getByText("Vista previa")).toBeInTheDocument();

    // Datos reales
    expect(screen.getAllByText("React").length).toBeGreaterThan(0);
    expect(screen.getByText(/ACME/)).toBeInTheDocument();
    expect(screen.getByText(/UPV\/EHU/)).toBeInTheDocument();
    expect(screen.getAllByText("design-system").length).toBeGreaterThan(0);

    // Form precargado con datos básicos
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana");
    expect(screen.getByLabelText("Apellidos")).toHaveValue("Pérez");
  });

  it("con perfil vacío muestra empty states y preview con placeholder", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    expect(screen.getByText("Aún no has añadido experiencia profesional.")).toBeInTheDocument();
    expect(screen.getByText("Añade tu formación académica.")).toBeInTheDocument();
    expect(screen.getByText("Define qué buscas en tu próxima oportunidad.")).toBeInTheDocument();
    expect(screen.getAllByText("Candidato tech").length).toBeGreaterThan(0);
  });

  it("guardar datos profesionales llama a PUT /api/profile/me con el token", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateMyProfile).mockResolvedValueOnce({ ...fullProfile, headline: "Senior FE" });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() =>
      expect(updateMyProfile).toHaveBeenCalledWith(
        "tok-cv",
        expect.objectContaining({ firstName: "Ana", lastName: "Pérez" })
      )
    );
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();
  });

  it("muestra un error si el guardado (PUT) falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateMyProfile).mockRejectedValueOnce(new ApiClientError(500, "INTERNAL_ERROR", "Fallo al guardar"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("marca JobIT CV como activo y no expone rutas no implementadas ni copy fuera de MVP", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    // JobIT CV activo en /profile
    expect(screen.getByRole("link", { name: "JobIT CV" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");

    // Sin rutas no implementadas
    const links = screen.getAllByRole("link");
    for (const href of ["/jobs", "/saved-jobs", "/match"]) {
      expect(links.some((l) => l.getAttribute("href") === href)).toBe(false);
    }

    // Nada fuera de MVP
    expect(screen.queryByText(/expertech/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/export pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ai reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
  });

  it("muestra empty state de skills cuando no hay skills", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    expect(screen.getByText("Aún no has añadido skills.")).toBeInTheDocument();
  });

  it("añadir una skill llama a POST /api/profile/me/skills y refresca el perfil", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileSkill).mockResolvedValueOnce({ id: "s3", name: "GraphQL", level: null, category: null });
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      ...fullProfile,
      skills: [...fullProfile.skills, { id: "s3", name: "GraphQL", level: null, category: null }]
    });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.type(screen.getByLabelText("Nombre de la skill"), "GraphQL");
    await user.click(screen.getByRole("button", { name: "Añadir skill" }));

    await waitFor(() =>
      expect(addProfileSkill).toHaveBeenCalledWith("tok-cv", expect.objectContaining({ name: "GraphQL" }))
    );
    expect((await screen.findAllByText("GraphQL")).length).toBeGreaterThan(0);
  });

  it("muestra error si el POST de skill falla (p. ej. duplicada)", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileSkill).mockRejectedValueOnce(new ApiClientError(409, "CONFLICT", "dup"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.type(screen.getByLabelText("Nombre de la skill"), "React");
    await user.click(screen.getByRole("button", { name: "Añadir skill" }));
    expect(await screen.findByText("Ya has añadido esa skill.")).toBeInTheDocument();
  });

  it("eliminar una skill llama a DELETE /api/profile/me/skills/:id y refresca", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(deleteProfileSkill).mockResolvedValueOnce(undefined);
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      ...fullProfile,
      skills: [{ id: "s2", name: "TypeScript", level: "INTERMEDIATE", category: null }]
    });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Eliminar React" }));
    await waitFor(() => expect(deleteProfileSkill).toHaveBeenCalledWith("tok-cv", "s1"));
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("Skills es funcional (sin 'próxima fase') y el resto de secciones sigue pendiente", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    expect(screen.queryByText("Añadir skill · próxima fase")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Añadir skill" })).toBeInTheDocument();
    // Experiencia, Educación, Proyectos, Enlaces y Preferencias siguen como próxima fase.
    expect(screen.getAllByText("Próxima fase").length).toBeGreaterThanOrEqual(4);
  });

  it("añadir experiencia llama a POST /api/profile/me/experience y refresca", async () => {
    const newExp = {
      id: "e2",
      company: "Globex",
      role: "Backend Developer",
      startDate: "2020-01-01T00:00:00.000Z",
      endDate: null,
      current: false,
      description: null,
      location: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileExperience).mockResolvedValueOnce(newExp);
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      ...fullProfile,
      experiences: [...fullProfile.experiences, newExp]
    });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.type(screen.getByLabelText("Empresa"), "Globex");
    await user.type(screen.getByLabelText("Puesto"), "Backend Developer");
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { value: "2020-01-01" } });
    await user.click(screen.getByRole("button", { name: "Añadir experiencia" }));

    await waitFor(() =>
      expect(addProfileExperience).toHaveBeenCalledWith(
        "tok-cv",
        expect.objectContaining({ company: "Globex", role: "Backend Developer", startDate: "2020-01-01" })
      )
    );
    expect(await screen.findByText("Backend Developer")).toBeInTheDocument();
  });

  it("no envía experiencia si faltan campos obligatorios", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Añadir experiencia" }));
    expect(await screen.findByText("Empresa, puesto y fecha de inicio son obligatorios.")).toBeInTheDocument();
    expect(addProfileExperience).not.toHaveBeenCalled();
  });

  it("'Actualmente trabajo aquí' deshabilita la fecha de fin", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const endInput = screen.getByLabelText("Fecha de fin");
    expect(endInput).not.toBeDisabled();
    await user.click(screen.getByLabelText("Actualmente trabajo aquí"));
    expect(screen.getByLabelText("Fecha de fin")).toBeDisabled();
  });

  it("muestra error si el POST de experiencia falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileExperience).mockRejectedValueOnce(new ApiClientError(400, "VALIDATION_ERROR", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.type(screen.getByLabelText("Empresa"), "Globex");
    await user.type(screen.getByLabelText("Puesto"), "Backend Developer");
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { value: "2020-01-01" } });
    await user.click(screen.getByRole("button", { name: "Añadir experiencia" }));

    expect(await screen.findByText("Revisa los datos de la experiencia.")).toBeInTheDocument();
  });

  it("elimina una experiencia con DELETE y refresca", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(deleteProfileExperience).mockResolvedValueOnce(undefined);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, experiences: [] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Eliminar experiencia en ACME" }));
    await waitFor(() => expect(deleteProfileExperience).toHaveBeenCalledWith("tok-cv", "e1"));
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("muestra botón de editar por experiencia y precarga los datos al abrir el editor", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Frontend Developer en ACME" }));
    const editor = within(screen.getByRole("group", { name: "Editar experiencia en ACME" }));
    expect(editor.getByLabelText("Empresa")).toHaveValue("ACME");
    expect(editor.getByLabelText("Puesto")).toHaveValue("Frontend Developer");
    // e1 es "actual" → la fecha de fin queda deshabilitada.
    expect(editor.getByLabelText("Fecha de fin")).toBeDisabled();
  });

  it("guardar edición llama a updateProfileExperience con token, id e input, y refresca", async () => {
    const editedExp = {
      id: "e1",
      company: "ACME Corp",
      role: "Frontend Developer",
      startDate: "2021-01-01T00:00:00.000Z",
      endDate: null,
      current: true,
      description: "Construyendo interfaces.",
      location: "Remoto"
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileExperience).mockResolvedValueOnce(editedExp);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, experiences: [editedExp] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Frontend Developer en ACME" }));
    const editor = within(screen.getByRole("group", { name: "Editar experiencia en ACME" }));
    await user.clear(editor.getByLabelText("Empresa"));
    await user.type(editor.getByLabelText("Empresa"), "ACME Corp");
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileExperience).toHaveBeenCalledWith(
        "tok-cv",
        "e1",
        expect.objectContaining({ company: "ACME Corp", role: "Frontend Developer", startDate: "2021-01-01", current: true })
      )
    );
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("cancelar edición cierra el editor y no llama a updateProfileExperience", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Frontend Developer en ACME" }));
    const editor = within(screen.getByRole("group", { name: "Editar experiencia en ACME" }));
    await user.click(editor.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("group", { name: "Editar experiencia en ACME" })).not.toBeInTheDocument();
    expect(updateProfileExperience).not.toHaveBeenCalled();
  });

  it("no envía la edición si falta un campo obligatorio", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Frontend Developer en ACME" }));
    const editor = within(screen.getByRole("group", { name: "Editar experiencia en ACME" }));
    await user.clear(editor.getByLabelText("Empresa"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText("Empresa, puesto y fecha de inicio son obligatorios.")).toBeInTheDocument();
    expect(updateProfileExperience).not.toHaveBeenCalled();
  });

  it("editar vaciando descripción y ubicación las persiste como cadena vacía", async () => {
    const cleared = {
      id: "e1",
      company: "ACME",
      role: "Frontend Developer",
      startDate: "2021-01-01T00:00:00.000Z",
      endDate: null,
      current: true,
      description: null,
      location: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileExperience).mockResolvedValueOnce(cleared);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, experiences: [cleared] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Frontend Developer en ACME" }));
    const editor = within(screen.getByRole("group", { name: "Editar experiencia en ACME" }));
    await user.clear(editor.getByLabelText("Descripción (opcional)"));
    await user.clear(editor.getByLabelText("Ubicación (opcional)"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileExperience).toHaveBeenCalledWith(
        "tok-cv",
        "e1",
        expect.objectContaining({ description: "", location: "" })
      )
    );
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });
});
