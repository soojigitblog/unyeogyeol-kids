import { z } from "zod";

// P3.5 "재능 씨앗" AI 출력 스키마. strengthLevel/순위는 절대 여기 없다 —
// talentSeedScoring.ts(결정론)가 계산해서 서버가 파싱 후 주입한다.
//
// 이 튜플은 talentSeedCategories.ts의 TALENT_IDS와 값이 반드시 같아야 한다(zod
// enum이 리터럴 튜플을 요구해서 별도로 둔다 — kidsConflictMap.ts와 동일한 패턴).
export const TALENT_ID_TUPLE = [
  "talent_observation",
  "talent_inquiry",
  "talent_logic",
  "talent_language",
  "talent_expression",
  "talent_creativity",
  "talent_spatial",
  "talent_physical",
  "talent_empathy",
  "talent_relationship",
  "talent_leadership",
  "talent_independence",
  "talent_execution",
  "talent_immersion",
  "talent_problem_solving",
] as const;

export const talentIdSchema = z.enum(TALENT_ID_TUPLE);

export const talentNarrativeItemSchema = z.object({
  talentId: talentIdSchema,
  strengthLine: z.string().min(1).max(120), // "이런 힘이에요"
  fortuneReasonLine: z.string().max(160).nullable(), // 사주 신호가 있을 때만, 명리 용어 금지
  realLifeLine: z.string().min(1).max(200), // "실제로 이런 모습으로 나타날 수 있어요"
  observationNote: z.string().min(1).max(160), // 근거 없으면 정직하게 부족하다고 씀
  evidenceRefs: z.array(z.string().min(1)).max(6),
});

export const talentNarrativeAiResponseSchema = z.object({
  items: z.array(talentNarrativeItemSchema).length(5),
});

export type TalentNarrativeItem = z.infer<typeof talentNarrativeItemSchema>;
export type TalentNarrativeAiResponse = z.infer<typeof talentNarrativeAiResponseSchema>;
