// P2.2V.9 — Copy Integrity QA (하람 × 아빠 × 수면)

import { describe, expect, it } from "vitest";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildSleepEvidence } from "../questionnaire/sleepQuestions";
import { computeFortuneFacts } from "../fortune/engine";
import type { CaregiverProfile, ChildProfile, CurrentConflictInput } from "../types";

const childProfile: ChildProfile = {
  name: "하람",
  birthDate: "2023-03-15",
  birthTimeKnown: false,
  gender: "girl",
};

const fatherProfile: CaregiverProfile = {
  role: "father",
  roleLabel: "아빠",
  birthDate: "1990-05-20",
  birthTimeKnown: false,
};

const sleepConflict: CurrentConflictInput = {
  concernId: "sleep",
  scenarioId: "sc_sleep_bedtime_delay",
  childFirstReaction: "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함",
  momFirstReaction: "'이제 자야 할 시간이야, 빨리 누워' 하고 재촉함",
  subsequentEscalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
  recentFrequency: "several_times_a_week",
  momTypicalPhrase: "이제 자야 할 시간이야, 빨리 누워",
};

function buildReport() {
  return generateSignatureReport(
    childProfile,
    [
      ...buildBehaviorEvidence({ new_environment: 2, transition: 2, self_assertion: 2 }),
      ...buildSleepEvidence({
        bedtime_transition: "sleep_transition_needs_completion",
        routine_order: "sleep_routine_prefers_familiar_sequence",
        lights_off_departure: "sleep_separation_requests_presence",
        pre_sleep: "sleep_prebed_continues_activity",
      }),
    ],
    buildMomEvidence({
      time_pressure_style: "opt_time_control",
      emotion_coping_style: "opt_emo_explain",
      instruction_resistance_style: "opt_inst_firm",
      routine_flexibility_style: "opt_rout_replan",
      conflict_recovery_style: "opt_rec_repair",
    }),
    sleepConflict,
    computeFortuneFacts(childProfile.birthDate, childProfile.birthTimeKnown),
    fatherProfile
  );
}

function allCustomerCopy(report: ReturnType<typeof buildReport>): string {
  const parts = [
    report.chapter01_recurringScene.narrative,
    report.twoPersonSummary?.misalignedPoint ?? "",
    report.chapter02_perspectiveGap.momPerspective.intention,
    report.chapter02_perspectiveGap.momPerspective.possibleFeeling,
    report.chapter02_perspectiveGap.childPerspective.possibleInterpretation,
    report.chapter02_perspectiveGap.childPerspective.possibleFeeling,
    report.chapter03_interactionPattern.synthesis,
    ...report.chapter04_conflictChain.steps.map((s) => s.description),
    ...report.chapter06_threePhrases.map((p) => `${p.before}${p.after}${p.whyItMayHelp}`),
    ...report.chapter07_threeActions.map((a) => `${a.actionTitle}${a.actionDetail}${a.whyItMayHelp ?? ""}`),
    report.chapter08_corePromise.oneSentenceAnchor,
    report.chapter08_corePromise.meaning,
    report.fortuneRelationship?.reflectionText ?? "",
    report.chapter05_momExhaustionPoint.exhaustionReason,
    report.chapter05_momExhaustionPoint.comfortMessage,
  ];
  return parts.join("\n");
}

describe("P2.2V.9 Copy Integrity — 하람 × 아빠 × 수면", () => {
  it("Copy QA — Broken Korean 0", () => {
    const copy = allCustomerCopy(buildReport());
    expect(copy).not.toMatch(/하람가|하람는|작은 티이|앞두고\./);
    expect(copy).not.toMatch(/함\s*[""「]/);
  });

  it("Copy QA — Duplicate Quote 0", () => {
    const narrative = buildReport().chapter01_recurringScene.narrative;
    const phrase = "이제 자야 할 시간이야, 빨리 누워";
    const occurrences = narrative.split(phrase).length - 1;
    expect(occurrences).toBeLessThanOrEqual(1);
  });

  it("Copy QA — Unsupported Inner State 0", () => {
    const copy = allCustomerCopy(buildReport());
    const banned = [
      "돕고 싶은 마음",
      "존중받고 싶은",
      "이 순간을 잘 넘기고 싶은",
      "회복하도록",
      "받아들여질 수 있어요",
      "여겨질 수 있어요",
      "필요해 보여",
      "필요한 아이",
      "작은 틈이 필요",
      "마무리가 필요한",
    ];
    for (const term of banned) {
      expect(copy).not.toContain(term);
    }
    expect(buildReport().chapter02_perspectiveGap.momPerspective.possibleFeeling).toBe("");
    expect(buildReport().chapter02_perspectiveGap.childPerspective.possibleFeeling).toBe("");
  });

  it("Copy QA — Caregiver Psychology Guess 0", () => {
    const report = buildReport();
    const ch5 = `${report.chapter05_momExhaustionPoint.title}${report.chapter05_momExhaustionPoint.exhaustionReason}${report.chapter05_momExhaustionPoint.comfortMessage}`;
    expect(ch5).not.toMatch(/지치|피로|잘못된 것이 아니|더 지치/);
    expect(report.chapter05_momExhaustionPoint.title).toContain("반복되는 반응");
  });

  it("Copy QA — Generic Template as Fact 0", () => {
    const steps = buildReport().chapter04_conflictChain.steps.map((s) => s.description).join("\n");
    expect(steps).not.toContain("권유와 거부가 반복되면");
    expect(steps).not.toContain("피곤하고 부담스럽게");
    expect(buildReport().chapter04_conflictChain.steps.length).toBe(4);
  });

  it("Copy QA — AI-sounding / Fortune Overclaim 0", () => {
    const copy = allCustomerCopy(buildReport());
    expect(copy).not.toContain("기본 결");
    expect(copy).not.toContain("작은 마침표");
    expect(copy).not.toContain("기질적 특성");
    expect(copy).not.toContain("스며드");
    expect(copy).not.toContain("천천히 스며");
    expect(copy).not.toContain("보호자는 더 지치");
    expect(copy).toContain("한 번 살펴보는");
    expect(copy).toContain("방향을 먼저 정하려는");
  });

  it("Copy QA — Conflict chain steps are distinct", () => {
    const steps = buildReport().chapter04_conflictChain.steps;
    expect(steps[1]?.description).not.toBe(steps[2]?.description);
    expect(steps[1]?.description).not.toBe(steps[0]?.description);
  });

  it("Copy QA — Customer English / Concern / Leakage 0", () => {
    const report = buildReport();
    const copy = allCustomerCopy(report);
    expect(copy).not.toContain("Conflict Chain");
    expect(copy).not.toContain("식탁");
    expect(copy).not.toContain("엄마");
    expect(report.meta.concernLabel).toContain("수면");
  });
});
