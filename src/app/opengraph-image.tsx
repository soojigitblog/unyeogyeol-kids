import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "운의결 KIDS · 아이를 바꾸기 전에, 이해하는 법부터";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og(Satori)는 CSS 웹폰트가 아니라 폰트 바이너리가 필요하다 — 한글 글리프가
// 없는 기본 폰트로는 한글이 깨져서(네모 박스) 나온다. 이미 의존성에 있는
// Pretendard 정적 폰트 파일을 그대로 재사용한다(별도 폰트 파일 추가 없음).
async function loadPretendard(weight: "Regular" | "Bold") {
  const fontPath = path.join(
    process.cwd(),
    "node_modules/pretendard/dist/public/static",
    `Pretendard-${weight}.otf`
  );
  return readFile(fontPath);
}

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    loadPretendard("Regular"),
    loadPretendard("Bold"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          backgroundColor: "#fff7ed",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 30,
            fontWeight: 700,
            color: "#2e2926",
          }}
        >
          운의결
          <span style={{ color: "#e8785c" }}>kids</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.25,
            color: "#2e2926",
            maxWidth: 900,
          }}
        >
          아이를 바꾸기 전에,
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.25,
            color: "#e8785c",
            maxWidth: 900,
          }}
        >
          이해하는 법부터.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "#716a65",
            maxWidth: 880,
          }}
        >
          아이의 실제 행동과 보호자의 반응을 함께 살펴보는
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "#716a65",
            maxWidth: 880,
          }}
        >
          우리 아이 × 나 관계 사용설명서
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
