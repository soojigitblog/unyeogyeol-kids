// concern 모듈: 현재 육아 고민 선택지
// 현재 고민은 향후 유료 해석의 첫 번째 우선순위가 된다.

import type { ConcernId } from "@/lib/types";

export interface ConcernItem {
  id: ConcernId;
  label: string;
  emoji: string;
}

export const CONCERNS: ConcernItem[] = [
  { id: "tantrum", label: "떼쓰기", emoji: "😤" },
  { id: "stubborn", label: "고집", emoji: "🙅" },
  { id: "discipline", label: "훈육", emoji: "🧩" },
  { id: "meal", label: "밥", emoji: "🍚" },
  { id: "sleep", label: "잠", emoji: "🌙" },
  { id: "daycare", label: "어린이집·유치원", emoji: "🎒" },
  { id: "shyness", label: "낯가림", emoji: "🫣" },
  { id: "friends", label: "친구관계", emoji: "🧸" },
  { id: "sibling", label: "형제갈등", emoji: "👧👦" },
  { id: "only_with_mom", label: "나에게만 심함", emoji: "💗" },
  { id: "focus_play", label: "집중·놀이", emoji: "🎨" },
  { id: "learning", label: "배움·공부", emoji: "📖" },
  { id: "etc", label: "기타", emoji: "✏️" },
];

export function concernLabel(id: ConcernId): string {
  return CONCERNS.find((c) => c.id === id)?.label ?? "기타";
}
