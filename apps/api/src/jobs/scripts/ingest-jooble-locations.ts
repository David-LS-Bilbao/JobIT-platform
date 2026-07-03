/**
 * Ingesta controlada de ofertas Jooble por MÚLTIPLES ubicaciones (dev/staging).
 *
 * Backend-only y MANUAL: no expone endpoint ni se invoca desde requests; alimenta la
 * DB local que consulta `GET /api/jobs`. No hace scraping, no llama a LinkedIn, no crea
 * usuarios y NO borra el seed ni datos existentes (upsert idempotente). Ejecuta en serie.
 *
 * Uso (desde la raíz del repo):
 *   JOOBLE_API_KEY=xxx JOOBLE_API_BASE_URL=https://es.jooble.org/api \
 *     ING_LOCATIONS="Bilbao,Madrid,Barcelona,Remoto,España" \
 *     pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble-locations.ts
 *
 * Parámetros por entorno (con defaults):
 *   ING_LOCATIONS  CSV de ubicaciones (fallback a ING_LOCATION; default "España")
 *   ING_KEYWORDS   (default "developer")
 *   ING_LIMIT      por ubicación (default 20, acotado 1..50)
 *
 * Exit code: 0 si todas las ubicaciones OK; 1 si alguna falló (o fallo de config global).
 * La `JOOBLE_API_KEY` viaja solo servidor→Jooble y NUNCA se imprime aquí.
 */
import { env } from "../../config/env.js";
import { ingestJoobleJobs } from "../external/jooble/jooble.ingest.service.js";
import {
  orchestrateIngestion,
  parseLocations,
  resolveKeywords,
  resolveLimit,
  type LocationIngestResult
} from "./jooble-locations.js";

async function main(): Promise<void> {
  if (!env.JOOBLE_API_KEY) {
    console.error("[ingest-jooble-locations] JOOBLE_API_KEY no está configurada (apps/api/.env). Aborta sin llamar a Jooble.");
    process.exit(1);
  }

  const locations = parseLocations(process.env);
  const keywords = resolveKeywords(process.env);
  const resultOnPage = resolveLimit(process.env);

  // Cabecera sin secretos (base URL no contiene la key).
  console.log(
    `[ingest-jooble-locations] keywords="${keywords}" base="${env.JOOBLE_API_BASE_URL}" ` +
      `limit=${resultOnPage} locations=[${locations.join(", ")}]`
  );

  const report = await orchestrateIngestion(
    locations,
    { keywords, resultOnPage },
    (params) => ingestJoobleJobs(params),
    (result: LocationIngestResult) => {
      if (result.ok && result.summary) {
        const s = result.summary;
        console.log(
          `  ✓ ${result.location}: fetched=${s.fetched} normalized=${s.normalized} ` +
            `created=${s.created} updated=${s.updated} skipped=${s.skipped}`
        );
      } else {
        // El error ya viene saneado (sin key) desde la orquestación.
        console.error(`  ✗ ${result.location}: ${result.error}`);
      }
    }
  );

  console.log(
    `[ingest-jooble-locations] DONE locations=${report.totalLocations} ok=${report.succeeded} ` +
      `failed=${report.failed} → fetched=${report.fetched} normalized=${report.normalized} ` +
      `created=${report.created} updated=${report.updated} skipped=${report.skipped}`
  );

  process.exit(report.failed > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
  const name = err instanceof Error ? err.name : "Error";
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[ingest-jooble-locations] FAILED: ${name} - ${message}`);
  process.exit(1);
});
