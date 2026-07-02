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
  fallbackClassName
}: {
  name: string;
  avatarUrl: string | null;
  imgClassName: string;
  fallbackClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolveProfileImageUrl(avatarUrl);

  if (resolvedUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedUrl}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  }

  return <span className={fallbackClassName}>{initialsFrom(name)}</span>;
}
