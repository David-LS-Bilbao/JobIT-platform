import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";

import { assertTestDatabaseUrl, type EnvLike } from "../lib/database-safety.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, "../../");

const prismaBin =
  process.platform === "win32"
    ? "node_modules\\.bin\\prisma"
    : "node_modules/.bin/prisma";

export type TestDatabaseMigrator = (databaseUrl: string) => void;

/**
 * Valida el destino antes de invocar el migrador inyectado. Si
 * `assertTestDatabaseUrl` lanza, `migrate` nunca se llama — no hay fallback
 * hacia `DATABASE_URL`. Exportada para poder probarla sin PostgreSQL real
 * (ver `setup-safety.test.ts`).
 */
export function runTestDatabaseGlobalSetup(env: EnvLike, migrate: TestDatabaseMigrator): void {
  assertTestDatabaseUrl(env);
  // Si la línea anterior no lanzó, DATABASE_URL_TEST es una URL de test
  // validada y no vacía: es seguro leerla para pasarla al migrador.
  migrate(env["DATABASE_URL_TEST"] as string);
}

export async function setup(): Promise<void> {
  runTestDatabaseGlobalSetup(process.env, (databaseUrl) => {
    execSync(`${prismaBin} migrate deploy`, {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv,
      stdio: "inherit"
    });
  });
}

/**
 * Guarda de defensa en profundidad: valida el destino antes de truncar.
 * No sustituye la validación de `globalSetup`; `env` recibe `process.env`
 * por defecto para no cambiar la firma que ya usan todas las suites.
 */
export async function truncateTables(prisma: PrismaClient, env: EnvLike = process.env): Promise<void> {
  assertTestDatabaseUrl(env);
  await prisma.$executeRawUnsafe(
    `TRUNCATE "SavedJob", "User", "RefreshToken", "CandidateProfile", "Skill", "Experience", "Education", "Project", "Link", "JobPreferences", "PortfolioSettings", "Job" RESTART IDENTITY CASCADE`
  );
}
