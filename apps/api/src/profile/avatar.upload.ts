import multer from "multer";

import { MAX_AVATAR_BYTES, isAllowedAvatarMime } from "./avatar.storage.js";

/**
 * Middleware multer para `POST /api/profile/me/avatar`.
 *
 * - `memoryStorage`: bufferiza en memoria (tope `MAX_AVATAR_BYTES`) sin tocar
 *   disco hasta validar; evita ficheros parciales.
 * - `limits.fileSize`: multer aborta con `LIMIT_FILE_SIZE` si se supera 2 MB.
 * - `fileFilter`: rechaza MIME fuera del allowlist antes de leer el cuerpo.
 */
export const avatarMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedAvatarMime(file.mimetype)) {
      cb(null, true);
      return;
    }
    const error = new Error("Unsupported media type.") as Error & { code: string };
    error.code = "UNSUPPORTED_TYPE";
    cb(error);
  }
});
