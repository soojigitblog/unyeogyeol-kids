// mom-evidence 모듈: 엄마 미니체크 응답 -> MomEvidence 변환
//
// 주의: 5문항뿐이므로 confidence 는 최대 medium. 성격 단정 금지.

import type { MomAnswers, MomEvidence } from "@/lib/types";
import { MOM_DOMAIN_AXIS, MOM_QUESTIONS } from "./momQuestions";

export function buildMomEvidence(answers: MomAnswers): MomEvidence[] {
  const evidence: MomEvidence[] = [];

  MOM_QUESTIONS.forEach((q) => {
    const selectedOptionId = answers[q.domain];
    if (!selectedOptionId) return;

    const opt = q.options.find((o) => o.optionId === selectedOptionId);
    if (!opt) return;

    evidence.push({
      domain: q.domain,
      axis: MOM_DOMAIN_AXIS[q.domain],
      patternId: opt.patternId,
      observedLabel: opt.label,
      confidence: "medium", // 단일 문항이므로 최대 medium
      sourceQuestionId: q.id,
    });
  });

  return evidence;
}
