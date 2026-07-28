import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { UnsafeDatabaseTargetError } from "../lib/database-safety.js";
import { runTestDatabaseGlobalSetup, truncateTables, type TestDatabaseMigrator } from "./setup.js";

/**
 * Prueba, sin PostgreSQL ni Prisma real, que `apps/api/src/tests/setup.ts`:
 *  - ya no tiene el fallback `DATABASE_URL_TEST ?? DATABASE_URL`;
 *  - valida el destino antes de invocar el migrador;
 *  - `truncateTables` valida el destino antes de ejecutar `$executeRawUnsafe`.
 *
 * Todas las credenciales/hosts de este archivo son ficticios y no operativos.
 */

const FAKE_HOST = "invalid.local";
const FAKE_USER = "fake-user";
const FAKE_PASSWORD = "fake-password";
const fakeUrl = (name: string): string =>
  `postgresql://${FAKE_USER}:${FAKE_PASSWORD}@${FAKE_HOST}:5432/${name}`;

const TEST_URL = fakeUrl("jobit_test");
const DEV_URL = fakeUrl("jobit_dev");
const UNKNOWN_URL = fakeUrl("customer_data");
const AMBIGUOUS_URL = fakeUrl("jobit_test_prod");

describe("runTestDatabaseGlobalSetup", () => {
  it("never calls the migrator when DATABASE_URL_TEST is missing", () => {
    const migrate = vi.fn();
    expect(() => runTestDatabaseGlobalSetup({}, migrate)).toThrow(UnsafeDatabaseTargetError);
    expect(migrate).not.toHaveBeenCalled();
  });

  it("never calls the migrator when DATABASE_URL_TEST is empty", () => {
    const migrate = vi.fn();
    expect(() => runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: "  " }, migrate)).toThrow(
      UnsafeDatabaseTargetError
    );
    expect(migrate).not.toHaveBeenCalled();
  });

  it("never calls the migrator when the target classifies as DEVELOPMENT", () => {
    const migrate = vi.fn();
    expect(() => runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: DEV_URL }, migrate)).toThrow(
      UnsafeDatabaseTargetError
    );
    expect(migrate).not.toHaveBeenCalled();
  });

  it("never calls the migrator when the target classifies as UNKNOWN", () => {
    const migrate = vi.fn();
    expect(() => runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: UNKNOWN_URL }, migrate)).toThrow(
      UnsafeDatabaseTargetError
    );
    expect(migrate).not.toHaveBeenCalled();
  });

  it("never calls the migrator when the target is AMBIGUOUS", () => {
    const migrate = vi.fn();
    expect(() =>
      runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: AMBIGUOUS_URL }, migrate)
    ).toThrow(UnsafeDatabaseTargetError);
    expect(migrate).not.toHaveBeenCalled();
  });

  // Alias explícito y seguro: los workers de Vitest asignan DATABASE_URL =
  // DATABASE_URL_TEST a propósito (`apps/api/vitest.config.ts`) para el
  // PrismaClient compartido. Coincidir se permite solo cuando el destino
  // clasifica como TEST; no es un fallback (DATABASE_URL nunca sustituye a la
  // variable dedicada).
  it("allows the safe TEST alias and calls the migrator exactly once with the validated URL", () => {
    const migrate = vi.fn();
    runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: TEST_URL, DATABASE_URL: TEST_URL }, migrate);
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(migrate).toHaveBeenCalledWith(TEST_URL);
  });

  it("never calls the migrator when the alias resolves to a non-TEST target", () => {
    const migrate = vi.fn();
    expect(() =>
      runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: DEV_URL, DATABASE_URL: DEV_URL }, migrate)
    ).toThrow(UnsafeDatabaseTargetError);
    expect(migrate).not.toHaveBeenCalled();
  });

  it("calls the migrator exactly once for a valid TEST target", () => {
    const migrate = vi.fn();
    runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: TEST_URL }, migrate);
    expect(migrate).toHaveBeenCalledTimes(1);
  });

  it("passes the validated URL to the migrator", () => {
    const migrate = vi.fn();
    runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: TEST_URL }, migrate);
    expect(migrate).toHaveBeenCalledWith(TEST_URL);
  });

  it("never uses DATABASE_URL as a fallback when DATABASE_URL_TEST is missing", () => {
    const migrate = vi.fn();
    expect(() => runTestDatabaseGlobalSetup({ DATABASE_URL: TEST_URL }, migrate)).toThrow(
      UnsafeDatabaseTargetError
    );
    expect(migrate).not.toHaveBeenCalled();
  });

  it("only invokes the effect after validation succeeds (order proof)", () => {
    const calls: string[] = [];
    const migrate: TestDatabaseMigrator = () => {
      calls.push("migrate");
    };
    runTestDatabaseGlobalSetup({ DATABASE_URL_TEST: TEST_URL }, migrate);
    expect(calls).toEqual(["migrate"]);
  });
});

describe("truncateTables", () => {
  function fakePrisma(executeRawUnsafe = vi.fn().mockResolvedValue(0)) {
    return {
      prisma: { $executeRawUnsafe: executeRawUnsafe } as unknown as PrismaClient,
      executeRawUnsafe
    };
  }

  it("never executes TRUNCATE when the target is unsafe", async () => {
    const { prisma, executeRawUnsafe } = fakePrisma();
    await expect(truncateTables(prisma, { DATABASE_URL_TEST: DEV_URL })).rejects.toThrow(
      UnsafeDatabaseTargetError
    );
    expect(executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("executes TRUNCATE exactly once for a valid TEST target", async () => {
    const { prisma, executeRawUnsafe } = fakePrisma();
    await truncateTables(prisma, { DATABASE_URL_TEST: TEST_URL });
    expect(executeRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it("validates before executing the raw SQL (order proof)", async () => {
    const calls: string[] = [];
    const executeRawUnsafe = vi.fn().mockImplementation(async () => {
      calls.push("truncate");
      return 0;
    });
    const prisma = { $executeRawUnsafe: executeRawUnsafe } as unknown as PrismaClient;
    await truncateTables(prisma, { DATABASE_URL_TEST: TEST_URL });
    expect(calls).toEqual(["truncate"]);
  });

  it("never leaks the URL or fake credentials in a rejection", async () => {
    const { prisma } = fakePrisma();
    try {
      await truncateTables(prisma, { DATABASE_URL_TEST: DEV_URL });
      expect.unreachable("expected truncateTables to reject");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain(FAKE_USER);
      expect(message).not.toContain(FAKE_PASSWORD);
      expect(message).not.toContain(DEV_URL);
    }
  });
});

describe("setup.ts regression: no insecure fallback", () => {
  it("does not contain the removed DATABASE_URL_TEST ?? DATABASE_URL fallback pattern (static defense-in-depth)", () => {
    const source = readFileSync(fileURLToPath(new URL("./setup.ts", import.meta.url)), "utf8");
    expect(source).not.toMatch(/DATABASE_URL_TEST"\]\s*\?\?\s*process\.env\["DATABASE_URL"\]/);
  });
});
