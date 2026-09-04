import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

// Almacenamiento local MVP. Ruta estable en dev (src) y build (dist): ../../ desde
// `profile/` apunta siempre a la raíz de `apps/api`.
export const UPLOADS_ROOT = resolve(currentDir, "../../uploads");
export const AVATAR_DIR = join(UPLOADS_ROOT, "avatars");

export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedAvatarMime = (typeof ALLOWED_AVATAR_MIME)[number];

/** Tamaño máximo de avatar: 5 MB (Sprint 17C; antes 2 MB). */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION: Record<AllowedAvatarMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export function isAllowedAvatarMime(mime: string): mime is AllowedAvatarMime {
  return (ALLOWED_AVATAR_MIME as readonly string[]).includes(mime);
}

/**
 * Comprueba los magic bytes del buffer y devuelve el MIME real detectado (o null).
 * Defensa en profundidad: no nos fiamos del Content-Type declarado por el cliente
 * y rechazamos SVG/GIF o ficheros con tipo/extensión falsificados.
 */
export function sniffImageMime(buffer: Buffer): AllowedAvatarMime | null {
  if (buffer.length < 12) return null;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Guarda el buffer ya validado con un nombre aleatorio y seguro (nunca el nombre
 * original) y separación por usuario. Devuelve la URL pública relativa
 * (`/uploads/avatars/<archivo>`), sin exponer rutas absolutas internas.
 */
export async function saveAvatarImage(
  buffer: Buffer,
  mime: AllowedAvatarMime,
  userId: string
): Promise<string> {
  await mkdir(AVATAR_DIR, { recursive: true });
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "user";
  const filename = `${safeUser}_${randomUUID()}.${MIME_EXTENSION[mime]}`;
  const destination = join(AVATAR_DIR, filename);
  // Guardia anti path traversal: el destino debe quedar dentro de AVATAR_DIR.
  if (dirname(destination) !== AVATAR_DIR) {
    throw new Error("Invalid avatar destination path.");
  }
  await writeFile(destination, buffer);
  return `/uploads/avatars/${filename}`;
}

/** Prefijo publico bajo el que se sirven los avatares (ver `app.ts`). */
export const AVATAR_URL_PREFIX = "/uploads/avatars/";

/**
 * Traduce la URL publica almacenada en base de datos a una ruta absoluta segura
 * dentro de `AVATAR_DIR`, o devuelve `null` si no es una ruta de avatar valida.
 *
 * NUNCA debe invocarse con una ruta suministrada por el cliente: la entrada
 * legitima es `CandidateProfile.avatarUrl`. Aun asi se valida en profundidad,
 * porque el borrado fisico es una operacion destructiva y no puede depender de
 * la confianza en el origen del dato.
 */
export function resolveAvatarFilePath(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl || !avatarUrl.startsWith(AVATAR_URL_PREFIX)) return null;

  const filename = avatarUrl.slice(AVATAR_URL_PREFIX.length);
  // Un nombre vacio, con separadores o con segmentos relativos no es un avatar
  // nuestro: `saveAvatarImage` solo genera `<user>_<uuid>.<ext>`.
  if (!filename || filename !== basename(filename) || filename === "." || filename === "..") {
    return null;
  }

  const candidate = join(AVATAR_DIR, filename);
  // Guardia anti path traversal simetrica a la de `saveAvatarImage`.
  if (dirname(candidate) !== AVATAR_DIR) return null;

  return candidate;
}

/**
 * Borra el fichero fisico de un avatar. Idempotente: un fichero ya ausente
 * (`ENOENT`) no es un error, porque el ciclo de vida de la cuenta no puede
 * romperse por una limpieza que ya ocurrio.
 *
 * Devuelve `true` si habia fichero y se borro; `false` si no habia nada que
 * borrar o la URL no correspondia a un avatar valido. Cualquier otro error de
 * sistema de ficheros se propaga: la decision de tolerarlo o no pertenece a
 * quien invoca, que conoce el contexto transaccional.
 */
export async function deleteAvatarImage(avatarUrl: string | null | undefined): Promise<boolean> {
  const filePath = resolveAvatarFilePath(avatarUrl);
  if (!filePath) return false;

  try {
    await unlink(filePath);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}
