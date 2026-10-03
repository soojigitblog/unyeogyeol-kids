"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track";

/**
 * 텍스트에만 blur를 씌운다(전체 카드를 가리지 않음) — 구조/라벨은 그대로 보이고
 * 개인화된 내용만 가린다는 원칙(스펙 §12)을 지키기 위한 최소 단위 컴포넌트.
 * CSS blur일 뿐 서버가 실제 유료 데이터를 보내는 게 아니다 — 여기 렌더링되는 값은
 * 전부 결제 전 fallback 템플릿 텍스트이며, 실제 결제 후 AI 콘텐츠는 별도로
 * paid_extras에서만 내려온다(코드 경계는 freeLockPreview.ts 참고).
 */
export function BlurredText({
  children,
  section,
  label = "결제 후 확인",
}: {
  children: ReactNode;
  section: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => trackEvent("locked_section_clicked", { section })}
      className="relative block w-full cursor-pointer overflow-hidden rounded-lg text-left"
    >
      <span aria-hidden className="pointer-events-none block select-none blur-[6px]">
        {children}
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1 bg-milk/40 text-[12px] font-bold text-cocoa-soft">
        🔒 {label}
      </span>
    </button>
  );
}
