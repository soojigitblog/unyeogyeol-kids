// P3.5 재능 씨앗 — 결정론 점수 계산 (AI 아님, 순수함수).
//
// 원칙: 재능 순위/등급은 이 파일이 계산하고, AI는 그 결과를 설명하는 글만 쓴다
// (conflictMapScoring.ts와 동일한 원칙). 사주(오행) 신호는 일부러 희소하고 약하게,
// 관찰설문 신호는 상대적으로 강하게 설계해 "같은 오행이어도 설문이 다르면 재능
// 순위가 실제로 달라진다"가 성립하도록 한다. 근거가 전혀 없는 재능은 "잠재" +
// sourceType "generic"으로 정직하게 표시한다(거짓 구체성 금지).
//
// 주의: concern 전용 micro-check(식사/수면) evidence는 재능 점수에 포함하지 않는다
// — 재능은 일반 기질 10문항 범위로만 판단한다(범위를 흐리지 않기 위한 의도적 선택).

import type { BehaviorEvidence, Element, SourceType } from "@/lib/types";
import {
  TALENT_IDS,
  type TalentId,
  type TalentStrengthLevel,
} from "./talentSeedCategories";

/** 오행 → 재능 가중치. 일부러 각 원소당 4~5개 재능에만, 낮은 값(≤3)으로만 연결한다. */
const FORTUNE_ELEMENT_TALENT_WEIGHT: Record<Element, Partial<Record<TalentId, number>>> = {
  wood: {
    talent_inquiry: 3,
    talent_leadership: 2,
    talent_independence: 2,
    talent_creativity: 2,
    talent_execution: 1,
  },
  fire: {
    talent_expression: 3,
    talent_relationship: 2,
    talent_creativity: 2,
    talent_leadership: 1,
    talent_empathy: 1,
  },
  earth: {
    talent_empathy: 3,
    talent_relationship: 2,
    talent_immersion: 2,
    talent_execution: 2,
  },
  metal: {
    talent_logic: 3,
    talent_problem_solving: 2,
    talent_execution: 2,
    talent_spatial: 1,
    talent_observation: 1,
  },
  water: {
    talent_observation: 3,
    talent_language: 2,
    talent_problem_solving: 2,
    talent_logic: 1,
    talent_independence: 1,
  },
};

/** 일반 10문항 patternId → 재능 가중치. 근거가 약한 값(2, 중립)은 대부분 매핑하지 않는다. */
const OBSERVATION_PATTERN_TALENT_WEIGHT: Record<string, Partial<Record<TalentId, number>>> = {
  // new_environment
  explores_new_settings_readily: { talent_inquiry: 2, talent_independence: 1 },
  brief_scan_then_engages: { talent_inquiry: 1 },
  needs_observation_time: { talent_observation: 2 },
  warms_up_with_secure_base: { talent_relationship: 1 },
  // failure
  quick_reattempt: { talent_execution: 2, talent_problem_solving: 1 },
  self_soothes_after_upset: { talent_independence: 1 },
  recovers_with_support: { talent_relationship: 1 },
  // self_assertion
  strong_self_direction: { talent_independence: 2, talent_leadership: 1 },
  asserts_but_negotiates: { talent_relationship: 1, talent_leadership: 1 },
  harmony_oriented: { talent_empathy: 1, talent_relationship: 1 },
  // transition
  prefers_completion_before_transition: { talent_execution: 1, talent_immersion: 1 },
  // social_approach
  initiates_socially: { talent_relationship: 2, talent_leadership: 2 },
  eases_into_group: { talent_relationship: 1 },
  observes_then_joins: { talent_observation: 1 },
  prefers_close_small_group: { talent_empathy: 1 },
  // play_immersion
  deep_single_focus: { talent_immersion: 3, talent_execution: 1 },
  focus_then_shift: { talent_immersion: 1 },
  broad_varied_play: { talent_creativity: 1 },
  novelty_seeking_play: { talent_creativity: 2, talent_inquiry: 1 },
  // praise
  energized_by_praise: { talent_expression: 1, talent_leadership: 1 },
  warmed_by_shared_joy: { talent_empathy: 1 },
  intrinsically_motivated: { talent_independence: 2, talent_execution: 1 },
  // rule_response
  reason_seeking: { talent_logic: 2, talent_problem_solving: 2 },
  follows_when_convinced: { talent_logic: 1 },
  context_flexible: { talent_creativity: 1 },
  // emotional_expression
  high_intensity_expression: { talent_expression: 3 },
  open_expression: { talent_expression: 2, talent_language: 1 },
  inward_then_shares: { talent_language: 1 },
  // parent_instruction
  own_way_first: { talent_independence: 2, talent_leadership: 1 },
  own_pace_completes: { talent_execution: 1, talent_independence: 1 },
  responsive_to_requests: { talent_relationship: 1 },
};

