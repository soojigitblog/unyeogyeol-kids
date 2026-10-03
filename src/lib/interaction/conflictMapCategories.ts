// P3.4 부모×아이 충돌지도 — 13개 고정 카테고리 정의 + 라벨.
// 카테고리 ↔ evidence 도메인 매핑은 conflictMapScoring.ts 가 사용한다.

import type { ConcernId, ConflictMapCategoryId, QuestionDomain } from "@/lib/types";

export const CONFLICT_MAP_CATEGORY_IDS: ConflictMapCategoryId[] = [
  "cm_morning_routine",
  "cm_meal",
  "cm_outing",
  "cm_tidy_up",
  "cm_tantrum",
  "cm_emotional_burst",
  "cm_bedtime",
  "cm_study",
  "cm_friends",
  "cm_media",
  "cm_rules",
  "cm_siblings",
  "cm_discipline",
];

export const CONFLICT_MAP_CATEGORY_LABEL: Record<ConflictMapCategoryId, string> = {
  cm_morning_routine: "아침 준비",
  cm_meal: "식사",
  cm_outing: "외출",
  cm_tidy_up: "정리정돈",
  cm_tantrum: "떼쓰기",
  cm_emotional_burst: "감정 폭발",
  cm_bedtime: "잠자리",
  cm_study: "공부",
  cm_friends: "친구 관계",
  cm_media: "미디어/스마트폰",
  cm_rules: "규칙",
  cm_siblings: "형제자매",
  cm_discipline: "부모의 훈육",
};

/**
 * 카테고리별로 참고할 일반 10문항 도메인과, 일치 시 가산점을 주는 concernId.
 * cm_media / cm_siblings 는 전용 문항이 없어 커버리지가 약함 — 정직하게 "보통" 기본값으로
 * 처리되도록 그대로 둔다(허위로 특정 도메인을 지어내지 않는다).
 */
export const CONFLICT_MAP_DOMAINS: Record<
  ConflictMapCategoryId,
  { generalDomains: QuestionDomain[]; concernId?: ConcernId }
> = {
  cm_morning_routine: { generalDomains: ["transition", "parent_instruction"], concernId: "daycare" },
  cm_meal: { generalDomains: ["self_assertion", "parent_instruction"], concernId: "meal" },
  cm_outing: { generalDomains: ["transition", "new_environment"] },
  cm_tidy_up: { generalDomains: ["transition", "rule_response", "play_immersion"] },
  cm_tantrum: { generalDomains: ["emotional_expression", "self_assertion"], concernId: "tantrum" },
  cm_emotional_burst: { generalDomains: ["emotional_expression", "failure"], concernId: "tantrum" },
  cm_bedtime: { generalDomains: ["transition"], concernId: "sleep" },
  cm_study: { generalDomains: ["play_immersion", "rule_response"], concernId: "learning" },
  cm_friends: { generalDomains: ["social_approach"], concernId: "friends" },
  cm_media: { generalDomains: ["parent_instruction", "transition"] },
  cm_rules: { generalDomains: ["rule_response", "parent_instruction"], concernId: "discipline" },
  cm_siblings: { generalDomains: ["self_assertion", "social_approach"], concernId: "sibling" },
  cm_discipline: { generalDomains: ["parent_instruction", "rule_response"], concernId: "discipline" },
};

/** 카테고리별 엄마 미니체크 도메인 (5개 중 관련 있는 것만). */
export const CONFLICT_MAP_MOM_DOMAINS: Record<ConflictMapCategoryId, string[]> = {
  cm_morning_routine: ["time_pressure_style"],
  cm_meal: ["time_pressure_style", "instruction_resistance_style"],
  cm_outing: ["time_pressure_style"],
  cm_tidy_up: ["routine_flexibility_style"],
  cm_tantrum: ["emotion_coping_style"],
  cm_emotional_burst: ["emotion_coping_style"],
  cm_bedtime: ["time_pressure_style", "routine_flexibility_style"],
  cm_study: ["instruction_resistance_style"],
  cm_friends: [],
  cm_media: ["instruction_resistance_style"],
  cm_rules: ["instruction_resistance_style"],
  cm_siblings: ["conflict_recovery_style"],
  cm_discipline: ["instruction_resistance_style", "conflict_recovery_style"],
};
