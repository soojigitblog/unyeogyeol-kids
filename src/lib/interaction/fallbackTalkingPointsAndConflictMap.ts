// P3.4 AI 실패 시 사용하는 결정론 템플릿 생성기 (AI 아님, 순수함수).
// ELEMENT_HINT_CHILD 스타일(signatureReportGenerator.ts)과 동일하게, 정해진 문장에
// evidence 근거를 살짝 얹는 수준으로만 개인화한다 — 없는 사실을 지어내지 않는다.

import type {
  BehaviorEvidence,
  ConflictMapItem,
  ConflictMapSection,
  CurrentConflictInput,
  MomEvidence,
  TalkingPointItem,
  TalkingPointsSection,
  TalkingPointSituationId,
} from "@/lib/types";
import {
  CONFLICT_MAP_CATEGORY_LABEL,
  CONFLICT_MAP_DOMAINS,
} from "./conflictMapCategories";
import { scoreConflictMap, type ConflictLevelResult } from "./conflictMapScoring";

const TALKING_POINT_SITUATION_LABEL: Record<TalkingPointSituationId, string> = {
  tp_dressing_refusal: "옷 입기 싫어할 때",
  tp_meal_refusal: "밥 안 먹을 때",
  tp_tantrum: "장난감 사달라고 떼쓸 때",
  tp_bedtime_refusal: "잠자기 싫어할 때",
  tp_outing_prep_delay: "외출 준비를 미룰 때",
  tp_cleanup_refusal: "정리를 안 하려 할 때",
  tp_sibling_conflict: "동생과 다툴 때",
  tp_peer_conflict: "친구와 싸웠을 때",
  tp_media_stop_refusal: "미디어를 그만 안 볼 때",
  tp_emotional_outburst: "화가 나서 물건을 던질 때",
  tp_rule_defiance: "부모 말을 무시할 때",
  tp_learning_refusal: "공부하기 싫어할 때",
  tp_new_situation_hesitation: "새로운 장소를 무서워할 때",
};

const TALKING_POINT_TEMPLATE: Record<
  TalkingPointSituationId,
  { avoid: string; work: string; why: string; tip: string }
