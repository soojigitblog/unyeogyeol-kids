// p2.fixtures 모듈: P2.2H 인터랙션 모델 검증 및 유료 리포트 Mock 생성을 위한 5개 가족 Fixture 정의
//
// P2.2V.6: 관계(caregiver)를 fixture 마다 다르게 두어 호칭/조사 깨짐을 함께 검수한다.
// Family A: 32개월 남아 × 엄마 / 전환 시 완결 욕구 vs 시간 압박 (Friction)
// Family B: 48개월 여아 × 아빠 / 신중한 아이(긴 탐색) vs 참여 권유 (Friction)
// Family C: 60개월 남아 × 할머니 / 감정 표현 큰 아이 vs 설명 우선 (Friction)
// Family D: 40개월 여아 × 이모 / 자기 방식 강한 아이(주도성) vs 규칙 안내 (Friction)
// Family E: 28개월 남아 × 삼촌 / 출생시간 모름 + 신중한 탐색과 묵묵한 기다림 (Low-Friction 협력형)

import type {
  BehaviorEvidence,
  CaregiverProfile,
  ChildProfile,
  CurrentConflictInput,
  FortuneFacts,
  MomAnswers,
} from "@/lib/types";

export interface FamilyFixture {
  fixtureId: "A" | "B" | "C" | "D" | "E";
  title: string;
  description: string;
  childProfile: ChildProfile;
  /** P2.2V.6: fixture 마다 다른 관계(엄마/아빠/할머니/이모)로 문구 깨짐을 검수한다. */
  caregiverProfile: CaregiverProfile;
  childEvidences: BehaviorEvidence[];
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput;
  fortuneFacts?: FortuneFacts | null;
  expectedRuleId: string;
  expectedInteractionType: "friction" | "collaborative" | "neutral";
}

