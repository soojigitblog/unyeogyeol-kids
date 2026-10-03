import type {
  BehaviorEvidence,
  CaregiverProfile,
  ChildProfile,
  ConflictMapItem,
  ConflictMapSection,
  CurrentConflictInput,
  FortuneFacts,
  GuidesSection,
  MomEvidence,
  TalentSeedItem,
  TalentSeedsSection,
  TalkingPointItem,
  TalkingPointsSection,
} from "@/lib/types";
import type { AgeBand } from "@/lib/age";
import { getKidsAiMode } from "@/lib/ai/kidsAiConfig";
import { buildKidsGroundingContext } from "@/lib/ai/kidsGroundingContext";
import { buildTalkingPointsPrompt } from "@/lib/ai/prompts/buildTalkingPointsPrompt";
import { buildConflictMapPrompt } from "@/lib/ai/prompts/buildConflictMapPrompt";
import { buildTalentNarrativePrompt } from "@/lib/ai/prompts/buildTalentNarrativePrompt";
import { buildGuidesPrompt } from "@/lib/ai/prompts/buildGuidesPrompt";
import { generateKidsStructured } from "@/lib/ai/generateKidsStructured";
import { withKidsValidationRetry } from "@/lib/ai/withKidsValidationRetry";
import { talkingPointsAiResponseSchema } from "@/lib/ai/schemas/kidsTalkingPoints";
import { conflictMapAiResponseSchema } from "@/lib/ai/schemas/kidsConflictMap";
import { talentNarrativeAiResponseSchema } from "@/lib/ai/schemas/kidsTalentNarrative";
import { kidsGuidesAiResponseSchema } from "@/lib/ai/schemas/kidsGuides";
import { KidsAiError } from "@/lib/ai/kidsAiErrors";
import { runLexicalGuardOnTexts } from "@/lib/interaction/safetyValidators";
import { CONFLICT_MAP_CATEGORY_LABEL } from "@/lib/interaction/conflictMapCategories";
import { scoreConflictMap } from "@/lib/interaction/conflictMapScoring";
import { scoreAllTalents, topTalents } from "@/lib/interaction/talentSeedScoring";
import { TALENT_LABEL } from "@/lib/interaction/talentSeedCategories";
import { buildFutureFields } from "@/lib/interaction/futureFieldsLookup";
import { buildGrowthContentSection } from "@/lib/interaction/growthContentAssembly";
import { resolveRelationshipSourceType } from "@/lib/interaction/relationshipGuideContent";
import {
  buildFallbackConflictMap,
  buildFallbackTalkingPoints,
} from "@/lib/interaction/fallbackTalkingPointsAndConflictMap";
import {
  buildFallbackGuides,
  buildFallbackTalentSeeds,
} from "@/lib/interaction/fallbackPhase2Content";
import { TALKING_POINT_SITUATION_IDS } from "@/lib/ai/schemas/kidsTalkingPoints";

const TALKING_POINT_SITUATION_LABEL: Record<string, string> = {
  tp_dressing_refusal: "옷 입기 싫어할 때",
  tp_meal_refusal: "밥 안 먹을 때",
  tp_tantrum: "장난감 사달라고 떼쓸 때",
  tp_bedtime_refusal: "잠자기 싫어할 때",
  tp_outing_prep_delay: "외출 준비를 미룰 때",
  tp_cleanup_refusal: "정리를 안 하려 할 때",
  tp_sibling_conflict: "동생/형제와 다툴 때",
  tp_peer_conflict: "친구와 싸웠을 때",
  tp_media_stop_refusal: "미디어를 그만 안 볼 때",
  tp_emotional_outburst: "화가 나서 물건을 던질 때",
  tp_rule_defiance: "부모 말을 무시할 때",
  tp_learning_refusal: "공부하기 싫어할 때",
  tp_new_situation_hesitation: "새로운 장소를 무서워할 때",
};