> = {
  tp_dressing_refusal: {
    avoid: "빨리 입어, 몇 번을 말해!",
    work: "이 옷이랑 저 옷 중에 뭐 입을까?",
    why: "스스로 고를 수 있을 때 마음이 더 편하게 움직이는 경향이 있어요.",
    tip: "설명을 길게 하지 말고 선택지는 2개까지만 주세요.",
  },
  tp_meal_refusal: {
    avoid: "한 입만 더 먹어, 계속 그러면 안 돼.",
    work: "오늘은 여기까지 먹어볼까? 그릇 정리는 같이 하자.",
    why: "억지로 재촉받을 때보다 스스로 속도를 정할 수 있을 때 거부가 줄어드는 경향이 있어요.",
    tip: "먹는 양보다 식사 시간의 분위기를 먼저 지켜봐 주세요.",
  },
  tp_tantrum: {
    avoid: "안 된다고 했지, 그만 울어.",
    work: "갖고 싶어서 많이 속상하지. 오늘은 사진만 찍어두고 집에서 다시 얘기해보자.",
    why: "감정을 먼저 인정받으면 전환이 조금 더 쉬워지는 경향이 있어요.",
    tip: "이유를 여러 번 설명하기보다 감정을 먼저 짧게 알아봐 주세요.",
  },
  tp_bedtime_refusal: {
    avoid: "빨리 자, 지금 몇 신 줄 알아?",
    work: "이 놀이만 마무리하고 이불 속으로 들어가자.",
    why: "하던 일을 마무리할 틈이 있을 때 다음 행동으로 넘어가기 쉬워지는 경향이 있어요.",
    tip: "잠자리 5분 전에 미리 알려주는 신호를 만들어보세요.",
  },
  tp_outing_prep_delay: {
    avoid: "빨리빨리 좀 해, 늦었단 말이야.",
    work: "지금부터 5번 세는 동안 신발 신어볼까?",
    why: "시간 압박을 그대로 전달하기보다 놀이처럼 안내할 때 움직임이 빨라지는 경향이 있어요.",
    tip: "출발 시각을 실제보다 10분 여유 있게 말해주세요.",
  },
  tp_cleanup_refusal: {
    avoid: "당장 치워, 안 그러면 다 버린다.",
    work: "블록만 먼저 상자에 넣어볼까? 나머지는 같이 하자.",
    why: "전체를 한 번에 요구하기보다 작은 단위로 나누면 시작이 쉬워지는 경향이 있어요.",
    tip: "정리를 놀이처럼 역할을 나눠서 함께 해보세요.",
  },
  tp_sibling_conflict: {
    avoid: "누가 먼저 그랬어! 형(동생)한테 양보해.",
    work: "둘 다 속상했겠다. 무슨 일이 있었는지 한 명씩 말해줄래?",
    why: "누구 편도 들지 않고 각자의 말을 들어줄 때 갈등이 더 빨리 가라앉는 경향이 있어요.",
    tip: "잘잘못을 가리기 전에 감정부터 알아봐 주세요.",
  },
  tp_peer_conflict: {
    avoid: "네가 먼저 사과해.",
    work: "친구랑 무슨 일이 있었어? 어떻게 하면 좋을지 같이 생각해보자.",
    why: "강제로 사과를 시키기보다 상황을 스스로 정리하도록 도울 때 받아들이기 쉬워지는 경향이 있어요.",
    tip: "결론을 대신 내려주지 말고 질문으로 이끌어주세요.",
  },
  tp_media_stop_refusal: {
    avoid: "당장 꺼, 그만 보라고 했지.",
    work: "이 영상 끝나면 끄는 거야. 끝나고 뭐 하고 놀지 정해볼까?",
    why: "갑자기 끊기기보다 다음 활동이 정해져 있을 때 전환이 쉬워지는 경향이 있어요.",
    tip: "미리 정해둔 시간/횟수를 타이머로 함께 확인해보세요.",
  },
  tp_emotional_outburst: {
    avoid: "그만해! 왜 물건을 던지고 그래!",
    work: "많이 화가 났구나. 던지는 대신 여기 쿠션에 화를 풀어볼까?",
    why: "행동을 바로 지적하기보다 감정에 이름을 붙여줄 때 진정이 빨라지는 경향이 있어요.",
    tip: "화를 안전하게 표현할 수 있는 대안 행동을 미리 정해두세요.",
  },
  tp_rule_defiance: {
    avoid: "몇 번을 말해야 알아들어?",
    work: "이거 하고 나서 저거 하는 거 어때?",
    why: "일방적인 지시보다 순서를 함께 정할 때 따르기 쉬워지는 경향이 있어요.",
    tip: "규칙의 이유를 짧게 한 문장으로만 설명해 주세요.",
  },
  tp_learning_refusal: {
    avoid: "이거 안 하면 안 돼, 얼른 앉아.",
    work: "10분만 같이 해보고 쉬는 시간 갖자.",
    why: "긴 시간 앉아 있기보다 짧게 나눠서 할 때 시작이 쉬워지는 경향이 있어요.",
    tip: "설명은 짧게, 직접 해보는 활동을 먼저 넣어주세요.",
  },
  tp_new_situation_hesitation: {
    avoid: "뭐가 무서워, 얼른 가봐.",
    work: "여기서 잠깐 같이 보다가, 준비되면 같이 가보자.",
    why: "재촉받기보다 충분히 살펴볼 시간이 있을 때 스스로 움직이기 쉬워지는 경향이 있어요.",
    tip: "먼저 다가가라고 하지 말고, 아이 옆에서 함께 지켜봐 주세요.",
  },
};

function matchedRefFor(
  domains: string[],
  childEvidences: BehaviorEvidence[]
): { ref: string | null; label: string | null } {
  const match = childEvidences.find((ev) => domains.includes(ev.domain));
  if (!match) return { ref: null, label: null };
  return { ref: `evidence:${match.domain}:${match.patternId}`, label: match.observedLabel };
}

