import type { MetadataRoute } from "next";

// 결제/개인화된 화면(무료질문, 결과, 결제, my-results 등)은 크롤링 대상이 아니라
// 여기 넣지 않는다 — 마케팅/정책 목적의 공개 정적 페이지만 나열한다.
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const routes = ["", "/products", "/refund", "/terms", "/privacy"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
