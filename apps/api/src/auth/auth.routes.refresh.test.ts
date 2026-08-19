import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { authRouter } from "./auth.router.js";
import {
  LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS,
  MAX_SERIALIZATION_RETRIES,
  refreshSession,
  type RefreshDeps
} from "./auth.service.js";
import { verifyAccessToken } from "./jwt.util.js";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token.util.js";

const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());
testApp.use("/api/auth", authRouter);
testApp.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: { code: "UNHANDLED", message: err.message } });
});

const PASSWORD = "ValidPass123";

/** Cuerpo genérico de clase A: idéntico al de `requireAuth` para todas las causas. */
const GENERIC_401 = { error: { code: "UNAUTHORIZED", message: "Authentication required." } };
/** Cuerpo genérico de clase B: idéntico en desarrollo y en producción. */
const GENERIC_500 = { error: { code: "INTERNAL_ERROR", message: "Internal server error." } };

let seq = 0;
const nextEmail = (): string => `refresh-${Date.now()}-${seq++}@example.com`;

type Session = { email: string; userId: string; cookie: string; token: string };

/** Extrae el valor del refresh token de una cabecera `set-cookie`. */
function readRefreshCookie(setCookie: string[] | undefined): string | null {
  if (!setCookie) return null;
  const raw = setCookie.find((c) => c.startsWith("refresh_token="));
  if (!raw) return null;
  const value = raw.slice("refresh_token=".length).split(";")[0] ?? "";
  return value.length > 0 ? decodeURIComponent(value) : null;
}

/** Registra un usuario y devuelve su sesión inicial (root token de una familia nueva). */
async function register(email = nextEmail()): Promise<Session> {
  const res = await request(testApp).post("/api/auth/register").send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  const cookies = res.headers["set-cookie"] as unknown as string[];
  const token = readRefreshCookie(cookies);
  expect(token).toBeTruthy();
  const user = await prisma.user.findUnique({ where: { email } });
  return { email, userId: user!.id, cookie: `refresh_token=${token}`, token: token! };
}

/** Ejecuta un refresh por HTTP con la cookie dada. */
function refresh(token: string) {
  return request(testApp).post("/api/auth/refresh").set("Cookie", `refresh_token=${token}`);
}

/** Cuenta los miembros usables de una familia. */
function usableCount(familyId: string): Promise<number> {
  return prisma.refreshToken.count({
    where: { familyId, revokedAt: null, expiresAt: { gt: new Date() } }
  });
}

async function familyIdOf(token: string): Promise<string> {
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(token) } });
  return row!.familyId;
}

/** Retrodata `revokedAt` de un token ya rotado, para situar su presentación fuera de la ventana. */
async function backdateRevokedAt(token: string, msAgo: number): Promise<void> {
  await prisma.refreshToken.update({
    where: { tokenHash: hashRefreshToken(token) },
    data: { revokedAt: new Date(Date.now() - msAgo) }
  });
}

