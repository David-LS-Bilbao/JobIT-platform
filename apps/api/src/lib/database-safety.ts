/**
 * Guardas de seguridad de base de datos (Sprint 23 — TEST-01 / DATA-04).
 *
 * Utilidad pura: no importa Prisma, dotenv, `child_process` ni ningún módulo de
 * aplicación que cree clientes o conexiones. No lee `process.env` directamente —
 * toda entrada llega por parámetro (`EnvLike`). No hace logging ni efectos
 * secundarios de ningún tipo.
 *
 * Única dependencia interna: `config/synthetic-mode.ts`, que también es puro y no
 * importa nada del proyecto. La dirección es siempre esta y nunca la inversa, de
 * modo que no hay ciclo.
 *
 * Ver `docs/specs/features/database-seed-safety-gates.md` para el contrato completo
 * y `docs/specs/features/staging-technical-readiness.md` §7-§8 para la extensión de
 * staging sintético.
 */

import {
  InvalidDataModeError,
  parseDataMode,
  SYNTHETIC_STAGING,
  type JobitDataMode
} from "../config/synthetic-mode.js";

export type DatabaseClassification =
  | "DEVELOPMENT"
  | "TEST"
  | "E2E"
  | "STAGING"
  | "PRODUCTION"
  | "UNKNOWN"
  | "AMBIGUOUS";

export interface ParsedDatabaseTarget {
  host: string;
  port: string;
  databaseName: string;
  classification: DatabaseClassification;
}

export type EnvLike = Record<string, string | undefined>;

export type UnsafeDatabaseTargetReasonCode =
  | "MISSING"
  | "EMPTY"
  | "MALFORMED_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "EMPTY_DATABASE_NAME"
  | "UNSAFE_CLASSIFICATION"
  | "TARGET_COLLISION"
  | "PRODUCTION_ENVIRONMENT"
  // --- Contrato de modo de datos (Fase C) ---
  /** `JOBIT_DATA_MODE` fuera del vocabulario cerrado. */
  | "INVALID_DATA_MODE"
  /** Destino `STAGING` sin `JOBIT_DATA_MODE=SYNTHETIC_STAGING`. */
  | "DATA_MODE_REQUIRED"
  /** Destino `PRODUCTION` con modo sintético declarado. */
  | "PRODUCTION_MODE_CONFLICT"
  /** Modo declarado sobre un destino cuya clasificación no puede verificarse. */
  | "UNVERIFIABLE_TARGET_MODE_CONFLICT";

/**
 * Error sanitizado: `message` es apto para logs/consola (nunca incluye URL
 * completa, usuario, contraseña ni query string). `code` es el mecanismo
 * estable para distinguir la causa del rechazo sin depender del texto.
 */
export class UnsafeDatabaseTargetError extends Error {
  public readonly code: UnsafeDatabaseTargetReasonCode;

  constructor(code: UnsafeDatabaseTargetReasonCode, message: string) {
    super(message);
    this.name = "UnsafeDatabaseTargetError";
    this.code = code;
  }
}

const ALLOWED_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const DEFAULT_PORT = "5432";

const CLASSIFICATION_RULES: ReadonlyArray<readonly [DatabaseClassification, readonly string[]]> = [
  ["DEVELOPMENT", ["dev", "development"]],
  ["TEST", ["test"]],
  ["E2E", ["e2e"]],
  ["STAGING", ["stage", "staging"]],
  ["PRODUCTION", ["prod", "production"]]
];

/** Clasifica un nombre de base ya extraído de la URL (ver spec §5). */
export function classifyDatabaseName(databaseName: string): DatabaseClassification {
  const tokens = databaseName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);

  const matched = new Set<DatabaseClassification>();
  for (const [category, markers] of CLASSIFICATION_RULES) {
    if (tokens.some((token) => markers.includes(token))) {
      matched.add(category);
    }
  }

  if (matched.size === 0) {
    return "UNKNOWN";
  }
  if (matched.size > 1) {
    return "AMBIGUOUS";
  }
  const [only] = matched;
  return only ?? "UNKNOWN";
}

function requireNonEmpty(rawUrl: string | undefined, variableName: string): string {
  if (rawUrl === undefined) {
    throw new UnsafeDatabaseTargetError("MISSING", `${variableName} is required and was not provided.`);
  }
  if (rawUrl.trim().length === 0) {
    throw new UnsafeDatabaseTargetError("EMPTY", `${variableName} is required and must not be empty.`);
  }
  return rawUrl;
}

