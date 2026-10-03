"use client";

// P4 운영 안전장치 — 루트 레이아웃(src/app/layout.tsx) 자체가 죽는 극단적인 경우를
// 대비한 최후의 방어선. error.tsx는 RootLayout 안쪽에서만 동작하므로 RootLayout
// 자체의 크래시는 못 잡는다. Next.js 규칙상 이 파일은 반드시 자기만의 <html>/<body>를
// 그려야 하고(RootLayout이 아예 렌더되지 못했을 수 있으므로), 혹시 globals.css나
// 다른 앱 컴포넌트가 크래시 원인일 가능성까지 고려해 외부 의존성 없이 최소한으로 작성한다.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 고객에게는 원문 메시지를 노출하지 않고, 콘솔에만 남긴다(디버깅용).
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fffcf8",
          color: "#3a2e28",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>
            잠시 문제가 생겼어요.
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#7a6a60", marginBottom: "20px" }}>
            다시 시도해 주세요. 계속되면 잠시 후 다시 방문해 주세요.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: "#e8734f",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
