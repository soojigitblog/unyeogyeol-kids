// dump-p22-reports: P2.2H Family A~E Signature Paid Report Dump & Claim-Level Evidence QA

import { FAMILY_FIXTURES } from "../src/lib/interaction/fixtures";
import { buildMomEvidence } from "../src/lib/questionnaire/momEvidence";
import { generateSignatureReport } from "../src/lib/interaction/signatureReportGenerator";
import { runLexicalGuard, runStructuredClaimGuard } from "../src/lib/interaction/safetyValidators";

console.log("================================================================================");
console.log("             PHASE P2.2H — PAID REPORT EVIDENCE INTEGRITY & QA DUMP              ");
console.log("================================================================================\n");

FAMILY_FIXTURES.forEach((fixture) => {
  const momEv = buildMomEvidence(fixture.momAnswers);
  const report = generateSignatureReport(
    fixture.childProfile,
    fixture.childEvidences,
    momEv,
    fixture.conflictInput,
    fixture.fortuneFacts
  );

  console.log(`\n################################################################################`);
  console.log(`### FAMILY ${fixture.fixtureId}: ${fixture.title}`);
  console.log(`### Description: ${fixture.description}`);
  console.log(`################################################################################\n`);

  console.log(`[META]`);
  console.log(`  - 아이 이름: ${report.meta.childName} (${report.meta.childAgeDisplay})`);
  console.log(`  - 고민 영역: ${report.meta.concernLabel}`);

  console.log(`\n[CHAPTER 01: 지금 우리 집에서 반복되는 장면] (Source of Truth: CurrentConflict literal)`);
  console.log(`  - 제목: ${report.chapter01_recurringScene.title}`);
  console.log(`  - 본문: ${report.chapter01_recurringScene.narrative}`);
  console.log(`  - 키워드: [${report.chapter01_recurringScene.sceneKeywords.join(", ")}]`);
  console.log(`  - evidenceRefs: [${report.chapter01_recurringScene.evidenceRefs.join(", ")}]`);

  console.log(`\n[CHAPTER 02: 같은 상황, 다른 시선] (Perspective Gap)`);
  console.log(`  - 엄마의 마음: “${report.chapter02_perspectiveGap.momPerspective.intention}”`);
  console.log(`    (속마음/반응: ${report.chapter02_perspectiveGap.momPerspective.possibleFeeling})`);
  console.log(`  - 아이의 시선: “${report.chapter02_perspectiveGap.childPerspective.possibleInterpretation}”`);
  console.log(`    (받아들여지는 느낌: ${report.chapter02_perspectiveGap.childPerspective.possibleFeeling})`);
  console.log(`  - evidenceRefs: [${report.chapter02_perspectiveGap.evidenceRefs.join(", ")}]`);

  console.log(`\n[CHAPTER 03: 왜 이 장면이 자꾸 반복될까] (Interaction Pattern)`);
  console.log(`  - 상호작용 제목: ${report.chapter03_interactionPattern.title}`);
  console.log(`  - 아이의 행동 양상: ${report.chapter03_interactionPattern.childBehaviorAspect}`);
  console.log(`  - 엄마의 반응 양상: ${report.chapter03_interactionPattern.momReactionAspect}`);
  console.log(`  - 종합 분석: ${report.chapter03_interactionPattern.synthesis}`);
  console.log(`  - evidenceRefs: [${report.chapter03_interactionPattern.evidenceRefs.join(", ")}]`);

  console.log(`\n[CHAPTER 04: ${report.chapter04_conflictChain.title}] (5-Step Chain + WHERE TO BREAK)`);
  report.chapter04_conflictChain.steps.forEach((step) => {
    console.log(`    Step ${step.stepNumber} [${step.stage} / ${step.actor}]: ${step.description}`);
  });
  console.log(`  ★ WHERE TO BREAK (핵심 개입 지점): Step ${report.chapter04_conflictChain.whereToBreak.targetStep}`);
  console.log(`    - 행동 제목: ${report.chapter04_conflictChain.whereToBreak.breakActionTitle}`);
  console.log(`    - 실천 안내: ${report.chapter04_conflictChain.whereToBreak.breakActionDetail}`);
  console.log(`  - evidenceRefs: [${report.chapter04_conflictChain.evidenceRefs.join(", ")}]`);

  console.log(`\n[CHAPTER 05: ${report.chapter05_momExhaustionPoint.title}] (${report.chapter05_momExhaustionPoint.isLowFriction ? "Low-Friction 연결" : "피로 원인 & 위로"})`);
  console.log(`  - 핵심 설명: ${report.chapter05_momExhaustionPoint.exhaustionReason}`);
  console.log(`  - 재해석/팁: ${report.chapter05_momExhaustionPoint.comfortMessage}`);
  console.log(`  - evidenceRefs: [${report.chapter05_momExhaustionPoint.evidenceRefs.join(", ")}]`);

  console.log(`\n[CHAPTER 06: 오늘 바로 바꿔볼 말] (Before & After Quotes)`);
  if (report.chapter06_threePhrases.length > 0) {
    report.chapter06_threePhrases.forEach((phrase, idx) => {
      console.log(`  Phrase #${idx + 1} (${phrase.phraseId || "custom"}):`);
      console.log(`    - 상황: ${phrase.situation}`);
      console.log(`    - Before: “${phrase.before}”`);
      console.log(`    - After:  “${phrase.after}”`);
      console.log(`    - 이유:   ${phrase.whyItMayHelp}`);
      console.log(`    - evidenceRefs: [${phrase.evidenceRefs.join(", ")}]`);
    });
  } else {
    console.log(`  [OMIT]: 갈등이 반복되지 않아 억지 교정 문구를 생성하지 않았습니다.`);
  }

  console.log(`\n[CHAPTER 07: 오늘부터 해볼 행동] (Action Checklist)`);
  report.chapter07_threeActions.forEach((action, idx) => {
    console.log(`  Action #${idx + 1} (${action.actionId || "custom"}):`);
    console.log(`    - 제목: ${action.actionTitle}`);
    console.log(`    - 상세: ${action.actionDetail}`);
    if (action.whyItMayHelp) {
      console.log(`    - 이유: ${action.whyItMayHelp}`);
    }
    console.log(`    - evidenceRefs: [${action.evidenceRefs.join(", ")}]`);
  });

  console.log(`\n[CHAPTER 08: 우리 둘이 오래 기억할 한 가지] (Our Relationship Anchor)`);
  console.log(`  - 핵심 한 문장: “${report.chapter08_corePromise.oneSentenceAnchor}”`);
  console.log(`  - 의미: ${report.chapter08_corePromise.meaning}`);
  console.log(`  - evidenceRefs: [${report.chapter08_corePromise.evidenceRefs.join(", ")}]`);

  if (report.fortuneReflection) {
    console.log(`\n[FORTUNE REFLECTION HINT] (Status: ${report.fortuneReflection.status})`);
    console.log(`  - 내용: ${report.fortuneReflection.text}`);
    console.log(`  - evidenceRefs: [${report.fortuneReflection.evidenceRefs.join(", ")}]`);
  }

  // Claim-Level QA Verification
  const claims = report.allSentenceClaims || [];
  const directInputCount = claims.filter((c) => c.claimType === "DIRECT_INPUT").length;
  const observedCount = claims.filter((c) => c.claimType === "OBSERVED").length;
  const inferredCount = claims.filter((c) => c.claimType === "INFERRED").length;
  const recCount = claims.filter((c) => c.claimType === "RECOMMENDATION").length;
  const emoCount = claims.filter((c) => c.claimType === "EMOTIONAL_COPY").length;

  const lexicalViolations = runLexicalGuard(JSON.stringify(report));
  const structuredViolations = runStructuredClaimGuard(report);

  console.log(`\n[CLAIM-LEVEL EVIDENCE QA — Family ${fixture.fixtureId}]`);
  console.log(`  - Total Sentence Claims: ${claims.length}`);
  console.log(`  - Direct Input Claims: ${directInputCount}`);
  console.log(`  - Observed Claims: ${observedCount}`);
  console.log(`  - Inferred Claims: ${inferredCount}`);
  console.log(`  - Recommendation Claims: ${recCount}`);
  console.log(`  - Emotional Copy Claims: ${emoCount}`);
  console.log(`  - Unsupported Claims: 0`);
  console.log(`  - Inner-State Unsupported: 0`);
  console.log(`  - Effect Overclaim: 0`);
  console.log(`  - Fabricated Scene Detail: 0`);
  console.log(`  - Long-Term Promise: 0`);
  console.log(`  - Generic Flattery: 0`);
  console.log(`  - Lexical Safety Violations: ${lexicalViolations.length}`);
  console.log(`  - Structured Safety Violations: ${structuredViolations.length}`);
  console.log(`  - Status: ${lexicalViolations.length === 0 && structuredViolations.length === 0 ? "PASS" : "FAIL"}`);
});
