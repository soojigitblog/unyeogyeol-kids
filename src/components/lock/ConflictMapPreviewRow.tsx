"use client";

import { trackEvent } from "@/lib/analytics/track";
import { ConflictLevelMeter } from "@/components/report/ConflictLevelMeter";
import type { ConflictLevel } from "@/lib/types";

/** 카테고리 라벨은 항상 보이고, 레벨만 공개 여부에 따라 가려지는 한 행. */
export function ConflictMapPreviewRow({
  categoryLabel,
  level,
  revealed,
}: {
  categoryLabel: string;
  level: ConflictLevel;
  revealed: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-2.5">
      <span className="text-[14px] font-semibold text-cocoa">{categoryLabel}</span>
      {revealed ? (
        <ConflictLevelMeter level={level} />
      ) : (
        <button
          type="button"
          onClick={() => trackEvent("locked_section_clicked", { section: "conflict_map" })}
          className="flex items-center gap-1.5"
        >
          <span aria-hidden className="block h-2 w-16 select-none rounded-full bg-line blur-[3px]" />
          <span className="text-[11px] text-cocoa-soft">🔒</span>
        </button>
      )}
    </div>
  );
}
