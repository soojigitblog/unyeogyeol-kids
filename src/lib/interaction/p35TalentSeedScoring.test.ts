// P3.5 검증: 사용자 체크리스트 1(같은 사주→같은 순위) / 2(다른 사주→다른 결과) /
// 3(설문만 바뀌어도 달라짐) / 5(AI가 순위를 못 만듦) / 13(generic 정직 처리)

import { describe, it, expect } from "vitest";
import { scoreAllTalents, topTalents } from "./talentSeedScoring";
import { buildBehaviorEvidence } from "@/lib/questionnaire/evidence";
import { talentNarrativeAiResponseSchema } from "@/lib/ai/schemas/kidsTalentNarrative";

describe("P3.5 talentSeedScoring", () => {
  it("1. 같은 입력이면 항상 같은 재능 순위(결정론)", () => {
    const ev = buildBehaviorEvidence({ self_assertion: 4, rule_response: 4 });
    const a = topTalents(scoreAllTalents({ dayMasterElement: "wood", childEvidences: ev }));
    const b = topTalents(scoreAllTalents({ dayMasterElement: "wood", childEvidences: ev }));
    expect(a.map((t) => t.talentId)).toEqual(b.map((t) => t.talentId));
  });

  it("2. 관찰 근거가 없어도 오행(사주)만 다르면 TOP 재능이 실제로 달라진다", () => {
    const woodTop = topTalents(scoreAllTalents({ dayMasterElement: "wood", childEvidences: [] }));
    const metalTop = topTalents(scoreAllTalents({ dayMasterElement: "metal", childEvidences: [] }));
    expect(woodTop[0].talentId).not.toBe(metalTop[0].talentId);
  });

  it("3. 오행이 같아도 설문(관찰 근거)이 다르면 재능 순위가 달라진다", () => {
    const evA = buildBehaviorEvidence({ play_immersion: 4 }); // 몰입
    const evB = buildBehaviorEvidence({ social_approach: 4 }); // 관계/리더십
    const topA = topTalents(scoreAllTalents({ dayMasterElement: "fire", childEvidences: evA }));
    const topB = topTalents(scoreAllTalents({ dayMasterElement: "fire", childEvidences: evB }));
    expect(topA.map((t) => t.talentId)).not.toEqual(topB.map((t) => t.talentId));
  });

  it("13. 근거가 전혀 없는 재능은 '잠재' + sourceType generic으로 정직하게 처리된다", () => {
    const scores = scoreAllTalents({ dayMasterElement: null, childEvidences: [] });
    for (const talentId of Object.keys(scores) as (keyof typeof scores)[]) {
      expect(scores[talentId].strengthLevel).toBe("잠재");
      expect(scores[talentId].sourceType).toBe("generic");
      expect(scores[talentId].evidenceRefs).toEqual([]);
    }
  });

  it("concern 전용 micro-check(식사/수면) evidence는 재능 점수에 반영되지 않는다", () => {
    const microOnly = [
      {
        domain: "food_new_food" as const,
        patternId: "new_food_hesitation",
        observedLabel: "낯선 음식 관찰",
        strength: "medium" as const,
        source: { scope: "concern_micro" as const, concernId: "meal" as const, questionIds: ["food_q1"] },
      },
    ];
    const scores = scoreAllTalents({ dayMasterElement: null, childEvidences: microOnly });
    const allZero = Object.values(scores).every((s) => s.observationContribution === 0);
    expect(allZero).toBe(true);
  });
});

describe("P3.5 재능 씨앗 AI 스키마는 등급/순위/점수를 절대 포함하지 않는다 (체크리스트 5번)", () => {
  it("talentNarrative AI 응답 스키마에 strengthLevel/score/ranking 필드가 없다", () => {
    const shape = talentNarrativeAiResponseSchema.shape.items.element.shape;
    expect(Object.keys(shape)).not.toContain("strengthLevel");
    expect(Object.keys(shape)).not.toContain("score");
    expect(Object.keys(shape)).not.toContain("ranking");
  });
});
