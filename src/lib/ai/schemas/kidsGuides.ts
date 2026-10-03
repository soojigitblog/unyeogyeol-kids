import { z } from "zod";

// P3.5 "감정 사용설명서" + "학습 사용설명서" + "관계별 사용설명서" 결합 AI 스키마
// (Call 4). level/score/등급 필드는 여기에도 없다 — 이 3개 섹션은 애초에 결정론
// 등급이 필요 없는 설명형 콘텐츠라, groundedInGeneric 플래그로만 근거 유무를 표시한다.

export const EMOTION_SITUATION_IDS = [
  "em_angry",
  "em_upset",
  "em_anxious",
  "em_unfamiliar",
  "em_failure",
  "em_jealous",
  "em_embarrassed",
] as const;
export const emotionSituationIdSchema = z.enum(EMOTION_SITUATION_IDS);

export const emotionGuideItemSchema = z.object({
  situationId: emotionSituationIdSchema,
  signal: z.string().min(1).max(120), // 아이에게 먼저 나타나는 신호
  misreadPoint: z.string().min(1).max(160), // 부모가 오해하기 쉬운 점
  helpfulResponse: z.string().min(1).max(160),
  avoidPhrase: z.string().min(1).max(80),
  workingPhrase: z.string().min(1).max(80),
  afterCalmAction: z.string().min(1).max(160),
  evidenceRefs: z.array(z.string().min(1)).max(6),
  groundedInGeneric: z.boolean(),
});

export const LEARNING_AXIS_IDS = [
  "la_explain_vs_experience",
  "la_immersion_vs_repetition",
  "la_alone_vs_together",
  "la_competition_vs_self",
  "la_praise_goal_choice",
  "la_visual_verbal_kinesthetic",
  "la_immediate_vs_longterm",
] as const;
export const learningAxisIdSchema = z.enum(LEARNING_AXIS_IDS);

export const learningGuideItemSchema = z.object({
  axisId: learningAxisIdSchema,
  howTheyLearn: z.string().min(1).max(160),
  signOfIt: z.string().min(1).max(160),
  parentTip: z.string().min(1).max(160),
  evidenceRefs: z.array(z.string().min(1)).max(6),
  groundedInGeneric: z.boolean(),
});

export const relationshipGuideAiSchema = z.object({
  goodFitPoints: z.array(z.string().min(1).max(120)).min(2).max(4),
  frictionPoints: z.array(z.string().min(1).max(120)).min(2).max(4),
  unintendedTriggers: z.array(z.string().min(1).max(120)).min(1).max(3),
  whatChildWants: z.string().min(1).max(160),
  disciplineApproach: z.string().min(1).max(160),
  quickRepairMethod: z.string().min(1).max(160),
  evidenceRefs: z.array(z.string().min(1)).max(6),
});

export const kidsGuidesAiResponseSchema = z.object({
  emotionGuide: z.array(emotionGuideItemSchema).length(7),
  learningGuide: z.array(learningGuideItemSchema).length(7),
  relationshipGuide: relationshipGuideAiSchema,
});

export type EmotionGuideAiItem = z.infer<typeof emotionGuideItemSchema>;
export type LearningGuideAiItem = z.infer<typeof learningGuideItemSchema>;
export type RelationshipGuideAiResponse = z.infer<typeof relationshipGuideAiSchema>;
export type KidsGuidesAiResponse = z.infer<typeof kidsGuidesAiResponseSchema>;
