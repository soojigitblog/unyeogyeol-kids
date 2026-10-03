// P3.5 검증: 체크리스트 8번(어린 연령에 입시/직업 문구 과다 노출 안 됨) /
// 14번(금지된 단정 표현 없음) — 정적 큐레이션 콘텐츠 전수 스캔.

import { describe, it, expect } from "vitest";
import { runLexicalGuard } from "./safetyValidators";
import { TALENT_IDS } from "./talentSeedCategories";
import { getGrowthActionSet, CORE_BANDS } from "./talentGrowthActivities";
import { buildFutureFields } from "./futureFieldsLookup";
import { topTalents, scoreAllTalents } from "./talentSeedScoring";
import { buildGrowthRoadmap } from "./growthRoadmapContent";
import { buildFallbackTalentSeeds, buildFallbackGuides } from "./fallbackPhase2Content";

describe("P3.5 정적 큐레이션 콘텐츠 — 금지어 스캔", () => {
  it("재능 키우는 행동(전 talent × 전 core band)에 금지어가 없다", () => {
    for (const talentId of TALENT_IDS) {
      for (const band of CORE_BANDS) {
        const set = getGrowthActionSet(talentId, band);
        const violations = runLexicalGuard(JSON.stringify(set));
        expect(violations).toEqual([]);
      }
    }
  });

  it("미래 연결 분야 문구에 입시/직업추천 단정 표현이 없다", () => {
    const allTop = topTalents(scoreAllTalents({ dayMasterElement: "wood", childEvidences: [] }), 15);
    const fields = buildFutureFields(allTop, 15);
    const violations = runLexicalGuard(JSON.stringify(fields));
    expect(violations).toEqual([]);
  });

  it("성장 로드맵 전 단계에 금지어가 없다", () => {
    const bands = ["toddler", "preschool", "kindergarten", "over_kindergarten"] as const;
    for (const b of bands) {
      const violations = runLexicalGuard(JSON.stringify(buildGrowthRoadmap(b)));
      expect(violations).toEqual([]);
    }
  });

  it("fallback 재능씨앗/가이드 콘텐츠에 금지어가 없다", () => {
    const top5 = topTalents(scoreAllTalents({ dayMasterElement: "fire", childEvidences: [] }));
    const talentViolations = runLexicalGuard(JSON.stringify(buildFallbackTalentSeeds(top5)));
    expect(talentViolations).toEqual([]);

    const guides = buildFallbackGuides({
      childEvidences: [],
      momEvidences: [],
      caregiverRoleLabel: "엄마",
      hasChildFortune: false,
      hasCaregiverFortune: false,
    });
    const guideViolations = runLexicalGuard(JSON.stringify(guides));
    expect(guideViolations).toEqual([]);
  });
});
