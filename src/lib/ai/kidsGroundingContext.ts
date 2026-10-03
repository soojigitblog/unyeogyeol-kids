import type {
  BehaviorEvidence,
  CaregiverProfile,
  ChildProfile,
  ConflictLevel,
  ConflictMapCategoryId,
  CurrentConflictInput,
  FortuneFacts,
  MomEvidence,
  SourceType,
} from "@/lib/types";
import { computeAge } from "@/lib/age";
import { ELEMENT_KEYWORD } from "@/lib/interaction/signatureReportGenerator";
import { CONFLICT_MAP_CATEGORY_LABEL } from "@/lib/interaction/conflictMapCategories";
import { scoreConflictMap } from "@/lib/interaction/conflictMapScoring";
import { TALKING_POINT_SITUATION_IDS } from "@/lib/ai/schemas/kidsTalkingPoints";
import { CONFLICT_MAP_CATEGORY_IDS } from "@/lib/ai/schemas/kidsConflictMap";
import { TALENT_LABEL, type TalentId } from "@/lib/interaction/talentSeedCategories";
import type { TalentScoreResult } from "@/lib/interaction/talentSeedScoring";
import {
  EMOTION_SITUATION_HAS_EVIDENCE,
  EMOTION_SITUATION_LABEL,
  LEARNING_AXIS_HAS_EVIDENCE,
  LEARNING_AXIS_LABEL,
} from "@/lib/interaction/guidesCategories";
import { EMOTION_SITUATION_IDS, LEARNING_AXIS_IDS } from "@/lib/ai/schemas/kidsGuides";
import { resolveRelationshipSourceType } from "@/lib/interaction/relationshipGuideContent";

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

export interface KidsGroundingContext {
  childName: string;
  childAgeDisplay: string;
  caregiverRoleLabel: string;
  concernId: string;
  concernScene: {
    childFirstReaction?: string;
    caregiverFirstReaction?: string;
    subsequentEscalation?: string;
    recentFrequency?: string;
  };
  childElementKeyword: string | null;
  childEvidenceLabels: string[];
  momEvidenceLabels: string[];
  situations: { situationId: string; situationLabel: string }[];
  conflictCategories: {
    categoryId: ConflictMapCategoryId;
    categoryLabel: string;
    level: ConflictLevel;
    hasSpecificEvidence: boolean;
  }[];
  // P3.5 추가분
  topTalents: {
    talentId: TalentId;
    label: string;
    sourceType: SourceType;
    hasObservationEvidence: boolean;
    hasFortuneSignal: boolean;
  }[];
  emotionSituations: { situationId: string; situationLabel: string; hasEvidence: boolean }[];
  learningAxes: { axisId: string; axisLabel: string; hasEvidence: boolean }[];
  relationshipContext: {
    caregiverRoleLabel: string;
    caregiverElementKeyword: string | null;
    sourceType: SourceType;
  };
}

export function buildKidsGroundingContext(input: {
  child: ChildProfile;
  caregiverProfile: CaregiverProfile;
  childEvidences: BehaviorEvidence[];
  momEvidences: MomEvidence[];
  conflictInput: CurrentConflictInput;
  caregiverRoleLabel: string;
  fortune: FortuneFacts | null;
  caregiverFortune?: FortuneFacts | null;
  topTalentResults?: TalentScoreResult[];
}): KidsGroundingContext {
  const ageInfo = computeAge(input.child.birthDate);
  const levels = scoreConflictMap({
    childEvidences: input.childEvidences,
    momEvidences: input.momEvidences,
    conflictInput: input.conflictInput,
  });

  return {
    childName: input.child.name || "아이",
    childAgeDisplay: ageInfo?.ageDisplay || "만 3세",
    caregiverRoleLabel: input.caregiverRoleLabel,
    concernId: input.conflictInput.concernId,
    concernScene: {
      childFirstReaction: input.conflictInput.childFirstReaction,
      caregiverFirstReaction: input.conflictInput.momFirstReaction,
      subsequentEscalation: input.conflictInput.subsequentEscalation,
      recentFrequency: input.conflictInput.recentFrequency,
    },
    childElementKeyword: input.fortune ? ELEMENT_KEYWORD[input.fortune.dayMasterElement] : null,
    childEvidenceLabels: input.childEvidences.map((e) => e.observedLabel),
    momEvidenceLabels: input.momEvidences.map((e) => e.observedLabel),
    situations: TALKING_POINT_SITUATION_IDS.map((id) => ({
      situationId: id,
      situationLabel: TALKING_POINT_SITUATION_LABEL[id],
    })),
    conflictCategories: CONFLICT_MAP_CATEGORY_IDS.map((id) => ({
      categoryId: id,
      categoryLabel: CONFLICT_MAP_CATEGORY_LABEL[id],
      level: levels[id].level,
      hasSpecificEvidence: !levels[id].groundedInGeneric,
    })),
    topTalents: (input.topTalentResults ?? []).map((t) => ({
      talentId: t.talentId,
      label: TALENT_LABEL[t.talentId],
      sourceType: t.sourceType,
      hasObservationEvidence: t.observationContribution > 0,
      hasFortuneSignal: t.fortuneContribution > 0,
    })),
    emotionSituations: EMOTION_SITUATION_IDS.map((id) => ({
      situationId: id,
      situationLabel: EMOTION_SITUATION_LABEL[id],
      hasEvidence: EMOTION_SITUATION_HAS_EVIDENCE[id] ?? false,
    })),
    learningAxes: LEARNING_AXIS_IDS.map((id) => ({
      axisId: id,
      axisLabel: LEARNING_AXIS_LABEL[id],
      hasEvidence: LEARNING_AXIS_HAS_EVIDENCE[id] ?? false,
    })),
    relationshipContext: {
      caregiverRoleLabel: input.caregiverRoleLabel,
      caregiverElementKeyword: input.caregiverFortune
        ? ELEMENT_KEYWORD[input.caregiverFortune.dayMasterElement]
        : null,
      sourceType: resolveRelationshipSourceType({
        hasChildFortune: Boolean(input.fortune),
        hasCaregiverFortune: Boolean(input.caregiverFortune),
        momEvidences: input.momEvidences,
      }),
    },
  };
}
