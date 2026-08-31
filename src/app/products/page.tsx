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

export default function ProductsPage() {
  const router = useRouter();
  const { child, concern, ready } = useKids();

  useEffect(() => {
    if (ready && !child) router.replace("/free/child");
  }, [ready, child, router]);

  const concernText = concern ? concernLabel(concern) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container>
          <div className="animate-rise">
            <Eyebrow>우리 아이 맞춤 사용설명서</Eyebrow>
            {concernText && (
              <div className="mt-4 rounded-2xl bg-sage-tint px-4 py-3 text-[14px] text-cocoa">
                지금 고민 <b className="text-sage-deep">‘{concernText}’</b>을(를)
                가장 먼저 담아 드려요.
              </div>
            )}
            <h1 className="mt-5 text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              무료로 본 기질을,
              <br />
              오늘 저녁 대화로.
            </h1>
          </div>

          {/* Signature — 엄마 × 아이 관계 사용설명서 */}
          <Card tone="coral" className="mt-7 p-6">
            <span className="inline-flex items-center rounded-full bg-coral px-3 py-1 text-[12px] font-bold tracking-wide text-white">
              SIGNATURE
            </span>
            <h2 className="mt-3 text-[21px] font-bold leading-snug text-cocoa">
              엄마 × 아이 관계 사용설명서
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa-soft">
              “왜 나한테만 이럴까?” 그 반복되는 장면을, 두 사람의 방식 차이로 풀어
              드려요.
            </p>

            {/* 의도 vs 보이는 모습 */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-milk p-3.5">
                <p className="text-[12.5px] font-semibold text-coral-deep">
                  엄마의 의도
                </p>
                <p className="mt-1 text-[14px] text-cocoa">
                  “늦지 않게 준비시키려는 것”
                </p>
              </div>
              <div className="rounded-2xl bg-milk p-3.5">
                <p className="text-[12.5px] font-semibold text-sage-deep">
                  아이에게 보이는 모습
                </p>
                <p className="mt-1 text-[14px] text-cocoa">
                  “내가 하던 걸 자꾸 끊는 것”
                </p>
              </div>
            </div>

            {/* 갈등 Chain + WHERE TO BREAK */}
            <div className="mt-3 rounded-2xl bg-milk p-4">
              <p className="text-[12.5px] font-semibold text-cocoa-soft">
                반복되는 갈등의 흐름
              </p>
              <ol className="mt-2 space-y-1.5 text-[14px]">
                <li className="text-cocoa">① 상황이 시작돼요</li>
                <li className="text-cocoa">② 엄마가 반응해요</li>
                <li className="font-semibold text-coral-deep">
                  ③ 여기서 끊을 수 있어요 · 갈등을 멈추는 지점
                </li>
                <li className="text-cocoa-faint">④ 아이가 반응하고…</li>
                <li className="text-cocoa-faint">⑤ 갈등이 커지고…</li>
                <li className="text-cocoa-faint">⑥ 늘 같은 결말로 끝나요</li>
              </ol>
            </div>

            <div className="mt-5">
              {process.env.NODE_ENV !== "production" ? (
                <ButtonLink
                  href={child ? "/paid/signature/setup" : "/free/child"}
                  size="lg"
                >
                  내 입력값으로 관계 리포트 만들어보기
                </ButtonLink>
              ) : (
                <Button size="lg" disabled>
                  곧 열려요
                </Button>
              )}
              <p className="mt-2 text-center text-[12.5px] text-cocoa-faint">
                {process.env.NODE_ENV !== "production"
                  ? "개발 환경 전용: 내 아이 실제 입력값 + 엄마 체크로 Signature Report를 직접 검수할 수 있습니다."
                  : "지금은 무료 결과까지 볼 수 있어요. 사용설명서는 순차적으로 열려요."}
              </p>
            </div>
          </Card>

          {/* Secondary */}
          <Card className="mt-5">
            <span className="text-[12.5px] font-semibold text-sage-deep">
              CHILD FOCUS
            </span>
            <h2 className="mt-2 text-[18px] font-bold text-cocoa">
              우리 아이 기질 사용설명서
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa-soft">
              떼쓸 때, 훈육할 때, 칭찬할 때, 새로운 환경에서… 이 아이에게 통하는
              방식과 말을 12개 장으로 담아요.
            </p>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" disabled>
                곧 열려요
              </Button>
            </div>
          </Card>

          {/* Repeat */}
          <div className="mt-5 rounded-card border border-line bg-cream p-4">
            <p className="text-[14.5px] font-semibold text-cocoa">
              요즘 이 행동, 왜 그럴까?
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-cocoa-soft">
              나중에 새로운 행동이 생겼을 때, 아이 기질은 그대로 두고 그 상황만
              다시 물어보는 반복 상담도 준비하고 있어요.
            </p>
          </div>

          <div className="mt-8 text-center">
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
