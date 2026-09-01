import type {
  Axis,
  BehaviorEvidence,
  ConcernId,
  ConcernMicroEvidenceDomain,
  Confidence,
  QuestionDomain,
} from "@/lib/types";

/** Free 10문항 기질 관찰 evidence */
export function generalBehaviorEvidence(params: {
  domain: QuestionDomain;
  axis: Axis;
  patternId: string;
  observedLabel: string;
  questionIds: string[];
  strength?: Confidence;
}): BehaviorEvidence {
  return {
    domain: params.domain,
    patternId: params.patternId,
    observedLabel: params.observedLabel,
    strength: params.strength ?? "medium",
    source: { scope: "general", questionIds: params.questionIds },
    axis: params.axis,
  };
}

/** Concern Micro Check evidence (meal, sleep, emotion, … 동일 원칙) */
export function concernMicroEvidence(params: {
  domain: ConcernMicroEvidenceDomain;
  concernId: ConcernId;
  patternId: string;
  observedLabel: string;
  questionIds: string[];
  strength?: Confidence;
}): BehaviorEvidence {
  return {
    domain: params.domain,
    patternId: params.patternId,
    observedLabel: params.observedLabel,
    strength: params.strength ?? "medium",
    source: {
      scope: "concern_micro",
      concernId: params.concernId,
      questionIds: params.questionIds,
    },
  };
}
