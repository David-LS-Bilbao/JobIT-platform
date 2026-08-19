import { randomUUID } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "./jwt.util.js";
import { hash, verify } from "./password.util.js";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token.util.js";

/**
 * Continuidad de sesion y rotacion de refresh token (arquitectura C).
 *
 * Spec: `docs/specs/features/session-continuity-401-recovery.md`.
 * ADR:  `docs/decisions/ADR-0014-session-continuity-refresh-contract.md`.
 *
 * Modelo: una FAMILIA (`familyId`) agrupa los refresh tokens derivados de una
 * misma autenticacion. El linaje es una cadena simple: `replacedById @unique`
 * impide la convergencia y el CAS impide la bifurcacion, de modo que si la
 * familia tiene exactamente un miembro usable, ese miembro es la cola unica y
 * todo miembro con linaje es ancestro suyo. Es lo que permite clasificar sin
 * recorrer la cadena ni cargar el successor directo.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Ventana durante la cual un predecessor ya rotado se acepta como concurrencia
 * legitima. El unico presentador legitimo posible es una peticion que ya estaba
 * en vuelo cuando el ganador consolido su rotacion; 10 s cubren con holgura
 * latencia, transaccion y desfase entre pestañas. NO identifica de forma
 * infalible a un cliente legitimo (ver ADR-0014 §1).
 */
export const LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS = 10_000;

/** Reintentos ante conflicto transaccional. 2 reintentos ⇒ 3 intentos totales. */
export const MAX_SERIALIZATION_RETRIES = 2;

type UserPublic = { id: string; email: string; role: string; createdAt: Date };
type AuthResult = { accessToken: string; refreshToken: string; user: UserPublic };

const toPublicUser = (user: {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}): UserPublic => ({
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

// ─── Seams de test ───────────────────────────────────────────────────────────
// Todos opcionales y con valor por defecto: en produccion nadie pasa `deps` y el
// comportamiento es identico al de una funcion sin parametro. `hooks` es
// `undefined` en produccion; solo los tests de interleaving lo usan para
// suspender una transaccion en un punto conocido.

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export interface RefreshHooks {
  /** Rotacion: tras reclamar el current, antes de crear el successor. */
  afterClaim?: () => Promise<void>;
  /** Replay y logout: antes del `updateMany` de revocacion de familia. */
  beforeFamilyRevoke?: () => Promise<void>;
}

export interface RefreshDeps {
  generateToken?: () => string;
  runSerializable?: <T>(fn: (tx: TxClient) => Promise<T>) => Promise<T>;
  clock?: { now: () => Date };
  hooks?: RefreshHooks;
}

const defaultRunSerializable = <T>(fn: (tx: TxClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });

// ─── Resultados ──────────────────────────────────────────────────────────────

/**
 * Clase A (terminal de sesion) → 401 generico + clearCookie.
 * Clase B (interno/invariante) → 500 generico, cookie INTACTA.
 *
 * Un fallo interno NUNCA se presenta como sesion invalida: tras el rollback el
 * predecessor sigue siendo CURRENT y la sesion es valida.
 */
export type RefreshOutcome =
  | { outcome: "ROTATED"; token: string; expiresAt: Date; user: UserPublic }
  | { outcome: "LEGITIMATE_CONCURRENT_REFRESH"; user: UserPublic }
  | { outcome: "REPLAY" }
  | { outcome: "FAIL" }
  | { outcome: "INTERNAL_TRANSACTION_FAILURE" };

/** Fallo terminal de sesion lanzado desde dentro de la transaccion para forzar rollback. */
class TerminalRefreshFailure extends Error {}
/** Violacion de un invariante de familia: fallo interno, nunca sesion invalida. */
class InvariantViolation extends Error {}

/**
 * `RETRYABLE_TRANSACTION_CONFLICT`. Prisma documenta `P2034` como «write conflict
 * or deadlock»; no se afirma que sea un mapeo exclusivo de SQLSTATE 40001. Es la
 * unica señal reintentable y el unico codigo que se inspecciona: nunca mensajes
 * de texto ni SQLSTATE crudos.
 */
function isRetryableTransactionConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

// ─── Autenticacion inicial ───────────────────────────────────────────────────

/** Crea el root token de una familia nueva. Cada autenticacion abre su propia familia. */
async function createRootToken(userId: string): Promise<{ token: string }> {
  const token = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      familyId: randomUUID(),
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    }
  });
  return { token };
}

