// P3.5 "연령별 성장 로드맵" — 미래를 예언하지 않는다. 현재 연령 기준으로 앞으로의
// 발달 단계만 순서대로 보여주는 정적 콘텐츠(AI 관여 없음). age.ts의 AgeBand(무료
// 결과 페이지 전용, 거의 미사용)와는 의미가 달라 완전히 별도 타입으로 둔다 —
// 로드맵은 "지금 나이와 무관하게 항상 앞으로의 단계를 나열"하는 용도라서다.

import type { AgeBand } from "@/lib/age";

export type GrowthStageId =
  | "toddler_2_3"
  | "preschool_4_5"
  | "kindergarten_6_7"
  | "elementary_low"
  | "elementary_high"
  | "puberty";

const STAGE_ORDER: GrowthStageId[] = [
  "toddler_2_3",
  "preschool_4_5",
  "kindergarten_6_7",
  "elementary_low",
  "elementary_high",
  "puberty",
];

export interface RoadmapStage {
  stageId: GrowthStageId;
  ageLabel: string;
  relativeLabel: "지금" | "다음 성장 단계" | null;
  keyKeyword: string;
  strengthToNurture: string;
  recommendedExperience: string;
  parentRole: string;
  watchOutFor: string;
  talentSignal: string;
  detailLevel: "full" | "brief";
}

const STAGE_CONTENT: Record<
  GrowthStageId,
  Omit<RoadmapStage, "relativeLabel" | "detailLevel">
> = {
  toddler_2_3: {
    stageId: "toddler_2_3",
    ageLabel: "2~3세",
    keyKeyword: "안정감과 탐색의 균형",
    strengthToNurture: "안전한 애착을 바탕으로 스스로 움직여보는 힘",
    recommendedExperience: "짧은 자유 놀이 시간, 익숙한 공간에서의 작은 모험",
    parentRole: "결과보다 시도 자체를 알아봐 주기",
    watchOutFor: "너무 이른 규칙/성취 강요",
    talentSignal: "좋아하는 놀이를 반복해서 찾는 모습",
  },
  preschool_4_5: {
    stageId: "preschool_4_5",
    ageLabel: "4~5세",
    keyKeyword: "관계와 규칙 이해의 시작",
    strengthToNurture: "또래와 어울리고 규칙을 이해하려는 힘",
    recommendedExperience: "그룹 놀이, 역할극, 간단한 보드게임",
    parentRole: "선택지를 주고 스스로 정하게 돕기",
    watchOutFor: "친구 관계를 성적처럼 평가하는 것",
    talentSignal: "특정 놀이·주제에 유독 오래 몰입하는 모습",
  },
  kindergarten_6_7: {
    stageId: "kindergarten_6_7",
    ageLabel: "6~7세",
    keyKeyword: "자기표현과 자립의 확장",
    strengthToNurture: "생각을 말이나 글로 표현하고 스스로 해내는 힘",
    recommendedExperience: "발표/역할극 기회, 작은 프로젝트 완수 경험",
    parentRole: "결과보다 시도한 방법을 함께 되짚어보기",
    watchOutFor: "또래와의 비교, 지나치게 이른 선행 학습",
    talentSignal: "설명하지 않아도 스스로 규칙을 찾아내는 모습",
  },
  elementary_low: {
    stageId: "elementary_low",
    ageLabel: "초등 저학년",
    keyKeyword: "학습 습관과 또래 관계의 기초",
    strengthToNurture: "스스로 계획하고 친구와 협력하는 힘",
    recommendedExperience: "동아리·모둠 활동, 관심 분야 체험",
    parentRole: "학습량보다 배우는 방식 존중하기",
    watchOutFor: "성적 위주의 조기 진로 단정",
    talentSignal: "특정 과목·활동에 자발적으로 더 시간을 쓰는 모습",
  },
  elementary_high: {
    stageId: "elementary_high",
    ageLabel: "초등 고학년",
    keyKeyword: "정체성과 몰입 분야의 구체화",
    strengthToNurture: "관심 분야를 깊이 파고드는 힘, 자기 의견 세우기",
    recommendedExperience: "심화 클래스, 프로젝트형 활동, 또래 리더 경험",
    parentRole: "진로를 정하기보다 다양한 경험을 열어두기",
    watchOutFor: "성적이나 등수만으로 재능을 좁혀 말하는 것",
    talentSignal: "스스로 목표를 세우고 꾸준히 이어가는 모습",
  },
  puberty: {
    stageId: "puberty",
    ageLabel: "사춘기",
    keyKeyword: "자율성과 정체성 확립",
    strengthToNurture: "스스로 선택하고 책임지는 힘",
    recommendedExperience: "자율적으로 선택하는 활동, 또래·사회 경험 확장",
    parentRole: "통제보다 신뢰를 바탕으로 한 대화",
    watchOutFor: "과거 방식 그대로의 훈육 고수",
    talentSignal: "이전 단계에서 보인 재능을 스스로 더 발전시키려는 모습",
  },
};

function currentStageIndex(band: AgeBand): number {
  switch (band) {
    case "under_toddler":
    case "toddler":
      return 0;
    case "preschool":
      return 1;
    case "kindergarten":
      return 2;
    case "over_kindergarten":
    default:
      return 3;
  }
}

/**
 * 현재 연령(ageBand) 이후의 성장 단계만 순서대로 반환한다. 지난 단계는 보여주지
 * 않는다("미래를 예언하지 않는다" 원칙과 별개로, 이미 지난 시기를 로드맵에 넣는 건
 * 무의미하기 때문). 가장 가까운 2단계(지금/다음)만 상세(full), 나머지는 간략(brief).
 */
export function buildGrowthRoadmap(currentAgeBand: AgeBand): RoadmapStage[] {
  const startIdx = currentStageIndex(currentAgeBand);
  const stages = STAGE_ORDER.slice(startIdx);

  return stages.map((stageId, i) => {
    const content = STAGE_CONTENT[stageId];
    const relativeLabel: RoadmapStage["relativeLabel"] =
      i === 0 ? "지금" : i === 1 ? "다음 성장 단계" : null;
    return {
      ...content,
      relativeLabel,
      detailLevel: i <= 1 ? "full" : "brief",
    };
  });
}