export interface GeneratePaidExtrasInput {
  child: ChildProfile;
  caregiverProfile: CaregiverProfile;
  caregiverRoleLabel: string;
  childEvidences: BehaviorEvidence[];
  momEvidences: MomEvidence[];
  conflictInput: CurrentConflictInput;
  fortune: FortuneFacts | null;
  caregiverFortune: FortuneFacts | null;
  currentAgeBand: AgeBand;
}

export interface GeneratePaidExtrasResult {
  talkingPoints: TalkingPointsSection;
  conflictMap: ConflictMapSection;
  talentSeeds: TalentSeedsSection;
  guides: GuidesSection;
  growthContent: ReturnType<typeof buildGrowthContentSection>;
}

async function generateViaAi(
  input: GeneratePaidExtrasInput,
  top5: ReturnType<typeof topTalents>
): Promise<Omit<GeneratePaidExtrasResult, "growthContent">> {
  const ctx = buildKidsGroundingContext({
    ...input,
    topTalentResults: top5,
  });

  // Call 1: 아이에게 통하는 말
  const talkingPoints = await withKidsValidationRetry(async () => {
    const { systemPrompt, userPrompt } = buildTalkingPointsPrompt(ctx);
    const parsed = await generateKidsStructured({
      systemPrompt,
      userPrompt,
      schema: talkingPointsAiResponseSchema,
      schemaName: "kids_talking_points",
    });
    const texts = parsed.items.flatMap((i) => [i.avoidPhrase, i.workingPhrase, i.whyItWorks, i.parentActionTip]);
    const violations = runLexicalGuardOnTexts(texts);
    if (violations.length > 0) {
      throw new KidsAiError("SAFETY_VALIDATION_FAILED", `banned terms: ${violations.map((v) => v.reason).join("; ")}`, {
        retryable: true,
      });
    }
    const items: TalkingPointItem[] = parsed.items.map((i) => ({
      situationId: i.situationId,
      situationLabel: TALKING_POINT_SITUATION_LABEL[i.situationId],
      avoidPhrase: i.avoidPhrase,
      workingPhrase: i.workingPhrase,
      whyItWorks: i.whyItWorks,
      parentActionTip: i.parentActionTip,
      evidenceRefs: i.evidenceRefs,
      groundedInGeneric: i.groundedInGeneric,
    }));
    return { items, generationSource: "ai" as const };
  });

  // Call 2: 충돌지도
  const levels = scoreConflictMap({
    childEvidences: input.childEvidences,
    momEvidences: input.momEvidences,
    conflictInput: input.conflictInput,
  });

  const conflictMap = await withKidsValidationRetry(async () => {
    const { systemPrompt, userPrompt } = buildConflictMapPrompt(ctx);
    const parsed = await generateKidsStructured({
      systemPrompt,
      userPrompt,
      schema: conflictMapAiResponseSchema,
      schemaName: "kids_conflict_map",
    });
    const texts = parsed.explanations.flatMap((e) => [
      e.whyItHappens,
      e.avoidExample,
      e.workingExample,
      e.oneThingToChange,
    ]);
    const violations = runLexicalGuardOnTexts(texts);
    if (violations.length > 0) {
      throw new KidsAiError("SAFETY_VALIDATION_FAILED", `banned terms: ${violations.map((v) => v.reason).join("; ")}`, {
        retryable: true,
      });
    }
    const items: ConflictMapItem[] = parsed.explanations.map((e) => ({
      categoryId: e.categoryId,
      categoryLabel: CONFLICT_MAP_CATEGORY_LABEL[e.categoryId],
      level: levels[e.categoryId].level,
      whyItHappens: e.whyItHappens,
      avoidExample: e.avoidExample,
      workingExample: e.workingExample,
      oneThingToChange: e.oneThingToChange,
      evidenceRefs: e.evidenceRefs,
      groundedInGeneric: e.groundedInGeneric,
    }));
    return { items, generationSource: "ai" as const };
  });

  // Call 3: 재능 씨앗 설명 (TOP5)
  const talentSeeds = await withKidsValidationRetry(async () => {
    const { systemPrompt, userPrompt } = buildTalentNarrativePrompt(ctx);
    const parsed = await generateKidsStructured({
      systemPrompt,
      userPrompt,
      schema: talentNarrativeAiResponseSchema,
      schemaName: "kids_talent_narrative",
    });
    const texts = parsed.items.flatMap((i) =>
      [i.strengthLine, i.fortuneReasonLine, i.realLifeLine, i.observationNote].filter(
        (v): v is string => Boolean(v)
      )
    );
    const violations = runLexicalGuardOnTexts(texts);
    if (violations.length > 0) {
      throw new KidsAiError("SAFETY_VALIDATION_FAILED", `banned terms: ${violations.map((v) => v.reason).join("; ")}`, {
        retryable: true,
      });
    }
    const byId = new Map(parsed.items.map((i) => [i.talentId, i]));
    const items: TalentSeedItem[] = top5.map((t) => {
      const ai = byId.get(t.talentId);
      return {
        talentId: t.talentId,
        label: TALENT_LABEL[t.talentId],
        strengthLevel: t.strengthLevel,
        sourceType: t.sourceType,
        strengthLine: ai?.strengthLine ?? `${TALENT_LABEL[t.talentId]} 쪽에서 강점을 보일 수 있어요.`,
        fortuneReasonLine: ai?.fortuneReasonLine ?? null,
        realLifeLine: ai?.realLifeLine ?? "실제 생활에서 이 힘이 드러날 수 있어요.",
        observationNote:
          ai?.observationNote ??
          (t.observationContribution > 0
            ? "실제 관찰에서도 관련된 모습이 나타났어요."
            : "아직 실제 생활 관찰 데이터는 충분하지 않아요."),
        evidenceRefs: t.evidenceRefs,
      };
    });
    return {
      items,
      futureFields: buildFutureFields(top5),
      generationSource: "ai" as const,
    };
  });

  // Call 4: 감정 + 학습 + 관계별 사용설명서
  const guides = await withKidsValidationRetry(async () => {
    const { systemPrompt, userPrompt } = buildGuidesPrompt(ctx);
    const parsed = await generateKidsStructured({
      systemPrompt,
      userPrompt,
      schema: kidsGuidesAiResponseSchema,
      schemaName: "kids_guides",
    });
    const texts = [
      ...parsed.emotionGuide.flatMap((e) => [e.signal, e.misreadPoint, e.helpfulResponse, e.avoidPhrase, e.workingPhrase, e.afterCalmAction]),
      ...parsed.learningGuide.flatMap((l) => [l.howTheyLearn, l.signOfIt, l.parentTip]),
      ...parsed.relationshipGuide.goodFitPoints,
      ...parsed.relationshipGuide.frictionPoints,
      ...parsed.relationshipGuide.unintendedTriggers,
      parsed.relationshipGuide.whatChildWants,
      parsed.relationshipGuide.disciplineApproach,
      parsed.relationshipGuide.quickRepairMethod,
    ];
    const violations = runLexicalGuardOnTexts(texts);
    if (violations.length > 0) {
      throw new KidsAiError("SAFETY_VALIDATION_FAILED", `banned terms: ${violations.map((v) => v.reason).join("; ")}`, {
        retryable: true,
      });
    }

    const emotionGuide = parsed.emotionGuide.map((e) => ({
      situationId: e.situationId,
      situationLabel: ctx.emotionSituations.find((s) => s.situationId === e.situationId)?.situationLabel ?? e.situationId,
      signal: e.signal,
      misreadPoint: e.misreadPoint,
      helpfulResponse: e.helpfulResponse,
      avoidPhrase: e.avoidPhrase,
      workingPhrase: e.workingPhrase,
      afterCalmAction: e.afterCalmAction,
      evidenceRefs: e.evidenceRefs,
      groundedInGeneric: e.groundedInGeneric,
    }));
    const learningGuide = parsed.learningGuide.map((l) => ({
      axisId: l.axisId,
      axisLabel: ctx.learningAxes.find((a) => a.axisId === l.axisId)?.axisLabel ?? l.axisId,
      howTheyLearn: l.howTheyLearn,
      signOfIt: l.signOfIt,
      parentTip: l.parentTip,
      evidenceRefs: l.evidenceRefs,
      groundedInGeneric: l.groundedInGeneric,
    }));
    const sourceType = resolveRelationshipSourceType({
      hasChildFortune: Boolean(input.fortune),
      hasCaregiverFortune: Boolean(input.caregiverFortune),
      momEvidences: input.momEvidences,
    });

    return {
      emotionGuide,
      learningGuide,
      relationshipGuide: {
        primary: {
          caregiverRoleLabel: input.caregiverRoleLabel,
          goodFitPoints: parsed.relationshipGuide.goodFitPoints,
          frictionPoints: parsed.relationshipGuide.frictionPoints,
          unintendedTriggers: parsed.relationshipGuide.unintendedTriggers,
          whatChildWants: parsed.relationshipGuide.whatChildWants,
          disciplineApproach: parsed.relationshipGuide.disciplineApproach,
          quickRepairMethod: parsed.relationshipGuide.quickRepairMethod,
          evidenceRefs: parsed.relationshipGuide.evidenceRefs,
          sourceType,
        },
        otherCaregiverCta: {
          ctaText: "다른 보호자 정보를 추가하면 그분에게 맞는 육아법도 확인할 수 있어요.",
        },
      },
      generationSource: "ai" as const,
    };
  });

  return { talkingPoints, conflictMap, talentSeeds, guides };
}

