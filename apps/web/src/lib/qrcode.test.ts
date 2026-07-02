import { describe, expect, it } from "vitest";

import { formatInfoBits, gfMul, qrMatrix, rsEncode } from "./qrcode";

describe("qrcode — aritmética GF/RS/formato", () => {
  it("gfMul cumple sus propiedades y un valor conocido", () => {
    expect(gfMul(0, 123)).toBe(0);
    expect(gfMul(1, 123)).toBe(123);
    expect(gfMul(2, 128)).toBe(29); // 256 ^ 0x11d
    expect(gfMul(3, 7)).toBe(gfMul(7, 3)); // conmutativo
  });

  it("rsEncode devuelve ecLen codewords de forma determinista", () => {
    const a = rsEncode([65, 86, 135], 10);
    const b = rsEncode([65, 86, 135], 10);
    expect(a).toHaveLength(10);
    expect(a).toEqual(b);
  });

  it("formatInfoBits(0) === 0x5412 (ISO 18004, nivel M / máscara 0)", () => {
    expect(formatInfoBits(0)).toBe(0x5412);
  });
});

describe("qrMatrix", () => {
  it("produce una matriz cuadrada de tamaño 17+4v con módulos boolean", () => {
    const m = qrMatrix("https://jobit.example.com/u/ana-perez");
    const n = m.length;
    expect((n - 17) % 4).toBe(0);
    expect(m.every((row) => row.length === n)).toBe(true);
    expect(m.every((row) => row.every((v) => typeof v === "boolean"))).toBe(true);
  });

  it("coloca los patrones localizadores (finder) en las tres esquinas", () => {
    const m = qrMatrix("https://jobit.app/u/x");
    const n = m.length;
    for (const [r, c] of [
      [0, 0],
      [0, n - 7],
      [n - 7, 0]
    ]) {
      expect(m[r as number]![c as number]).toBe(true); // esquina exterior oscura
      expect(m[(r as number) + 1]![(c as number) + 1]).toBe(false); // separador claro
    }
  });

  it("es determinista para el mismo contenido", () => {
    const url = "https://jobit.example.com/u/david-lopez-sotelo";
    expect(qrMatrix(url)).toEqual(qrMatrix(url));
  });

  it("lanza si el contenido excede la capacidad (versión 6, nivel M)", () => {
    expect(() => qrMatrix("x".repeat(200))).toThrow();
  });
});
