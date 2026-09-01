// Sleep Concern Micro Check Questions (4 문항) — P2.2V.8
//
// 원칙:
// - 점수화/진단/수면장애 판정 금지
// - 관찰 가능한 행동 묘사만
// - sleep Concern 선택 시에만 노출

import { concernMicroEvidence } from "@/lib/evidence/builders";
import type { BehaviorEvidence, SleepMicroCheckAnswers, SleepMicroEvidenceDomain } from "@/lib/types";

export interface SleepOption {
  optionId: string;
  patternId: SleepMicroCheckAnswers[keyof SleepMicroCheckAnswers];
  label: string;
}

export interface SleepQuestion {
  id: keyof SleepMicroCheckAnswers;
  number: number;
  title: string;
  subtitle: string;
  options: SleepOption[];
}

const PATTERN_META: Record<
  string,
  { domain: SleepMicroEvidenceDomain; label: string; qId: string }
> = {
  sleep_transition_accepts_bedtime: {
    domain: "sleep_bedtime",
    label: "잠자리 안내에 비교적 자연스럽게 따라가는 모습이 있어요.",
    qId: "sleep_q1",
  },
  sleep_transition_needs_completion: {
    domain: "sleep_bedtime",
    label: "잠자리로 넘어가기 전 하던 활동을 마무리하려는 모습이 있어요.",
    qId: "sleep_q1",
  },
  sleep_transition_delays_bedtime: {
    domain: "sleep_bedtime",
    label: "잠자리로 가는 시간을 다른 행동으로 미루는 모습이 있어요.",
    qId: "sleep_q1",
  },
  sleep_transition_strong_refusal: {
    domain: "sleep_bedtime",
    label: "잠자리로 가는 것을 강하게 거부하거나 자리를 벗어나려는 모습이 있어요.",
    qId: "sleep_q1",
  },
  sleep_routine_flexible: {
    domain: "sleep_routine",
    label: "잠자리 준비 순서가 바뀌어도 크게 신경 쓰지 않는 편이에요.",
    qId: "sleep_q2",
  },
  sleep_routine_accepts_explanation: {
    domain: "sleep_routine",
    label: "순서가 바뀌면 설명을 들은 뒤 따라가는 편이에요.",
    qId: "sleep_q2",
  },
  sleep_routine_prefers_familiar_sequence: {
    domain: "sleep_routine",
    label: "익숙한 잠자리 준비 순서를 찾으려는 모습이 있어요.",
    qId: "sleep_q2",
  },
  sleep_routine_resists_change: {
    domain: "sleep_routine",
    label: "평소와 다른 잠자리 순서에 강하게 거부하는 모습이 있어요.",
    qId: "sleep_q2",
  },
  sleep_separation_accepts: {
    domain: "sleep_separation",
    label: "불을 끄거나 곁을 비우는 상황을 비교적 자연스럽게 받아들이는 편이에요.",
    qId: "sleep_q3",
  },
  sleep_separation_checks_in: {
    domain: "sleep_separation",
    label: "곁을 비우려 할 때 잠깐 확인하거나 말을 거는 모습이 있어요.",
    qId: "sleep_q3",
  },
  sleep_separation_requests_presence: {
    domain: "sleep_separation",
    label: "잠자리에서 곁에 더 있어달라고 하는 모습이 있어요.",
    qId: "sleep_q3",
  },
  sleep_separation_strong_proximity_request: {
    domain: "sleep_separation",
    label: "곁을 비우려 할 때 강하게 붙잡거나 다시 일어나는 모습이 있어요.",
    qId: "sleep_q3",
  },
  sleep_prebed_settled: {
    domain: "sleep_prebed",
    label: "잠들기 직전 조용히 누워 있는 편이에요.",
    qId: "sleep_q4",
  },
  sleep_prebed_more_talking: {
    domain: "sleep_prebed",
    label: "잠들기 직전 이야기를 더 하려는 모습이 있어요.",
    qId: "sleep_q4",
  },
  sleep_prebed_body_movement: {
    domain: "sleep_prebed",
    label: "잠들기 직전 몸을 많이 움직이거나 뒤척이는 모습이 있어요.",
    qId: "sleep_q4",
  },
  sleep_prebed_continues_activity: {
    domain: "sleep_prebed",
    label: "침대에서도 다른 놀이나 행동을 이어가려는 모습이 있어요.",
    qId: "sleep_q4",
  },
};

