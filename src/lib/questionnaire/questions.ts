// questionnaire 모듈: Phase 1 행동 질문 (총 10문항 고정)
// 연령대(AgeBand A/B/C)에 따라 실제 일상 장면 프롬프트 변형 제공
//
// 원칙(LOCK):
//  - 10개 질문 수 고정, 무료 UX 유지.
//  - 숫자 척도를 노출하지 않고 "상황형 선택지" 사용.
//  - 4개 선택지는 우열이 없고 사회적 바람직성 배제.
//  - Age Band A: 24~35개월, Age Band B: 36~59개월, Age Band C: 60~95개월

import type { Axis, Question, QuestionDomain } from "@/lib/types";
import type { AgeBandCode } from "./ageBandTypes";

export const DOMAIN_AXIS: Record<QuestionDomain, Axis> = {
  new_environment: "needs_observation_time",
  failure: "recovery_pace",
  self_assertion: "strong_self_direction",
  transition: "transition_preference",
  social_approach: "social_warmup_style",
  play_immersion: "play_focus_style",
  praise: "motivation_source",
  rule_response: "rule_negotiation_style",
  emotional_expression: "emotional_expression_intensity",
  parent_instruction: "instruction_response_style",
};

export interface AgeVariantPrompt {
  A: string; // 24~35m
  B: string; // 36~59m
  C: string; // 60~95m
}

export interface QuestionWithVariants extends Question {
  agePrompts: AgeVariantPrompt;
}

