// P3.4 부모×아이 충돌지도 — 4단계 레벨(낮음/보통/높음/매우높음) 계산.
//
// 원칙: 레벨은 AI가 아니라 이 순수함수가 결정한다(스펙 4번: "AI가 임의로 점수를
// 만들어내면 안 된다"). AI 스키마에는 level 필드가 아예 없다 — 구조적으로 봉쇄.
//
// 근거 없는 카테고리(전용 문항이 없는 cm_media/cm_siblings 등)는 정직하게 "보통" +
// groundedInGeneric=true 로 처리한다(허위 구체성 금지).

import type {
  BehaviorEvidence,
  ConflictLevel,
  ConflictMapCategoryId,
  CurrentConflictInput,
  MomEvidence,
} from "@/lib/types";
import {
  CONFLICT_MAP_CATEGORY_IDS,
  CONFLICT_MAP_DOMAINS,
  CONFLICT_MAP_MOM_DOMAINS,
} from "./conflictMapCategories";

/**
 * 일반 10문항 patternId → friction 가중치.
 * 양수 = 마찰 가능성을 높이는 방향, 음수 = 마찰 가능성을 낮추는(협조적) 방향.
 * evidence.ts 의 PATTERNS 테이블과 1:1로 대응한다.
 */
const GENERAL_PATTERN_WEIGHT: Record<string, number> = {
  // new_environment
  explores_new_settings_readily: -1,
  brief_scan_then_engages: 0,
  needs_observation_time: 1,
  warms_up_with_secure_base: 1,
  // failure
  quick_reattempt: -1,
  self_soothes_after_upset: 0,
  needs_time_to_settle: 1,
  recovers_with_support: 0,
  // self_assertion
  strong_self_direction: 2,
  asserts_but_negotiates: 1,
  expresses_indirectly: 0,
  harmony_oriented: -1,
  // transition
  switches_readily: -1,
  brief_lag_then_transitions: 0,
  transitions_with_advance_notice: 0,
  prefers_completion_before_transition: 1,
  // social_approach
  initiates_socially: -1,
  eases_into_group: 0,
  observes_then_joins: 1,
  prefers_close_small_group: 0,
  // play_immersion
  deep_single_focus: 1,
  focus_then_shift: 0,
  broad_varied_play: 0,
  novelty_seeking_play: 0,
  // rule_response
  reason_seeking: 1,
  follows_when_convinced: 0,
  context_flexible: 0,
  accepts_set_rules: -1,
  // emotional_expression
  high_intensity_expression: 2,
  open_expression: 1,
  calm_expression: 0,
  inward_then_shares: -1,
  // parent_instruction
  own_way_first: 2,
  own_pace_completes: 1,
  moves_with_engagement: 0,
  responsive_to_requests: -1,
};

/** 엄마 미니체크 patternId → friction 가중치 (momQuestions.ts 옵션과 1:1 대응). */
const MOM_PATTERN_WEIGHT: Record<string, number> = {
  fast_pace_directive: 1,
  time_notice_prompt: 1,
  patient_pace_holding: -1,
  direct_assistance_takeover: 0,
  logical_explanation_first: 0,
  silent_emotional_presence: -1,
  focus_redirection: 0,
  immediate_stress_activation: 1,
  firm_boundary_insistence: 1,
  conditional_tradeoff: 0,
  inquiry_into_reason: -1,
  temporary_deescalation: 0,
  rapid_rescheduling: 0,
  child_lead_adaptation: -1,
  preference_for_structure: 1,
  situational_acceptance: -1,
  active_reconnection: -1,
  need_solitude_reset: 0,
  natural_routine_return: -1,
  post_event_self_reflection: 0,
};

