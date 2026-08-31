import type { ReactNode } from "react";

/** 모바일 우선(390px) 컨테이너. 좌우 패딩 20px. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[460px] px-5 ${className}`}>
      {children}
    </div>
  );
}
