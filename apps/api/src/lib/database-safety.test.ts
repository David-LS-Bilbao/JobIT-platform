import { describe, expect, it, vi } from "vitest";

import {
  assertRuntimeDataModeContract,
  assertSeedableDatabaseUrl,
  assertTestDatabaseUrl,
  classifyDatabaseName,
  formatStartupGuardFailure,
  parseDatabaseTarget,
  UnsafeDatabaseTargetError
} from "./database-safety.js";

/**
 * Fija el contrato de `docs/specs/features/database-seed-safety-gates.md`.
 * Todas las credenciales/hosts de este archivo son ficticios y no operativos.
 */

const FAKE_HOST = "invalid.local";
const FAKE_USER = "fake-user";
const FAKE_PASSWORD = "fake-password";

const fakeUrl = (databaseName: string, extra = ""): string =>
  `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/${databaseName}${extra}`;

/** Ejecuta `fn`, exige que lance `UnsafeDatabaseTargetError` y devuelve el error para inspección. */
function expectRejection(fn: () => unknown): UnsafeDatabaseTargetError {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(UnsafeDatabaseTargetError);
    return err as UnsafeDatabaseTargetError;
  }
  throw new Error("expected function to throw UnsafeDatabaseTargetError");
}

describe("classifyDatabaseName", () => {
  it.each([
    ["jobit_dev", "DEVELOPMENT"],
    ["jobit-development", "DEVELOPMENT"],
    ["jobit_test", "TEST"],
    ["jobit-e2e", "E2E"],
    ["jobit_stage", "STAGING"],
    ["jobit_staging", "STAGING"],
    ["jobit_prod", "PRODUCTION"],
    ["jobit_production", "PRODUCTION"],
    ["contest", "UNKNOWN"],
    ["latest", "UNKNOWN"],
    ["customer_data", "UNKNOWN"],
    ["jobit_test_prod", "AMBIGUOUS"]
  ])("classifies %s as %s", (name, expected) => {
    expect(classifyDatabaseName(name)).toBe(expected);
  });

  it("is case-insensitive", () => {
    expect(classifyDatabaseName("JOBIT_TEST")).toBe("TEST");
  });

  it("classifies an empty name as UNKNOWN", () => {
    expect(classifyDatabaseName("")).toBe("UNKNOWN");
  });

  it("does not treat repeated markers of the same category as ambiguous", () => {
    expect(classifyDatabaseName("dev_development")).toBe("DEVELOPMENT");
  });
});

describe("parseDatabaseTarget", () => {
  it("throws MISSING when the URL is undefined", () => {
    const err = expectRejection(() => parseDatabaseTarget(undefined, "DATABASE_URL_TEST"));
    expect(err.code).toBe("MISSING");
  });

  it("throws EMPTY when the URL is empty or whitespace-only", () => {
    const err = expectRejection(() => parseDatabaseTarget("   ", "DATABASE_URL_TEST"));
    expect(err.code).toBe("EMPTY");
  });

  it("throws MALFORMED_URL when the URL is malformed", () => {
    const err = expectRejection(() => parseDatabaseTarget("not-a-valid-url", "DATABASE_URL_TEST"));
    expect(err.code).toBe("MALFORMED_URL");
  });

  it("throws UNSUPPORTED_PROTOCOL when the protocol is not postgres/postgresql", () => {
    const raw = `mysql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:3306/jobit_test`;
    const err = expectRejection(() => parseDatabaseTarget(raw, "DATABASE_URL_TEST"));
    expect(err.code).toBe("UNSUPPORTED_PROTOCOL");
  });

  it("throws EMPTY_DATABASE_NAME when the database name segment is empty", () => {
    const raw = `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/`;
    const err = expectRejection(() => parseDatabaseTarget(raw, "DATABASE_URL_TEST"));
    expect(err.code).toBe("EMPTY_DATABASE_NAME");
  });

  it("accepts the postgres:// protocol alias", () => {
    const raw = `postgres://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/jobit_test`;
    expect(() => parseDatabaseTarget(raw, "DATABASE_URL_TEST")).not.toThrow();
  });

  it("returns host/port/databaseName/classification for a valid TEST url", () => {
    const raw = fakeUrl("jobit_test", "?schema=public");
    const result = parseDatabaseTarget(raw, "DATABASE_URL_TEST");
    expect(result.host).toBe(FAKE_HOST);
    expect(result.port).toBe("5432");
    expect(result.databaseName).toBe("jobit_test");
    expect(result.classification).toBe("TEST");
  });

  it("defaults the port to 5432 when the URL does not declare one", () => {
    const raw = `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}/jobit_test`;
    const result = parseDatabaseTarget(raw, "DATABASE_URL_TEST");
    expect(result.port).toBe("5432");
  });

  it("never includes the credentials or the full URL in a thrown error", () => {
    const raw = `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/`;
    const err = expectRejection(() => parseDatabaseTarget(raw, "DATABASE_URL_TEST"));
    expect(err.message).not.toContain(FAKE_USER);
    expect(err.message).not.toContain(FAKE_PASSWORD);
    expect(err.message).not.toContain(raw);
  });
});

