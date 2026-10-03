// P3.5 "엄마×아이 / 아빠×아이 사용설명서" — 보조 결정론 로직.
//
// 현재 데이터 모델은 보호자 1명만 지원한다(schema 변경 없이 이번 라운드 처리).
// 실제 분석은 항상 "지금 구매한 그 보호자"(caregiverRoleLabel, 예: 엄마/아빠/할머니)
// 기준으로 만들고, 두 번째 보호자는 항상 고정 CTA로만 안내한다 — 절대 존재하지 않는
// 두 번째 보호자를 AI가 추측해서 만들어내지 않는다.

import type { MomEvidence, SourceType } from "@/lib/types";

export interface RelationshipGuideCta {
  ctaText: string;
}

export function buildOtherCaregiverCta(): RelationshipGuideCta {
  return {
    ctaText: "다른 보호자 정보를 추가하면 그분에게 맞는 육아법도 확인할 수 있어요.",
  };
}

/**
 * 관계 가이드의 provenance 판단 — 아이/보호자 사주(오행)가 둘 다 있으면 fortune 신호,
 * 보호자 관찰 설문(momEvidence)이 있으면 observation 신호로 본다.
 */
export function resolveRelationshipSourceType(input: {
  hasChildFortune: boolean;
  hasCaregiverFortune: boolean;
  momEvidences: MomEvidence[];
}): SourceType {
  const hasFortune = input.hasChildFortune && input.hasCaregiverFortune;
  const hasObservation = input.momEvidences.length > 0;
  if (hasFortune && hasObservation) return "mixed";
  if (hasObservation) return "observation";
  if (hasFortune) return "fortune";
  return "generic";
}