export async function register(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError("CONFLICT", 409, "No ha sido posible completar el registro");
  }

  const passwordHash = await hash(password);
  const user = await prisma.user.create({ data: { email: normalizedEmail, passwordHash } });
  const { token } = await createRootToken(user.id);

  return { accessToken: signAccessToken(user.id), refreshToken: token, user: toPublicUser(user) };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase();
  const GENERIC_ERROR = "Email o contraseña incorrectos";

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("UNAUTHORIZED", 401, GENERIC_ERROR);
  }

  const passwordMatch = await verify(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("UNAUTHORIZED", 401, GENERIC_ERROR);
  }

  const { token } = await createRootToken(user.id);

  return { accessToken: signAccessToken(user.id), refreshToken: token, user: toPublicUser(user) };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export interface LogoutDeps {
  runSerializable?: <T>(fn: (tx: TxClient) => Promise<T>) => Promise<T>;
  clock?: { now: () => Date };
  hooks?: Pick<RefreshHooks, "beforeFamilyRevoke">;
}

export type LogoutOutcome = "DONE" | "INTERNAL_TRANSACTION_FAILURE";

/**
 * Revoca la FAMILIA completa, no solo el token presentado: la familia es la
 * autenticacion, y el logout la termina. El `WHERE` es por `familyId`, nunca por
 * `userId`, de modo que otras sesiones del usuario quedan intactas.
 *
 * Acepta tanto el current como un predecessor: ambos resuelven a la misma familia.
 */
export async function logout(
  refreshToken: string | undefined,
  deps: LogoutDeps = {}
): Promise<LogoutOutcome> {
  if (!refreshToken) return "DONE";

  const run = deps.runSerializable ?? defaultRunSerializable;
  const clock = deps.clock ?? { now: () => new Date() };
  const tokenHash = hashRefreshToken(refreshToken);

  for (let attempt = 0; attempt <= MAX_SERIALIZATION_RETRIES; attempt++) {
    try {
      return await run<LogoutOutcome>(async (tx) => {
        const record = await tx.refreshToken.findUnique({ where: { tokenHash } });
        if (!record) return "DONE";

        await deps.hooks?.beforeFamilyRevoke?.();

        await tx.refreshToken.updateMany({
          where: { familyId: record.familyId, revokedAt: null },
          data: { revokedAt: clock.now() }
        });
        return "DONE";
      });
    } catch (error) {
      if (isRetryableTransactionConflict(error) && attempt < MAX_SERIALIZATION_RETRIES) continue;
      return "INTERNAL_TRANSACTION_FAILURE";
    }
  }

  return "INTERNAL_TRANSACTION_FAILURE";
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

/**
 * Renueva el access token a partir de la cookie de refresh.
 *
 * `presentedAt` se captura UNA sola vez, antes del bucle de reintentos, y decide
 * SOLO la ventana de concurrencia; `attemptNow` se recalcula en cada intento y
 * decide expiraciones, escrituras y estado de familia. Asi un conflicto de
 * serializacion —que no es culpa del cliente— nunca convierte una presentacion
 * legitima en replay, ni al reves.
 */
export async function refreshSession(
  refreshToken: string | undefined,
  deps: RefreshDeps = {}
): Promise<RefreshOutcome> {
  if (!refreshToken) return { outcome: "FAIL" };

  const run = deps.runSerializable ?? defaultRunSerializable;
  const clock = deps.clock ?? { now: () => new Date() };
  const generateToken = deps.generateToken ?? generateRefreshToken;
  const tokenHash = hashRefreshToken(refreshToken);
  const presentedAt = clock.now();

  for (let attempt = 0; attempt <= MAX_SERIALIZATION_RETRIES; attempt++) {
    try {
      return await run((tx) =>
        attemptRefresh(tx, {
          tokenHash,
          presentedAt,
          attemptNow: clock.now(),
          generateToken,
          hooks: deps.hooks
        })
      );
    } catch (error) {
      if (isRetryableTransactionConflict(error) && attempt < MAX_SERIALIZATION_RETRIES) continue;
      if (error instanceof TerminalRefreshFailure) return { outcome: "FAIL" };
      // InvariantViolation y cualquier otro error son clase B: nunca sesion invalida.
      return { outcome: "INTERNAL_TRANSACTION_FAILURE" };
    }
  }

  return { outcome: "INTERNAL_TRANSACTION_FAILURE" };
}

interface AttemptContext {
  tokenHash: string;
  presentedAt: Date;
  attemptNow: Date;
  generateToken: () => string;
  hooks: RefreshHooks | undefined;
}

async function attemptRefresh(tx: TxClient, ctx: AttemptContext): Promise<RefreshOutcome> {
  const { tokenHash, presentedAt, attemptNow, generateToken, hooks } = ctx;

  // Compare-and-swap sobre el current. Es la PRIMERA operacion sobre la fila: no
  // existe lectura previa a la carrera con la que clasificar.
  const claimed = await tx.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: attemptNow } },
    data: { revokedAt: attemptNow }
  });

  if (claimed.count > 1) throw new InvariantViolation();

  if (claimed.count === 1) {
    const predecessor = await tx.refreshToken.findUnique({ where: { tokenHash } });
    if (!predecessor) throw new InvariantViolation();

    // Asercion simetrica de I5: tras reclamar el current, una familia sana no
    // puede conservar otro miembro usable.
    const siblingsUsable = await tx.refreshToken.count({
      where: { familyId: predecessor.familyId, revokedAt: null, expiresAt: { gt: attemptNow } }
    });
    if (siblingsUsable > 0) throw new InvariantViolation();

    await hooks?.afterClaim?.();

    const user = await tx.user.findUnique({ where: { id: predecessor.userId } });
    if (!user) throw new TerminalRefreshFailure();

    const next = generateToken();
    const successor = await tx.refreshToken.create({
      data: {
        userId: predecessor.userId,
        familyId: predecessor.familyId,
        tokenHash: hashRefreshToken(next),
        // Expiracion absoluta heredada: la rotacion nunca prolonga la sesion.
        expiresAt: predecessor.expiresAt
      }
    });
    await tx.refreshToken.update({
      where: { id: predecessor.id },
      data: { replacedById: successor.id }
    });

    return {
      outcome: "ROTATED",
      token: next,
      expiresAt: successor.expiresAt,
      user: toPublicUser(user)
    };
  }

  return classifyCasLost(tx, ctx);
}

