import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heart, MessageCircleHeart, Sparkles, ShieldCheck } from "lucide-react";
import { SampleResultShowcase } from "@/components/landing/SampleResultShowcase";
import { VsGeneralSajuDiagram } from "@/components/landing/VsGeneralSajuDiagram";
import { LandingViewBeacon } from "@/components/landing/LandingViewBeacon";
import { getProduct, SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";
import { formatKrw } from "@/lib/purchase/commerce";

const DIFFERENTIATORS = [
  {
    icon: "💬",
    title: "아이에게 통하는 말",
    body: (
      <>
        &ldquo;하지 마&rdquo;가 통하는 아이와 선택권을 줘야 움직이는 아이는
        다릅니다. 상황별 실제 대사를 제공합니다.
      </>
    ),
  },
  {
    icon: "⚡",
    title: "우리 집 충돌지도",
    body: (
      <>
        누구와, 어떤 순간에, 왜 부딪히는지 13가지 상황으로 보여줍니다.
      </>
    ),
  },
  {
    icon: "🌱",
    title: "재능을 키우는 실제 행동",
    body: (
      <>
        &ldquo;관찰력이 좋아요&rdquo;에서 끝나지 않아요. 지금 어떤 놀이를 하고,
        어떤 질문을 해주고, 어떤 경험을 주면 좋은지 알려드려요.
      </>
    ),
  },
];

export default function Home() {
  const signatureProduct = getProduct(SIGNATURE_PRODUCT_ID);

  return (
    <>
      <LandingViewBeacon />
      <SiteHeader />

      <main className="flex-1">
        {/* 1. Hero */}
        <section className="relative overflow-hidden pt-5 pb-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-10 h-52 w-52 rounded-full bg-peach-tint blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-40 h-48 w-48 rounded-full bg-sky-tint blur-2xl"
          />

          <Container className="relative" wide>
            <div className="animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-tint px-3 py-1 text-[12.5px] font-semibold text-coral-deep">
                <Heart className="h-3.5 w-3.5" strokeWidth={2.4} />
                사주로 만드는 성장 사용설명서
              </span>

              <h1 className="mt-3.5 font-accent text-[32px] font-bold leading-[1.25] tracking-tight text-cocoa">
                우리 아이는 무엇을 잘할까요?
              </h1>
              <p className="mt-2 text-[16px] font-semibold leading-relaxed text-cocoa">
                그보다 먼저 알아야 할 것이 있어요.
              </p>
              <p className="mt-3 font-accent text-[24px] font-bold leading-[1.35] text-coral-deep">
                어떻게 키워야
                <br />그 재능이 살아날까요?
              </p>

              <p className="mt-4 text-[14.5px] leading-relaxed text-cocoa-soft">
                타고난 기질부터 아이에게 통하는 말, 엄마·아빠와 부딪히는 순간,
                재능을 키우는 방법까지.
                <br />
                <b className="font-semibold text-cocoa">
                  사주로 만드는 우리 아이 성장 사용설명서.
                </b>
              </p>
            </div>

            {/* CTA */}
            <div className="animate-rise-2 mt-6">
              <ButtonLink href="/free/child" size="lg">
                우리 아이 사용설명서 보기
              </ButtonLink>
              <p className="mt-2 text-center text-[13px] text-cocoa-faint">
                2분 · 10개 질문 · 회원가입 없이
              </p>
              <a
                href="#sample-preview"
                className="mt-3 block text-center text-[13.5px] font-semibold text-cocoa-soft underline underline-offset-2"
              >
                결과 미리보기
              </a>
            </div>

            {/* Trust / 차별점 */}
            <div className="animate-rise-3 mt-5 rounded-2xl bg-sage-tint/70 p-4">
              <p className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sage-deep">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                사주 하나만 보고 아이를 판단하지 않아요
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
                <b className="font-semibold">태어난 기질</b> +{" "}
                <b className="font-semibold">내가 실제로 본 아이의 행동 10가지</b>
                를 함께 보고, 우리 아이를 이해하는 힌트를 찾아드려요.
              </p>
            </div>

            {/* 2. 즉시 결과 예시(샘플) */}
            <div id="sample-preview">
              <SampleResultShowcase />
            </div>
          </Container>
        </section>

        {/* Public, server-rendered product facts for visitors and PG review crawlers. */}
        <section aria-labelledby="kids-product-title" className="pt-12">
          <Container wide>
            <Card tone="coral" className="p-6">
              <p className="text-[12.5px] font-bold text-coral-deep">KIDS SIGNATURE REPORT</p>
              <h2 id="kids-product-title" className="mt-2 text-[23px] font-bold leading-snug text-cocoa">
                운의결 키즈 관계 리포트
              </h2>
              <p className="mt-1 text-[14px] font-semibold text-cocoa-soft">개인 맞춤형 디지털 콘텐츠</p>
              <div className="mt-5 border-y border-coral-tint py-4">
                <p className="text-[17px] font-bold text-cocoa">{signatureProduct.name}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-cocoa-soft">
                  {signatureProduct.description}
                </p>
                <p className="mt-4 text-[26px] font-bold tracking-tight text-cocoa">
                  {formatKrw(signatureProduct.amount).replace("₩", "")}
                  <span className="text-[16px] font-semibold">원</span>
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-cocoa-soft">
                  {signatureProduct.deliveryMethod}. {signatureProduct.reAccessMethod}.
                </p>
              </div>
              <div className="mt-5">
                <ButtonLink href="/products" size="lg">
                  상품 상세 보기
                </ButtonLink>
              </div>
            </Card>
          </Container>
        </section>

        {/* 3. 공감 */}
        <section className="pt-16">
          <Container wide>
            <h2 className="text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              아이를 사랑하는데,
              <br />
              왜 자꾸 같은 순간에 부딪힐까요?
            </h2>

            <div className="mt-6 flex flex-col gap-3">
              {[
                "밥 먹으라고 하면 더 안 먹어요.",
                "빨리 준비하라고 할수록 더 느려져요.",
                "안 된다고 하면 바로 울거나 화를 내요.",
                "집에서는 적극적인데 낯선 곳에서는 얼어붙어요.",
                "제가 해주는 말이 아이에게 안 통하는 것 같아요.",
                "장점은 많은 것 같은데 어떻게 키워줘야 할지 모르겠어요.",
              ].map((t) => (
                <Card key={t} tone="plain" className="flex items-center gap-3">
                  <MessageCircleHeart className="h-5 w-5 shrink-0 text-coral" strokeWidth={2} />
                  <p className="text-[15px] text-cocoa">{t}</p>
                </Card>
              ))}
            </div>

            <Card tone="sage" className="mt-6 p-6">
              <p className="text-[15px] leading-relaxed text-cocoa">
                아이에게 문제가 있어서가 아니라,
                <br />
                아이마다 반응하는 방식이 다를 수 있습니다.
              </p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa-soft">
                운의결 키즈는 타고난 성향과 실제 생활 모습을 함께 보고
                &ldquo;그래서 부모가 어떻게 하면 좋은지&rdquo;까지 연결합니다.
              </p>
            </Card>
          </Container>
        </section>

        {/* 4. 차별화 */}
        <section className="pt-16">
          <Container wide>
            <h2 className="text-[24px] font-bold leading-snug tracking-tight text-cocoa">
              풀이만 읽고 끝나지 않도록
              <br />
              오늘부터 바로 써먹을 수 있게 만들었어요.
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {DIFFERENTIATORS.map((d) => (
                <Card key={d.title} tone="plain" className="p-5">
                  <p className="text-[14px] font-bold text-cocoa-soft">
                    {d.icon} {d.title}
                  </p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa">{d.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* 5. 일반 사주와의 차이 */}
        <section className="pt-16">
          <Container wide>
            <VsGeneralSajuDiagram />
          </Container>
        </section>

        {/* 6. 최종 CTA */}
        <section className="pt-16 pb-20">
          <Container wide>
            <div className="relative overflow-hidden rounded-card bg-coral p-7 text-center shadow-lift">
              <Sparkles className="mx-auto h-6 w-6 text-white/90" strokeWidth={2} />
              <p className="mt-3 text-[21px] font-bold leading-snug text-white">
                오늘 저녁, 아이와의 대화가
                <br />
                조금 달라질 수 있어요.
              </p>
              <div className="mt-6">
                <ButtonLink href="/free/child" size="lg" variant="onColor">
                  우리 아이 사용설명서 보기
                </ButtonLink>
                <p className="mt-2.5 text-[13px] text-white/80">
                  2분 · 10개 질문 · 회원가입 없이
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
