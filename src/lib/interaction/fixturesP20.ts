// fixtures-p20 모듈: P2.0 검증용 Fixtures A~I
//
// A: 전환 + 자기주도 (32개월, Band A) - 2관찰 + 갈등 = MEDIUM
// B: 낯선 환경 신중성 (48개월, Band B)
// C: 탐색/칭찬 반응 (60개월, Band C)
// D: 몰입 + 이유 요구 (40개월, Band B)
// E: 관찰과 사주 불일치 (28개월, Band A, 사주=Fire(외향) vs 관찰=신중/탐색 -> 관찰 우선, OMIT/Conflict)
// F: 응답이 서로 일부 모순되는 아이 (일반 전환 vs 몰입 놀이 끝맺음 요구 -> 맥락 차이 해결)
// G: 뚜렷한 dominant pattern이 없는 아이 (골고루 중간형 -> 무리한 OO형 단정 금지, 관찰 연결 요약)
// H: 사주와 설문 강한 충돌 (사주=Metal(원칙) vs 설문=초유연 -> Observation 우선, 억지 일치 금지)
// I: 출생시간 UNKNOWN (체감가치 유지 및 day master 단독 보조 힌트)

import type {
  BehaviorEvidence,
  ChildProfile,
  CurrentConflictInput,
  FortuneFacts,
  MomAnswers,
} from "@/lib/types";

export interface ExtendedFixture {
  fixtureId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";
  title: string;
  ageBandCode: "A" | "B" | "C";
  childProfile: ChildProfile;
  childEvidences: BehaviorEvidence[];
  momAnswers: MomAnswers;
  conflictInput: CurrentConflictInput;
  fortuneFacts: FortuneFacts | null;
  expectedFeature: string;
}

