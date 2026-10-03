import { z } from "zod";

// P3.4 "아이에게 통하는 말" AI 출력 스키마.
// 13개 상황 고정 — 스키마가 정확히 13개를 강제한다(하나도 빠지거나 늘어날 수 없음).

export const TALKING_POINT_SITUATION_IDS = [
  "tp_dressing_refusal",
  "tp_meal_refusal",
  "tp_tantrum",
  "tp_bedtime_refusal",
  "tp_outing_prep_delay",
  "tp_cleanup_refusal",
  "tp_sibling_conflict",
  "tp_peer_conflict",
  "tp_media_stop_refusal",
  "tp_emotional_outburst",
  "tp_rule_defiance",
  "tp_learning_refusal",
  "tp_new_situation_hesitation",
] as const;

export const talkingPointSituationIdSchema = z.enum(TALKING_POINT_SITUATION_IDS);

export const talkingPointAiItemSchema = z.object({
  situationId: talkingPointSituationIdSchema,
  avoidPhrase: z.string().min(1).max(80),
  workingPhrase: z.string().min(1).max(80),
  whyItWorks: z.string().min(1).max(160),
  parentActionTip: z.string().min(1).max(160),
  evidenceRefs: z.array(z.string().min(1)).max(6),
  groundedInGeneric: z.boolean(),
});

// 의도적으로 "level"/"score" 류 필드가 없다 — AI가 점수를 만들 수 없도록 구조적으로 봉쇄.
export const talkingPointsAiResponseSchema = z.object({
  items: z.array(talkingPointAiItemSchema).length(13),
});

export type TalkingPointAiItem = z.infer<typeof talkingPointAiItemSchema>;
export type TalkingPointsAiResponse = z.infer<typeof talkingPointsAiResponseSchema>;
