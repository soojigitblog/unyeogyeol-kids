import { describe, it, expect } from "vitest";
import { buildGrowthRoadmap } from "./growthRoadmapContent";

describe("P3.5 growthRoadmapContent", () => {
  it("가장 어린 밴드(toddler)는 6단계 전체를 반환한다", () => {
    const stages = buildGrowthRoadmap("toddler");
    expect(stages).toHaveLength(6);
    expect(stages[0].relativeLabel).toBe("지금");
    expect(stages[1].relativeLabel).toBe("다음 성장 단계");
    expect(stages.slice(2).every((s) => s.relativeLabel === null)).toBe(true);
  });

  it("지난 단계는 보여주지 않는다 — kindergarten은 toddler/preschool을 포함하지 않는다", () => {
    const stages = buildGrowthRoadmap("kindergarten");
    expect(stages.map((s) => s.stageId)).not.toContain("toddler_2_3");
    expect(stages.map((s) => s.stageId)).not.toContain("preschool_4_5");
    expect(stages[0].stageId).toBe("kindergarten_6_7");
  });

  it("가까운 2단계만 상세(full), 나머지는 간략(brief)이다", () => {
    const stages = buildGrowthRoadmap("toddler");
    expect(stages[0].detailLevel).toBe("full");
    expect(stages[1].detailLevel).toBe("full");
    expect(stages.slice(2).every((s) => s.detailLevel === "brief")).toBe(true);
  });

  it("결정론 — 같은 ageBand는 항상 같은 결과", () => {
    expect(buildGrowthRoadmap("preschool")).toEqual(buildGrowthRoadmap("preschool"));
  });
});
