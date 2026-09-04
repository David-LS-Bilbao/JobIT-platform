import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SYNTHETIC_ENVIRONMENT_NOTICE,
  SyntheticEnvironmentBanner
} from "./synthetic-environment-banner";

/**
 * Marcador global de entorno sintetico (Fase C — bloque 1).
 * Spec: `docs/specs/features/staging-technical-readiness.md` §11.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("SyntheticEnvironmentBanner", () => {
  it("se muestra con NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING", () => {
    vi.stubEnv("NEXT_PUBLIC_JOBIT_DATA_MODE", "SYNTHETIC_STAGING");
    render(<SyntheticEnvironmentBanner />);

    expect(screen.getByText(SYNTHETIC_ENVIRONMENT_NOTICE)).toBeInTheDocument();
  });

  it("el texto advierte de forma inequivoca que no se introduzcan datos reales", () => {
    vi.stubEnv("NEXT_PUBLIC_JOBIT_DATA_MODE", "SYNTHETIC_STAGING");
    render(<SyntheticEnvironmentBanner />);

    const banner = screen.getByText(SYNTHETIC_ENVIRONMENT_NOTICE);
    expect(banner.textContent).toMatch(/staging sint/i);
    expect(banner.textContent).toMatch(/no introducir datos reales/i);
  });

  it("no se muestra cuando la variable esta ausente (modo normal/local)", () => {
    vi.stubEnv("NEXT_PUBLIC_JOBIT_DATA_MODE", "");
    const { container } = render(<SyntheticEnvironmentBanner />);

    expect(screen.queryByText(SYNTHETIC_ENVIRONMENT_NOTICE)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("no se muestra con un valor distinto: la comparacion es exacta", () => {
    for (const value of ["synthetic_staging", "STAGING", "SYNTHETIC", "true"]) {
      vi.stubEnv("NEXT_PUBLIC_JOBIT_DATA_MODE", value);
      const { container, unmount } = render(<SyntheticEnvironmentBanner />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  // No debe tapar navegacion ni acciones: va en el flujo, no fijo ni absoluto.
  it("se renderiza en el flujo del documento, sin posicionamiento superpuesto", () => {
    vi.stubEnv("NEXT_PUBLIC_JOBIT_DATA_MODE", "SYNTHETIC_STAGING");
    render(<SyntheticEnvironmentBanner />);

    const banner = screen.getByText(SYNTHETIC_ENVIRONMENT_NOTICE);
    const className = banner.getAttribute("class") ?? "";
    expect(className).not.toMatch(/\bfixed\b/);
    expect(className).not.toMatch(/\babsolute\b/);
    expect(className).not.toMatch(/\bsticky\b/);
  });

  it("el texto es contenido real y accesible, no un atributo decorativo", () => {
    vi.stubEnv("NEXT_PUBLIC_JOBIT_DATA_MODE", "SYNTHETIC_STAGING");
    render(<SyntheticEnvironmentBanner />);

    const banner = screen.getByText(SYNTHETIC_ENVIRONMENT_NOTICE);
    expect(banner).toBeVisible();
    expect(banner).not.toHaveAttribute("aria-hidden");
  });
});
