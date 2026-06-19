import type { Skill } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

export class ProfileError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

/**
 * Devuelve la Skill solo si pertenece al CandidateProfile del usuario autenticado.
 * - No existe  -> 404 NOT_FOUND
 * - Es de otro -> 403 FORBIDDEN
 * El userId procede siempre del token, nunca del cliente.
 */
export async function findOwnedSkillOrThrow(
  userId: string,
  skillId: string
): Promise<Skill> {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { profile: true }
  });

  if (!skill) {
    throw new ProfileError("NOT_FOUND", 404, "Skill not found.");
  }

  if (skill.profile.userId !== userId) {
    throw new ProfileError("FORBIDDEN", 403, "You do not have access to this resource.");
  }

  return skill;
}
