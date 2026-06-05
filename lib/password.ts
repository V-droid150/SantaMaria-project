import bcrypt from "bcryptjs";

// Hashing password dengan bcrypt (pure JS — aman di Windows tanpa native build).
const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
