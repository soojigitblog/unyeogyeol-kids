// P3.5 검증: 체크리스트 11(재조회 시 AI 재호출 없음, 구조적 확인) / 12(AI 실패 시 fallback으로 열림)

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { generatePaidExtras } from "./generatePaidExtras";
import { resetKidsOpenAIClientForTests } from "@/lib/ai/kidsOpenAiClient";
import type { CaregiverProfile, ChildProfile, CurrentConflictInput } from "@/lib/types";

const child: ChildProfile = {
  name: "테스트",
  birthDate: "2022-05-01",
  birthTimeKnown: false,
  gender: "girl",
};
const caregiverProfile: CaregiverProfile = {
  role: "mother",
  roleLabel: "엄마",
  birthDate: "1990-01-01",
  birthTimeKnown: false,
};
const conflictInput: CurrentConflictInput = {
  concernId: "discipline",
  scenarioId: "sc_discipline_instruction",
  recentFrequency: "daily",
};

function baseInput() {
  return {
    child,
    caregiverProfile,
    caregiverRoleLabel: "엄마",
    childEvidences: [],
    momEvidences: [],
    conflictInput,
    fortune: null,
    caregiverFortune: null,
    currentAgeBand: "preschool" as const,
  };
}

describe("P3.5 generatePaidExtras", () => {
  const originalMode = process.env.AI_MODE;
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    resetKidsOpenAIClientForTests();
  });
  afterEach(() => {
    process.env.AI_MODE = originalMode;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    resetKidsOpenAIClientForTests();
  });

  it("AI_MODE=mock이면 항상 fallback 콘텐츠를 반환하고 네트워크를 타지 않는다", async () => {
    process.env.AI_MODE = "mock";
    const result = await generatePaidExtras(baseInput());
    expect(result.talkingPoints.generationSource).toBe("fallback");
    expect(result.conflictMap.generationSource).toBe("fallback");
    expect(result.talentSeeds.generationSource).toBe("fallback");
    expect(result.guides.generationSource).toBe("fallback");
    expect(result.growthContent.roadmap.length).toBeGreaterThan(0);
  });

  it("12. AI_MODE=live인데 API 키가 없어 실패해도 throw하지 않고 fallback으로 대체한다", async () => {
    process.env.AI_MODE = "live";
    delete process.env.OPENAI_API_KEY;
    const result = await generatePaidExtras(baseInput());
    expect(result.talkingPoints.generationSource).toBe("fallback");
    expect(result.guides.generationSource).toBe("fallback");
  });

  it("growthContent(재능행동+로드맵)는 AI 모드와 무관하게 항상 결정론으로 채워진다", async () => {
    process.env.AI_MODE = "mock";
    const mock = await generatePaidExtras(baseInput());
    process.env.AI_MODE = "live";
    delete process.env.OPENAI_API_KEY;
    const live = await generatePaidExtras(baseInput());
    expect(mock.growthContent).toEqual(live.growthContent);
  });

  it("11. 리포트 읽기 경로(paidExtrasStore.ts)는 AI 생성 코드를 참조하지 않는다(재조회 시 재호출 불가능함을 정적으로 보장)", () => {
    const file = path.join(process.cwd(), "src/lib/server/paidExtrasStore.ts");
    const content = fs.readFileSync(file, "utf-8");
    expect(content).not.toMatch(/generatePaidExtras|generateKidsStructured|generateViaAi/);
  });
});
