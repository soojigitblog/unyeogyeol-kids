// Food Concern Micro Check Questions (4 문항)
//
// 원칙:
// - 점수화 금지 (총점/심각도 없음)
// - 진단형 어휘 금지 (sensory/taste sensitivity, 감각예민 등 일체 배제)
// - 관찰 가능한 중립적 행동 선택지
// - Food Concern 선택 시에만 노출되는 상황 심층 확인용

import type { BehaviorEvidence, FoodMicroCheckAnswers } from "@/lib/types";

export interface FoodOption {
  optionId: string;
  patternId: string;
  label: string;
}

export interface FoodQuestion {
  id: keyof FoodMicroCheckAnswers;
  number: number;
  title: string;
  subtitle: string;
  options: FoodOption[];
}

export const FOOD_QUESTIONS: FoodQuestion[] = [
  {
    id: "new_food_reaction",
    number: 1,
    title: "처음 보는 음식이 나오면 보통 어떤 반응을 보이나요?",
    subtitle: "낯선 음식을 마주했을 때 보이는 첫 행동",
    options: [
      {
        optionId: "opt_food_q1_1",
        patternId: "food_immediate_try",
        label: "망설이지 않고 바로 입에 넣어본다",
      },
      {
        optionId: "opt_food_q1_2",
        patternId: "food_brief_look_then_try",
        label: "잠깐 쳐다본 뒤 조심스럽게 한 입 먹어본다",
      },
      {
        optionId: "opt_food_q1_3",
        patternId: "food_inspect_smell_shape",
        label: "냄새를 맡거나 숟가락으로 콕 찔러보며 모양을 살핀다",
      },
      {
        optionId: "opt_food_q1_4",
        patternId: "food_hesitate_or_push_away",
        label: "손대지 않고 밀어내거나 쳐다보며 망설인다",
      },
    ],
  },
  {
    id: "preference_balance",
    number: 2,
    title: "좋아하는 음식과 익숙하지 않은 음식이 같이 있으면?",
    subtitle: "식판에 차려진 음식을 대하는 순서와 방식",
    options: [
      {
        optionId: "opt_food_q2_1",
        patternId: "food_favorite_only_first",
        label: "좋아하는 반찬만 골라서 먼저 싹 비운다",
      },
      {
        optionId: "opt_food_q2_2",
        patternId: "food_alternate_try",
        label: "좋아하는 음식과 다른 반찬을 번갈아 가며 시도한다",
      },
      {
        optionId: "opt_food_q2_3",
        patternId: "food_leave_unfamiliar",
        label: "좋아하는 것만 먹고 익숙하지 않은 반찬은 그대로 남겨둔다",
      },
      {
        optionId: "opt_food_q2_4",
        patternId: "food_basic_familiar_only",
        label: "밥이나 국 등 항상 익숙한 기본 음식 위주로만 먹는다",
      },
    ],
  },
  {
    id: "prompt_response",
    number: 3,
    title: "“한 입만 먹어보자”고 권하면?",
    subtitle: "식탁에서 권유를 받았을 때의 반응",
    options: [
      {
        optionId: "opt_food_q3_1",
        patternId: "food_reluctant_one_bite",
        label: "마지못해 한 입 정도는 조심스럽게 시도해본다",
      },
      {
        optionId: "opt_food_q3_2",
        patternId: "food_shake_head_close_mouth",
        label: "고개를 젓거나 입을 닫고 조용히 거부 의사를 보인다",
      },
      {
        optionId: "opt_food_q3_3",
        patternId: "food_stronger_refusal_on_prompt",
        label: "권유가 이어지면 더 완강하게 고개를 돌리거나 밀친다",
      },
      {
        optionId: "opt_food_q3_4",
        patternId: "food_distract_or_divert",
        label: "다른 반찬을 가리키거나 다른 이야기로 화제를 돌린다",
      },
    ],
  },
  {
    id: "meal_flow_block",
    number: 4,
    title: "식사가 생각대로 되지 않거나 답답할 때는?",
    subtitle: "식사 시간이 길어지거나 먹기 싫을 때의 행동",
    options: [
      {
        optionId: "opt_food_q4_1",
        patternId: "food_leave_table_wander",
        label: "의자나 식탁에서 내려와 주변을 돌아다니려 한다",
      },
      {
        optionId: "opt_food_q4_2",
        patternId: "food_put_down_spoon_divert",
        label: "숟가락을 내려놓고 딴청을 피우거나 장난을 친다",
      },
      {
        optionId: "opt_food_q4_3",
        patternId: "food_express_frustration",
        label: "짜증을 내거나 칭얼거리며 울음으로 표현한다",
      },
      {
        optionId: "opt_food_q4_4",
        patternId: "food_slow_down_quietly",
        label: "말없이 씹는 속도를 아주 천천히 늦추며 시간을 보낸다",
      },
    ],
  },
];

export function buildFoodEvidence(answers: FoodMicroCheckAnswers): BehaviorEvidence[] {
  const evidences: BehaviorEvidence[] = [];

  if (answers.new_food_reaction === "inspect_smell_shape" || answers.new_food_reaction === "hesitate_or_push_away") {
    evidences.push({
      domain: "new_environment",
      axis: "needs_observation_time",
      observedPattern: "new_food_hesitation",
      observedLabel: "처음 보는 음식이나 낯선 반찬을 마주했을 때 눈으로 살피거나 확인하는 시간이 필요한 편이에요.",
      confidence: "medium",
      sourceQuestionIds: ["food_q1"],
    });
  } else if (answers.new_food_reaction === "immediate_try" || answers.new_food_reaction === "brief_look_then_try") {
    evidences.push({
      domain: "new_environment",
      axis: "needs_observation_time",
      observedPattern: "new_food_open_exploration",
      observedLabel: "처음 보는 음식도 비교적 쉽게 쳐다보고 한 입씩 시도해보는 모습이 있어요.",
      confidence: "medium",
      sourceQuestionIds: ["food_q1"],
    });
  }

  if (answers.preference_balance === "favorite_only_first" || answers.preference_balance === "leave_unfamiliar") {
    evidences.push({
      domain: "self_assertion",
      axis: "strong_self_direction",
      observedPattern: "food_familiar_preference",
      observedLabel: "자신에게 익숙하고 좋아하는 음식을 중심으로 섭취하려는 자기 선호가 뚜렷해요.",
      confidence: "medium",
      sourceQuestionIds: ["food_q2"],
    });
  }

  if (answers.prompt_response === "stronger_refusal_on_prompt" || answers.prompt_response === "shake_head_close_mouth") {
    evidences.push({
      domain: "parent_instruction",
      axis: "instruction_response_style",
      observedPattern: "food_refusal_on_pressure",
      observedLabel: "식탁에서 권유나 재촉을 받으면 자기 의사를 지키며 거부 의사를 분명히 하는 편이에요.",
      confidence: "medium",
      sourceQuestionIds: ["food_q3"],
    });
  }

  if (answers.meal_flow_block === "leave_table_wander" || answers.meal_flow_block === "put_down_spoon_divert") {
    evidences.push({
      domain: "transition",
      axis: "transition_preference",
      observedPattern: "meal_pacing_autonomy",
      observedLabel: "식사 흐름이 답답해지면 자리를 뜨거나 다른 자극으로 주의를 돌리며 스스로 속도를 조절하려 해요.",
      confidence: "medium",
      sourceQuestionIds: ["food_q4"],
    });
  }

  return evidences;
}
