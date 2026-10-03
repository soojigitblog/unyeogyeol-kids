// safetyValidators 모듈: 2-Layer Safety Verification (P2.2H Edition)
//
// Layer A: Lexical Guard (금지어 검색)
// Layer B: Structured Claim Guard (의미/클레임 분류 위험 탐지)

import type { SignatureReport } from "@/lib/types";

export interface SafetyViolation {
  layer: "lexical" | "structured_claim";
  category:
    | "banned_words"
    | "medical_development"
    | "intelligence_ability"
    | "attachment_diagnosis"
    | "parent_blame"
    | "deterministic_inner_state"
    | "unsupported_behavior"
    | "fortune_only_parenting"
    | "personality_essence"
    | "false_precision"
    | "long_term_promise"
    | "therapeutic_metaphor"
    | "generic_flattery"
    | "unsupported_mom_psychology";
  reason: string;
  contextSnippet?: string;
}

export interface SafetyValidationResult {
  passed: boolean;
  violations: SafetyViolation[];
}

// ── Layer A: Lexical Guard ────────────────────────────────
export const BANNED_LEXICAL_TERMS = [
  "ADHD",
  "adhd",
  "발달장애",
  "자폐",
  "틱장애",
  "분리불안장애",
  "애착장애",
  "불안정애착",
  "결사항전",
  "감정뇌가 닫",
  "안전기지 파괴",
  "엄마 탓",
  "엄마가 망친",
  "잘못 키운",
  "영재성",
  "아이큐",
  "IQ",
  "사주에 살이 껴",
  "사주가 나빠",
  "팔자가 사나",
  "원래 이런 아이",
  "본래 소심한 아이",
  "태생적으로 고집이 셈",
  // 관찰 장면을 설명하는 것은 허용하되, 아이 전체를 문제/결함으로 규정하는 낙인은 금지한다.
  "고집 센 아이",
  "문제 있는 아이",
  "말 안 듣는 아이",
  "산만한 아이",
  "사회성이 떨어지는 아이",
  "공격적인 아이",
  "까다로운 아이",
  "평생 이런 성격",
  "타고난 성격이 이렇다",
  "정확도 90%",
  "검증된 기질검사",
  "전문 심리평가",
  "과학적으로 분석",
  // P2.0H.2 추가 금지어: 개입 필요성 판단 및 사주 검증/모호 일치 클레임
  "특정한 양육 개입이 필요한 상태가 아니니",
  "양육 개입이 필요한 상태가 아니니",
  "개입이 필요하지 않습니다",
  "현재 문제 없습니다",
  "정상입니다",
  "사주에서도 같으므로 신뢰할 수 있음",
  "출생정보에서도 확인됨",
  "사주가 실제 성향을 뒷받침함",
  "사주와 잘 맞아요",
  "부드럽게 결이 닿아 있는 부분이 있어요",
  "비슷한 부분이 있어요",
  // P2.0H.3 추가 금지어: 심리 상태 / 효과 단정
  "내적 동기",
  "존중받았다고 느",
  "반발 없이",
  "협조해요",
  "진정돼요",
  "받아들여져요",
  "효과가 있어요",
  "반드시 통합니다",
  // P2.2H 추가 금지어: 장기 예측 / 치료 은유 / 확정 내면 / 엄마 심리 단정 / 아첨
  "평생의 정서적 지지대",
  "평생 도움이 됩니다",
  "단단한 애착을 만들어",
  "아이의 미래에 큰 힘",
  "오래도록 정서적 안정",
  "평생의 단단한",
  "진정제",
  "치료제",
  "회복제",
  "치유",
  "안전 울타리",
  "깊은 무력감",
  "혹시 적응하지 못할까 하는 불안",
  "사랑에서 나온 마음",
  "가정을 지키는 든든한 기준",
  "안도감을 느",
  "안도감을 얻",
  "안전하다고 느",
  "통제권을 빼앗겼다고 느",
  "정서적 안정감을 얻",
  // P3.4 추가 금지어: 절대적 단정 표현(스펙 17번) + 명리 원문 용어 노출 차단(스펙 8번 검증)
  "반드시 될 것",
  "될 운명",
  "할 운명",
  "타고난 운명",
  "궁합이 나빠",
  "궁합이 안 좋",
  "일간",
  "십신",
  "십성",
  "천간",
  "편재",
  "정재",
  "편관",
  "정인",
  "식신",
  "비견",
  "겁재",
  // 주의: "지지"(支)/"상관"(傷)/"편인"(偏印)은 명리 용어지만 "지지(support)"/
  // "상관없다"/"~하는 편인지" 등 일상어·문법과 그대로 겹쳐 오탐이 나므로
  // 단순 문자열 금지어로 넣지 않는다.
  // P3.5 추가 금지어: 감정 사용설명서의 진단성 표현 + 미래연결분야의 입시/서열 표현
  "불안장애",
  "사회불안장애",
  "선택적함구증",
  "분노조절장애",
  "적대적반항장애",
  "품행장애",
  "입시",
  "수능",
  "명문대",
  "특목고",
  "추천 직업",
  "될 사주",
  // P3.6 랜딩페이지 신뢰 문구 추가 금지어
  "과학적으로 증명",
  "미래 예측",
  "정확도 95%",
];