/** meal/sleep concern 전용 micro-check patternId → friction 가중치. */
const CONCERN_MICRO_PATTERN_WEIGHT: Record<string, number> = {
  // food (buildFoodEvidence 가 생성하는 patternId)
  new_food_hesitation: 1,
  new_food_open_exploration: -1,
  food_familiar_preference: 0,
  food_refusal_on_pressure: 2,
  meal_pacing_autonomy: 1,
  // sleep (원본 옵션 patternId 를 그대로 evidence patternId 로 사용)
  sleep_transition_accepts_bedtime: -1,
  sleep_transition_needs_completion: 1,
  sleep_transition_delays_bedtime: 1,
  sleep_transition_strong_refusal: 2,
  sleep_routine_flexible: -1,
  sleep_routine_accepts_explanation: 0,
  sleep_routine_prefers_familiar_sequence: 1,
  sleep_routine_resists_change: 2,
  sleep_separation_accepts: -1,
  sleep_separation_checks_in: 0,
  sleep_separation_requests_presence: 1,
  sleep_separation_strong_proximity_request: 2,
  sleep_prebed_settled: -1,
  sleep_prebed_more_talking: 0,
  sleep_prebed_body_movement: 1,
  sleep_prebed_continues_activity: 1,
};

const FREQUENCY_BONUS: Record<
  NonNullable<CurrentConflictInput["recentFrequency"]>,
  number
> = {
  daily: 3,
  several_times_a_week: 2,
  weekly: 1,
  occasional: 0,
};

export interface ConflictLevelResult {
  level: ConflictLevel;
  matchedEvidenceRefs: string[];
  groundedInGeneric: boolean;
  score: number;
}

function levelFromScore(score: number): ConflictLevel {
  if (score <= -2) return "낮음";
  if (score <= 2) return "보통";
  if (score <= 5) return "높음";
  return "매우높음";
}

/**
 * 카테고리별 4단계 레벨을 계산한다. 순수함수 — 같은 입력이면 항상 같은 결과.
 */
export function scoreConflictMap(input: {
  childEvidences: BehaviorEvidence[];
  momEvidences: MomEvidence[];
  conflictInput: CurrentConflictInput;
}): Record<ConflictMapCategoryId, ConflictLevelResult> {
  const result = {} as Record<ConflictMapCategoryId, ConflictLevelResult>;

  for (const categoryId of CONFLICT_MAP_CATEGORY_IDS) {
    const mapping = CONFLICT_MAP_DOMAINS[categoryId];
    const momDomains = CONFLICT_MAP_MOM_DOMAINS[categoryId];
    let score = 0;
    const refs: string[] = [];

    let generalContribution = 0;
    for (const ev of input.childEvidences) {
      if (!mapping.generalDomains.includes(ev.domain as (typeof mapping.generalDomains)[number])) {
        continue;
      }
      const weight = GENERAL_PATTERN_WEIGHT[ev.patternId] ?? CONCERN_MICRO_PATTERN_WEIGHT[ev.patternId] ?? 0;
      if (weight === 0) continue;
      generalContribution += weight;
      refs.push(`evidence:${ev.domain}:${ev.patternId}`);
    }
    score += Math.max(-3, Math.min(3, generalContribution));

    let momContribution = 0;
    for (const ev of input.momEvidences) {
      if (!momDomains.includes(ev.domain)) continue;
      const weight = MOM_PATTERN_WEIGHT[ev.patternId] ?? 0;
      if (weight === 0) continue;
      momContribution += weight;
      refs.push(`momEvidence:${ev.domain}:${ev.patternId}`);
    }
    score += Math.max(-2, Math.min(2, momContribution));

    const hasDirectConflictInput = mapping.concernId === input.conflictInput.concernId;
    if (hasDirectConflictInput) {
      score += 2;
      score += FREQUENCY_BONUS[input.conflictInput.recentFrequency ?? "occasional"];
      refs.push(`concern:${input.conflictInput.concernId}`);
    }

    const groundedInGeneric = refs.length === 0;

    result[categoryId] = {
      level: levelFromScore(score),
      matchedEvidenceRefs: refs,
      groundedInGeneric,
      score,
    };
  }

  return result;
}
