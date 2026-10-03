// P3.5 "한눈에 보는 우리 아이" 요약카드 + "오늘의 육아 미션".
// 새 DB 컬럼도 새 AI 호출도 없다 — 이미 생성된 리포트 내용에서 렌더링 시점에
// 순수하게 조립한다. 근거 없이 새 문장을 지어내지 않는다.

import type { ConflictLevel, SignatureReport } from "@/lib/types";

const LEVEL_ORDER: ConflictLevel[] = ["낮음", "보통", "높음", "매우높음"];

const STYLE_LABEL_BY_PATTERN: Record<string, string> = {
  strong_self_direction: "명령보다 선택",
  own_way_first: "명령보다 선택",
  needs_observation_time: "재촉보다 기다림",
  warms_up_with_secure_base: "재촉보다 기다림",
  high_intensity_expression: "감정부터 인정하기",
  open_expression: "감정부터 인정하기",
  reason_seeking: "이유부터 설명하기",
  prefers_completion_before_transition: "마무리할 틈 주기",
};

function extractPatternId(evidenceRef: string | undefined): string | null {
  if (!evidenceRef) return null;
  const parts = evidenceRef.split(":");
  return parts.length === 3 ? parts[2] : null;
}

export interface SummaryCard {
  icon: string;
  label: string;
  value: string;
}

export function buildSummaryCards(report: SignatureReport): SummaryCard[] {
  const cards: SummaryCard[] = [];

  const firstTalkingPointRef = report.talkingPoints?.items[0]?.evidenceRefs[0];
  const patternId = extractPatternId(firstTalkingPointRef);
  const styleValue = (patternId && STYLE_LABEL_BY_PATTERN[patternId]) || "선택지 주기";
  cards.push({ icon: "💬", label: "이 아이에게 통하는 방식", value: styleValue });

  const topConflict = [...(report.conflictMap?.items ?? [])].sort(
    (a, b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level)
  )[0];
  cards.push({
    icon: "⚡",
    label: "가장 부딪히는 순간",
    value: topConflict?.categoryLabel ?? "아직 데이터가 충분하지 않아요",
  });

  const topTalent = report.talentSeeds?.items[0];
  cards.push({
    icon: "🌱",
    label: "가장 강한 재능 씨앗",
    value: topTalent?.label ?? "아직 데이터가 충분하지 않아요",
  });

  cards.push({
    icon: "❤️",
    label: "부모가 기억할 한 가지",
    value: report.chapter08_corePromise.oneSentenceAnchor,
  });

  return cards;
}

export function buildKeywordChips(report: SignatureReport, max = 6): string[] {
  const chips: string[] = [];
  const seen = new Set<string>();
  const add = (v: string | undefined | null) => {
    if (!v || seen.has(v)) return;
    seen.add(v);
    chips.push(v);
  };

  report.talentSeeds?.items.slice(0, 2).forEach((t) => add(t.label));
  add([...(report.conflictMap?.items ?? [])].sort(
    (a, b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level)
  )[0]?.categoryLabel);
  report.chapter01_recurringScene.sceneKeywords.slice(0, 2).forEach((k) => add(k));
  report.twoPersonSummary?.childKeywords.slice(0, 2).forEach((k) => add(k));

  return chips.slice(0, max);
}

export interface TodayMission {
  title: string;
  beforePhrase: string;
  afterPhrase: string;
  estimatedMinutes: number;
}

/** 항상 존재하는 첫 talkingPoint를 미션으로 쓴다 — 결정론(같은 리포트 재조회 시 항상 동일). */
export function buildTodayMission(report: SignatureReport): TodayMission | null {
  const first = report.talkingPoints?.items[0];
  if (!first) return null;
  return {
    title: first.parentActionTip,
    beforePhrase: first.avoidPhrase,
    afterPhrase: first.workingPhrase,
    estimatedMinutes: 5,
  };
}
