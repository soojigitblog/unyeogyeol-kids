import type { Metadata, Viewport } from "next";
import { Gowun_Batang } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { KidsProvider } from "@/lib/store";

// Accent serif — 부드럽고 세련된 한국어 serif (Hero/결과 감성 문장에만 제한적으로 사용)
const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "운의결 KIDS · 우리 아이, 왜 이럴까요?",
  description:
    "말 안 듣는 아이가 아니라, 나와 움직이는 방식이 조금 다른 아이일 수도 있어요. 아이를 가장 가까이에서 돌보는 사람과 아이의 관계를 함께 봅니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffcf8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${gowunBatang.variable} antialiased`}>
      <body className="flex min-h-screen flex-col bg-milk text-cocoa">
        <KidsProvider>{children}</KidsProvider>
      </body>
    </html>
  );
}