export const SLEEP_QUESTIONS: SleepQuestion[] = [
  {
    id: "bedtime_transition",
    number: 1,
    title: "잠자리에 들어갈 시간이 되면 주로 어떤 모습인가요?",
    subtitle: "잠자리로 넘어갈 때 보이는 첫 행동",
    options: [
      {
        optionId: "opt_sleep_q1_1",
        patternId: "sleep_transition_accepts_bedtime",
        label: "안내하면 비교적 자연스럽게 잠자리로 간다",
      },
      {
        optionId: "opt_sleep_q1_2",
        patternId: "sleep_transition_needs_completion",
        label: "하던 활동을 조금 더 마무리하려 한다",
      },
      {
        optionId: "opt_sleep_q1_3",
        patternId: "sleep_transition_delays_bedtime",
        label: "다른 행동을 하며 잠자리를 미룬다",
      },
      {
        optionId: "opt_sleep_q1_4",
        patternId: "sleep_transition_strong_refusal",
        label: "강하게 거부하거나 자리를 자주 벗어난다",
      },
    ],
  },
  {
    id: "routine_order",
    number: 2,
    title: "잠자리 준비 순서가 바뀌면?",
    subtitle: "양치·책 읽기·불 끄기 등 순서가 달라질 때",
    options: [
      {
        optionId: "opt_sleep_q2_1",
        patternId: "sleep_routine_flexible",
        label: "크게 신경 쓰지 않는다",
      },
      {
        optionId: "opt_sleep_q2_2",
        patternId: "sleep_routine_accepts_explanation",
        label: "설명해주면 따라가는 편이다",
      },
      {
        optionId: "opt_sleep_q2_3",
        patternId: "sleep_routine_prefers_familiar_sequence",
        label: "익숙한 순서를 찾으려 한다",
      },
      {
        optionId: "opt_sleep_q2_4",
        patternId: "sleep_routine_resists_change",
        label: "평소 하던 순서가 아니면 강하게 거부하는 편이다",
      },
    ],
  },
  {
    id: "lights_off_departure",
    number: 3,
    title: "불을 끄거나 보호자가 자리를 떠나려 할 때?",
    subtitle: "혼자 남거나 곁을 비울 때의 반응",
    options: [
      {
        optionId: "opt_sleep_q3_1",
        patternId: "sleep_separation_accepts",
        label: "비교적 자연스럽게 받아들인다",
      },
      {
        optionId: "opt_sleep_q3_2",
        patternId: "sleep_separation_checks_in",
        label: "잠깐 확인하거나 말을 건다",
      },
      {
        optionId: "opt_sleep_q3_3",
        patternId: "sleep_separation_requests_presence",
        label: "곁에 더 있어달라고 한다",
      },
      {
        optionId: "opt_sleep_q3_4",
        patternId: "sleep_separation_strong_proximity_request",
        label: "강하게 붙잡거나 다시 일어난다",
      },
    ],
  },
  {
    id: "pre_sleep",
    number: 4,
    title: "잠들기 직전 가장 흔한 모습은?",
    subtitle: "침대에 누운 뒤 잠들기 전 행동",
    options: [
      {
        optionId: "opt_sleep_q4_1",
        patternId: "sleep_prebed_settled",
        label: "조용히 누워 있는 편",
      },
      {
        optionId: "opt_sleep_q4_2",
        patternId: "sleep_prebed_more_talking",
        label: "이야기를 더 하려고 한다",
      },
      {
        optionId: "opt_sleep_q4_3",
        patternId: "sleep_prebed_body_movement",
        label: "몸을 많이 움직이거나 뒤척인다",
      },
      {
        optionId: "opt_sleep_q4_4",
        patternId: "sleep_prebed_continues_activity",
        label: "다른 놀이/행동을 이어가려 한다",
      },
    ],
  },
];

export function buildSleepEvidence(answers: SleepMicroCheckAnswers): BehaviorEvidence[] {
  const evidences: BehaviorEvidence[] = [];

  for (const value of Object.values(answers)) {
    if (!value) continue;
    const meta = PATTERN_META[value];
    if (!meta) continue;
    evidences.push(
      concernMicroEvidence({
        domain: meta.domain,
        concernId: "sleep",
        patternId: value,
        observedLabel: meta.label,
        questionIds: [meta.qId],
      })
    );
  }

  return evidences;
}
