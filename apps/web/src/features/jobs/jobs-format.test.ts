import { describe, expect, it } from "vitest";

import {
  JOB_SOURCE_LABELS,
  externalSourceCtaLabel,
  formatContractType,
  isSafeExternalUrl,
  jobMetadataLabel
} from "./jobs-format";

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

  it("Greenhouse usa copy específico", () => {
    expect(externalSourceCtaLabel("GREENHOUSE")).toBe("Abrir en Greenhouse");
  });

  it("INTERNAL y otras fuentes usan copy genérico", () => {
    expect(externalSourceCtaLabel("INTERNAL")).toBe("Ver oferta original");
  });
});

describe("formatContractType", () => {
  it("traduce UNSPECIFIED como 'Sin especificar' (JOBS-02: nada de 'Unspecified' en inglés)", () => {
    expect(formatContractType("UNSPECIFIED")).toBe("Sin especificar");
  });

  it("mantiene los contratos conocidos humanizados", () => {
    expect(formatContractType("FULL_TIME")).toBe("Jornada completa");
    expect(formatContractType("FREELANCE")).toBe("Freelance");
  });
});

/**
 * JOBS-02 — Línea compacta de metadatos de una oferta (cards y detalle).
 * Contrato: solo dimensiones con dato útil, separadas por " · ".
 * - remoteType UNSPECIFIED → se omite.
 * - contractType UNSPECIFIED → se omite (aunque formatContractType sepa traducirlo).
 * - seniority ANY → se mantiene visible como "Cualquier nivel" (no es dato desconocido).
 * - sin separadores iniciales, finales ni duplicados; sin "Unspecified" en inglés.
 */
describe("jobMetadataLabel (JOBS-02)", () => {
  const base = {
    location: "Madrid",
    remoteType: "REMOTE",
    seniority: "MID",
    contractType: "FULL_TIME"
  } as const;

  it("conserva todas las dimensiones conocidas separadas por ' · '", () => {
    expect(jobMetadataLabel(base)).toBe("Madrid · Remoto · Mid · Jornada completa");
  });

  it("omite la modalidad UNSPECIFIED", () => {
    expect(jobMetadataLabel({ ...base, remoteType: "UNSPECIFIED" })).toBe(
      "Madrid · Mid · Jornada completa"
    );
  });

  it("omite el contrato UNSPECIFIED", () => {
    expect(jobMetadataLabel({ ...base, contractType: "UNSPECIFIED" })).toBe("Madrid · Remoto · Mid");
  });

  it("mantiene seniority ANY visible como 'Cualquier nivel'", () => {
    expect(jobMetadataLabel({ ...base, seniority: "ANY" })).toBe(
      "Madrid · Remoto · Cualquier nivel · Jornada completa"
    );
  });

  it("con remote y contrato desconocidos y seniority ANY muestra únicamente 'Cualquier nivel'", () => {
    expect(
      jobMetadataLabel({
        location: null,
        remoteType: "UNSPECIFIED",
        seniority: "ANY",
        contractType: "UNSPECIFIED"
      })
    ).toBe("Cualquier nivel");
  });

  it("no genera separadores sobrantes ni texto 'Unspecified'", () => {
    const label = jobMetadataLabel({
      location: "Madrid",
      remoteType: "UNSPECIFIED",
      seniority: "ANY",
      contractType: "UNSPECIFIED"
    });
    expect(label).toBe("Madrid · Cualquier nivel");
    expect(label).not.toMatch(/Unspecified/);
    expect(label).not.toMatch(/^\s*·/);
    expect(label).not.toMatch(/·\s*$/);
    expect(label).not.toMatch(/·\s*·/);
  });
});

describe("JOB_SOURCE_LABELS", () => {
  it("etiqueta todas las fuentes del contrato (sin 'undefined' en la UI)", () => {
    expect(JOB_SOURCE_LABELS.INTERNAL).toBe("JobIT");
    expect(JOB_SOURCE_LABELS.JOOBLE).toBe("Jooble");
    // Sprint 17B: GREENHOUSE existe en la DB desde 16F.2; sin etiqueta la card
    // mostraba "Fuente: undefined".
    expect(JOB_SOURCE_LABELS.GREENHOUSE).toBe("Greenhouse");
  });
});