describe("assertTestDatabaseUrl", () => {
  const TEST_URL = fakeUrl("jobit_test");
  const DEV_URL = fakeUrl("jobit_dev");
  const AMBIGUOUS_URL = fakeUrl("jobit_test_prod");
  const UNKNOWN_URL = fakeUrl("contest");

  it("throws when DATABASE_URL_TEST is missing", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({}));
    expect(err.code).toBe("MISSING");
  });

  it("throws when DATABASE_URL_TEST is empty", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: "  " }));
    expect(err.code).toBe("EMPTY");
  });

  it("throws UNSAFE_CLASSIFICATION when the classification is DEVELOPMENT instead of TEST", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: DEV_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  it("throws when the target is AMBIGUOUS", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: AMBIGUOUS_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  it("throws when the target is UNKNOWN", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: UNKNOWN_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  // Alias seguro: los workers de Vitest fijan DATABASE_URL = DATABASE_URL_TEST
  // a propósito (`apps/api/vitest.config.ts`). Coincidir es válido solo cuando
  // ambos destinos clasifican inequívocamente como TEST.
  describe("safe TEST alias (same target on both variables)", () => {
    it("accepts an identical TEST target on both variables", () => {
      const result = assertTestDatabaseUrl({
        DATABASE_URL_TEST: TEST_URL,
        DATABASE_URL: TEST_URL
      });
      expect(result.classification).toBe("TEST");
    });

    it("accepts the same TEST target with different credentials", () => {
      expect(() =>
        assertTestDatabaseUrl({
          DATABASE_URL_TEST: TEST_URL,
          DATABASE_URL: `postgresql://other-user:other-password@${FAKE_HOST}:5432/jobit_test`
        })
      ).not.toThrow();
    });

    it("accepts the same TEST target with different query strings", () => {
      expect(() =>
        assertTestDatabaseUrl({
          DATABASE_URL_TEST: fakeUrl("jobit_test", "?schema=public"),
          DATABASE_URL: fakeUrl("jobit_test", "?schema=public&connection_limit=1")
        })
      ).not.toThrow();
    });

    it("accepts the same TEST target across postgres:// and postgresql:// protocols", () => {
      expect(() =>
        assertTestDatabaseUrl({
          DATABASE_URL_TEST: `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/jobit_test`,
          DATABASE_URL: `postgres://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/jobit_test`
        })
      ).not.toThrow();
    });

    it("accepts the same TEST target when one omits the default port", () => {
      expect(() =>
        assertTestDatabaseUrl({
          DATABASE_URL_TEST: `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/jobit_test`,
          DATABASE_URL: `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}/jobit_test`
        })
      ).not.toThrow();
    });

    it("accepts the same TEST target with different host/name casing", () => {
      expect(() =>
        assertTestDatabaseUrl({
          DATABASE_URL_TEST: `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/jobit_test`,
          DATABASE_URL: `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST.toUpperCase()}:5432/JOBIT_TEST`
        })
      ).not.toThrow();
    });
  });

  describe("unsafe collisions", () => {
    it("rejects two identical DEVELOPMENT targets", () => {
      const err = expectRejection(() =>
        assertTestDatabaseUrl({ DATABASE_URL_TEST: DEV_URL, DATABASE_URL: DEV_URL })
      );
      expect(err.code).toBe("UNSAFE_CLASSIFICATION");
    });

    it("rejects two identical STAGING targets", () => {
      const staging = fakeUrl("jobit_staging");
      const err = expectRejection(() =>
        assertTestDatabaseUrl({ DATABASE_URL_TEST: staging, DATABASE_URL: staging })
      );
      expect(err.code).toBe("UNSAFE_CLASSIFICATION");
    });

    it("rejects two identical PRODUCTION targets", () => {
      const production = fakeUrl("jobit_production");
      const err = expectRejection(() =>
        assertTestDatabaseUrl({ DATABASE_URL_TEST: production, DATABASE_URL: production })
      );
      expect(err.code).toBe("UNSAFE_CLASSIFICATION");
    });

    it("rejects two identical AMBIGUOUS targets", () => {
      const err = expectRejection(() =>
        assertTestDatabaseUrl({ DATABASE_URL_TEST: AMBIGUOUS_URL, DATABASE_URL: AMBIGUOUS_URL })
      );
      expect(err.code).toBe("UNSAFE_CLASSIFICATION");
    });

    it("rejects two identical UNKNOWN targets", () => {
      const err = expectRejection(() =>
        assertTestDatabaseUrl({ DATABASE_URL_TEST: UNKNOWN_URL, DATABASE_URL: UNKNOWN_URL })
      );
      expect(err.code).toBe("UNSAFE_CLASSIFICATION");
    });
  });

  it("throws when DATABASE_URL is present but malformed, even if DATABASE_URL_TEST is valid", () => {
    const err = expectRejection(() =>
      assertTestDatabaseUrl({ DATABASE_URL_TEST: TEST_URL, DATABASE_URL: "not-a-valid-url" })
    );
    expect(err.code).toBe("MALFORMED_URL");
  });

  it("accepts a valid, unambiguous TEST target", () => {
    const result = assertTestDatabaseUrl({ DATABASE_URL_TEST: TEST_URL });
    expect(result.classification).toBe("TEST");
  });

  it("accepts a valid TEST target even when DATABASE_URL points elsewhere", () => {
    expect(() =>
      assertTestDatabaseUrl({ DATABASE_URL_TEST: TEST_URL, DATABASE_URL: DEV_URL })
    ).not.toThrow();
  });

  it("never leaks the username in a thrown error", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: DEV_URL }));
    expect(err.message).not.toContain(FAKE_USER);
  });

  it("never leaks the password in a thrown error", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: DEV_URL }));
    expect(err.message).not.toContain(FAKE_PASSWORD);
  });

  it("never leaks the full connection string in a thrown error", () => {
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: DEV_URL }));
    expect(err.message).not.toContain(DEV_URL);
  });

  it("never leaks query string parameters in a thrown error", () => {
    const withQuery = fakeUrl("jobit_dev", "?sslmode=require&secretParam=abc123");
    const err = expectRejection(() => assertTestDatabaseUrl({ DATABASE_URL_TEST: withQuery }));
    expect(err.message).not.toContain("secretParam");
    expect(err.message).not.toContain("abc123");
  });

  it("never calls an injected side effect before the guard succeeds (documents call order for Gate 23.3)", () => {
    const sideEffect = vi.fn();
    expect(() => {
      const target = assertTestDatabaseUrl({});
      sideEffect(target);
    }).toThrow(UnsafeDatabaseTargetError);
    expect(sideEffect).not.toHaveBeenCalled();
  });
});

