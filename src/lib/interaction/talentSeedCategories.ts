// P3.5 재능 씨앗 — 15개 고정 카테고리 정의 + 라벨.
// 순위/레벨 계산은 talentSeedScoring.ts (결정론 코드) 담당, AI는 절대 관여하지 않는다.

export type TalentId =
  | "talent_observation"
  | "talent_inquiry"
  | "talent_logic"
  | "talent_language"
  | "talent_expression"
  | "talent_creativity"
  | "talent_spatial"
  | "talent_physical"
  | "talent_empathy"
  | "talent_relationship"
  | "talent_leadership"
  | "talent_independence"
  | "talent_execution"
  | "talent_immersion"
  | "talent_problem_solving";

export const TALENT_IDS: TalentId[] = [
  "talent_observation",
  "talent_inquiry",
  "talent_logic",
  "talent_language",
  "talent_expression",
  "talent_creativity",
  "talent_spatial",
  "talent_physical",
  "talent_empathy",
  "talent_relationship",
  "talent_leadership",
  "talent_independence",
  "talent_execution",
  "talent_immersion",
  "talent_problem_solving",
];

export const TALENT_LABEL: Record<TalentId, string> = {
  talent_observation: "관찰",
  talent_inquiry: "탐구",
  talent_logic: "논리",
  talent_language: "언어",
  talent_expression: "표현",
  talent_creativity: "창작",
  talent_spatial: "공간",
  talent_physical: "신체",
  talent_empathy: "공감",
  talent_relationship: "관계",
  talent_leadership: "리더십",
  talent_independence: "독립성",
  talent_execution: "실행",
  talent_immersion: "몰입",
  talent_problem_solving: "문제해결",
};

export type TalentStrengthLevel = "매우강함" | "강함" | "보통" | "잠재";
