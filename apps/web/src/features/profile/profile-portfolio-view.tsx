import type { CandidateProfileDto } from "@/types/api";

import { ProfilePrintActions } from "./profile-print-actions";
import { ProfilePrintCv } from "./profile-print-cv";

/** Composición del portfolio: acciones (solo pantalla) + documento CV imprimible. */
export function ProfilePortfolioView({ profile }: { profile: CandidateProfileDto }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProfilePrintActions />
      <ProfilePrintCv profile={profile} />
    </div>
  );
}
