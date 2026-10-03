import { z } from "zod";

// P3.4 "부모×아이 충돌지도" AI 출력 스키마.
// level(낮음/보통/높음/매우높음)은 절대 이 스키마에 넣지 않는다 — 결정론 코드
// (conflictMapScoring.ts)가 계산하고, AI는 그 값을 설명하는 글만 쓴다.

export const CONFLICT_MAP_CATEGORY_IDS = [
  "cm_morning_routine",
  "cm_meal",
  "cm_outing",
  "cm_tidy_up",
  "cm_tantrum",
  "cm_emotional_burst",
  "cm_bedtime",
  "cm_study",
  "cm_friends",
  "cm_media",
  "cm_rules",
  "cm_siblings",
  "cm_discipline",
] as const;

export const conflictMapCategoryIdSchema = z.enum(CONFLICT_MAP_CATEGORY_IDS);

export const conflictMapAiItemSchema = z.object({
  categoryId: conflictMapCategoryIdSchema,
  whyItHappens: z.string().min(1).max(200),
  avoidExample: z.string().min(1).max(80),
  workingExample: z.string().min(1).max(80),
  oneThingToChange: z.string().min(1).max(160),
  evidenceRefs: z.array(z.string().min(1)).max(6),
  groundedInGeneric: z.boolean(),
});

export const conflictMapAiResponseSchema = z.object({
  explanations: z.array(conflictMapAiItemSchema).length(13),
});

export type ConflictMapAiItem = z.infer<typeof conflictMapAiItemSchema>;
export type ConflictMapAiResponse = z.infer<typeof conflictMapAiResponseSchema>;
