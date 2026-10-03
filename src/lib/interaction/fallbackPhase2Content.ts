// P3.5 AI 실패/mock 시 사용하는 결정론 템플릿 생성기 (재능씨앗 설명 + 감정/학습/관계 가이드).
// fallbackTalkingPointsAndConflictMap.ts와 동일한 원칙: 없는 근거를 지어내지 않는다.

import type {
  BehaviorEvidence,
  EmotionGuideItem,
  GuidesSection,
  LearningGuideItem,
  MomEvidence,
  RelationshipGuidePrimary,
  TalentSeedItem,
  TalentSeedsSection,
} from "@/lib/types";
import { TALENT_LABEL } from "./talentSeedCategories";
import type { TalentScoreResult } from "./talentSeedScoring";
import { buildFutureFields } from "./futureFieldsLookup";
import {
  EMOTION_SITUATION_HAS_EVIDENCE,
  EMOTION_SITUATION_LABEL,
  LEARNING_AXIS_HAS_EVIDENCE,
  LEARNING_AXIS_LABEL,
} from "./guidesCategories";
import { EMOTION_SITUATION_IDS, LEARNING_AXIS_IDS } from "@/lib/ai/schemas/kidsGuides";
import { buildOtherCaregiverCta, resolveRelationshipSourceType } from "./relationshipGuideContent";

export function buildFallbackTalentSeeds(top5: TalentScoreResult[]): TalentSeedsSection {
  const items: TalentSeedItem[] = top5.map((t) => {
    const label = TALENT_LABEL[t.talentId];
    const fortuneReasonLine =
      t.fortuneContribution > 0
        ? `사주에서 ${label} 쪽 방향의 힌트를 참고해볼 수 있어요.`
        : null;
    const observationNote =
      t.observationContribution > 0
        ? `실제 생활 관찰에서도 ${label}과 관련된 모습이 함께 나타났어요.`
        : "아직 실제 생활 관찰 데이터는 충분하지 않아요.";
    return {
      talentId: t.talentId,
      label,
      strengthLevel: t.strengthLevel,
      sourceType: t.sourceType,
      strengthLine: `${label} 쪽에서 강점을 보일 수 있는 재능 씨앗이에요.`,
      fortuneReasonLine,
      realLifeLine: `일상에서 ${label}과 관련된 상황을 마주할 때 이 힘이 드러날 수 있어요.`,
      observationNote,
      evidenceRefs: t.evidenceRefs,
    };
  });

  return {
    items,
    futureFields: buildFutureFields(top5).map((e) => ({
      field: e.field,
      fromTalentLabel: e.fromTalentLabel,
    })),
    generationSource: "fallback",
  };
}

