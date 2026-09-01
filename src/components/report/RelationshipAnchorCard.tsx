import React from "react";
import { Bookmark, Sparkles } from "lucide-react";

interface RelationshipAnchorCardProps {
  oneSentenceAnchor: string;
  meaning: string;
}

export function RelationshipAnchorCard({
  oneSentenceAnchor,
  meaning,
}: RelationshipAnchorCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-coral-tint bg-gradient-to-b from-cream via-milk to-coral-tint/30 p-6 text-center shadow-sm">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white shadow-xs">
        <Bookmark className="h-4 w-4" />
      </div>

      <span className="mt-3 inline-block text-[12px] font-bold tracking-wider text-coral-deep">
        우리 둘이 기억할 한 가지
      </span>

      <p className="font-serif mt-4 text-[19px] font-bold leading-relaxed tracking-tight text-cocoa">
        “{oneSentenceAnchor}”
      </p>

      {meaning ? (
        <div className="mt-4 rounded-2xl bg-milk/80 px-4 py-3 text-[13.5px] leading-relaxed text-cocoa-soft">
          {meaning}
        </div>
      ) : null}
    </div>
  );
}
