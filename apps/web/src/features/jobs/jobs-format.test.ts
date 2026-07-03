import { describe, expect, it } from "vitest";

import { externalSourceCtaLabel, isSafeExternalUrl } from "./jobs-format";

describe("isSafeExternalUrl", () => {
  it("acepta http y https", () => {
    expect(isSafeExternalUrl("https://jooble.org/jobs/x")).toBe(true);
    expect(isSafeExternalUrl("http://example.com")).toBe(true);
    expect(isSafeExternalUrl("  https://con-espacios.example.com  ")).toBe(true);
  });

  it("rechaza protocolos peligrosos y URLs no válidas", () => {
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("data:text/html,<script>x</script>")).toBe(false);
    expect(isSafeExternalUrl("ftp://example.com")).toBe(false);
    expect(isSafeExternalUrl("no es una url")).toBe(false);
  });

  it("rechaza null / undefined / vacío", () => {
    expect(isSafeExternalUrl(null)).toBe(false);
    expect(isSafeExternalUrl(undefined)).toBe(false);
    expect(isSafeExternalUrl("")).toBe(false);
    expect(isSafeExternalUrl("   ")).toBe(false);
  });
});

describe("externalSourceCtaLabel", () => {
  it("Jooble usa copy específico", () => {
    expect(externalSourceCtaLabel("JOOBLE")).toBe("Abrir en Jooble");
  });

  it("INTERNAL y otras fuentes usan copy genérico", () => {
    expect(externalSourceCtaLabel("INTERNAL")).toBe("Ver oferta original");
  });
});
