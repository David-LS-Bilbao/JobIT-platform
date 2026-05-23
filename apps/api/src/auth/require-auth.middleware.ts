import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "./jwt.util.js";

export type AuthenticatedRequest = Request & { auth: { userId: string } };

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { userId } = verifyAccessToken(token);
    (req as AuthenticatedRequest).auth = { userId };
    next();
  } catch {
    res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
  }
}
