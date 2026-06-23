/**
 * Script manual de ingesta de Jooble (Sprint 03.5 — Fase 5A).
 *
 * Backend-only y manual/controlado. NO se invoca desde routers, cron, scheduler
 * ni desde requests de candidatos. Ejecuta una ingesta real usando el servicio
 * `ingestJoobleJobs` existente.
 *
 * Uso:
 *   pnpm --filter @jobit/api exec tsx scripts/ingest-jooble.ts \
 *     --keywords "node" --location "Madrid" --page 1 --limit 20
 *
 * La API key (`JOOBLE_API_KEY`) se lee SOLO del entorno backend a través del
 * servicio; este script nunca la lee, imprime ni la incluye en mensajes/URLs.
 *
 * Nota: vive fuera de `src/`, por lo que (como `prisma/seed.ts`) no entra en
 * `typecheck`/`build`; se ejecuta directamente con `tsx`.
 */
import {
  JoobleConfigError,
  JoobleHttpError,
  JoobleResponseError,
  JoobleTimeoutError,
  type JoobleSearchParams
} from "../src/jobs/external/jooble/jooble.client.js";
import { ingestJoobleJobs } from "../src/jobs/external/jooble/jooble.ingest.service.js";
import { prisma } from "../src/lib/prisma.js";

/** Error de uso de la CLI (argumentos inválidos o faltantes). */
class UsageError extends Error {}

interface CliArgs {
  keywords: string;
  location?: string;
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function printUsage(): void {
  console.log(
    [
      "Uso:",
      "  tsx scripts/ingest-jooble.ts --keywords <texto> [--location <texto>] [--page <n>] [--limit <n>]",
      "",
      "Ingesta manual y controlada de ofertas de Jooble (backend-only).",
      "",
      "Opciones:",
      "  --keywords <texto>   Términos de búsqueda (requerido, no vacío).",
      "  --location <texto>   Ubicación (opcional).",
      `  --page <entero>      Página, entero positivo (default: ${DEFAULT_PAGE}).`,
      `  --limit <entero>     Resultados por página, 1-${MAX_LIMIT} (default: ${DEFAULT_LIMIT}).`,
      "  --help, -h           Muestra esta ayuda.",
      "",
      "Ejemplo:",
      '  pnpm --filter @jobit/api exec tsx scripts/ingest-jooble.ts --keywords "node" --location "Madrid" --page 1 --limit 20',
      "",
      "La API key (JOOBLE_API_KEY) se lee solo del entorno backend; nunca se imprime."
    ].join("\n")
  );
}

/** Devuelve el valor de un flag o lanza si falta (o si es otro flag). */
function requireValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("--")) {
    throw new UsageError(`Falta el valor de ${flag}`);
  }
  return value;
}

/** Devuelve un entero a partir del valor de un flag o lanza si no es entero. */
function requireIntValue(flag: string, value: string | undefined): number {
  const raw = requireValue(flag, value);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new UsageError(`${flag} debe ser un entero`);
  }
  return parsed;
}

function parseArgs(argv: readonly string[]): CliArgs {
  let keywords: string | undefined;
  let location: string | undefined;
  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    switch (token) {
      case "--keywords":
        keywords = requireValue(token, next);
        i += 1;
        break;
      case "--location":
        location = requireValue(token, next);
        i += 1;
        break;
      case "--page":
        page = requireIntValue(token, next);
        i += 1;
        break;
      case "--limit":
        limit = requireIntValue(token, next);
        i += 1;
        break;
      default:
        throw new UsageError(`Argumento desconocido: ${token ?? ""}`);
    }
  }

  const trimmedKeywords = keywords?.trim();
  if (!trimmedKeywords) {
    throw new UsageError("--keywords es obligatorio y no puede estar vacío");
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new UsageError("--page debe ser un entero positivo");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new UsageError(`--limit debe ser un entero entre 1 y ${MAX_LIMIT}`);
  }

  const trimmedLocation = location?.trim();
  return {
    keywords: trimmedKeywords,
    ...(trimmedLocation ? { location: trimmedLocation } : {}),
    page,
    limit
  };
}

/** Imprime un mensaje de error seguro (sin key) y fija exitCode = 1. */
function reportIngestError(err: unknown): void {
  process.exitCode = 1;
  if (err instanceof JoobleConfigError) {
    console.error(
      "Error: falta JOOBLE_API_KEY en el entorno backend. Configúrala en tu .env (sin commitearla)."
    );
    return;
  }
  if (err instanceof JoobleHttpError) {
    console.error(`Error: Jooble respondió con HTTP ${err.status}.`);
    return;
  }
  if (err instanceof JoobleTimeoutError) {
    console.error("Error: la petición a Jooble superó el tiempo de espera.");
    return;
  }
  if (err instanceof JoobleResponseError) {
    console.error("Error: la respuesta de Jooble no cumple el contrato esperado.");
    return;
  }
  console.error("Error inesperado durante la ingesta de Jooble.");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    return;
  }

  let args: CliArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`Error: ${err.message}\n`);
      printUsage();
      process.exitCode = 2;
      return;
    }
    throw err;
  }

  const params: JoobleSearchParams = {
    keywords: args.keywords,
    page: args.page,
    resultOnPage: args.limit,
    ...(args.location ? { location: args.location } : {})
  };

  console.log("Ingesta Jooble — parámetros:");
  console.log(`  keywords: ${args.keywords}`);
  if (args.location) {
    console.log(`  location: ${args.location}`);
  }
  console.log(`  page: ${args.page}`);
  console.log(`  limit: ${args.limit}`);

  try {
    const summary = await ingestJoobleJobs(params);
    console.log("Resumen de ingesta:");
    console.log(`  fetched: ${summary.fetched}`);
    console.log(`  normalized: ${summary.normalized}`);
    console.log(`  skipped: ${summary.skipped}`);
    console.log(`  created: ${summary.created}`);
    console.log(`  updated: ${summary.updated}`);
  } catch (err) {
    reportIngestError(err);
  }
}

try {
  await main();
} catch {
  process.exitCode = 1;
  console.error("Error inesperado.");
} finally {
  // Se espera explícitamente el cierre de la conexión Prisma antes de salir.
  await prisma.$disconnect();
}
