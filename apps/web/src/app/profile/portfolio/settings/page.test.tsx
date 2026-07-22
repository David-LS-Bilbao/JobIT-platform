import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import {
  getMyPortfolioSettings,
  publishMyPortfolio,
  unpublishMyPortfolio,
  updateMyPortfolioSettings
} from "@/features/profile/profile-api";
import { ProfilePortfolioSettingsPage } from "@/features/profile/profile-portfolio-settings-page";
import { ApiClientError } from "@/lib/api-client";
import type { PortfolioSettingsDto, UserDto } from "@/types/api";

const { pushMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  return { pushMock: push, routerMock: { push } };
});
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/profile/portfolio/settings"
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/profile/profile-api", async (importOriginal) => ({
  // Mantiene buildPublicPortfolioUrl real; mockea solo la red.
  ...(await importOriginal<typeof import("@/features/profile/profile-api")>()),
  getMyPortfolioSettings: vi.fn(),
  updateMyPortfolioSettings: vi.fn(),
  publishMyPortfolio: vi.fn(),
  unpublishMyPortfolio: vi.fn()
}));
vi.mock("@/features/auth/auth-api", () => ({ logoutCandidate: vi.fn() }));
vi.mock("@/features/auth/auth-identity", () => ({ loadCandidateIdentity: vi.fn(() => new Promise(() => {})) }));

const sessionUser: UserDto = {
  id: "u1",
  email: "ana@jobit.dev",
  role: "CANDIDATE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

const unpublished: PortfolioSettingsDto = {
  slug: "ana-perez",
  isPublished: false,
  publishedAt: null,
  showLocation: true,
  showAvailability: true,
  showPreferences: false,
  publicUrlPath: "/u/ana-perez"
};

const published: PortfolioSettingsDto = {
  ...unpublished,
  isPublished: true,
  publishedAt: "2026-07-02T00:00:00.000Z"
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
      <ProfilePortfolioSettingsPage />
    </AuthProvider>
  );
  return utils;
}

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  vi.clearAllMocks();
});

