import { describe, expect, it } from "vitest";

import { humanizeMatchExplanation } from "./match-format";

/**
 * JOBS-03 — La `explanation` del backend puede llegar con el enum crudo del
 * nivel (p. ej. "Afinidad VERY_LOW con una puntuación de 0/100."). El frontend
 * la humaniza sustituyendo cada token COMPLETO por su etiqueta legible:
 * VERY_LOW → Muy baja · LOW → Baja · GOOD → Buena · VERY_GOOD → Muy buena.
 * Sin sustituciones parciales (nada de "VERY_Baja" ni "VERY_Buena") y sin
 * tocar la API ni el DTO.
 */
describe("humanizeMatchExplanation (JOBS-03)", () => {
  it("sustituye VERY_LOW por 'Muy baja' en la frase real del backend", () => {
    expect(humanizeMatchExplanation("Afinidad VERY_LOW con una puntuación de 0/100.")).toBe(
      "Afinidad Muy baja con una puntuación de 0/100."
    );
  });

  it("sustituye LOW por 'Baja'", () => {
    expect(humanizeMatchExplanation("Afinidad LOW con una puntuación de 40/100.")).toBe(
      "Afinidad Baja con una puntuación de 40/100."
    );
  });

  it("sustituye GOOD por 'Buena'", () => {
    expect(humanizeMatchExplanation("Afinidad GOOD con una puntuación de 72/100.")).toBe(
      "Afinidad Buena con una puntuación de 72/100."
    );
  });

  it("sustituye VERY_GOOD por 'Muy buena'", () => {
    expect(humanizeMatchExplanation("Afinidad VERY_GOOD con una puntuación de 81/100.")).toBe(
      "Afinidad Muy buena con una puntuación de 81/100."
    );
  });

  it("VERY_LOW nunca degenera en 'VERY_Baja' (el token compuesto gana al simple)", () => {
    expect(humanizeMatchExplanation("VERY_LOW")).toBe("Muy baja");
    expect(humanizeMatchExplanation("VERY_GOOD")).toBe("Muy buena");
  });

  it("no hace sustituciones parciales dentro de otras palabras", () => {
    expect(humanizeMatchExplanation("VERY_LOWER GOODNESS LOWER VERY_GOODS")).toBe(
      "VERY_LOWER GOODNESS LOWER VERY_GOODS"
    );
  });

  it("sustituye el token pegado a puntuación (final de frase)", () => {
    expect(humanizeMatchExplanation("Nivel: GOOD.")).toBe("Nivel: Buena.");
  });

  it("deja intacto un texto sin enums", () => {
    const texto = "Completa tu perfil (skills y preferencias) para mejorar la precisión del match.";
    expect(humanizeMatchExplanation(texto)).toBe(texto);
  });

  it("tolera la cadena vacía (el tipo del DTO es string)", () => {
    expect(humanizeMatchExplanation("")).toBe("");
  });

  it("no deja ningún token crudo tras humanizar una frase con guía adicional", () => {
    const salida = humanizeMatchExplanation(
      "Afinidad VERY_LOW con una puntuación de 0/100. Completa tu perfil (skills y preferencias) para mejorar la precisión del match."
    );
    expect(salida).not.toMatch(/\b(VERY_LOW|VERY_GOOD|LOW|GOOD)\b/);
    expect(salida).toContain("Afinidad Muy baja");
  });
});
