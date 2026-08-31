import { describe, it, expect } from "vitest";
import { FAMILY_FIXTURES } from "./fixtures";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildFoodEvidence } from "../questionnaire/foodQuestions";
import { generateSignatureReport } from "./signatureReportGenerator";
import type { CaregiverProfile, ChildProfile, CurrentConflictInput } from "../types";
import {
  runLexicalGuard,
  runStructuredClaimGuard,
} from "./safetyValidators";

describe("P2.2H PAID REPORT EVIDENCE INTEGRITY & HUMAN VALUE PATCH", () => {
  it("1. Generates complete 8-Chapter Signature Reports with Sentence-Level Provenance (A~E)", () => {
    expect(FAMILY_FIXTURES.length).toBe(5);

    FAMILY_FIXTURES.forEach((fixture) => {
      const momEv = buildMomEvidence(fixture.momAnswers);
      const report = generateSignatureReport(
        fixture.childProfile,
        fixture.childEvidences,
        momEv,
        fixture.conflictInput,
        fixture.fortuneFacts
      );

      // Meta
      expect(report.meta.childName).toBe(fixture.childProfile.name);
      expect(report.meta.childAgeDisplay).toBeTruthy();
      expect(report.meta.concernLabel).toBeTruthy();

      // Sentence-level Claims verification
      expect(report.allSentenceClaims).toBeDefined();
      expect(report.allSentenceClaims!.length).toBeGreaterThanOrEqual(6);
      report.allSentenceClaims!.forEach((c) => {
        expect(c.claimId).toBeTruthy();
        expect(c.claimType).toBeTruthy();
        expect(c.text).toBeTruthy();
        expect(c.evidenceRefs.length).toBeGreaterThan(0);
        expect(["direct", "low", "medium", "reflective"]).toContain(c.inferenceLevel);
      });

      // Chapter 01: Recurring Scene
      expect(report.chapter01_recurringScene.title).toBeTruthy();
      expect(report.chapter01_recurringScene.narrative.length).toBeGreaterThan(30);
      expect(report.chapter01_recurringScene.sceneKeywords.length).toBeGreaterThan(0);
      expect(report.chapter01_recurringScene.evidenceRefs.length).toBeGreaterThan(0);
      expect(report.chapter01_recurringScene.sentenceClaims).toBeDefined();

      // Chapter 02: Perspective Gap
      expect(report.chapter02_perspectiveGap.momPerspective.intention).toBeTruthy();
      expect(report.chapter02_perspectiveGap.momPerspective.possibleFeeling).toBeTruthy();
      expect(report.chapter02_perspectiveGap.childPerspective.possibleInterpretation).toBeTruthy();
      expect(report.chapter02_perspectiveGap.childPerspective.possibleFeeling).toBeTruthy();
      expect(report.chapter02_perspectiveGap.evidenceRefs.length).toBeGreaterThan(0);

      // Chapter 03: Interaction Pattern
      expect(report.chapter03_interactionPattern.title).toBeTruthy();
      expect(report.chapter03_interactionPattern.childBehaviorAspect).toBeTruthy();
      expect(report.chapter03_interactionPattern.momReactionAspect).toBeTruthy();
      expect(report.chapter03_interactionPattern.synthesis).toBeTruthy();
      expect(report.chapter03_interactionPattern.evidenceRefs.length).toBeGreaterThan(0);

      // Chapter 04: Conflict Chain + Where to Break
      expect(report.chapter04_conflictChain.steps.length).toBe(5);
      expect(report.chapter04_conflictChain.whereToBreak.targetStep).toBeGreaterThanOrEqual(1);
      expect(report.chapter04_conflictChain.whereToBreak.breakActionTitle).toBeTruthy();
      expect(report.chapter04_conflictChain.whereToBreak.breakActionDetail).toBeTruthy();
      expect(report.chapter04_conflictChain.evidenceRefs.length).toBeGreaterThan(0);

      // Chapter 05: Mom Exhaustion Point
      expect(report.chapter05_momExhaustionPoint.exhaustionReason).toBeTruthy();
      expect(report.chapter05_momExhaustionPoint.comfortMessage).toBeTruthy();
      expect(report.chapter05_momExhaustionPoint.evidenceRefs.length).toBeGreaterThan(0);

      // Chapter 06: Three Phrases (or OMIT for low friction)
      if (report.chapter06_threePhrases.length > 0) {
        report.chapter06_threePhrases.forEach((p) => {
          expect(p.situation).toBeTruthy();
          expect(p.before).toBeTruthy();
          expect(p.after).toBeTruthy();
          expect(p.whyItMayHelp).toBeTruthy();
          expect(p.evidenceRefs.length).toBeGreaterThan(0);
        });
      }

      // Chapter 07: Three Actions
      expect(report.chapter07_threeActions.length).toBeGreaterThan(0);
      report.chapter07_threeActions.forEach((a) => {
        expect(a.actionTitle).toBeTruthy();
        expect(a.actionDetail).toBeTruthy();
        expect(a.evidenceRefs.length).toBeGreaterThan(0);
      });

      // Chapter 08: Core Promise Anchor
      expect(report.chapter08_corePromise.oneSentenceAnchor).toBeTruthy();
      expect(report.chapter08_corePromise.meaning).toBeTruthy();
      expect(report.chapter08_corePromise.evidenceRefs.length).toBeGreaterThan(0);
    });
  });

  it("2. Validates ZERO Safety Violations (Banned words, Inner-state, Long-term, Metaphors, Flattery)", () => {
    FAMILY_FIXTURES.forEach((fixture) => {
      const momEv = buildMomEvidence(fixture.momAnswers);
      const report = generateSignatureReport(
        fixture.childProfile,
        fixture.childEvidences,
        momEv,
        fixture.conflictInput,
        fixture.fortuneFacts
      );

      const lexicalViolations = runLexicalGuard(JSON.stringify(report));
      const structuredViolations = runStructuredClaimGuard(report);

      expect(lexicalViolations).toEqual([]);
      expect(structuredViolations).toEqual([]);
    });
  });

  it("3. Validates Low-Friction Family E specifics (no forced conflict, dynamic Chapter 05)", () => {
    const fixtureE = FAMILY_FIXTURES.find((f) => f.fixtureId === "E")!;
    const momEv = buildMomEvidence(fixtureE.momAnswers);
    const report = generateSignatureReport(
      fixtureE.childProfile,
      fixtureE.childEvidences,
      momEv,
      fixtureE.conflictInput,
      fixtureE.fortuneFacts
    );

    expect(report.chapter04_conflictChain.isCollaborative).toBe(true);
    expect(report.chapter04_conflictChain.title).toContain("Flow");
    expect(report.chapter04_conflictChain.steps[4].description).toContain("편안하게");
    expect(report.chapter04_conflictChain.whereToBreak.breakActionTitle).toContain("이어가기");

    // Dynamic Chapter 05
    expect(report.chapter05_momExhaustionPoint.isLowFriction).toBe(true);
    expect(report.chapter05_momExhaustionPoint.title).toBe("지금 우리 둘이 잘 맞는 지점");
    expect(report.chapter05_momExhaustionPoint.exhaustionReason).toContain("큰 마찰 없이 이어지고");
  });

  it("4. Validates Specific Non-flattering and Non-therapeutic Action & Anchor Copy", () => {
    // Family A Anchor
    const fixA = FAMILY_FIXTURES.find((f) => f.fixtureId === "A")!;
    const repA = generateSignatureReport(fixA.childProfile, fixA.childEvidences, buildMomEvidence(fixA.momAnswers), fixA.conflictInput);
    expect(repA.chapter08_corePromise.oneSentenceAnchor).toBe("하던 것을 끝낼 작은 틈을 주면, 다음 순서로 넘어가는 대화도 달라질 수 있어요.");
    expect(repA.chapter07_threeActions[0].whyItMayHelp).toContain("선택지를 만들 수 있어요");

    // Family B Anchor
    const fixB = FAMILY_FIXTURES.find((f) => f.fixtureId === "B")!;
    const repB = generateSignatureReport(fixB.childProfile, fixB.childEvidences, buildMomEvidence(fixB.momAnswers), fixB.conflictInput);
    expect(repB.chapter08_corePromise.oneSentenceAnchor).toBe("아이가 상황을 충분히 둘러볼 수 있는 시간을 함께 지켜봐 주는 것부터 시작해보세요.");

    // Family C Anchor
    const fixC = FAMILY_FIXTURES.find((f) => f.fixtureId === "C")!;
    const repC = generateSignatureReport(fixC.childProfile, fixC.childEvidences, buildMomEvidence(fixC.momAnswers), fixC.conflictInput);
    expect(repC.chapter08_corePromise.oneSentenceAnchor).toBe("설명보다 먼저, 지금 속상하다는 걸 짧게 알아채주는 것부터 시작해보세요.");
    expect(repC.chapter08_corePromise.oneSentenceAnchor).not.toContain("진정제");

    // Family D Anchor
    const fixD = FAMILY_FIXTURES.find((f) => f.fixtureId === "D")!;
    const repD = generateSignatureReport(fixD.childProfile, fixD.childEvidences, buildMomEvidence(fixD.momAnswers), fixD.conflictInput);
    expect(repD.chapter08_corePromise.oneSentenceAnchor).toBe("규칙의 테두리는 지키되, 그 안에서 아이가 직접 고를 수 있는 작은 틈을 열어주세요.");
    expect(repD.chapter05_momExhaustionPoint.comfortMessage).not.toContain("가정을 지키는 든든한 기준");

    // Family E Anchor
    const fixE = FAMILY_FIXTURES.find((f) => f.fixtureId === "E")!;
    const repE = generateSignatureReport(fixE.childProfile, fixE.childEvidences, buildMomEvidence(fixE.momAnswers), fixE.conflictInput);
    expect(repE.chapter08_corePromise.oneSentenceAnchor).toBe("아이의 신중한 속도를 존중하며 곁을 지켜주는 지금의 대화 방식을 편안하게 이어가보세요.");
    expect(repE.chapter05_momExhaustionPoint.comfortMessage).not.toContain("평생의");
    expect(repE.chapter05_momExhaustionPoint.comfortMessage).not.toContain("안전 울타리");
  });

  it("5. Validates Two-Person Summary and Real Session Data Integrity", () => {
    // Custom Real Session Input Simulation
    const realChildProfile: ChildProfile = {
      name: "리호",
      birthDate: "2023-08-10",
      birthTimeKnown: true,
      birthTime: "14:30",
      gender: "boy",
    };
    const realAnswers = {
      transition: 1 as const, // prefers_completion_before_transition
      self_assertion: 4 as const, // strong_self_direction
    };
    const realChildEv = buildBehaviorEvidence(realAnswers);
    const realMomAnswers = {
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
    };
    const realMomEv = buildMomEvidence(realMomAnswers);
    const realConflict: CurrentConflictInput = {
      concernId: "discipline",
      scenarioId: "sc_discipline_instruction",
      childFirstReaction: "블록 놀이를 다 끝내고 가겠다고 손을 떼지 않음",
      momFirstReaction: "시간이 늦을까 봐 '빨리 가자' 하고 손을 잡아당김",
      subsequentEscalation: "아이가 바닥에 앉아 울먹이며 실랑이가 이어짐",
      recentFrequency: "daily",
      momTypicalPhrase: "빨리 나와, 늦었어!",
    };
    const realMomProfile = { name: "지우맘", birthDate: "1992-03-20" };

    const report = generateSignatureReport(
      realChildProfile,
      realChildEv,
      realMomEv,
      realConflict,
      null,
      realMomProfile
    );

    // Identity Preserved
    expect(report.meta.childName).toBe("리호");
    expect(report.meta.momName).toBe("지우맘");

    // Two-Person Summary
    expect(report.twoPersonSummary).toBeDefined();
    expect(report.twoPersonSummary!.childKeywords.length).toBeGreaterThan(0);
    expect(report.twoPersonSummary!.momKeywords.length).toBeGreaterThan(0);
    expect(report.twoPersonSummary!.misalignedPoint).toContain("리호");
    expect(report.twoPersonSummary!.misalignedPoint).toContain("지우맘");

    // No Cross-Mode Fixture Leakage
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("민준");
    expect(serialized).not.toContain("서연");
    expect(serialized).not.toContain("도윤");
    expect(serialized).not.toContain("하은");
    expect(serialized).not.toContain("지호");
  });

  it("6. P2.2V.2 Validates Real Mom Fortune Facts, Fortune Reflection Layer & Food Concern Alignment (열무)", () => {
    // 1. Setup Real Session for '열무' (남아, 만 2세 4개월, 2024-04-15생)
    const childProfile: ChildProfile = {
      name: "열무",
      birthDate: "2024-04-15",
      birthTimeKnown: true,
      birthTime: "09:30",
      gender: "boy",
    };
    const childAnswers = {
      new_environment: 1 as const, // takes_long_to_observe
      transition: 1 as const, // prefers_completion
    };
    const childEv = buildBehaviorEvidence(childAnswers);

    const momProfile: CaregiverProfile = {
      role: "mother",
      roleLabel: "엄마",
      displayName: "열무맘",
      birthDate: "1991-08-20",
      birthTimeKnown: false,
    };
    const momAnswers = {
      time_pressure_style: "opt_time_control",
      instruction_resistance_style: "opt_inst_firm",
    };
    const momEv = buildMomEvidence(momAnswers);

    const conflictInput: CurrentConflictInput = {
      concernId: "meal",
      scenarioId: "sc_meal_new_food_reject",
      childFirstReaction: "처음 보는 반찬을 보자마자 입을 닫고 밀어냄",
      momFirstReaction: "영양 생각에 '한 입만 먹어보자' 하고 숟가락을 건넴",
      subsequentEscalation: "아이가 고개를 돌리며 숟가락을 밀치고 식탁 분위기가 굳어짐",
      recentFrequency: "daily",
      momTypicalPhrase: "한 입만 먹어보자, 진짜 맛있어",
    };

    const report = generateSignatureReport(
      childProfile,
      childEv,
      momEv,
      conflictInput,
      null, // Child fortune calculated inside or passed
      momProfile
    );

    // Identity & Meta
    expect(report.meta.childName).toBe("열무");
    expect(report.meta.momName).toBe("열무맘");
    expect(report.meta.concernLabel).toContain("식습관");

    // Fortune Relationship Layer
    expect(report.fortuneRelationship).toBeDefined();
    expect(report.fortuneRelationship!.childHints.length).toBeGreaterThan(0);
    expect(report.fortuneRelationship!.childHints[0]).toContain("열무의 출생정보에서는");
    expect(report.fortuneRelationship!.momHints.length).toBeGreaterThan(0);
    expect(report.fortuneRelationship!.momHints[0]).toContain("열무맘의 출생정보에서는");
    expect(report.fortuneRelationship!.reflectionText).toContain("두 사람의 출생정보를 함께 보면");
    expect(report.fortuneRelationship!.observationContrastText).toContain("현재 관찰된 행동을 더 중요하게 반영했습니다");

    // Zero Compatibility Score Verification
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("88점");
    expect(serialized).not.toContain("찰떡궁합");
    expect(serialized).not.toContain("궁합 점수");
    expect(serialized).not.toContain("좋은 궁합");
    expect(serialized).not.toContain("나쁜 궁합");

    // Concern is Report Anchor: Food/Meal Context Verification
    expect(report.chapter01_recurringScene.narrative).toContain("식사 시간이나 식탁 앞에서");
    expect(report.chapter01_recurringScene.narrative).toContain("반찬");
    expect(report.chapter01_recurringScene.sceneKeywords).toContain("식사 시간");
    expect(report.chapter01_recurringScene.sceneKeywords).toContain("식습관/편식");

    // ZERO Wrong Concern Fallback (no outing / shoes / play transition in food report)
    expect(report.chapter01_recurringScene.narrative).not.toContain("외출 준비");
    expect(report.chapter01_recurringScene.narrative).not.toContain("신발");
    expect(report.chapter01_recurringScene.narrative).not.toContain("놀이터");

    // Conflict Chain is Food Context (Literal User Input Grounded)
    expect(report.chapter04_conflictChain.steps[0].description).toContain("식사");
    expect(report.chapter04_conflictChain.steps[1].description).toContain("한 입만 먹어보자");
    expect(report.chapter04_conflictChain.steps[2].description).toContain("처음 보는 반찬");
    expect(report.chapter04_conflictChain.steps[3].description).toContain("숟가락");

    // Phrases are Food Context
    expect(report.chapter06_threePhrases.length).toBeGreaterThan(0);
    expect(report.chapter06_threePhrases[0].situation).toContain("음식");

    // Actions are Food Context
    expect(report.chapter07_threeActions.length).toBeGreaterThan(0);
    expect(report.chapter07_threeActions[0].actionTitle).toContain("음식");

    // Before / After Effect Copy Verification (Behavioral only, no internal state guarantee)
    expect(report.chapter06_threePhrases[0].whyItMayHelp).toBe(
      "바로 먹어야 하는 선택지만 주기보다, 냄새나 모양을 먼저 살펴보는 선택지도 함께 열어줄 수 있어요."
    );

    // Conflict Chain Step 5 is Inferred/Template with Possibility tone
    expect(report.chapter04_conflictChain.steps[4].description).toContain("피곤하고 부담스럽게 느껴질 수도 있어요");

    // Anchor is Food Context
    expect(report.chapter08_corePromise.oneSentenceAnchor).toContain("식탁");

    // Fixture Leakage: 0
    expect(serialized).not.toContain("민준");
    expect(serialized).not.toContain("서연");
    expect(serialized).not.toContain("도윤");
    expect(serialized).not.toContain("하은");
    expect(serialized).not.toContain("지호");
  });

  it("7. P2.2V.4 Validates Food Micro Check Evidence Integration", () => {
    const foodAnswers = {
      new_food_reaction: "inspect_smell_shape" as const,
      preference_balance: "favorite_only_first" as const,
      prompt_response: "stronger_refusal_on_prompt" as const,
      meal_flow_block: "put_down_spoon_divert" as const,
    };
    const foodEvs = buildFoodEvidence(foodAnswers);
    expect(foodEvs.length).toBe(4);
    expect(foodEvs.map((e) => e.observedPattern)).toEqual([
      "new_food_hesitation",
      "food_familiar_preference",
      "food_refusal_on_pressure",
      "meal_pacing_autonomy",
    ]);
    const serialized = JSON.stringify(foodEvs);
    expect(serialized).not.toContain("taste_sensitivity");
    expect(serialized).not.toContain("sensory");
    expect(serialized).not.toContain("감각예민");
  });
});