/**
 * 결제 확인 시 1회 호출된다(prepareSignatureReport의 무료 단계에서는 절대 호출하지 않음).
 * 결정론 파트(재능 점수, growthContent)는 AI 성패와 무관하게 항상 계산한다.
 * AI 4개 호출(통하는말/충돌지도/재능설명/가이드)은 하나의 바깥 try/catch로 묶어서
 * 실패 시 전부 fallback으로 대체한다(부분 성공을 저장하지 않음 — 단순함 우선).
 * 절대 throw하지 않는다 — 결제 확인 자체가 AI 문제로 막히면 안 되기 때문이다.
 */
export async function generatePaidExtras(
  input: GeneratePaidExtrasInput
): Promise<GeneratePaidExtrasResult> {
  const talentScores = scoreAllTalents({
    dayMasterElement: input.fortune?.dayMasterElement ?? null,
    childEvidences: input.childEvidences,
  });
  const top5 = topTalents(talentScores);
  const growthContent = buildGrowthContentSection(top5, input.currentAgeBand);

  if (getKidsAiMode() === "mock") {
    return {
      talkingPoints: buildFallbackTalkingPoints(input.childEvidences),
      conflictMap: buildFallbackConflictMap(input),
      talentSeeds: buildFallbackTalentSeeds(top5),
      guides: buildFallbackGuides({
        childEvidences: input.childEvidences,
        momEvidences: input.momEvidences,
        caregiverRoleLabel: input.caregiverRoleLabel,
        hasChildFortune: Boolean(input.fortune),
        hasCaregiverFortune: Boolean(input.caregiverFortune),
      }),
      growthContent,
    };
  }

  try {
    const aiResult = await generateViaAi(input, top5);
    return { ...aiResult, growthContent };
  } catch (error) {
    console.error("[generatePaidExtras] AI generation failed, using fallback", {
      code: error instanceof KidsAiError ? error.code : "UNKNOWN",
    });
    return {
      talkingPoints: buildFallbackTalkingPoints(input.childEvidences),
      conflictMap: buildFallbackConflictMap(input),
      talentSeeds: buildFallbackTalentSeeds(top5),
      guides: buildFallbackGuides({
        childEvidences: input.childEvidences,
        momEvidences: input.momEvidences,
        caregiverRoleLabel: input.caregiverRoleLabel,
        hasChildFortune: Boolean(input.fortune),
        hasCaregiverFortune: Boolean(input.caregiverFortune),
      }),
      growthContent,
    };
  }
}

export { TALKING_POINT_SITUATION_IDS };
