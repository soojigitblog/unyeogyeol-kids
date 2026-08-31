import { describe, expect, it } from "vitest";
import { generateFreeResult } from "./freeResult";
import type { AxisValues } from "@/lib/questionnaire/evidence";

// 관찰: 낯선 상황을 오래 살펴보는 아이 (needs_observation_time = 2)
const observantAxes: AxisValues = {
  needs_observation_time: 2,
  strong_self_direction: 3,
  play_focus_style: 4,
};

describe("Free Result 구조", () => {
  it("키워드는 정확히 3개", () => {
    const r = generateFreeResult({
      axes: observantAxes,
      fortune: { dayMasterElement: "earth" },
      ageBand: "preschool",
    });
    expect(r.keywords).toHaveLength(3);
  });

  it("5블록 콘텐츠 필드가 모두 채워진다", () => {
    const r = generateFreeResult({
      axes: observantAxes,
      fortune: null,
      ageBand: "toddler",
    });
    expect(r.oneSentence.length).toBeGreaterThan(0);
    expect(r.misreading.length).toBeGreaterThan(0);
    expect(r.phraseBefore.length).toBeGreaterThan(0);
    expect(r.phraseAfter.length).toBeGreaterThan(0);
  });
});

describe("사주가 관찰을 덮어쓰지 않는다 (Humanized Integration)", () => {
  it("사주(火=바깥 지향)와 관찰(오래 살펴봄)이 충돌해도 관찰된 신중함이 유지되며 자연스럽게 통합된다", () => {
    const r = generateFreeResult({
      axes: observantAxes,
      fortune: { dayMasterElement: "fire" },
      ageBand: "preschool",
    });
    // 관찰 우선: "충분히 살펴보지만" 서술이 포함되어야 한다
    expect(r.oneSentence).toContain("충분히 살펴보지만");
    // "활동적인 아이" 처럼 사주만으로 단정하지 않는다
    expect(r.oneSentence).not.toContain("활동적인 아이");
    // 시스템 해설 표현("부모 관찰에서는", "타고난 결에는")이 없어야 함
    expect(r.oneSentence).not.toContain("타고난 결");
    expect(r.oneSentence).not.toContain("부모 관찰");
  });

  it("사주 신호가 없어도(시간 미상) 온전한 가치의 결과가 생성된다", () => {
    const r = generateFreeResult({
      axes: observantAxes,
      fortune: null,
      ageBand: "kindergarten",
    });
    expect(r.oneSentence.length).toBeGreaterThan(0);
    expect(r.keywords).toHaveLength(3);
  });
});
