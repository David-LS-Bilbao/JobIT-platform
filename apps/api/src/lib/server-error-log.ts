/**
 * Log estructurado de errores de servidor, por ALLOWLIST.
 *
 * Spec/finding: `AUDIT05-OPS-PROD-ERROR-LOG-01`.
 *
 * Antes de esta unidad, un `500` en staging o produccion no dejaba ninguna traza
 * (`console.error` solo corria fuera de produccion), de modo que un fallo real
 * era indiagnosticable sin exponer detalle al cliente. Aqui se registra en TODOS
 * los entornos, pero solo un conjunto cerrado de campos.
 *
 * Regla estructural: los campos que salen se nombran uno a uno. Nunca se
 * serializa el objeto de error, ni `req`, ni `res`, ni ningun payload. Un campo
 * nuevo no puede colarse por omision.
 *
 * NUNCA se registra: `Authorization`, `Cookie`, contrasenas, cuerpo de peticion,
 * query string cruda, access token, refresh token, `tokenHash`, `familyId`,
 * `DATABASE_URL` ni consultas o inputs crudos de Prisma. El mensaje del error se
 * excluye deliberadamente: los errores de Prisma arrastran parametros de consulta.
 */

/**
 * Segmentos estaticos de la superficie HTTP. Cualquier otro segmento se
 * enmascara: los identificadores y, sobre todo, los slugs de portfolio elegidos
 * por la persona usuaria pueden contener su nombre y no deben acabar en un log.
 */
const STATIC_PATH_SEGMENTS = new Set([
  "api",
  "auth",
  "register",
  "login",
  "logout",
  "refresh",
  "me",
  "export",
  "profile",
  "portfolio",
  "publish",
  "unpublish",
  "avatar",
  "skills",
  "experiences",
  "education",
  "projects",
  "links",
  "preferences",
  "matches",
  "match",
  "jobs",
  "saved-jobs",
  "dashboard",
  "public",
  "portfolios",
  "health",
  "uploads",
  "avatars"
]);

/**
 * Convierte una ruta concreta en un identificador de ruta seguro.
 *
 * `/api/public/portfolios/ana-perez` → `/api/public/portfolios/:param`
 * `/api/jobs/9f1c.../match`          → `/api/jobs/:param/match`
 *
 * Se enmascara por defecto: solo sobrevive lo que esta explicitamente permitido.
 */
export function sanitizeRoutePath(path: string): string {
  const [withoutQuery = ""] = path.split("?");
  const segments = withoutQuery.split("/").filter((segment) => segment.length > 0);
  if (segments.length === 0) return "/";

  return `/${segments
    .map((segment) => (STATIC_PATH_SEGMENTS.has(segment.toLowerCase()) ? segment.toLowerCase() : ":param"))
    .join("/")}`;
}

export interface ServerErrorLogEntry {
  /** Identificador de correlacion de la peticion. Aleatorio, sin datos personales. */
  requestId: string;
  method: string;
  /** Ruta ya saneada por `sanitizeRoutePath`. */
  path: string;
  status: number;
  /** Categoria interna estable (p. ej. `INTERNAL_ERROR`, `STORAGE_ERROR`). */
  code: string;
  /** Nombre de la clase de error, nunca su mensaje. */
  errorName?: string;
}

/** Forma exacta del registro emitido. Se construye campo a campo, sin spread. */
export interface ServerErrorLogRecord {
  timestamp: string;
  level: "error";
  requestId: string;
  method: string;
  path: string;
  status: number;
  code: string;
  errorName: string;
}

/**
 * Construye el registro. Separado de la emision para poder verificarlo en test
 * sin depender de la consola.
 */
export function buildServerErrorLogRecord(
  entry: ServerErrorLogEntry,
  now: Date = new Date()
): ServerErrorLogRecord {
  return {
    timestamp: now.toISOString(),
    level: "error",
    requestId: entry.requestId,
    method: entry.method,
    path: sanitizeRoutePath(entry.path),
    status: entry.status,
    code: entry.code,
    // El NOMBRE de la clase de error es seguro y util para clasificar; su
    // mensaje no lo es (Prisma incluye parametros de consulta) y no se registra.
    errorName: entry.errorName ?? "UnknownError"
  };
}

/**
 * Emite el registro como una linea JSON en `stderr`. Sin dependencias nuevas:
 * una linea JSON por evento es directamente ingestable por cualquier recolector
 * y no exige elegir hoy una libreria de logging.
 */
export function logServerError(entry: ServerErrorLogEntry, now?: Date): void {
  console.error(JSON.stringify(buildServerErrorLogRecord(entry, now)));
}
