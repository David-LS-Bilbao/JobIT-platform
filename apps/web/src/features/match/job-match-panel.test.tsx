import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getJobMatch } from "@/features/match/match-api";
import type { JobMatchDto, MatchFactorDto } from "@/types/api";

import { JobMatchPanel } from "./job-match-panel";

// Colocación: el componente vive en features/match/, así que su test se coloca aquí
// (patrón del repo y mini-spec §10). Se caracteriza JOBS-05 sin tocar producción.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/match/match-api", () => ({ getJobMatch: vi.fn() }));

const baseFactors: MatchFactorDto[] = [
  { name: "skills", match: true, detail: "2 de 3 skills coinciden" },
  { name: "remote", match: true, detail: "Modalidad compatible" },
  { name: "seniority", match: false, detail: "Seniority no coincide" },
  { name: "location", match: null, detail: "Sin datos de ubicación" }
];

function makeMatch(overrides: Partial<JobMatchDto> = {}): JobMatchDto {
  return {
    jobId: "j1",
    score: overrides.score ?? 50,
    level: overrides.level ?? "LOW",
    matchedSkills: overrides.matchedSkills ?? [],
    missingSkills: overrides.missingSkills ?? [],
    factors: overrides.factors ?? baseFactors,
    // Neutral a propósito: el estado NO debe decidirse a partir de explanation.
    explanation: overrides.explanation ?? "Puntuación básica."
  };
}

async function renderPanelSection(): Promise<HTMLElement> {
  render(<JobMatchPanel jobId="j1" token="tok-x" />);
  const heading = await screen.findByText("Match con tu perfil");
  return heading.closest("section") as HTMLElement;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("JobMatchPanel · JOBS-05", () => {
  it("caso A: con skills coincidentes muestra 'Skills que coinciden' y no el copy de oferta sin skills", async () => {
    vi.mocked(getJobMatch).mockResolvedValue(
      makeMatch({ matchedSkills: ["react", "typescript"], missingSkills: ["aws"] })
    );
    const section = await renderPanelSection();
    expect(within(section).getByText("Skills que coinciden")).toBeInTheDocument();
    expect(within(section).getByText("react")).toBeInTheDocument();
    expect(
      within(section).queryByText("La oferta no especifica skills; este factor no puede evaluarse.")
    ).not.toBeInTheDocument();
  });

  it("caso B: con missingSkills muestra 'Skills que podrías sumar' sin afirmar perfil vacío ni copy de oferta", async () => {
    vi.mocked(getJobMatch).mockResolvedValue(
      makeMatch({ matchedSkills: [], missingSkills: ["aws", "docker"] })
    );
    const section = await renderPanelSection();
    expect(within(section).getByText("Skills que podrías sumar")).toBeInTheDocument();
    expect(within(section).getByText("aws")).toBeInTheDocument();
    // No se afirma que el perfil esté vacío ni se muestra el copy de oferta-sin-skills.
    expect(within(section).queryByText(/no has añadido skills a tu perfil/i)).not.toBeInTheDocument();
    expect(
      within(section).queryByText("La oferta no especifica skills; este factor no puede evaluarse.")
    ).not.toBeInTheDocument();
  });

  it("caso C (RED): oferta sin señal de skills usa copy de oferta y no pide completar el perfil", async () => {
    vi.mocked(getJobMatch).mockResolvedValue(
      makeMatch({
        matchedSkills: [],
        missingSkills: [],
        factors: [
          { name: "skills", match: null, detail: "Sin datos de skills" },
          { name: "remote", match: true, detail: "Modalidad compatible" }
        ]
      })
    );
    const section = await renderPanelSection();
    // Contrato JOBS-05 caso C: copy centrado en la oferta.
    expect(
      await within(section).findByText(
        "La oferta no especifica skills; este factor no puede evaluarse.",
        undefined,
        { timeout: 2000 }
      )
    ).toBeInTheDocument();
    // No debe pedir completar/añadir skills al perfil (copy actual que se reemplaza).
    expect(within(section).queryByText(/Añade skills y preferencias a tu perfil/i)).not.toBeInTheDocument();
  });
});

const MATCH04_COPY = "La afinidad es orientativa: no es una nota ni garantiza avanzar en el proceso.";

describe("JobMatchPanel · claridad de la afinidad (MATCH-04, Sprint 21E.6 RED)", () => {
  it("muestra la explicación de afinidad junto al score/nivel, conservando ambos (RED)", async () => {
    vi.mocked(getJobMatch).mockResolvedValue(
      makeMatch({ score: 72, level: "GOOD", matchedSkills: ["react"], missingSkills: ["aws"] })
    );
    const section = await renderPanelSection();
    // No regresión: score y nivel de afinidad visibles.
    expect(within(section).getByText("72/100")).toBeInTheDocument();
    expect(within(section).getByText(/Afinidad/)).toBeInTheDocument();
    // RED: la explicación de afinidad (hoy ausente).
    expect(within(section).queryByText(MATCH04_COPY)).toBeInTheDocument();
  });
});
