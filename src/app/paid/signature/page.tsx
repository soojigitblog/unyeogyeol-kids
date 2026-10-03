"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { BeforeAfterQuote } from "@/components/ui/BeforeAfterQuote";
// P2.5 CONTENT DENSITY: PerspectiveCompare(옛 CH02) / MomExhaustionCard(옛 CH05) 는
// 고객 화면에서 제거됐다. 둘 다 앞 Section 의 문장을 그대로 다시 보여주기만 했다.
import { ConflictChainVisual } from "@/components/report/ConflictChainVisual";
import { WhereToBreakCard } from "@/components/report/WhereToBreakCard";
import { ActionChecklist } from "@/components/report/ActionChecklist";
import { RelationshipAnchorCard } from "@/components/report/RelationshipAnchorCard";
import { TwoPersonSummary } from "@/components/report/TwoPersonSummary";
import { TalkingPointCard } from "@/components/report/TalkingPointCard";
import { AccordionCard } from "@/components/report/AccordionCard";
import { ConflictLevelMeter } from "@/components/report/ConflictLevelMeter";
import { TalentSeedCard } from "@/components/report/TalentSeedCard";
import {
  buildKeywordChips,
  buildSummaryCards,
  buildTodayMission,
} from "@/lib/interaction/summaryCards";
import { TodayMissionCard } from "@/components/report/TodayMissionCard";
import { FAMILY_FIXTURES, FamilyFixture } from "@/lib/interaction/fixtures";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { generateSignatureReport } from "@/lib/interaction/signatureReportGenerator";
import { subj } from "@/lib/caregiver";
import { useKids } from "@/lib/store";
import { ReportOwnershipCover } from "@/components/commerce/ReportOwnershipCover";
import { ShareSummaryCard } from "@/components/commerce/ShareSummaryCard";
import { apiCheckReportAccess, apiFetchReport } from "@/lib/commerce/apiClient";
import { loadCommerceDraft } from "@/lib/commerce/commerceDraft";
import Link from "next/link";
import { Sparkles, Users, ArrowLeft, RefreshCw, Compass, ShieldCheck } from "lucide-react";
import type { SignatureReport } from "@/lib/types";
import { trackEvent } from "@/lib/analytics/track";

type ViewMode = "real" | "A" | "B" | "C" | "D" | "E";

function PaidSignatureReportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { child, caregiverProfile, momAnswers, conflictInput, ready } = useKids();

  const reportIdParam =
    searchParams?.get("reportId") ?? loadCommerceDraft().reportId ?? null;

  const [serverReport, setServerReport] = useState<SignatureReport | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasServerAccess, setHasServerAccess] = useState(false);

  // P2.4 §28: QA fixture 리포트는 개발 환경에서만 허용한다(운영 결제 경로와 격리).
  const isReviewEnv = process.env.NODE_ENV !== "production";
  const familyParam = isReviewEnv ? searchParams?.get("family")?.toUpperCase() : null;
  const initialMode: ViewMode =
    familyParam && ["A", "B", "C", "D", "E"].includes(familyParam)
      ? (familyParam as "A" | "B" | "C" | "D" | "E")
      : "real";

  const [selectedMode, setSelectedMode] = useState<ViewMode>(initialMode);

  useEffect(() => {
    // 초기 렌더는 useState(initialMode)가 이미 처리한다. 이 effect는 마운트 후
    // "family" 쿼리(개발용 QA fixture 스위치)만 바뀌는 드문 경우를 재동기화한다.
    if (familyParam && ["A", "B", "C", "D", "E"].includes(familyParam)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMode(familyParam as "A" | "B" | "C" | "D" | "E");
    }
  }, [familyParam]);

  // If in real session mode, check if child and mom data exist
  const hasChildData = Boolean(child?.birthDate);
  // P2.2V.6 데이터 유효성: 관계 정보(caregiverRole)가 없으면 리포트를 만들지 않는다.
  const hasMomData = Boolean(
    caregiverProfile?.birthDate &&
      caregiverProfile?.role &&
      caregiverProfile?.roleLabel &&
      Object.keys(momAnswers || {}).length > 0 &&
      conflictInput
  );

  useEffect(() => {
    if (selectedMode !== "real" || !reportIdParam) {
      // 아래 async 분기와 마찬가지로 서버 접근권한 확인 결과를 반영하는 하나의
      // effect 안에서 "확인할 필요 없음" 조기 종료도 같은 상태를 설정한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessChecked(true);
      return;
    }
    let cancelled = false;
    async function verifyAccess() {
      const rid = reportIdParam!;
      const allowed = await apiCheckReportAccess(rid);
      if (cancelled) return;
      setHasServerAccess(allowed);
      if (allowed) {
        const payload = await apiFetchReport(rid);
        if (!cancelled) setServerReport(payload);
      }
      setAccessChecked(true);
    }
    verifyAccess();
    return () => {
      cancelled = true;
    };
  }, [selectedMode, reportIdParam]);

  useEffect(() => {
    if (!ready || !accessChecked) return;
    if (selectedMode !== "real") return;
    if (reportIdParam) {
      if (!hasServerAccess) {
        router.replace("/checkout/signature");
      }
      return;
    }
    if (!hasChildData) {
      router.replace("/free/child");
    } else if (!hasMomData) {
      router.replace("/paid/signature/setup");
    } else {
      router.replace("/checkout/signature");
    }
  }, [
    ready,
    accessChecked,
    selectedMode,
    reportIdParam,
    hasServerAccess,
    hasChildData,
    hasMomData,
    router,
  ]);

  // P2.4 §4 §26 §27: 실제 세션에서는 클라이언트가 유료 리포트를 만들지 않는다.
  // 서버가 Ownership 을 확인하고 내려준 snapshot payload 만 렌더링한다.
  // 아래 fixture 리포트는 개발 검수 전용 경로에서만 생성된다.
  const fixtureReport = useMemo<SignatureReport | null>(() => {
    if (!isReviewEnv || selectedMode === "real") return null;
    const currentFixture: FamilyFixture =
      FAMILY_FIXTURES.find((f) => f.fixtureId === selectedMode) || FAMILY_FIXTURES[0];
    return generateSignatureReport(
      currentFixture.childProfile,
      currentFixture.childEvidences,
      buildMomEvidence(currentFixture.momAnswers),
      currentFixture.conflictInput,
      currentFixture.fortuneFacts || null,
      currentFixture.caregiverProfile
    );
  }, [isReviewEnv, selectedMode]);

  useEffect(() => {
    if (selectedMode === "real" && serverReport) trackEvent("report_opened");
  }, [selectedMode, serverReport]);

  const report: SignatureReport | null =
    selectedMode === "real" ? serverReport : fixtureReport;

  const fixtureLabels: Record<"A" | "B" | "C" | "D" | "E", string> = {
    A: "A. 엄마 케이스",
    B: "B. 아빠 케이스",
    C: "C. 할머니 케이스",
    D: "D. 이모 케이스",
    E: "E. LOW-FRICTION",
  };

  if (
    selectedMode === "real" &&
    ready &&
    accessChecked &&
    (reportIdParam ? !hasServerAccess : !hasChildData || !hasMomData)
  ) {
    return null;
  }

  if (selectedMode === "real" && ready && !accessChecked) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 pb-20 pt-8">
          <Container>
            <p className="text-center text-[14px] text-cocoa-soft">
              구매 정보를 확인하고 있어요…
            </p>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // P2.4 §21: 서버가 내려준 리포트가 없으면 유료 본문을 렌더링하지 않는다.
  if (!report) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 pb-20 pt-8">
          <Container>
            <Card tone="plain" className="p-6 text-center">
              <p className="text-[15px] font-bold leading-relaxed text-cocoa">
                이 결과를 볼 수 있는 구매 정보를 확인하지 못했어요.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
                결제한 브라우저에서 다시 열거나, 아래에서 구매 내역을 확인해보세요.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/my-results"
                  className="rounded-2xl bg-coral px-4 py-3 text-[14.5px] font-bold text-white"
                >
                  내 결과 목록 보기
                </Link>
                <Link
                  href="/checkout/signature"
                  className="rounded-2xl bg-milk px-4 py-3 text-[14px] font-bold text-cocoa"
                >
                  결제 화면으로 이동
                </Link>
              </div>
            </Card>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  const childDisplayName = report.meta.childName;
  const momDisplayName = report.meta.momName || report.meta.caregiverRoleLabel;
  const caregiverRoleLabel = report.meta.caregiverRoleLabel;
  const reportCreatedAt = new Date().toISOString();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 pt-3">
        <Container>
          {/* Development Review Controls Toolbar */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mb-6 rounded-2xl border border-coral-tint bg-cream p-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-dark pb-2">
                <div className="flex items-center gap-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1 rounded-xl bg-milk px-2.5 py-1 text-[12px] font-bold text-cocoa transition-colors hover:bg-cream-dark"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    제품 화면
                  </Link>
                  <span className="rounded-md bg-coral/15 px-2 py-0.5 text-[11px] font-bold text-coral-deep">
                    내부 검수용 Mock Report
                  </span>
                  <span className="rounded-md bg-sage-tint px-2 py-0.5 text-[11px] font-bold text-sage-deep">
                    관계: {caregiverRoleLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMode === "real" && (
                    <Link
                      href="/paid/signature/setup"
                      className="inline-flex items-center gap-1 rounded-lg bg-milk px-2 py-0.5 text-[11px] font-bold text-sage-deep hover:bg-cream-dark"
                    >
                      <RefreshCw className="h-3 w-3" />
                      관계/갈등 입력 수정
                    </Link>
                  )}
                  <span className="text-[11px] font-medium text-cocoa-soft">
                    Product Owner Review
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-cocoa">
                    <Users className="h-3.5 w-3.5 text-coral" />
                    리포트 모드 선택
                  </span>
                  <span className="text-[11px] text-cocoa-soft">
                    {selectedMode === "real" ? "★ 내 입력 세션 반영 중" : `QA Fixture ${selectedMode} 검수 중`}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {/* Real Session Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("real")}
                    className={`rounded-xl py-2 px-2 text-center text-[11.5px] font-bold transition-all ${
                      selectedMode === "real"
                        ? "bg-coral text-white shadow-xs"
                        : "bg-milk text-cocoa border border-line hover:bg-cream/70"
                    }`}
                  >
                    내 입력값으로 보기
                  </button>

                  {(["A", "B", "C", "D", "E"] as const).map((fam) => (
                    <button
                      key={fam}
                      type="button"
                      onClick={() => setSelectedMode(fam)}
                      className={`rounded-xl py-2 px-2 text-center text-[11.5px] font-bold transition-all ${
                        selectedMode === fam
                          ? "bg-coral text-white shadow-xs"
                          : "bg-milk text-cocoa-soft border border-line hover:bg-cream/70"
                      }`}
                    >
                      {fixtureLabels[fam]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Report Cover Header */}
          <section id="section-cover" className="animate-rise">
            {selectedMode === "real" ? (
              <div>
                <ReportOwnershipCover
                  childName={childDisplayName}
                  caregiverRoleLabel={caregiverRoleLabel}
                  concernLabel={report.meta.concernLabel}
                  createdAt={reportCreatedAt}
                />
                <p className="mt-4 px-1 text-[14.5px] leading-relaxed text-cocoa-soft">
                  {subj(childDisplayName)} 움직이는 방식과 {subj(momDisplayName)} 반응하는
                  방식이 어디에서 만나고 엇갈리는지 직접 알려주신 장면을 바탕으로 살펴봤어요.
                </p>
              </div>
            ) : (
            <div className="rounded-3xl border border-coral-tint bg-gradient-to-b from-cream via-milk to-milk p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-cream-dark pb-3 text-[12px] font-bold text-coral-deep">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  우리 아이 × 나 관계 사용설명서
                </span>
                <span className="rounded-full bg-coral-tint px-2 py-0.5 text-[11px] text-coral-deep">
                  관계 사용설명서
                </span>
              </div>

              <div className="mt-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-[13px] font-bold text-cocoa">
                  <span>{momDisplayName}</span>
                  <span className="text-coral">×</span>
                  <span>{childDisplayName}</span>
                </div>

                <h1 className="mt-3 text-[23px] font-bold leading-snug tracking-tight text-cocoa">
                  왜 우리 둘은 같은 순간에
                  <br />
                  자꾸 부딪힐까요?
                </h1>

                <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa-soft">
                  {subj(childDisplayName)} 움직이는 방식과 {subj(momDisplayName)} 반응하는 방식이
                  <br />
                  어디에서 만나고 엇갈리는지 직접 알려주신 장면을 바탕으로 살펴봤어요.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-medium text-cocoa-soft">
                  <span className="rounded-lg bg-cream px-2.5 py-1 font-bold text-cocoa">
                    아이: {childDisplayName} ({report.meta.childAgeDisplay})
                  </span>
                  <span className="rounded-lg bg-cream px-2.5 py-1 font-bold text-cocoa">
                    나: {momDisplayName}
                    {momDisplayName !== caregiverRoleLabel && ` (${caregiverRoleLabel})`}
                  </span>
                  <span className="rounded-lg bg-sage-tint px-2.5 py-1 font-bold text-sage-deep">
                    고민: {report.meta.concernLabel}
                  </span>
                </div>
              </div>
            </div>
            )}
          </section>

          {/* P3.5 최상단 요약카드 + 키워드 (스펙 12번) — 이미 생성된 내용에서 조립, 새 AI 호출 없음 */}
          {selectedMode === "real" && (
            <section id="section-summary-cards" className="mt-6 animate-rise">
              <div className="grid grid-cols-2 gap-2.5">
                {buildSummaryCards(report).map((c) => (
                  <div key={c.label} className="rounded-2xl border border-line bg-card p-3.5">
                    <p className="text-[12px] text-cocoa-soft">
                      {c.icon} {c.label}
                    </p>
                    <p className="mt-1 text-[14px] font-bold leading-snug text-cocoa">{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {buildKeywordChips(report).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-lg bg-cream px-2.5 py-1 text-[12px] font-bold text-cocoa"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 01: 한눈에 보는 우리 둘 (10초 안에 핵심 파악) */}
          {report.twoPersonSummary && (
            <section id="section-two-person" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">01</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">한눈에 보는 우리 둘</span>
              </div>
              <TwoPersonSummary
                childName={childDisplayName}
                momName={momDisplayName}
                caregiverRoleLabel={caregiverRoleLabel}
                childKeywords={report.twoPersonSummary.childKeywords}
                childSummary={report.twoPersonSummary.childSummary}
                momKeywords={report.twoPersonSummary.momKeywords}
                momSummary={report.twoPersonSummary.momSummary}
                misalignedPoint={report.twoPersonSummary.misalignedPoint}
                fortuneRelationshipHint={report.twoPersonSummary.fortuneRelationshipHint}
              />
            </section>
          )}

          {/* SECTION 02: 아이에게 통하는 말 (P3.4 신규 — AI + 결정론 evidence 근거) */}
          {report.talkingPoints && (
            <section id="section-talking-points" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">02</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">아이에게 통하는 말</span>
              </div>
              <p className="mb-3 px-1 text-[13.5px] leading-relaxed text-cocoa-soft">
                자주 부딪히는 상황마다, 이 아이에게 더 잘 통할 만한 말을 정리했어요.
              </p>
              <div className="space-y-3">
                {report.talkingPoints.items.map((item) => (
                  <TalkingPointCard key={item.situationId} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 03: 부모×아이 충돌지도 (P3.4 신규 — level=결정론 코드, 설명=AI) */}
          {report.conflictMap && (
            <section id="section-conflict-map" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">03</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">
                  {caregiverRoleLabel}×아이 충돌지도
                </span>
              </div>
              <p className="mb-3 px-1 text-[13.5px] leading-relaxed text-cocoa-soft">
                일상 속 13가지 상황에서 얼마나 부딪히기 쉬운지 정리했어요. 눌러보면 이유와
                바꿔볼 점을 볼 수 있어요.
              </p>
              <div className="space-y-2.5">
                {report.conflictMap.items.map((item) => (
                  <AccordionCard
                    key={item.categoryId}
                    title={item.categoryLabel}
                    summary={<ConflictLevelMeter level={item.level} />}
                  >
                    <div className="space-y-3 text-[14px]">
                      <p className="text-cocoa-soft">{item.whyItHappens}</p>
                      <div className="space-y-1.5">
                        <p className="text-cocoa-soft">
                          <span aria-hidden>❌ </span>
                          <span className="line-through decoration-cocoa-soft/60">
                            {item.avoidExample}
                          </span>
                        </p>
                        <p className="font-semibold text-coral-deep">
                          <span aria-hidden>✅ </span>
                          {item.workingExample}
                        </p>
                      </div>
                      <p className="rounded-lg bg-butter-tint px-3 py-2 text-[13px] text-cocoa">
                        💡 {item.oneThingToChange}
                      </p>
                    </div>
                  </AccordionCard>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 04: 재능 씨앗 TOP5 (P3.5 신규 — 순위/등급은 결정론 코드, 설명은 AI) */}
          {report.talentSeeds && (
            <section id="section-talent-seeds" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">04</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">재능 씨앗</span>
              </div>
              <div className="space-y-3">
                {report.talentSeeds.items.map((item, idx) => (
                  <TalentSeedCard key={item.talentId} item={item} rank={idx + 1} />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 05: 재능을 키우는 실제 행동 (P3.5 신규 — 전부 결정론 큐레이션, AI 없음) */}
          {report.growthContent && (
            <section id="section-growth-actions" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">05</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">재능을 키우는 실제 행동</span>
              </div>
              <div className="space-y-2.5">
                {report.growthContent.growthActions.map((action) => (
                  <AccordionCard key={action.talentId} title={`${action.talentLabel} 키우기`}>
                    <div className="space-y-3 text-[13.5px] leading-relaxed text-cocoa">
                      <div>
                        <p className="text-[12px] font-bold text-sage-deep">추천 놀이</p>
                        <p className="mt-1 text-cocoa-soft">{action.recommendedPlay.join(" · ")}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-sage-deep">부모가 해주면 좋은 질문</p>
                        <p className="mt-1 text-cocoa-soft">{action.parentQuestions.join(" · ")}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-sage-deep">경험시키면 좋은 활동</p>
                        <p className="mt-1 text-cocoa-soft">{action.experienceActivities.join(" · ")}</p>
                      </div>
                      <p className="rounded-lg bg-milk px-3 py-2 text-cocoa-soft">
                        피할 것: {action.avoidParentingPattern}
                      </p>
                      <p className="rounded-lg bg-butter-tint px-3 py-2 text-cocoa">
                        다음 연령 확장: {action.nextAgeExtension}
                      </p>
                    </div>
                  </AccordionCard>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 06: 감정 사용설명서 (P3.5 신규 — AI, 근거 없는 상황은 정직한 generic) */}
          {report.guides && (
            <section id="section-emotion-guide" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">06</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">감정 사용설명서</span>
              </div>
              <div className="space-y-2.5">
                {report.guides.emotionGuide.map((item) => (
                  <AccordionCard key={item.situationId} title={item.situationLabel}>
                    <div className="space-y-2.5 text-[13.5px] leading-relaxed">
                      <p className="text-cocoa-soft">신호: {item.signal}</p>
                      <p className="text-cocoa-soft">오해하기 쉬운 점: {item.misreadPoint}</p>
                      <p className="text-cocoa">도움되는 대응: {item.helpfulResponse}</p>
                      <div className="space-y-1">
                        <p className="text-cocoa-soft">
                          <span aria-hidden>❌ </span>
                          <span className="line-through decoration-cocoa-soft/60">{item.avoidPhrase}</span>
                        </p>
                        <p className="font-semibold text-coral-deep">
                          <span aria-hidden>✅ </span>
                          {item.workingPhrase}
                        </p>
                      </div>
                      <p className="rounded-lg bg-milk px-3 py-2 text-cocoa">
                        진정 후: {item.afterCalmAction}
                      </p>
                    </div>
                  </AccordionCard>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 07: 학습 사용설명서 (P3.5 신규 — AI, 근거 없는 축은 정직한 generic) */}
          {report.guides && (
            <section id="section-learning-guide" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">07</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">학습 사용설명서</span>
              </div>
              <div className="space-y-2.5">
                {report.guides.learningGuide.map((item) => (
                  <AccordionCard key={item.axisId} title={item.axisLabel}>
                    <div className="space-y-2.5 text-[13.5px] leading-relaxed">
                      <p className="text-cocoa">{item.howTheyLearn}</p>
                      <p className="text-cocoa-soft">신호: {item.signOfIt}</p>
                      <p className="rounded-lg bg-butter-tint px-3 py-2 text-cocoa">
                        💡 {item.parentTip}
                      </p>
                    </div>
                  </AccordionCard>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 08: 관계별 사용설명서 (P3.5 신규 — 실제 보호자 1명 + 다른 보호자 CTA) */}
          {report.guides && (
            <section id="section-relationship-guide" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">08</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">
                  {report.guides.relationshipGuide.primary.caregiverRoleLabel}×아이 사용설명서
                </span>
              </div>
              <Card tone="sage" className="p-6 space-y-3 text-[13.5px] leading-relaxed">
                <div>
                  <p className="text-[12px] font-bold text-sage-deep">잘 맞는 부분</p>
                  <ul className="mt-1 space-y-1 text-cocoa">
                    {report.guides.relationshipGuide.primary.goodFitPoints.map((p, i) => (
                      <li key={i}>· {p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-coral-deep">가장 부딪히기 쉬운 부분</p>
                  <ul className="mt-1 space-y-1 text-cocoa">
                    {report.guides.relationshipGuide.primary.frictionPoints.map((p, i) => (
                      <li key={i}>· {p}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-cocoa-soft">
                  무심코 하는 자극: {report.guides.relationshipGuide.primary.unintendedTriggers.join(" · ")}
                </p>
                <p className="text-cocoa">아이가 원하는 방식: {report.guides.relationshipGuide.primary.whatChildWants}</p>
                <p className="text-cocoa">맞는 훈육법: {report.guides.relationshipGuide.primary.disciplineApproach}</p>
                <p className="rounded-lg bg-milk px-3 py-2 text-cocoa">
                  💛 회복이 빠른 화해법: {report.guides.relationshipGuide.primary.quickRepairMethod}
                </p>
              </Card>
              <div className="mt-2.5 rounded-2xl border border-dashed border-line p-4 text-center text-[13px] text-cocoa-soft">
                {report.guides.relationshipGuide.otherCaregiverCta.ctaText}
              </div>
            </section>
          )}

          {/* SECTION 09: 연령별 성장 로드맵 (P3.5 신규 — 전부 결정론, AI 없음) */}
          {report.growthContent && (
            <section id="section-roadmap" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">09</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">연령별 성장 로드맵</span>
              </div>
              <div className="space-y-2.5">
                {report.growthContent.roadmap.map((stage) => (
                  <AccordionCard
                    key={stage.stageId}
                    title={`${stage.ageLabel}${stage.relativeLabel ? ` · ${stage.relativeLabel}` : ""}`}
                    summary={stage.keyKeyword}
                    defaultOpen={stage.detailLevel === "full"}
                  >
                    <div className="space-y-2 text-[13.5px] leading-relaxed text-cocoa">
                      <p>키울 힘: {stage.strengthToNurture}</p>
                      <p>추천 경험: {stage.recommendedExperience}</p>
                      <p>부모 역할: {stage.parentRole}</p>
                      <p className="text-cocoa-soft">조심할 것: {stage.watchOutFor}</p>
                      <p className="text-cocoa-soft">재능 신호: {stage.talentSignal}</p>
                    </div>
                  </AccordionCard>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 10: 미래 연결 분야 (P3.5 신규 — 정적 lookup, AI/순위 없음) */}
          {report.talentSeeds && report.talentSeeds.futureFields.length > 0 && (
            <section id="section-future-fields" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">10</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">이 재능이 커지면 연결될 수 있는 세계</span>
              </div>
              <Card tone="plain" className="p-6">
                <ul className="space-y-2 text-[14px] leading-relaxed text-cocoa">
                  {report.talentSeeds.futureFields.map((f, i) => (
                    <li key={i}>
                      🔭 {f.fromTalentLabel} 재능이 자라면{" "}
                      <span className="font-bold text-coral-deep">{f.field}</span> 분야와 연결될 수 있어요.
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {/* SECTION 11: 오늘의 육아 미션 (P3.5 신규 — 이미 생성된 콘텐츠 조립, 저장 없이 화면 상태만) */}
          {(() => {
            const mission = buildTodayMission(report);
            if (!mission) return null;
            return (
              <section id="section-today-mission" className="mt-6 animate-rise">
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className="text-[13px] font-extrabold tracking-wider text-coral">11</span>
                  <span className="h-1 w-1 rounded-full bg-cream-dark" />
                  <span className="text-[13px] font-bold text-cocoa-soft">오늘의 육아 미션</span>
                </div>
                <TodayMissionCard mission={mission} />
              </section>
            );
          })()}

          {/*
            SECTION 12: 실제로 반복되는 장면.
            P2.5 §3: 이 장면 전문(상황→아이 행동→나의 반응→그다음 결과)은 리포트 전체에서
            여기 한 번만 나온다. 이후 Section 들은 이 장면을 다시 복사하지 않는다.
          */}
          <section id="section-recurring-scene" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">12</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">실제로 반복되는 장면</span>
            </div>
            <Card tone="plain" className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                  {report.chapter01_recurringScene.title}
                </h2>
                <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-cocoa-soft">
                  직접 입력한 일상 근거
                </span>
              </div>
              <p className="mt-3 text-[15px] font-serif leading-relaxed text-cocoa">
                {report.chapter01_recurringScene.narrative}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-cream-dark pt-3">
                {report.chapter01_recurringScene.sceneKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-cream px-2.5 py-1 text-[12px] font-bold text-cocoa"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </Card>
          </section>

          {/*
            SECTION 03: 왜 이 장면이 자꾸 길어질까 — 유료 핵심 INSIGHT.
            P2.5 §1 §10: 여기에는 고객이 입력한 사실을 다시 쓰지 않는다.
            입력들(장면 / 아이 첫 반응 / 나의 첫 반응 / 그다음 결과)을 연결해야
            비로소 보이는 구조(MECHANISM)만 넣는다.

            제거된 것:
              - 옛 CH02(PerspectiveCompare): CH01 장면의 두 문장을 그대로 다시 보여줄 뿐이었다.
              - 옛 CH03(상호작용 패턴): SECTION 01 의 두 요약문과 같은 내용이었다.
            둘 다 §6 SECTION UNIQUE VALUE TEST 를 통과하지 못해 이 Section 으로 통합했다.
          */}
          {report.insightMechanism && (
            <section id="section-mechanism" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">13</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">이 장면의 구조</span>
              </div>
              <Card tone="plain" className="p-6">
                <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                  왜 이 장면이 자꾸 길어질까요?
                </h2>
                <p className="mt-1.5 text-[14px] text-cocoa-soft">
                  같은 장면을 네 칸으로 나눠 보면, 실랑이의 길이를 만드는 칸이 따로 있어요.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-milk p-4">
                    <span className="text-[12px] font-bold text-coral-deep">
                      1. 처음 목표와 마지막에 남은 것
                    </span>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-cocoa">
                      {report.insightMechanism.focusShift}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-milk p-4">
                    <span className="text-[12px] font-bold text-sage-deep">
                      2. 길이가 늘어나기 시작하는 칸
                    </span>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-cocoa">
                      {report.insightMechanism.escalationPoint}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-coral/30 bg-coral-tint/30 p-4">
                    <span className="text-[12px] font-bold text-cocoa">
                      3. 그래서 실제로 바꿀 수 있는 것
                    </span>
                    <p className="mt-1.5 text-[14.5px] font-semibold leading-relaxed text-cocoa">
                      {report.insightMechanism.smallestLever}
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/*
            SECTION 04: 가장 먼저 바꿔볼 한 지점.
            P2.5 §7: 단계 수 문구는 report.chapter04_conflictChain.title 에서 파생된다.
            (예전에는 제목 "4단계" / 설명문 "5단계 패턴" 이 서로 어긋나 있었다)
            P2.5 §8: "여기서 끊어볼 수 있어요" CTA 는 아래 WhereToBreakCard 한 곳에서만 나온다.
          */}
          <section id="section-conflict-chain" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">14</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">가장 먼저 바꿔볼 한 지점</span>
            </div>
            <Card tone="plain" className="p-6">
              <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                {report.chapter04_conflictChain.title}
              </h2>
              <p className="mt-1.5 text-[14px] text-cocoa-soft">
                전부 바꾸지 않아도 돼요. 이 흐름에서 지금 바꿀 수 있는 칸은 하나입니다.
              </p>

              <div className="mt-5">
                <ConflictChainVisual
                  steps={report.chapter04_conflictChain.steps}
                  targetStep={report.chapter04_conflictChain.whereToBreak.targetStep}
                  isCollaborative={report.chapter04_conflictChain.isCollaborative}
                  childName={report.meta.childName}
                  caregiverRoleLabel={caregiverRoleLabel}
                />
              </div>

              {/* 왜 하필 이 칸인지 — 근거 없이 "여기를 바꾸세요"라고 하지 않는다. */}
              {report.breakPointWhy && (
                <div className="mt-5 rounded-2xl bg-milk p-4">
                  <span className="text-[12px] font-bold text-sage-deep">
                    왜 이 칸인가요?
                  </span>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-cocoa">
                    {report.breakPointWhy}
                  </p>
                </div>
              )}

              <div className="mt-5">
                <WhereToBreakCard
                  breakActionTitle={report.chapter04_conflictChain.whereToBreak.breakActionTitle}
                  breakActionDetail={report.chapter04_conflictChain.whereToBreak.breakActionDetail}
                  isCollaborative={report.chapter04_conflictChain.isCollaborative}
                />
              </div>
            </Card>
          </section>

          {/*
            SECTION 05: 다음번에 실제로 이렇게.
            P2.5 §4: 옛 CH05(반복되는 반응)는 옛 CH02 와 완전히 같은 두 문장을 다시
            보여주기만 해서 고객 화면에서 삭제했다.
            옛 CH06(말)과 CH07(행동)은 역할이 이어지므로 하나의 실전 카드로 합쳤다.
            BEFORE(내가 실제로 쓴 말) -> AFTER(대안 한마디) -> 그래도 안 될 때 할 행동 순서.
          */}
          <section id="section-next-time" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">15</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">다음번에 실제로 이렇게</span>
            </div>
            <Card tone="peach" className="p-6">
              <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                다음번 이 장면에서 실제로 해볼 것
              </h2>
              <p className="mt-1.5 text-[14px] text-cocoa-soft">
                3번 칸에서 나올 말 한마디와, 그 말만으로 넘어가지 않을 때 이어서 해볼 행동입니다.
              </p>

              <div className="mt-5 space-y-4">
                {report.chapter06_threePhrases.length > 0 ? (
                  report.chapter06_threePhrases.map((phrase, idx) => (
                    <div key={phrase.phraseId || idx} className="rounded-2xl bg-milk p-4 shadow-xs">
                      <span className="text-[12px] font-bold text-coral-deep">
                        상황: {phrase.situation}
                      </span>
                      <div className="mt-3">
                        <BeforeAfterQuote
                          before={phrase.before}
                          after={phrase.after}
                          whyItMayHelp={phrase.whyItMayHelp}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-milk p-5 text-center text-[14px] text-cocoa-soft">
                    현재 관찰에서는 갈등이 반복되지 않아 억지 교정 문구를 생성하지 않았습니다. 지금의 편안한 대화를 유지해주세요.
                  </div>
                )}
              </div>

              {report.chapter07_threeActions.length > 0 && (
                <div className="mt-6 border-t border-cream-dark pt-5">
                  <span className="text-[12px] font-bold text-sage-deep">
                    말만으로 넘어가지 않을 때 이어서 해볼 것
                  </span>
                  <div className="mt-3">
                    <ActionChecklist actions={report.chapter07_threeActions} />
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/*
            SECTION 06: 출생정보와 함께 보면.
            P2.5 §6: 3블록 이내로 유지하고, "실제 행동이 더 중요하다"는 안내는
            블록 3에서 딱 한 번만 한다. (예전에는 헤더와 블록 3에서 두 번 반복해
            사주 파트를 스스로 무가치하게 만들고 있었다)
          */}
          {report.fortuneRelationship && (
            <section id="section-fortune-relationship" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">16</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">출생정보와 함께 보면</span>
              </div>
              <Card tone="peach" className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-coral-deep">
                    <Compass className="h-4 w-4" />
                    <span>보조 렌즈</span>
                  </div>
                  <h2 className="mt-1 text-[20px] font-bold leading-snug text-cocoa">
                    나와 아이의 출생정보로
                    <br />
                    함께 보는 관계 힌트
                  </h2>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl bg-milk p-4 shadow-xs">
                    <span className="text-[12.5px] font-bold text-sage-deep">
                      1. {childDisplayName}의 출생정보 힌트
                    </span>
                    <ul className="mt-2.5 space-y-1.5 text-[13.5px] leading-relaxed text-cocoa">
                      {report.fortuneRelationship.childHints.map((hint, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-sage-deep shrink-0" />
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-milk p-4 shadow-xs">
                    <span className="text-[12.5px] font-bold text-coral-deep">
                      2. {momDisplayName}의 출생정보 힌트
                    </span>
                    <ul className="mt-2.5 space-y-1.5 text-[13.5px] leading-relaxed text-cocoa">
                      {report.fortuneRelationship.momHints.map((hint, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-coral-deep shrink-0" />
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-coral-tint bg-cream/70 p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-coral-deep">
                    <ShieldCheck className="h-4 w-4" />
                    <span>3. 이 리포트에서 출생정보를 쓴 방식</span>
                  </div>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-cocoa">
                    {report.fortuneRelationship.observationContrastText}
                  </p>
                </div>
              </Card>
            </section>
          )}

          {/* SECTION 07: 이번 리포트에서 기억할 한 가지 — 한 문장이면 충분하다. */}
          <section id="section-anchor" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">17</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">기억할 한 가지</span>
            </div>
            <RelationshipAnchorCard
              oneSentenceAnchor={report.chapter08_corePromise.oneSentenceAnchor}
              meaning={report.chapter08_corePromise.meaning}
            />
          </section>

          {/* 가족 공유 (번호 없음) — P2.5 §12: 본문 복붙 금지, 2줄로 압축 */}
          {selectedMode === "real" && (
            <section id="section-share" className="mt-6 animate-rise">
              <ShareSummaryCard report={report} />
            </section>
          )}

          <section className="mt-6 text-center">
            <Link
              href="/my-results"
              className="text-[14px] font-semibold text-coral-deep underline"
            >
              내 결과 목록에서 다시 보기
            </Link>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

export default function PaidSignatureReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-cocoa">리포트를 불러오는 중입니다...</div>}>
      <PaidSignatureReportInner />
    </Suspense>
  );
}
