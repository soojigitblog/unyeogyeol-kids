// childReportGenerator 모듈: 아이 상세 기질 리포트 (P2 Secondary) 생성

import type { BehaviorEvidence, ChildDeepReport, ChildProfile } from "@/lib/types";
import { computeAge } from "@/lib/age";

export function generateChildDeepReport(
  profile: ChildProfile,
  childEvidences: BehaviorEvidence[]
): ChildDeepReport {
  const ageInfo = computeAge(profile.birthDate);
  const ageDisplay = ageInfo?.ageDisplay || "만 3세";
  const childName = profile.name || "우리 아이";

  const chapters = childEvidences.map((ev, idx) => ({
    chapterId: `ch_${ev.domain}_${idx}`,
    title: `${ev.axis}와 관련된 관찰`,
    subTitle: ev.observedLabel,
    howChildSeesWorld: `${childName}는 상황을 마주할 때 ${ev.observedLabel} 특성을 편안하게 여길 수 있어요.`,
    recommendedApproach: `아이의 ${ev.observedLabel} 방식을 존중하며 한 템포 기다려주는 태도가 도움이 될 수 있습니다.`,
    phrasePair: {
      before: "왜 그렇게 행동해?",
      after: "지금은 그렇게 하고 싶었구나.",
    },
  }));

  return {
    meta: {
      childName,
      ageDisplay,
    },
    overview: {
      dominantPattern: childEvidences[0]?.patternId || "balanced",
      keywords: childEvidences.slice(0, 3).map((e) => e.observedLabel),
    },
    chapters,
  };
}