/** Parsea y valida estructuralmente una URL de conexión (ver spec §6/§7). */
export function parseDatabaseTarget(
  rawUrl: string | undefined,
  variableName: string
): ParsedDatabaseTarget {
  const value = requireNonEmpty(rawUrl, variableName);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new UnsafeDatabaseTargetError(
      "MALFORMED_URL",
      `${variableName} must be a valid connection URL.`
    );
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new UnsafeDatabaseTargetError(
      "UNSUPPORTED_PROTOCOL",
      `${variableName} must use the postgres:// or postgresql:// protocol.`
    );
  }

  const databaseName = parsed.pathname.replace(/^\//, "");
  if (databaseName.length === 0) {
    throw new UnsafeDatabaseTargetError(
      "EMPTY_DATABASE_NAME",
      `${variableName} must include a database name.`
    );
  }

  return {
    host: parsed.hostname,
    port: parsed.port || DEFAULT_PORT,
    databaseName,
    classification: classifyDatabaseName(databaseName)
  };
}

function targetsCollide(a: ParsedDatabaseTarget, b: ParsedDatabaseTarget): boolean {
  return (
    a.host.toLowerCase() === b.host.toLowerCase() &&
    a.port === b.port &&
    a.databaseName.toLowerCase() === b.databaseName.toLowerCase()
  );
}

/** Guarda de TEST-01: exige `DATABASE_URL_TEST` clasificado exactamente como TEST. */
export function assertTestDatabaseUrl(env: EnvLike): ParsedDatabaseTarget {
  const target = parseDatabaseTarget(env["DATABASE_URL_TEST"], "DATABASE_URL_TEST");

  if (target.classification !== "TEST") {
    throw new UnsafeDatabaseTargetError(
      "UNSAFE_CLASSIFICATION",
      `DATABASE_URL_TEST must point to a database classified as TEST (got ${target.classification}).`
    );
  }

  const otherRaw = env["DATABASE_URL"];
  if (otherRaw !== undefined && otherRaw.trim().length > 0) {
    // Si DATABASE_URL está presente, debe ser una URL segura por sí misma: una
    // configuración ambigua (URL inválida junto a una DATABASE_URL_TEST válida)
    // se rechaza igual que si faltara DATABASE_URL_TEST.
    const other = parseDatabaseTarget(otherRaw, "DATABASE_URL");
    // Alias seguro: los workers de Vitest fijan DATABASE_URL = DATABASE_URL_TEST
    // a propósito (`apps/api/vitest.config.ts`). Que ambas resuelvan al mismo
    // destino solo se admite cuando ese destino clasifica como TEST — que es
    // exactamente lo ya exigido arriba para DATABASE_URL_TEST. No es un
    // fallback: DATABASE_URL nunca sustituye a DATABASE_URL_TEST, solo se
    // comprueba después de haber validado la variable dedicada.
    if (targetsCollide(target, other) && other.classification !== "TEST") {
      throw new UnsafeDatabaseTargetError(
        "TARGET_COLLISION",
        "DATABASE_URL_TEST and DATABASE_URL resolve to the same non-TEST database."
      );
    }
  }

  return target;
}

/**
 * Resuelve `JOBIT_DATA_MODE` traduciendo un valor inválido al vocabulario cerrado
 * de esta guarda. Así, tanto el seed como el arranque fallan con un
 * `UnsafeDatabaseTargetError` y un `code` estable, en vez de con dos clases de
 * error distintas que sus formateadores tendrían que conocer por separado.
 */
function readDataMode(env: EnvLike): JobitDataMode | null {
  try {
    return parseDataMode(env);
  } catch (error) {
    if (error instanceof InvalidDataModeError) {
      throw new UnsafeDatabaseTargetError("INVALID_DATA_MODE", error.message);
    }
    throw error;
  }
}

/**
 * Guarda de DATA-04, extendida por la Fase C con la excepción controlada de
 * staging sintético.
 *
 * Contrato (spec `staging-technical-readiness.md` §8):
 * - `DEVELOPMENT`/`E2E`: reglas anteriores intactas, incluido el bloqueo por
 *   `NODE_ENV=production`.
 * - `STAGING`: permitido SOLO con `JOBIT_DATA_MODE=SYNTHETIC_STAGING`, y solo en
 *   esa rama `NODE_ENV=production` deja de bloquear — staging corre justamente
 *   con `NODE_ENV=production`, así que sin esta excepción el modo sintético sería
 *   inalcanzable en el entorno para el que se diseñó.
 * - `PRODUCTION`, `TEST`, `UNKNOWN` y `AMBIGUOUS`: rechazados bajo CUALQUIER
 *   combinación de variables. `PRODUCTION` se rechaza además de forma explícita
 *   cuando se declara el modo sintético, para que el motivo quede en el `code` y
 *   no dependa de la rama genérica.
 */
