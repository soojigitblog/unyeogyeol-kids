// deep-observation-questions 모듈: 유료 Signature 전용 심화 관찰 14문항
//
// 원칙:
// 1. 무료에서 확인한 핵심 패턴을 "다른 실제 상황 및 맥락(집/밖/집단)"에서 재확인.
// 2. 표준화 척도(CBQ/ECBQ) 복제 금지, 독창적 육아 상황 작성.
// 3. 점수 척도 없음, 중립적 4지선다.

import type { Axis, QuestionDomain } from "@/lib/types";
import type { AgeBandCode } from "./ageBandTypes";

export interface DeepQuestionOption {
  optionId: string;
  patternKey: string;
  label: string;
}

export interface DeepQuestion {
  id: string;
  domain: QuestionDomain;
  axis: Axis;
  contextCategory: "home" | "outside" | "group";
  agePrompts: Record<AgeBandCode, string>;
  options: DeepQuestionOption[];
}

export const DEEP_OBSERVATION_QUESTIONS: DeepQuestion[] = [
  // 1. Transition 재확인 (집안 식사/정리 장면)
  {
    id: "deep_q1_trans_meal",
    domain: "transition",
    axis: "transition_preference",
    contextCategory: "home",
    agePrompts: {
      A: "그림책을 보거나 블록을 만지다 밥 먹자고 식탁으로 부르면,",
      B: "그림이나 만들기를 하다가 밥 먹자고 부르면,",
      C: "좋아하는 영상이나 만들기를 하다가 식사하러 오라고 하면,",
    },
    options: [
      { optionId: "opt_d1_a", patternKey: "switches_readily", label: "부르는 소리에 곧바로 하던 것을 두고 와요" },
      { optionId: "opt_d1_b", patternKey: "brief_lag_then_transitions", label: "잠깐 아쉬워하다가 금방 자리로 와요" },
      { optionId: "opt_d1_c", patternKey: "transitions_with_advance_notice", label: "미리 “이제 곧 밥 먹자” 하고 마무리할 시간을 주면 편하게 와요" },
      { optionId: "opt_d1_d", patternKey: "prefers_completion_before_transition", label: "지금 하는 단계가 끝날 때까지 식탁에 안 오려 해요" },
    ],
  },
  // 2. Transition & Routine (외출 준비 시 전환)
  {
    id: "deep_q2_trans_leaving",
    domain: "transition",
    axis: "transition_preference",
    contextCategory: "home",
    agePrompts: {
      A: "외출할 시간이라 신발 신자고 할 때,",
      B: "등원 시간이나 약속 시간에 맞춰 현관으로 나가자고 할 때,",
      C: "학원이나 모임 시간 맞춰 출발하자고 할 때,",
    },
    options: [
      { optionId: "opt_d2_a", patternKey: "switches_readily", label: "하던 일을 멈추고 신나게 현관으로 가요" },
      { optionId: "opt_d2_b", patternKey: "brief_lag_then_transitions", label: "챙길 장난감 하나 들고 자연스럽게 따라나서요" },
      { optionId: "opt_d2_c", patternKey: "transitions_with_advance_notice", label: "다음 장소에서 뭐 할지 미리 들으면 잘 나서요" },
      { optionId: "opt_d2_d", patternKey: "prefers_completion_before_transition", label: "만지던 물건을 마저 다 챙겨야 신발을 신어요" },
    ],
  },
  // 3. New Environment (외부 낯선 체험/행사)
  {
    id: "deep_q3_env_group",
    domain: "new_environment",
    axis: "needs_observation_time",
    contextCategory: "outside",
    agePrompts: {
      A: "문화센터나 낯선 실내 놀이 공간에 처음 들어갔을 때,",
      B: "새로운 학원이나 체험 클래스 첫날 교실에 들어갔을 때,",
      C: "처음 보는 단체 활동이나 캠프 장소에 도착했을 때,",
    },
    options: [
      { optionId: "opt_d3_a", patternKey: "explores_new_settings_readily", label: "선생님이나 교구 쪽으로 주저 없이 다가가요" },
      { optionId: "opt_d3_b", patternKey: "brief_scan_then_engages", label: "엄마 손을 잡고 가볍게 한 바퀴 둘러본 뒤 참여해요" },
      { optionId: "opt_d3_c", patternKey: "needs_observation_time", label: "자리에 가만히 앉아 다른 아이들이 하는 걸 오래 지켜봐요" },
      { optionId: "opt_d3_d", patternKey: "warms_up_with_secure_base", label: "엄마 품이나 곁에 꼭 붙어있다가 천천히 적응해요" },
    ],
  },
  // 4. Social Approach (익숙한 집 vs 집단 상황의 차이)
  {
    id: "deep_q4_social_context",
    domain: "social_approach",
    axis: "social_warmup_style",
    contextCategory: "group",
    agePrompts: {
      A: "자주 보는 이웃 친구나 친척들을 만났을 때,",
      B: "어린이집/유치원에 새로운 친구가 놀러왔을 때,",
      C: "학교/유치원 쉬는 시간에 아이들이 모여 있을 때,",
    },
    options: [
      { optionId: "opt_d4_a", patternKey: "initiates_socially", label: "먼저 다가가서 자기가 가진 것을 보여줘요" },
      { optionId: "opt_d4_b", patternKey: "eases_into_group", label: "친구가 노는 모습을 보며 자연스럽게 옆에 앉아요" },
      { optionId: "opt_d4_c", patternKey: "observes_then_joins", label: "친구가 먼저 말을 걸어올 때까지 기다려요" },
      { optionId: "opt_d4_d", patternKey: "prefers_close_small_group", label: "무리보다 친한 한 친구와 둘이서만 놀고 싶어해요" },
    ],
  },
  // 5. Self-assertion (놀이 중 규칙이나 역할 고집)
  {
    id: "deep_q5_assertion_role",
    domain: "self_assertion",
    axis: "strong_self_direction",
    contextCategory: "group",
    agePrompts: {
      A: "형제나 친구가 자기가 쥔 장난감을 만지려 할 때,",
      B: "역할놀이를 할 때 원하는 배역을 다른 친구가 맡았을 때,",
      C: "모둠 활동에서 자기가 맡고 싶은 역할을 정할 때,",
    },
    options: [
      { optionId: "opt_d5_a", patternKey: "strong_self_direction", label: "자기가 원하는 역할을 꼭 해야 직성이 풀려요" },
      { optionId: "opt_d5_b", patternKey: "asserts_but_negotiates", label: "“그럼 다음엔 내가 할게” 하고 협상해요" },
      { optionId: "opt_d5_c", patternKey: "expresses_indirectly", label: "말없이 표정이 굳거나 다른 놀이로 돌아앉아요" },
      { optionId: "opt_d5_d", patternKey: "harmony_oriented", label: "친구가 원하는 대로 양보하고 편하게 맞춰줘요" },
    ],
  },
  // 6. Failure & Frustration (정교한 만들기/과제 실패)
  {
    id: "deep_q6_failure_task",
    domain: "failure",
    axis: "recovery_pace",
    contextCategory: "home",
    agePrompts: {
      A: "끼우려던 뚜껑이나 조각이 잘 안 들어갈 때,",
      B: "가위질이나 접기가 마음대로 안 되어 찢어졌을 때,",
      C: "열심히 하던 숙제나 만들기가 한순간에 망가졌을 때,",
    },
    options: [
      { optionId: "opt_d6_a", patternKey: "quick_reattempt", label: "“다시 하면 되지” 하고 바로 새 종이를 꺼내요" },
      { optionId: "opt_d6_b", patternKey: "self_soothes_after_upset", label: "잠깐 짜증을 내다 스스로 숨을 고르고 다시 해요" },
      { optionId: "opt_d6_c", patternKey: "needs_time_to_settle", label: "속상해서 한동안 눈물을 흘리며 멈춰 있어요" },
      { optionId: "opt_d6_d", patternKey: "recovers_with_support", label: "엄마가 꼭 안아주고 도와줘야 다시 손을 대요" },
    ],
  },
  // 7. Play Immersion (관심 없는 활동 vs 좋아하는 활동)
  {
    id: "deep_q7_play_contrast",
    domain: "play_immersion",
    axis: "play_focus_style",
    contextCategory: "home",
    agePrompts: {
      A: "아주 좋아하는 장난감으로 혼자 놀기 시작했을 때,",
      B: "좋아하는 특정 주제(공룡/탈것/공주 등)에 꽂혔을 때,",
      C: "자기가 푹 빠진 취미나 조립 활동을 할 때,",
    },
    options: [
      { optionId: "opt_d7_a", patternKey: "deep_single_focus", label: "주변에서 불러도 모를 만큼 완전히 몰입해요" },
      { optionId: "opt_d7_b", patternKey: "focus_then_shift", label: "집중해서 하다가도 부르면 대답하고 돌아봐요" },
      { optionId: "opt_d7_c", patternKey: "broad_varied_play", label: "이것저것 연계해서 여러 놀이를 번갈아 즐겨요" },
      { optionId: "opt_d7_d", patternKey: "novelty_seeking_play", label: "금방 다른 새로운 장난감이나 자극을 찾아요" },
    ],
  },
  // 8. Rule & Boundary (공공장소 안전 규칙)
  {
    id: "deep_q8_rule_public",
    domain: "rule_response",
    axis: "rule_negotiation_style",
    contextCategory: "outside",
    agePrompts: {
      A: "마트나 길거리에서 위험하니 손잡자고 할 때,",
      B: "식당이나 도서관에서 조용히 걸어야 한다고 할 때,",
      C: "공공장소에서 지켜야 할 매너나 줄서기를 할 때,",
    },
    options: [
      { optionId: "opt_d8_a", patternKey: "reason_seeking", label: "“왜 손잡아야 해?” 이유를 물어보고 따져요" },
      { optionId: "opt_d8_b", patternKey: "follows_when_convinced", label: "위험하다고 설명해주면 고개를 끄덕이고 잡아요" },
      { optionId: "opt_d8_c", patternKey: "context_flexible", label: "잡았다가도 재미있는 게 보이면 쓱 손을 빼요" },
      { optionId: "opt_d8_d", patternKey: "accepts_set_rules", label: "알려준 규칙대로 조용히 손잡고 따라와요" },
    ],
  },
  // 9. Emotional Expression (친구와의 갈등 시 표현)
  {
    id: "deep_q9_emotion_peer",
    domain: "emotional_expression",
    axis: "emotional_expression_intensity",
    contextCategory: "group",
    agePrompts: {
      A: "친구가 장난감을 뺏어가서 속상할 때,",
      B: "친구와 다투고 억울한 마음이 들었을 때,",
      C: "친구 사이에서 오해가 생겨 속상할 때,",
    },
    options: [
      { optionId: "opt_d9_a", patternKey: "high_intensity_expression", label: "소리를 지르거나 크게 울며 바로 감정을 터뜨려요" },
      { optionId: "opt_d9_b", patternKey: "open_expression", label: "“나 화났어” 하고 말로 단호하게 표현해요" },
      { optionId: "opt_d9_c", patternKey: "calm_expression", label: "꾹 참고 표정으로만 서운함을 나타내요" },
      { optionId: "opt_d9_d", patternKey: "inward_then_shares", label: "그 자리에선 가만히 있다가 나중에 엄마에게 털어놔요" },
    ],
  },
  // 10. Parent Instruction (정리정돈 요청 시 반응)
  {
    id: "deep_q10_inst_cleanup",
    domain: "parent_instruction",
    axis: "instruction_response_style",
    contextCategory: "home",
    agePrompts: {
      A: "놀던 장난감 바구니에 같이 넣자고 할 때,",
      B: "자기 방 물건들을 스스로 제자리에 치우자고 할 때,",
      C: "책상 정리나 책가방 정리를 스스로 하라고 할 때,",
    },
    options: [
      { optionId: "opt_d10_a", patternKey: "own_way_first", label: "엄마 방식 말고 자기만의 분류 기준대로 정리하려 해요" },
      { optionId: "opt_d10_b", patternKey: "own_pace_completes", label: "느긋하지만 시간 여유를 주면 결국 다 치워요" },
      { optionId: "opt_d10_c", patternKey: "moves_with_engagement", label: "“누가 먼저 넣나 시합!” 놀이처럼 해주면 잘해요" },
      { optionId: "opt_d10_d", patternKey: "cooperative_follows", label: "말하자마자 군말 없이 착착 정리해요" },
    ],
  },
  // 11. Praise & Feedback (새로운 것을 배웠을 때)
  {
    id: "deep_q11_praise_skill",
    domain: "praise",
    axis: "motivation_source",
    contextCategory: "home",
    agePrompts: {
      A: "새로운 동작이나 율동을 배워서 보여줄 때,",
      B: "혼자서 새로운 글자나 만들기를 완성했을 때,",
      C: "줄넘기나 자전거 등 새로운 기술을 성공했을 때,",
    },
    options: [
      { optionId: "opt_d11_a", patternKey: "energized_by_praise", label: "“엄마 나 잘하지!” 환호와 박수를 원해요" },
      { optionId: "opt_d11_b", patternKey: "warmed_by_shared_joy", label: "엄마가 같이 웃어주면 조용히 미소를 지어요" },
      { optionId: "opt_d11_c", patternKey: "quietly_pleased", label: "칭찬하면 쑥스러워하며 도망가지만 기분 좋아해요" },
      { optionId: "opt_d11_d", patternKey: "intrinsically_motivated", label: "남의 칭찬보다 자기가 해냈다는 성취감에 취해 있어요" },
    ],
  },
  // 12. Self-Assertion (음식/의복 등 신체 감각과 취향)
  {
    id: "deep_q12_assert_sensory",
    domain: "self_assertion",
    axis: "strong_self_direction",
    contextCategory: "home",
    agePrompts: {
      A: "특정 옷의 감촉이나 양말 솔기가 마음에 안 들 때,",
      B: "입기 싫은 옷이나 먹기 싫은 반찬이 있을 때,",
      C: "자기가 입을 옷 스타일이나 소지품을 직접 고를 때,",
    },
    options: [
      { optionId: "opt_d12_a", patternKey: "strong_self_direction", label: "마음에 드는 것을 찾을 때까지 절대 입지/먹지 않아요" },
      { optionId: "opt_d12_b", patternKey: "asserts_but_negotiates", label: "이것만 입는 대신 외투는 엄마 뜻대로 입겠다고 조율해요" },
      { optionId: "opt_d12_c", patternKey: "expresses_indirectly", label: "불편함을 끙끙대며 은근히 벗으려고 해요" },
      { optionId: "opt_d12_d", patternKey: "harmony_oriented", label: "엄마가 골라주는 대로 대체로 편하게 입어요" },
    ],
  },
  // 13. Group vs Individual Context (어린이집/단체 활동 참여)
  {
    id: "deep_q13_group_participation",
    domain: "social_approach",
    axis: "social_warmup_style",
    contextCategory: "group",
    agePrompts: {
      A: "선생님이 동그랗게 모여 율동하자고 부를 때,",
      B: "원 전체가 모여 발표회나 체육 활동을 할 때,",
      C: "학교/학원에서 조별 발표나 단체 게임을 할 때,",
    },
    options: [
      { optionId: "opt_d13_a", patternKey: "initiates_socially", label: "맨 앞줄에 서서 적극적으로 참여해요" },
      { optionId: "opt_d13_b", patternKey: "eases_into_group", label: "중간쯤 자리에서 친구들과 어울리며 따라해요" },
      { optionId: "opt_d13_c", patternKey: "observes_then_joins", label: "뒤편에서 한참을 보다가 조금씩 동작을 따라해요" },
      { optionId: "opt_d13_d", patternKey: "prefers_close_small_group", label: "단체 활동보다 구석에서 혼자 하는 걸 편해해요" },
    ],
  },
  // 14. Emotion Recovery (엄마에게 혼난 후 회복)
  {
    id: "deep_q14_recovery_conflict",
    domain: "failure",
    axis: "recovery_pace",
    contextCategory: "home",
    agePrompts: {
      A: "위험한 행동으로 엄마에게 단호한 소리를 들었을 때,",
      B: "잘못된 행동으로 훈육을 받고 났을 때,",
      C: "약속을 안 지켜 엄마와 단단히 이야기를 나눈 뒤,",
    },
    options: [
      { optionId: "opt_d14_a", patternKey: "quick_reattempt", label: "금방 씩씩하게 다른 이야기를 하며 다가와요" },
      { optionId: "opt_d14_b", patternKey: "self_soothes_after_upset", label: "혼자 조금 훌쩍이다가 스스로 마음을 열고 와요" },
      { optionId: "opt_d14_c", patternKey: "needs_time_to_settle", label: "마음의 상처가 남아 한동안 방에 틀어박혀 있어요" },
      { optionId: "opt_d14_d", patternKey: "recovers_with_support", label: "엄마가 먼저 따뜻하게 안아주고 풀어줘야 풀려요" },
    ],
  },
];

export const TOTAL_DEEP_QUESTIONS = DEEP_OBSERVATION_QUESTIONS.length; // 14
