// evidence-claim-engine 모듈: P2.0H.2 근거 기반 Claim 생성 및 강도/모순/불충분 판정 엔진
//
// 핵심 원칙:
// 1. Evidence Priority: Child Observation > Current Conflict > Mom Reaction > Single Child Obs > Fortune Facts.
// 2. Fortune cannot increase confidence (사주로 LOW -> MEDIUM/STRONG 승격 절대 금지, boost count = 0).
// 3. Multi-Evidence Rule: Strong claim 은 일관된 3개+ 관찰 및 갈등 일치, Medium 은 2개 일치, 1개는 Low. (2개 관찰+갈등은 MEDIUM)
// 4. Claim Layers: OBSERVED (사실), INFERRED (2개 이상 관찰 종합 해석), REFLECTIVE (사주 보조 힌트).
// 5. Contradiction Handling: 상황/맥락 차이로 통합 (Context-dependent trait).
// 6. Insufficient Evidence: 근거 없거나 1개 미만 시 INSUFFICIENT_EVIDENCE 허용, 억지 창작 금지.
// 7. Provenance: 모든 claim 에 evidenceRefs 필수 (FortuneFacts 단독 양육조언 금지).
// 8. Recommendation Traceability: 모든 육아 추천에 recommendationReason 및 evidenceRefs 명시.
// 9. Reflective Fortune: ALIGNED (구체적 매핑 힌트) / CONFLICTING (관찰 최우선 명시) / NEUTRAL (구체적 overlap 없을 시 OMIT). 영문 코드 노출 금지.
// 10. Low-Evidence Policy: "개입 불필요/정상/문제없음" 평가 표현 금지 -> 관찰 지속 지지형으로 서술.

import type {
  Axis,
  BehaviorEvidence,
  CurrentConflictInput,
  FortuneFacts,
  MomEvidence,
  QuestionDomain,
} from "@/lib/types";

export type ClaimLayer = "OBSERVED" | "INFERRED" | "REFLECTIVE";
export type EvidenceStrength = "LOW" | "MEDIUM" | "STRONG";
export type FortuneReflectionStatus = "ALIGNED" | "NEUTRAL" | "CONFLICTING";

export interface EvidenceClaim {
  claimId: string;
  claimText?: string; // claim 의 alias / 호환성
  layer: ClaimLayer;
  domain?: QuestionDomain;
  axis?: Axis;
  claim: string;
  evidenceStrength: EvidenceStrength;
  evidenceRefs: string[];
  contextTags?: string[]; // 집(home) / 밖(outside) / 집단(group) / 일반 등
  fortuneRefs: string[];
  recommendationReason?: string;
  isContradictionResolved?: boolean;
  fortuneStatus?: FortuneReflectionStatus;
}

export interface RecommendationClaim {
  recommendationId: string;
  title: string;
  detail: string;
  recommendationReason: string;
  evidenceRefs: string[];
}

export interface EvidenceCoverageReport {
  totalClaims: number;
  observedClaims: number;
  inferredClaims: number;
  reflectiveClaims: number;
  unsupportedClaims: number;
  strongClaims: number;
  mediumClaims: number;
  lowClaims: number;
  fortuneOnlyClaims: number;
  fortuneConfidenceBoostCount: number;
  contradictionResolvedCount: number;
  insufficientEvidenceCount: number;
  fortuneStatus?: FortuneReflectionStatus;
}

export interface EvidenceEngineOutput {
  claims: EvidenceClaim[];
  recommendations: RecommendationClaim[];
  coverageReport: EvidenceCoverageReport;
  summaryOneSentence: string;
}

