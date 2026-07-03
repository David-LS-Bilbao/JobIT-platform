/**
 * Ingesta controlada de ofertas Greenhouse (ATS público, por empresa) para dev/staging.
 *
 * Backend-only y MANUAL: no expone endpoint ni se invoca desde requests del candidato;
 * alimenta la DB local que consulta `GET /api/jobs`. No hace scraping, NO usa secretos (el
 * Job Board API es público) y NO borra el seed ni datos existentes (upsert idempotente por
 * `(source, externalId)`).
 *
 * Uso (desde la raíz del repo):
 *   pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-greenhouse.ts
 *
 * Parámetros por entorno (opcionales):
 *   ING_GREENHOUSE_TOKENS   CSV para limitar a un subconjunto de la lista curada.
 *   ING_LIMIT               Máximo de ofertas por board (1..100).
 *
 * La lista curada de empresas vive versionada en `greenhouse.companies.ts` (no en `.env`).
 * Base URL: `GREENHOUSE_API_BASE_URL` (opcional; default público de Greenhouse).
 */
import { env } from "../../config/env.js";
import {
  GREENHOUSE_COMPANIES,
  selectGreenhouseCompanies
} from "../external/greenhouse/greenhouse.companies.js";
import { ingestGreenhouseBoards } from "../external/greenhouse/greenhouse.ingest.service.js";

/** Acota `ING_LIMIT` a un entero en [1, 100]; ausente/inválido → undefined (sin cap). */
export function clampIngestLimit(value: string | undefined): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return Math.min(parsed, 100);
}

async function main(): Promise<void> {
  const companies = selectGreenhouseCompanies(
    GREENHOUSE_COMPANIES,
    process.env.ING_GREENHOUSE_TOKENS
  );

  if (companies.length === 0) {
    console.error(
      "[ingest-greenhouse] No hay boards curados que ingerir " +
        "(GREENHOUSE_COMPANIES vacío o ING_GREENHOUSE_TOKENS sin coincidencias). " +
        "Aborta sin llamar a Greenhouse."
    );
    process.exit(1);
  }

  const limitPerBoard = clampIngestLimit(process.env.ING_LIMIT);
  const summary = await ingestGreenhouseBoards(
    companies,
    limitPerBoard === undefined ? {} : { limitPerBoard }
  );

  // Resumen sin datos sensibles (el endpoint es público; no hay key).
  console.log(
    `[ingest-greenhouse] boards=${companies.length} base="${env.GREENHOUSE_API_BASE_URL}" ` +
      `→ processed=${summary.boardsProcessed} failed=${summary.boardsFailed} ` +
      `fetched=${summary.fetched} normalized=${summary.normalized} ` +
      `created=${summary.created} updated=${summary.updated} skipped=${summary.skipped}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    const name = err instanceof Error ? err.name : "Error";
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ingest-greenhouse] FAILED: ${name} - ${message}`);
    process.exit(1);
  });