function deferred<T = void>(): { promise: Promise<T>; resolve: (v: T) => void } {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Hook de un solo disparo: no vuelve a bloquear en el reintento provocado por un conflicto. */
function onceHook(signal: () => void, gate: Promise<void>): () => Promise<void> {
  let fired = false;
  return async () => {
    if (fired) return;
    fired = true;
    signal();
    await gate;
  };
}

describe("POST /api/auth/refresh", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-integration-secret";
  });

  beforeEach(async () => {
    await truncateTables(prisma);
  });

  // ── B01-B08 · contrato funcional ────────────────────────────────────────────

  it("B01 · refresh válido devuelve access token verificable y el usuario", async () => {
    const s = await register();

    const res = await refresh(s.token);

    expect(res.status).toBe(200);
    expect(verifyAccessToken(res.body.accessToken).userId).toBe(s.userId);
    expect(res.body.user.id).toBe(s.userId);
    expect(res.body.user.email).toBe(s.email);
  });

  it("B02 · sin cookie devuelve 401 genérico", async () => {
    const res = await request(testApp).post("/api/auth/refresh");
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
  });

  it("B03 · cookie con valor arbitrario devuelve 401 genérico", async () => {
    const res = await refresh("no-es-un-token");
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
  });

  it("B04 · refresh expirado devuelve 401 genérico", async () => {
    const s = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(s.token) },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    const res = await refresh(s.token);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
  });

  it("B05 · refresh revocado por logout devuelve 401 genérico", async () => {
    const s = await register();
    await request(testApp).post("/api/auth/logout").set("Cookie", s.cookie).expect(204);

    const res = await refresh(s.token);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
  });

  it("B06 · token desconocido devuelve 401 genérico", async () => {
    await register();
    const res = await refresh(generateRefreshToken());
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
  });

  it("B07 · la rotación preserva familia y expiración absoluta, y enlaza el linaje", async () => {
    const s = await register();
    const before = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(s.token) }
    });

    const res = await refresh(s.token);
    expect(res.status).toBe(200);
    const nextToken = readRefreshCookie(res.headers["set-cookie"] as unknown as string[]);
    expect(nextToken).toBeTruthy();
    expect(nextToken).not.toBe(s.token);

    const predecessor = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(s.token) }
    });
    const successor = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(nextToken!) }
    });

    expect(predecessor!.revokedAt).not.toBeNull();
    expect(predecessor!.replacedById).toBe(successor!.id);
    expect(successor!.revokedAt).toBeNull();
    expect(successor!.familyId).toBe(before!.familyId);
    expect(successor!.expiresAt.getTime()).toBe(before!.expiresAt.getTime());
    expect(await usableCount(before!.familyId)).toBe(1);
  });

  it("B08 · la cookie rotada conserva atributos y caduca con el token, sin deslizamiento", async () => {
    const s = await register();
    // Se retrodata la expiración de la familia a un valor inequívocamente distinto de
    // "ahora + 7 días": si la rotación fuese deslizante, la cookie ignoraría este valor.
    const inheritedExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    inheritedExpiry.setMilliseconds(0);
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(s.token) },
      data: { expiresAt: inheritedExpiry }
    });

    const res = await refresh(s.token);
    const setCookie = (res.headers["set-cookie"] as unknown as string[]).find((c) =>
      c.startsWith("refresh_token=")
    )!;

    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    const expires = /Expires=([^;]+)/.exec(setCookie)?.[1];
    expect(expires).toBeDefined();
    // La cookie caduca EXACTAMENTE con la expiración absoluta heredada.
    expect(new Date(expires!).getTime()).toBe(inheritedExpiry.getTime());
    // Y el successor la hereda tal cual en base de datos.
    const nextToken = readRefreshCookie(res.headers["set-cookie"] as unknown as string[])!;
    const successor = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(nextToken) }
    });
    expect(successor!.expiresAt.getTime()).toBe(inheritedExpiry.getTime());
  });

  // ── B09-B16 · ventana, linaje y estado de familia ───────────────────────────

  it("B09 · un predecessor rotado no vuelve a rotar en ningún camino", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    const rowsAfterRotation = await prisma.refreshToken.count({ where: { familyId } });

    // Dentro de la ventana: gracia, sin escrituras.
    const grace = await refresh(s.token);
    expect(grace.status).toBe(200);
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(rowsAfterRotation);
  });

  it("B10 · concurrencia legítima dentro de la ventana: 200 sin cookie y cero escrituras", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, 1_000);
    const rowsBefore = await prisma.refreshToken.count({ where: { familyId } });

    const res = await refresh(s.token);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(verifyAccessToken(res.body.accessToken).userId).toBe(s.userId);
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(rowsBefore);
    expect(await usableCount(familyId)).toBe(1);
  });

  it("B11 · límite exacto de la ventana es inclusive", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS);

    // `presentedAt` se toma al entrar, por lo que la edad es >= W por unos ms de reloj:
    // se verifica el borde con el servicio, inyectando un reloj exacto.
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(s.token) }
    });
    const exactlyAtLimit = new Date(
      row!.revokedAt!.getTime() + LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS
    );
    const result = await refreshSession(s.token, {
      clock: { now: () => exactlyAtLimit }
    });

    expect(result.outcome).toBe("LEGITIMATE_CONCURRENT_REFRESH");
    expect(await usableCount(familyId)).toBe(1);
  });

  it("B12 · fuera de la ventana es replay y revoca la familia", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 1_000);

    const res = await refresh(s.token);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
    expect(await usableCount(familyId)).toBe(0);
  });

  it("B13 · successor expirado ⇒ familia inactiva, 401 sin escrituras", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    // Expiración absoluta común: si el successor expira, la familia entera queda inactiva.
    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });
    const before = await prisma.refreshToken.findMany({
      where: { familyId },
      select: { id: true, revokedAt: true }
    });

    const res = await refresh(s.token);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
    const after = await prisma.refreshToken.findMany({
      where: { familyId },
      select: { id: true, revokedAt: true },
      orderBy: { id: "asc" }
    });
    expect(after).toEqual([...before].sort((a, b) => a.id.localeCompare(b.id)));
  });

  it("B14 · avance de linaje: successor directo ya rotado sigue siendo concurrencia legítima", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);

    // T0 → T1
    const r1 = await refresh(s.token).expect(200);
    const t1 = readRefreshCookie(r1.headers["set-cookie"] as unknown as string[])!;
    // T1 → T2 (el successor DIRECTO de T0 queda revocado, pero la familia sigue sana)
    const r2 = await refresh(t1).expect(200);
    const t2 = readRefreshCookie(r2.headers["set-cookie"] as unknown as string[])!;

    await backdateRevokedAt(s.token, 1_000);
    const rowsBefore = await prisma.refreshToken.count({ where: { familyId } });

    const res = await refresh(s.token);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(rowsBefore);
    expect(await usableCount(familyId)).toBe(1);
    // T2 sigue siendo el current y puede refrescar.
    await refresh(t2).expect(200);
  });

  it("B15 · familia inactiva devuelve 401 sin ninguna escritura", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, 1_000);
    // Cierra la familia (logout sobre el current).
    await prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    const before = await prisma.refreshToken.findMany({
      where: { familyId },
      select: { id: true, revokedAt: true },
      orderBy: { id: "asc" }
    });

    const res = await refresh(s.token);

    expect(res.status).toBe(401);
    const after = await prisma.refreshToken.findMany({
      where: { familyId },
      select: { id: true, revokedAt: true },
      orderBy: { id: "asc" }
    });
    expect(after).toEqual(before);
  });

  it("B16 · tras logout, un predecessor con linaje no alcanza la ventana", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    const r1 = await refresh(s.token).expect(200);
    const t1 = readRefreshCookie(r1.headers["set-cookie"] as unknown as string[])!;
    await request(testApp)
      .post("/api/auth/logout")
      .set("Cookie", `refresh_token=${t1}`)
      .expect(204);
    await backdateRevokedAt(s.token, 1_000);

    const res = await refresh(s.token);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
    expect(await usableCount(familyId)).toBe(0);
  });

  // ── B17-B21 · concurrencia, replay y aislamiento de familia ─────────────────

  it("B17 · dos refresh simultáneos con el mismo token crean un solo successor", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);

    const [a, b] = await Promise.all([refresh(s.token), refresh(s.token)]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 200]);
    const withCookie = [a, b].filter((r) => r.headers["set-cookie"] !== undefined);
    expect(withCookie).toHaveLength(1);
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(2);
    expect(await usableCount(familyId)).toBe(1);
  });

  it("B18 · el perdedor de la carrera clasifica con estado posterior y no escribe", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);

    const results = await Promise.all([refresh(s.token), refresh(s.token), refresh(s.token)]);

    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(results.filter((r) => r.headers["set-cookie"] !== undefined)).toHaveLength(1);
    // Exactamente una rotación: root + un successor.
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(2);
    expect(await usableCount(familyId)).toBe(1);
  });

  it("B19 · el replay revoca efectivamente la familia (estado, no etiqueta)", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);

    await refresh(s.token).expect(401);

    expect(await usableCount(familyId)).toBe(0);
    const members = await prisma.refreshToken.findMany({ where: { familyId } });
    expect(members.every((m) => m.revokedAt !== null)).toBe(true);
  });

  it("B20 · la revocación por replay no alcanza a otra familia del mismo usuario", async () => {
    const s = await register();
    const familyA = await familyIdOf(s.token);
    const login = await request(testApp)
      .post("/api/auth/login")
      .send({ email: s.email, password: PASSWORD })
      .expect(200);
    const tokenB = readRefreshCookie(login.headers["set-cookie"] as unknown as string[])!;
    const familyB = await familyIdOf(tokenB);
    expect(familyB).not.toBe(familyA);

    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);
    await refresh(s.token).expect(401);

    expect(await usableCount(familyA)).toBe(0);
    expect(await usableCount(familyB)).toBe(1);
    await refresh(tokenB).expect(200);
  });

  it("B21 · tras la revocación ningún miembro de la familia puede refrescar", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    const r1 = await refresh(s.token).expect(200);
    const t1 = readRefreshCookie(r1.headers["set-cookie"] as unknown as string[])!;
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);
    await refresh(s.token).expect(401);

    for (const token of [s.token, t1]) {
      const res = await refresh(token);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    }
    expect(await usableCount(familyId)).toBe(0);
  });

  // ── B22-B24 · superficie de error y no filtración ───────────────────────────

  it("B22 · todas las causas de clase A comparten cuerpo 401 idéntico", async () => {
    const bodies: unknown[] = [];

    bodies.push((await request(testApp).post("/api/auth/refresh")).body); // sin cookie
    bodies.push((await refresh("basura")).body); // desconocido

    const expired = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(expired.token) },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });
    bodies.push((await refresh(expired.token)).body); // expirado

    const loggedOut = await register();
    await request(testApp).post("/api/auth/logout").set("Cookie", loggedOut.cookie).expect(204);
    bodies.push((await refresh(loggedOut.token)).body); // revocado sin linaje

    const replayed = await register();
    await refresh(replayed.token).expect(200);
    await backdateRevokedAt(replayed.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);
    bodies.push((await refresh(replayed.token)).body); // replay

    for (const body of bodies) expect(body).toEqual(GENERIC_401);
  });

  it("B23 · el refresh token no se acepta por body, query ni cabeceras", async () => {
    const s = await register();

    const viaBody = await request(testApp)
      .post("/api/auth/refresh")
      .send({ refreshToken: s.token, refresh_token: s.token });
    const viaQuery = await request(testApp).post(
      `/api/auth/refresh?refreshToken=${encodeURIComponent(s.token)}`
    );
    const viaBearer = await request(testApp)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${s.token}`);
    const viaHeader = await request(testApp)
      .post("/api/auth/refresh")
      .set("X-Refresh-Token", s.token);

    for (const res of [viaBody, viaQuery, viaBearer, viaHeader]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    }
    // El token sigue intacto: ninguna de esas vías lo consumió.
    await refresh(s.token).expect(200);
  });

  it("B24 · ninguna respuesta de fallo filtra datos sensibles", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);

    const replay = await refresh(s.token);
    const internal = await refresh("desconocido");

    for (const res of [replay, internal]) {
      const serialized = `${JSON.stringify(res.body)}${JSON.stringify(res.headers)}`;
      for (const needle of [
        s.token,
        hashRefreshToken(s.token),
        familyId,
        s.userId,
        s.email,
        "tokenHash",
        "P2002",
        "P2034",
        "40001",
        "serial",
        "retry",
        "prisma"
      ]) {
        expect(serialized.toLowerCase()).not.toContain(needle.toLowerCase());
      }
    }
  });

  // ── B25-B26 · integridad transaccional ──────────────────────────────────────

  it("B25 · un fallo interno hace rollback íntegro y NO invalida la sesión", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    // Fila señuelo: el successor colisionará con `tokenHash @unique` dentro de la transacción.
    const collision = generateRefreshToken();
    const decoy = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(decoy.token) },
      data: { tokenHash: hashRefreshToken(collision) }
    });
    const rowsBefore = await prisma.refreshToken.count({ where: { familyId } });

    const result = await refreshSession(s.token, { generateToken: () => collision });

    expect(result.outcome).toBe("INTERNAL_TRANSACTION_FAILURE");

    const predecessor = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(s.token) }
    });
    expect(predecessor!.revokedAt).toBeNull();
    expect(predecessor!.replacedById).toBeNull();
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(rowsBefore);

    // La sesión sobrevive: un refresh posterior sin inyección tiene éxito.
    await refresh(s.token).expect(200);
  });

  it("B25b · el fallo interno responde 500 genérico y NO limpia la cookie", async () => {
    const s = await register();
    const collision = generateRefreshToken();
    const decoy = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(decoy.token) },
      data: { tokenHash: hashRefreshToken(collision) }
    });
    const spy = vi.spyOn(await import("./refresh-token.util.js"), "generateRefreshToken");
    spy.mockReturnValueOnce(collision);

    const res = await refresh(s.token);
    spy.mockRestore();

    expect(res.status).toBe(500);
    expect(res.body).toEqual(GENERIC_500);
    const setCookie = (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
    expect(setCookie.some((c) => c.startsWith("refresh_token=;"))).toBe(false);
    await refresh(s.token).expect(200);
  });

  it("B26 · un token cuyo usuario ya no existe devuelve 401, nunca 500", async () => {
    const s = await register();
    // Desvincula la fila del usuario sin borrarla (la cascada eliminaría el token).
    const other = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(s.token) },
      data: { userId: other.userId }
    });
    await prisma.user.delete({ where: { id: other.userId } });

    const res = await refresh(s.token);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(GENERIC_401);
  });

  // ── B31 · stress (complementa, no sustituye, a B40) ─────────────────────────

  it("B31 · stress REPLAY vs ROTATION: el invariante de familia se cumple siempre", async () => {
    for (let i = 0; i < 8; i++) {
      await truncateTables(prisma);
      const s = await register();
      const familyId = await familyIdOf(s.token);
      const r1 = await refresh(s.token).expect(200);
      const t1 = readRefreshCookie(r1.headers["set-cookie"] as unknown as string[])!;
      await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);

      await Promise.all([refresh(s.token), refresh(t1)]);

      expect(await usableCount(familyId)).toBe(0);
      for (const row of await prisma.refreshToken.findMany({ where: { familyId } })) {
        expect(row.revokedAt).not.toBeNull();
      }
    }
  });

  // ── B33-B35 · política de retry ─────────────────────────────────────────────

  it("B33 · un conflicto reintentable se reintenta y el contrato se conserva", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    let attempts = 0;
    const deps: RefreshDeps = {
      runSerializable: (fn) => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(
            new Prisma.PrismaClientKnownRequestError("write conflict", {
              code: "P2034",
              clientVersion: "test"
            })
          );
        }
        return prisma.$transaction(fn, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        });
      }
    };

    const result = await refreshSession(s.token, deps);

    expect(attempts).toBe(2);
    expect(result.outcome).toBe("ROTATED");
    expect(await usableCount(familyId)).toBe(1);
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(2);
  });

  it("B34 · los errores no reintentables no se reintentan y no invalidan la sesión", async () => {
    const nonRetryable = [
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "test" }),
      new Prisma.PrismaClientKnownRequestError("missing", { code: "P2025", clientVersion: "test" }),
      new Error("boom")
    ];

    for (const error of nonRetryable) {
      const s = await register();
      let attempts = 0;
      const result = await refreshSession(s.token, {
        runSerializable: () => {
          attempts++;
          return Promise.reject(error);
        }
      });

      expect(attempts).toBe(1);
      expect(result.outcome).toBe("INTERNAL_TRANSACTION_FAILURE");
      const row = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashRefreshToken(s.token) }
      });
      expect(row!.revokedAt).toBeNull();
    }
  });

  it("B35 · el agotamiento de reintentos devuelve fallo interno sin tocar la sesión", async () => {
    const s = await register();
    let attempts = 0;
    const result = await refreshSession(s.token, {
      runSerializable: () => {
        attempts++;
        return Promise.reject(
          new Prisma.PrismaClientKnownRequestError("write conflict", {
            code: "P2034",
            clientVersion: "test"
          })
        );
      }
    });

    expect(attempts).toBe(1 + MAX_SERIALIZATION_RETRIES);
    expect(result.outcome).toBe("INTERNAL_TRANSACTION_FAILURE");
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(s.token) }
    });
    expect(row!.revokedAt).toBeNull();
    await refresh(s.token).expect(200);
  });

  // ── B36-B39 · linaje, ventana y contrato de familyUsable ────────────────────

  it("B36 · concurrencia multigeneración: T1→T2 antes de clasificar T0 no revoca la familia", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);

    const r1 = await refresh(s.token).expect(200);
    const t1 = readRefreshCookie(r1.headers["set-cookie"] as unknown as string[])!;
    const r2 = await refresh(t1).expect(200);
    const t2 = readRefreshCookie(r2.headers["set-cookie"] as unknown as string[])!;

    await backdateRevokedAt(s.token, 2_000);
    const rowsBefore = await prisma.refreshToken.count({ where: { familyId } });

    const res = await refresh(s.token);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(rowsBefore);
    expect(await usableCount(familyId)).toBe(1);
    const current = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(t2) }
    });
    expect(current!.revokedAt).toBeNull();
    await refresh(t2).expect(200);
  });

  it("B37 · una presentación dentro de la ventana sigue siendo legítima aunque el retry cruce el límite", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, 1_000);

    // presentedAt dentro de la ventana; el reintento observa un attemptNow muy posterior.
    let call = 0;
    const base = Date.now();
    const deps: RefreshDeps = {
      clock: {
        now: () => new Date(call++ === 0 ? base : base + LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS * 10)
      }
    };

    const result = await refreshSession(s.token, deps);

    expect(result.outcome).toBe("LEGITIMATE_CONCURRENT_REFRESH");
    expect(await usableCount(familyId)).toBe(1);
  });

  it("B38 · una presentación fuera de la ventana sigue siendo replay aunque el intento sea inmediato", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 1);

    const result = await refreshSession(s.token);

    expect(result.outcome).toBe("REPLAY");
    expect(await usableCount(familyId)).toBe(0);
  });

  it("B39 · familyUsable > 1 se trata como fallo interno, sin token y sin limpiar cookie", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    await refresh(s.token).expect(200);
    await backdateRevokedAt(s.token, 1_000);
    // Violación provocada: dos miembros usables en la misma familia.
    const intruder = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(intruder.token) },
      data: { familyId }
    });
    expect(await usableCount(familyId)).toBe(2);

    const res = await refresh(s.token);

    expect(res.status).toBe(500);
    expect(res.body).toEqual(GENERIC_500);
    expect(res.body.accessToken).toBeUndefined();
    const setCookie = (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
    expect(setCookie.some((c) => c.startsWith("refresh_token=;"))).toBe(false);
    expect(await usableCount(familyId)).toBe(2);
  });

  it("B39b · siblingsUsable > 0 tras el CAS aborta la rotación con fallo interno", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    const intruder = await register();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(intruder.token) },
      data: { familyId }
    });

    const res = await refresh(s.token);

    expect(res.status).toBe(500);
    expect(res.body).toEqual(GENERIC_500);
    // Rollback íntegro: el token presentado sigue siendo usable.
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(s.token) }
    });
    expect(row!.revokedAt).toBeNull();
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(2);
  });

  // ── B40 · interleaving determinista REPLAY vs ROTATION ──────────────────────

  it("B40 · determinista REPLAY vs ROTATION: la revocación de familia alcanza al successor concurrente", async () => {
    const s = await register();
    const familyId = await familyIdOf(s.token);
    const r1 = await refresh(s.token).expect(200);
    const t1 = readRefreshCookie(r1.headers["set-cookie"] as unknown as string[])!;
    await backdateRevokedAt(s.token, LEGITIMATE_CONCURRENT_REFRESH_WINDOW_MS + 5_000);

    // Otra familia del mismo usuario, para comprobar aislamiento.
    const login = await request(testApp)
      .post("/api/auth/login")
      .send({ email: s.email, password: PASSWORD })
      .expect(200);
    const otherToken = readRefreshCookie(login.headers["set-cookie"] as unknown as string[])!;
    const otherFamily = await familyIdOf(otherToken);

    const rotationReachedClaim = deferred();
    const replayReachedRevoke = deferred();
    const gateRotation = deferred();
    const gateReplay = deferred();

    // 1. La rotación reclama el current y se detiene ANTES de comprometer.
    const pRotation = refreshSession(t1, {
      hooks: { afterClaim: onceHook(rotationReachedClaim.resolve, gateRotation.promise) }
    });
    await rotationReachedClaim.promise; // punto de control 1

    // 2. El replay clasifica y se detiene JUSTO ANTES de revocar la familia.
    const pReplay = refreshSession(s.token, {
      hooks: { beforeFamilyRevoke: onceHook(replayReachedRevoke.resolve, gateReplay.promise) }
    });
    await replayReachedRevoke.promise; // punto de control 2

    // 3. Se libera la rotación: crea el successor y COMPROMETE.
    gateRotation.resolve();
    const rotation = await pRotation; // punto de control 3

    // 4. Solo ahora se libera la revocación de familia.
    gateReplay.resolve();
    const replay = await pReplay;

    expect(rotation.outcome).toBe("ROTATED");
    expect(replay.outcome).toBe("REPLAY");

    // INVARIANTE I9: ningún miembro usable, incluido el successor creado concurrentemente.
    expect(await usableCount(familyId)).toBe(0);
    for (const row of await prisma.refreshToken.findMany({ where: { familyId } })) {
      expect(row.revokedAt).not.toBeNull();
    }
    // El T2 creado por la rotación no puede refrescar.
    if (rotation.outcome === "ROTATED") {
      const res = await refresh(rotation.token);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(GENERIC_401);
    }
    // Ningún miembro puede refrescar; otra familia del usuario intacta.
    for (const token of [s.token, t1]) {
      expect((await refresh(token)).status).toBe(401);
    }
    expect(await usableCount(otherFamily)).toBe(1);
    await refresh(otherToken).expect(200);
  });
});
