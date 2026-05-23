import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "./jwt.util.js";
import { hash, verify } from "./password.util.js";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token.util.js";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type UserPublic = { id: string; email: string; role: string; createdAt: Date };
type AuthResult = { accessToken: string; refreshToken: string; user: UserPublic };

export async function register(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError("CONFLICT", 409, "No ha sido posible completar el registro");
  }

  const passwordHash = await hash(password);

  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash }
  });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    }
  });

  return {
    accessToken: signAccessToken(user.id),
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt }
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase();
  const GENERIC_ERROR = "Email o contraseña incorrectos";

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("UNAUTHORIZED", 401, GENERIC_ERROR);
  }

  const passwordMatch = await verify(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("UNAUTHORIZED", 401, GENERIC_ERROR);
  }

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    }
  });

  return {
    accessToken: signAccessToken(user.id),
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt }
  };
}
