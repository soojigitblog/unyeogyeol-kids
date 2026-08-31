// behavior-evidence 모듈
// QuestionnaireResponse 를 그대로 넘기지 않고, 먼저 deterministic 하게
// "현재 관찰된 모습(BehaviorEvidence)"으로 환산한다.
//
// 주의: 10문항뿐이므로 confidence 는 medium 이 최대. "진단/검사결과"라 부르지 않는다.

import type {
  Answers,
  Axis,
  BehaviorEvidence,
  Confidence,
  QuestionDomain,
} from "@/lib/types";
import { DOMAIN_AXIS, QUESTIONS } from "./questions";

interface PatternDef {
  observedPattern: string;
  observedLabel: string;
}

// (domain, value 1~4) -> 관찰 패턴. 어떤 값도 부정적이지 않게 서술.
const PATTERNS: Record<QuestionDomain, Record<1 | 2 | 3 | 4, PatternDef>> = {
  new_environment: {
    4: { observedPattern: "explores_new_settings_readily", observedLabel: "낯선 곳에서도 바로 관심 가는 곳으로 움직이는 모습" },
    3: { observedPattern: "brief_scan_then_engages", observedLabel: "잠깐 둘러본 뒤 어울리기 시작하는 모습" },
    2: { observedPattern: "needs_observation_time", observedLabel: "낯선 상황을 충분히 살펴본 뒤 움직이는 모습" },
    1: { observedPattern: "warms_up_with_secure_base", observedLabel: "익숙한 사람과 함께일 때 편하게 움직이는 모습" },
  },
  failure: {
    4: { observedPattern: "quick_reattempt", observedLabel: "잘 안 되면 금방 다른 방법으로 다시 해 보는 모습" },
    3: { observedPattern: "self_soothes_after_upset", observedLabel: "잠깐 속상해하다 스스로 마음을 추스르는 모습" },
    2: { observedPattern: "needs_time_to_settle", observedLabel: "마음을 가라앉히는 데 시간이 조금 걸리는 모습" },
    1: { observedPattern: "recovers_with_support", observedLabel: "곁에서 도닥여 주면 다시 힘을 내는 모습" },
  },
  self_assertion: {
    4: { observedPattern: "strong_self_direction", observedLabel: "자기 뜻이 뚜렷하고 끝까지 지키려는 모습" },
    3: { observedPattern: "asserts_but_negotiates", observedLabel: "분명히 말하되 이유를 들으면 조율하는 모습" },
    2: { observedPattern: "expresses_indirectly", observedLabel: "상황을 보며 은근하게 표현하는 모습" },
    1: { observedPattern: "harmony_oriented", observedLabel: "주변 분위기에 맞추는 걸 편해하는 모습" },
  },
  transition: {
    4: { observedPattern: "switches_readily", observedLabel: "새로운 활동으로 바로 전환하는 모습" },
    3: { observedPattern: "brief_lag_then_transitions", observedLabel: "조금 여운을 두고 곧 넘어가는 모습" },
    2: { observedPattern: "transitions_with_advance_notice", observedLabel: "미리 알려 주면 마음의 준비를 하고 넘어가는 모습" },
    1: { observedPattern: "prefers_completion_before_transition", observedLabel: "하던 것을 마무리한 뒤 넘어가는 걸 좋아하는 모습" },
  },
  social_approach: {
    4: { observedPattern: "initiates_socially", observedLabel: "또래에게 먼저 다가가 말을 거는 모습" },
    3: { observedPattern: "eases_into_group", observedLabel: "자연스럽게 무리에 스며드는 모습" },
    2: { observedPattern: "observes_then_joins", observedLabel: "지켜보다 익숙해지면 함께하는 모습" },
    1: { observedPattern: "prefers_close_small_group", observedLabel: "마음 맞는 한두 명과 노는 걸 좋아하는 모습" },
  },
  play_immersion: {
    4: { observedPattern: "deep_single_focus", observedLabel: "한 가지에 오래 깊이 빠져드는 모습" },
    3: { observedPattern: "focus_then_shift", observedLabel: "한동안 집중하다 자연스럽게 옮겨가는 모습" },
    2: { observedPattern: "broad_varied_play", observedLabel: "여러 가지를 두루두루 즐기는 모습" },
    1: { observedPattern: "novelty_seeking_play", observedLabel: "새로운 놀이를 즐겨 찾아다니는 모습" },
  },
  praise: {
    4: { observedPattern: "energized_by_praise", observedLabel: "칭찬을 들으면 신나서 더 하려는 모습" },
    3: { observedPattern: "warmed_by_shared_joy", observedLabel: "함께 기뻐해 주면 뿌듯해하는 모습" },
    2: { observedPattern: "quietly_pleased", observedLabel: "쑥스러워하면서도 속으로 좋아하는 모습" },
    1: { observedPattern: "intrinsically_motivated", observedLabel: "스스로 만족하는 걸 더 중요하게 여기는 모습" },
  },
  rule_response: {
    4: { observedPattern: "reason_seeking", observedLabel: "규칙의 이유를 꼭 알고 싶어하는 모습" },
    3: { observedPattern: "follows_when_convinced", observedLabel: "이유가 납득되면 잘 지키는 모습" },
    2: { observedPattern: "context_flexible", observedLabel: "상황과 기분에 따라 유연하게 반응하는 모습" },
    1: { observedPattern: "accepts_set_rules", observedLabel: "정해지면 대체로 그대로 따르는 모습" },
  },
  emotional_expression: {
    4: { observedPattern: "high_intensity_expression", observedLabel: "감정을 온몸으로 크고 생생하게 표현하는 모습" },
    3: { observedPattern: "open_expression", observedLabel: "표정과 말에 솔직하게 드러나는 모습" },
    2: { observedPattern: "calm_expression", observedLabel: "감정을 담담하게 표현하는 모습" },
    1: { observedPattern: "inward_then_shares", observedLabel: "속으로 간직했다가 편할 때 이야기하는 모습" },
  },
  parent_instruction: {
    4: { observedPattern: "own_way_first", observedLabel: "부탁받은 일도 자기 방식대로 해내고 싶어하는 모습" },
    3: { observedPattern: "own_pace_completes", observedLabel: "자기 속도가 있지만 결국 해내는 모습" },
    2: { observedPattern: "moves_with_engagement", observedLabel: "관심을 끌어 주면 마음이 움직이는 모습" },
    1: { observedPattern: "responsive_to_requests", observedLabel: "부탁하면 바로 응해 주는 모습" },
  },
};

