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
import { buildFreeLockPreview } from "@/lib/interpretation/freeLockPreview";
import { TalentLevelBadge } from "@/components/report/TalentLevelBadge";
import { BlurredText } from "@/components/lock/BlurredText";
import { LockedListItem } from "@/components/lock/LockedListItem";
import { ConflictMapPreviewRow } from "@/components/lock/ConflictMapPreviewRow";
import { StickyUnlockCta } from "@/components/lock/StickyUnlockCta";
import { trackEvent } from "@/lib/analytics/track";

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

  // P3.6: 대표 재능씨앗 1개 + 통하는말 1개 + 잠금 미리보기. 전부 결정론+fallback
  // 템플릿만 사용 — AI 호출 없음(freeLockPreview.ts 참고).
  const preview = useMemo(() => {
    if (!child) return null;
    const facts = computeFortuneFacts(child.birthDate, child.birthTimeKnown, child.birthTime);
    return buildFreeLockPreview({
      answers,
      dayMasterElement: facts?.dayMasterElement ?? null,
    });
  }, [child, answers]);

  useEffect(() => {
    if (result) trackEvent("free_result_completed", { hasChild: Boolean(child) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(result)]);

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
        <Container wide>
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

          {/* P3.6: 대표 재능 씨앗 1개 + 통하는 말 1개 (실제 엔진, AI 호출 없음) */}
          {preview && (
            <>
              <section className="mt-9 animate-rise-2">
                <h2 className="text-[19px] font-bold tracking-tight text-cocoa">
                  🌱 대표 재능 씨앗
                </h2>
                <Card tone="sage" className="mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[16px] font-bold text-cocoa">{preview.talents[0].label}</p>
                    <TalentLevelBadge level={preview.talents[0].strengthLevel} />
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa">
                    {preview.talents[0].realLifeLine}
                  </p>
                </Card>
              </section>

              <section className="mt-9 animate-rise-2">
                <h2 className="text-[19px] font-bold tracking-tight text-cocoa">
                  💬 오늘 바로 써볼 말
                </h2>
                <Card tone="plain" className="mt-3">
                  <p className="text-[15px] text-cocoa-soft">
                    <span aria-hidden>❌ </span>
                    <span className="line-through decoration-cocoa-soft/60">
                      {preview.talkingPoints[0].avoidPhrase}
                    </span>
                  </p>
                  <p className="mt-1.5 text-[15px] font-semibold text-coral-deep">
                    <span aria-hidden>✅ </span>
                    {preview.talkingPoints[0].workingPhrase}
                  </p>
                </Card>
              </section>

              {/* 무료 경계선 — StickyUnlockCta의 sentinel이 바로 아래에 붙는다 */}
              <div className="mt-9 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[12.5px] font-bold text-cocoa-faint">
                  여기까지는 무료로 볼 수 있어요
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <StickyUnlockCta label="우리 아이 전체 결과 보기" href="/concern" />

              {/* 잠금 미리보기 */}
              <section className="mt-6 animate-rise-3">
                <h2 className="text-[17px] font-bold tracking-tight text-cocoa">
                  🌱 재능 씨앗 TOP5
                </h2>
                <div className="mt-3 space-y-2">
                  <Card tone="plain" className="p-4">
                    <p className="text-[13px] font-bold text-cocoa-soft">1위</p>
                    <p className="mt-1 text-[15px] font-bold text-cocoa">
                      {preview.talents[0].label}
                    </p>
                  </Card>
                  {preview.talents.slice(1).map((t, i) => (
                    <LockedListItem key={t.talentId} rank={i + 2} />
                  ))}
                </div>
              </section>

              <section className="mt-7 animate-rise-3">
                <h2 className="text-[17px] font-bold tracking-tight text-cocoa">
                  ⚡ 우리 집 충돌지도
                </h2>
                <div className="mt-3 space-y-2">
                  {preview.conflictMap.map((c, i) => (
                    <ConflictMapPreviewRow
                      key={c.categoryId}
                      categoryLabel={c.categoryLabel}
                      level={c.level}
                      revealed={i === 0}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-cocoa-faint">
                  지금은 평소 모습만 반영돼요. 결제 후에는 지금 고민까지 더해서 더 정확해져요.
                </p>
              </section>

              <section className="mt-7 animate-rise-3">
                <h2 className="text-[17px] font-bold tracking-tight text-cocoa">
                  💬 아이에게 통하는 말
                </h2>
                <div className="mt-3 space-y-2">
                  {preview.talkingPoints.map((tp, i) => (
                    <Card key={tp.situationId} tone="plain" className="p-4">
                      <p className="text-[14px] font-semibold text-cocoa">{tp.situationLabel}</p>
                      {i === 0 ? (
                        <p className="mt-1.5 text-[13.5px] font-semibold text-coral-deep">
                          ✅ {tp.workingPhrase}
                        </p>
                      ) : (
                        <div className="mt-1.5">
                          <BlurredText section="talking_point">
                            <span className="text-[13.5px]">✅ {tp.workingPhrase}</span>
                          </BlurredText>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}

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
