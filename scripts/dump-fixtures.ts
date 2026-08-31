import { EXTENDED_FIXTURES } from "../src/lib/interaction/fixturesP20";
import { buildMomEvidence } from "../src/lib/questionnaire/momEvidence";
import { buildEvidenceClaims } from "../src/lib/interaction/evidenceClaimEngine";
import { generateSignatureReport } from "../src/lib/interaction/signatureReportGenerator";

console.log("==================================================");
console.log("P2.0H.2 CREDIBILITY PATCH DUMP (C, D, H, I + A)");
console.log("==================================================\n");

for (const f of EXTENDED_FIXTURES) {
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

  console.log(`### Fixture ${f.fixtureId}: ${f.title}`);
  console.log(`- Observation Evidence:`);
  f.childEvidences.forEach((ev) => {
    console.log(`  * [${ev.domain}] ${ev.observedLabel} (ref: child:${ev.domain}_${ev.observedPattern})`);
  });

  console.log(`- Recommendation:`);
  result.recommendations.forEach((r) => {
    console.log(`  * 제목: ${r.title}`);
    console.log(`    내용: ${r.detail}`);
    console.log(`    근거/이유: ${r.recommendationReason}`);
    console.log(`    evidenceRefs: ${r.evidenceRefs.join(", ")}`);
  });

  console.log(`- Before / After:`);
  if (sigReport.chapter06_threePhrases.length > 0) {
    const p = sigReport.chapter06_threePhrases[0];
    console.log(`  * Before: “${p.before}”`);
    console.log(`  * After: “${p.after}”`);
    console.log(`  * 도움이 되는 이유: ${p.whyItMayHelp}`);
    console.log(`  * phrase evidenceRefs: ${p.evidenceRefs.join(", ")}`);
  } else {
    console.log(`  * OMIT (갈등이 없거나 필요성이 확인되지 않아 생성하지 않음)`);
  }

  console.log(`- Fortune Reflection:`);
  const reflective = result.claims.filter((c) => c.layer === "REFLECTIVE");
  if (reflective.length > 0) {
    reflective.forEach((r) => {
      console.log(`  * 상태: ${result.coverageReport.fortuneStatus}`);
      console.log(`  * 문구: “${r.claim}”`);
    });
  } else {
    console.log(`  * OMIT (구체적 overlap 이 없거나 출생시간 미입력)`);
  }
  console.log("\n--------------------------------------------------\n");
}
