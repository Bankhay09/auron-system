import { randomInt } from "crypto";
import { hashCode } from "@/lib/server/password";

export const PASSWORD_RESET_EXPIRES_MS = 1000 * 60 * 15;

export function generateResetCode() {
  return String(randomInt(100000, 1000000));
}

export function resetCodeHash(code: string) {
  return hashCode(code.trim());
}

export function resetCodeExpiresAt() {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS).toISOString();
}

export function isResetCodeExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}
