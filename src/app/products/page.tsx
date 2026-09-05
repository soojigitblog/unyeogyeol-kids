"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useKids } from "@/lib/store";
import { concernLabel } from "@/lib/concerns";
import { SignatureProductCard } from "@/components/commerce/SignatureProductCard";
import { FreeVsPaidCompare } from "@/components/commerce/FreeVsPaidCompare";
import { SignatureResultPreview } from "@/components/commerce/SignatureResultPreview";
import { CommerceFaq } from "@/components/commerce/CommerceFaq";

export default function ProductsPage() {
  const router = useRouter();
  const { child, concern, ready } = useKids();

  useEffect(() => {
    if (ready && !child) router.replace("/free/child");
  }, [ready, child, router]);

  const concernText = concern ? concernLabel(concern) : null;
  const setupHref = child ? "/paid/signature/setup" : "/free/child";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container wide>
          <div className="animate-rise">
            <Eyebrow>유료 관계 사용설명서</Eyebrow>
            {concernText && (
              <div className="mt-4 rounded-2xl bg-sage-tint px-4 py-3 text-[14px] text-cocoa">
                지금 고민 <b className="text-sage-deep">‘{concernText}’</b>을(를) 중심으로
                봅니다.
              </div>
            )}
            <h1 className="mt-5 text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              같은 장면이 반복된다면,
              <br />
              우리 둘이 어디서 엇갈리는지부터.
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa-soft">
              반복되는 한 장면이 있다면, 그 장면에서 우리 둘이 무엇을 다르게 하고 있는지
              먼저 살펴보세요.
            </p>
          </div>

          <div className="mt-7">
            <SignatureProductCard setupHref={setupHref} ctaLabel="우리 둘 이야기 보기" />
          </div>

          <div className="mt-6">
            <FreeVsPaidCompare />
          </div>

          <div className="mt-6">
            <SignatureResultPreview />
          </div>

          <Card className="mt-5 p-5">
            <span className="text-[12.5px] font-semibold text-sage-deep">아이 중심 리포트</span>
            <h2 className="mt-2 text-[18px] font-bold text-cocoa">우리 아이 기질 사용설명서</h2>
            <p className="mt-2 text-[14px] text-cocoa-soft">향후 제공 예정 상품입니다.</p>
            <Button variant="secondary" className="mt-4 w-full" disabled>
              곧 열려요
            </Button>
          </Card>

          <div className="mt-5 rounded-card border border-line bg-cream p-4">
            <p className="text-[14.5px] font-semibold text-cocoa">요즘 이 행동, 왜 그럴까?</p>
            <p className="mt-1 text-[13px] text-cocoa-soft">반복 상담 상품 — 준비 중</p>
          </div>

          <div className="mt-8">
            <CommerceFaq />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <ButtonLink href="/my-results" variant="secondary">
              내 결과 보기
            </ButtonLink>
            <ButtonLink href="/free/result" variant="ghost">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              무료 결과 다시 보기
            </ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
