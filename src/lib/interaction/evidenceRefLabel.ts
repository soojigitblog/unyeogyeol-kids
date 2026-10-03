// P3.6 "실제 관찰 보기" — 충돌지도/통하는말은 사주 근거가 없으므로(evidenceRefs만
// 존재), evidenceRefs 문자열("evidence:domain:patternId" / "momEvidence:domain:patternId")을
// 원래 관찰 문장으로 역매핑해서 보여준다. 새 점수/생성 로직이 아니라 순수 조회.

import { findGeneralObservedLabel } from "@/lib/questionnaire/evidence";
import { MOM_QUESTIONS } from "@/lib/questionnaire/momQuestions";

function findMomObservedLabel(patternId: string): string | null {
  for (const q of MOM_QUESTIONS) {
    const opt = q.options.find((o) => o.patternId === patternId);
    if (opt) return opt.label;
  }
  return null;
}

/** evidenceRefs[] -> 사람이 읽을 수 있는 관찰 문장 목록(찾을 수 없는 항목은 제외). */
export function resolveEvidenceRefLabels(evidenceRefs: string[]): string[] {
  const labels: string[] = [];
  for (const ref of evidenceRefs) {
    const parts = ref.split(":");
    if (parts.length !== 3) continue;
    const [kind, , patternId] = parts;
    const label =
      kind === "momEvidence" ? findMomObservedLabel(patternId) : findGeneralObservedLabel(patternId);
    if (label) labels.push(label);
  }
  return labels;
}
