/**
 * Configuración de rate limiting (B3-ABUSE-01).
 *
 * Spec: `docs/specs/features/api-rate-limiting.md`.
 *
 * Módulo independiente de `env.ts` (que no se modifica). `resolveRateLimitConfig`
 * es una función pura: recibe el entorno por parámetro, no lee `process.env` ni
 * lo muta, y falla de forma explícita (fail-fast) ante cualquier valor inválido.
 *
 * Los mensajes de error nombran la variable y el rango esperado; nunca incluyen
 * valores de otras variables del entorno.
 */

export type EnvLike = Record<string, string | undefined>;

/** Política de un limitador concreto. */
export interface RateLimitPolicy {
  readonly windowMs: number;
  readonly limit: number;
}

export interface RateLimitConfig {
  readonly general: RateLimitPolicy;
  readonly login: RateLimitPolicy;
  readonly register: RateLimitPolicy;
  readonly publicRead: RateLimitPolicy;
  /**
   * Número de saltos de proxy de confianza para `app.set("trust proxy", n)`.
   * Nunca es un booleano: `true` haría que Express tomase el extremo izquierdo
   * de `X-Forwarded-For`, controlable por el cliente (ver spec §"Proxy").
   */
  readonly trustProxyHops: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Solo enteros decimales: descarta "10.5", "1e3", "10abc", "" y "true". */
const INTEGER_PATTERN = /^-?\d+$/;

interface NumericSpec {
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly productionDefault: number;
  readonly testDefault: number;
}

const SPECS = {
  generalWindowMs: {
    name: "RATE_LIMIT_WINDOW_MS",
    min: 1000,
    max: HOUR_MS,
    productionDefault: 15 * MINUTE_MS,
    testDefault: 15 * MINUTE_MS
  },
  generalLimit: {
    name: "RATE_LIMIT_MAX",
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    productionDefault: 300,
    testDefault: 1000
  },
  loginWindowMs: {
    name: "AUTH_LOGIN_WINDOW_MS",
    min: 1000,
    max: HOUR_MS,
    productionDefault: 15 * MINUTE_MS,
    testDefault: 15 * MINUTE_MS
  },
  loginLimit: {
    name: "AUTH_LOGIN_MAX",
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    productionDefault: 10,
    testDefault: 100
  },
  registerWindowMs: {
    name: "AUTH_REGISTER_WINDOW_MS",
    min: 1000,
    max: DAY_MS,
    productionDefault: HOUR_MS,
    testDefault: HOUR_MS
  },
  registerLimit: {
    name: "AUTH_REGISTER_MAX",
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    productionDefault: 5,
    testDefault: 100
  },
  publicReadWindowMs: {
    name: "PUBLIC_READ_WINDOW_MS",
    min: 1000,
    max: HOUR_MS,
    productionDefault: 15 * MINUTE_MS,
    testDefault: 15 * MINUTE_MS
  },
  publicReadLimit: {
    name: "PUBLIC_READ_MAX",
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    productionDefault: 60,
    testDefault: 1000
  },
  trustProxyHops: {
    name: "TRUST_PROXY_HOPS",
    min: 0,
    max: 10,
    productionDefault: 0,
    testDefault: 0
  }
} as const satisfies Record<string, NumericSpec>;

/**
 * Resuelve un entero desde el entorno.
 *
 * Precedencia: variable explícita → default de test (si `NODE_ENV=test`) →
 * default productivo. Una variable explícita siempre gana.
 */
function readInteger(env: EnvLike, spec: NumericSpec, isTest: boolean): number {
  const raw = env[spec.name];

  if (raw === undefined) {
    return isTest ? spec.testDefault : spec.productionDefault;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || !INTEGER_PATTERN.test(trimmed)) {
    throw new Error(
      `${spec.name} must be an integer between ${spec.min} and ${spec.max}.`
    );
  }

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < spec.min || value > spec.max) {
    throw new Error(
      `${spec.name} must be an integer between ${spec.min} and ${spec.max}.`
    );
  }

  return value;
}

/** Resuelve y valida toda la configuración de rate limiting. */
export function resolveRateLimitConfig(env: EnvLike): RateLimitConfig {
  const isTest = env["NODE_ENV"]?.trim().toLowerCase() === "test";
  const read = (spec: NumericSpec): number => readInteger(env, spec, isTest);

  return {
    general: {
      windowMs: read(SPECS.generalWindowMs),
      limit: read(SPECS.generalLimit)
    },
    login: {
      windowMs: read(SPECS.loginWindowMs),
      limit: read(SPECS.loginLimit)
    },
    register: {
      windowMs: read(SPECS.registerWindowMs),
      limit: read(SPECS.registerLimit)
    },
    publicRead: {
      windowMs: read(SPECS.publicReadWindowMs),
      limit: read(SPECS.publicReadLimit)
    },
    trustProxyHops: read(SPECS.trustProxyHops)
  };
}

/** Configuración efectiva del proceso, resuelta al cargar el módulo (fail-fast). */
export const rateLimitConfig: RateLimitConfig = resolveRateLimitConfig(process.env);
