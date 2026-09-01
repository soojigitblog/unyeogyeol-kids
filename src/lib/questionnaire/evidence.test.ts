import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { axisValues, buildBehaviorEvidence } from "./evidence";
import type { Answers } from "@/lib/types";

describe("questionnaire 구조", () => {
  it("총 10문항", () => {
    expect(QUESTIONS).toHaveLength(10);
  });
  it("각 문항은 정확히 4개 선택지", () => {
    for (const q of QUESTIONS) expect(q.options).toHaveLength(4);
  });
  it("선택지 값은 1~4 를 모두 포함(우열 척도가 아니라 위치)", () => {
    for (const q of QUESTIONS) {
      const values = q.options.map((o) => o.value).sort();
      expect(values).toEqual([1, 2, 3, 4]);
    }
  });
  it("선택지 라벨에 숫자 척도가 노출되지 않는다", () => {
    for (const q of QUESTIONS)
      for (const o of q.options) expect(o.label).not.toMatch(/[1-5]점|점수/);
  });
});

describe("BehaviorEvidence 변환", () => {
  const answers: Answers = {
    new_environment: 2,
    transition: 1,
    self_assertion: 4,
  };

  it("응답한 문항만 evidence 로 만든다", () => {
    const ev = buildBehaviorEvidence(answers);
    expect(ev).toHaveLength(3);
  });

  it("evidence 는 patternId·observedLabel·source·strength 를 가진다", () => {
    const ev = buildBehaviorEvidence(answers);
    for (const e of ev) {
      expect(e.patternId.length).toBeGreaterThan(0);
      expect(e.observedLabel.length).toBeGreaterThan(0);
      expect(e.source.scope).toBe("general");
      expect(e.source.questionIds.length).toBeGreaterThan(0);
      expect(e.strength).toBe("medium");
    }
  });

  it("axisValues 는 내부 축 이름으로 매핑된다", () => {
    const ax = axisValues(answers);
    expect(ax.needs_observation_time).toBe(2);
    expect(ax.transition_preference).toBe(1);
    expect(ax.strong_self_direction).toBe(4);
  });

  it("미응답이면 빈 evidence", () => {
    expect(buildBehaviorEvidence({})).toHaveLength(0);
  });
});
