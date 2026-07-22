import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "./brand-mark";

/**
 * Caracterización de accesibilidad del logo (VIS-01 / §8, Sprint 21D). El símbolo
 * "J" es decorativo: el nombre accesible "JobIT" lo aporta el texto/enlace vecino,
 * por lo que BrandMark no debe introducir un nombre accesible propio ni recibir foco.
 */
describe("BrandMark · caracterización a11y (Sprint 21D.5)", () => {
  it("es decorativo (aria-hidden) y no recibe foco", () => {
    const { container } = render(<BrandMark />);
    const mark = container.firstElementChild as HTMLElement;
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute("aria-hidden", "true");
    // No es focusable: sin tabindex ni elemento interactivo nativo.
    expect(mark).not.toHaveAttribute("tabindex");
    expect(mark.tagName).toBe("SPAN");
  });

  it("mantiene el gradiente canónico jobit-brand→jobit-green y no aporta nombre accesible", () => {
    const { container } = render(<BrandMark />);
    const mark = container.firstElementChild as HTMLElement;
    expect(mark).toHaveClass("from-jobit-brand", "to-jobit-green");
    expect(mark.className).not.toContain("from-sky-400");
    // aria-hidden lo excluye del árbol accesible: no crea un nombre duplicado.
    expect(mark).toHaveAttribute("aria-hidden", "true");
  });
});
