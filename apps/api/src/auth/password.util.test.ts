import { describe, expect, it } from "vitest";

import { hash, verify } from "./password.util.js";

describe("password.util", () => {
  it("hash(): returns a string distinct from the original password", async () => {
    const password = "TestPassword123";
    const hashed = await hash(password);

    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(password);
  });

  it("hash(): generates different hashes for the same input on different calls", async () => {
    const password = "TestPassword123";
    const hash1 = await hash(password);
    const hash2 = await hash(password);

    expect(hash1).not.toBe(hash2);
  });

  it("verify(): returns true when comparing password with its own hash", async () => {
    const password = "TestPassword123";
    const hashed = await hash(password);

    expect(await verify(password, hashed)).toBe(true);
  });

  it("verify(): returns false when comparing password with a different hash", async () => {
    const password = "TestPassword123";
    const otherHash = await hash("DifferentPassword456");

    expect(await verify(password, otherHash)).toBe(false);
  });
});
