import { createHmac, randomInt } from "node:crypto";

// v2.1 설계: 0/O/1/I/L 을 제외한 31자 alphabet, 12자리.
// entropy = log2(31) * 12 ≈ 59.45bit — 문서와 반드시 일치시킬 것(코드가 유일한 근거).
export const RECOVERY_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const RECOVERY_CODE_LENGTH = 12;
export const RECOVERY_CODE_GROUP_SIZE = 4;

export function generateRecoveryCode(): string {
  let out = "";
  for (let i = 0; i < RECOVERY_CODE_LENGTH; i += 1) {
    out += RECOVERY_CODE_ALPHABET[randomInt(0, RECOVERY_CODE_ALPHABET.length)];
  }
  return out;
}

/** 표시용: "XXXX-XXXX-XXXX" */
export function formatRecoveryCode(raw: string): string {
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += RECOVERY_CODE_GROUP_SIZE) {
    groups.push(raw.slice(i, i + RECOVERY_CODE_GROUP_SIZE));
  }
  return groups.join("-");
}

/** 사용자 입력 정규화: 대문자화, 대시/공백 등 alphabet 외 문자 제거 */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, "");
}

function getRecoveryCodeSecret(): string {
  const secret = process.env.RECOVERY_CODE_SECRET;
  if (!secret) {
    throw new Error("RECOVERY_CODE_SECRET_MISSING");
  }
  return secret;
}

/** normalize 된 코드만 입력으로 받는다 — 평문은 이 함수의 반환값(해시)으로만 DB에 도달한다. */
export function hashRecoveryCode(normalizedCode: string): string {
  return createHmac("sha256", getRecoveryCodeSecret()).update(normalizedCode).digest("hex");
}