export function assertSeedableDatabaseUrl(env: EnvLike): ParsedDatabaseTarget {
  const target = parseDatabaseTarget(env["DATABASE_URL"], "DATABASE_URL");
  const mode = readDataMode(env);

  // Invariante dura: producción es inalcanzable. Se comprueba ANTES que ninguna
  // otra rama para que declarar el modo sintético no pueda abrir ningún camino.
  if (target.classification === "PRODUCTION" && mode === SYNTHETIC_STAGING) {
    throw new UnsafeDatabaseTargetError(
      "PRODUCTION_MODE_CONFLICT",
      "Seeding is never allowed against a PRODUCTION database, including under synthetic staging mode."
    );
  }

  if (target.classification === "STAGING") {
    if (mode !== SYNTHETIC_STAGING) {
      throw new UnsafeDatabaseTargetError(
        "DATA_MODE_REQUIRED",
        "Seeding a STAGING database requires JOBIT_DATA_MODE=SYNTHETIC_STAGING."
      );
    }
    return target;
  }

  const normalizedNodeEnv = env["NODE_ENV"]?.trim().toLowerCase();
  if (normalizedNodeEnv === "production") {
    throw new UnsafeDatabaseTargetError(
      "PRODUCTION_ENVIRONMENT",
      "Seeding is not allowed when NODE_ENV is production."
    );
  }

  if (target.classification !== "DEVELOPMENT" && target.classification !== "E2E") {
    throw new UnsafeDatabaseTargetError(
      "UNSAFE_CLASSIFICATION",
      `DATABASE_URL must point to a DEVELOPMENT or E2E database for seeding (got ${target.classification}).`
    );
  }

  return target;
}

/**
 * Clasificación efectiva del destino en el arranque. `UNRESOLVED` cubre
 * `DATABASE_URL` ausente, vacía o malformada: la API arranca hoy en ese estado y
 * falla perezosamente al primer acceso, comportamiento que se conserva mientras
 * no se declare ningún modo.
 */
export type RuntimeTargetClassification = DatabaseClassification | "UNRESOLVED";

export interface RuntimeDataModeContract {
  mode: JobitDataMode | null;
  classification: RuntimeTargetClassification;
}

/**
 * Guarda de arranque: reconcilia la clasificación de `DATABASE_URL` (safety
 * boundary) con `JOBIT_DATA_MODE` (behavior contract).
 *
 * Invariante dura: una base clasificada `STAGING` nunca arranca en modo normal.
 * La ausencia de la variable no degrada silenciosamente; aborta.
 *
 * Contrato completo en `docs/specs/features/staging-technical-readiness.md` §7.
 */
export function assertRuntimeDataModeContract(env: EnvLike): RuntimeDataModeContract {
  const mode = readDataMode(env);

  let classification: RuntimeTargetClassification;
  try {
    classification = parseDatabaseTarget(env["DATABASE_URL"], "DATABASE_URL").classification;
  } catch {
    // El motivo exacto no se propaga: aquí solo importa que el destino no es
    // verificable. Si además se declaró un modo, es una contradicción y aborta.
    classification = "UNRESOLVED";
  }

  if (classification === "STAGING" && mode !== SYNTHETIC_STAGING) {
    throw new UnsafeDatabaseTargetError(
      "DATA_MODE_REQUIRED",
      "A STAGING database requires JOBIT_DATA_MODE=SYNTHETIC_STAGING to start."
    );
  }

  if (classification === "PRODUCTION" && mode === SYNTHETIC_STAGING) {
    throw new UnsafeDatabaseTargetError(
      "PRODUCTION_MODE_CONFLICT",
      "JOBIT_DATA_MODE=SYNTHETIC_STAGING must never be used against a PRODUCTION database."
    );
  }

  const unverifiable =
    classification === "UNKNOWN" ||
    classification === "AMBIGUOUS" ||
    classification === "UNRESOLVED";
  if (unverifiable && mode !== null) {
    throw new UnsafeDatabaseTargetError(
      "UNVERIFIABLE_TARGET_MODE_CONFLICT",
      "JOBIT_DATA_MODE was declared but the database target classification cannot be verified."
    );
  }

  return { mode, classification };
}

/**
 * Mensaje de fallo de arranque, de vocabulario cerrado.
 *
 * Nunca reenvía el texto original de una excepción ajena, que podría arrastrar
 * credenciales, URLs o rutas. Para un rechazo de estas guardas emite su `code`
 * —ya sanitizado por construcción— y para cualquier otro valor colapsa a un
 * único mensaje genérico. Función pura: no hace logging.
 */
export function formatStartupGuardFailure(error: unknown): string {
  if (error instanceof UnsafeDatabaseTargetError) {
    return `[startup] ABORTED: UNSAFE_DATABASE_TARGET:${error.code}`;
  }
  return "[startup] ABORTED: STARTUP_GUARD_FAILED";
}
