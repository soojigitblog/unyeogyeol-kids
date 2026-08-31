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
}

export function PerspectiveCompare({
  momPerspective,
  childPerspective,
  childName,
}: PerspectiveCompareProps) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      {/* 엄마의 시선 */}
      <div className="rounded-3xl border border-coral-tint bg-milk p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-tint text-coral-deep">
            <Heart className="h-4 w-4 fill-coral-deep/20" />
          </span>
          <span className="text-[13px] font-bold tracking-tight text-coral-deep">
            엄마의 마음
          </span>
        </div>
        <p className="mt-3.5 text-[15.5px] font-bold leading-snug text-cocoa">
          “{momPerspective.intention}”
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
          {momPerspective.possibleFeeling}
        </p>
      </div>

      {/* 아이의 시선 */}
      <div className="rounded-3xl border border-sage-tint bg-milk p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
            <Sparkles className="h-4 w-4 fill-sage-deep/20" />
          </span>
          <span className="text-[13px] font-bold tracking-tight text-sage-deep">
            {childName}에게 받아들여질 수 있는 느낌
          </span>
        </div>
        <p className="mt-3.5 text-[15.5px] font-bold leading-snug text-cocoa">
          “{childPerspective.possibleInterpretation}”
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
          {childPerspective.possibleFeeling}
        </p>
      </div>
    </div>
  );
}
