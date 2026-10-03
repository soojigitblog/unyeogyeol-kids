"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { TodayMission } from "@/lib/interaction/summaryCards";

// P3.5: 완료 여부는 저장하지 않는다(화면 상태만) — DB 구조를 과도하게 복잡하게
// 만들지 않기 위한 의도적 선택.
export function TodayMissionCard({ mission }: { mission: TodayMission }) {
  const [done, setDone] = useState<"none" | "done" | "skipped">("none");

  return (
    <Card tone="butter" className="p-6">
      <p className="text-[13px] font-bold text-coral-deep">🎯 오늘의 작은 미션</p>
      <p className="mt-2 text-[16px] font-bold leading-relaxed text-cocoa">{mission.title}</p>
      <div className="mt-3 space-y-1.5 text-[14px]">
        <p className="text-cocoa-soft">
          <span aria-hidden>❌ </span>
          <span className="line-through decoration-cocoa-soft/60">{mission.beforePhrase}</span>
        </p>
        <p className="font-semibold text-coral-deep">
          <span aria-hidden>✅ </span>
          {mission.afterPhrase}
        </p>
      </div>
      <p className="mt-2 text-[12.5px] text-cocoa-faint">예상 시간: {mission.estimatedMinutes}분 이내</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setDone("done")}
          className={`flex-1 rounded-xl py-2.5 text-[13.5px] font-bold transition-colors ${
            done === "done" ? "bg-coral text-white" : "bg-milk text-cocoa border border-line"
          }`}
        >
          해봤어요
        </button>
        <button
          type="button"
          onClick={() => setDone("skipped")}
          className={`flex-1 rounded-xl py-2.5 text-[13.5px] font-bold transition-colors ${
            done === "skipped" ? "bg-cocoa text-white" : "bg-milk text-cocoa border border-line"
          }`}
        >
          오늘은 못했어요
        </button>
      </div>
    </Card>
  );
}
