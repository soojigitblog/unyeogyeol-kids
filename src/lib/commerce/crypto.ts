import { createHash, randomBytes, randomUUID } from "node:crypto";

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateGuestSessionId(): string {
  return randomUUID();
}

export function generateOrderId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
}

export function generateReportAccessToken(): string {
  return randomBytes(24).toString("base64url");
}
