import jwt, { type JwtPayload } from "jsonwebtoken";
import { beforeAll, describe, expect, it } from "vitest";

import { signAccessToken, verifyAccessToken } from "./jwt.util.js";

describe("jwt.util", () => {
  beforeAll(() => {
    process.env["JWT_ACCESS_SECRET"] = "test-secret";
  });

  it("signAccessToken(): returns a string with three JWT segments", () => {
    const token = signAccessToken("user-123");

    expect(token.split(".")).toHaveLength(3);
  });

  it("signAccessToken(): payload sub equals the provided userId", () => {
    const userId = "user-abc-123";
    const token = signAccessToken(userId);
    const payload = jwt.decode(token) as JwtPayload;

    expect(payload).not.toBeNull();
    expect(payload.sub).toBe(userId);
  });

  it("verifyAccessToken(): returns userId for a valid token", () => {
    const userId = "user-xyz-456";
    const token = signAccessToken(userId);

    expect(verifyAccessToken(token).userId).toBe(userId);
  });

  it("verifyAccessToken(): throws for an expired token", () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign(
      { sub: "user-123", exp: now - 100 },
      "test-secret"
    );

    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });

  it("verifyAccessToken(): throws for a token with wrong signature", () => {
    const token = jwt.sign({ sub: "user-123" }, "wrong-secret", { expiresIn: "15m" });

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
