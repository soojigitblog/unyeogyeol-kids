// p20Evidence.test.ts: P2.0H.1 EVIDENCE & CREDIBILITY GATE 종합 검증 테스트

import { describe, expect, it } from "vitest";
import { getAgeBandCode } from "@/lib/questionnaire/ageBandTypes";
import {
  getQuestionsForAgeBand,
  QUESTIONS,
  QUESTIONS_WITH_VARIANTS,
  TOTAL_QUESTIONS,
} from "@/lib/questionnaire/questions";
import {
  DEEP_OBSERVATION_QUESTIONS,
  TOTAL_DEEP_QUESTIONS,
} from "@/lib/questionnaire/deepQuestions";
import { buildEvidenceClaims } from "@/lib/interaction/evidenceClaimEngine";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { EXTENDED_FIXTURES } from "@/lib/interaction/fixturesP20";
import { validateSignatureReportSafety } from "@/lib/interaction/safetyValidators";
import { generateSignatureReport } from "@/lib/interaction/signatureReportGenerator";
import { TRANSPARENCY_COPY } from "@/lib/safety/transparencyCopy";
import type { BehaviorEvidence } from "@/lib/types";

describe("P2.0H.1 EVIDENCE & CREDIBILITY ENGINE TEST SUITE", () => {
  // 1. Age-specific Questions (Band A/B/C)
  it("1. Provides Age-specific Question variants for Band A, B, C while maintaining 10 Free questions", () => {
    expect(TOTAL_QUESTIONS).toBe(10);
    expect(QUESTIONS_WITH_VARIANTS.length).toBe(10);

    const questionsA = getQuestionsForAgeBand("A");
    const questionsB = getQuestionsForAgeBand("B");
    const questionsC = getQuestionsForAgeBand("C");

    expect(questionsA.length).toBe(10);
    expect(questionsB.length).toBe(10);
    expect(questionsC.length).toBe(10);

    // 연령별로 서로 다른 실제 장면 프롬프트를 사용하는지 검증
    const transQ_A = questionsA.find((q) => q.domain === "transition")!;
    const transQ_B = questionsB.find((q) => q.domain === "transition")!;
    const transQ_C = questionsC.find((q) => q.domain === "transition")!;

    expect(transQ_A.prompt).toContain("씻으러");
    expect(transQ_B.prompt).toContain("놀이터에서");
    expect(transQ_C.prompt).toContain("다음 일정으로");
    expect(transQ_A.prompt).not.toEqual(transQ_B.prompt);
  });

  // 2. Paid Deep Observation Questions (14 questions)
  it("2. Has 14 Paid Deep Child Observation questions covering Home, Outside, Group contexts without arbitrary minutes", () => {
    expect(TOTAL_DEEP_QUESTIONS).toBe(14);
    expect(DEEP_OBSERVATION_QUESTIONS.length).toBe(14);

    const contexts = new Set(DEEP_OBSERVATION_QUESTIONS.map((q) => q.contextCategory));
    expect(contexts.has("home")).toBe(true);
    expect(contexts.has("outside")).toBe(true);
    expect(contexts.has("group")).toBe(true);

    DEEP_OBSERVATION_QUESTIONS.forEach((q) => {
      expect(q.options.length).toBe(4);
      expect(q.agePrompts.A).toBeDefined();
      expect(q.agePrompts.B).toBeDefined();
      expect(q.agePrompts.C).toBeDefined();
      q.options.forEach((opt) => {
        expect(opt.label).not.toMatch(/\d+분\s*뒤/);
      });
    });
  });

  // 3. Multi-Evidence Rule & Evidence Strength (LOW, MEDIUM, STRONG Threshold Strict Lock)
  it("3. Enforces Multi-Evidence Rule and sets correct Evidence Strength (2 obs + conflict is MEDIUM, 3 obs + conflict is STRONG)", () => {
    const fixtureA = EXTENDED_FIXTURES.find((f) => f.fixtureId === "A")!;
    const momEv = buildMomEvidence(fixtureA.momAnswers);
    const result = buildEvidenceClaims(
      fixtureA.childEvidences,
      momEv,
      fixtureA.conflictInput,
      fixtureA.fortuneFacts
    );

    // Fixture A: transition_preference 에 2개 관찰 + 갈등 일치 -> 반드시 MEDIUM (STRONG 금지)
    const inferredTrans = result.claims.find(
      (c) => c.layer === "INFERRED" && c.axis === "transition_preference"
    );
    expect(inferredTrans).toBeDefined();
    expect(inferredTrans?.evidenceStrength).toBe("MEDIUM");
    expect(inferredTrans?.evidenceRefs.length).toBe(3); // 2 child refs + 1 conflict ref

    // 3개 관찰 + 갈등 일치 시에만 STRONG 승격 테스트
    const synthetic3Obs: BehaviorEvidence[] = [
      ...fixtureA.childEvidences,
      {
        domain: "transition",
        axis: "transition_preference",
        patternId: "needs_completion_before_transition",
        observedLabel: "식사 전에도 하던 놀이를 끝맺으려는 모습",
        strength: "medium",
        source: { scope: "general", questionIds: ["extra_q"] },
      },
    ];
    const strongResult = buildEvidenceClaims(
      synthetic3Obs,
      momEv,
      fixtureA.conflictInput,
      fixtureA.fortuneFacts
    );
    const strongClaim = strongResult.claims.find(
      (c) => c.layer === "INFERRED" && c.axis === "transition_preference"
    );
    expect(strongClaim?.evidenceStrength).toBe("STRONG");
  });

  // 4. Layers Separation (OBSERVED, INFERRED, REFLECTIVE)
  it("4. Correctly separates OBSERVED, INFERRED, and REFLECTIVE layers", () => {
    const fixtureA = EXTENDED_FIXTURES.find((f) => f.fixtureId === "A")!;
    const momEv = buildMomEvidence(fixtureA.momAnswers);
    const result = buildEvidenceClaims(
      fixtureA.childEvidences,
      momEv,
      fixtureA.conflictInput,
      fixtureA.fortuneFacts
    );

    expect(result.coverageReport.observedClaims).toBeGreaterThan(0);
    expect(result.coverageReport.inferredClaims).toBeGreaterThan(0);
    expect(result.coverageReport.reflectiveClaims).toBeGreaterThan(0);
  });

  // 5. Fortune CANNOT Increase Confidence (Boost Count = 0) & No Element Code in Customer Copy
  it("5. Fortune CANNOT increase confidence (Boost Count = 0) and NEVER exposes element English codes", () => {
    EXTENDED_FIXTURES.forEach((f) => {
      const momEv = buildMomEvidence(f.momAnswers);
      const result = buildEvidenceClaims(
        f.childEvidences,
        momEv,
        f.conflictInput,
        f.fortuneFacts
      );
      expect(result.coverageReport.fortuneConfidenceBoostCount).toBe(0);

      // REFLECTIVE layer 의 사주 claim 은 항상 LOW supporting
      const reflective = result.claims.filter((c) => c.layer === "REFLECTIVE");
      reflective.forEach((r) => {
        expect(r.evidenceStrength).toBe("LOW");
        // 고객 문구에 (wood), (fire), (metal), (earth), (water) 영문 코드 노출 금지
        expect(r.claim).not.toMatch(/\((wood|fire|earth|metal|water)\)/i);
      });
    });
  });

  // 6. Observation Overrides Fortune & Strong Conflict (Fixture E & H)
  it("6. Observation strictly overrides Fortune and prohibits forced agreement (Fixtures E and H)", () => {
    // Fixture E: 사주=Fire(외향) vs 관찰=신중/탐색
    const fixtureE = EXTENDED_FIXTURES.find((f) => f.fixtureId === "E")!;
    const momEvE = buildMomEvidence(fixtureE.momAnswers);
    const resultE = buildEvidenceClaims(
      fixtureE.childEvidences,
      momEvE,
      fixtureE.conflictInput,
      fixtureE.fortuneFacts
    );
    expect(resultE.coverageReport.fortuneStatus).toBe("CONFLICTING");
    const reflectiveE = resultE.claims.find((c) => c.layer === "REFLECTIVE");
    expect(reflectiveE?.claim).not.toContain("닿아 있");
    expect(reflectiveE?.claim).toContain("실제 행동을 우선");

    // Fixture H: 사주=Metal(원칙) vs 관찰=유연(context_flexible)
    const fixtureH = EXTENDED_FIXTURES.find((f) => f.fixtureId === "H")!;
    const momEvH = buildMomEvidence(fixtureH.momAnswers);
    const resultH = buildEvidenceClaims(
      fixtureH.childEvidences,
      momEvH,
      fixtureH.conflictInput,
      fixtureH.fortuneFacts
    );
    expect(resultH.coverageReport.fortuneStatus).toBe("CONFLICTING");
    const reflectiveH = resultH.claims.find((c) => c.layer === "REFLECTIVE");
    expect(reflectiveH?.claim).not.toContain("닿아 있");
    expect(reflectiveH?.claim).toContain("실제 행동을 우선");

    const inferredRule = resultH.claims.find(
      (c) => c.layer === "INFERRED" && c.axis === "rule_negotiation_style"
    );
    expect(inferredRule?.claim).toContain("유연하게");
    expect(inferredRule?.claim).not.toContain("철저한 원칙");
  });

  // 7. Contradiction Handling (Fixture F)
  it("7. Resolves contradictory observations into context-dependent traits with natural Korean", () => {
    const fixtureF = EXTENDED_FIXTURES.find((f) => f.fixtureId === "F")!;
    const momEv = buildMomEvidence(fixtureF.momAnswers);
    const result = buildEvidenceClaims(
      fixtureF.childEvidences,
      momEv,
      fixtureF.conflictInput,
      fixtureF.fortuneFacts
    );

    expect(result.coverageReport.contradictionResolvedCount).toBeGreaterThan(0);
    const resolvedClaim = result.claims.find((c) => c.isContradictionResolved);
    expect(resolvedClaim).toBeDefined();
    expect(resolvedClaim?.claim).toContain("상황에 따라 차이");
    expect(resolvedClaim?.claim).not.toContain("편이에요");
  });

  // 8. Insufficient Evidence Handling & Safe Low-Evidence Summary (Fixture G)
  it("8. Allows INSUFFICIENT_EVIDENCE and generates safe concrete summary for No-Dominant cases (Fixture G)", () => {
    const fixtureG = EXTENDED_FIXTURES.find((f) => f.fixtureId === "G")!;
    const momEv = buildMomEvidence(fixtureG.momAnswers);
    const result = buildEvidenceClaims(
      fixtureG.childEvidences,
      momEv,
      fixtureG.conflictInput,
      fixtureG.fortuneFacts
    );

    expect(result.coverageReport.insufficientEvidenceCount).toBeGreaterThan(0);
    const insufficientClaim = result.claims.find((c) =>
      c.claim.includes("단정하기 어려워요") || c.claim.includes("말하기 어려워요")
    );
    expect(insufficientClaim).toBeDefined();

    // No dominant pattern 이어도 generic fallback 이 아닌 관찰된 1~2개 사실을 안전하게 요약
    expect(result.summaryOneSentence).not.toBe("엄마가 관찰해 준 일상의 장면들을 바탕으로 아이만의 편안한 흐름을 정리했어요.");
    expect(result.summaryOneSentence).toContain("어울리는 모습");
    expect(result.summaryOneSentence).toContain("조율하는 모습");
  });

  // 9. Recommendation Traceability & Evidence Provenance across all Fixtures A~I
  it("9. Guarantees Recommendation Traceability and Evidence Provenance for all A~I fixtures", () => {
    EXTENDED_FIXTURES.forEach((f) => {
      const momEv = buildMomEvidence(f.momAnswers);
      const result = buildEvidenceClaims(
        f.childEvidences,
        momEv,
        f.conflictInput,
        f.fortuneFacts
      );

      // QA Coverage Report Criteria
      expect(result.coverageReport.unsupportedClaims).toBe(0);
      expect(result.coverageReport.fortuneOnlyClaims).toBe(0);

      // Recommendations Traceability
      result.recommendations.forEach((rec) => {
        expect(rec.recommendationReason).toBeDefined();
        expect(rec.recommendationReason.length).toBeGreaterThan(5);
        expect(rec.evidenceRefs.length).toBeGreaterThan(0);
        expect(rec.evidenceRefs[0]).toMatch(/^(child|mom):/);
      });
    });
  });

  // 10. Natural Korean QA Test (Zero Broken Morphology / Template Collisions)
  it("10. Guarantees ZERO Broken Morphological/Template collisions in natural Korean across all A~I fixtures", () => {
    const brokenPattern = /(편이에요|해요|합니다|입니다|아이예요|다\.)\s*(모습|방식|태도|이지만|인 모습)/;

    EXTENDED_FIXTURES.forEach((f) => {
      const momEv = buildMomEvidence(f.momAnswers);
      const result = buildEvidenceClaims(
        f.childEvidences,
        momEv,
        f.conflictInput,
        f.fortuneFacts
      );

      result.claims.forEach((c) => {
        expect(c.claim).not.toMatch(brokenPattern);
        expect(c.claim).not.toContain("편이에요 모습");
        expect(c.claim).not.toContain("해요 모습");
        expect(c.claim).not.toContain("해요이지만");
        expect(c.claim).not.toContain("입니다 모습");
        expect(c.claim).not.toContain("아이예요 방식");
      });

      expect(result.summaryOneSentence).not.toMatch(brokenPattern);
    });
  });

  // 11. Safety / Claim Guard & No Personality Essence / No Arbitrary Accuracy
  it("11. Passes Claim Safety Guard and has NO personality essence or arbitrary accuracy claims", () => {
    const bannedPersonalityEssence = [
      "원래 이런 아이",
      "본래 소심한 아이",
      "태생적으로 고집이 셈",
      "평생 이런 성격",
      "타고난 성격이 이렇다",
      "정확도 90%",
      "검증된 기질검사",
      "전문 심리평가",
      "과학적으로 분석",
    ];

    EXTENDED_FIXTURES.forEach((f) => {
      const momEv = buildMomEvidence(f.momAnswers);
      const result = buildEvidenceClaims(
        f.childEvidences,
        momEv,
        f.conflictInput,
        f.fortuneFacts
      );
      const jsonStr = JSON.stringify(result);

      bannedPersonalityEssence.forEach((term) => {
        expect(jsonStr).not.toContain(term);
      });

      // Signature report safety validator
      const sigReport = generateSignatureReport(
        f.childProfile,
        f.childEvidences,
        momEv,
        f.conflictInput
      );
      const validation = validateSignatureReportSafety(sigReport);
      expect(validation.passed).toBe(true);

      // 개입 필요성 단정 표현 전면 차단 검사
      const fullReportStr = JSON.stringify(sigReport) + JSON.stringify(result);
      expect(fullReportStr).not.toContain("특정한 양육 개입이 필요한 상태가 아니니");
      expect(fullReportStr).not.toContain("양육 개입이 필요한 상태가 아니니");
      expect(fullReportStr).not.toContain("개입이 필요하지 않습니다");
      expect(fullReportStr).not.toContain("현재 문제 없습니다");
      expect(fullReportStr).not.toContain("정상입니다");
    });
  });

  // 12. Single Evidence Overclaim Ban
  it("12. Single Evidence claims are constrained to LOW strength without overclaiming", () => {
    EXTENDED_FIXTURES.forEach((f) => {
      const momEv = buildMomEvidence(f.momAnswers);
      const result = buildEvidenceClaims(
        f.childEvidences,
        momEv,
        f.conflictInput,
        f.fortuneFacts
      );

      const singleObsClaims = result.claims.filter(
        (c) => c.layer === "INFERRED" && c.evidenceRefs.length === 1
      );
      singleObsClaims.forEach((c) => {
        expect(c.evidenceStrength).toBe("LOW");
        expect(c.claim).toMatch(/이 상황에서는|관찰돼요/);
        expect(c.claim).not.toMatch(/일관되게|반복돼요|원래/);
      });
    });
  });

  // 13. P2.0H.2 Phrase Evidence Traceability & Specific Fortune Mapping (Fixtures C, D, H, I, A)
  it("13. Verifies P2.0H.2 Phrase Evidence Traceability and specific Fortune Reflection for C, D, H, I, A", () => {
    // 13-1. Fixture C (칭찬)
    const fixC = EXTENDED_FIXTURES.find((f) => f.fixtureId === "C")!;
    const momEvC = buildMomEvidence(fixC.momAnswers);
    const sigC = generateSignatureReport(fixC.childProfile, fixC.childEvidences, momEvC, fixC.conflictInput);
    expect(sigC.chapter06_threePhrases.length).toBeGreaterThan(0);
    const phraseC = sigC.chapter06_threePhrases[0];
    expect(phraseC.before).toContain("잘했네");
    // P2.2V.6: "엄마" 고정 문구 제거 -> 관계 중립 표현
    expect(phraseC.after).toContain("끝까지 해본 거");
    expect(phraseC.after).not.toContain("엄마");
    expect(phraseC.evidenceRefs).toContain("child:praise_energized_by_praise");

    // 13-2. Fixture D (이유/규칙 탐색)
    const fixD = EXTENDED_FIXTURES.find((f) => f.fixtureId === "D")!;
    const momEvD = buildMomEvidence(fixD.momAnswers);
    const sigD = generateSignatureReport(fixD.childProfile, fixD.childEvidences, momEvD, fixD.conflictInput);
    expect(sigD.chapter06_threePhrases.length).toBeGreaterThan(0);
    const phraseD = sigD.chapter06_threePhrases[0];
    expect(phraseD.before).toContain("하라면");
    expect(phraseD.after).toContain("이야기해줄게");
    expect(phraseD.evidenceRefs).toContain("child:rule_response_reason_seeking");

    // 13-3. Fixture H (초유연 -> Phrase OMIT)
    const fixH = EXTENDED_FIXTURES.find((f) => f.fixtureId === "H")!;
    const momEvH = buildMomEvidence(fixH.momAnswers);
    const sigH = generateSignatureReport(fixH.childProfile, fixH.childEvidences, momEvH, fixH.conflictInput);
    expect(sigH.chapter06_threePhrases.length).toBe(0); // OMIT

    // 13-4. Fixture I (의견 조율)
    const fixI = EXTENDED_FIXTURES.find((f) => f.fixtureId === "I")!;
    const momEvI = buildMomEvidence(fixI.momAnswers);
    const sigI = generateSignatureReport(fixI.childProfile, fixI.childEvidences, momEvI, fixI.conflictInput);
    expect(sigI.chapter06_threePhrases.length).toBeGreaterThan(0);
    const phraseI = sigI.chapter06_threePhrases[0];
    // P2.4 RECOMMENDATION ALIGNMENT: CurrentConflict.scenarioId(sc_friends_sharing) 기반
    // 실제 장면 문구로 대체됨. fixture I 는 momFirstReaction 을 입력하지 않았으므로
    // "안 된다고 했잖아" 같은 근거 없는 대사를 지어내지 않고 중립 fallback 을 쓴다.
    expect(phraseI.before).toContain("상황을 정리하려 안내함");
    expect(phraseI.after).toContain("친구한테 줄까");
    expect(phraseI.evidenceRefs).toContain("child:self_assertion_asserts_but_negotiates");

    // 13-5. Fixture A Fortune Reflection (ALIGNED)
    const fixA = EXTENDED_FIXTURES.find((f) => f.fixtureId === "A")!;
    const resA = buildEvidenceClaims(fixA.childEvidences, buildMomEvidence(fixA.momAnswers), fixA.conflictInput, fixA.fortuneFacts);
    const refA = resA.claims.find((c) => c.layer === "REFLECTIVE");
    expect(refA?.claim).toContain("자기 방식으로 움직이려는 쪽의 힌트");
    // P2.2V.6: 관계 중립 표현으로 변경 ("엄마가 알려준" -> "직접 알려주신")
    expect(refA?.claim).toContain("실제 결과는 직접 알려주신 행동을 중심으로");

    // 13-6. No generic fallback phrase ("왜 그래?") across all fixtures
    EXTENDED_FIXTURES.forEach((f) => {
      const sig = generateSignatureReport(f.childProfile, f.childEvidences, buildMomEvidence(f.momAnswers), f.conflictInput);
      sig.chapter06_threePhrases.forEach((p) => {
        expect(p.before).not.toContain("왜 그래?");
        expect(p.after).not.toContain("지금 어떤 기분인지 천천히 알려줄래?");
        expect(p.evidenceRefs.length).toBeGreaterThan(0);
      });
    });
  });

  // 14. P2.0H.3 Effect-Claim Micro Patch (Zero Deterministic Effect & Zero Unsupported Inner-State Guarantee)
  it("14. Guarantees ZERO unsupported psychological effects or inner-state guarantees across all A~I outputs", () => {
    const bannedEffectTerms = [
      "내적 동기",
      "존중받았다고 느",
      "반발 없이",
      "협조해요",
      "진정돼요",
      "받아들여져요",
      "효과가 있어요",
      "반드시 통합니다",
    ];

    EXTENDED_FIXTURES.forEach((f) => {
      const momEv = buildMomEvidence(f.momAnswers);
      const result = buildEvidenceClaims(
        f.childEvidences,
        momEv,
        f.conflictInput,
        f.fortuneFacts
      );
      const sigReport = generateSignatureReport(
        f.childProfile,
        f.childEvidences,
        momEv,
        f.conflictInput
      );

      const allOutputStr = JSON.stringify(result) + JSON.stringify(sigReport);
      bannedEffectTerms.forEach((term) => {
        expect(allOutputStr).not.toContain(term);
      });
    });

    // Fixture H 특정 검증: 엄마 행동 교정 금지 및 유연한 반응 지켜보기 확인
    const fixH = EXTENDED_FIXTURES.find((f) => f.fixtureId === "H")!;
    const resH = buildEvidenceClaims(
      fixH.childEvidences,
      buildMomEvidence(fixH.momAnswers),
      fixH.conflictInput,
      fixH.fortuneFacts
    );
    expect(resH.recommendations[0].title).toBe("지금 보이는 유연한 반응을 그대로 지켜보기");
    expect(resH.recommendations[0].detail).toContain("큰 어려움이 반복되지는 않았어요");
    expect(resH.recommendations[0].detail).not.toContain("정해진 틀을 일방적으로 강요하기보다");
  });
});
