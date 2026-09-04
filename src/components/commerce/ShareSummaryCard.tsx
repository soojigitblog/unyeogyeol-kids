"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buildShareSummaryText } from "@/lib/purchase/sharePayload";
import type { SignatureReport } from "@/lib/types";

interface ShareSummaryCardProps {
  report: SignatureReport;
}

export function ShareSummaryCard({ report }: ShareSummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareSummaryText(report);
  // P2.5 §12: 가족 공유 카드는 본문 복붙 금지. 최대 두 줄로만 압축한다.
  //   ① 우리 둘이 엇갈리는 한 문장  ② 다음번에 기억할 한 가지
  // (예전에는 SECTION 04 의 breakActionTitle + breakActionDetail 을 그대로 다시 실어
  //  본문을 한 번 더 반복하고 있었다)
  const misaligned = report.twoPersonSummary?.misalignedPoint ?? "";
  const anchor = report.chapter08_corePromise.oneSentenceAnchor;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "우리 아이 × 나 관계 사용설명서",
          text: shareText,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    await handleCopy();
  }

  return (
    <Card tone="plain" className="p-6">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-coral-deep" />
        <h2 className="text-[18px] font-bold text-cocoa">가족에게 보여줄 핵심 요약</h2>
      </div>
      <p className="mt-1.5 text-[13px] text-cocoa-soft">
        생년월일·출생시간은 포함하지 않아요.
      </p>

      <div className="mt-4 space-y-3 rounded-2xl bg-cream/70 p-4">
        <div>
          <p className="text-[12px] font-bold text-coral-deep">우리 둘은 여기서 엇갈려요</p>
          <p className="mt-1 text-[14px] leading-relaxed text-cocoa">{misaligned}</p>
        </div>
        <div>
          <p className="text-[12px] font-bold text-sage-deep">다음번에 기억할 한 가지</p>
          <p className="mt-1 text-[14px] font-semibold leading-relaxed text-cocoa">{anchor}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          공유하기
        </Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "복사됨" : "텍스트 복사"}
        </Button>
      </div>
    </Card>
  );
}
