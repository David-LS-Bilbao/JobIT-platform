import { describe, expect, it } from "vitest";

import { DEFAULT_JOOBLE_API_BASE_URL, parseJoobleBaseUrl } from "./env.js";

describe("parseJoobleBaseUrl", () => {
  it("usa el default global cuando falta o está vacío", () => {
    expect(DEFAULT_JOOBLE_API_BASE_URL).toBe("https://jooble.org/api");
    expect(parseJoobleBaseUrl(undefined)).toBe(DEFAULT_JOOBLE_API_BASE_URL);
    expect(parseJoobleBaseUrl("")).toBe(DEFAULT_JOOBLE_API_BASE_URL);
    expect(parseJoobleBaseUrl("   ")).toBe(DEFAULT_JOOBLE_API_BASE_URL);
  });

  it("acepta un host regional https y normaliza la barra final", () => {
    expect(parseJoobleBaseUrl("https://es.jooble.org/api")).toBe("https://es.jooble.org/api");
    expect(parseJoobleBaseUrl("  https://es.jooble.org/api/  ")).toBe("https://es.jooble.org/api");
  });

  it("acepta http (p. ej. mock local)", () => {
    expect(parseJoobleBaseUrl("http://localhost:8080/api")).toBe("http://localhost:8080/api");
  });

  it("rechaza protocolos que no son http/https", () => {
    expect(() => parseJoobleBaseUrl("ftp://jooble.org/api")).toThrow(/http/i);
  });

  it("rechaza una URL inválida", () => {
    expect(() => parseJoobleBaseUrl("no es una url")).toThrow(/valid/i);
  });
});
