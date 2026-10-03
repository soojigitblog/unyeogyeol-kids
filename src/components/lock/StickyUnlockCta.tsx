"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";

/**
 * 미리보기 경계(sentinel)를 지나 스크롤했을 때만 나타나는 하단 고정 CTA.
 * 페이지 로드 시점부터 계속 떠 있지 않는다(스펙 §18) — sentinel을
 * `/free/result`의 "여기까지는 무료" 경계선 바로 아래에 둔다.
 */
export function StickyUnlockCta({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      {show ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-milk/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <div className="mx-auto max-w-[460px]">
            <button
              type="button"
              onClick={() => {
                trackEvent("checkout_clicked", { source: "sticky_cta" });
                router.push(href);
              }}
              className="min-h-[52px] w-full rounded-cta bg-coral px-4 text-[15.5px] font-bold text-white shadow-lift"
            >
              {label}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
