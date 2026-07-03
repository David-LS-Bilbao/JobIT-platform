/**
 * Ingesta controlada de ofertas Jooble para dev/staging.
 *
 * Backend-only y MANUAL: no expone endpoint ni se invoca desde requests del
 * candidato; alimenta la DB local que consulta `GET /api/jobs`. No hace scraping,
 * no llama a LinkedIn, no crea usuarios y NO borra el seed ni datos existentes
 * (upsert idempotente por `(source, externalId)`).
 *
 * Uso (desde la raíz del repo):
 *   JOOBLE_API_KEY=xxx ING_LOCATION=Bilbao \
 *     pnpm --filter @jobit/api exec tsx src/jobs/scripts/ingest-jooble.ts
 *
 * Parámetros por entorno (con defaults):
 *   ING_KEYWORDS   (default "developer")
 *   ING_LOCATION   (default "España")
 *   ING_LIMIT      (default 20, acotado 1..50)
 *
 * Host de Jooble: `JOOBLE_API_BASE_URL` (opcional). Para keys regionales de España
 * usar `https://es.jooble.org/api`. La `JOOBLE_API_KEY` viaja solo servidor→Jooble
 * y NUNCA se imprime aquí.
 */
import { env } from "../../config/env.js";
import { ingestJoobleJobs } from "../external/jooble/jooble.ingest.service.js";

/** Acota `ING_LIMIT` a un entero en [1, 50]; ante valor inválido, usa 20. */
export function clampIngestLimit(value: string | undefined): number {
  const parsed = Number(value ?? 20);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 20;
  }
  return Math.min(parsed, 50);
}

async function main(): Promise<void> {
  if (!env.JOOBLE_API_KEY) {
    console.error("[ingest-jooble] JOOBLE_API_KEY no está configurada (apps/api/.env). Aborta sin llamar a Jooble.");
    process.exit(1);
  }

  const keywords = process.env.ING_KEYWORDS?.trim() || "developer";
  const location = process.env.ING_LOCATION?.trim() || "España";
  const resultOnPage = clampIngestLimit(process.env.ING_LIMIT);

  const summary = await ingestJoobleJobs({ keywords, location, resultOnPage });

  // Resumen sin secretos (nunca la key ni la URL con la key).
  console.log(
    `[ingest-jooble] keywords="${keywords}" location="${location}" base="${env.JOOBLE_API_BASE_URL}" ` +
      `→ fetched=${summary.fetched} normalized=${summary.normalized} ` +
      `created=${summary.created} updated=${summary.updated} skipped=${summary.skipped}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // El cliente Jooble ya evita incluir la key en sus errores; aquí solo tipo/mensaje.
    const name = err instanceof Error ? err.name : "Error";
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ingest-jooble] FAILED: ${name} - ${message}`);
    process.exit(1);
  });
