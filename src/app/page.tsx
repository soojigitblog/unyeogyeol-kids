import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BeforeAfterQuote } from "@/components/ui/BeforeAfterQuote";
import { Heart, MessageCircleHeart, Sparkles, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* 1. Hero — 전환 중심: hook → headline → 결과 preview → CTA → trust */}
        <section className="relative overflow-hidden pt-5 pb-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-10 h-52 w-52 rounded-full bg-peach-tint blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-40 h-48 w-48 rounded-full bg-sky-tint blur-2xl"
          />

          <Container className="relative">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-tint px-3 py-1 text-[12.5px] font-semibold text-coral-deep">
                <Heart className="h-3.5 w-3.5" strokeWidth={2.4} />
                요즘 우리 아이, 이해하기
              </span>

              <h1 className="mt-3.5 font-accent text-[36px] font-bold leading-[1.2] tracking-tight text-cocoa">
                우리 아이,
                <br />왜 나한테만 이럴까요?
              </h1>

              <p className="mt-3 text-[15px] font-medium leading-relaxed text-cocoa-soft">
                고집이 센 걸까요? 낯가림이 심한 걸까요?
                <br />
                아니면 이 아이만의{" "}
                <span className="font-semibold text-cocoa">움직이는 방식</span>이
                있는 걸까요?
              </p>
            </div>

            {/* 결과 Preview Card — 실제 Free Result 와 동일한 design language */}
            <div className="animate-rise-2 mt-5">
              <p className="text-[12.5px] font-semibold text-coral-deep">
                우리 아이를 한 문장으로 보면
              </p>
              <div className="mt-2 rounded-card bg-coral p-5 shadow-lift">
                <p className="font-accent text-[20px] font-bold leading-[1.45] text-white">
                  “충분히 살펴본 뒤 마음이 정해지면 힘 있게 움직이는 아이”
                </p>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {["신중하게 시작해요", "자기 방식이 있어요", "마음이 정해지면 적극적"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full bg-sage-tint px-3 py-1.5 text-[13px] font-semibold text-sage-deep"
                    >
                      #{t}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="animate-rise-2 mt-5">
              <ButtonLink href="/free/child" size="lg">
                무료로 우리 아이 기질 보기
              </ButtonLink>
              <p className="mt-2 text-center text-[13px] text-cocoa-faint">
                2분 · 10개 질문 · 회원가입 없이
              </p>
            </div>

            {/* Trust / 차별점 */}
            <div className="animate-rise-3 mt-5 rounded-2xl bg-sage-tint/70 p-4">
              <p className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sage-deep">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                사주 하나만 보고 아이를 판단하지 않아요
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
                <b className="font-semibold">태어난 기질</b> +{" "}
                <b className="font-semibold">엄마가 실제로 본 아이의 행동 10가지</b>
                를 함께 보고, 우리 아이를 이해하는 힌트를 찾아드려요.
              </p>
            </div>
          </Container>
        </section>

        {/* Hero 바로 아래 — Signature Phrase Preview */}
        <section className="pt-10">
          <Container>
            <p className="text-[12.5px] font-semibold text-coral-deep">
              그리고, 오늘 이렇게 바꿔볼 수 있어요
            </p>
            <div className="mt-3">
              <BeforeAfterQuote
                before="빨리 신발 신어!"
                after="엄마가 신겨줄까, 네가 먼저 해볼래?"
              />
            </div>
          </Container>
        </section>

        {/* 2. "나만 그런 거 아니구나." */}
        <section className="pt-16">
          <Container>
            <h2 className="text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              나만 그런 거,
              <br />
              아니었어요.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-cocoa-soft">
              매일 밤 ‘내가 뭘 잘못했나’ 곱씹는 엄마들이
              <br />
              생각보다 정말 많아요.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {[
                "혼내도 안 되고, 달래도 안 되고…",
                "고집이 너무 센데 어떻게 해야 하죠?",
                "어떤 방식으로 가르쳐야 할지 모르겠어요.",
              ].map((t) => (
                <Card key={t} tone="plain" className="flex items-center gap-3">
                  <MessageCircleHeart
                    className="h-5 w-5 shrink-0 text-coral"
                    strokeWidth={2}
                  />
                  <p className="text-[15px] text-cocoa">{t}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* 3. "아이에게 이유가 있을 수도 있겠네." */}
        <section className="pt-16">
          <Container>
            <Card tone="sage" className="p-6">
              <p className="text-[15px] leading-relaxed text-cocoa-soft">
                같은 상황도 아이에겐 다르게 느껴져요.
              </p>
              <p className="mt-3 text-[19px] font-bold leading-snug text-cocoa">
                “빨리 준비시키려는” 엄마와
                <br />
                “하던 걸 자꾸 끊는다”고 느끼는 아이.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-cocoa-soft">
                틀린 게 아니라, 움직이는 방식이 다른 거예요.
              </p>
            </Card>
          </Container>
        </section>

        {/* 4. "우리 아이는 어떤 타입이지?" */}
        <section className="pt-16">
          <Container>
            <h2 className="text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              우리 아이는
              <br />
              어떤 결일까요?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-cocoa-soft">
              10개의 질문에 답하면, 지금 우리 아이의 모습을
              <br />한 문장으로 정리해 드려요.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["#관찰형", "#자기주도형", "#감정 풍부형", "#깊이 몰입형", "#호기심 탐색형"].map(
                (c) => (
                  <span
                    key={c}
                    className="rounded-full bg-butter-tint px-3.5 py-1.5 text-[13.5px] font-semibold text-[#a98416]"
                  >
                    {c}
                  </span>
                ),
              )}
            </div>
          </Container>
        </section>

        {/* 5. CTA */}
        <section className="pt-16 pb-20">
          <Container>
            <div className="relative overflow-hidden rounded-card bg-coral p-7 text-center shadow-lift">
              <Sparkles
                className="mx-auto h-6 w-6 text-white/90"
                strokeWidth={2}
              />
              <p className="mt-3 text-[21px] font-bold leading-snug text-white">
                오늘 저녁, 아이와의 대화가
                <br />
                조금 달라질 수 있어요.
              </p>
              <div className="mt-6">
                <ButtonLink href="/free/child" size="lg" variant="onColor">
                  무료로 우리 아이 기질 보기
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