const TALKING_POINT_DOMAINS: Record<TalkingPointSituationId, string[]> = {
  tp_dressing_refusal: ["transition", "parent_instruction"],
  tp_meal_refusal: ["self_assertion", "food_prompt_response", "food_meal_flow"],
  tp_tantrum: ["emotional_expression", "self_assertion"],
  tp_bedtime_refusal: ["transition", "sleep_bedtime"],
  tp_outing_prep_delay: ["transition"],
  tp_cleanup_refusal: ["transition", "play_immersion"],
  tp_sibling_conflict: ["self_assertion", "social_approach"],
  tp_peer_conflict: ["social_approach"],
  tp_media_stop_refusal: ["transition", "parent_instruction"],
  tp_emotional_outburst: ["emotional_expression", "failure"],
  tp_rule_defiance: ["rule_response", "parent_instruction"],
  tp_learning_refusal: ["play_immersion", "rule_response"],
  tp_new_situation_hesitation: ["new_environment"],
};

export function buildFallbackTalkingPoints(
  childEvidences: BehaviorEvidence[]
): TalkingPointsSection {
  const items: TalkingPointItem[] = (
    Object.keys(TALKING_POINT_TEMPLATE) as TalkingPointSituationId[]
  ).map((situationId) => {
    const template = TALKING_POINT_TEMPLATE[situationId];
    const domains = TALKING_POINT_DOMAINS[situationId];
    const { ref, label } = matchedRefFor(domains, childEvidences);
    return {
      situationId,
      situationLabel: TALKING_POINT_SITUATION_LABEL[situationId],
      avoidPhrase: template.avoid,
      workingPhrase: template.work,
      whyItWorks: label ? `${label} 아이라, ${template.why}` : template.why,
      parentActionTip: template.tip,
      evidenceRefs: ref ? [ref] : [],
      groundedInGeneric: !ref,
    };
  });
  return { items, generationSource: "fallback" };
}

const CONFLICT_MAP_TEMPLATE: Record<
  string,
  { why: string; avoid: string; work: string; change: string }
