"use client";

import React from "react";
import { Users, Sparkles, Heart, Compass } from "lucide-react";

interface TwoPersonSummaryProps {
  childName: string;
  momName?: string;
  childKeywords: string[];
  childSummary: string;
  momKeywords: string[];
  momSummary: string;
  misalignedPoint: string;
  fortuneRelationshipHint?: string;
}

export function TwoPersonSummary({
  childName,
  momName = "엄마",
  childKeywords,
  childSummary,
  momKeywords,
  momSummary,
  misalignedPoint,
  fortuneRelationshipHint,
}: TwoPersonSummaryProps) {
  return (
    <div className="rounded-3xl border border-coral-tint bg-gradient-to-b from-milk via-milk to-cream/40 p-5.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-cream-dark pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-tint text-coral-deep">
            <Users className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13.5px] font-extrabold tracking-tight text-cocoa">
            {momName} × {childName} 두 사람의 시선 요약
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        {/* 아이 카드 */}
        <div className="rounded-2xl border border-sage-tint/80 bg-milk p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-sage-deep">
              <Sparkles className="h-3.5 w-3.5" />
              {childName}의 관찰된 모습
            </span>
            <span className="rounded-full bg-sage-tint px-2 py-0.5 text-[10.5px] font-semibold text-sage-deep">
              엄마가 알려준 실제 모습
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {childKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-lg bg-cream px-2 py-0.5 text-[12px] font-bold text-cocoa"
              >
                #{kw}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-cocoa-soft">
            {childSummary}
          </p>
        </div>

        {/* 엄마 카드 */}
        <div className="rounded-2xl border border-coral-tint/80 bg-milk p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-coral-deep">
              <Heart className="h-3.5 w-3.5 fill-coral-deep/20" />
              {momName}의 체크된 반응
            </span>
            <span className="rounded-full bg-coral-tint px-2 py-0.5 text-[10.5px] font-semibold text-coral-deep">
              이번 체크에서 보인 엄마 반응
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {momKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-lg bg-cream px-2 py-0.5 text-[12px] font-bold text-cocoa"
              >
                #{kw}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-cocoa-soft">
            {momSummary}
          </p>
        </div>
      </div>

      {/* Relationship Misaligned / Connected Point */}
      <div className="mt-4 rounded-2xl bg-cream/80 p-4">
        <span className="text-[11.5px] font-bold tracking-wide text-coral-deep">
          ★ 우리 둘이 자주 엇갈리거나 마주치는 지점
        </span>
        <p className="mt-1.5 text-[14px] font-bold leading-relaxed text-cocoa">
          {misalignedPoint}
        </p>
      </div>

      {/* Optional 3rd area: 출생정보에서 같이 본 관계 힌트 */}
      {fortuneRelationshipHint && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-milk/60 px-3.5 py-2.5 text-[12px] text-cocoa-soft">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cream text-cocoa">
            <Compass className="h-3 w-3" />
          </span>
          <div className="leading-snug">
            <span className="font-semibold text-coral-deep mr-1.5">[출생정보에서 보는 보조 힌트]</span>
            <span>{fortuneRelationshipHint}</span>
          </div>
        </div>
      )}
    </div>
  );
}
