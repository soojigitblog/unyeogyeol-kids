// P3.4 검증: 사용자 체크리스트 1(다양성) / 2(성향별 차이) / 4(AI 점수 생성 금지) / 10(재실행 안정성)

import { describe, it, expect } from "vitest";
import { scoreConflictMap } from "./conflictMapScoring";
import { buildBehaviorEvidence } from "@/lib/questionnaire/evidence";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { talkingPointsAiResponseSchema } from "@/lib/ai/schemas/kidsTalkingPoints";
import { conflictMapAiResponseSchema } from "@/lib/ai/schemas/kidsConflictMap";
import type { CurrentConflictInput } from "@/lib/types";

const CONFLICT_INPUT_BASE: CurrentConflictInput = {
  concernId: "discipline",
  scenarioId: "sc_discipline_instruction",
  recentFrequency: "occasional",
};

describe("P3.4 conflictMapScoring", () => {
  it("10. 같은 입력이면 항상 같은 결과(결정론)", () => {
    const childEv = buildBehaviorEvidence({ self_assertion: 4, parent_instruction: 4 });
    const momEv = buildMomEvidence({ instruction_resistance_style: "opt_inst_firm" });
    const a = scoreConflictMap({ childEvidences: childEv, momEvidences: momEv, conflictInput: CONFLICT_INPUT_BASE });
    const b = scoreConflictMap({ childEvidences: childEv, momEvidences: momEv, conflictInput: CONFLICT_INPUT_BASE });
    expect(a).toEqual(b);
  });

  it("1/2. 서로 다른 아이(설문 조합)는 서로 다른 충돌지도 레벨 벡터를 갖는다", () => {
    const frictionHeavyChild = buildBehaviorEvidence({
      self_assertion: 4,
      emotional_expression: 4,
      parent_instruction: 4,
      rule_response: 4,
    });
    const calmChild = buildBehaviorEvidence({
      self_assertion: 1,
      emotional_expression: 1,
      parent_instruction: 1,
      rule_response: 1,
    });
    const momEv = buildMomEvidence({});

    const highResult = scoreConflictMap({
      childEvidences: frictionHeavyChild,
      momEvidences: momEv,
      conflictInput: { ...CONFLICT_INPUT_BASE, concernId: "etc" },
    });
    const lowResult = scoreConflictMap({
      childEvidences: calmChild,
      momEvidences: momEv,
      conflictInput: { ...CONFLICT_INPUT_BASE, concernId: "etc" },
    });

    const highVector = Object.values(highResult).map((r) => r.level);
    const lowVector = Object.values(lowResult).map((r) => r.level);
    expect(highVector).not.toEqual(lowVector);
  });

  it("전용 문항이 없는 카테고리(미디어/형제자매)는 근거 없으면 정직하게 '보통'으로 처리된다", () => {
    const result = scoreConflictMap({
      childEvidences: [],
      momEvidences: [],
      conflictInput: { ...CONFLICT_INPUT_BASE, concernId: "etc" },
    });
    expect(result.cm_media.level).toBe("보통");
    expect(result.cm_media.groundedInGeneric).toBe(true);
    expect(result.cm_siblings.level).toBe("보통");
    expect(result.cm_siblings.groundedInGeneric).toBe(true);
  });

  it("concernId가 일치하는 카테고리는 빈도가 높을수록 레벨이 올라간다", () => {
    const low = scoreConflictMap({
      childEvidences: [],
      momEvidences: [],
      conflictInput: { concernId: "tantrum", scenarioId: "x", recentFrequency: "occasional" },
    });
    const high = scoreConflictMap({
      childEvidences: [],
      momEvidences: [],
      conflictInput: { concernId: "tantrum", scenarioId: "x", recentFrequency: "daily" },
    });
    const levelOrder = ["낮음", "보통", "높음", "매우높음"];
    expect(levelOrder.indexOf(high.cm_tantrum.level)).toBeGreaterThanOrEqual(
      levelOrder.indexOf(low.cm_tantrum.level)
    );
  });
});

describe("P3.4 AI 스키마는 점수/레벨 필드를 절대 포함하지 않는다 (체크리스트 4번)", () => {
  it("talkingPoints AI 응답 스키마에 level/score 필드가 없다", () => {
    const shape = talkingPointsAiResponseSchema.shape.items.element.shape;
    expect(Object.keys(shape)).not.toContain("level");
    expect(Object.keys(shape)).not.toContain("score");
  });

  it("conflictMap AI 응답 스키마에 level/score 필드가 없다", () => {
    const shape = conflictMapAiResponseSchema.shape.explanations.element.shape;
    expect(Object.keys(shape)).not.toContain("level");
    expect(Object.keys(shape)).not.toContain("score");
  });
});