export const EXTENDED_FIXTURES: ExtendedFixture[] = [
  // Fixture A: 32개월 (Band A), 전환 + 자기주도
  {
    fixtureId: "A",
    title: "민준 (32개월 남아, Band A) - 전환 + 자기주도 일관",
    ageBandCode: "A",
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
        domain: "transition",
        axis: "transition_preference",
        observedPattern: "needs_completion_before_transition",
        observedLabel: "외출 전 만지던 물건을 정리하려는 모습",
        confidence: "medium",
        sourceQuestionIds: ["deep_q2_trans_leaving"],
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
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "discipline",
      scenarioId: "sc_discipline_instruction",
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
    expectedFeature: "Multi-evidence transition medium claim (2 obs + conflict is MEDIUM)",
  },

  // Fixture B: 48개월 (Band B), 낯선 환경 신중성
  {
    fixtureId: "B",
    title: "서연 (48개월 여아, Band B) - 낯선 환경 신중 탐색",
    ageBandCode: "B",
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
        observedPattern: "observes_then_joins",
        observedLabel: "친구들이 노는 모습을 지켜보다 익숙해지면 함께하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q5_social_approach"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_notify",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
      routine_flexibility_style: "opt_rout_hold_plan",
      conflict_recovery_style: "opt_rec_ruminate",
    },
    conflictInput: {
      concernId: "shyness",
      scenarioId: "sc_shyness_hesitation",
      momTypicalPhrase: "친구들한테 가서 안녕 해야지.",
    },
    fortuneFacts: {
      day: { stem: "경", branch: "신", stemElement: "metal", branchElement: "metal" },
      dayMasterElement: "metal",
      hour: { stem: "계", branch: "미", stemElement: "water", branchElement: "earth" },
      hourTenGod: "상관",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "Consistent observation pattern",
  },

  // Fixture C: 60개월 (Band C), 탐색 및 칭찬 반응
  {
    fixtureId: "C",
    title: "도윤 (60개월 남아, Band C) - 탐색/칭찬 반응",
    ageBandCode: "C",
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
        domain: "new_environment",
        axis: "needs_observation_time",
        observedPattern: "brief_scan_then_engages",
        observedLabel: "잠깐 둘러본 뒤 움직이는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q1_new_environment"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_wait",
      emotion_coping_style: "opt_emo_hold",
      instruction_resistance_style: "opt_inst_listen",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "learning",
      scenarioId: "sc_focus_play",
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
    expectedFeature: "Praise motivation traceable advice",
  },

  // Fixture D: 40개월 (Band B), 몰입 + 이유 요구
  {
    fixtureId: "D",
    title: "하은 (40개월 여아, Band B) - 몰입 + 이유 요구",
    ageBandCode: "B",
    childProfile: {
      name: "하은",
      birthDate: "2023-04-12",
      birthTimeKnown: true,
      birthTime: "18:00",
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "play_immersion",
        axis: "play_focus_style",
        observedPattern: "deep_single_focus",
        observedLabel: "한 가지 놀이에 오래 깊이 몰입하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q6_play"],
      },
      {
        domain: "rule_response",
        axis: "rule_negotiation_style",
        observedPattern: "reason_seeking",
        observedLabel: "규칙이나 이유에 대한 설명을 차분히 듣고 이해하려는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q8_rule"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_wait",
      emotion_coping_style: "opt_emo_redirect",
      instruction_resistance_style: "opt_inst_defer",
      routine_flexibility_style: "opt_rout_ease",
      conflict_recovery_style: "opt_rec_natural",
    },
    conflictInput: {
      concernId: "focus_play",
      scenarioId: "sc_focus_play",
    },
    fortuneFacts: {
      day: { stem: "무", branch: "술", stemElement: "earth", branchElement: "earth" },
      dayMasterElement: "earth",
      hour: { stem: "신", branch: "유", stemElement: "metal", branchElement: "metal" },
      hourTenGod: "상관",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "Play immersion focus",
  },

  // Fixture E: 28개월 (Band A), 관찰과 사주 불일치 (사주=Fire 외향 vs 관찰=신중/탐색)
  {
    fixtureId: "E",
    title: "지호 (28개월 남아, Band A) - 관찰과 사주 불일치 (관찰 우선)",
    ageBandCode: "A",
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
        observedLabel: "마음이 놓일 때까지 엄마 곁에서 탐색하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q9_emotional_expression"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_wait",
      emotion_coping_style: "opt_emo_hold",
      instruction_resistance_style: "opt_inst_listen",
      routine_flexibility_style: "opt_rout_follow_child",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "daycare",
      scenarioId: "sc_daycare_separation",
      momTypicalPhrase: "천천히 보고 마음 준비되면 가자.",
    },
    fortuneFacts: {
      day: { stem: "병", branch: "인", stemElement: "fire", branchElement: "wood" },
      dayMasterElement: "fire", // 사주는 불(외향)
      hour: null,
      hourTenGod: null,
      year: "unknown",
      month: "unknown",
      birthTimeKnown: false,
      supported: { dayPillar: true, hourPillar: false, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "Observation overrides fortune without forced agreement",
  },

  // Fixture F: 모순되는 응답 (일반 활동에서는 유연 vs 특정 놀이에서는 마침표 고집)
  {
    fixtureId: "F",
    title: "예준 (42개월 남아, Band B) - 모순 응답 (Context 차이 해결)",
    ageBandCode: "B",
    childProfile: {
      name: "예준",
      birthDate: "2023-02-10",
      birthTimeKnown: true,
      birthTime: "11:00",
      gender: "boy",
    },
    childEvidences: [
      {
        domain: "transition",
        axis: "transition_preference",
        observedPattern: "switches_readily",
        observedLabel: "일반적인 상황에서는 부르면 바로 전환하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q4_transition"],
      },
      {
        domain: "transition",
        axis: "transition_preference",
        observedPattern: "needs_completion_before_transition",
        observedLabel: "몰입하던 놀이에서는 끝맺음을 필요로 하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["deep_q1_trans_meal"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_notify",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_negotiate",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "discipline",
      scenarioId: "sc_discipline_instruction",
    },
    fortuneFacts: {
      day: { stem: "을", branch: "묘", stemElement: "wood", branchElement: "wood" },
      dayMasterElement: "wood",
      hour: { stem: "임", branch: "오", stemElement: "water", branchElement: "fire" },
      hourTenGod: "정인",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "Contradiction resolved as context-dependent trait",
  },

  // Fixture G: 뚜렷한 dominant pattern 없는 아이 (골고루 중간/균형)
  {
    fixtureId: "G",
    title: "채원 (50개월 여아, Band B) - 균형형 (OO형 단정 금지)",
    ageBandCode: "B",
    childProfile: {
      name: "채원",
      birthDate: "2022-06-25",
      birthTimeKnown: true,
      birthTime: "15:30",
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "social_approach",
        axis: "social_warmup_style",
        observedPattern: "moderate_pace",
        observedLabel: "상황에 맞춰 자연스럽게 어울리는 모습",
        confidence: "low",
        sourceQuestionIds: ["q5_social_approach"],
      },
      {
        domain: "self_assertion",
        axis: "strong_self_direction",
        observedPattern: "moderate_pace",
        observedLabel: "자기 의견을 부드럽게 조율하는 모습",
        confidence: "low",
        sourceQuestionIds: ["q3_self_assertion"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_wait",
      emotion_coping_style: "opt_emo_hold",
      instruction_resistance_style: "opt_inst_negotiate",
      routine_flexibility_style: "opt_rout_ease",
      conflict_recovery_style: "opt_rec_natural",
    },
    conflictInput: {
      concernId: "etc",
      scenarioId: "sc_focus_play",
    },
    fortuneFacts: {
      day: { stem: "기", branch: "축", stemElement: "earth", branchElement: "earth" },
      dayMasterElement: "earth",
      hour: { stem: "신", branch: "미", stemElement: "metal", branchElement: "earth" },
      hourTenGod: "식신",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "No forced archetype, safe balanced description",
  },

  // Fixture H: 사주와 설문 강한 충돌 (사주=Metal 원칙/완벽 vs 설문=초유연)
  {
    fixtureId: "H",
    title: "시우 (35개월 남아, Band A) - 사주와 설문 강한 충돌 (설문 우선)",
    ageBandCode: "A",
    childProfile: {
      name: "시우",
      birthDate: "2023-09-18",
      birthTimeKnown: true,
      birthTime: "09:00",
      gender: "boy",
    },
    childEvidences: [
      {
        domain: "rule_response",
        axis: "rule_negotiation_style",
        observedPattern: "context_flexible",
        observedLabel: "상황과 분위기에 따라 유연하게 반응하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q8_rule_response"],
      },
      {
        domain: "transition",
        axis: "transition_preference",
        observedPattern: "switches_readily",
        observedLabel: "새로운 활동으로 언제든 편안하게 전환하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q4_transition"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_wait",
      emotion_coping_style: "opt_emo_redirect",
      instruction_resistance_style: "opt_inst_defer",
      routine_flexibility_style: "opt_rout_follow_child",
      conflict_recovery_style: "opt_rec_natural",
    },
    conflictInput: {
      concernId: "etc",
      scenarioId: "sc_focus_play",
    },
    fortuneFacts: {
      day: { stem: "신", branch: "유", stemElement: "metal", branchElement: "metal" },
      dayMasterElement: "metal", // 사주는 철저한 금(원칙)
      hour: { stem: "계", branch: "사", stemElement: "water", branchElement: "fire" },
      hourTenGod: "식신",
      year: "unknown",
      month: "unknown",
      birthTimeKnown: true,
      supported: { dayPillar: true, hourPillar: true, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "Observation strictly overrides fortune without forced agreement",
  },

  // Fixture I: 출생시간 UNKNOWN (체감가치 유지 및 day master 단독 보조 힌트)
  {
    fixtureId: "I",
    title: "유진 (55개월 여아, Band B) - 출생시간 UNKNOWN",
    ageBandCode: "B",
    childProfile: {
      name: "유진",
      birthDate: "2022-01-30",
      birthTimeKnown: false, // 출생시간 모름
      gender: "girl",
    },
    childEvidences: [
      {
        domain: "self_assertion",
        axis: "strong_self_direction",
        observedPattern: "asserts_but_negotiates",
        observedLabel: "분명하게 의사를 표현하되 이유를 들으면 조율하는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q3_self_assertion"],
      },
      {
        domain: "social_approach",
        axis: "social_warmup_style",
        observedPattern: "eases_into_group",
        observedLabel: "자연스럽게 무리에 섞여 어울리는 모습",
        confidence: "medium",
        sourceQuestionIds: ["q5_social_approach"],
      },
    ],
    momAnswers: {
      time_pressure_style: "opt_time_notify",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_negotiate",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    },
    conflictInput: {
      concernId: "friends",
      scenarioId: "sc_friends_sharing",
    },
    fortuneFacts: {
      day: { stem: "정", branch: "해", stemElement: "fire", branchElement: "water" },
      dayMasterElement: "fire",
      hour: null,
      hourTenGod: null,
      year: "unknown",
      month: "unknown",
      birthTimeKnown: false,
      supported: { dayPillar: true, hourPillar: false, yearPillar: false, monthPillar: false },
    },
    expectedFeature: "Birth time unknown safe fallback",
  },
];
