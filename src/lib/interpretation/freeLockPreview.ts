// P3.6 무료 결과 + 잠금 미리보기 — 결정론 + fallback 템플릿만 사용, AI 호출 0회.
// server-only 아님 — 브라우저(useKids 클라이언트 스토어)에서 직접 호출된다.
// 새 DB/새 생성 로직 없음: Phase 2의 fallback 생성기가 이미 전체 배열(5/13/13)을
// 반환하므로, "1개 공개 나머지 잠금"은 이 결과를 UI에서 어디까지 보여줄지 자르는
// 문제일 뿐이다.

import type { Answers, ConflictMapItem, Element, TalentSeedItem, TalkingPointItem } from "@/lib/types";
import { buildBehaviorEvidence } from "@/lib/questionnaire/evidence";
import { scoreAllTalents, topTalents } from "@/lib/interaction/talentSeedScoring";
import { buildFallbackTalentSeeds } from "@/lib/interaction/fallbackPhase2Content";
import {
  buildFallbackConflictMap,
  buildFallbackTalkingPoints,
} from "@/lib/interaction/fallbackTalkingPointsAndConflictMap";

export interface FreeLockPreviewInput {
  answers: Answers;
  dayMasterElement: Element | null;
}

export interface FreeLockPreviewResult {
  talents: TalentSeedItem[]; // length 5, index0 = 공개
  talkingPoints: TalkingPointItem[]; // length 13, index0 = 공개
  conflictMap: ConflictMapItem[]; // length 13, 전부 라벨 공개(레벨/설명은 UI에서 자름)
}

export function buildFreeLockPreview(input: FreeLockPreviewInput): FreeLockPreviewResult {
  const childEvidences = buildBehaviorEvidence(input.answers);

  const scores = scoreAllTalents({
    dayMasterElement: input.dayMasterElement,
    childEvidences,
  });
  const talents = buildFallbackTalentSeeds(topTalents(scores, 5)).items;

  // 항상 같은 상황(예: 옷 입기)만 공개되면 개인화처럼 보이지 않으므로, 실제 근거가
  // 있는(groundedInGeneric=false) 항목을 우선 공개한다.
  const allTalkingPoints = buildFallbackTalkingPoints(childEvidences).items;
  const talkingPoints = [...allTalkingPoints].sort(
    (a, b) => Number(a.groundedInGeneric) - Number(b.groundedInGeneric)
  );

  // 고민/부모설문은 결제 직전 단계에서만 모이므로, 이 시점엔 아이 관찰만으로 계산한다
  // (정직한 한계 — concernId는 어떤 카테고리와도 매칭되지 않는 중립값을 사용).
  const conflictMap = buildFallbackConflictMap({
    childEvidences,
    momEvidences: [],
    conflictInput: { concernId: "etc", scenarioId: "" },
  }).items;

  return { talents, talkingPoints, conflictMap };
}
