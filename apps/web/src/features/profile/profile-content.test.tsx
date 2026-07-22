import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AuthContextValue, useAuth } from "@/features/auth/auth-context";
import { getMyProfile, updateMyProfile, uploadProfileAvatar } from "@/features/profile/profile-api";
import type { CandidateProfileDto } from "@/types/api";

import { ProfileContent } from "./profile-content";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("@/features/auth/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/features/profile/profile-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/profile/profile-api")>()),
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadProfileAvatar: vi.fn()
}));

const updateCandidateIdentity = vi.fn();

const baseProfile: CandidateProfileDto = {
  id: "p1",
  userId: "u1",
  firstName: "Ana",
  lastName: "Pérez",
  headline: "Frontend developer",
  summary: null,
  location: null,
  locationRemote: false,
  availabilityStatus: "ACTIVE",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completionPercentage: 40,
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  links: [],
  preferences: null
};

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    accessToken: "tok",
    user: null,
    isAuthenticated: true,
    candidateIdentity: null,
    identityResolved: true,
    endReason: null,
    setSession: vi.fn(),
    clearSession: vi.fn(),
    updateCandidateIdentity
  } as unknown as AuthContextValue);
});

afterEach(() => vi.clearAllMocks());

describe("ProfileContent · sincronización de identidad (NAV-02, Sprint 21D)", () => {
  it("D2: al guardar datos básicos actualiza el snapshot de identidad, sin re-fetch", async () => {
    const updated: CandidateProfileDto = { ...baseProfile, firstName: "Marta", headline: "Backend dev" };
    vi.mocked(updateMyProfile).mockResolvedValueOnce(updated);
    const user = userEvent.setup();
    render(<ProfileContent profile={baseProfile} token="tok" />);

    await user.clear(screen.getByLabelText("Nombre", { exact: true }));
    await user.type(screen.getByLabelText("Nombre", { exact: true }), "Marta");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalled());
    expect(updateCandidateIdentity).toHaveBeenCalledWith({
      firstName: "Marta",
      lastName: "Pérez",
      headline: "Backend dev",
      avatarUrl: null
    });
    // No se dispara una lectura nueva de perfil solo para refrescar el header.
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it("D3: al subir avatar actualiza candidateIdentity.avatarUrl conservando nombre/headline", async () => {
    vi.mocked(uploadProfileAvatar).mockResolvedValueOnce({ avatarUrl: "/uploads/avatars/u1_new.png" });
    vi.mocked(getMyProfile).mockResolvedValueOnce({ ...baseProfile, avatarUrl: "/uploads/avatars/u1_new.png" });
    const user = userEvent.setup();
    render(<ProfileContent profile={baseProfile} token="tok" />);

    const file = new File(["x"], "a.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Subir imagen"), file);

    await waitFor(() => expect(uploadProfileAvatar).toHaveBeenCalled());
    await waitFor(() =>
      expect(updateCandidateIdentity).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: "/uploads/avatars/u1_new.png",
          firstName: "Ana",
          lastName: "Pérez",
          headline: "Frontend developer"
        })
      )
    );
  });
});