function questionIdForDomain(domain: QuestionDomain): string {
  return QUESTIONS.find((q) => q.domain === domain)?.id ?? domain;
}

/**
 * 응답 -> BehaviorEvidence[].
 * 응답한 문항만 evidence 로 만든다. 문항 1개 기반이므로 confidence 는 medium.
 */
export function buildBehaviorEvidence(answers: Answers): BehaviorEvidence[] {
  const evidence: BehaviorEvidence[] = [];
  (Object.keys(PATTERNS) as QuestionDomain[]).forEach((domain) => {
    const value = answers[domain];
    if (value == null) return;
    const def = PATTERNS[domain][value];
    const confidence: Confidence = "medium"; // 문항 1개 → 과신하지 않음
    evidence.push({
      domain,
      axis: DOMAIN_AXIS[domain],
      observedPattern: def.observedPattern,
      observedLabel: def.observedLabel,
      confidence,
      sourceQuestionIds: [questionIdForDomain(domain)],
    });
  });
  return evidence;
}

/** axis -> value(1~4) 맵. free-result 생성기에서 사용. */
export type AxisValues = Partial<Record<Axis, 1 | 2 | 3 | 4>>;

export function axisValues(answers: Answers): AxisValues {
  const out: AxisValues = {};
  (Object.keys(DOMAIN_AXIS) as QuestionDomain[]).forEach((domain) => {
    const v = answers[domain];
    if (v != null) out[DOMAIN_AXIS[domain]] = v;
  });
  return out;
}

export function answeredCount(answers: Answers): number {
  return Object.values(answers).filter((x) => x != null).length;
}

export type Band = "low" | "mid_low" | "mid_high" | "high";
export function band(v: number | undefined): Band {
  if (v == null) return "mid_low";
  if (v >= 4) return "high";
  if (v >= 3) return "mid_high";
  if (v >= 2) return "mid_low";
  return "low";
}