const EMOTION_TEMPLATE: Record<string, Omit<EmotionGuideItem, "situationId" | "situationLabel" | "evidenceRefs" | "groundedInGeneric">> = {
  em_angry: {
    signal: "목소리가 커지거나 몸짓이 커지는 모습을 먼저 보일 수 있어요.",
    misreadPoint: "버릇없다고 오해하기 쉽지만, 감정을 다루는 연습 중일 수 있어요.",
    helpfulResponse: "감정을 먼저 알아봐 준 뒤 행동을 안내해 주세요.",
    avoidPhrase: "그만해! 왜 화를 내!",
    workingPhrase: "많이 화가 났구나. 잠깐 같이 숨 고르고 얘기해볼까?",
    afterCalmAction: "진정된 뒤 무슨 일이 있었는지 짧게 물어봐 주세요.",
  },
  em_upset: {
    signal: "말수가 줄거나 표정이 어두워지는 모습을 보일 수 있어요.",
    misreadPoint: "아무 일 없어 보여도 실제로는 마음이 상해 있을 수 있어요.",
    helpfulResponse: "괜찮은지 먼저 물어보고 답을 재촉하지 마세요.",
    avoidPhrase: "별것도 아닌데 왜 그래.",
    workingPhrase: "속상했겠다. 얘기하고 싶어지면 말해줘.",
    afterCalmAction: "이야기할 준비가 되면 천천히 들어주세요.",
  },
  em_anxious: {
    signal: "몸이 굳거나 자꾸 확인하려는 모습을 보일 수 있어요.",
    misreadPoint: "고집이라고 오해하기 쉽지만 안심이 필요한 신호일 수 있어요.",
    helpfulResponse: "재촉하지 않고 옆에서 안심할 시간을 주세요.",
    avoidPhrase: "별거 아니야, 빨리 해.",
    workingPhrase: "천천히 해도 괜찮아. 내가 옆에 있을게.",
    afterCalmAction: "안심한 뒤에 다음 행동을 짧게 안내해 주세요.",
  },
  em_unfamiliar: {
    signal: "주변을 살피며 바로 움직이지 않는 모습을 보일 수 있어요.",
    misreadPoint: "소극적이라고 오해하기 쉽지만 탐색 중인 모습일 수 있어요.",
    helpfulResponse: "충분히 살펴본 뒤 스스로 움직이게 기다려 주세요.",
    avoidPhrase: "뭐가 무서워, 얼른 가봐.",
    workingPhrase: "여기서 잠깐 같이 보다가, 준비되면 가보자.",
    afterCalmAction: "스스로 다가간 뒤 그 모습을 알아봐 주세요.",
  },
  em_failure: {
    signal: "잠깐 속상해하다 다시 시도하거나, 시간이 더 필요할 수 있어요.",
    misreadPoint: "포기가 빠르다고 오해하기 쉽지만 회복 방식이 다를 수 있어요.",
    helpfulResponse: "결과보다 시도한 과정을 먼저 알아봐 주세요.",
    avoidPhrase: "그거 하나도 못해?",
    workingPhrase: "다시 해보고 싶으면 도와줄게.",
    afterCalmAction: "다음에 다르게 해볼 방법을 함께 생각해보세요.",
  },
  em_jealous: {
    signal: "비교하는 말을 하거나 관심을 더 원하는 모습을 보일 수 있어요.",
    misreadPoint: "떼쓴다고 오해하기 쉽지만 관심이 필요한 신호일 수 있어요.",
    helpfulResponse: "감정을 인정해주고 소외되지 않았다고 알려주세요.",
    avoidPhrase: "그런 걸로 왜 질투해.",
    workingPhrase: "그렇게 느낄 수 있어. 너도 소중해.",
    afterCalmAction: "둘만의 시간을 짧게라도 만들어주세요.",
  },
  em_embarrassed: {
    signal: "얼굴을 가리거나 숨으려는 모습을 보일 수 있어요.",
    misreadPoint: "소심하다고 단정하기보다 순간의 반응일 수 있어요.",
    helpfulResponse: "놀리지 않고 자연스럽게 넘어가 주세요.",
    avoidPhrase: "왜 그렇게 부끄러워해.",
    workingPhrase: "괜찮아, 그럴 수 있어.",
    afterCalmAction: "다시 편해질 때까지 기다려 주세요.",
  },
};

