// interaction.test.ts: P2.1 인터랙션 모델 및 13대 원칙 전체 자동 검증

import { describe, expect, it } from "vitest";
import { MOM_QUESTIONS, TOTAL_MOM_QUESTIONS } from "@/lib/questionnaire/momQuestions";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { matchInteractionRule } from "@/lib/interaction/interactionEngine";
import { generateSignatureReport } from "@/lib/interaction/signatureReportGenerator";
import { generateChildDeepReport } from "@/lib/interaction/childReportGenerator";
import { validateSignatureReportSafety, BANNED_LEXICAL_TERMS } from "@/lib/interaction/safetyValidators";
import { FAMILY_FIXTURES } from "@/lib/interaction/fixtures";

describe("P2.1 INTERACTION MODEL SPEC & LOCKS TEST", () => {
  // 1. Mom Mini Check No Score & Structure
  it("1. Mom Mini Check has 5 questions and NO numeric score", () => {
    expect(TOTAL_MOM_QUESTIONS).toBe(5);
    expect(MOM_QUESTIONS.length).toBe(5);

    MOM_QUESTIONS.forEach((q) => {
      expect(q.options.length).toBe(4);
      q.options.forEach((opt) => {
        expect(opt).toHaveProperty("optionId");
        expect(opt).toHaveProperty("patternId");
        expect(opt).toHaveProperty("label");
        // value 속성이 없어야 함 (No numeric score)
        expect((opt as any).value).toBeUndefined();
      });
    });
  });

  // 2. Mom Options Neutrality Check
  it("2. Mom Options do not contain good-mom bias or obvious superiority", () => {
    MOM_QUESTIONS.forEach((q) => {
      q.options.forEach((opt) => {
        expect(opt.label).not.toMatch(/완벽하게|훌륭하게|언제나 사랑으로|다정하게 다 받아/);
      });
    });
  });

  // 3. Mom Evidence confidence <= medium
  it("3. Mom Evidence confidence is strictly limited to medium (never high)", () => {
    const mockAnswers = {
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
    };
    const evidence = buildMomEvidence(mockAnswers);
    expect(evidence.length).toBe(2);
    evidence.forEach((e) => {
      expect(e.confidence).toBe("medium");
      expect(e.confidence).not.toBe("high");
    });
  });

  // 4. Interaction Rules & No Psychological Certainty
  it("4. Interaction rules do not contain psychological certainty or arbitrary precision numbers", () => {
    const forbiddenPsychTerms = [
      "결사항전",
      "감정 뇌",
      "감정뇌",
      "안전기지",
      "불안 증폭",
      "트라우마",
    ];

    FAMILY_FIXTURES.forEach((f) => {
      const momEvidence = buildMomEvidence(f.momAnswers);
      const match = matchInteractionRule(f.childEvidences, momEvidence, f.conflictInput.concernId);
      const jsonStr = JSON.stringify(match.rule);

      forbiddenPsychTerms.forEach((term) => {
        expect(jsonStr).not.toContain(term);
      });

      // Rule 레벨에 3분, 10초 등 숫자 처방 저장 금지
      expect(match.rule.whereToBreakSummary.breakActionTitle).not.toMatch(/\d+분|\d+초/);
      expect(match.rule.whereToBreakSummary.breakActionDetail).not.toMatch(/\d+분|\d+초/);
    });
  });

  // 5. No-Match Policy: generic conflict 창작 금지 및 INSUFFICIENT_INTERACTION_EVIDENCE fallback
  it("5. No-Match Policy correctly falls back to INSUFFICIENT_INTERACTION_EVIDENCE without fabricating conflicts", () => {
    // Unmatched Synthetic Case
    const unmatchedChildEv = [
      {
        domain: "play_immersion" as const,
        axis: "play_focus_style" as const,
        patternId: "unrelated_focus_pattern",
        observedLabel: "특정 놀이에 깊게 빠져드는 편이에요.",
        strength: "medium" as const,
        source: { scope: "general" as const, questionIds: ["q6_play_immersion"] },
      },
    ];
    const unmatchedMomAnswers = {
      time_pressure_style: "opt_time_wait" as const,
      emotion_coping_style: "opt_emo_redirect" as const,
      instruction_resistance_style: "opt_inst_defer" as const,
      routine_flexibility_style: "opt_rout_ease" as const,
      conflict_recovery_style: "opt_rec_natural" as const,
    };
    const momEvidence = buildMomEvidence(unmatchedMomAnswers);
    const match = matchInteractionRule(unmatchedChildEv, momEvidence, "focus_play");

    expect(match.isFallback).toBe(true);
    expect(match.rule.ruleId).toBe("INSUFFICIENT_INTERACTION_EVIDENCE");
    expect(match.matchConfidence).toBe("low");
    expect(match.rule.interactionType).toBe("neutral");

    // Fixture D (Family D: 자기 방식 강한 아이 x 단호한 훈육)
    const fixtureD = FAMILY_FIXTURES.find((f) => f.fixtureId === "D")!;
    const momEvidenceD = buildMomEvidence(fixtureD.momAnswers);
    const matchD = matchInteractionRule(fixtureD.childEvidences, momEvidenceD, fixtureD.conflictInput.concernId);
    expect(matchD.rule.ruleId).toBe("rule_friction_autonomy_vs_firmness");
    expect(matchD.rule.interactionType).toBe("friction");
  });

  // 6. Low-Friction Fixture E (Unknown birth time + Collaborative)
  it("6. Fixture E supports Unknown birth time and Low-Friction Collaborative outcome", () => {
    const fixtureE = FAMILY_FIXTURES.find((f) => f.fixtureId === "E")!;
    expect(fixtureE.childProfile.birthTimeKnown).toBe(false);

    const momEvidence = buildMomEvidence(fixtureE.momAnswers);
    const match = matchInteractionRule(fixtureE.childEvidences, momEvidence, fixtureE.conflictInput.concernId);

    expect(match.rule.ruleId).toBe("rule_collab_observation_and_patience");
    expect(match.rule.interactionType).toBe("collaborative");
    expect(match.rule.title).toContain("어우러질 때");
  });

  // 7. Signature Report Provenance & 2-Layer Safety Validation across all 5 Fixtures
  it("7. Generates Signature Report with evidenceRefs and passes 2-Layer Safety Validation", () => {
    FAMILY_FIXTURES.forEach((f) => {
      const momEvidence = buildMomEvidence(f.momAnswers);
      const report = generateSignatureReport(
        f.childProfile,
        f.childEvidences,
        momEvidence,
        f.conflictInput
      );

      // Evidence Provenance 검증
      expect(report.chapter01_recurringScene.evidenceRefs.length).toBeGreaterThan(0);
      expect(report.chapter02_perspectiveGap.evidenceRefs.length).toBeGreaterThan(0);
      expect(report.chapter03_interactionPattern.evidenceRefs.length).toBeGreaterThan(0);
      expect(report.chapter04_conflictChain.evidenceRefs.length).toBeGreaterThan(0);
      if (report.chapter06_threePhrases.length > 0) {
        expect(report.chapter06_threePhrases[0].evidenceRefs.length).toBeGreaterThan(0);
      }
      expect(report.chapter07_threeActions[0].evidenceRefs.length).toBeGreaterThan(0);
      expect(report.chapter08_corePromise.evidenceRefs.length).toBeGreaterThan(0);

      // 2-Layer Safety Validation
      const validation = validateSignatureReportSafety(report);
      expect(validation.passed).toBe(true);
      expect(validation.violations).toEqual([]);
    });
  });

  // 8. Child Deep Report generation
  it("8. Generates Child Deep Report successfully", () => {
    const fixtureA = FAMILY_FIXTURES[0];
    const report = generateChildDeepReport(fixtureA.childProfile, fixtureA.childEvidences);
    expect(report.meta.childName).toBe("민준");
    expect(report.chapters.length).toBe(fixtureA.childEvidences.length);
    expect(report.overview.keywords.length).toBeGreaterThan(0);
  });
});