export const FAMILY_FIXTURES: FamilyFixture[] = [
  // Family A: 전환 × 시간압박 충돌
  {
    fixtureId: "A",
    title: "민준 (32개월 남아) - 전환 × 시간압박 충돌",
    description: "32개월 남아 / 전환 시 완결 욕구 vs 시간 압박 (Friction)",
    caregiverProfile: {
      role: "mother",
      roleLabel: "엄마",
      displayName: "민준맘",
      birthDate: "1991-05-14",
      birthTimeKnown: false,
    },
    childProfile: {
      name: "민준",
      birthDate: "2024-01-15",
      birthTimeKnown: true,
      birthTime: "10:30",
      gender: "boy",
    },
    childEvidences: [
      {
        domain: "transition",
        axis: "transition_preference",
        observedPattern: "needs_completion_before_transition",
        observedLabel: "하던 놀이를 끝맺은 뒤 이동하려는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q4_transition", "deep_q1_trans_meal"],
      },
      {
        domain: "self_assertion",
        axis: "strong_self_direction",
        observedPattern: "strong_independent_preference",
        observedLabel: "자기가 직접 고르고 이끌고자 하는 태도",
        confidence: "medium",
        sourceQuestionIds: ["q3_self_assertion"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_control", // fast_pace_directive
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "discipline",
      scenarioId: "sc_discipline_instruction",
      childFirstReaction: "외출 전 하던 블록 놀이를 끝마치려고 계속 손을 움직임",
      momFirstReaction: "시간에 늦지 않으려 '빨리 신발 신자, 늦었어!' 하고 재촉함",
      subsequentEscalation: "아이가 제자리에 멈춰 서서 신발 신기를 미루고 실랑이가 이어짐",
      recentFrequency: "daily",
      momTypicalPhrase: "빨리 신발 신자, 늦었어!",
    },
    fortuneFacts: {
      day: { stem: "갑", branch: "자", stemElement: "wood", branchElement: "water" },
      dayMasterElement: "wood",
      hour: { stem: "기", branch: "사", stemElement: "earth", branchElement: "fire" },
      hourTenGod: "정재",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedRuleId: "rule_friction_completion_vs_time",
    expectedInteractionType: "friction",
  },

  // Family B: 신중한 아이 × 참여를 권하는 아빠
  {
    fixtureId: "B",
    title: "서연 (48개월 여아) - 신중한 아이 × 참여를 권하는 아빠",
    description: "48개월 여아 / 낯선 환경 신중한 탐색 vs 조급함과 참여 권유 (Friction)",
    caregiverProfile: {
      role: "father",
      roleLabel: "아빠",
      birthDate: "1989-11-02",
      birthTimeKnown: true,
      birthTime: "07:00",
    },
    childProfile: {
      name: "서연",
      birthDate: "2022-09-10",
      birthTimeKnown: true,
      birthTime: "14:20",
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "new_environment",
        axis: "needs_observation_time",
        observedPattern: "takes_long_to_observe",
        observedLabel: "새로운 상황에서 주변을 오래 살피는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q1_new_environment"],
      },
      {
        domain: "social_approach",
        axis: "social_warmup_style",
        observedPattern: "hides_behind_parent",
        observedLabel: "낯선 사람 앞에서는 곁에 머물며 살피는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q5_social_approach"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_overwhelm", // immediate_stress_activation
      instruction_resistance_style: "opt_inst_listen",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "shyness",
      scenarioId: "sc_shyness_hesitation",
      childFirstReaction: "새로운 놀이터에서 바로 들어가지 않고 곁에 서서 주변을 지켜봄",
      momFirstReaction: "아이가 머뭇거리자 '친구들한테 가서 인사해보자' 하고 참여를 권함",
      subsequentEscalation: "아이가 계속 곁에 서 있고 권유하는 말이 반복됨",
      recentFrequency: "several_times_a_week",
      momTypicalPhrase: "친구들한테 가서 인사해보자, 얼른 가봐.",
    },
    fortuneFacts: {
      day: { stem: "계", branch: "축", stemElement: "water", branchElement: "earth" },
      dayMasterElement: "water",
      hour: { stem: "경", branch: "신", stemElement: "metal", branchElement: "metal" },
      hourTenGod: "정인",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedRuleId: "rule_friction_observation_vs_stress",
    expectedInteractionType: "friction",
  },

  // Family C: 감정 표현 큰 아이 × 설명이 먼저 나오는 할머니
  {
    fixtureId: "C",
    title: "도윤 (60개월 남아) - 감정 표현 큰 아이 × 설명이 먼저 나오는 할머니",
    description: "60개월 남아 / 감정 표현이 큰 아이 vs 논리적 설명이 먼저 나오는 보호자 (Friction)",
    caregiverProfile: {
      role: "paternal_grandmother",
      roleLabel: "할머니",
      birthDate: "1962-03-08",
      birthTimeKnown: false,
    },
    childProfile: {
      name: "도윤",
      birthDate: "2021-08-05",
      birthTimeKnown: true,
      birthTime: "08:15",
      gender: "boy",
    },
    childEvidences: [
      {
        domain: "praise",
        axis: "motivation_source",
        observedPattern: "energized_by_praise",
        observedLabel: "칭찬을 들으면 신나서 더 적극적으로 참여하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q7_praise"],
      },
      {
        domain: "emotional_expression",
        axis: "emotional_expression_intensity",
        observedPattern: "intense_emotional_burst",
        observedLabel: "속상할 때 목소리를 높이며 크게 울음을 터뜨리는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q9_emotional_expression"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_notify",
      emotion_coping_style: "opt_emo_explain", // logical_explanation_first
      instruction_resistance_style: "opt_inst_listen",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "tantrum",
      scenarioId: "sc_tantrum_burst",
      childFirstReaction: "뜻대로 조립되지 않자 속상한 마음에 소리를 내며 울음을 터뜨림",
      momFirstReaction: "'울지 말고 천천히 이야기해봐, 이건 이렇게 맞춰야 해' 하며 이유를 설명함",
      subsequentEscalation: "아이가 감정을 가라앉히지 못하고 설명이 바로 전달되지 않음",
      recentFrequency: "several_times_a_week",
      momTypicalPhrase: "울지 말고 천천히 이야기해봐, 왜 그래?",
    },
    fortuneFacts: {
      day: { stem: "병", branch: "오", stemElement: "fire", branchElement: "fire" },
      dayMasterElement: "fire",
      hour: { stem: "임", branch: "진", stemElement: "water", branchElement: "earth" },
      hourTenGod: "편관",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedRuleId: "rule_friction_emotion_vs_explanation",
    expectedInteractionType: "friction",
  },

  // Family D: 자기 방식 강한 아이 × 원칙/규칙 안내 엄마
  {
    fixtureId: "D",
    title: "하은 (40개월 여아) - 자기 방식 강한 아이 × 단호한 규칙 안내의 이모",
    description: "40개월 여아 / 자기 방식 강한 아이(주도성) vs 원칙을 강조하는 보호자 (Friction)",
    caregiverProfile: {
      role: "aunt",
      roleLabel: "이모",
      birthDate: "1994-07-21",
      birthTimeKnown: false,
    },
    childProfile: {
      name: "하은",
      birthDate: "2023-04-12",
      birthTimeKnown: true,
      birthTime: "18:00",
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "self_assertion",
        axis: "strong_self_direction",
        observedPattern: "strong_independent_preference",
        observedLabel: "스스로 결정하고 이끌어가는 것을 선호하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q3_self_assertion"],
      },
      {
        domain: "rule_response",
        axis: "rule_negotiation_style",
        observedPattern: "reason_seeking",
        observedLabel: "규칙이나 이유에 대한 설명을 듣고 이해하려는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q8_rule_response"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm", // firm_boundary_insistence
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "stubborn",
      scenarioId: "sc_stubborn_insistence",
      childFirstReaction: "양치나 옷 입기 등 규칙 상황에서 자기가 고른 방식으로 하겠다고 주장함",
      momFirstReaction: "정해진 일과를 지키기 위해 '지금 해야 할 시간이야, 어서 해' 하고 단호하게 안내함",
      subsequentEscalation: "아이가 자기 방식을 굽히지 않고 버티며 실랑이가 길어짐",
      recentFrequency: "daily",
      momTypicalPhrase: "지금 해야 할 시간이야, 어서 해.",
    },
    fortuneFacts: {
      day: { stem: "경", branch: "신", stemElement: "metal", branchElement: "metal" },
      dayMasterElement: "metal",
      hour: { stem: "을", branch: "유", stemElement: "wood", branchElement: "metal" },
      hourTenGod: "정재",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedRuleId: "rule_friction_autonomy_vs_firmness",
    expectedInteractionType: "friction",
  },

  // Family E: LOW-FRICTION 가족
  {
    fixtureId: "E",
    title: "지호 (28개월 남아) - 신중한 아이 × 묵묵히 기다려주는 삼촌 (LOW-FRICTION)",
    description: "28개월 남아 / 출생시간 모름 + 신중한 탐색과 묵묵한 기다림 (Low-Friction 협력형)",
    caregiverProfile: {
      role: "uncle",
      roleLabel: "삼촌",
      birthDate: "1993-09-30",
      birthTimeKnown: false,
    },
    childProfile: {
      name: "지호",
      birthDate: "2024-04-20",
      birthTimeKnown: false, // 출생시간 모름
      gender: "boy",
    },
    childEvidences: [
      {
        domain: "new_environment",
        axis: "needs_observation_time",
        observedPattern: "takes_long_to_observe",
        observedLabel: "새로운 상황에서 천천히 살펴보는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q1_new_environment"],
      },
      {
        domain: "emotional_expression",
        axis: "emotional_expression_intensity",
        observedPattern: "seeks_reassurance",
        observedLabel: "마음이 놓일 때까지 곁에서 탐색하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q9_emotional_expression"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_wait", // patient_pace_holding
      emotion_coping_style: "opt_emo_hold", // silent_emotional_presence
      instruction_resistance_style: "opt_inst_listen",
      routine_flexibility_style: "opt_rout_follow_child",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "daycare",
      scenarioId: "sc_daycare_separation",
      childFirstReaction: "어린이집 입구에서 곁에 머물며 주변을 조용히 둘러봄",
      momFirstReaction: "재촉하지 않고 곁에서 손을 잡은 채 함께 서서 기다려줌",
      subsequentEscalation: "아이가 스스로 상황을 둘러본 뒤 자연스럽게 한 걸음 걸어 들어감",
      recentFrequency: "occasional",
      momTypicalPhrase: "천천히 둘러보고 들어가고 싶을 때 들어가자.",
    },
    fortuneFacts: {
      day: { stem: "병", branch: "오", stemElement: "fire", branchElement: "fire" },
      dayMasterElement: "fire",
      hour: null,
      hourTenGod: null,
      year: "unknown",
      month: "unknown",
      birthTimeKnown: false,
      supported: { dayPillar: true, hourPillar: false, yearPillar: false, monthPillar: false },
    },
    expectedRuleId: "rule_collab_observation_and_patience",
    expectedInteractionType: "collaborative",
  },
];
