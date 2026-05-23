import jwt from "jsonwebtoken";

function getSecret(): string {
  const secret = process.env["JWT_ACCESS_SECRET"];
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return secret;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, getSecret());
  if (typeof decoded === "string" || typeof decoded["sub"] !== "string") {
    throw new Error("Invalid token payload");
  }
  return { userId: decoded["sub"] };
}
