import React from "react";
import { Sparkles, Target } from "lucide-react";

interface WhereToBreakCardProps {
  breakActionTitle: string;
  breakActionDetail: string;
  isCollaborative?: boolean;
}

export function WhereToBreakCard({
  breakActionTitle,
  breakActionDetail,
  isCollaborative = false,
}: WhereToBreakCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-coral bg-gradient-to-b from-coral-tint/60 to-milk p-5.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-white">
          <Target className="h-4 w-4" />
        </span>
        <span className="text-[13px] font-bold tracking-tight text-coral-deep">
          {isCollaborative
            ? "★ 이 호흡을 지켜주는 핵심 포인트"
            : "★ 여기서 갈등의 고리를 끊어볼 수 있어요"}
        </span>
      </div>

      <h4 className="mt-3 text-[17px] font-bold leading-snug text-cocoa">
        {breakActionTitle}
      </h4>

      <p className="mt-2 text-[14px] leading-relaxed text-cocoa-soft">
        {breakActionDetail}
      </p>
    </div>
  );
}
