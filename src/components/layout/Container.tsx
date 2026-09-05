import type { ReactNode } from "react";

/**
 * 모바일 우선(390px) 컨테이너. 좌우 패딩 20px.
 *
 * P3.1: 기본값(460px)은 그대로 두되, `wide`를 주면 lg(desktop) 이상에서만
 * 폭을 넓힌다 — 모바일 레이아웃은 전혀 바뀌지 않는다. 리포트 본문처럼 읽기
 * 폭이 넓어지면 안 되는 화면(paid/signature 등)은 wide를 주지 않고 그대로 둔다.
 */
export function Container({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const maxWidth = wide ? "max-w-[460px] lg:max-w-[860px]" : "max-w-[460px]";
  return (
    <div className={`mx-auto w-full ${maxWidth} px-5 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
