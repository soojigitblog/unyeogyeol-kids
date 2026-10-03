// P3.5 growthContent 조립 — 전부 결정론(AI 없음), 항상 계산된다(AI 성패와 무관).

import type { AgeBand } from "@/lib/age";
import type { GrowthActionItem, GrowthContentSection, RoadmapStageItem } from "@/lib/types";
import { TALENT_LABEL } from "./talentSeedCategories";
import type { TalentScoreResult } from "./talentSeedScoring";
import { getGrowthActionSet } from "./talentGrowthActivities";
import { buildGrowthRoadmap } from "./growthRoadmapContent";

export function buildGrowthContentSection(
  top5: TalentScoreResult[],
  currentAgeBand: AgeBand
): GrowthContentSection {
  const growthActions: GrowthActionItem[] = top5.map((t) => {
    const set = getGrowthActionSet(t.talentId, currentAgeBand);
    return {
      talentId: t.talentId,
      talentLabel: TALENT_LABEL[t.talentId],
      ...set,
    };
  });

  const roadmap: RoadmapStageItem[] = buildGrowthRoadmap(currentAgeBand);

  return { growthActions, roadmap };
}
