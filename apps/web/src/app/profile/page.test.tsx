import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import {
  addProfileEducation,
  addProfileExperience,
  addProfileProject,
  addProfileSkill,
  deleteProfileEducation,
  deleteProfileExperience,
  deleteProfileProject,
  deleteProfileSkill,
  getMyProfile,
  updateMyProfile,
  updateProfileEducation,
  updateProfileExperience,
  updateProfileProject,
  replaceProfileLinks,
  updateProfilePreferences
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
  deleteProfileExperience: vi.fn(),
  addProfileEducation: vi.fn(),
  updateProfileEducation: vi.fn(),
  deleteProfileEducation: vi.fn(),
  addProfileProject: vi.fn(),
  updateProfileProject: vi.fn(),
  deleteProfileProject: vi.fn(),
  replaceProfileLinks: vi.fn(),
  updateProfilePreferences: vi.fn()
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

// Acota las consultas a una sección concreta del CV (por su encabezado), para
// desambiguar labels repetidos entre secciones (p. ej. "Fecha de inicio").
function sectionByHeading(name: string) {
  return within(screen.getByRole("heading", { name }).closest("section") as HTMLElement);
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
    expect(screen.getByText("Aún no has añadido formación.")).toBeInTheDocument();
    // Preferencias ya no es read-only: con perfil vacío muestra el formulario editable (valores por defecto).
    expect(screen.getByRole("button", { name: "Guardar preferencias" })).toBeInTheDocument();
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

  it("Skills es funcional (sin 'próxima fase') y ya no quedan secciones en próxima fase", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    expect(screen.queryByText("Añadir skill · próxima fase")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Añadir skill" })).toBeInTheDocument();
    // Ya no quedan secciones en "próxima fase": todo el CV es funcional.
    expect(screen.queryAllByText("Próxima fase")).toHaveLength(0);
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
    fireEvent.change(sectionByHeading("Experiencia profesional").getByLabelText("Fecha de inicio"), {
      target: { value: "2020-01-01" }
    });
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

    const exp = sectionByHeading("Experiencia profesional");
    expect(exp.getByLabelText("Fecha de fin")).not.toBeDisabled();
    await user.click(exp.getByLabelText("Actualmente trabajo aquí"));
    expect(exp.getByLabelText("Fecha de fin")).toBeDisabled();
  });

  it("muestra error si el POST de experiencia falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileExperience).mockRejectedValueOnce(new ApiClientError(400, "VALIDATION_ERROR", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.type(screen.getByLabelText("Empresa"), "Globex");
    await user.type(screen.getByLabelText("Puesto"), "Backend Developer");
    fireEvent.change(sectionByHeading("Experiencia profesional").getByLabelText("Fecha de inicio"), {
      target: { value: "2020-01-01" }
    });
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

  // --- Educación (Sprint 13E-01) --------------------------------------------

  it("añadir formación llama a POST /api/profile/me/education y refresca", async () => {
    const newEdu = {
      id: "ed2",
      institution: "UOC",
      title: "Máster en Datos",
      field: null,
      startDate: "2022-09-01T00:00:00.000Z",
      endDate: null,
      current: false
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileEducation).mockResolvedValueOnce(newEdu);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, education: [...fullProfile.education, newEdu] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const edu = sectionByHeading("Educación");
    await user.type(edu.getByLabelText("Institución"), "UOC");
    await user.type(edu.getByLabelText("Título"), "Máster en Datos");
    fireEvent.change(edu.getByLabelText("Fecha de inicio"), { target: { value: "2022-09-01" } });
    await user.click(edu.getByRole("button", { name: "Añadir formación" }));

    await waitFor(() =>
      expect(addProfileEducation).toHaveBeenCalledWith(
        "tok-cv",
        expect.objectContaining({ institution: "UOC", title: "Máster en Datos", startDate: "2022-09-01" })
      )
    );
    expect(await screen.findByText("Máster en Datos")).toBeInTheDocument();
  });

  it("no envía formación si faltan campos obligatorios", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const edu = sectionByHeading("Educación");
    await user.click(edu.getByRole("button", { name: "Añadir formación" }));
    expect(await edu.findByText("Institución, título y fecha de inicio son obligatorios.")).toBeInTheDocument();
    expect(addProfileEducation).not.toHaveBeenCalled();
  });

  it("'Formación en curso' deshabilita la fecha de fin", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const edu = sectionByHeading("Educación");
    expect(edu.getByLabelText("Fecha de fin")).not.toBeDisabled();
    await user.click(edu.getByLabelText("Formación en curso"));
    expect(edu.getByLabelText("Fecha de fin")).toBeDisabled();
  });

  it("muestra error si el POST de formación falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileEducation).mockRejectedValueOnce(new ApiClientError(400, "VALIDATION_ERROR", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const edu = sectionByHeading("Educación");
    await user.type(edu.getByLabelText("Institución"), "UOC");
    await user.type(edu.getByLabelText("Título"), "Máster en Datos");
    fireEvent.change(edu.getByLabelText("Fecha de inicio"), { target: { value: "2022-09-01" } });
    await user.click(edu.getByRole("button", { name: "Añadir formación" }));

    expect(await edu.findByText("Revisa los datos de la formación.")).toBeInTheDocument();
  });

  it("eliminar formación llama a DELETE /api/profile/me/education/:id y refresca", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(deleteProfileEducation).mockResolvedValueOnce(undefined);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, education: [] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Eliminar formación en UPV/EHU" }));
    await waitFor(() => expect(deleteProfileEducation).toHaveBeenCalledWith("tok-cv", "ed1"));
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("Educación es funcional (sin 'Próxima fase')", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const edu = sectionByHeading("Educación");
    expect(edu.queryByText("Próxima fase")).not.toBeInTheDocument();
    expect(edu.getByRole("button", { name: "Añadir formación" })).toBeInTheDocument();
    expect(screen.queryAllByText("Próxima fase")).toHaveLength(0);
  });

  it("muestra botón de editar por formación y precarga los datos al abrir el editor", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Grado en Informática en UPV/EHU" }));
    const editor = within(screen.getByRole("group", { name: "Editar formación en UPV/EHU" }));
    expect(editor.getByLabelText("Institución")).toHaveValue("UPV/EHU");
    expect(editor.getByLabelText("Título")).toHaveValue("Grado en Informática");
    expect(editor.getByLabelText("Área / campo (opcional)")).toHaveValue("Software");
  });

  it("guardar edición llama a updateProfileEducation con token, id e input, y refresca", async () => {
    const editedEdu = {
      id: "ed1",
      institution: "UPV",
      title: "Grado en Informática",
      field: "Software",
      startDate: "2015-09-01T00:00:00.000Z",
      endDate: "2019-06-01T00:00:00.000Z",
      current: false
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileEducation).mockResolvedValueOnce(editedEdu);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, education: [editedEdu] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Grado en Informática en UPV/EHU" }));
    const editor = within(screen.getByRole("group", { name: "Editar formación en UPV/EHU" }));
    await user.clear(editor.getByLabelText("Institución"));
    await user.type(editor.getByLabelText("Institución"), "UPV");
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileEducation).toHaveBeenCalledWith(
        "tok-cv",
        "ed1",
        expect.objectContaining({ institution: "UPV", title: "Grado en Informática", startDate: "2015-09-01", current: false })
      )
    );
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("cancelar edición de formación cierra el editor y no llama a updateProfileEducation", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Grado en Informática en UPV/EHU" }));
    const editor = within(screen.getByRole("group", { name: "Editar formación en UPV/EHU" }));
    await user.click(editor.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("group", { name: "Editar formación en UPV/EHU" })).not.toBeInTheDocument();
    expect(updateProfileEducation).not.toHaveBeenCalled();
  });

  it("no envía la edición de formación si falta un campo obligatorio", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Grado en Informática en UPV/EHU" }));
    const editor = within(screen.getByRole("group", { name: "Editar formación en UPV/EHU" }));
    await user.clear(editor.getByLabelText("Institución"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText("Institución, título y fecha de inicio son obligatorios.")).toBeInTheDocument();
    expect(updateProfileEducation).not.toHaveBeenCalled();
  });

  it("editar vaciando el área/campo lo persiste como cadena vacía", async () => {
    const cleared = {
      id: "ed1",
      institution: "UPV/EHU",
      title: "Grado en Informática",
      field: null,
      startDate: "2015-09-01T00:00:00.000Z",
      endDate: "2019-06-01T00:00:00.000Z",
      current: false
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileEducation).mockResolvedValueOnce(cleared);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, education: [cleared] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar Grado en Informática en UPV/EHU" }));
    const editor = within(screen.getByRole("group", { name: "Editar formación en UPV/EHU" }));
    await user.clear(editor.getByLabelText("Área / campo (opcional)"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileEducation).toHaveBeenCalledWith("tok-cv", "ed1", expect.objectContaining({ field: "" }))
    );
  });

  // --- Proyectos (Sprint 13F-01) --------------------------------------------

  it("muestra empty state de proyectos cuando no hay registros", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    expect(screen.getByText("Aún no has añadido proyectos.")).toBeInTheDocument();
  });

  it("Proyectos es funcional (sin 'Próxima fase')", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    expect(proj.queryByText("Próxima fase")).not.toBeInTheDocument();
    expect(proj.getByRole("button", { name: "Añadir proyecto" })).toBeInTheDocument();
    expect(screen.queryAllByText("Próxima fase")).toHaveLength(0);
  });

  it("añadir un proyecto llama a POST /api/profile/me/projects y refresca", async () => {
    const newProject = { id: "pr2", name: "cli-tool", description: null, technologies: ["Go"], url: null, repoUrl: null };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileProject).mockResolvedValueOnce(newProject);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [...fullProfile.projects, newProject] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Nombre del proyecto"), "cli-tool");
    await user.type(proj.getByLabelText("Tecnologías (separadas por comas)"), "Go");
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    await waitFor(() =>
      expect(addProfileProject).toHaveBeenCalledWith(
        "tok-cv",
        expect.objectContaining({ name: "cli-tool", technologies: ["Go"] })
      )
    );
    expect((await screen.findAllByText("cli-tool")).length).toBeGreaterThan(0);
  });

  it("envía las tecnologías separadas por comas como array limpio (sin vacíos ni duplicados)", async () => {
    const newProject = {
      id: "pr3",
      name: "webapp",
      description: null,
      technologies: ["React", "Node.js", "PostgreSQL"],
      url: null,
      repoUrl: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileProject).mockResolvedValueOnce(newProject);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [...fullProfile.projects, newProject] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Nombre del proyecto"), "webapp");
    await user.type(
      proj.getByLabelText("Tecnologías (separadas por comas)"),
      "React , Node.js ,, React, PostgreSQL,"
    );
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    await waitFor(() =>
      expect(addProfileProject).toHaveBeenCalledWith(
        "tok-cv",
        expect.objectContaining({ technologies: ["React", "Node.js", "PostgreSQL"] })
      )
    );
  });

  it("no envía proyecto si falta el nombre", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Tecnologías (separadas por comas)"), "React");
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    expect(await proj.findByText("Indica el nombre del proyecto.")).toBeInTheDocument();
    expect(addProfileProject).not.toHaveBeenCalled();
  });

  it("no envía proyecto si no hay tecnologías", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Nombre del proyecto"), "cli-tool");
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    expect(await proj.findByText("Añade al menos una tecnología.")).toBeInTheDocument();
    expect(addProfileProject).not.toHaveBeenCalled();
  });

  it("no envía proyecto si la URL de demo es inválida", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Nombre del proyecto"), "cli-tool");
    await user.type(proj.getByLabelText("Tecnologías (separadas por comas)"), "Go");
    await user.type(proj.getByLabelText("URL demo (opcional)"), "no-es-una-url");
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    expect(await proj.findByText("La URL de demo no es válida.")).toBeInTheDocument();
    expect(addProfileProject).not.toHaveBeenCalled();
  });

  it("no envía proyecto si la URL del repositorio es inválida", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Nombre del proyecto"), "cli-tool");
    await user.type(proj.getByLabelText("Tecnologías (separadas por comas)"), "Go");
    await user.type(proj.getByLabelText("URL repositorio (opcional)"), "tampoco-es-url");
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    expect(await proj.findByText("La URL del repositorio no es válida.")).toBeInTheDocument();
    expect(addProfileProject).not.toHaveBeenCalled();
  });

  it("muestra error si el POST de proyecto falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(addProfileProject).mockRejectedValueOnce(new ApiClientError(400, "VALIDATION_ERROR", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const proj = sectionByHeading("Proyectos");
    await user.type(proj.getByLabelText("Nombre del proyecto"), "cli-tool");
    await user.type(proj.getByLabelText("Tecnologías (separadas por comas)"), "Go");
    await user.click(proj.getByRole("button", { name: "Añadir proyecto" }));

    expect(await proj.findByText("Revisa los datos del proyecto.")).toBeInTheDocument();
  });

  it("eliminar un proyecto llama a DELETE /api/profile/me/projects/:id y refresca", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(deleteProfileProject).mockResolvedValueOnce(undefined);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Eliminar proyecto design-system" }));
    await waitFor(() => expect(deleteProfileProject).toHaveBeenCalledWith("tok-cv", "pr1"));
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  // --- Proyectos · edición inline (Sprint 13F-02) ---------------------------

  it("muestra botón de editar por proyecto y precarga los datos al abrir el editor", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    expect(editor.getByLabelText("Nombre del proyecto")).toHaveValue("design-system");
    expect(editor.getByLabelText("Tecnologías (separadas por comas)")).toHaveValue("React, TypeScript");
    expect(editor.getByLabelText("Descripción (opcional)")).toHaveValue("DS interno");
  });

  it("guardar edición llama a updateProfileProject con token, id e input, sin url/repoUrl vacíos, y refresca", async () => {
    const edited = {
      id: "pr1",
      name: "design-system-2",
      description: "DS interno",
      technologies: ["React", "TypeScript"],
      url: null,
      repoUrl: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileProject).mockResolvedValueOnce(edited);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [edited] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("Nombre del proyecto"));
    await user.type(editor.getByLabelText("Nombre del proyecto"), "design-system-2");
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileProject).toHaveBeenCalledWith(
        "tok-cv",
        "pr1",
        expect.objectContaining({ name: "design-system-2", technologies: ["React", "TypeScript"], description: "DS interno" })
      )
    );
    const payload = vi.mocked(updateProfileProject).mock.calls[0][2];
    expect(payload).not.toHaveProperty("url");
    expect(payload).not.toHaveProperty("repoUrl");
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("cancelar edición de proyecto cierra el editor y no llama a updateProfileProject", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.click(editor.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("group", { name: "Editar proyecto design-system" })).not.toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  it("no envía la edición si falta el nombre", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("Nombre del proyecto"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText("Indica el nombre del proyecto.")).toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  it("no envía la edición si no hay tecnologías", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("Tecnologías (separadas por comas)"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText("Añade al menos una tecnología.")).toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  it("edita las tecnologías y las envía como array limpio y deduplicado", async () => {
    const edited = {
      id: "pr1",
      name: "design-system",
      description: "DS interno",
      technologies: ["React", "Vue", "Svelte"],
      url: null,
      repoUrl: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileProject).mockResolvedValueOnce(edited);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [edited] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("Tecnologías (separadas por comas)"));
    await user.type(editor.getByLabelText("Tecnologías (separadas por comas)"), "React , Vue ,, React, Svelte,");
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileProject).toHaveBeenCalledWith(
        "tok-cv",
        "pr1",
        expect.objectContaining({ technologies: ["React", "Vue", "Svelte"] })
      )
    );
  });

  it("no envía la edición si la URL de demo es inválida", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.type(editor.getByLabelText("URL demo (opcional)"), "no-es-url");
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText("La URL de demo no es válida.")).toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  it("no envía la edición si la URL del repositorio es inválida", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.type(editor.getByLabelText("URL repositorio (opcional)"), "tampoco-es-url");
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText("La URL del repositorio no es válida.")).toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  it("editar vaciando la descripción la persiste como cadena vacía", async () => {
    const cleared = {
      id: "pr1",
      name: "design-system",
      description: null,
      technologies: ["React", "TypeScript"],
      url: null,
      repoUrl: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfileProject).mockResolvedValueOnce(cleared);
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [cleared] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("Descripción (opcional)"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateProfileProject).toHaveBeenCalledWith("tok-cv", "pr1", expect.objectContaining({ description: "" }))
    );
  });

  it("bloquea el guardado si se intenta vaciar una URL de demo existente", async () => {
    const withUrl = {
      id: "pr1",
      name: "design-system",
      description: "DS interno",
      technologies: ["React"],
      url: "https://demo.old",
      repoUrl: null
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [withUrl] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("URL demo (opcional)"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText(/Para quitar una URL existente hace falta soporte backend/)).toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  it("bloquea el guardado si se intenta vaciar una URL de repositorio existente", async () => {
    const withRepo = {
      id: "pr1",
      name: "design-system",
      description: "DS interno",
      technologies: ["React"],
      url: null,
      repoUrl: "https://github.com/old"
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, projects: [withRepo] });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    await user.click(screen.getByRole("button", { name: "Editar proyecto design-system" }));
    const editor = within(screen.getByRole("group", { name: "Editar proyecto design-system" }));
    await user.clear(editor.getByLabelText("URL repositorio (opcional)"));
    await user.click(editor.getByRole("button", { name: "Guardar" }));

    expect(editor.getByText(/Para quitar una URL existente hace falta soporte backend/)).toBeInTheDocument();
    expect(updateProfileProject).not.toHaveBeenCalled();
  });

  // --- Enlaces (Sprint 13G-01) ----------------------------------------------

  it("muestra empty state de enlaces cuando no hay registros", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    expect(sec.getByText(/Aún no has añadido enlaces/)).toBeInTheDocument();
  });

  it("renderiza los enlaces existentes con su tipo y URL", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    expect(sec.getByLabelText("URL del enlace 1")).toHaveValue("https://github.com/ana");
    expect(sec.getByLabelText("Tipo del enlace 1")).toHaveValue("GITHUB");
  });

  it("Enlaces es funcional (sin 'Próxima fase')", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    expect(sec.queryByText("Próxima fase")).not.toBeInTheDocument();
    expect(sec.getByRole("button", { name: "Guardar enlaces" })).toBeInTheDocument();
    expect(screen.queryAllByText("Próxima fase")).toHaveLength(0);
  });

  it("añade una fila de enlace localmente", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    expect(sec.queryByLabelText("URL del enlace 1")).not.toBeInTheDocument();
    await user.click(sec.getByRole("button", { name: /añadir enlace/i }));
    expect(sec.getByLabelText("URL del enlace 1")).toBeInTheDocument();
  });

  it("cambia el tipo de un enlace", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    await user.selectOptions(sec.getByLabelText("Tipo del enlace 1"), "LINKEDIN");
    expect(sec.getByLabelText("Tipo del enlace 1")).toHaveValue("LINKEDIN");
  });

  it("guardar llama a PUT /api/profile/me/links con la lista completa limpia y refresca", async () => {
    const savedLinks = [
      { id: "l1", type: "GITHUB" as const, url: "https://github.com/ana" },
      { id: "l2", type: "LINKEDIN" as const, url: "https://linkedin.com/in/ana" }
    ];
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(replaceProfileLinks).mockResolvedValueOnce({ links: savedLinks });
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...fullProfile, links: savedLinks });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const sec = sectionByHeading("Enlaces");
    await user.click(sec.getByRole("button", { name: /añadir enlace/i }));
    await user.selectOptions(sec.getByLabelText("Tipo del enlace 2"), "LINKEDIN");
    await user.type(sec.getByLabelText("URL del enlace 2"), "https://linkedin.com/in/ana");
    await user.click(sec.getByRole("button", { name: "Guardar enlaces" }));

    await waitFor(() =>
      expect(replaceProfileLinks).toHaveBeenCalledWith("tok-cv", {
        links: [
          { type: "GITHUB", url: "https://github.com/ana" },
          { type: "LINKEDIN", url: "https://linkedin.com/in/ana" }
        ]
      })
    );
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("no envía si no hay enlaces", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    await user.click(sec.getByRole("button", { name: "Guardar enlaces" }));
    expect(sec.getByText("Añade al menos un enlace válido.")).toBeInTheDocument();
    expect(replaceProfileLinks).not.toHaveBeenCalled();
  });

  it("no envía si una URL está vacía", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    await user.click(sec.getByRole("button", { name: /añadir enlace/i }));
    await user.click(sec.getByRole("button", { name: "Guardar enlaces" }));
    expect(sec.getByText("Completa la URL o elimina la fila.")).toBeInTheDocument();
    expect(replaceProfileLinks).not.toHaveBeenCalled();
  });

  it("no envía si una URL no es http/https", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    await user.click(sec.getByRole("button", { name: /añadir enlace/i }));
    await user.type(sec.getByLabelText("URL del enlace 1"), "ftp://nope");
    await user.click(sec.getByRole("button", { name: "Guardar enlaces" }));
    expect(sec.getByText("La URL debe empezar por http:// o https://.")).toBeInTheDocument();
    expect(replaceProfileLinks).not.toHaveBeenCalled();
  });

  it("eliminar una fila localmente y guardar envía la lista restante", async () => {
    const twoLinks = {
      ...fullProfile,
      links: [
        { id: "l1", type: "GITHUB" as const, url: "https://github.com/ana" },
        { id: "l2", type: "LINKEDIN" as const, url: "https://linkedin.com/in/ana" }
      ]
    };
    vi.mocked(getMyProfile).mockResolvedValueOnce(twoLinks);
    vi.mocked(replaceProfileLinks).mockResolvedValueOnce({
      links: [{ id: "l2", type: "LINKEDIN", url: "https://linkedin.com/in/ana" }]
    });
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      ...twoLinks,
      links: [{ id: "l2", type: "LINKEDIN", url: "https://linkedin.com/in/ana" }]
    });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const sec = sectionByHeading("Enlaces");
    await user.click(sec.getByRole("button", { name: "Eliminar enlace 1" }));
    await user.click(sec.getByRole("button", { name: "Guardar enlaces" }));

    await waitFor(() =>
      expect(replaceProfileLinks).toHaveBeenCalledWith("tok-cv", {
        links: [{ type: "LINKEDIN", url: "https://linkedin.com/in/ana" }]
      })
    );
  });

  it("muestra error si el PUT de enlaces falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(replaceProfileLinks).mockRejectedValueOnce(new ApiClientError(400, "VALIDATION_ERROR", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Enlaces");
    await user.click(sec.getByRole("button", { name: "Guardar enlaces" }));
    expect(await sec.findByText("Revisa los datos de los enlaces.")).toBeInTheDocument();
  });

  // --- Preferencias (Sprint 13H-01) -----------------------------------------

  it("Preferencias es funcional: sin 'Próxima fase' y con botón de guardar", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    expect(sec.queryByText("Próxima fase")).not.toBeInTheDocument();
    expect(sec.getByRole("button", { name: "Guardar preferencias" })).toBeInTheDocument();
    expect(screen.queryAllByText("Próxima fase")).toHaveLength(0);
  });

  it("con preferencias null muestra valores por defecto editables", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(emptyProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    expect(sec.getByLabelText("Roles deseados")).toHaveValue("");
    expect(sec.getByLabelText("Modalidad")).toHaveValue("ANY");
    expect(sec.getByLabelText("Seniority")).toHaveValue("");
    expect(sec.getByLabelText("Jornada completa")).not.toBeChecked();
  });

  it("precarga las preferencias existentes", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    expect(sec.getByLabelText("Roles deseados")).toHaveValue("Frontend");
    expect(sec.getByLabelText("Ubicaciones preferidas")).toHaveValue("Bilbao");
    expect(sec.getByLabelText("Modalidad")).toHaveValue("REMOTE");
    expect(sec.getByLabelText("Seniority")).toHaveValue("MID");
    expect(sec.getByLabelText("Salario mínimo")).toHaveValue(35000);
    expect(sec.getByLabelText("Salario máximo")).toHaveValue(50000);
    expect(sec.getByLabelText("Jornada completa")).toBeChecked();
  });

  it("guardar llama a updateProfilePreferences con payload normalizado y refresca", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfilePreferences).mockResolvedValueOnce(fullProfile.preferences!);
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const sec = sectionByHeading("Preferencias");
    fireEvent.change(sec.getByLabelText("Roles deseados"), { target: { value: "Frontend, Frontend , Backend ," } });
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));

    await waitFor(() =>
      expect(updateProfilePreferences).toHaveBeenCalledWith("tok-cv", {
        desiredRoles: ["Frontend", "Backend"],
        preferredLocations: ["Bilbao"],
        remotePreference: "REMOTE",
        seniority: "MID",
        salaryMin: 35000,
        salaryMax: 50000,
        contractTypes: ["FULL_TIME"]
      })
    );
    await waitFor(() => expect(getMyProfile).toHaveBeenCalledTimes(2));
  });

  it("permite vaciar arrays y salarios (envía [] y null)", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfilePreferences).mockResolvedValueOnce(fullProfile.preferences!);
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");

    const sec = sectionByHeading("Preferencias");
    fireEvent.change(sec.getByLabelText("Roles deseados"), { target: { value: "" } });
    fireEvent.change(sec.getByLabelText("Ubicaciones preferidas"), { target: { value: "" } });
    fireEvent.change(sec.getByLabelText("Salario mínimo"), { target: { value: "" } });
    fireEvent.change(sec.getByLabelText("Salario máximo"), { target: { value: "" } });
    await user.click(sec.getByLabelText("Jornada completa")); // desmarca FULL_TIME
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));

    await waitFor(() =>
      expect(updateProfilePreferences).toHaveBeenCalledWith("tok-cv", {
        desiredRoles: [],
        preferredLocations: [],
        remotePreference: "REMOTE",
        seniority: "MID",
        salaryMin: null,
        salaryMax: null,
        contractTypes: []
      })
    );
  });

  it("no envía si el salario mínimo no es un entero positivo", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    fireEvent.change(sec.getByLabelText("Salario mínimo"), { target: { value: "0" } });
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));
    expect(sec.getByText("El salario mínimo debe ser un número entero positivo.")).toBeInTheDocument();
    expect(updateProfilePreferences).not.toHaveBeenCalled();
  });

  it("no envía si el salario máximo no es un entero positivo", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    fireEvent.change(sec.getByLabelText("Salario máximo"), { target: { value: "-5" } });
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));
    expect(sec.getByText("El salario máximo debe ser un número entero positivo.")).toBeInTheDocument();
    expect(updateProfilePreferences).not.toHaveBeenCalled();
  });

  it("no envía si el salario es decimal", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    fireEvent.change(sec.getByLabelText("Salario mínimo"), { target: { value: "12.5" } });
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));
    expect(sec.getByText("El salario mínimo debe ser un número entero positivo.")).toBeInTheDocument();
    expect(updateProfilePreferences).not.toHaveBeenCalled();
  });

  it("no envía si el salario máximo es menor que el mínimo", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    fireEvent.change(sec.getByLabelText("Salario máximo"), { target: { value: "30000" } });
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));
    expect(sec.getByText("El salario máximo no puede ser menor que el salario mínimo.")).toBeInTheDocument();
    expect(updateProfilePreferences).not.toHaveBeenCalled();
  });

  it("muestra error si el PUT de preferencias falla", async () => {
    vi.mocked(getMyProfile).mockResolvedValueOnce(fullProfile);
    vi.mocked(updateProfilePreferences).mockRejectedValueOnce(new ApiClientError(400, "VALIDATION_ERROR", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Tu perfil tech vivo");
    const sec = sectionByHeading("Preferencias");
    await user.click(sec.getByRole("button", { name: "Guardar preferencias" }));
    expect(await sec.findByText("Revisa los datos de preferencias.")).toBeInTheDocument();
  });
});
