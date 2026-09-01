import React from "react";
import { Coffee, HeartHandshake, Sparkles } from "lucide-react";

interface MomExhaustionCardProps {
  title?: string;
  /** 관계명(예: 아빠 / 할머니 / 큰이모). */
  caregiverRoleLabel?: string;
  isLowFriction?: boolean;
  exhaustionReason: string;
  comfortMessage: string;
}

export function MomExhaustionCard({
  title,
  caregiverRoleLabel = "보호자",
  isLowFriction = false,
  exhaustionReason,
  comfortMessage,
}: MomExhaustionCardProps) {
  return (
    <div className="rounded-3xl border border-cream-dark bg-milk p-6 shadow-xs">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            isLowFriction ? "bg-sage-tint text-sage-deep" : "bg-cream-dark text-cocoa"
          }`}
        >
          {isLowFriction ? <Sparkles className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
        </span>
        <span className="text-[13px] font-bold tracking-tight text-cocoa">
          {title ??
            (isLowFriction
              ? "현재 우리 둘의 편안한 호흡"
              : `이 순간 ${caregiverRoleLabel} 쪽에서 반복되는 반응`)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-cream/70 p-4">
        <p className="text-[12px] font-bold text-cocoa-soft">
          {isLowFriction ? "잘 맞는 이유와 연결" : `${caregiverRoleLabel} 쪽에서 확인된 반응`}
        </p>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-cocoa">
          {exhaustionReason}
        </p>
      </div>

      <div className="mt-3.5 rounded-2xl border border-sage-tint bg-sage-tint/30 p-4">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-sage-deep">
          <HeartHandshake className="h-4 w-4" />
          {isLowFriction ? "현재 호흡을 이어가는 팁" : "같은 순간 아이의 모습"}
        </div>
        <p className="mt-1.5 text-[14.5px] font-medium leading-relaxed text-cocoa">
          {comfortMessage}
        </p>
      </div>
    </div>
  );
}
