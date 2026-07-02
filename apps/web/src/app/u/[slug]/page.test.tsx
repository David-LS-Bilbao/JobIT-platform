import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicPortfolio } from "@/features/profile/profile-api";
import { PublicPortfolioPage } from "@/features/profile/public-portfolio-page";
import { ApiClientError } from "@/lib/api-client";
import type { PublicPortfolioDto } from "@/types/api";

vi.mock("@/features/profile/profile-api", async (importOriginal) => ({
  // Mantiene resolveProfileImageUrl real (lo usa ProfileAvatar); mockea solo la red.
  ...(await importOriginal<typeof import("@/features/profile/profile-api")>()),
  getPublicPortfolio: vi.fn()
}));

const dto: PublicPortfolioDto = {
  slug: "ana-perez",
  publicUrlPath: "/u/ana-perez",
  publishedAt: "2026-07-02T00:00:00.000Z",
  profile: {
    name: "Ana Pérez",
    headline: "Frontend Developer",
    summary: "Desarrolladora frontend centrada en React.",
    avatarUrl: "https://img.test/a.png",
    location: "Bilbao",
    availabilityStatus: "OPEN",
    locationRemote: true,
    skills: [{ name: "React", level: "ADVANCED" }],
    experiences: [
      {
        company: "ACME",
        role: "Frontend Dev",
        startDate: "2021-01-01T00:00:00.000Z",
        endDate: null,
        current: true,
        description: "Construyendo interfaces.",
        location: "Remoto"
      }
    ],
    education: [],
    projects: [
      { name: "design-system", description: "DS interno", technologies: ["React"], url: "https://ds.jobit.dev", repoUrl: "https://github.com/ana/ds" }
    ],
    links: [{ type: "GITHUB", url: "https://github.com/ana" }],
    preferences: null
  }
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("PublicPortfolioPage (/u/[slug])", () => {
  it("renderiza un portfolio publicado sin usar token", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce(dto);
    render(<PublicPortfolioPage slug="ana-perez" />);

    expect(await screen.findByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(getPublicPortfolio).toHaveBeenCalledWith("ana-perez");
    // Un único argumento: no se pasa token.
    expect(vi.mocked(getPublicPortfolio).mock.calls[0]).toHaveLength(1);
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Desarrolladora frontend centrada en React.")).toBeInTheDocument();
    expect(screen.getAllByText(/React/).length).toBeGreaterThan(0);
    expect(screen.getByText("design-system")).toBeInTheDocument();
    expect(screen.getByText("Generado con JobIT")).toBeInTheDocument();
  });

  it("muestra el avatar del portfolio", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce(dto);
    render(<PublicPortfolioPage slug="ana-perez" />);
    const img = await screen.findByAltText("Ana Pérez");
    expect(img).toHaveAttribute("src", "https://img.test/a.png");
  });

  it("oculta la ubicación si no viene en el DTO", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce({
      ...dto,
      profile: { ...dto.profile, location: null }
    });
    render(<PublicPortfolioPage slug="ana-perez" />);
    await screen.findByRole("heading", { name: "Ana Pérez" });
    expect(screen.queryByText(/Bilbao/)).not.toBeInTheDocument();
  });

  it("oculta la disponibilidad si no viene en el DTO", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce({
      ...dto,
      profile: { ...dto.profile, availabilityStatus: null, locationRemote: null }
    });
    render(<PublicPortfolioPage slug="ana-perez" />);
    await screen.findByRole("heading", { name: "Ana Pérez" });
    expect(screen.queryByText(/Disponible en remoto/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Abierto a oportunidades/)).not.toBeInTheDocument();
  });

  it("el botón imprimir llama a window.print", async () => {
    const printMock = vi.fn();
    vi.stubGlobal("print", printMock);
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce(dto);
    render(<PublicPortfolioPage slug="ana-perez" />);
    await screen.findByRole("heading", { name: "Ana Pérez" });

    fireEvent.click(screen.getByRole("button", { name: "Imprimir / Guardar PDF" }));
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("los enlaces externos son seguros (target=_blank + rel)", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce(dto);
    render(<PublicPortfolioPage slug="ana-perez" />);
    const link = await screen.findByRole("link", { name: "https://github.com/ana" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("muestra 'no disponible' si el API responde 404", async () => {
    vi.mocked(getPublicPortfolio).mockRejectedValueOnce(new ApiClientError(404, "NOT_FOUND", "not found"));
    render(<PublicPortfolioPage slug="missing" />);
    expect(await screen.findByText("Portfolio no disponible")).toBeInTheDocument();
  });

  it("no muestra AppShell privado ni datos privados", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce(dto);
    render(<PublicPortfolioPage slug="ana-perez" />);
    await screen.findByRole("heading", { name: "Ana Pérez" });

    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByText("Cerrar sesión")).not.toBeInTheDocument();
    expect(screen.queryByText(/salario|salary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/matches|saved jobs|guardadas/i)).not.toBeInTheDocument();
  });

  it("no expone QR, export PDF server-side, GitHub import, IA ni monetización", async () => {
    vi.mocked(getPublicPortfolio).mockResolvedValueOnce(dto);
    render(<PublicPortfolioPage slug="ana-perez" />);
    await screen.findByRole("heading", { name: "Ana Pérez" });

    expect(screen.queryByText(/\bQR\b|código qr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/export pdf|pdf server/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github sync|importar github/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/inteligencia artificial|pro plan|pricing/i)).not.toBeInTheDocument();
  });
});
