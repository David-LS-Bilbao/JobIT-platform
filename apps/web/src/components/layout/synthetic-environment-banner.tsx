/**
 * Marcador global de entorno sintético (Fase C — bloque 1).
 *
 * Spec: `docs/specs/features/staging-technical-readiness.md` §11.
 *
 * Se activa solo con `NEXT_PUBLIC_JOBIT_DATA_MODE=SYNTHETIC_STAGING`. La lectura
 * es un acceso estático a `process.env.NEXT_PUBLIC_*` porque Next la INLINEA en
 * el build: una lectura dinámica no se sustituiría y el marcador nunca
 * aparecería en la imagen desplegada.
 *
 * Se renderiza en el flujo del documento, no fijo ni superpuesto, para que
 * empuje el contenido hacia abajo en lugar de tapar navegación o acciones.
 */

const SYNTHETIC_STAGING = "SYNTHETIC_STAGING";

export const SYNTHETIC_ENVIRONMENT_NOTICE =
  "ENTORNO DE STAGING SINTÉTICO · No introducir datos reales ni personales";

export function SyntheticEnvironmentBanner() {
  // Igualdad exacta: cualquier otro valor deja la aplicación en modo normal.
  if (process.env.NEXT_PUBLIC_JOBIT_DATA_MODE !== SYNTHETIC_STAGING) {
    return null;
  }

  return (
    <div className="w-full border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-semibold tracking-wide text-amber-900">
      {SYNTHETIC_ENVIRONMENT_NOTICE}
    </div>
  );
}
