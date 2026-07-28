import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

import { formatSeedFailure, runInternalSeed } from "../src/jobs/internal-seed.service.js";

/**
 * Entrypoint fino (Sprint 23 — DATA-04). El dataset, la lógica de
 * siembra/actualización y el formateo cerrado de fallos viven en
 * `internal-seed.service.ts` (testeable sin PostgreSQL); aquí solo se
 * entrega el entorno y la factory del cliente, y se informa un resumen o un
 * fallo ya sanitizados.
 */
async function main(): Promise<void> {
  const summary = await runInternalSeed({
    env: process.env,
    createClient: () => new PrismaClient()
  });
  console.log(
    `Seed completado: created=${summary.created} updated=${summary.updated} total=${summary.total}`
  );
}

// Ejecuta `main()` solo cuando el fichero se invoca directamente (p. ej.
// `tsx prisma/seed.ts`), nunca al ser importado por otro módulo.
const invokedPath = process.argv[1];
const isDirectExecution = invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error: unknown) => {
    console.error(formatSeedFailure(error));
    process.exitCode = 1;
  });
}