const LEARNING_TEMPLATE: Record<string, Omit<LearningGuideItem, "axisId" | "axisLabel" | "evidenceRefs" | "groundedInGeneric">> = {
  la_explain_vs_experience: {
    howTheyLearn: "아직 이 부분은 관찰 데이터가 충분하지 않아요.",
    signOfIt: "여러 방식으로 시도해보며 어떤 쪽을 더 편해하는지 살펴봐 주세요.",
    parentTip: "설명과 체험을 번갈아 시도해보고 반응을 살펴보세요.",
  },
  la_immersion_vs_repetition: {
    howTheyLearn: "한 가지에 깊이 빠져드는 편인지, 여러 번 반복하며 익히는 편인지 관찰에서 나타나요.",
    signOfIt: "좋아하는 놀이에 얼마나 오래 머무는지로 알 수 있어요.",
    parentTip: "몰입 중일 땐 끊지 말고, 반복을 즐기면 충분히 반복하게 해주세요.",
  },
  la_alone_vs_together: {
    howTheyLearn: "혼자 몰두할 때와 함께할 때 중 집중이 더 잘 되는 쪽이 있을 수 있어요.",
    signOfIt: "또래와 있을 때와 혼자 있을 때의 몰입도 차이로 나타나요.",
    parentTip: "둘 다 경험할 기회를 주고 편해하는 쪽을 더 늘려주세요.",
  },
  la_competition_vs_self: {
    howTheyLearn: "칭찬을 들을 때 신나 하는 편인지, 스스로 만족할 때 더 동기부여되는 편인지 나타나요.",
    signOfIt: "칭찬 후 반응과 혼자 해냈을 때의 반응 차이로 알 수 있어요.",
    parentTip: "이 아이가 더 반응하는 방식으로 동기를 북돋아 주세요.",
  },
  la_praise_goal_choice: {
    howTheyLearn: "칭찬, 목표 달성, 선택권 중 무엇에 더 크게 반응하는지 관찰에서 나타나요.",
    signOfIt: "무엇을 줬을 때 더 적극적으로 움직이는지로 알 수 있어요.",
    parentTip: "가장 잘 반응하는 동기 방식을 우선 활용해보세요.",
  },
  la_visual_verbal_kinesthetic: {
    howTheyLearn: "아직 이 부분은 관찰 데이터가 충분하지 않아요.",
    signOfIt: "그림/말/직접 해보기 중 어떤 방식에 더 반응하는지 살펴봐 주세요.",
    parentTip: "세 가지 방식을 번갈아 시도해보고 반응을 확인해보세요.",
  },
  la_immediate_vs_longterm: {
    howTheyLearn: "아직 이 부분은 관찰 데이터가 충분하지 않아요.",
    signOfIt: "짧은 보상과 긴 목표 중 어디에 더 오래 집중하는지 살펴봐 주세요.",
    parentTip: "작은 단위로 나눠 성취를 자주 느끼게 해주세요.",
  },
};

export function buildFallbackGuides(input: {
  childEvidences: BehaviorEvidence[];
  momEvidences: MomEvidence[];
  caregiverRoleLabel: string;
  hasChildFortune: boolean;
  hasCaregiverFortune: boolean;
}): GuidesSection {
  const emotionGuide: EmotionGuideItem[] = EMOTION_SITUATION_IDS.map((id) => {
    const template = EMOTION_TEMPLATE[id];
    const hasEvidence = EMOTION_SITUATION_HAS_EVIDENCE[id] ?? false;
    return {
      situationId: id,
      situationLabel: EMOTION_SITUATION_LABEL[id],
      ...template,
      evidenceRefs: [],
      groundedInGeneric: !hasEvidence,
    };
  });

  const learningGuide: LearningGuideItem[] = LEARNING_AXIS_IDS.map((id) => {
    const template = LEARNING_TEMPLATE[id];
    const hasEvidence = LEARNING_AXIS_HAS_EVIDENCE[id] ?? false;
    return {
      axisId: id,
      axisLabel: LEARNING_AXIS_LABEL[id],
      ...template,
      evidenceRefs: [],
      groundedInGeneric: !hasEvidence,
    };
  });

  const sourceType = resolveRelationshipSourceType({
    hasChildFortune: input.hasChildFortune,
    hasCaregiverFortune: input.hasCaregiverFortune,
    momEvidences: input.momEvidences,
  });

  const primary: RelationshipGuidePrimary = {
    caregiverRoleLabel: input.caregiverRoleLabel,
    goodFitPoints: [`${input.caregiverRoleLabel}와 아이가 함께 편안해하는 순간들이 있어요.`],
    frictionPoints: ["시간에 쫓길 때 서로 속도가 다르게 느껴질 수 있어요."],
    unintendedTriggers: [`${input.caregiverRoleLabel}가 급하게 재촉할 때 아이가 더 버틸 수 있어요.`],
    whatChildWants: "아이는 이유를 먼저 듣고 스스로 선택하고 싶어해요.",
    disciplineApproach: "명령보다 선택지를 주는 방식이 더 잘 통할 수 있어요.",
    quickRepairMethod: "감정이 가라앉은 뒤 짧게 안아주거나 다정하게 말을 건네보세요.",
    evidenceRefs: [],
    sourceType,
  };

  return {
    emotionGuide,
    learningGuide,
    relationshipGuide: { primary, otherCaregiverCta: buildOtherCaregiverCta() },
    generationSource: "fallback",
  };
}
