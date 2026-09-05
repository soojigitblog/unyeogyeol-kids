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

const SITE_NAME = "운의결 KIDS";
const SITE_TITLE = "운의결 KIDS · 아이를 바꾸기 전에, 이해하는 법부터";
const SITE_DESCRIPTION =
  "아이의 실제 행동과 보호자의 반응을 함께 살펴보는 우리 아이 × 나 관계 사용설명서예요. 태어난 기질과 실제로 관찰된 행동을 함께 보고, 서로 엇갈리는 지점을 찾아드려요.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
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
