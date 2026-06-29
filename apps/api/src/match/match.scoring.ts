/**
 * Scoring puro y explicable de Match (Sprint 05).
 *
 * Determinista, sin DB, sin red, sin IA/ML. Calcula la afinidad perfil↔oferta
 * con pesos fijos (skills 50, modalidad 20, seniority 20, ubicación 10) y un
 * desglose legible por factores. Los factores sin datos suficientes quedan en
 * `match: null` y contribuyen 0 (no se renormaliza). Ver
 * docs/specs/features/match-basic.md.
 */

export type MatchLevel = "VERY_LOW" | "LOW" | "GOOD" | "VERY_GOOD";

type RemotePreference = "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
type PreferenceSeniority = "JUNIOR" | "MID" | "SENIOR";
type JobRemoteType = "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";
type JobSeniority = "JUNIOR" | "MID" | "SENIOR" | "ANY";

export type MatchFactorName = "skills" | "remote" | "seniority" | "location";

export interface MatchFactor {
  name: MatchFactorName;
  match: boolean | null;
  detail: string;
}

export interface MatchScoringInput {
  candidate: {
    skills: string[];
    preferences?: {
      remotePreference?: RemotePreference | null;
      seniority?: PreferenceSeniority | null;
      preferredLocations?: string[];
    } | null;
  };
  job: {
    tags: string[];
    remoteType?: JobRemoteType | null;
    seniority?: JobSeniority | null;
    location?: string | null;
  };
}

export interface MatchScoringResult {
  score: number;
  level: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
  factors: MatchFactor[];
  explanation: string;
}

const WEIGHT_SKILLS = 50;
const WEIGHT_REMOTE = 20;
const WEIGHT_SENIORITY = 20;
const WEIGHT_LOCATION = 10;

/** Normaliza una lista de strings: trim, lowercase, sin vacíos, deduplicada. */
function normalizeList(values: readonly string[] | undefined | null): string[] {
  if (!values) {
    return [];
  }
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.length > 0) {
      seen.add(normalized);
    }
  }
  return [...seen];
}

export function getMatchLevel(score: number): MatchLevel {
  if (score <= 25) {
    return "VERY_LOW";
  }
  if (score <= 50) {
    return "LOW";
  }
  if (score <= 75) {
    return "GOOD";
  }
  return "VERY_GOOD";
}

interface SkillsOutcome {
  factor: MatchFactor;
  points: number;
  matchedSkills: string[];
  missingSkills: string[];
}

function scoreSkills(candidateSkills: Set<string>, jobTagList: string[]): SkillsOutcome {
  const matchedSkills = jobTagList.filter((tag) => candidateSkills.has(tag)).sort();
  const missingSkills = jobTagList.filter((tag) => !candidateSkills.has(tag)).sort();

  if (candidateSkills.size === 0 || jobTagList.length === 0) {
    const detail =
      candidateSkills.size === 0
        ? "Añade skills a tu perfil para calcular la afinidad"
        : "La oferta no especifica skills";
    return {
      factor: { name: "skills", match: null, detail },
      points: 0,
      matchedSkills,
      missingSkills
    };
  }

  const points = Math.round((WEIGHT_SKILLS * matchedSkills.length) / jobTagList.length);
  const match = matchedSkills.length > 0;
  const detail = `${matchedSkills.length} de ${jobTagList.length} skills coinciden`;
  return { factor: { name: "skills", match, detail }, points, matchedSkills, missingSkills };
}

interface FactorOutcome {
  factor: MatchFactor;
  points: number;
}

function scoreRemote(
  preference: RemotePreference | null | undefined,
  remoteType: JobRemoteType | null | undefined
): FactorOutcome {
  if (!preference || !remoteType || remoteType === "UNSPECIFIED") {
    return { factor: { name: "remote", match: null, detail: "Sin datos de modalidad" }, points: 0 };
  }
  if (preference === "ANY" || preference === remoteType) {
    return {
      factor: { name: "remote", match: true, detail: "Modalidad compatible con tu preferencia" },
      points: WEIGHT_REMOTE
    };
  }
  return { factor: { name: "remote", match: false, detail: "Modalidad no coincide" }, points: 0 };
}

function scoreSeniority(
  preference: PreferenceSeniority | null | undefined,
  jobSeniority: JobSeniority | null | undefined
): FactorOutcome {
  if (!preference || !jobSeniority) {
    return {
      factor: { name: "seniority", match: null, detail: "Sin datos de seniority" },
      points: 0
    };
  }
  if (jobSeniority === "ANY" || jobSeniority === preference) {
    return {
      factor: { name: "seniority", match: true, detail: "Seniority compatible" },
      points: WEIGHT_SENIORITY
    };
  }
  return { factor: { name: "seniority", match: false, detail: "Seniority no coincide" }, points: 0 };
}

function scoreLocation(
  preferredLocations: string[] | undefined,
  jobLocation: string | null | undefined,
  remoteType: JobRemoteType | null | undefined
): FactorOutcome {
  if (remoteType === "REMOTE") {
    return {
      factor: { name: "location", match: null, detail: "No aplica (oferta remota)" },
      points: 0
    };
  }
  const prefs = normalizeList(preferredLocations);
  const location = typeof jobLocation === "string" ? jobLocation.trim().toLowerCase() : "";
  if (prefs.length === 0 || location.length === 0) {
    return {
      factor: { name: "location", match: null, detail: "Sin datos de ubicación" },
      points: 0
    };
  }
  const matches = prefs.some(
    (pref) => pref === location || pref.includes(location) || location.includes(pref)
  );
  if (matches) {
    return {
      factor: { name: "location", match: true, detail: "Ubicación compatible" },
      points: WEIGHT_LOCATION
    };
  }
  return { factor: { name: "location", match: false, detail: "Ubicación no coincide" }, points: 0 };
}

export function calculateJobMatch(input: MatchScoringInput): MatchScoringResult {
  const { candidate, job } = input;
  const preferences = candidate.preferences ?? null;

  const candidateSkills = new Set(normalizeList(candidate.skills));
  const jobTagList = normalizeList(job.tags);

  const skills = scoreSkills(candidateSkills, jobTagList);
  const remote = scoreRemote(preferences?.remotePreference, job.remoteType);
  const seniority = scoreSeniority(preferences?.seniority, job.seniority);
  const location = scoreLocation(preferences?.preferredLocations, job.location, job.remoteType);

  const rawScore = skills.points + remote.points + seniority.points + location.points;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const level = getMatchLevel(score);

  const profileIncomplete =
    candidateSkills.size === 0 ||
    !preferences ||
    !preferences.remotePreference ||
    !preferences.seniority ||
    normalizeList(preferences.preferredLocations).length === 0;

  const explanationParts = [`Afinidad ${level} con una puntuación de ${score}/100.`];
  if (profileIncomplete) {
    explanationParts.push(
      "Completa tu perfil (skills y preferencias) para mejorar la precisión del match."
    );
  }

  return {
    score,
    level,
    matchedSkills: skills.matchedSkills,
    missingSkills: skills.missingSkills,
    factors: [skills.factor, remote.factor, seniority.factor, location.factor],
    explanation: explanationParts.join(" ")
  };
}
