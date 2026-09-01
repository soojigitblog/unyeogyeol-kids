// P2.2V.8 — Sleep Concern Paid Value Gate Tests

import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import { buildSleepEvidence } from "../questionnaire/sleepQuestions";
import { computeFortuneFacts } from "../fortune/engine";
import { subj } from "@/lib/caregiver";
import type { CaregiverProfile, ChildProfile, CurrentConflictInput } from "../types";

const childProfile: ChildProfile = {
  name: "하람",
  birthDate: "2023-03-15",
  birthTimeKnown: false,
  gender: "girl",
};

const childAnswers = {
  new_environment: 2 as const,
  transition: 2 as const,
  self_assertion: 2 as const,
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

const sleepAnswers = {
  bedtime_transition: "sleep_transition_needs_completion" as const,
  routine_order: "sleep_routine_prefers_familiar_sequence" as const,
  lights_off_departure: "sleep_separation_requests_presence" as const,
  pre_sleep: "sleep_prebed_continues_activity" as const,
};

const momAnswersPace = {
  time_pressure_style: "opt_time_control",
  emotion_coping_style: "opt_emo_explain",
  instruction_resistance_style: "opt_inst_firm",
  routine_flexibility_style: "opt_rout_replan",
  conflict_recovery_style: "opt_rec_repair",
};

function buildSleepReport(momAnswers = momAnswersPace) {
  const sleepEv = buildSleepEvidence(sleepAnswers);
  const fortuneFacts = computeFortuneFacts(childProfile.birthDate, childProfile.birthTimeKnown);
  return generateSignatureReport(
    childProfile,
    [...buildBehaviorEvidence(childAnswers), ...sleepEv],
    buildMomEvidence(momAnswers),
    sleepConflict,
    fortuneFacts,
    fatherProfile
  );
}

function formatFullCustomerReport(report: ReturnType<typeof generateSignatureReport>): string {
  const ch2 = report.chapter02_perspectiveGap;
  const ch3 = report.chapter03_interactionPattern;
  const ch4 = report.chapter04_conflictChain;
  const ch5 = report.chapter05_momExhaustionPoint;
  const fortune = report.fortuneRelationship;

  return [
    "=== 1. Cover ===",
    `우리 아이 × 나 관계 사용설명서`,
    `왜 우리 둘은 같은 순간에 자꾸 부딪힐까요?`,
    `${subj(childProfile.name ?? "우리 아이")} 움직이는 방식과 ${subj(report.meta.momName ?? report.meta.caregiverRoleLabel ?? "보호자")} 반응하는 방식이 어디에서 만나고 엇갈리는지 직접 알려주신 장면을 바탕으로 살펴봤어요.`,
    `아이: ${report.meta.childName} (${report.meta.childAgeDisplay})`,
    `나: ${report.meta.momName || report.meta.caregiverRoleLabel}`,
    `고민: ${report.meta.concernLabel}`,
    "",
    "=== 2. Two Person Summary ===",
    report.twoPersonSummary?.childSummary ?? "",
    report.twoPersonSummary?.momSummary ?? "",
    report.twoPersonSummary?.misalignedPoint ?? "",
    "",
    "=== 3. 반복되는 수면 장면 ===",
    report.chapter01_recurringScene.title,
    report.chapter01_recurringScene.narrative,
    "",
    "=== 4. 같은 순간, 서로 달랐던 행동 ===",
    `[${report.meta.caregiverRoleLabel}에게서 확인된 반응] ${ch2.momPerspective.intention}`,
    `[${report.meta.childName}에게서 관찰된 행동] ${ch2.childPerspective.possibleInterpretation}`,
    "",
    "=== 5. Interaction 설명 ===",
    ch3.title,
    ch3.synthesis,
    "",
    "=== 6. 반복되는 갈등 흐름 ===",
    ch4.title ?? "",
    ...ch4.steps.map((s) => `${s.stepNumber}. [${s.actor}] ${s.description}`),
    "",
    "=== 7. 여기서 끊어볼 수 있어요 ===",
    ch4.whereToBreak.breakActionTitle,
    ch4.whereToBreak.breakActionDetail,
    "",
    "=== 8. Before / After ===",
    ...report.chapter06_threePhrases.map(
      (p) => `상황: ${p.situation}\n전: ${p.before}\n후: ${p.after}\n${p.whyItMayHelp}`
    ),
    "",
    "=== 9. 행동 제안 ===",
    ...report.chapter07_threeActions.map(
      (a) => `${a.actionTitle}\n${a.actionDetail}${a.whyItMayHelp ? `\n${a.whyItMayHelp}` : ""}`
    ),
    "",
    "=== 10. 출생정보 관계 힌트 ===",
    fortune?.reflectionText ?? report.twoPersonSummary?.fortuneRelationshipHint ?? "(출생정보 힌트 없음)",
    "",
    "=== 11. Final Anchor ===",
    report.chapter08_corePromise.oneSentenceAnchor,
    ...(report.chapter08_corePromise.meaning
      ? [report.chapter08_corePromise.meaning]
      : []),
    "",
    "=== CH05 반복되는 반응 ===",
    ch5.title ?? "",
    ch5.exhaustionReason,
    ch5.comfortMessage,
  ].join("\n");
}

function extractCustomerCopy(report: ReturnType<typeof generateSignatureReport>): string {
  return [
    report.meta.concernLabel,
    report.meta.caregiverRoleLabel,
    report.twoPersonSummary?.childSummary,
    report.twoPersonSummary?.momSummary,
    report.twoPersonSummary?.misalignedPoint,
    report.chapter01_recurringScene.narrative,
    report.chapter04_conflictChain.whereToBreak.breakActionTitle,
    ...report.chapter06_threePhrases.map((p) => `${p.before}${p.after}${p.whyItMayHelp}`),
    ...report.chapter07_threeActions.map((a) => `${a.actionTitle}${a.actionDetail}`),
    report.chapter08_corePromise.oneSentenceAnchor,
  ].join("\n");
}

describe("P2.2V.8 Sleep Concern Gate", () => {
  it("Sleep Test 1 — sleep concern에서 meal template 0", () => {
    const report = buildSleepReport();
    const copy = extractCustomerCopy(report);
    expect(copy).not.toContain("식탁");
    expect(copy).not.toContain("반찬");
    expect(copy).not.toContain("식사 시간이나");
    expect(report.chapter01_recurringScene.narrative).toContain("잠자리");
  });

  it("Sleep Test 2 — sleep Micro Check 실제 pattern 생성 + 정식 domain/axis", () => {
    const ev = buildSleepEvidence(sleepAnswers);
    expect(ev.length).toBe(4);
    expect(ev.map((e) => e.patternId)).toContain("sleep_transition_needs_completion");
    expect(ev.map((e) => e.patternId)).toContain("sleep_prebed_continues_activity");
    for (const e of ev) {
      expect(e.source.scope).toBe("concern_micro");
      if (e.source.scope === "concern_micro") {
        expect(e.source.concernId).toBe("sleep");
      }
      expect(e.domain).toMatch(/^sleep_/);
    }
  });

  it("Sleep Test 3 — sleep rule match (transition vs pace)", () => {
    const report = buildSleepReport();
    expect(report.chapter03_interactionPattern.synthesis).toContain("아빠");
    expect(report.chapter03_interactionPattern.synthesis).not.toContain("엄마");
    expect(report.chapter06_threePhrases.length).toBeGreaterThan(0);
    expect(report.chapter07_threeActions.length).toBeGreaterThanOrEqual(2);
  });

  it("Sleep Test 4 — sleep phrase evidenceRefs", () => {
    const report = buildSleepReport();
    for (const phrase of report.chapter06_threePhrases) {
      expect(phrase.evidenceRefs?.length).toBeGreaterThan(0);
      expect(phrase.evidenceRefs?.some((r) => r.includes("sleep") || r.includes("concern:sleep"))).toBe(true);
    }
  });

  it("Sleep Test 5 — sleep action evidenceRefs", () => {
    const report = buildSleepReport();
    for (const action of report.chapter07_threeActions) {
      expect(action.evidenceRefs?.length).toBeGreaterThan(0);
    }
  });

  it("Sleep Test 6 — sleep no-evidence → phrases/actions 비어 있지 않을 때만 rule match", () => {
    const reportNoSleep = generateSignatureReport(
      childProfile,
      buildBehaviorEvidence(childAnswers),
      buildMomEvidence(momAnswersPace),
      sleepConflict,
      null,
      fatherProfile
    );
    expect(reportNoSleep.chapter06_threePhrases.length).toBe(0);
    expect(reportNoSleep.chapter07_threeActions.length).toBeLessThanOrEqual(1);
  });

  it("Sleep Test 7 — routine rule match (순서 변경)", () => {
    const report = generateSignatureReport(
      childProfile,
      [
        ...buildBehaviorEvidence(childAnswers),
        ...buildSleepEvidence({
          bedtime_transition: "sleep_transition_accepts_bedtime",
          routine_order: "sleep_routine_resists_change",
          lights_off_departure: "sleep_separation_accepts",
          pre_sleep: "sleep_prebed_settled",
        }),
      ],
      buildMomEvidence({
        ...momAnswersPace,
        routine_flexibility_style: "opt_rout_replan",
      }),
      sleepConflict,
      null,
      fatherProfile
    );
    const copy = extractCustomerCopy(report);
    expect(copy).toContain("순서");
    expect(report.chapter07_threeActions.some((a) => a.actionTitle.includes("순서"))).toBe(true);
  });

  it("Sleep Test 8 — REAL SESSION copy dump (하람×아빠×수면)", () => {
    const report = buildSleepReport();
    const fullCopy = formatFullCustomerReport(report);
    fs.writeFileSync(path.resolve("public/p228-report-copy.txt"), fullCopy, "utf8");
    expect(fullCopy).toContain("하람");
    expect(fullCopy).toContain("아빠");
    expect(fullCopy).not.toContain("식탁");
  });

  it("Customer UI Test — 금지 영문 노출 0 (리포트 본문)", () => {
    const report = buildSleepReport();
    const copy = extractCustomerCopy(report);
    for (const banned of ["Conflict Chain", "Collaboration Flow", "Signature Report", "OUR RELATIONSHIP ANCHOR"]) {
      expect(copy).not.toContain(banned);
    }
  });
});