> = {
  cm_morning_routine: {
    why: "아침 시간은 등원/외출 시간이 정해져 있어 속도 차이가 두드러지기 쉬운 시간대예요.",
    avoid: "빨리빨리 좀 해!",
    work: "지금부터 5까지 세는 동안 양말 신어볼까?",
    change: "실제 출발 시각보다 10분 여유 있게 준비를 시작해보세요.",
  },
  cm_meal: {
    why: "먹는 양과 속도는 아이마다 다르고, 재촉이 들어가면 오히려 거부가 커지기 쉬워요.",
    avoid: "한 입만 더 먹어야지, 그만 좀 해!",
    work: "오늘은 여기까지 먹어볼까? 그릇 정리는 같이 하자.",
    change: "먹는 양보다 식사 시간의 분위기를 먼저 지켜봐 주세요.",
  },
  cm_outing: {
    why: "낯선 곳이나 새로운 일정 앞에서 아이의 반응 속도가 부모의 기대와 다를 수 있어요.",
    avoid: "얼른 나가야 해, 왜 이렇게 꾸물거려!",
    work: "여기서 조금만 더 살펴보고 나가자.",
    change: "출발 시각을 아이에게 미리 여러 번 예고해주세요.",
  },
  cm_tidy_up: {
    why: "놀이에 몰입해 있을수록 정리로 전환하는 데 시간이 더 필요할 수 있어요.",
    avoid: "당장 치워, 안 그러면 다 버린다.",
    work: "블록만 먼저 상자에 넣어볼까? 나머지는 같이 하자.",
    change: "정리를 한 번에 요구하지 말고 작은 단위로 나눠 제안해보세요.",
  },
  cm_tantrum: {
    why: "뜻대로 되지 않을 때 감정이 먼저 크게 올라오는 아이들이 있어요.",
    avoid: "안 된다고 했지, 그만 울어.",
    work: "많이 속상하지. 오늘은 여기까지만 하고 다시 얘기해보자.",
    change: "이유를 설명하기 전에 감정부터 짧게 알아봐 주세요.",
  },
  cm_emotional_burst: {
    why: "속상함이 커질 때 행동으로 먼저 표현되는 경우가 있어요.",
    avoid: "그만해! 왜 자꾸 그래!",
    work: "많이 화가 났구나. 여기 쿠션에 화를 풀어볼까?",
    change: "감정을 안전하게 표현할 수 있는 대안 행동을 미리 정해두세요.",
  },
  cm_bedtime: {
    why: "하던 활동을 마무리하고 싶은 마음과 정해진 취침 시간이 부딪히기 쉬운 시간대예요.",
    avoid: "빨리 자, 지금 몇 신 줄 알아?",
    work: "이 놀이만 마무리하고 이불 속으로 들어가자.",
    change: "잠자리 5분 전에 미리 알려주는 신호를 만들어보세요.",
  },
  cm_study: {
    why: "집중 방식과 학습 방식이 아이마다 달라 앉아 있는 시간 자체가 부담일 수 있어요.",
    avoid: "이거 안 하면 안 돼, 얼른 앉아.",
    work: "10분만 같이 해보고 쉬는 시간 갖자.",
    change: "설명은 짧게, 직접 해보는 활동을 먼저 넣어주세요.",
  },
  cm_friends: {
    why: "또래 관계에 적응하는 속도는 아이마다 다르고, 재촉은 오히려 위축을 키울 수 있어요.",
    avoid: "얼른 가서 놀아, 왜 혼자 있어.",
    work: "여기서 잠깐 같이 보다가, 준비되면 같이 가보자.",
    change: "먼저 다가가라고 하지 말고 아이 옆에서 함께 지켜봐 주세요.",
  },
  cm_media: {
    why: "화면을 끄는 순간은 대부분의 아이에게 전환이 쉽지 않은 지점이에요.",
    avoid: "당장 꺼, 그만 보라고 했지.",
    work: "이 영상 끝나면 끄는 거야. 끝나고 뭐 하고 놀지 정해볼까?",
    change: "미리 정해둔 시간/횟수를 타이머로 함께 확인해보세요.",
  },
  cm_rules: {
    why: "규칙을 받아들이는 방식은 아이마다 달라, 이유 없이 지시만 하면 반발이 커질 수 있어요.",
    avoid: "몇 번을 말해야 알아들어?",
    work: "이거 하고 나서 저거 하는 거 어때?",
    change: "규칙의 이유를 짧게 한 문장으로만 설명해 주세요.",
  },
  cm_siblings: {
    why: "형제자매 사이의 우선순위 다툼은 흔하지만, 편들기가 들어가면 갈등이 길어질 수 있어요.",
    avoid: "누가 먼저 그랬어! 양보해.",
    work: "둘 다 속상했겠다. 무슨 일이 있었는지 한 명씩 말해줄래?",
    change: "잘잘못을 가리기 전에 감정부터 알아봐 주세요.",
  },
  cm_discipline: {
    why: "훈육 상황에서는 부모의 기준과 아이의 속도가 부딪히기 가장 쉬워요.",
    avoid: "몇 번을 말해야 알아들어?",
    work: "이거 하고 나서 저거 하는 거 어때?",
    change: "지시 대신 순서를 함께 정하는 방식으로 바꿔보세요.",
  },
};

export function buildFallbackConflictMap(input: {
  childEvidences: BehaviorEvidence[];
  momEvidences: MomEvidence[];
  conflictInput: CurrentConflictInput;
}): ConflictMapSection {
  const levels = scoreConflictMap(input);
  const items: ConflictMapItem[] = Object.keys(CONFLICT_MAP_TEMPLATE).map((categoryId) => {
    const id = categoryId as keyof typeof CONFLICT_MAP_TEMPLATE;
    const template = CONFLICT_MAP_TEMPLATE[id];
    const levelResult: ConflictLevelResult = levels[id as keyof typeof levels];
    return {
      categoryId: id as ConflictMapItem["categoryId"],
      categoryLabel: CONFLICT_MAP_CATEGORY_LABEL[id as keyof typeof CONFLICT_MAP_CATEGORY_LABEL],
      level: levelResult.level,
      whyItHappens: template.why,
      avoidExample: template.avoid,
      workingExample: template.work,
      oneThingToChange: template.change,
      evidenceRefs: levelResult.matchedEvidenceRefs,
      groundedInGeneric: levelResult.groundedInGeneric,
    };
  });
  return { items, generationSource: "fallback" };
}

// re-export for convenience of callers that only need the category/domain lookup
export { CONFLICT_MAP_DOMAINS };
