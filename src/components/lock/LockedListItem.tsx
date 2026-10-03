"use client";

import { trackEvent } from "@/lib/analytics/track";

/**
 * 재능 씨앗 TOP5의 2~5위처럼, "이름 자체"까지 개인화 정보로 취급해 완전히
 * 가리는 목록 항목(스펙 §11 예시 — 충돌지도/통하는말과 달리 라벨까지 블러 처리).
 */
export function LockedListItem({ rank }: { rank: number }) {
  return (
    <button
      type="button"
      onClick={() => trackEvent("locked_section_clicked", { section: "talent_rest" })}
      className="flex w-full items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left"
    >
      <span className="text-[13px] font-bold text-cocoa-soft">{rank}위</span>
      <span aria-hidden className="flex-1 select-none blur-[6px] text-[15px] font-bold text-cocoa">
        ██████
      </span>
      <span className="text-[12px] font-bold text-cocoa-soft">🔒</span>
    </button>
  );
}
