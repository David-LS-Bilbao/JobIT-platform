import { describe, expect, it } from "vitest";

import {
  extractEmailDomain,
  InvalidDataModeError,
  isSyntheticStagingEmail,
  isSyntheticStagingMode,
  JOBIT_DATA_MODE_VALUES,
  parseDataMode,
  SYNTHETIC_STAGING,
  SYNTHETIC_STAGING_EMAIL_DOMAIN
} from "./synthetic-mode.js";

describe("parseDataMode — vocabulario cerrado y fail-fast", () => {
  it("devuelve null cuando la variable esta ausente (modo NORMAL)", () => {
    expect(parseDataMode({})).toBeNull();
  });

  it("trata el valor vacio como ausente", () => {
    expect(parseDataMode({ JOBIT_DATA_MODE: "" })).toBeNull();
  });

  it("trata un valor de solo espacios como ausente", () => {
    expect(parseDataMode({ JOBIT_DATA_MODE: "   " })).toBeNull();
  });

  it("resuelve el unico valor del vocabulario", () => {
    expect(parseDataMode({ JOBIT_DATA_MODE: "SYNTHETIC_STAGING" })).toBe(SYNTHETIC_STAGING);
  });

  it("tolera espacios alrededor del valor valido", () => {
    expect(parseDataMode({ JOBIT_DATA_MODE: "  SYNTHETIC_STAGING  " })).toBe(SYNTHETIC_STAGING);
  });

  it("rechaza un valor desconocido", () => {
    expect(() => parseDataMode({ JOBIT_DATA_MODE: "STAGING" })).toThrow(InvalidDataModeError);
  });

  // La comparacion es exacta a proposito: aceptar variantes de caja haria que el
  // contrato dependiera de como se escribio la variable.
  it("rechaza el mismo valor en otra caja", () => {
    expect(() => parseDataMode({ JOBIT_DATA_MODE: "synthetic_staging" })).toThrow(
      InvalidDataModeError
    );
  });

  it("rechaza un valor cercano pero distinto", () => {
    expect(() => parseDataMode({ JOBIT_DATA_MODE: "SYNTHETIC_STAGING_X" })).toThrow(
      InvalidDataModeError
    );
  });

  it("expone un code estable y no reproduce el valor recibido", () => {
    try {
      parseDataMode({ JOBIT_DATA_MODE: "un-valor-cualquiera-del-entorno" });
      expect.unreachable("parseDataMode deberia haber lanzado");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDataModeError);
      expect((error as InvalidDataModeError).code).toBe("INVALID_DATA_MODE");
      expect((error as InvalidDataModeError).message).not.toContain(
        "un-valor-cualquiera-del-entorno"
      );
    }
  });

  it("es puro: no muta el entorno recibido", () => {
    const env = { JOBIT_DATA_MODE: "SYNTHETIC_STAGING", DATABASE_URL: "postgresql://x@h:5432/d" };
    const snapshot = { ...env };
    parseDataMode(env);
    expect(env).toEqual(snapshot);
  });

  it("el vocabulario publicado tiene exactamente un valor hoy", () => {
    expect([...JOBIT_DATA_MODE_VALUES]).toEqual(["SYNTHETIC_STAGING"]);
  });
});

describe("isSyntheticStagingMode", () => {
  it("es true solo con el valor exacto", () => {
    expect(isSyntheticStagingMode({ JOBIT_DATA_MODE: "SYNTHETIC_STAGING" })).toBe(true);
  });

  it("es false cuando la variable esta ausente", () => {
    expect(isSyntheticStagingMode({})).toBe(false);
  });

  it("propaga el fallo de un valor invalido en lugar de degradar a false", () => {
    expect(() => isSyntheticStagingMode({ JOBIT_DATA_MODE: "nope" })).toThrow(
      InvalidDataModeError
    );
  });
});

describe("extractEmailDomain", () => {
  it("devuelve el dominio en minusculas", () => {
    expect(extractEmailDomain("Candidate@Synthetic.JobIT.Invalid")).toBe(
      "synthetic.jobit.invalid"
    );
  });

  it("usa la ultima arroba como separador", () => {
    expect(extractEmailDomain('"raro@interno"@synthetic.jobit.invalid')).toBe(
      "synthetic.jobit.invalid"
    );
  });

  it("devuelve null sin parte local", () => {
    expect(extractEmailDomain("@synthetic.jobit.invalid")).toBeNull();
  });

  it("devuelve null sin dominio", () => {
    expect(extractEmailDomain("candidate@")).toBeNull();
  });

  it("devuelve null sin arroba", () => {
    expect(extractEmailDomain("candidate")).toBeNull();
  });
});

describe("isSyntheticStagingEmail — igualdad exacta de dominio", () => {
  it("acepta el dominio reservado", () => {
    expect(isSyntheticStagingEmail("candidate@synthetic.jobit.invalid")).toBe(true);
  });

  it("acepta subdireccionamiento con + en la parte local", () => {
    expect(isSyntheticStagingEmail("e2e+abc123@synthetic.jobit.invalid")).toBe(true);
  });

  it("acepta el dominio reservado en mayusculas", () => {
    expect(isSyntheticStagingEmail("candidate@SYNTHETIC.JOBIT.INVALID")).toBe(true);
  });

  it("rechaza un dominio ordinario", () => {
    expect(isSyntheticStagingEmail("candidate@gmail.com")).toBe(false);
  });

  it("rechaza el dominio del propio producto", () => {
    expect(isSyntheticStagingEmail("candidate@jobit.com")).toBe(false);
  });

  // Estos dos casos son los que `endsWith` dejaria pasar.
  it("rechaza un subdominio del dominio reservado", () => {
    expect(isSyntheticStagingEmail("candidate@sub.synthetic.jobit.invalid")).toBe(false);
  });

  it("rechaza un dominio que solo contiene el reservado como prefijo", () => {
    expect(isSyntheticStagingEmail("candidate@synthetic.jobit.invalid.example.com")).toBe(false);
  });

  it("rechaza un dominio con punto final", () => {
    expect(isSyntheticStagingEmail("candidate@synthetic.jobit.invalid.")).toBe(false);
  });

  it("el dominio publicado es el reservado por RFC 2606", () => {
    expect(SYNTHETIC_STAGING_EMAIL_DOMAIN).toBe("synthetic.jobit.invalid");
    expect(SYNTHETIC_STAGING_EMAIL_DOMAIN.endsWith(".invalid")).toBe(true);
  });
});
