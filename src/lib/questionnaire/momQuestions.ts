// mom-questions 모듈: 엄마 반응 Mini Check 5문항
//
// 원칙:
// 1. 점수 없음 (Numeric score = 0).
// 2. 우열/사회적 바람직성 배제.
// 3. 실제 육아 현장에서 자주 나타나는 중립적 4지선다.

import type { MomAxis, MomDomain, MomQuestion } from "@/lib/types";

export const MOM_DOMAIN_AXIS: Record<MomDomain, MomAxis> = {
  time_pressure_style: "urgency_pace",
  emotion_coping_style: "emotional_containment",
  instruction_resistance_style: "boundary_enforcement",
  routine_flexibility_style: "schedule_change_response",
  conflict_recovery_style: "post_conflict_processing",
};

export const MOM_QUESTIONS: MomQuestion[] = [
  {
    id: "mom_q1_time",
    domain: "time_pressure_style",
    prompt: "외출 시간이 다가오는데 준비가 늦어질 때, 보통 어떤 편인가요?",
    options: [
      {
        optionId: "opt_time_control",
        patternId: "fast_pace_directive",
        label: "시간을 맞추려 말이 빨라지거나 직접 챙기기 시작해요.",
      },
      {
        optionId: "opt_time_notify",
        patternId: "time_notice_prompt",
        label: "남은 시간을 계속 알려주며 다음 행동을 재촉해요.",
      },
      {
        optionId: "opt_time_wait",
        patternId: "patient_pace_holding",
        label: "조금 늦더라도 아이가 스스로 마무리할 때까지 기다려요.",
      },
      {
        optionId: "opt_time_substitute",
        patternId: "direct_assistance_takeover",
        label: "실랑이하기보다 제가 직접 옷이나 신발을 신겨서 끝내요.",
      },
    ],
  },
  {
    id: "mom_q2_emotion",
    domain: "emotion_coping_style",
    prompt: "아이가 뜻대로 안 되어 크게 울거나 속상해할 때, 보통 어떤 반응이 먼저 나오나요?",
    options: [
      {
        optionId: "opt_emo_explain",
        patternId: "logical_explanation_first",
        label: "왜 안 되는지 이유를 차근차근 설명하며 이해시키려 해요.",
      },
      {
        optionId: "opt_emo_hold",
        patternId: "silent_emotional_presence",
        label: "아이가 마음을 가라앉힐 때까지 곁에서 조용히 기다려요.",
      },
      {
        optionId: "opt_emo_redirect",
        patternId: "focus_redirection",
        label: "다른 장난감이나 재미있는 이야기로 분위기를 전환해요.",
      },
      {
        optionId: "opt_emo_overwhelm",
        patternId: "immediate_stress_activation",
        label: "상황을 빨리 멈추고 싶어 당황스럽거나 마음이 복잡해져요.",
      },
    ],
  },
  {
    id: "mom_q3_instruction",
    domain: "instruction_resistance_style",
    prompt: "꼭 해야 할 일을 부탁했는데 아이가 “싫어!” 하고 거부할 때, 어떻게 대응하시나요?",
    options: [
      {
        optionId: "opt_inst_firm",
        patternId: "firm_boundary_insistence",
        label: "규칙과 해야 할 일임을 분명하게 짚어주며 밀고 가요.",
      },
      {
        optionId: "opt_inst_negotiate",
        patternId: "conditional_tradeoff",
        label: "“이것 먼저 하면 저거 하자”처럼 조건이나 순서를 제안해요.",
      },
      {
        optionId: "opt_inst_listen",
        patternId: "inquiry_into_reason",
        label: "왜 하기 싫은지 아이의 이야기나 이유를 먼저 물어봐요.",
      },
      {
        optionId: "opt_inst_defer",
        patternId: "temporary_deescalation",
        label: "감정싸움을 피하기 위해 잠시 시간을 두고 나중에 다시 말해요.",
      },
    ],
  },
  {
    id: "mom_q4_routine",
    domain: "routine_flexibility_style",
    prompt: "오늘 세워둔 계획이나 루틴이 아이 일로 갑자기 틀어졌을 때, 주로 어떤 마음이 드나요?",
    options: [
      {
        optionId: "opt_rout_replan",
        patternId: "rapid_rescheduling",
        label: "아쉽지만 다음 순서나 대안을 머릿속으로 빠르게 다시 짜요.",
      },
      {
        optionId: "opt_rout_follow_child",
        patternId: "child_lead_adaptation",
        label: "계획보다 지금 아이의 컨디션이나 흐름에 맞추는 편이에요.",
      },
      {
        optionId: "opt_rout_hold_plan",
        patternId: "preference_for_structure",
        label: "정해진 일정이 어그러지면 마음이 다소 답답하고 신경 쓰여요.",
      },
      {
        optionId: "opt_rout_ease",
        patternId: "situational_acceptance",
        label: "“아이 키우면 이럴 수 있지” 하고 크게 개의치 않아요.",
      },
    ],
  },
  {
    id: "mom_q5_recovery",
    domain: "conflict_recovery_style",
    prompt: "아이와 한바탕 부딪히고 난 뒤, 엄마의 마음은 주로 어떻게 정리되나요?",
    options: [
      {
        optionId: "opt_rec_repair",
        patternId: "active_reconnection",
        label: "감정이 가라앉은 뒤 안아주거나 다정하게 대화를 시도해요.",
      },
      {
        optionId: "opt_rec_alone",
        patternId: "need_solitude_reset",
        label: "제 마음이 정리될 때까지 혼자 숨을 고를 시간이 꼭 필요해요.",
      },
      {
        optionId: "opt_rec_natural",
        patternId: "natural_routine_return",
        label: "시간이 조금 지나면 자연스럽게 평소 일상으로 돌아가요.",
      },
      {
        optionId: "opt_rec_ruminate",
        patternId: "post_event_self_reflection",
        label: "‘내가 더 부드럽게 말할걸’ 하며 당시 상황을 되짚어봐요.",
      },
    ],
  },
];

export const TOTAL_MOM_QUESTIONS = MOM_QUESTIONS.length; // 5
