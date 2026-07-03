/**
 * Lista curada de boards públicos de Greenhouse a ingerir (por empresa).
 *
 * El Job Board API es por empresa (`board_token`) y el payload del job NO incluye la
 * empresa: `company` se toma de aquí. Esta lista es una DECISIÓN DE PRODUCTO: mantenerla
 * pequeña y revisada en PR. No se inventan empresas; se inicia vacía hasta que producto
 * apruebe los empleadores tech (ES/remoto) concretos. Los board tokens son públicos (no
 * secretos), por eso viven versionados aquí y no en `.env`.
 */
export interface GreenhouseCompany {
  /** Board URL token público de Greenhouse (el de la careers page de la empresa). */
  boardToken: string;
  /** Nombre de empresa a mostrar (el job de Greenhouse no lo trae). */
  company: string;
}

/**
 * Boards curados por producto. Vacío por defecto (no se inventan empresas). Ejemplo de
 * forma (rellenar solo con empleadores aprobados):
 *   { boardToken: "example", company: "Example Inc." }
 */
export const GREENHOUSE_COMPANIES: GreenhouseCompany[] = [];

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