describe("ProfilePortfolioSettingsPage (/profile/portfolio/settings)", () => {
  it("es privada: sin sesión redirige al login", async () => {
    render(
      <AuthProvider>
        <ProfilePortfolioSettingsPage />
      </AuthProvider>
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login?reason=required"));
    expect(getMyPortfolioSettings).not.toHaveBeenCalled();
  });

  it("carga y muestra estado no publicado, slug y ruta pública", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();

    expect(await screen.findByText("No publicado")).toBeInTheDocument();
    expect(screen.getByLabelText("Enlace público (slug)")).toHaveValue("ana-perez");
    expect(screen.getByText("Ruta pública: /u/ana-perez")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar portfolio" })).toBeInTheDocument();
  });

  it("PORT-01: muestra '← Volver al portfolio' hacia /profile/portfolio", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();
    await screen.findByText("No publicado");
    expect(screen.getByRole("link", { name: "← Volver al portfolio" })).toHaveAttribute(
      "href",
      "/profile/portfolio"
    );
  });

  it("guarda un slug válido llamando a updateMyPortfolioSettings", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    vi.mocked(updateMyPortfolioSettings).mockResolvedValueOnce({ ...unpublished, slug: "ana-dev", publicUrlPath: "/u/ana-dev" });
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("No publicado");

    const slugInput = screen.getByLabelText("Enlace público (slug)");
    await user.clear(slugInput);
    await user.type(slugInput, "ana-dev");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(updateMyPortfolioSettings).toHaveBeenCalledWith(
        "tok-cv",
        expect.objectContaining({ slug: "ana-dev", showLocation: true, showAvailability: true, showPreferences: false })
      )
    );
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();
  });

  it("muestra error de slug inválido", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    vi.mocked(updateMyPortfolioSettings).mockRejectedValueOnce(new ApiClientError(400, "INVALID_SLUG", "bad"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("No publicado");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("El slug solo puede contener letras, números y guiones.")).toBeInTheDocument();
  });

  it("muestra error de slug ocupado", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    vi.mocked(updateMyPortfolioSettings).mockRejectedValueOnce(new ApiClientError(409, "SLUG_TAKEN", "taken"));
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("No publicado");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Ese enlace ya está en uso. Prueba con otro.")).toBeInTheDocument();
  });

  it("publica el portfolio", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    vi.mocked(publishMyPortfolio).mockResolvedValueOnce(published);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("No publicado");

    await user.click(screen.getByRole("button", { name: "Publicar portfolio" }));

    await waitFor(() => expect(publishMyPortfolio).toHaveBeenCalledWith("tok-cv"));
    expect(await screen.findByText("Publicado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Despublicar portfolio" })).toBeInTheDocument();
  });

  it("muestra el checklist de campos pendientes cuando publish devuelve PORTFOLIO_NOT_READY", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    vi.mocked(publishMyPortfolio).mockRejectedValueOnce(
      new ApiClientError(400, "PORTFOLIO_NOT_READY", "not ready", undefined, ["name", "skills"])
    );
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("No publicado");

    await user.click(screen.getByRole("button", { name: "Publicar portfolio" }));

    expect(await screen.findByText("Completa los campos marcados en tu JobIT CV para poder publicar.")).toBeInTheDocument();
    expect(screen.getByText("Nombre profesional")).toBeInTheDocument();
    expect(screen.getByText("Al menos una skill")).toBeInTheDocument();
  });

  it("despublica el portfolio", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(published);
    vi.mocked(unpublishMyPortfolio).mockResolvedValueOnce(unpublished);
    const user = userEvent.setup();
    renderWithSession();
    await screen.findByText("Publicado");

    await user.click(screen.getByRole("button", { name: "Despublicar portfolio" }));

    await waitFor(() => expect(unpublishMyPortfolio).toHaveBeenCalledWith("tok-cv"));
    expect(await screen.findByText("No publicado")).toBeInTheDocument();
  });

  it("copia el enlace usando el portapapeles cuando está disponible", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();
    await screen.findByText("No publicado");

    // fireEvent (no userEvent): userEvent.setup() instalaría su propio stub de clipboard.
    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/u/ana-perez")));
    expect(await screen.findByText("Enlace copiado")).toBeInTheDocument();
  });

  it("no rompe si el portapapeles no está disponible (fallback a URL visible)", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();
    await screen.findByText("No publicado");

    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));
    expect(screen.queryByText("Enlace copiado")).not.toBeInTheDocument();
    // La URL sigue visible para copiar a mano (aparece en el <code> y en la ruta relativa).
    expect(screen.getAllByText(/\/u\/ana-perez/).length).toBeGreaterThan(0);
  });

  it("enlaza a la preview privada y avisa de que el enlace requiere publicar", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();
    await screen.findByText("No publicado");

    expect(screen.getByRole("link", { name: "Ver preview privada" })).toHaveAttribute("href", "/profile/portfolio");
    // Microcopy actualizado (14F): la ruta ya está activa; el enlace requiere publicar.
    expect(screen.queryByText(/se activará en el siguiente paso/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Este enlace no será visible públicamente hasta que publiques tu portfolio.")
    ).toBeInTheDocument();
  });

  it("muestra el QR del portfolio (generado localmente) cuando está publicado", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(published);
    renderWithSession();
    await screen.findByText("Publicado");

    expect(screen.getByText("QR del portfolio")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /código qr/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar QR" })).toBeInTheDocument();
  });

  it("el QR se basa en la URL pública absoluta", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(published);
    renderWithSession();
    await screen.findByText("Publicado");

    expect(screen.getAllByText(/https?:\/\/.+\/u\/ana-perez/).length).toBeGreaterThan(0);
  });

  it("no muestra QR activo si el portfolio no está publicado", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();
    await screen.findByText("No publicado");

    expect(screen.getByText("Publica tu portfolio para compartir este QR.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /código qr/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descargar QR" })).not.toBeInTheDocument();
  });

  it("el QR no usa servicios externos (SVG inline, sin imágenes remotas)", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(published);
    const { container } = renderWithSession();
    await screen.findByText("Publicado");

    expect(container.querySelector("img[src]")).toBeNull();
    expect(screen.queryByText(/qrserver|quickchart|chart\.googleapis|goqr/i)).not.toBeInTheDocument();
  });

  it("no expone PDF server-side, GitHub import, IA ni monetización", async () => {
    vi.mocked(getMyPortfolioSettings).mockResolvedValueOnce(unpublished);
    renderWithSession();
    await screen.findByText("No publicado");

    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github import|importar github/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/inteligencia artificial|ai review/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan|pricing|suscripción/i)).not.toBeInTheDocument();
  });
});