describe("assertSeedableDatabaseUrl", () => {
  const DEV_URL = fakeUrl("jobit_dev");
  const E2E_URL = fakeUrl("jobit_e2e");
  const TEST_URL = fakeUrl("jobit_test");
  const STAGING_URL = fakeUrl("jobit_staging");
  const PRODUCTION_URL = fakeUrl("jobit_production");
  const UNKNOWN_URL = fakeUrl("customer_data");
  const AMBIGUOUS_URL = fakeUrl("jobit_test_prod");

  it("throws when DATABASE_URL is missing", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({}));
    expect(err.code).toBe("MISSING");
  });

  it("throws when DATABASE_URL is malformed", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: "not-a-url" }));
    expect(err.code).toBe("MALFORMED_URL");
  });

  it("allows a DEVELOPMENT target", () => {
    const result = assertSeedableDatabaseUrl({ DATABASE_URL: DEV_URL });
    expect(result.classification).toBe("DEVELOPMENT");
  });

  it("allows an E2E target", () => {
    const result = assertSeedableDatabaseUrl({ DATABASE_URL: E2E_URL });
    expect(result.classification).toBe("E2E");
  });

  it("allows an E2E target even without NODE_ENV defined (matches e2e.yml)", () => {
    expect(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: E2E_URL, NODE_ENV: undefined })
    ).not.toThrow();
  });

  it("blocks a TEST target", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: TEST_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  /**
   * ENMIENDA DE LA FASE C (spec `staging-technical-readiness.md` §8).
   *
   * Invariante anterior: `STAGING` se rechazaba SIEMPRE, con
   * `UNSAFE_CLASSIFICATION`, igual que `TEST`, `UNKNOWN` o `AMBIGUOUS`.
   *
   * Invariante nuevo: `STAGING` sigue rechazado por defecto —el seed NO se
   * permite— pero con el motivo preciso `DATA_MODE_REQUIRED`, porque ahora
   * existe exactamente una forma de habilitarlo: `JOBIT_DATA_MODE=SYNTHETIC_STAGING`.
   * El cambio es de MOTIVO, no de permisividad: sin la variable, el rechazo es
   * idéntico. La rama permitida está cubierta en el bloque
   * "contrato de staging sintético" al final de este archivo.
   */
  it("blocks a STAGING target without the synthetic data mode", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: STAGING_URL }));
    expect(err.code).toBe("DATA_MODE_REQUIRED");
  });

  it("blocks a PRODUCTION target", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: PRODUCTION_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  it("blocks an UNKNOWN target", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: UNKNOWN_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  it("blocks an AMBIGUOUS target", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: AMBIGUOUS_URL }));
    expect(err.code).toBe("UNSAFE_CLASSIFICATION");
  });

  it("blocks when NODE_ENV is production even with a DEVELOPMENT-looking name", () => {
    const err = expectRejection(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: DEV_URL, NODE_ENV: "production" })
    );
    expect(err.code).toBe("PRODUCTION_ENVIRONMENT");
  });

  it("blocks when NODE_ENV is a normalized variant of production (case/whitespace)", () => {
    const err = expectRejection(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: DEV_URL, NODE_ENV: "  Production  " })
    );
    expect(err.code).toBe("PRODUCTION_ENVIRONMENT");
  });

  it("never leaks credentials in a thrown error", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: PRODUCTION_URL }));
    expect(err.message).not.toContain(FAKE_USER);
    expect(err.message).not.toContain(FAKE_PASSWORD);
    expect(err.message).not.toContain(PRODUCTION_URL);
  });

  it("never calls an injected side effect before the guard succeeds (documents call order for Gate 23.4)", () => {
    const sideEffect = vi.fn();
    expect(() => {
      const target = assertSeedableDatabaseUrl({ DATABASE_URL: PRODUCTION_URL });
      sideEffect(target);
    }).toThrow(UnsafeDatabaseTargetError);
    expect(sideEffect).not.toHaveBeenCalled();
  });
});

