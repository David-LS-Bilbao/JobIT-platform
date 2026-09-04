import type { NextFunction, Request, Response } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../lib/prisma.js";
import { truncateTables } from "../tests/setup.js";
import { signAccessToken } from "./jwt.util.js";
import { requireAuth, type AuthenticatedRequest } from "./require-auth.middleware.js";

function makeReq(authorization?: string): Request {
  return { headers: authorization ? { authorization } : {} } as unknown as Request;
}

function makeRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

async function createUser(email: string): Promise<string> {
  const user = await prisma.user.create({ data: { email, passwordHash: "irrelevant-for-this-test" } });
  return user.id;
}

describe("requireAuth middleware", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-secret";
  });
  beforeEach(async () => {
    await truncateTables(prisma);
  });

  it("calls next() and sets req.auth.userId for a valid token of an existing user", async () => {
    const userId = await createUser("exists@example.com");
    const req = makeReq(`Bearer ${signAccessToken(userId)}`);
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as unknown as AuthenticatedRequest).auth?.userId).toBe(userId);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is not Bearer format", async () => {
    const req = makeReq("Basic dXNlcjpwYXNz");
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid or expired", async () => {
    const req = makeReq("Bearer invalid.token.payload");
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // Invalidacion inmediata: la firma sigue siendo valida, pero el usuario ya no
  // existe. Es el mecanismo que sostiene el borrado permanente de cuenta.
  it("returns 401 for a cryptographically valid token whose user no longer exists", async () => {
    const userId = await createUser("deleted@example.com");
    const token = signAccessToken(userId);
    await prisma.user.delete({ where: { id: userId } });

    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("uses the same generic body for a deleted user as for a malformed token", async () => {
    const userId = await createUser("generic@example.com");
    const token = signAccessToken(userId);
    await prisma.user.delete({ where: { id: userId } });

    const deletedRes = makeRes();
    await requireAuth(makeReq(`Bearer ${token}`), deletedRes as unknown as Response, vi.fn() as unknown as NextFunction);

    const malformedRes = makeRes();
    await requireAuth(makeReq("Bearer nope"), malformedRes as unknown as Response, vi.fn() as unknown as NextFunction);

    expect(deletedRes.json.mock.calls[0]).toEqual(malformedRes.json.mock.calls[0]);
  });

  // Una indisponibilidad de base de datos NO puede presentarse como sesion
  // invalida: cerraria sesiones validas durante una incidencia de infraestructura.
  it("propagates a database failure instead of turning it into a 401", async () => {
    const userId = await createUser("dbfail@example.com");
    const req = makeReq(`Bearer ${signAccessToken(userId)}`);
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    const spy = vi
      .spyOn(prisma.user, "findUnique")
      .mockRejectedValueOnce(new Error("connection terminated"));

    await expect(requireAuth(req, res as unknown as Response, next)).rejects.toThrow(
      "connection terminated"
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
