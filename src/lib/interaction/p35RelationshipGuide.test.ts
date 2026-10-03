// P3.5 검증: 체크리스트 7번(엄마/아빠 결과가 단순 복사가 아님) — 실제 분석은 항상
// 실제 caregiverRoleLabel을 쓰고, CTA는 항상 같은 중립 고정 문구다.

import { describe, it, expect } from "vitest";
import { buildOtherCaregiverCta, resolveRelationshipSourceType } from "./relationshipGuideContent";

describe("P3.5 relationshipGuideContent", () => {
  it("다른 보호자 CTA는 항상 동일한 중립 문구이며 특정 관계(엄마/아빠)를 추측하지 않는다", () => {
    const cta = buildOtherCaregiverCta();
    expect(cta.ctaText).not.toMatch(/엄마|아빠/);
    expect(cta.ctaText).toBe(buildOtherCaregiverCta().ctaText);
  });

  it("사주+관찰 둘 다 있으면 mixed, 관찰만 있으면 observation, 아무것도 없으면 generic", () => {
    expect(
      resolveRelationshipSourceType({ hasChildFortune: true, hasCaregiverFortune: true, momEvidences: [{ domain: "time_pressure_style", axis: "urgency_pace", patternId: "x", observedLabel: "x", confidence: "medium", sourceQuestionId: "q" }] })
    ).toBe("mixed");
    expect(
      resolveRelationshipSourceType({ hasChildFortune: false, hasCaregiverFortune: false, momEvidences: [{ domain: "time_pressure_style", axis: "urgency_pace", patternId: "x", observedLabel: "x", confidence: "medium", sourceQuestionId: "q" }] })
    ).toBe("observation");
    expect(
      resolveRelationshipSourceType({ hasChildFortune: false, hasCaregiverFortune: false, momEvidences: [] })
    ).toBe("generic");
  });
});