/**
 * Fase C — contrato de modo de datos de staging sintetico.
 * Spec: `docs/specs/features/staging-technical-readiness.md` §7-§8.
 */

describe("assertSeedableDatabaseUrl — contrato de staging sintetico", () => {
  const DEV_URL = fakeUrl("jobit_dev");
  const E2E_URL = fakeUrl("jobit_e2e");
  const TEST_URL = fakeUrl("jobit_test");
  const STAGING_URL = fakeUrl("jobit_staging");
  const PRODUCTION_URL = fakeUrl("jobit_production");
  const UNKNOWN_URL = fakeUrl("customer_data");
  const AMBIGUOUS_URL = fakeUrl("jobit_test_prod");
  const SYNTHETIC = { JOBIT_DATA_MODE: "SYNTHETIC_STAGING" };

  // --- Regresion: sin la variable, nada cambia --------------------------------

  it("DEVELOPMENT sin modo sigue permitido", () => {
    expect(assertSeedableDatabaseUrl({ DATABASE_URL: DEV_URL }).classification).toBe(
      "DEVELOPMENT"
    );
  });

  it("E2E sin modo sigue permitido", () => {
    expect(assertSeedableDatabaseUrl({ DATABASE_URL: E2E_URL }).classification).toBe("E2E");
  });

  it("DEVELOPMENT con modo sintetico sigue permitido", () => {
    expect(
      assertSeedableDatabaseUrl({ DATABASE_URL: DEV_URL, ...SYNTHETIC }).classification
    ).toBe("DEVELOPMENT");
  });

  it("DEVELOPMENT con NODE_ENV=production sigue bloqueado aunque se declare el modo", () => {
    const err = expectRejection(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: DEV_URL, NODE_ENV: "production", ...SYNTHETIC })
    );
    expect(err.code).toBe("PRODUCTION_ENVIRONMENT");
  });

  it("TEST sigue rechazado con y sin modo", () => {
    expect(expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: TEST_URL })).code).toBe(
      "UNSAFE_CLASSIFICATION"
    );
    expect(
      expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: TEST_URL, ...SYNTHETIC }))
        .code
    ).toBe("UNSAFE_CLASSIFICATION");
  });

  // --- STAGING ---------------------------------------------------------------

  it("STAGING sin modo se rechaza con DATA_MODE_REQUIRED", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: STAGING_URL }));
    expect(err.code).toBe("DATA_MODE_REQUIRED");
  });

  it("STAGING con modo invalido se rechaza con INVALID_DATA_MODE", () => {
    const err = expectRejection(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: STAGING_URL, JOBIT_DATA_MODE: "SYNTHETIC" })
    );
    expect(err.code).toBe("INVALID_DATA_MODE");
  });

  it("STAGING con modo sintetico se permite", () => {
    expect(
      assertSeedableDatabaseUrl({ DATABASE_URL: STAGING_URL, ...SYNTHETIC }).classification
    ).toBe("STAGING");
  });

  // Staging corre con NODE_ENV=production: sin esta excepcion el modo sintetico
  // seria inalcanzable justo en el entorno para el que se diseno.
  it("STAGING con modo sintetico se permite tambien con NODE_ENV=production", () => {
    expect(
      assertSeedableDatabaseUrl({
        DATABASE_URL: STAGING_URL,
        NODE_ENV: "production",
        ...SYNTHETIC
      }).classification
    ).toBe("STAGING");
  });

  it("STAGING con NODE_ENV=production y sin modo sigue rechazado", () => {
    const err = expectRejection(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: STAGING_URL, NODE_ENV: "production" })
    );
    expect(err.code).toBe("DATA_MODE_REQUIRED");
  });

  // --- PRODUCTION: invariante absoluta ---------------------------------------

  it("PRODUCTION se rechaza sin modo", () => {
    expect(
      expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: PRODUCTION_URL })).code
    ).toBe("UNSAFE_CLASSIFICATION");
  });

  it("PRODUCTION se rechaza con modo sintetico y motivo explicito", () => {
    const err = expectRejection(() =>
      assertSeedableDatabaseUrl({ DATABASE_URL: PRODUCTION_URL, ...SYNTHETIC })
    );
    expect(err.code).toBe("PRODUCTION_MODE_CONFLICT");
  });

  it("PRODUCTION es inalcanzable bajo toda combinacion probada de NODE_ENV y modo", () => {
    const nodeEnvs = [undefined, "development", "test", "production"];
    const modes = [undefined, "SYNTHETIC_STAGING", "synthetic_staging", "", "NORMAL"];
    for (const nodeEnv of nodeEnvs) {
      for (const mode of modes) {
        const env: Record<string, string | undefined> = { DATABASE_URL: PRODUCTION_URL };
        if (nodeEnv !== undefined) env["NODE_ENV"] = nodeEnv;
        if (mode !== undefined) env["JOBIT_DATA_MODE"] = mode;
        expect(() => assertSeedableDatabaseUrl(env)).toThrow(UnsafeDatabaseTargetError);
      }
    }
  });

  // --- UNKNOWN / AMBIGUOUS ---------------------------------------------------

  it("UNKNOWN se rechaza con y sin modo", () => {
    expect(
      expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: UNKNOWN_URL })).code
    ).toBe("UNSAFE_CLASSIFICATION");
    expect(
      expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: UNKNOWN_URL, ...SYNTHETIC }))
        .code
    ).toBe("UNSAFE_CLASSIFICATION");
  });

  it("AMBIGUOUS se rechaza con y sin modo", () => {
    expect(
      expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: AMBIGUOUS_URL })).code
    ).toBe("UNSAFE_CLASSIFICATION");
    expect(
      expectRejection(() =>
        assertSeedableDatabaseUrl({ DATABASE_URL: AMBIGUOUS_URL, ...SYNTHETIC })
      ).code
    ).toBe("UNSAFE_CLASSIFICATION");
  });

  it("no filtra credenciales al rechazar un destino STAGING", () => {
    const err = expectRejection(() => assertSeedableDatabaseUrl({ DATABASE_URL: STAGING_URL }));
    expect(err.message).not.toContain(FAKE_USER);
    expect(err.message).not.toContain(FAKE_PASSWORD);
    expect(err.message).not.toContain(STAGING_URL);
  });
});

