// interaction-engine 모듈: ChildEvidence + MomEvidence + Concern -> InteractionRule 매칭
//
// 원칙:
// 1. Evidence coverage 부족 시 강한 interaction claim 생성 금지.
// 2. 정확한 매칭이 없으면 generic conflict 를 지어내지 않고 fallback (INSUFFICIENT_INTERACTION_EVIDENCE).
// 3. Provenance evidenceRefs 자동 수집.

import type {
  BehaviorEvidence,
  ConcernId,
  InteractionConfidence,
  InteractionRule,
  MomEvidence,
} from "@/lib/types";
import { childEvidenceRef, momEvidenceRef } from "@/lib/evidence/ref";
import { INTERACTION_RULES } from "./interactionRules";

export interface MatchResult {
  rule: InteractionRule;
  evidenceRefs: string[];
  matchConfidence: InteractionConfidence;
  isFallback: boolean;
}

export const INSUFFICIENT_INTERACTION_EVIDENCE_RULE: InteractionRule = {
  ruleId: "INSUFFICIENT_INTERACTION_EVIDENCE",
  title: "현재 관찰된 행동과 {{CG의}} 반응 흐름",
  requiredChildPatterns: [],
  requiredMomPatterns: [],
  applicableConcerns: ["all"],
  confidence: "low",
  interactionType: "neutral",
  childPerspectiveSummary:
    "아이는 자신만의 방식과 속도로 상황을 마주하며 적응해 나가고 있어요.",
  momPerspectiveSummary:
    "{{CG는}} 아이의 반응을 살피며 상황에 맞는 최선의 방식을 찾아가는 과정이에요.",
  synthesisSummary:
    "아이의 고유한 반응 방식과 {{CG의}} 대처 방식이 일상에서 어떻게 맞물리는지 차분히 관찰해볼 수 있어요.",
  whereToBreakSummary: {
    targetStep: 1,
    breakActionTitle: "현재 상황을 한 걸음 물러서서 관찰하기",
    breakActionDetail:
      "어떤 순간에 특히 서로의 호흡이 어긋나는지 특정 상황을 중심으로 가볍게 살펴보세요.",
  },
  samplePhrases: [], // P2.0H.2 LOCK: 근거 없는 generic phrase fallback 엄격 금지 (OMIT)
  sampleActions: [
    {
      actionTitle: "반응 관찰 기록해보기",
      actionDetail: "아이가 편안해하는 순간과 버거워하는 순간을 며칠간 눈여겨보세요.",
    },
  ],
  anchorPromise: "아이와 {{CG가}} 서로의 속도를 이해해가는 따뜻한 여정을 시작해보세요.",
};

export function matchInteractionRule(
  childEvidences: BehaviorEvidence[],
  momEvidences: MomEvidence[],
  concernId?: ConcernId
): MatchResult {
  // P2.0R Signature Interaction Requirement:
  // Child Evidence 최소 1개 AND (Mom Evidence 또는 ConcernId) 최소 1개 필수
  if (!childEvidences || childEvidences.length === 0 || (!momEvidences || momEvidences.length === 0)) {
    return {
      rule: INSUFFICIENT_INTERACTION_EVIDENCE_RULE,
      evidenceRefs: [],
      matchConfidence: "low",
      isFallback: true,
    };
  }

  const childPatterns = new Set(childEvidences.map((e) => e.patternId));
  const momPatterns = new Set(momEvidences.map((e) => e.patternId));

  const evidenceRefs: string[] = [
    ...childEvidences.map(childEvidenceRef),
    ...momEvidences.map(momEvidenceRef),
  ];
  if (concernId) {
    evidenceRefs.push(`concern:${concernId}`);
  }

  // 1. Exact Concern Match 탐색 (Concern 지정 규칙 최우선)
  if (concernId) {
    for (const rule of INTERACTION_RULES) {
      if (rule.applicableConcerns.includes(concernId) && !rule.applicableConcerns.includes("all")) {
        const childMatch = rule.requiredChildPatterns.length === 0 || rule.requiredChildPatterns.some((p) => childPatterns.has(p));
        const momMatch = rule.requiredMomPatterns.length === 0 || rule.requiredMomPatterns.some((p) => momPatterns.has(p));
        if (childMatch && momMatch) {
          return {
            rule,
            evidenceRefs,
            matchConfidence: rule.confidence,
            isFallback: false,
          };
        }
      }
    }
  }

  // 2. General Exact Match 탐색
  for (const rule of INTERACTION_RULES) {
    const childMatch = rule.requiredChildPatterns.some((p) => childPatterns.has(p));
    const momMatch = rule.requiredMomPatterns.some((p) => momPatterns.has(p));
    const concernMatch =
      rule.applicableConcerns.includes("all") ||
      (concernId && rule.applicableConcerns.includes(concernId));

    if (childMatch && momMatch && concernMatch) {
      return {
        rule,
        evidenceRefs,
        matchConfidence: rule.confidence,
        isFallback: false,
      };
    }
  }

  // 2. Partial Match — concernId 가 있으면 해당 concern 과 호환되는 규칙만 허용 (P2.2V.7)
  for (const rule of INTERACTION_RULES) {
    const childMatch = rule.requiredChildPatterns.some((p) => childPatterns.has(p));
    const momMatch = rule.requiredMomPatterns.some((p) => momPatterns.has(p));
    const concernOk =
      !concernId ||
      rule.applicableConcerns.includes("all") ||
      rule.applicableConcerns.includes(concernId);

    if (childMatch && momMatch && concernOk) {
      return {
        rule,
        evidenceRefs,
        matchConfidence:
          concernId && !rule.applicableConcerns.includes(concernId) ? "medium" : rule.confidence,
        isFallback: false,
      };
    }
  }

  // 3. Fallback: 갈등 창작 금지 정책 -> INSUFFICIENT_INTERACTION_EVIDENCE
  return {
    rule: INSUFFICIENT_INTERACTION_EVIDENCE_RULE,
    evidenceRefs,
    matchConfidence: "low",
    isFallback: true,
  };
}
