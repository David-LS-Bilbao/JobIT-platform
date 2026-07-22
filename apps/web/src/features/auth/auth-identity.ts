/**
 * Carga del snapshot de identidad del candidato para el header (NAV-02, Sprint 21D).
 *
 * Se aísla en su propio módulo (no se llama a `getMyProfile` directamente desde el
 * AuthContext) para que los tests de página puedan neutralizar esta carga
 * session-scoped sin interferir con su propio mockeo/encadenado de `getMyProfile`.
 */
import { getMyProfile } from "@/features/profile/profile-api";

export interface CandidateIdentity {
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  avatarUrl: string | null;
}

/** Lee el perfil y devuelve solo el snapshot de identidad. Propaga errores (401 → expired). */
export async function loadCandidateIdentity(token: string): Promise<CandidateIdentity> {
  const profile = await getMyProfile(token);
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    headline: profile.headline,
    avatarUrl: profile.avatarUrl
  };
}
