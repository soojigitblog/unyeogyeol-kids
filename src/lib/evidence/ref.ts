import type { BehaviorEvidence, MomEvidence } from "@/lib/types";

/** Child behavior evidence ref — domain + patternId */
export function childEvidenceRef(ev: BehaviorEvidence): string {
  return `child:${ev.domain}_${ev.patternId}`;
}

export function momEvidenceRef(ev: MomEvidence): string {
  return `mom:${ev.domain}_${ev.patternId}`;
}
