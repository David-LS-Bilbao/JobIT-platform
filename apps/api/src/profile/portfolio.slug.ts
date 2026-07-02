// Helpers de slug para JobIT Portfolio V1. Sin dependencias externas.

export const SLUG_MIN = 3;
export const SLUG_MAX = 60;

// Palabras reservadas: colisionan con rutas del producto o son ambiguas.
// Lista ampliable; mínimo exigido por la spec incluido.
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "login",
  "logout",
  "register",
  "dashboard",
  "profile",
  "portfolio",
  "settings",
  "jobs",
  "saved-jobs",
  "match",
  "public",
  "u",
  "assets",
  "static",
  "uploads",
  "health",
  "about",
  "help",
  "terms",
  "privacy",
  "support",
  "null",
  "undefined"
]);

/**
 * Normaliza un texto a slug: minúsculas, sin acentos, espacios/otros → guiones,
 * guiones colapsados y sin guiones al inicio/final.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/** True si el slug ya está en forma canónica válida (formato, longitud, no reservado). */
export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= SLUG_MIN &&
    slug.length <= SLUG_MAX &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    !isReservedSlug(slug)
  );
}

/**
 * Slug base para la creación inicial. Deriva de nombre/apellidos; si no hay
 * nombre suficiente, usa un fragmento estable del userId (sin exponerlo entero).
 * No garantiza unicidad: eso lo resuelve el servicio.
 */
export function baseSlugFromName(
  firstName: string | null,
  lastName: string | null,
  userId: string
): string {
  const fromName = slugify([firstName, lastName].filter(Boolean).join(" "))
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  if (fromName.length >= SLUG_MIN && !isReservedSlug(fromName)) {
    return fromName;
  }
  const fragment = userId.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8) || "0000";
  return `user-${fragment}`;
}
