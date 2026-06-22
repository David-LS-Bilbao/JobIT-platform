import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, "../../");

const prismaBin =
  process.platform === "win32"
    ? "node_modules\\.bin\\prisma"
    : "node_modules/.bin/prisma";

export async function setup(): Promise<void> {
  const dbUrl = process.env["DATABASE_URL_TEST"] ?? process.env["DATABASE_URL"] ?? "";
  execSync(`${prismaBin} migrate deploy`, {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: dbUrl } as NodeJS.ProcessEnv,
    stdio: "inherit"
  });
}

export async function truncateTables(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "User", "RefreshToken", "CandidateProfile", "Skill", "Experience", "Education", "Project", "Link", "JobPreferences" RESTART IDENTITY CASCADE`
  );
}
