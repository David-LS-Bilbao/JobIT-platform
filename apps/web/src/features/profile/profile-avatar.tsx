"use client";

import { useState } from "react";

import { resolveProfileImageUrl } from "./profile-api";
import { initialsFrom } from "./profile-format";

/**
 * Avatar del candidato: muestra `avatarUrl` (URL pública) si existe y, si la
 * imagen no existe o falla al cargar, cae a las iniciales. No sube archivos ni
 * hace proxy: solo pinta la URL tal cual. Los estilos se pasan por props para
 * reutilizarlo en preview (`/profile`) y en el CV imprimible.
 */
export function ProfileAvatar({
  name,
  avatarUrl,
  imgClassName,
  fallbackClassName,
  decorative = false
}: {
  name: string;
  avatarUrl: string | null;
  imgClassName: string;
  fallbackClassName: string;
  /**
   * Cuando el nombre ya aparece como texto visible junto al avatar (p. ej. en el
   * header del shell), el avatar es puramente decorativo: la imagen usa `alt=""`
   * y las iniciales de reemplazo se ocultan a tecnologías de asistencia para no
   * duplicar la lectura del nombre. Por defecto (false) conserva el nombre como
   * texto alternativo (uso en preview/CV).
   */
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolveProfileImageUrl(avatarUrl);

  if (resolvedUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedUrl}
        alt={decorative ? "" : name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  }

  return (
    <span className={fallbackClassName} aria-hidden={decorative || undefined}>
      {initialsFrom(name)}
    </span>
  );
}
