/**
 * Símbolo de marca JobIT unificado (VIS-01, Sprint 21D). Fuente única del logo
 * "J" con el gradiente canónico `jobit-brand → jobit-green`, reutilizado por la
 * app privada (clara), la landing (oscura) y las pantallas de auth. Solo se
 * adaptan tamaño/color de texto por props; el gradiente no cambia por contexto.
 *
 * Es decorativo (`aria-hidden`): el nombre accesible "JobIT" lo aporta el texto o
 * el enlace vecino.
 */
export function BrandMark({
  className = "h-8 w-8 text-sm",
  textClassName = "text-white"
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-lg bg-linear-to-br from-jobit-brand to-jobit-green font-bold ${textClassName} ${className}`}
    >
      J
    </span>
  );
}
