// caregiver 모듈 (P2.2V.6): "엄마 × 아이" 고정 구조를 "우리 아이 × 나" 관계로 일반화한다.
//
// 원칙:
// 1. 관계명은 사용자가 직접 고른 값(roleLabel)을 그대로 사용한다. 자동으로 "엄마"로 치환하지 않는다.
// 2. 관계명만으로 심리/행동 성향을 추론하지 않는다. (예: "할머니라서 더 챙겨준다" 금지)
// 3. 고객 문장은 단일 렌더러(applyCaregiverLabel)를 통해서만 관계명을 채운다.
// 4. 한국어 조사(이/가, 은/는, 을/를, 과/와)는 받침 유무에 따라 자동 처리한다.

import type { CaregiverProfile, CaregiverRole } from "@/lib/types";

export interface CaregiverRoleOption {
  optionId: string;
  role: CaregiverRole;
  /** 고객 문구에 그대로 쓰이는 관계명. */
  roleLabel: string;
  /** true 면 관계명을 사용자가 직접 입력해야 한다. */
  requiresCustomLabel?: boolean;
}

/** 관계 선택지. 특정 가족 형태를 예외처럼 보이지 않도록 동등하게 나열한다. */
export const CAREGIVER_ROLE_OPTIONS: CaregiverRoleOption[] = [
  { optionId: "cg_mother", role: "mother", roleLabel: "엄마" },
  { optionId: "cg_father", role: "father", roleLabel: "아빠" },
  { optionId: "cg_grandmother", role: "paternal_grandmother", roleLabel: "할머니" },
  { optionId: "cg_maternal_grandmother", role: "maternal_grandmother", roleLabel: "외할머니" },
  { optionId: "cg_grandfather", role: "paternal_grandfather", roleLabel: "할아버지" },
  { optionId: "cg_maternal_grandfather", role: "maternal_grandfather", roleLabel: "외할아버지" },
  { optionId: "cg_aunt_mo", role: "aunt", roleLabel: "이모" },
  { optionId: "cg_aunt_fa", role: "aunt", roleLabel: "고모" },
  { optionId: "cg_uncle_fa", role: "uncle", roleLabel: "삼촌" },
  { optionId: "cg_uncle_mo", role: "uncle", roleLabel: "외삼촌" },
  {
    optionId: "cg_other_family",
    role: "other",
    roleLabel: "기타 가족",
    requiresCustomLabel: true,
  },
  {
    optionId: "cg_guardian",
    role: "guardian",
    roleLabel: "기타 보호자",
    requiresCustomLabel: true,
  },
];

export function findRoleOption(optionId: string): CaregiverRoleOption | undefined {
  return CAREGIVER_ROLE_OPTIONS.find((o) => o.optionId === optionId);
}

// ── 한국어 조사 처리 ────────────────────────────────────────
function hasBatchim(str: string): boolean {
  if (!str) return false;
  const lastChar = str.charCodeAt(str.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return false;
  return (lastChar - 0xac00) % 28 > 0;
}

export function withJosa(label: string, withB: string, withoutB: string): string {
  return `${label}${hasBatchim(label) ? withB : withoutB}`;
}

export const subj = (label: string) => withJosa(label, "이", "가");
export const topic = (label: string) => withJosa(label, "은", "는");
export const obj = (label: string) => withJosa(label, "을", "를");
export const conj = (label: string) => withJosa(label, "과", "와");

// ── 관계명 해석 ────────────────────────────────────────────
export const DEFAULT_ROLE_LABEL = "보호자";

type LooseCaregiver =
  | (Partial<CaregiverProfile> & { name?: string })
  | null
  | undefined;

/** 고객 문구에 쓸 순수 관계명. "기타"라는 단어는 절대 노출하지 않는다. */
export function resolveRoleLabel(profile: LooseCaregiver): string {
  const raw = profile?.roleLabel?.trim();
  if (!raw || raw === "기타 가족" || raw === "기타 보호자" || raw === "기타") {
    return DEFAULT_ROLE_LABEL;
  }
  return raw;
}

/** 서술 문장용 표시명: 애칭을 입력했으면 애칭, 없으면 관계명. */
export function resolveDisplayName(profile: LooseCaregiver): string {
  const custom = (profile?.displayName ?? profile?.name)?.trim();
  return custom || resolveRoleLabel(profile);
}

// ── 단일 렌더러 ────────────────────────────────────────────
// rule / report 문자열에 들어 있는 토큰을 실제 관계명으로 치환한다.
//   {{CG}}   -> 아빠            {{CG가}} -> 아빠가 / 삼촌이
//   {{CG는}} -> 아빠는 / 삼촌은  {{CG를}} -> 아빠를 / 삼촌을
//   {{CG의}} -> 아빠의          {{CG와}} -> 아빠와 / 삼촌과
export function applyCaregiverLabel<T>(value: T, label: string): T {
  if (typeof value === "string") {
    return value
      .replace(/\{\{CG가\}\}/g, subj(label))
      .replace(/\{\{CG는\}\}/g, topic(label))
      .replace(/\{\{CG를\}\}/g, obj(label))
      .replace(/\{\{CG와\}\}/g, conj(label))
      .replace(/\{\{CG의\}\}/g, `${label}의`)
      .replace(/\{\{CG\}\}/g, label) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyCaregiverLabel(item, label)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = applyCaregiverLabel(item, label);
    }
    return out as unknown as T;
  }
  return value;
}

/** 레거시 개발 세션(momProfile 만 있는 상태) -> CaregiverProfile 변환. */
export function migrateLegacyMomProfile(legacy: {
  name?: string;
  birthDate?: string;
  birthTimeKnown?: boolean;
  birthTime?: string;
}): CaregiverProfile | null {
  if (!legacy?.birthDate) return null;
  return {
    role: "mother",
    roleLabel: "엄마",
    displayName: legacy.name,
    birthDate: legacy.birthDate,
    birthTimeKnown: legacy.birthTimeKnown ?? false,
    birthTime: legacy.birthTime,
  };
}