describe("assertRuntimeDataModeContract — guarda de arranque", () => {
  const DEV_URL = fakeUrl("jobit_dev");
  const TEST_URL = fakeUrl("jobit_test");
  const E2E_URL = fakeUrl("jobit_e2e");
  const STAGING_URL = fakeUrl("jobit_staging");
  const PRODUCTION_URL = fakeUrl("jobit_production");
  const UNKNOWN_URL = fakeUrl("customer_data");
  const AMBIGUOUS_URL = fakeUrl("jobit_test_prod");
  const SYNTHETIC = { JOBIT_DATA_MODE: "SYNTHETIC_STAGING" };

  it("DEVELOPMENT / TEST / E2E sin modo arrancan (regresion)", () => {
    for (const url of [DEV_URL, TEST_URL, E2E_URL]) {
      expect(() => assertRuntimeDataModeContract({ DATABASE_URL: url })).not.toThrow();
    }
  });

  it("DEVELOPMENT / TEST / E2E con modo sintetico arrancan", () => {
    for (const url of [DEV_URL, TEST_URL, E2E_URL]) {
      expect(() =>
        assertRuntimeDataModeContract({ DATABASE_URL: url, ...SYNTHETIC })
      ).not.toThrow();
    }
  });

  // Invariante dura de la fase C.
  it("STAGING sin modo ABORTA: nunca arranca en modo normal", () => {
    const err = expectRejection(() =>
      assertRuntimeDataModeContract({ DATABASE_URL: STAGING_URL })
    );
    expect(err.code).toBe("DATA_MODE_REQUIRED");
  });

  it("STAGING con modo invalido ABORTA", () => {
    const err = expectRejection(() =>
      assertRuntimeDataModeContract({ DATABASE_URL: STAGING_URL, JOBIT_DATA_MODE: "SI" })
    );
    expect(err.code).toBe("INVALID_DATA_MODE");
  });

  it("STAGING con modo sintetico arranca y devuelve el contrato resuelto", () => {
    const result = assertRuntimeDataModeContract({ DATABASE_URL: STAGING_URL, ...SYNTHETIC });
    expect(result).toEqual({ mode: "SYNTHETIC_STAGING", classification: "STAGING" });
  });

  it("PRODUCTION sin modo arranca (produccion futura normal)", () => {
    const result = assertRuntimeDataModeContract({ DATABASE_URL: PRODUCTION_URL });
    expect(result).toEqual({ mode: null, classification: "PRODUCTION" });
  });

  it("PRODUCTION con modo sintetico ABORTA", () => {
    const err = expectRejection(() =>
      assertRuntimeDataModeContract({ DATABASE_URL: PRODUCTION_URL, ...SYNTHETIC })
    );
    expect(err.code).toBe("PRODUCTION_MODE_CONFLICT");
  });

  it("UNKNOWN / AMBIGUOUS sin modo arrancan (compatibilidad)", () => {
    for (const url of [UNKNOWN_URL, AMBIGUOUS_URL]) {
      expect(() => assertRuntimeDataModeContract({ DATABASE_URL: url })).not.toThrow();
    }
  });

  it("UNKNOWN / AMBIGUOUS con modo sintetico ABORTAN", () => {
    for (const url of [UNKNOWN_URL, AMBIGUOUS_URL]) {
      const err = expectRejection(() =>
        assertRuntimeDataModeContract({ DATABASE_URL: url, ...SYNTHETIC })
      );
      expect(err.code).toBe("UNVERIFIABLE_TARGET_MODE_CONFLICT");
    }
  });

  it("DATABASE_URL ausente o malformada sin modo arranca (comportamiento actual intacto)", () => {
    expect(assertRuntimeDataModeContract({})).toEqual({ mode: null, classification: "UNRESOLVED" });
    expect(assertRuntimeDataModeContract({ DATABASE_URL: "not-a-url" })).toEqual({
      mode: null,
      classification: "UNRESOLVED"
    });
  });

  it("DATABASE_URL ausente o malformada CON modo declarado ABORTA", () => {
    expect(expectRejection(() => assertRuntimeDataModeContract({ ...SYNTHETIC })).code).toBe(
      "UNVERIFIABLE_TARGET_MODE_CONFLICT"
    );
    expect(
      expectRejection(() =>
        assertRuntimeDataModeContract({ DATABASE_URL: "not-a-url", ...SYNTHETIC })
      ).code
    ).toBe("UNVERIFIABLE_TARGET_MODE_CONFLICT");
  });

  it("no filtra credenciales al abortar", () => {
    const err = expectRejection(() =>
      assertRuntimeDataModeContract({ DATABASE_URL: STAGING_URL })
    );
    expect(err.message).not.toContain(FAKE_USER);
    expect(err.message).not.toContain(FAKE_PASSWORD);
    expect(err.message).not.toContain(STAGING_URL);
    expect(err.message).not.toContain(FAKE_HOST);
  });
});

describe("formatStartupGuardFailure — vocabulario cerrado", () => {
  it("emite el code sanitizado de la guarda", () => {
    const err = new UnsafeDatabaseTargetError("DATA_MODE_REQUIRED", "irrelevante");
    expect(formatStartupGuardFailure(err)).toBe(
      "[startup] ABORTED: UNSAFE_DATABASE_TARGET:DATA_MODE_REQUIRED"
    );
  });

  it("colapsa cualquier otro error sin reenviar su texto", () => {
    const leaky = new Error(`connection refused for ${fakeUrl("jobit_production")}`);
    const formatted = formatStartupGuardFailure(leaky);
    expect(formatted).toBe("[startup] ABORTED: STARTUP_GUARD_FAILED");
    expect(formatted).not.toContain(FAKE_PASSWORD);
    expect(formatted).not.toContain(FAKE_HOST);
  });
});