const OBSERVATION_CONTRIBUTION_CAP = 8;

export interface TalentScoreResult {
  talentId: TalentId;
  score: number;
  fortuneContribution: number;
  observationContribution: number;
  sourceType: SourceType;
  strengthLevel: TalentStrengthLevel;
  evidenceRefs: string[];
}

function levelFromScore(score: number): TalentStrengthLevel {
  if (score >= 7) return "매우강함";
  if (score >= 4) return "강함";
  if (score >= 1) return "보통";
  return "잠재";
}

/**
 * 15개 재능 전체의 점수를 계산한다. 순수함수 — 같은 입력이면 항상 같은 결과.
 */
export function scoreAllTalents(input: {
  dayMasterElement: Element | null;
  childEvidences: BehaviorEvidence[];
}): Record<TalentId, TalentScoreResult> {
  const result = {} as Record<TalentId, TalentScoreResult>;
  const fortuneWeights = input.dayMasterElement
    ? FORTUNE_ELEMENT_TALENT_WEIGHT[input.dayMasterElement]
    : {};

  for (const talentId of TALENT_IDS) {
    const fortuneContribution = fortuneWeights[talentId] ?? 0;

    let observationContribution = 0;
    const evidenceRefs: string[] = [];
    for (const ev of input.childEvidences) {
      // concern-micro evidence(food_*/sleep_*)는 제외 — 일반 기질 문항만 반영
      if (ev.source.scope !== "general") continue;
      const weight = OBSERVATION_PATTERN_TALENT_WEIGHT[ev.patternId]?.[talentId] ?? 0;
      if (weight === 0) continue;
      observationContribution += weight;
      evidenceRefs.push(`evidence:${ev.domain}:${ev.patternId}`);
    }
    observationContribution = Math.min(observationContribution, OBSERVATION_CONTRIBUTION_CAP);

    if (fortuneContribution > 0) {
      evidenceRefs.push(`fortune:dayMaster_${input.dayMasterElement}`);
    }

    const score = fortuneContribution + observationContribution;
    const sourceType: SourceType =
      fortuneContribution > 0 && observationContribution > 0
        ? "mixed"
        : observationContribution > 0
          ? "observation"
          : fortuneContribution > 0
            ? "fortune"
            : "generic";

    result[talentId] = {
      talentId,
      score,
      fortuneContribution,
      observationContribution,
      sourceType,
      strengthLevel: levelFromScore(score),
      evidenceRefs,
    };
  }

  return result;
}

/**
 * TOP5 선정. 점수 desc → evidenceRefs 개수 desc → 고정 TALENT_IDS 순서로 동점 처리.
 * 랜덤 요소 없음(재실행해도 항상 동일).
 */
export function topTalents(
  scores: Record<TalentId, TalentScoreResult>,
  count = 5
): TalentScoreResult[] {
  return [...TALENT_IDS]
    .map((id) => scores[id])
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.evidenceRefs.length !== a.evidenceRefs.length) {
        return b.evidenceRefs.length - a.evidenceRefs.length;
      }
      return TALENT_IDS.indexOf(a.talentId) - TALENT_IDS.indexOf(b.talentId);
    })
    .slice(0, count);
}
