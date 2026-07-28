/**
 * Guardas de seguridad de base de datos (Sprint 23 — TEST-01 / DATA-04).
 *
 * Utilidad pura: no importa Prisma, dotenv, `child_process` ni ningún módulo de
 * aplicación que cree clientes o conexiones. No lee `process.env` directamente —
 * toda entrada llega por parámetro (`EnvLike`). No hace logging ni efectos
 * secundarios de ningún tipo.
 *
 * Ver `docs/specs/features/database-seed-safety-gates.md` para el contrato completo.
 */

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
  | "PRODUCTION_ENVIRONMENT";

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

/** Guarda de DATA-04: exige `DATABASE_URL` clasificado como DEVELOPMENT o E2E. */
export function assertSeedableDatabaseUrl(env: EnvLike): ParsedDatabaseTarget {
  const target = parseDatabaseTarget(env["DATABASE_URL"], "DATABASE_URL");

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