/**
 * Clasificacion posterior a la carrera. Toda lectura ocurre AQUI, despues de
 * conocer que el CAS no reclamo nada y dentro de la misma transaccion: queda
 * prohibido clasificar con estado leido antes de la carrera.
 */
async function classifyCasLost(tx: TxClient, ctx: AttemptContext): Promise<RefreshOutcome> {
  const { tokenHash, presentedAt, attemptNow, hooks } = ctx;

  const predecessor = await tx.refreshToken.findUnique({ where: { tokenHash } });
  if (!predecessor) return { outcome: "FAIL" }; // desconocido
  if (predecessor.revokedAt === null) return { outcome: "FAIL" }; // expirado, no revocado
  // Revocado SIN rotacion ⇒ logout o revocacion de familia. Barrera estructural:
  // este camino nunca alcanza la logica de ventana.
  if (predecessor.replacedById === null) return { outcome: "FAIL" };

  const familyUsable = await tx.refreshToken.count({
    where: { familyId: predecessor.familyId, revokedAt: null, expiresAt: { gt: attemptNow } }
  });
  if (familyUsable === 0) return { outcome: "FAIL" }; // familia inactiva, sin escrituras
  if (familyUsable > 1) throw new InvariantViolation(); // clase B, nunca sesion invalida

  // familyUsable === 1 ⇒ por la propiedad de cadena simple el predecessor es
  // ancestro del current, tanto si su successor DIRECTO sigue vivo como si ya
  // roto (avance de linaje multigeneracion). El successor directo no se carga.
  const age = presentedAt.getTime() - predecessor.revokedAt.getTime();
  if (age > LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS) {
    await hooks?.beforeFamilyRevoke?.();
    await tx.refreshToken.updateMany({
      where: { familyId: predecessor.familyId, revokedAt: null },
      data: { revokedAt: attemptNow }
    });
    return { outcome: "REPLAY" };
  }

  const user = await tx.user.findUnique({ where: { id: predecessor.userId } });
  if (!user) return { outcome: "FAIL" };

  return { outcome: "LEGITIMATE_CONCURRENT_REFRESH", user: toPublicUser(user) };
}