export const QUESTIONS_WITH_VARIANTS: QuestionWithVariants[] = [
  {
    id: "q_new_env",
    domain: "new_environment",
    prompt: "처음 가 보는 놀이터나 낯선 장소에 가면,",
    agePrompts: {
      A: "처음 가보는 놀이터나 새로운 키즈카페에 도착했을 때,",
      B: "새로운 놀이터나 낯선 친구들이 있는 공간에 가면,",
      C: "처음 가보는 체험관이나 낯선 모임 장소에 들어섰을 때,",
    },
    options: [
      { id: "a", label: "바로 관심 가는 곳으로 움직여요", value: 4 },
      { id: "b", label: "잠깐 둘러본 뒤 움직여요", value: 3 },
      { id: "c", label: "충분히 지켜보고 익숙해진 뒤 움직여요", value: 2 },
      { id: "d", label: "익숙한 사람이 함께 있을 때 편하게 움직여요", value: 1 },
    ],
  },
  {
    id: "q_failure",
    domain: "failure",
    prompt: "하려던 게 뜻대로 안 됐을 때,",
    agePrompts: {
      A: "쌓던 블록이 와르르 무너지거나 원하는 장난감이 안 닿을 때,",
      B: "그림 그리기가 잘 안 되거나 퍼즐 조각이 잘 안 맞춰질 때,",
      C: "게임 규칙대로 잘 안 풀리거나 하려던 만들기가 실패했을 때,",
    },
    options: [
      { id: "a", label: "금방 다른 방법으로 다시 시도해요", value: 4 },
      { id: "b", label: "잠깐 속상해하다 스스로 마음을 추슬러요", value: 3 },
      { id: "c", label: "마음을 가라앉히는 데 시간이 조금 걸려요", value: 2 },
      { id: "d", label: "곁에서 도닥여 주면 다시 힘을 내요", value: 1 },
    ],
  },
  {
    id: "q_self_assertion",
    domain: "self_assertion",
    prompt: "자기가 원하는 게 분명할 때,",
    agePrompts: {
      A: "입고 싶은 옷이나 먹고 싶은 간식이 딱 정해졌을 때,",
      B: "자기가 정한 놀이 순서나 원하는 역할을 꼭 하고 싶을 때,",
      C: "자기 생각이나 하루 일정에 대한 고집이 분명할 때,",
    },
    options: [
      { id: "a", label: "자기 뜻을 끝까지 지키려 해요", value: 4 },
      { id: "b", label: "분명히 말하되 이유를 들으면 조율해요", value: 3 },
      { id: "c", label: "상황을 보며 은근하게 표현해요", value: 2 },
      { id: "d", label: "주변 분위기에 맞추는 걸 편해해요", value: 1 },
    ],
  },
  {
    id: "q_transition",
    domain: "transition",
    prompt: "놀다가 다른 걸 해야 할 때,",
    agePrompts: {
      A: "재미있게 놀던 장난감을 정리하고 씻으러 가자고 하면,",
      B: "놀이터에서 이제 집에 갈 시간이라고 하면,",
      C: "하던 놀이나 만들기를 멈추고 다음 일정으로 넘어가야 할 때,",
    },
    options: [
      { id: "a", label: "“이제 이거 하자” 하면 바로 전환해요", value: 4 },
      { id: "b", label: "조금 여운을 두고 곧 넘어가요", value: 3 },
      { id: "c", label: "미리 알려 주면 마음의 준비를 하고 넘어가요", value: 2 },
      { id: "d", label: "하던 것을 마무리한 뒤 넘어가는 걸 좋아해요", value: 1 },
    ],
  },
  {
    id: "q_social",
    domain: "social_approach",
    prompt: "또래 친구들이 모여 있으면,",
    agePrompts: {
      A: "놀이터에 또래 아기들이 놀고 있는 걸 보면,",
      B: "어린이집/유치원에서 친구들이 모여 놀고 있을 때,",
      C: "새로운 그룹이나 친구들이 함께 어울리는 자리에서,",
    },
    options: [
      { id: "a", label: "먼저 다가가 말을 걸거나 곁으로 가요", value: 4 },
      { id: "b", label: "자연스럽게 스며들어 어울려요", value: 3 },
      { id: "c", label: "지켜보다 익숙해지면 함께해요", value: 2 },
      { id: "d", label: "마음 맞는 한두 명과 노는 걸 좋아해요", value: 1 },
    ],
  },
  {
    id: "q_play",
    domain: "play_immersion",
    prompt: "좋아하는 놀이를 할 때,",
    agePrompts: {
      A: "마음에 드는 장난감 하나를 손에 쥐었을 때,",
      B: "역할놀이나 블록 만들기를 시작했을 때,",
      C: "좋아하는 보드게임, 레고, 그림 그리기에 빠졌을 때,",
    },
    options: [
      { id: "a", label: "한 가지에 오래 깊이 빠져들어요", value: 4 },
      { id: "b", label: "한동안 집중하다 자연스럽게 옮겨가요", value: 3 },
      { id: "c", label: "여러 가지를 두루두루 즐겨요", value: 2 },
      { id: "d", label: "새로운 놀이를 즐겨 찾아다녀요", value: 1 },
    ],
  },
  {
    id: "q_praise",
    domain: "praise",
    prompt: "무언가를 스스로 해냈을 때,",
    agePrompts: {
      A: "신발을 스스로 신거나 작은 장난감을 혼자 맞췄을 때,",
      B: "그림을 완성하거나 스스로 옷을 다 입었을 때,",
      C: "어려운 과제나 약속을 스스로 지켜냈을 때,",
    },
    options: [
      { id: "a", label: "칭찬을 들으면 신나서 더 하려고 해요", value: 4 },
      { id: "b", label: "함께 기뻐해 주면 뿌듯해해요", value: 3 },
      { id: "c", label: "쑥스러워하면서도 속으로 좋아해요", value: 2 },
      { id: "d", label: "스스로 만족하는 걸 더 중요하게 여겨요", value: 1 },
    ],
  },
  {
    id: "q_rule",
    domain: "rule_response",
    prompt: "규칙이나 약속을 정할 때,",
    agePrompts: {
      A: "“이건 만지면 안 돼” 하고 알려줄 때,",
      B: "“놀이 후에는 제자리에 넣기”처럼 집안 약속을 말할 때,",
      C: "생활 규칙이나 스마트폰/게임 시간 약속을 정할 때,",
    },
    options: [
      { id: "a", label: "왜 그런지 이유를 꼭 알고 싶어해요", value: 4 },
      { id: "b", label: "이유가 납득되면 잘 지켜요", value: 3 },
      { id: "c", label: "상황과 기분에 따라 유연하게 반응해요", value: 2 },
      { id: "d", label: "정해지면 대체로 그대로 따라요", value: 1 },
    ],
  },
  {
    id: "q_emotion",
    domain: "emotional_expression",
    prompt: "기쁘거나 속상한 마음이 들 때,",
    agePrompts: {
      A: "기분이 아주 좋거나 서러운 일이 생겼을 때,",
      B: "속상하거나 신나는 일이 생겼을 때,",
      C: "친구와 서운하거나 뿌듯한 일이 있었을 때,",
    },
    options: [
      { id: "a", label: "온몸으로 크고 생생하게 표현해요", value: 4 },
      { id: "b", label: "표정과 말에 솔직하게 드러나요", value: 3 },
      { id: "c", label: "담담하게 표현하는 편이에요", value: 2 },
      { id: "d", label: "속으로 간직했다가 편할 때 이야기해요", value: 1 },
    ],
  },
  {
    id: "q_instruction",
    domain: "parent_instruction",
    prompt: "무언가를 해 달라고 부탁하면,",
    agePrompts: {
      A: "“이것 좀 엄마한테 가져다줄래?” 하고 부탁할 때,",
      B: "“가방 제자리에 두고 손 씻자” 하고 이야기할 때,",
      C: "“숙제/준비물 먼저 챙기자” 하고 이야기할 때,",
    },
    options: [
      { id: "a", label: "자기 방식대로 해내고 싶어해요", value: 4 },
      { id: "b", label: "자기 속도가 있지만 결국 해내요", value: 3 },
      { id: "c", label: "관심을 끌어 주면 마음이 움직여요", value: 2 },
      { id: "d", label: "부탁하면 바로 응해 주는 편이에요", value: 1 },
    ],
  },
];

export function getQuestionsForAgeBand(bandCode: AgeBandCode): Question[] {
  return QUESTIONS_WITH_VARIANTS.map((q) => ({
    id: q.id,
    domain: q.domain,
    prompt: q.agePrompts[bandCode] || q.prompt,
    options: q.options,
  }));
}

export const QUESTIONS: Question[] = QUESTIONS_WITH_VARIANTS.map((q) => ({
  id: q.id,
  domain: q.domain,
  prompt: q.prompt,
  options: q.options,
}));

export const TOTAL_QUESTIONS = QUESTIONS.length; // 10
