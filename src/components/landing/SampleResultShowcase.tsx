"use client";

// P3.6 랜딩 샘플 결과 카드 — 가상의 아이("리호")로 만든 예시일 뿐, 실제 방문자의
// 클라이언트 세션 스토어를 절대 참조하지 않는다(스펙 §23, 코드 수준 분리 — 정적 테스트로 확인).

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { trackEvent } from "@/lib/analytics/track";

export function SampleResultShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true;
        trackEvent("preview_view");
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-6">
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-bold text-coral-deep">실제 결과 예시</p>
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold text-cocoa-soft">
          샘플 결과입니다
        </span>
      </div>
      <p className="mt-1 text-[12.5px] text-cocoa-faint">
        가상의 아이 &ldquo;리호&rdquo;로 만든 예시예요. 실제 내 결과와 달라요.
      </p>

      <div className="mt-3 space-y-2.5">
        <Card tone="plain" className="p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">💬 아이에게 통하는 말</p>
          <p className="mt-2 text-[14px] text-cocoa-soft">
            <span aria-hidden>❌ </span>
            <span className="line-through decoration-cocoa-soft/60">&ldquo;빨리 준비해.&rdquo;</span>
          </p>
          <p className="mt-1 text-[14px] font-semibold text-coral-deep">
            <span aria-hidden>✅ </span>
            &ldquo;양말이랑 바지 중에 뭐부터 할래?&rdquo;
          </p>
        </Card>

        <Card tone="plain" className="p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">⚡ 부모와 가장 부딪히는 순간</p>
          <p className="mt-1.5 text-[15px] font-bold text-cocoa">급하게 재촉할 때</p>
        </Card>

        <Card tone="plain" className="p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">🌱 가장 강한 재능 씨앗</p>
          <p className="mt-1.5 text-[15px] font-bold text-cocoa">작은 차이를 발견하는 힘</p>
        </Card>

        <Card tone="butter" className="p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">🎯 오늘의 육아 미션</p>
          <p className="mt-1.5 text-[15px] font-bold text-cocoa">오늘 아이에게 선택권을 두 번 주세요.</p>
        </Card>
      </div>

      <p className="mt-3 text-center text-[13px] leading-relaxed text-cocoa-soft">
        지금 본 건 리호의 예시예요.
        <br />
        <b className="font-semibold text-cocoa">우리 아이 이야기는 2분이면 볼 수 있어요.</b>
      </p>
    </div>
  );
}
