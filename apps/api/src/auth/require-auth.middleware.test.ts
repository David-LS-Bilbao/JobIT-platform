import type { NextFunction, Request, Response } from "express";
import { beforeAll, describe, expect, it, vi } from "vitest";

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

describe("requireAuth middleware", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-secret";
  });

  it("calls next() and sets req.auth.userId for a valid token", () => {
    const token = signAccessToken("user-abc-123");
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as unknown as AuthenticatedRequest).auth?.userId).toBe("user-abc-123");
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is missing", () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is not Bearer format", () => {
    const req = makeReq("Basic dXNlcjpwYXNz");
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid or expired", () => {
    const req = makeReq("Bearer invalid.token.payload");
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
