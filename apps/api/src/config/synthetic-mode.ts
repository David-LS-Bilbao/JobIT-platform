/**
 * Contrato de modo de datos de staging sintético (Fase C — bloque 1).
 *
 * Módulo PURO: no importa Prisma, dotenv, `child_process` ni ningún otro módulo
 * del proyecto. No lee `process.env` directamente — toda entrada llega por
 * parámetro. No hace logging ni efectos secundarios. Es la hoja del grafo de
 * dependencias: `lib/database-safety.ts` importa de aquí, nunca al revés.
 *
 * `JOBIT_DATA_MODE` es el ÚNICO contrato de comportamiento. No existe ninguna
 * segunda llave (`JOBIT_SEED_SYNTHETIC_STAGING`, `ALLOW_SEED`, `FORCE_SEED`):
 * una segunda variable sería una fuente de verdad capaz de discrepar de esta.
 *
 * Ver `docs/specs/features/staging-technical-readiness.md` §5, §9.3 y §10.
 */

export type EnvLike = Record<string, string | undefined>;

/** Vocabulario cerrado. Añadir un valor aquí es un cambio de contrato. */
export const JOBIT_DATA_MODE_VALUES = ["SYNTHETIC_STAGING"] as const;

export type JobitDataMode = (typeof JOBIT_DATA_MODE_VALUES)[number];

/** Único modo definido hoy. */
export const SYNTHETIC_STAGING: JobitDataMode = "SYNTHETIC_STAGING";

export const JOBIT_DATA_MODE_VARIABLE = "JOBIT_DATA_MODE";

/**
 * Dominio reservado de las identidades sintéticas.
 *
 * `.invalid` es un TLD reservado por la RFC 2606: no resuelve en ningún
 * resolutor y ningún correo puede entregarse a él. Por eso una dirección de
 * este dominio no puede corresponder a una persona real.
 */
export const SYNTHETIC_STAGING_EMAIL_DOMAIN = "synthetic.jobit.invalid";

/**
 * Valor de `JOBIT_DATA_MODE` fuera del vocabulario cerrado.
 *
 * El mensaje NUNCA reproduce el valor recibido: el contenido del entorno no se
 * reenvía a consola ni a logs. Enumera el vocabulario válido, que sí es público.
 */
export class InvalidDataModeError extends Error {
  public readonly code = "INVALID_DATA_MODE";

  constructor() {
    super(
      `${JOBIT_DATA_MODE_VARIABLE} must be one of: ${JOBIT_DATA_MODE_VALUES.join(", ")}.`
    );
    this.name = "InvalidDataModeError";
  }
}

function isJobitDataMode(value: string): value is JobitDataMode {
  return (JOBIT_DATA_MODE_VALUES as readonly string[]).includes(value);
}

/**
 * Resuelve `JOBIT_DATA_MODE` desde el entorno.
 *
 * - Ausente, vacía o solo espacios → `null` (modo NORMAL). Esto NO es un
 *   fallback permisivo: quien decide si la ausencia es aceptable es la guarda
 *   que conoce la clasificación del destino. Sobre una base `STAGING`, la
 *   ausencia aborta.
 * - Cualquier otro valor —incluido el mismo texto en otra caja— lanza
 *   `InvalidDataModeError`. El vocabulario es cerrado y la comparación exacta:
 *   aceptar variantes haría el contrato no determinista.
 */
export function parseDataMode(env: EnvLike): JobitDataMode | null {
  const raw = env[JOBIT_DATA_MODE_VARIABLE];
  if (raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!isJobitDataMode(trimmed)) {
    throw new InvalidDataModeError();
  }

  return trimmed;
}

/** `true` solo cuando el modo resuelto es exactamente `SYNTHETIC_STAGING`. */
export function isSyntheticStagingMode(env: EnvLike): boolean {
  return parseDataMode(env) === SYNTHETIC_STAGING;
}

/**
 * Extrae el dominio de una dirección de correo ya validada por el schema.
 *
 * Usa la ÚLTIMA `@` como separador: la parte local puede contenerla en formas
 * entrecomilladas, el dominio no. Devuelve `null` cuando no hay parte local o
 * no hay dominio.
 */
export function extractEmailDomain(email: string): string | null {
  const separator = email.lastIndexOf("@");
  if (separator <= 0 || separator === email.length - 1) {
    return null;
  }
  return email.slice(separator + 1).toLowerCase();
}

/**
 * Igualdad EXACTA contra el dominio reservado.
 *
 * Deliberadamente no se usa `endsWith`: admitiría tanto subdominios
 * (`a@sub.synthetic.jobit.invalid`) como sufijos engañosos construidos por
 * quien registra, y ambos casos deben rechazarse.
 */
export function isSyntheticStagingEmail(email: string): boolean {
  return extractEmailDomain(email) === SYNTHETIC_STAGING_EMAIL_DOMAIN;
}