// ── 한국어 조사 보조 함수 ──────────────────────────────────────
function hasBatchim(str: string): boolean {
  if (!str) return false;
  const lastChar = str.charCodeAt(str.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return false;
  return (lastChar - 0xac00) % 28 > 0;
}

export function withJosa(str: string, withB: string, withoutB: string): string {
  return `${str}${hasBatchim(str) ? withB : withoutB}`;
}

// ── 자연스러운 문맥 명사구 표준화 ─────────────────────────────
export function normalizeToPhrase(text: string): string {
  let s = text.trim();
  s = s.replace(/\.+$/, ""); // 마침표 제거
  s = s.replace(/편이에요$/, "편");
  s = s.replace(/편입니다$/, "편");
  s = s.replace(/선호해요$/, "선호하는 모습");
  s = s.replace(/선호합니다$/, "선호하는 모습");
  s = s.replace(/어울려요$/, "어울리는 모습");
  s = s.replace(/어울립니다$/, "어울리는 모습");
  s = s.replace(/반응해요$/, "반응하는 모습");
  s = s.replace(/반응합니다$/, "반응하는 모습");
  s = s.replace(/머물러요$/, "머무는 모습");
  s = s.replace(/머뭅니다$/, "머무는 모습");
  s = s.replace(/조율해요$/, "조율하는 모습");
  s = s.replace(/조율합니다$/, "조율하는 모습");
  s = s.replace(/전환해요$/, "전환하는 모습");
  s = s.replace(/전환합니다$/, "전환하는 모습");
  s = s.replace(/살펴봐요$/, "살피는 모습");
  s = s.replace(/살펴봅니다$/, "살피는 모습");
  s = s.replace(/살피는 편이에요$/, "살피는 모습");
  s = s.replace(/신어요$/, "신는 모습");
  s = s.replace(/와요$/, "오는 모습");
  s = s.replace(/보입니다$/, "모습");
  s = s.replace(/보여요$/, "모습");
  s = s.replace(/해요$/, "하는 모습");
  s = s.replace(/합니다$/, "하는 모습");
  s = s.replace(/다$/, "는 모습");
  return s;
}

export function buildEvidenceClaims(
  childEvidences: BehaviorEvidence[],
  momEvidences: MomEvidence[],
  conflictInput?: CurrentConflictInput,
  fortuneFacts?: FortuneFacts | null
): EvidenceEngineOutput {
  const claims: EvidenceClaim[] = [];
  const recommendations: RecommendationClaim[] = [];
  let boostCount = 0;
  let contradictionCount = 0;
  let insufficientCount = 0;

  // ── 1. OBSERVED Layer Claims (각 관찰 응답의 직접적 사실) ────
  childEvidences.forEach((ev, idx) => {
    const phrase = normalizeToPhrase(ev.observedLabel);
    const text = `최근 일상 장면에서 ${withJosa(phrase, "이", "가")} 관찰되었어요.`;
    claims.push({
      claimId: `obs_child_${ev.domain}_${idx}`,
      claimText: text,
      layer: "OBSERVED",
      domain: ev.domain,
      axis: ev.axis,
      claim: text,
      evidenceStrength: "LOW", // 단일 관찰은 LOW
      evidenceRefs: [`child:${ev.domain}_${ev.observedPattern}`],
      contextTags: ["child_observation"],
      fortuneRefs: [],
    });
  });

  momEvidences.forEach((ev, idx) => {
    const phrase = normalizeToPhrase(ev.observedLabel);
    const text = `시간이나 갈등 상황에서 나의 반응: ${phrase}`;
    claims.push({
      claimId: `obs_mom_${ev.domain}_${idx}`,
      claimText: text,
      layer: "OBSERVED",
      domain: undefined,
      axis: undefined,
      claim: text,
      evidenceStrength: "LOW",
      evidenceRefs: [`mom:${ev.domain}_${ev.patternId}`],
      contextTags: ["mom_reaction"],
      fortuneRefs: [],
    });
  });

  // ── 2. Axis 단위 그룹화 및 Multi-Evidence / Contradiction 판정 ──
  const axisGroup: Record<string, BehaviorEvidence[]> = {};
  childEvidences.forEach((ev) => {
    if (!axisGroup[ev.axis]) axisGroup[ev.axis] = [];
    axisGroup[ev.axis].push(ev);
  });

  // ── 3. INFERRED Layer Claims (2개 이상 관찰 종합 or 갈등 연결) ────
  Object.entries(axisGroup).forEach(([axisKey, evList]) => {
    const axis = axisKey as Axis;
    const patterns = Array.from(new Set(evList.map((e) => e.observedPattern)));
    const refs = evList.map((e) => `child:${e.domain}_${e.observedPattern}`);

    if (evList.length >= 2) {
      if (patterns.length === 1) {
        // 일관된 패턴 다중 관찰 -> MEDIUM or STRONG
        const isConflictMatched =
          conflictInput &&
          ((conflictInput.concernId === "discipline" && axis === "transition_preference") ||
            (conflictInput.concernId === "stubborn" && axis === "strong_self_direction") ||
            (conflictInput.concernId === "shyness" && axis === "needs_observation_time"));

        if (isConflictMatched) {
          refs.push(`conflict:${conflictInput.concernId}`);
        }

        // STRONG 기준: Observation 3개 이상 AND 갈등 일치 1개 이상
        // (Observation 2개 + 갈등 1개는 MEDIUM으로 엄격 제한)
        const hasAtLeast3Obs = evList.length >= 3;
        const strength: EvidenceStrength =
          hasAtLeast3Obs && isConflictMatched ? "STRONG" : "MEDIUM";

        const phrase = normalizeToPhrase(evList[0].observedLabel);
        const text =
          strength === "STRONG"
            ? `직접 알려주신 여러 상황을 종합해 보면, ${withJosa(phrase, "이", "가")} 꽤 일관되게 나타나요.`
            : `여러 장면에서 ${withJosa(phrase, "이", "가")} 반복해서 관찰돼요.`;

        claims.push({
          claimId: `inf_consistent_${axis}`,
          claimText: text,
          layer: "INFERRED",
          domain: evList[0].domain,
          axis,
          claim: text,
          evidenceStrength: strength,
          evidenceRefs: refs,
          contextTags: ["cross_situational_consistent"],
          fortuneRefs: [],
        });
      } else {
        // 모순/상황별 차이 발견 (Contradiction Handling)
        contradictionCount++;
        const phrase1 = normalizeToPhrase(evList[0].observedLabel);
        const phrase2 = normalizeToPhrase(evList[1]?.observedLabel || "다른 행동");
        const text = `상황에 따라 차이를 보여요. 평소에는 ${withJosa(phrase1, "을", "를")} 보이지만, 특정 상황에서는 ${withJosa(phrase2, "을", "를")} 나타내기도 해요.`;
        claims.push({
          claimId: `inf_context_${axis}`,
          claimText: text,
          layer: "INFERRED",
          domain: evList[0].domain,
          axis,
          claim: text,
          evidenceStrength: "MEDIUM",
          evidenceRefs: refs,
          contextTags: ["context_dependent_trait"],
          fortuneRefs: [],
          isContradictionResolved: true,
        });
      }
    } else if (evList.length === 1) {
      // 1개뿐인 영역: 단정 금지 (LOW)
      const phrase = normalizeToPhrase(evList[0].observedLabel);
      const text = `이 상황에서는 ${withJosa(phrase, "이", "가")} 관찰돼요.`;
      claims.push({
        claimId: `inf_single_${axis}`,
        claimText: text,
        layer: "INFERRED",
        domain: evList[0].domain,
        axis,
        claim: text,
        evidenceStrength: "LOW",
        evidenceRefs: refs,
        contextTags: ["single_situation"],
        fortuneRefs: [],
      });
    }
  });

  // 3-2. Insufficient Evidence 체크
  const allPossibleAxes: Axis[] = [
    "needs_observation_time",
    "recovery_pace",
    "strong_self_direction",
    "transition_preference",
    "social_warmup_style",
    "play_focus_style",
    "motivation_source",
    "rule_negotiation_style",
    "emotional_expression_intensity",
    "instruction_response_style",
  ];
  allPossibleAxes.forEach((ax) => {
    if (!axisGroup[ax] || axisGroup[ax].length === 0) {
      insufficientCount++;
      const text = "아직 한두 장면만으로는 뚜렷한 패턴을 단정하기 어려워요.";
      claims.push({
        claimId: `inf_insufficient_${ax}`,
        claimText: text,
        layer: "INFERRED",
        axis: ax,
        claim: text,
        evidenceStrength: "LOW",
        evidenceRefs: [],
        contextTags: ["insufficient_evidence"],
        fortuneRefs: [],
      });
    }
  });

  // ── 4. REFLECTIVE Layer Claims (출생정보 보조 힌트) ─────────
  // 절대 규칙:
  // 1. FortuneFacts 는 Observation Evidence 를 덮어쓰거나 승격시키지 않음 (boostCount = 0).
  // 2. 영문 element 코드 (wood, fire 등) 고객 문구 노출 절대 금지.
  // 3. 3상태 분리: ALIGNED (구체적 매핑 힌트) / CONFLICTING (관찰 우선 명시) / NEUTRAL (구체적 overlap 없을 시 OMIT).
  // 4. Fortune 은 절대 observation 을 '증명/검증'하지 않음.
  let fortuneStatus: FortuneReflectionStatus = "NEUTRAL";

  if (fortuneFacts) {
    const el = fortuneFacts.dayMasterElement;
    
    // 관찰된 주요 성향 분석
    const allPatterns = childEvidences.map((e) => e.observedPattern);
    const isCautiousObs = allPatterns.some((p) =>
      p.includes("observe") || p.includes("reassurance") || p.includes("scan")
    );
    const isFlexibleObs = allPatterns.some((p) =>
      p.includes("flexible") || p.includes("switches_readily")
    );
    const isStructuredObs = allPatterns.some((p) =>
      p.includes("completion") || p.includes("own_way") || p.includes("reason")
    );
    const isPraiseObs = allPatterns.some((p) => p.includes("praise"));
    const isSelfDirObs = allPatterns.some((p) => p.includes("independent") || p.includes("asserts"));

    // 충돌/일치 판정
    if ((el === "fire" || el === "wood") && isCautiousObs && !isSelfDirObs && !isPraiseObs) {
      fortuneStatus = "CONFLICTING"; // 사주는 외향/불이나 관찰은 신중/탐색 (Fixture E)
    } else if (el === "metal" && isFlexibleObs && !isStructuredObs) {
      fortuneStatus = "CONFLICTING"; // 사주는 금(원칙/규칙)이나 관찰은 초유연 (Fixture H)
    } else if (
      ((el === "wood" || el === "fire") && isSelfDirObs) ||
      (el === "fire" && isPraiseObs) ||
      (el === "metal" && isStructuredObs) ||
      ((el === "water" || el === "earth") && isCautiousObs)
    ) {
      fortuneStatus = "ALIGNED";
    } else {
      fortuneStatus = "NEUTRAL";
    }

    let text: string | null = null;
    if (fortuneStatus === "ALIGNED") {
      if ((el === "wood" || el === "fire") && isSelfDirObs) {
        text = "출생정보에서는 자기 방식으로 움직이려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.";
      } else if (el === "fire" && isPraiseObs) {
        text = "출생정보에서는 에너지를 활발하게 드러내려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.";
      } else if (el === "metal" && isStructuredObs) {
        text = "출생정보에서는 자기 기준이나 마침표를 챙기려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.";
      } else if ((el === "water" || el === "earth") && isCautiousObs) {
        text = "출생정보에서는 상황을 천천히 살피려는 쪽의 힌트가 있었어요. 실제 결과는 직접 알려주신 행동을 중심으로 정리했어요.";
      } else {
        fortuneStatus = "NEUTRAL";
      }
    } else if (fortuneStatus === "CONFLICTING") {
      text = "출생정보에서 보는 힌트와 현재 관찰된 모습이 다른 부분도 있었어요. 이번 결과는 실제 행동을 우선했어요.";
    }

    // P2.0H.2 LOCK: 구체적인 overlap 이 없는 NEUTRAL 상태는 OMIT
    if (text) {
      claims.push({
        claimId: `ref_fortune_daymaster_${el}`,
        claimText: text,
        layer: "REFLECTIVE",
        claim: text,
        evidenceStrength: "LOW", // 사주는 항상 LOW supporting
        evidenceRefs: [],
        contextTags: ["fortune_reflection"],
        fortuneRefs: [`fortune:dayMaster_${el}`, `fortune:dayPillar_${fortuneFacts.day.stem}${fortuneFacts.day.branch}`],
        fortuneStatus,
      });
    }
  }

  // ── 5. Recommendation Traceability (육아 조언 추적성) ────────
  // 규칙: Child Evidence 및 Mom Evidence 와 연결될 때만 생성 (모두 evidenceRefs 필수)
  const transEv = childEvidences.find((e) => e.axis === "transition_preference");
  if (transEv && transEv.observedPattern.includes("completion")) {
    recommendations.push({
      recommendationId: "rec_transition_completion",
      title: "활동 전환 전 마침표 지점 함께 정하기",
      detail: "갑작스럽게 중단하기보다 아이가 스스로 마무리할 수 있는 구체적인 지점을 미리 확인해주세요.",
      recommendationReason: "관찰된 행동에서 하던 놀이를 끝맺어야 전환이 편안한 패턴이 확인되었습니다.",
      evidenceRefs: [`child:${transEv.domain}_${transEv.observedPattern}`],
    });
  }

  const dirEv = childEvidences.find(
    (e) => e.axis === "strong_self_direction" && e.observedPattern.includes("independent")
  );
  if (dirEv) {
    recommendations.push({
      recommendationId: "rec_self_direction_choice",
      title: "규칙 안에서 작은 선택권 건네기",
      detail: "해야 할 큰 규칙은 명확히 하되, 순서나 도구를 직접 고를 수 있는 기회를 열어주세요.",
      recommendationReason: "자기 생각과 주도적 참여를 중요하게 여기는 관찰 패턴에 기반합니다.",
      evidenceRefs: [`child:${dirEv.domain}_${dirEv.observedPattern}`],
    });
  }

  const negEv = childEvidences.find(
    (e) => e.axis === "strong_self_direction" && e.observedPattern.includes("negotiates")
  );
  if (negEv) {
    recommendations.push({
      recommendationId: "rec_assert_and_negotiate",
      title: "아이의 생각을 먼저 듣고 내 이유 나누기",
      detail: "아이의 의견을 먼저 들은 뒤 내 이유를 설명하면, 서로의 생각을 주고받는 방식으로 대화를 이어갈 수 있어요.",
      recommendationReason: "자기 의사를 분명히 표현하되 이유를 들으면 조율하는 관찰 패턴에 기반합니다.",
      evidenceRefs: [`child:${negEv.domain}_${negEv.observedPattern}`],
    });
  }

  const obsEv = childEvidences.find((e) => e.axis === "needs_observation_time");
  if (obsEv && obsEv.observedPattern.includes("observe")) {
    recommendations.push({
      recommendationId: "rec_observation_time_allowance",
      title: "새로운 상황에서 충분한 탐색 시간 지켜봐주기",
      detail: "성급하게 참여를 유도하기보다 부모 곁에서 주변을 살필 수 있는 여유를 주는 편이 더 잘 맞을 수 있어요.",
      recommendationReason: "새로운 환경에서 상황을 먼저 파악하려는 관찰 패턴에 기반합니다.",
      evidenceRefs: [`child:${obsEv.domain}_${obsEv.observedPattern}`],
    });
  }

  const praiseEv = childEvidences.find((e) => e.axis === "motivation_source");
  if (praiseEv && praiseEv.observedPattern.includes("praise")) {
    recommendations.push({
      recommendationId: "rec_praise_effort_focus",
      title: "결과보다 과정과 시도를 구체적으로 알아채주기",
      detail: "칭찬을 들었을 때 참여가 높아지는 모습이 관찰되었으므로, 결과만 칭찬하기보다 어떤 시도를 했는지 구체적으로 짚어주는 방식을 시도해볼 수 있어요.",
      recommendationReason: "칭찬을 들었을 때 적극성이 높아지는 관찰 패턴에 기반합니다.",
      evidenceRefs: [`child:${praiseEv.domain}_${praiseEv.observedPattern}`],
    });
  }

  const reasonEv = childEvidences.find(
    (e) => e.axis === "rule_negotiation_style" && e.observedPattern.includes("reason")
  );
  if (reasonEv) {
    recommendations.push({
      recommendationId: "rec_rule_reason_explanation",
      title: "행동의 이유를 먼저 차근차근 설명해주기",
      detail: "규칙이나 이유를 알고 싶어 하는 모습이 관찰되어, 지시만 하기보다 이유를 함께 알려주는 방식이 더 잘 맞을 수 있어요.",
      recommendationReason: "규칙이나 이유에 대한 설명을 듣고 납득하려는 관찰 패턴에 기반합니다.",
      evidenceRefs: [`child:${reasonEv.domain}_${reasonEv.observedPattern}`],
    });
  }

  const ruleEv = childEvidences.find(
    (e) => e.axis === "rule_negotiation_style" && e.observedPattern.includes("flexible")
  );
  if (ruleEv) {
    recommendations.push({
      recommendationId: "rec_flexible_cooperation",
      title: "지금 보이는 유연한 반응을 그대로 지켜보기",
      detail: "현재 관찰에서는 상황 변화나 활동 전환에서 큰 어려움이 반복되지는 않았어요. 지금처럼 어떤 상황에서 편안하게 넘어가는지 조금 더 지켜봐도 좋아요.",
      recommendationReason: "상황과 분위기에 맞춰 유연하게 반응하는 관찰 패턴에 기반합니다.",
      evidenceRefs: [`child:${ruleEv.domain}_${ruleEv.observedPattern}`],
    });
  }

  // Recommendation 이 하나도 없거나 LOW Evidence 인 경우 (개입 필요성 단정 금지, 관찰 지속 지지)
  if (recommendations.length === 0 && childEvidences.length > 0) {
    const first = childEvidences[0];
    const phrase = normalizeToPhrase(first.observedLabel);
    recommendations.push({
      recommendationId: "rec_gentle_observation",
      title: "현재의 편안한 소통 방식 이어가기",
      detail: "지금 답변에서는 이 행동을 바꿔야 할 만큼 반복되는 어려움은 뚜렷하게 확인되지 않았어요. 무언가를 고치려고 하기보다 어떤 상황에서 이런 모습이 자주 나타나는지 조금 더 지켜봐도 좋아요.",
      recommendationReason: `관찰된 ${phrase} 특성에 바탕하여, 무리하게 바꾸기보다 상황별 반응을 자연스럽게 지켜보는 방식을 권합니다.`,
      evidenceRefs: [`child:${first.domain}_${first.observedPattern}`],
    });
  }

  // ── 6. Coverage Report 집계 ────────────────────────────────
  const observedCount = claims.filter((c) => c.layer === "OBSERVED").length;
  const inferredCount = claims.filter((c) => c.layer === "INFERRED").length;
  const reflectiveCount = claims.filter((c) => c.layer === "REFLECTIVE").length;
  const unsupportedCount = claims.filter(
    (c) =>
      c.layer !== "REFLECTIVE" &&
      (!c.evidenceRefs || c.evidenceRefs.length === 0) &&
      !c.claim.includes("단정하기 어려워요") &&
      !c.claim.includes("말하기 어려워요") &&
      !c.claim.includes("충분하지 않아")
  ).length;
  const strongCount = claims.filter((c) => c.evidenceStrength === "STRONG").length;
  const mediumCount = claims.filter((c) => c.evidenceStrength === "MEDIUM").length;
  const lowCount = claims.filter((c) => c.evidenceStrength === "LOW").length;
  const fortuneOnlyClaims = claims.filter(
    (c) => c.layer === "INFERRED" && c.evidenceRefs.length === 0 && c.fortuneRefs.length > 0
  ).length;

  const coverageReport: EvidenceCoverageReport = {
    totalClaims: claims.length,
    observedClaims: observedCount,
    inferredClaims: inferredCount,
    reflectiveClaims: reflectiveCount,
    unsupportedClaims: unsupportedCount,
    strongClaims: strongCount,
    mediumClaims: mediumCount,
    lowClaims: lowCount,
    fortuneOnlyClaims,
    fortuneConfidenceBoostCount: boostCount,
    contradictionResolvedCount: contradictionCount,
    insufficientEvidenceCount: insufficientCount,
    fortuneStatus,
  };

  // ── 7. Summary One-sentence (No personality essence claim) ──
  const dominantInferred = claims.find(
    (c) =>
      c.layer === "INFERRED" &&
      (c.evidenceStrength === "STRONG" || c.evidenceStrength === "MEDIUM") &&
      !c.isContradictionResolved
  );

  let summaryOneSentence = "";
  if (dominantInferred) {
    summaryOneSentence = dominantInferred.claim;
  } else if (childEvidences.length >= 2) {
    const p1 = normalizeToPhrase(childEvidences[0].observedLabel);
    const p2 = normalizeToPhrase(childEvidences[1].observedLabel);
    summaryOneSentence = `${withJosa(p1, "을", "를")} 보이기도 하고, 상황에 따라 ${withJosa(p2, "을", "를")} 나타내기도 하는 아이예요.`;
  } else if (childEvidences.length === 1) {
    const p1 = normalizeToPhrase(childEvidences[0].observedLabel);
    summaryOneSentence = `지금은 ${withJosa(p1, "이", "가")} 중심에 관찰되는 시기예요.`;
  } else {
    summaryOneSentence = "직접 관찰해 주신 일상의 장면들을 바탕으로 아이만의 편안한 흐름을 정리했어요.";
  }

  return {
    claims,
    recommendations,
    coverageReport,
    summaryOneSentence,
  };
}
