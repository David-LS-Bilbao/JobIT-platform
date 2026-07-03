import type { MatchFactorName, MatchLevel } from "@/types/api";

/**
 * Etiquetas y clases visuales del nivel de afinidad del match básico.
 * Los tramos los define el backend (VERY_LOW 0-25, LOW 26-50, GOOD 51-75,
 * VERY_GOOD 76-100). Aquí solo se humanizan y colorean, sin recalcular nada.
 */
export const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  VERY_LOW: "Muy baja",
  LOW: "Baja",
  GOOD: "Buena",
  VERY_GOOD: "Muy buena"
};

/** Clases del badge de nivel (sistema visual claro "Nexus", coherente con la app). */
export const MATCH_LEVEL_BADGE_CLASS: Record<MatchLevel, string> = {
  VERY_LOW: "bg-slate-100 text-slate-600",
  LOW: "bg-amber-50 text-amber-700",
  GOOD: "bg-[#eff4ff] text-[#006591]",
  VERY_GOOD: "bg-emerald-50 text-emerald-700"
};

/** Color de la barra de progreso del score, por nivel. */
export const MATCH_LEVEL_BAR_CLASS: Record<MatchLevel, string> = {
  VERY_LOW: "bg-slate-300",
  LOW: "bg-amber-400",
  GOOD: "bg-[#006591]",
  VERY_GOOD: "bg-emerald-500"
};

/** Score acotado a 0..100 por seguridad (el backend ya lo garantiza). */
export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Nombre legible de cada factor del desglose (el backend usa claves cortas). */
export const MATCH_FACTOR_LABELS: Record<MatchFactorName, string> = {
  skills: "Skills",
  remote: "Modalidad",
  seniority: "Seniority",
  location: "Ubicación"
};

/** Estado legible de un factor según `match` (true/false/null). */
export function matchFactorState(match: boolean | null): {
  label: string;
  dotClass: string;
  textClass: string;
} {
  if (match === true) {
    return { label: "Coincide", dotClass: "bg-emerald-500", textClass: "text-emerald-700" };
  }
  if (match === false) {
    return { label: "No coincide", dotClass: "bg-amber-400", textClass: "text-amber-700" };
  }
  return { label: "Sin datos", dotClass: "bg-slate-300", textClass: "text-slate-500" };
}
