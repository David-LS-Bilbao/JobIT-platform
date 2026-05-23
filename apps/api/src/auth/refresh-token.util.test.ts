import { describe, expect, it } from "vitest";

import {
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken
} from "./refresh-token.util.js";

describe("refresh-token.util", () => {
  it("generateRefreshToken(): returns a 64-char hex string", () => {
    const token = generateRefreshToken();

    expect(typeof token).toBe("string");
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generateRefreshToken(): returns different values on each call", () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();

    expect(token1).not.toBe(token2);
  });

  it("hashRefreshToken(): returns a 64-char hex string", () => {
    const hash = hashRefreshToken("any-token-value");

    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashRefreshToken(): is deterministic for the same input", () => {
    const token = "same-token-value";

    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it("verifyRefreshToken(): returns true when token matches its hash", () => {
    const token = generateRefreshToken();
    const hash = hashRefreshToken(token);

    expect(verifyRefreshToken(token, hash)).toBe(true);
  });

  it("verifyRefreshToken(): returns false when token does not match", () => {
    const token = generateRefreshToken();
    const hash = hashRefreshToken("different-token-value");

    expect(verifyRefreshToken(token, hash)).toBe(false);
  });
});
