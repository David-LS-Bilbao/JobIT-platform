/**
 * Product-curated public Greenhouse boards.
 *
 * Review before staging/demo. Board tokens are public, not secrets. No automatic
 * ingestion without explicit operator action.
 *
 * El Job Board API es por empresa (`board_token`) y el payload del job NO incluye la
 * empresa: `company` se toma de aquí. Esta lista es una DECISIÓN DE PRODUCTO: mantenerla
 * pequeña y revisada en PR. No se inventan empresas: cada token debe apuntar a un board
 * público activo de Greenhouse y quedar revisado antes de staging/demo.
 */
export interface GreenhouseCompany {
  /** Board URL token público de Greenhouse (el de la careers page de la empresa). */
  boardToken: string;
  /** Nombre de empresa a mostrar (el job de Greenhouse no lo trae). */
  company: string;
}

export const GREENHOUSE_COMPANIES: GreenhouseCompany[] = [
  { boardToken: "anthropic", company: "Anthropic" },
  { boardToken: "vercel", company: "Vercel" },
  { boardToken: "webflow", company: "Webflow" }
];

/**
 * Filtra la lista curada por un CSV opcional de board tokens (`ING_GREENHOUSE_TOKENS`).
 * Sin CSV (o vacío) → devuelve la lista completa. Función pura (testeable sin la red).
 */
export function selectGreenhouseCompanies(
  all: readonly GreenhouseCompany[],
  tokensCsv: string | undefined
): GreenhouseCompany[] {
  const trimmed = tokensCsv?.trim();
  if (!trimmed) {
    return [...all];
  }
  const wanted = new Set(
    trimmed
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
  );
  if (wanted.size === 0) {
    return [...all];
  }
  return all.filter((company) => wanted.has(company.boardToken));
}
