import bcrypt from "bcryptjs";

const COST_FACTOR = 12;

export async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, COST_FACTOR);
}

export async function verify(password: string, hashValue: string): Promise<boolean> {
  return bcrypt.compare(password, hashValue);
}
