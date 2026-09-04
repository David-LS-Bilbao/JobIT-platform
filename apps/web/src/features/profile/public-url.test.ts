import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPublicPortfolioUrl, normalizePublicBaseUrl } from "./profile-api";

/**
 * Contrato de la URL pública del portfolio (`AUDIT03-URL-SCHEME-01`).
 *
 * ```text
 * development/test: fallback local permitido
 * deployed:         NEXT_PUBLIC_PUBLIC_BASE_URL obligatoria, absoluta y https
 * ```
 */

const PATH = "/u/ana-perez";

/** `vi.stubEnv` es la via soportada para tocar `NODE_ENV`; `afterEach` lo restaura. */
function withNodeEnv(value: "production" | "development", fn: () => void): void {
  vi.stubEnv("NODE_ENV", value);
  fn();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizePublicBaseUrl", () => {
  it("acepta https y recorta las barras finales", () => {
    expect(normalizePublicBaseUrl("https://jobit.example/", true)).toBe("https://jobit.example");
    expect(normalizePublicBaseUrl("  https://jobit.example//  ", true)).toBe("https://jobit.example");
  });

  it("acepta http SOLO fuera de un entorno desplegado", () => {
    expect(normalizePublicBaseUrl("http://localhost:3000", false)).toBe("http://localhost:3000");
    expect(normalizePublicBaseUrl("http://localhost:3000", true)).toBeNull();
  });

  it("rechaza valores vacíos o ausentes", () => {
    expect(normalizePublicBaseUrl(undefined, true)).toBeNull();
    expect(normalizePublicBaseUrl("", true)).toBeNull();
    expect(normalizePublicBaseUrl("   ", true)).toBeNull();
  });

  it("rechaza URLs no absolutas", () => {
    expect(normalizePublicBaseUrl("/u", true)).toBeNull();
    expect(normalizePublicBaseUrl("jobit.example", true)).toBeNull();
    expect(normalizePublicBaseUrl("//jobit.example", true)).toBeNull();
  });

  it("rechaza esquemas distintos de http(s)", () => {
    expect(normalizePublicBaseUrl("ftp://jobit.example", true)).toBeNull();
    expect(normalizePublicBaseUrl("javascript:alert(1)", true)).toBeNull();
    expect(normalizePublicBaseUrl("javascript:alert(1)", false)).toBeNull();
  });
});

describe("buildPublicPortfolioUrl", () => {
  it("usa la base configurada cuando es válida", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_BASE_URL", "https://jobit.example");
    withNodeEnv("production", () => {
      expect(buildPublicPortfolioUrl(PATH)).toBe(`https://jobit.example${PATH}`);
    });
  });

  // El fallback al origen del navegador es justo lo que permitia emitir un
  // enlace http a espaldas de la configuracion: en despliegue no existe.
  it("no ofrece enlace en un entorno desplegado sin configuración", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_BASE_URL", "");
    withNodeEnv("production", () => {
      expect(buildPublicPortfolioUrl(PATH)).toBeNull();
    });
  });

  it("no ofrece enlace en un entorno desplegado con base http", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_BASE_URL", "http://jobit.example");
    withNodeEnv("production", () => {
      expect(buildPublicPortfolioUrl(PATH)).toBeNull();
    });
  });

  it("no ofrece enlace en un entorno desplegado con base no absoluta", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_BASE_URL", "jobit.example");
    withNodeEnv("production", () => {
      expect(buildPublicPortfolioUrl(PATH)).toBeNull();
    });
  });

  it("en desarrollo cae al origen del navegador cuando no hay base", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_BASE_URL", "");
    withNodeEnv("development", () => {
      expect(buildPublicPortfolioUrl(PATH)).toBe(`${window.location.origin}${PATH}`);
    });
  });

  it("en desarrollo admite una base http explícita", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_BASE_URL", "http://localhost:3000");
    withNodeEnv("development", () => {
      expect(buildPublicPortfolioUrl(PATH)).toBe(`http://localhost:3000${PATH}`);
    });
  });
});