export function runLexicalGuard(text: string): SafetyViolation[] {
  const violations: SafetyViolation[] = [];
  for (const term of BANNED_LEXICAL_TERMS) {
    if (text.includes(term)) {
      violations.push({
        layer: "lexical",
        category: "banned_words",
        reason: `금지 어휘 '${term}' 감지됨.`,
        contextSnippet: text.slice(Math.max(0, text.indexOf(term) - 10), text.indexOf(term) + 20),
      });
    }
  }
  return violations;
}

// ── Layer B: Structured Claim Guard ─────────────────────────
export function runStructuredClaimGuard(report: SignatureReport): SafetyViolation[] {
  const violations: SafetyViolation[] = [];

  // 1. Medical / Development Inference Guard
  const medicalPatterns = [/치료.*필요/, /병원.*상담/, /진단.*받아야/, /장애.*의심/];
  // 2. Intelligence / Ability Prediction Guard
  const abilityPatterns = [/성공.*보장/, /영재.*확실/, /지능.*우수/, /공부.*잘할/];
  // 3. Attachment Diagnosis Guard
  const attachmentPatterns = [/애착.*결함/, /애착.*불안정/, /모착.*파괴/];
  // 4. Parent-blame Causality Guard
  const blamePatterns = [/엄마.*때문에.*비뚤/, /부모.*잘못으로/, /엄마의.*실패/];
  // 5. Long term promise Guard
  const longTermPatterns = [
    /평생.*보장/,
    /미래.*결정/,
    /평생의.*지지/,
    /미래.*예측/,
    /정확도\s*\d+\s*%/,
  ];

  const fullText = JSON.stringify(report);

  for (const p of medicalPatterns) {
    if (p.test(fullText)) {
      violations.push({
        layer: "structured_claim",
        category: "medical_development",
        reason: `의학/발달 진단성 표현 감지: ${p}`,
      });
    }
  }
  for (const p of abilityPatterns) {
    if (p.test(fullText)) {
      violations.push({
        layer: "structured_claim",
        category: "intelligence_ability",
        reason: `지능/성공 단정성 표현 감지: ${p}`,
      });
    }
  }
  for (const p of attachmentPatterns) {
    if (p.test(fullText)) {
      violations.push({
        layer: "structured_claim",
        category: "attachment_diagnosis",
        reason: `애착 진단성 표현 감지: ${p}`,
      });
    }
  }
  for (const p of blamePatterns) {
    if (p.test(fullText)) {
      violations.push({
        layer: "structured_claim",
        category: "parent_blame",
        reason: `부모 탓/인과성 단정 표현 감지: ${p}`,
      });
    }
  }
  for (const p of longTermPatterns) {
    if (p.test(fullText)) {
      violations.push({
        layer: "structured_claim",
        category: "long_term_promise",
        reason: `장기 예측 표현 감지: ${p}`,
      });
    }
  }

  // 6. Evidence Provenance Guard
  const chapters = [
    report.chapter01_recurringScene,
    report.chapter02_perspectiveGap,
    report.chapter03_interactionPattern,
    report.chapter04_conflictChain,
    report.chapter05_momExhaustionPoint,
    report.chapter08_corePromise,
  ];

  chapters.forEach((ch, idx) => {
    if (!ch.evidenceRefs || ch.evidenceRefs.length === 0) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: `Chapter 0${idx + 1} 에 internal evidenceRefs 가 누락되었습니다.`,
      });
    }
  });

  // 6-2. Before/After Phrase evidenceRefs 검사
  if (report.chapter06_threePhrases && report.chapter06_threePhrases.length > 0) {
    const hasUngroundedPhrase = report.chapter06_threePhrases.some(
      (p) => !p.evidenceRefs || p.evidenceRefs.length === 0
    );
    if (hasUngroundedPhrase) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "Before/After 문구에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
  }

  // 6-3. Actions evidenceRefs 검사
  if (report.chapter07_threeActions && report.chapter07_threeActions.length > 0) {
    const hasUngroundedAction = report.chapter07_threeActions.some(
      (a) => !a.evidenceRefs || a.evidenceRefs.length === 0
    );
    if (hasUngroundedAction) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "Actions 문구에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
  }

  // 6-4. P3.4 Talking Points / Conflict Map evidenceRefs 검사 (구버전 리포트는 필드 자체가 없어 스킵)
  if (report.talkingPoints && report.talkingPoints.items.length > 0) {
    const missing = report.talkingPoints.items.some(
      (item) => !item.groundedInGeneric && (!item.evidenceRefs || item.evidenceRefs.length === 0)
    );
    if (missing) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "아이에게 통하는 말 항목에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
  }
  if (report.conflictMap && report.conflictMap.items.length > 0) {
    const missing = report.conflictMap.items.some(
      (item) => !item.groundedInGeneric && (!item.evidenceRefs || item.evidenceRefs.length === 0)
    );
    if (missing) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "충돌지도 항목에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
  }

  // 6-5. P3.5 재능 씨앗 evidenceRefs 검사 (sourceType="generic"이면 근거 없어도 정상)
  if (report.talentSeeds && report.talentSeeds.items.length > 0) {
    const missing = report.talentSeeds.items.some(
      (item) => item.sourceType !== "generic" && (!item.evidenceRefs || item.evidenceRefs.length === 0)
    );
    if (missing) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "재능 씨앗 항목에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
  }

  // 6-6. P3.5 감정/학습/관계 가이드 evidenceRefs 검사
  if (report.guides) {
    const missingEmotion = report.guides.emotionGuide.some(
      (item) => !item.groundedInGeneric && (!item.evidenceRefs || item.evidenceRefs.length === 0)
    );
    const missingLearning = report.guides.learningGuide.some(
      (item) => !item.groundedInGeneric && (!item.evidenceRefs || item.evidenceRefs.length === 0)
    );
    if (missingEmotion || missingLearning) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "감정/학습 사용설명서 항목에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
    const primary = report.guides.relationshipGuide.primary;
    if (primary.sourceType !== "generic" && (!primary.evidenceRefs || primary.evidenceRefs.length === 0)) {
      violations.push({
        layer: "structured_claim",
        category: "unsupported_behavior",
        reason: "관계별 사용설명서에 근거(evidenceRefs)가 누락되어 있습니다.",
      });
    }
  }

  return violations;
}

export function validateSignatureSafety(report: SignatureReport): SafetyValidationResult {
  const lexical = runLexicalGuard(JSON.stringify(report));
  const structured = runStructuredClaimGuard(report);
  const violations = [...lexical, ...structured];
  return {
    passed: violations.length === 0,
    violations,
  };
}

export const validateSignatureReportSafety = validateSignatureSafety;

/**
 * P3.4: AI가 갓 생성한 talkingPoints/conflictMap 텍스트를 report에 병합하기 전에
 * 미리 검사한다(어휘 가드만 — structured claim 가드는 report 전체가 조립된 뒤 검사).
 */
export function runLexicalGuardOnTexts(texts: string[]): SafetyViolation[] {
  return texts.flatMap((t) => runLexicalGuard(t));
}
