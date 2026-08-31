"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { BeforeAfterQuote } from "@/components/ui/BeforeAfterQuote";
import { PerspectiveCompare } from "@/components/report/PerspectiveCompare";
import { ConflictChainVisual } from "@/components/report/ConflictChainVisual";
import { WhereToBreakCard } from "@/components/report/WhereToBreakCard";
import { MomExhaustionCard } from "@/components/report/MomExhaustionCard";
import { ActionChecklist } from "@/components/report/ActionChecklist";
import { RelationshipAnchorCard } from "@/components/report/RelationshipAnchorCard";
import { TwoPersonSummary } from "@/components/report/TwoPersonSummary";
import { FAMILY_FIXTURES, FamilyFixture } from "@/lib/interaction/fixtures";
import { buildMomEvidence } from "@/lib/questionnaire/momEvidence";
import { buildBehaviorEvidence } from "@/lib/questionnaire/evidence";
import { buildFoodEvidence } from "@/lib/questionnaire/foodQuestions";
import { generateSignatureReport } from "@/lib/interaction/signatureReportGenerator";
import { computeFortuneFacts } from "@/lib/fortune/engine";
import { useKids } from "@/lib/store";
import Link from "next/link";
import { Sparkles, Users, ArrowLeft, RefreshCw, Compass, ShieldCheck } from "lucide-react";
import type {
  BehaviorEvidence,
  CaregiverProfile,
  ChildProfile,
  CurrentConflictInput,
  FortuneFacts,
  MomEvidence,
} from "@/lib/types";

type ViewMode = "real" | "A" | "B" | "C" | "D" | "E";

function PaidSignatureReportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { child, answers, concern, caregiverProfile, momAnswers, conflictInput, foodAnswers, ready } = useKids();

  // URL family param check
  const familyParam = searchParams?.get("family")?.toUpperCase();
  const initialMode: ViewMode =
    familyParam && ["A", "B", "C", "D", "E"].includes(familyParam)
      ? (familyParam as "A" | "B" | "C" | "D" | "E")
      : "real";

  const [selectedMode, setSelectedMode] = useState<ViewMode>(initialMode);

  useEffect(() => {
    if (familyParam && ["A", "B", "C", "D", "E"].includes(familyParam)) {
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
    if (ready && selectedMode === "real") {
      if (!hasChildData) {
        router.replace("/free/child");
      } else if (!hasMomData) {
        router.replace("/paid/signature/setup");
      }
    }
  }, [ready, selectedMode, hasChildData, hasMomData, router]);

  // Prepare Report Data
  let reportProfile: ChildProfile;
  let reportChildEv: BehaviorEvidence[];
  let reportMomEv: MomEvidence[];
  let reportConflict: CurrentConflictInput;
  let reportFortune: FortuneFacts | null = null;
  let reportCaregiverProfile: CaregiverProfile | null = null;

  if (selectedMode === "real") {
    // REAL SESSION MODE
    reportProfile = child || {
      name: "우리 아이",
      birthDate: "2023-01-01",
      birthTimeKnown: false,
      gender: "boy",
    };
    reportChildEv = buildBehaviorEvidence(answers || {});
    if (foodAnswers && Object.keys(foodAnswers).length > 0) {
      const foodEv = buildFoodEvidence(foodAnswers);
      reportChildEv = [...reportChildEv, ...foodEv];
    }
    reportMomEv = buildMomEvidence(momAnswers || {});
    reportConflict = conflictInput || {
      concernId: concern || "meal",
      scenarioId: "sc_meal_new_food_reject",
      childFirstReaction: "새로운 반찬을 보자마자 입을 닫고 밀어냄",
      momFirstReaction: "영양 생각에 '한 입만 먹어보자' 하고 숟가락을 건넴",
      subsequentEscalation: "아이가 고개를 돌리거나 숟가락을 밀치며 식탁 분위기가 굳어짐",
      recentFrequency: "several_times_a_week",
      momTypicalPhrase: "한 입만 먹어보자, 진짜 맛있어",
    };
    if (reportProfile.birthDate) {
      reportFortune = computeFortuneFacts(
        reportProfile.birthDate,
        reportProfile.birthTimeKnown,
        reportProfile.birthTime
      );
    }
    reportCaregiverProfile = caregiverProfile;
  } else {
    // QA FIXTURE MODE (A~E)
    const currentFixture: FamilyFixture =
      FAMILY_FIXTURES.find((f) => f.fixtureId === selectedMode) || FAMILY_FIXTURES[0];
    reportProfile = currentFixture.childProfile;
    reportChildEv = currentFixture.childEvidences;
    reportMomEv = buildMomEvidence(currentFixture.momAnswers);
    reportConflict = currentFixture.conflictInput;
    reportFortune = currentFixture.fortuneFacts || null;
    reportCaregiverProfile = currentFixture.caregiverProfile;
  }

  const report = generateSignatureReport(
    reportProfile,
    reportChildEv,
    reportMomEv,
    reportConflict,
    reportFortune,
    reportCaregiverProfile
  );

  const fixtureLabels: Record<"A" | "B" | "C" | "D" | "E", string> = {
    A: "A. 엄마 케이스",
    B: "B. 아빠 케이스",
    C: "C. 할머니 케이스",
    D: "D. 이모 케이스",
    E: "E. LOW-FRICTION",
  };

  const childDisplayName = report.meta.childName;
  const momDisplayName = report.meta.momName || report.meta.caregiverRoleLabel;
  const caregiverRoleLabel = report.meta.caregiverRoleLabel;

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
            <div className="rounded-3xl border border-coral-tint bg-gradient-to-b from-cream via-milk to-milk p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-cream-dark pb-3 text-[12px] font-bold text-coral-deep">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  우리 아이 × 나 관계 사용설명서
                </span>
                <span className="rounded-full bg-coral-tint px-2 py-0.5 text-[11px] text-coral-deep">
                  Signature Report
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
                  {childDisplayName}가 움직이는 방식과 {momDisplayName}가 반응하는 방식이
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
          </section>

          {/* TWO-PERSON SUMMARY (Premium Value Moment 1) */}
          {report.twoPersonSummary && (
            <section id="section-two-person" className="mt-6 animate-rise">
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

          {/* Chapter 01: 지금 우리 집에서 반복되는 장면 */}
          <section id="section-recurring-scene" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 01</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">반복되는 일상 장면</span>
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

          {/* Chapter 02: 같은 상황, 다른 시선 */}
          <section id="section-perspective-gap" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 02</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">시선의 엇갈림</span>
            </div>
            <PerspectiveCompare
              momPerspective={report.chapter02_perspectiveGap.momPerspective}
              childPerspective={report.chapter02_perspectiveGap.childPerspective}
              childName={report.meta.childName}
              caregiverRoleLabel={caregiverRoleLabel}
            />
          </section>

          {/* Chapter 03: 우리 둘의 부딪힘 공식 */}
          <section id="section-interaction-pattern" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 03</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">상호작용 패턴</span>
            </div>
            <Card tone="plain" className="p-6">
              <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                {report.chapter03_interactionPattern.title}
              </h2>
              <p className="mt-1.5 text-[14px] text-cocoa-soft">
                어느 한쪽의 잘못이 아니라, 두 사람의 서로 다른 반응 방식이 맞물려 생기는 자연스러운 결과입니다.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-milk p-4">
                  <span className="text-[12px] font-bold text-sage-deep">
                    [직접 알려주신 실제 모습] {childDisplayName}의 관찰 특성
                  </span>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-cocoa">
                    {report.chapter03_interactionPattern.childBehaviorAspect}
                  </p>
                </div>
                <div className="rounded-2xl bg-milk p-4">
                  <span className="text-[12px] font-bold text-coral-deep">
                    [이번 체크에서 보인 {caregiverRoleLabel} 반응] {momDisplayName}의 반응 패턴
                  </span>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-cocoa">
                    {report.chapter03_interactionPattern.momReactionAspect}
                  </p>
                </div>
                <div className="rounded-2xl border border-coral/30 bg-coral-tint/30 p-4">
                  <span className="text-[12px] font-bold text-cocoa">상호작용 종합</span>
                  <p className="mt-1 text-[14.5px] font-semibold leading-relaxed text-cocoa">
                    {report.chapter03_interactionPattern.synthesis}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* NEW CHAPTER: 태어난 기질로 같이 보는 엄마 × 아이 관계 힌트 */}
          {report.fortuneRelationship && (
            <section id="section-fortune-relationship" className="mt-6 animate-rise">
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="text-[13px] font-extrabold tracking-wider text-coral">RELATIONSHIP HINT</span>
                <span className="h-1 w-1 rounded-full bg-cream-dark" />
                <span className="text-[13px] font-bold text-cocoa-soft">출생정보 교차 힌트</span>
              </div>
              <Card tone="peach" className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-coral-deep">
                    <Compass className="h-4 w-4" />
                    <span>출생정보 기반 보조 힌트 (참고용 REFLECTIVE 레이어)</span>
                  </div>
                  <h2 className="mt-1 text-[20px] font-bold leading-snug text-cocoa">
                    나와 아이의 출생정보로
                    <br />
                    함께 보는 관계 힌트
                  </h2>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-cocoa-soft">
                    사주 출생정보는 성격을 확정하지 않고 보조 힌트로만 참고하며, 실제 관찰된 행동을 가장 우선으로 분석합니다.
                  </p>
                </div>

                {/* A & B: 아이와 엄마 출생정보 힌트 */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl bg-milk p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-bold text-sage-deep">
                        A. {childDisplayName}의 출생정보 힌트
                      </span>
                      <span className="rounded-full bg-sage-tint px-2 py-0.5 text-[10.5px] font-semibold text-sage-deep">
                        출생정보 보조 힌트
                      </span>
                    </div>
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
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-bold text-coral-deep">
                        B. {momDisplayName}의 출생정보 힌트
                      </span>
                      <span className="rounded-full bg-coral-tint px-2 py-0.5 text-[10.5px] font-semibold text-coral-deep">
                        출생정보 보조 힌트
                      </span>
                    </div>
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

                {/* C. 두 사람을 같이 보면 */}
                <div className="rounded-2xl bg-milk p-4.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-cream-dark pb-2">
                    <span className="text-[13px] font-bold text-cocoa">
                      C. 두 사람을 같이 보면
                    </span>
                    <span className="text-[11px] font-medium text-cocoa-soft">
                      교차 기질 참고
                    </span>
                  </div>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-cocoa">
                    {report.fortuneRelationship.reflectionText}
                  </p>
                  <div className="mt-3 space-y-1 text-[12.5px] text-cocoa-soft">
                    {report.fortuneRelationship.contrastingThemes.map((theme, i) => (
                      <p key={i}>• {theme}</p>
                    ))}
                  </div>
                </div>

                {/* D. 실제 모습과 함께 보면 (관찰 우선주의 원칙) */}
                <div className="rounded-2xl border border-coral-tint bg-cream/70 p-4.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-coral-deep">
                    <ShieldCheck className="h-4 w-4" />
                    <span>D. 실제 모습과 함께 보면 (가장 중요)</span>
                  </div>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-cocoa">
                    {report.fortuneRelationship.observationContrastText}
                  </p>
                </div>
              </Card>
            </section>
          )}

          {/* Chapter 04: 우리 둘의 반복 갈등 Chain + WHERE TO BREAK */}
          <section id="section-conflict-chain" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 04</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">갈등의 고리</span>
            </div>
            <Card tone="plain" className="p-6">
              <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                {report.chapter04_conflictChain.title}
              </h2>
              <p className="mt-1.5 text-[14px] text-cocoa-soft">
                사소한 자극에서 시작해 감정 소모로 끝나는 5단계 패턴과, 이를 끊을 수 있는 단 하나의 지점입니다.
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

              <div className="mt-5">
                <WhereToBreakCard
                  breakActionTitle={report.chapter04_conflictChain.whereToBreak.breakActionTitle}
                  breakActionDetail={report.chapter04_conflictChain.whereToBreak.breakActionDetail}
                  isCollaborative={report.chapter04_conflictChain.isCollaborative}
                />
              </div>
            </Card>
          </section>

          {/* Chapter 05: 엄마가 이 순간 특히 지치는 이유 / 잘 맞는 지점 */}
          <section id="section-mom-exhaustion" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 05</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">
                {report.chapter05_momExhaustionPoint.isLowFriction
                  ? "호흡의 연결"
                  : "내 마음 돌봄"}
              </span>
            </div>
            <MomExhaustionCard
              caregiverRoleLabel={caregiverRoleLabel}
              title={report.chapter05_momExhaustionPoint.title}
              isLowFriction={report.chapter05_momExhaustionPoint.isLowFriction}
              exhaustionReason={report.chapter05_momExhaustionPoint.exhaustionReason}
              comfortMessage={report.chapter05_momExhaustionPoint.comfortMessage}
            />
          </section>

          {/* Chapter 06: 오늘 바로 바꿔볼 말 */}
          <section id="section-phrases" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 06</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">말 한마디의 변화</span>
            </div>
            <Card tone="peach" className="p-6">
              <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                오늘 바로 바꿔볼 말
              </h2>
              <p className="mt-1.5 text-[14px] text-cocoa-soft">
                실제 마찰이 일어나는 순간, 길고 거창한 훈육 대신 바로 입에서 나올 수 있는 짧은 한마디입니다.
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
            </Card>
          </section>

          {/* Chapter 07: 오늘부터 해볼 행동 */}
          <section id="section-actions" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 07</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">작은 실천</span>
            </div>
            <Card tone="plain" className="p-6">
              <h2 className="text-[19px] font-bold leading-snug text-cocoa">
                오늘부터 해볼 행동
              </h2>
              <p className="mt-1.5 text-[14px] text-cocoa-soft">
                준비물 없이 오늘 당장 시도해볼 수 있는 2~3가지 행동 원칙입니다.
              </p>

              <div className="mt-5">
                <ActionChecklist actions={report.chapter07_threeActions} />
              </div>
            </Card>
          </section>

          {/* Chapter 08: 우리 둘이 오래 기억할 한 가지 */}
          <section id="section-anchor" className="mt-6 animate-rise">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="text-[13px] font-extrabold tracking-wider text-coral">CHAPTER 08</span>
              <span className="h-1 w-1 rounded-full bg-cream-dark" />
              <span className="text-[13px] font-bold text-cocoa-soft">관계의 닻</span>
            </div>
            <RelationshipAnchorCard
              oneSentenceAnchor={report.chapter08_corePromise.oneSentenceAnchor}
              meaning={report.chapter08_corePromise.meaning}
            />
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
