import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

// Almacenamiento local MVP. Ruta estable en dev (src) y build (dist): ../../ desde
// `profile/` apunta siempre a la raíz de `apps/api`.
export const UPLOADS_ROOT = resolve(currentDir, "../../uploads");
export const AVATAR_DIR = join(UPLOADS_ROOT, "avatars");

export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedAvatarMime = (typeof ALLOWED_AVATAR_MIME)[number];

/** Tamaño máximo de avatar: 2 MB. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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
