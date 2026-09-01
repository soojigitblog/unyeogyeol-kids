import React from "react";
import { Heart, Sparkles } from "lucide-react";

interface PerspectiveCompareProps {
  momPerspective: {
    intention: string;
    possibleFeeling: string;
  };
  childPerspective: {
    possibleInterpretation: string;
    possibleFeeling: string;
  };
  childName: string;
  /** 관계명(예: 아빠 / 할머니 / 큰이모). */
  caregiverRoleLabel?: string;
}

export function PerspectiveCompare({
  momPerspective,
  childPerspective,
  childName,
  caregiverRoleLabel = "보호자",
}: PerspectiveCompareProps) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <div className="rounded-3xl border border-coral-tint bg-milk p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-tint text-coral-deep">
            <Heart className="h-4 w-4 fill-coral-deep/20" />
          </span>
          <span className="text-[13px] font-bold tracking-tight text-coral-deep">
            {caregiverRoleLabel}에게서 확인된 반응
          </span>
        </div>
        <p className="mt-3.5 text-[15.5px] font-bold leading-snug text-cocoa">
          {momPerspective.intention}
        </p>
        {momPerspective.possibleFeeling ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
            {momPerspective.possibleFeeling}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-sage-tint bg-milk p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
            <Sparkles className="h-4 w-4 fill-sage-deep/20" />
          </span>
          <span className="text-[13px] font-bold tracking-tight text-sage-deep">
            {childName}에게서 관찰된 행동
          </span>
        </div>
        <p className="mt-3.5 text-[15.5px] font-bold leading-snug text-cocoa">
          {childPerspective.possibleInterpretation}
        </p>
        {childPerspective.possibleFeeling ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
            {childPerspective.possibleFeeling}
          </p>
        ) : null}
      </div>
    </div>
  );
}
