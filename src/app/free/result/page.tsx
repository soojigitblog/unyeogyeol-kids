"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Container } from "@/components/layout/Container";
import { Card, Eyebrow } from "@/components/ui/Card";
import { ButtonLink, Button } from "@/components/ui/Button";
import { BeforeAfterQuote } from "@/components/ui/BeforeAfterQuote";
import { ShareModal } from "@/components/ui/ShareModal";
import { useKids } from "@/lib/store";
import { computeFortuneFacts } from "@/lib/fortune/engine";
import { answeredCount, axisValues } from "@/lib/questionnaire/evidence";
import { generateFreeResult } from "@/lib/interpretation/freeResult";
import { ageBand, computeAge } from "@/lib/age";

export default function FreeResultPage() {
  const router = useRouter();
  const { child, answers, ready } = useKids();
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!child) router.replace("/free/child");
    else if (answeredCount(answers) === 0) router.replace("/free/questions");
  }, [ready, child, answers, router]);

  const result = useMemo(() => {
    if (!child) return null;
    const facts = computeFortuneFacts(
      child.birthDate,
      child.birthTimeKnown,
      child.birthTime,
    );
    const age = computeAge(child.birthDate);
    return generateFreeResult({
      axes: axisValues(answers),
      fortune: facts ? { dayMasterElement: facts.dayMasterElement } : null,
      ageBand: ageBand(age?.ageInMonths ?? 48),
    });
  }, [child, answers]);

  if (!ready || !child || !result) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1" />
      </>
    );
  }

  const childLabel = child.name ? `${child.name}는` : "우리 아이는";
  const shareText = `[운의결 KIDS] ${childLabel} 이런 아이예요 ✨\n\n“${result.oneSentence}”\n\n#${result.keywords.join(" #")}`;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `[운의결 KIDS] ${childLabel} 기질 결과`,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {
          setIsShareOpen(true);
        });
    } else {
      setIsShareOpen(true);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 pt-2">
        <Container>
          {/* 1. 한 문장 감성 카드 */}
          <div className="animate-rise">
            <Eyebrow>지금 우리 아이를 한 문장으로 보면</Eyebrow>
            <div className="mt-4 overflow-hidden rounded-card bg-coral p-6 shadow-lift">
              <p className="text-[13px] font-semibold text-white/85">
                {childLabel} 요즘,
              </p>
              <p className="mt-2 font-accent text-[23px] font-bold leading-[1.4] text-white">
                {result.oneSentence}
              </p>
            </div>
          </div>

          {/* 2. 키워드 3개 */}
          <section className="mt-7 animate-rise-2">
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-sage-tint px-4 py-2 text-[14px] font-semibold text-sage-deep"
                >
                  #{k}
                </span>
              ))}
            </div>

            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={handleShare}
                className="w-full text-[15.5px]"
              >
                <Share2 className="h-4 w-4 text-coral-deep" strokeWidth={2.4} /> 이 결과 공유하기
              </Button>
              <p className="mt-2 text-center text-[12.5px] text-cocoa-faint">
                생년월일·이름은 공유 문구에 담기지 않아요.
              </p>
            </div>
          </section>

          {/* 3. 보호자가 오해하기 쉬운 한 가지 */}
          <section className="mt-9 animate-rise-2">
            <h2 className="text-[19px] font-bold tracking-tight text-cocoa">
              보호자가 오해하기 쉬운 한 가지
            </h2>
            <Card tone="butter" className="mt-3">
              <p className="text-[15.5px] leading-relaxed text-cocoa">
                {result.misreading}
              </p>
            </Card>
          </section>

          {/* 4. 오늘 바꿔볼 한마디 (Signature Before/After) */}
          <section className="mt-9 animate-rise-2">
            <h2 className="text-[19px] font-bold tracking-tight text-cocoa">
              오늘 바꿔볼 한마디
            </h2>
            <p className="mt-1.5 text-[14px] text-cocoa-soft">
              작은 말 한마디가 오늘 저녁을 바꿔요.
            </p>
            <div className="mt-3">
              <BeforeAfterQuote
                before={result.phraseBefore}
                after={result.phraseAfter}
              />
            </div>
          </section>

          {/* 5. 현재 고민 CTA */}
          <section className="mt-10 animate-rise-3">
            <div className="rounded-card bg-cream p-6 text-center">
              <p className="text-[20px] font-bold leading-snug text-cocoa">
                요즘 가장 힘든 순간은
                <br />
                언제인가요?
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-cocoa-soft">
                그 순간을 알려 주시면, 이 아이에게 맞는
                <br />더 깊은 이야기를 준비해 드려요.
              </p>
              <div className="mt-5">
                <ButtonLink href="/concern" size="lg">
                  요즘 가장 힘든 장면 골라보기
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </ButtonLink>
              </div>
            </div>
            <p className="mt-5 text-center text-[12.5px] leading-relaxed text-cocoa-faint">
              지금 관찰된 모습을 정리한 참고 자료예요.
              <br />
              발달·의학적 상태를 진단하지 않아요.
            </p>
          </section>
        </Container>
      </main>

      {/* 다양한 SNS 공유 모달 */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title="우리 아이 기질 결과 공유"
        shareText={shareText}
      />
    </>
  );
}
