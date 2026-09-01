"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useKids } from "@/lib/store";
import { MOM_QUESTIONS } from "@/lib/questionnaire/momQuestions";
import { FOOD_QUESTIONS } from "@/lib/questionnaire/foodQuestions";
import { SLEEP_QUESTIONS } from "@/lib/questionnaire/sleepQuestions";
import { CONFLICT_SCENARIOS, ConflictScenario } from "@/lib/interaction/conflictScenarios";
import { computeAge } from "@/lib/age";
import { concernLabel } from "@/lib/concerns";
import { CAREGIVER_ROLE_OPTIONS, findRoleOption } from "@/lib/caregiver";
import type {
  CaregiverProfile,
  ConcernId,
  CurrentConflictInput,
  FoodMicroCheckAnswers,
  SleepMicroCheckAnswers,
} from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();
const MOM_YEAR_OPTIONS = Array.from({ length: 45 }, (_, i) => CURRENT_YEAR - 18 - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

function getDaysInMonth(y: number, m: number): number {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

type SetupStep =
  | "relationship"
  | "caregiver_profile"
  | "mom_mini_check"
  | "food_micro_check"
  | "sleep_micro_check"
  | "conflict_scene"
  | "summary";

export default function MomSetupPage() {
  const router = useRouter();
  const {
    child,
    concern,
    ready,
    caregiverProfile,
    momAnswers,
    conflictInput,
    foodAnswers,
    sleepAnswers,
    setCaregiverProfile,
    setMomAnswer,
    setConflictInput,
    setFoodAnswer,
    setSleepAnswer,
  } = useKids();

  // Child data check
  useEffect(() => {
    if (ready && !child) {
      router.replace("/free/child");
    }
  }, [ready, child, router]);

  const [step, setStep] = useState<SetupStep>("relationship");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentFoodQuestionIndex, setCurrentFoodQuestionIndex] = useState(0);
  const [currentSleepQuestionIndex, setCurrentSleepQuestionIndex] = useState(0);

  // 1. 아이와의 관계 (P2.2V.6 필수 입력)
  const initialRoleOptionId =
    CAREGIVER_ROLE_OPTIONS.find((o) => o.roleLabel === caregiverProfile?.roleLabel)?.optionId ??
    (caregiverProfile ? "cg_other_family" : "");
  const [roleOptionId, setRoleOptionId] = useState<string>(initialRoleOptionId);
  const [customRoleLabel, setCustomRoleLabel] = useState<string>(
    initialRoleOptionId === "cg_other_family" ? caregiverProfile?.roleLabel ?? "" : ""
  );

  const selectedRoleOption = findRoleOption(roleOptionId);
  const resolvedRoleLabel = selectedRoleOption?.requiresCustomLabel
    ? customRoleLabel.trim()
    : selectedRoleOption?.roleLabel ?? "";
  const canSubmitRelationship = Boolean(
    selectedRoleOption &&
      (!selectedRoleOption.requiresCustomLabel || customRoleLabel.trim().length > 0)
  );

  // 2. 나의 기본 정보 (Child input과 동일한 구조 & validation)
  const [momName, setMomName] = useState(caregiverProfile?.displayName ?? "");
  const initialMomParts = caregiverProfile?.birthDate ? caregiverProfile.birthDate.split("-") : [];
  const [momYear, setMomYear] = useState<string>(initialMomParts[0] ?? "");
  const [momMonth, setMomMonth] = useState<string>(
    initialMomParts[1] ? String(Number(initialMomParts[1])) : ""
  );
  const [momDay, setMomDay] = useState<string>(
    initialMomParts[2] ? String(Number(initialMomParts[2])) : ""
  );
  const [birthTimeKnown, setBirthTimeKnown] = useState(
    caregiverProfile?.birthTimeKnown ?? false
  );
  const [hour, setHour] = useState<string>(
    caregiverProfile?.birthTime ? caregiverProfile.birthTime.split(":")[0] : ""
  );

  const momBirthDate = useMemo(() => {
    if (!momYear || !momMonth || !momDay) return "";
    const yNum = Number(momYear);
    const mNum = Number(momMonth);
    let dNum = Number(momDay);
    const maxDays = getDaysInMonth(yNum, mNum);
    if (dNum > maxDays) dNum = maxDays;
    return `${momYear}-${String(momMonth).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
  }, [momYear, momMonth, momDay]);

  const maxDays = useMemo(
    () => getDaysInMonth(Number(momYear), Number(momMonth)),
    [momYear, momMonth]
  );
  const momDayOptions = useMemo(
    () => Array.from({ length: maxDays }, (_, i) => i + 1),
    [maxDays]
  );

  const canSubmitProfile = Boolean(momYear && momMonth && momDay && momBirthDate);

  // 2. Mom Mini Check answers
  const [localMomAnswers, setLocalMomAnswers] = useState<Record<string, string>>(momAnswers || {});

  // 3. Conflict scene state (Concern is Report Anchor)
  const currentConcern: ConcernId = concern || "meal";
  const hasConcernMicroCheck = currentConcern === "meal" || currentConcern === "sleep";
  const matchingScenarios = useMemo(() => {
    const list = CONFLICT_SCENARIOS.filter((s) => s.concernId === currentConcern);
    return list.length > 0 ? list : CONFLICT_SCENARIOS.filter((s) => s.concernId === "meal");
  }, [currentConcern]);

  const defaultScenario = matchingScenarios[0] || CONFLICT_SCENARIOS[0];

  const defaultDefaultsForConcern = useMemo(() => {
    if (currentConcern === "meal") {
      return {
        childReaction: "새로운 반찬을 보자마자 입을 닫고 밀어냄",
        momReaction: "영양 생각에 '한 입만 먹어보자' 하고 숟가락을 건넴",
        escalation: "아이가 고개를 돌리거나 숟가락을 밀치며 식탁 분위기가 굳어짐",
        typicalPhrase: "한 입만 먹어보자, 진짜 맛있어",
      };
    } else if (currentConcern === "tantrum") {
      return {
        childReaction: "원하는 것이 뜻대로 안 되자 크게 울며 떼를 씀",
        momReaction: "상황을 설명하려 '왜 그래, 울지 말고 말해' 하고 다독임",
        escalation: "아이가 더 크게 울며 대화가 이어지지 않고 지침",
        typicalPhrase: "울지 말고 차근차근 이야기해봐",
      };
    } else if (currentConcern === "shyness" || currentConcern === "daycare") {
      return {
        childReaction: "새로운 장소나 사람 앞에서 내 뒤로 숨고 굳어짐",
        momReaction: "아이가 어색해할까 봐 '어서 가서 인사해보자' 하고 참여를 권함",
        escalation: "아이가 더 세게 매달리며 낯선 환경에 들어가지 못함",
        typicalPhrase: "괜찮아, 친구들이랑 가서 인사하고 놀아",
      };
    } else if (currentConcern === "sleep") {
      return {
        childReaction: "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함",
        momReaction: "'이제 자야 할 시간이야, 빨리 누워' 하고 재촉함",
        escalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
        typicalPhrase: "이제 자야 할 시간이야, 빨리 누워",
      };
    } else {
      return {
        childReaction: "하던 놀이나 방식을 멈추지 않고 계속 이어가려 함",
        momReaction: "일과를 챙기기 위해 '빨리 하자, 늦었어' 하고 재촉함",
        escalation: "아이가 제자리에 멈춰 서서 버티며 실랑이가 길어짐",
        typicalPhrase: "빨리 하자, 늦었어!",
      };
    }
  }, [currentConcern]);

  const [scenarioId, setScenarioId] = useState(
    conflictInput?.scenarioId && matchingScenarios.some((s) => s.scenarioId === conflictInput.scenarioId)
      ? conflictInput.scenarioId
      : defaultScenario.scenarioId
  );
  const [childFirstReaction, setChildFirstReaction] = useState(
    conflictInput?.childFirstReaction || defaultDefaultsForConcern.childReaction
  );
  const [momFirstReaction, setMomFirstReaction] = useState(
    conflictInput?.momFirstReaction || defaultDefaultsForConcern.momReaction
  );
  const [subsequentEscalation, setSubsequentEscalation] = useState(
    conflictInput?.subsequentEscalation || defaultDefaultsForConcern.escalation
  );
  const [recentFrequency, setRecentFrequency] = useState<"daily" | "several_times_a_week" | "weekly" | "occasional">(
    conflictInput?.recentFrequency || "several_times_a_week"
  );
  const [momTypicalPhrase, setMomTypicalPhrase] = useState(
    conflictInput?.momTypicalPhrase || defaultDefaultsForConcern.typicalPhrase
  );

  // Sync if concern changed and no custom input was given
  useEffect(() => {
    if (!conflictInput) {
      setScenarioId(defaultScenario.scenarioId);
      setChildFirstReaction(defaultDefaultsForConcern.childReaction);
      setMomFirstReaction(defaultDefaultsForConcern.momReaction);
      setSubsequentEscalation(defaultDefaultsForConcern.escalation);
      setMomTypicalPhrase(defaultDefaultsForConcern.typicalPhrase);
    }
  }, [defaultScenario, defaultDefaultsForConcern, conflictInput]);

  if (!ready || !child) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-milk text-cocoa">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  const childAgeInfo = computeAge(child.birthDate);
  const childDisplayName = child.name || "우리 아이";
  const momDisplayName = momName.trim() || resolvedRoleLabel || "보호자";

  // Navigation handlers
  function handleSaveProfileAndNext() {
    // P2.2V.6 데이터 유효성: 관계 정보 없이는 리포트를 만들지 않는다.
    if (!canSubmitProfile || !canSubmitRelationship || !selectedRoleOption) return;
    const profile: CaregiverProfile = {
      role: selectedRoleOption.role,
      roleLabel: resolvedRoleLabel,
      displayName: momName.trim() || undefined,
      birthDate: momBirthDate,
      birthTimeKnown,
      birthTime:
        birthTimeKnown && hour !== "" ? `${hour.padStart(2, "0")}:00` : undefined,
    };
    setCaregiverProfile(profile);
    setStep("mom_mini_check");
  }

  function handleSelectMomOption(domain: string, optionId: string) {
    const updated = { ...localMomAnswers, [domain]: optionId };
    setLocalMomAnswers(updated);
    setMomAnswer(domain, optionId);

    if (currentQuestionIndex < MOM_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (currentConcern === "meal") {
        setStep("food_micro_check");
        setCurrentFoodQuestionIndex(0);
      } else if (currentConcern === "sleep") {
        setStep("sleep_micro_check");
        setCurrentSleepQuestionIndex(0);
      } else {
        setStep("conflict_scene");
      }
    }
  }

  function handleSelectSleepOption(
    questionId: keyof SleepMicroCheckAnswers,
    patternId: SleepMicroCheckAnswers[keyof SleepMicroCheckAnswers]
  ) {
    setSleepAnswer(questionId, patternId);

    if (currentSleepQuestionIndex < SLEEP_QUESTIONS.length - 1) {
      setCurrentSleepQuestionIndex(currentSleepQuestionIndex + 1);
    } else {
      setStep("conflict_scene");
    }
  }

  function handleSelectFoodOption(questionId: keyof FoodMicroCheckAnswers, patternId: string) {
    setFoodAnswer(questionId, patternId);

    if (currentFoodQuestionIndex < FOOD_QUESTIONS.length - 1) {
      setCurrentFoodQuestionIndex(currentFoodQuestionIndex + 1);
    } else {
      setStep("conflict_scene");
    }
  }

  function handleSaveConflictAndNext() {
    const conflict: CurrentConflictInput = {
      concernId: currentConcern,
      scenarioId,
      childFirstReaction,
      momFirstReaction,
      subsequentEscalation,
      recentFrequency,
      momTypicalPhrase,
    };
    setConflictInput(conflict);
    setStep("summary");
  }

  function handleCompleteAndGoCheckout() {
    router.push("/checkout/signature");
  }

  const inputCls =
    "mt-2 w-full rounded-[1.05rem] border border-line bg-card px-4 py-3.5 text-[15.5px] text-cocoa placeholder:text-cocoa-faint focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15";
  const selectCls =
    "w-full rounded-[1.05rem] border border-line bg-card px-3 py-3.5 text-[15px] font-medium text-cocoa focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15";

  const selectedScenarioObj = matchingScenarios.find((s) => s.scenarioId === scenarioId) || defaultScenario;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 pt-4">
        <Container>
          {/* Progress Indicator */}
          <div className="mb-6 flex items-center justify-between border-b border-cream-dark pb-3 text-[12px] font-bold text-cocoa-soft">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[11px] text-white">
                {step === "relationship"
                  ? 1
                  : step === "caregiver_profile"
                  ? 2
                  : step === "mom_mini_check"
                  ? 3
                  : step === "food_micro_check" || step === "sleep_micro_check"
                  ? 4
                  : step === "conflict_scene"
                  ? hasConcernMicroCheck ? 5 : 4
                  : hasConcernMicroCheck ? 6 : 5}
              </span>
              <span>
                {step === "relationship" && "아이와 나의 관계"}
                {step === "caregiver_profile" && `${resolvedRoleLabel || "나"}의 기본 정보`}
                {step === "mom_mini_check" && `내 반응 체크 (${currentQuestionIndex + 1}/5)`}
                {step === "food_micro_check" && `식습관 관찰 체크 (${currentFoodQuestionIndex + 1}/4)`}
                {step === "sleep_micro_check" && `수면 관찰 체크 (${currentSleepQuestionIndex + 1}/4)`}
                {step === "conflict_scene" && `요즘 가장 힘든 장면 (${concernLabel(currentConcern)})`}
                {step === "summary" && "관계 리포트 준비 완료"}
              </span>
            </div>
            <span className="text-[11px] text-sage-deep font-semibold">
              {childDisplayName} × {momDisplayName}
            </span>
          </div>

          {/* STEP 1: 아이와의 관계 선택 (P2.2V.6 필수) */}
          {step === "relationship" && (
            <div className="animate-rise space-y-6">
              <div>
                <Eyebrow>아이와의 관계</Eyebrow>
                <h1 className="mt-2 text-[26px] font-bold leading-snug tracking-tight text-cocoa">
                  {childDisplayName}와
                  <br />
                  어떤 관계인가요?
                </h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-cocoa-soft">
                  아이를 가장 가까이에서 돌보는 사람과 아이의 관계를 함께 봅니다. 고른 관계에 맞춰 리포트 문장이 만들어져요.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {CAREGIVER_ROLE_OPTIONS.map((opt) => {
                  const isSelected = roleOptionId === opt.optionId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => setRoleOptionId(opt.optionId)}
                      className={`rounded-2xl border px-3 py-4 text-center text-[15px] font-semibold transition-all ${
                        isSelected
                          ? "border-coral bg-coral-tint/40 text-cocoa shadow-xs"
                          : "border-line bg-milk text-cocoa hover:bg-cream/40"
                      }`}
                    >
                      {opt.roleLabel}
                    </button>
                  );
                })}
              </div>

              {selectedRoleOption?.requiresCustomLabel && (
                <div>
                  <label className="text-[14px] font-semibold text-cocoa" htmlFor="custom_role">
                    아이에게 나는 어떤 사람인가요? <span className="text-coral-deep">*</span>
                  </label>
                  <input
                    id="custom_role"
                    type="text"
                    value={customRoleLabel}
                    onChange={(e) => setCustomRoleLabel(e.target.value)}
                    placeholder="예: 큰이모, 작은아빠, 외할머니, 돌봄 선생님"
                    maxLength={12}
                    className={inputCls}
                  />
                  <p className="mt-2 text-[13px] text-cocoa-faint">
                    입력하신 관계명이 리포트 전체에 그대로 사용돼요.
                  </p>
                </div>
              )}

              <Button
                size="lg"
                disabled={!canSubmitRelationship}
                onClick={() => setStep("caregiver_profile")}
              >
                다음: {resolvedRoleLabel || "나"}의 기본 정보
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Button>
            </div>
          )}

          {/* STEP 2: 나의 기본 정보 (ChildInputPage와 완전히 동일한 UX/구조) */}
          {step === "caregiver_profile" && (
            <div className="animate-rise space-y-6">
              <div>
                <Eyebrow>나의 기본 정보 · {resolvedRoleLabel}</Eyebrow>
                <h1 className="mt-2 text-[26px] font-bold leading-snug tracking-tight text-cocoa">
                  이번에는 아이와 함께 지내는
                  <br />
                  ‘나’의 모습도 알려주세요
                </h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-cocoa-soft">
                  {childDisplayName}와 내가 어떤 순간에 엇갈리는지 함께 살펴볼게요.
                </p>
              </div>

              <form
                className="mt-6 flex flex-col gap-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfileAndNext();
                }}
              >
                {/* 나의 호칭/이름 (선택) */}
                <div>
                  <label className="text-[14px] font-semibold text-cocoa" htmlFor="mom_name">
                    나의 호칭 · 이름{" "}
                    <span className="font-medium text-cocoa-faint">
                      (선택 · 비우면 ‘{resolvedRoleLabel}’로 표시돼요)
                    </span>
                  </label>
                  <input
                    id="mom_name"
                    type="text"
                    value={momName}
                    onChange={(e) => setMomName(e.target.value)}
                    placeholder={`예: 지우맘, 민준아빠 (미입력 시 ‘${resolvedRoleLabel}’)`}
                    maxLength={20}
                    className={inputCls}
                  />
                </div>

                {/* 나의 생년월일 (년 - 월 - 일 순서) */}
                <div>
                  <span className="text-[14px] font-semibold text-cocoa">
                    나의 생년월일 <span className="text-coral-deep">*</span>
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <select
                        id="mom_birth_year"
                        value={momYear}
                        onChange={(e) => setMomYear(e.target.value)}
                        className={selectCls}
                        aria-label="태어난 연도"
                      >
                        <option value="">년도</option>
                        {MOM_YEAR_OPTIONS.map((y) => (
                          <option key={y} value={String(y)}>
                            {y}년
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        id="mom_birth_month"
                        value={momMonth}
                        onChange={(e) => setMomMonth(e.target.value)}
                        className={selectCls}
                        aria-label="태어난 월"
                      >
                        <option value="">월</option>
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m} value={String(m)}>
                            {m}월
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        id="mom_birth_day"
                        value={momDay}
                        onChange={(e) => setMomDay(e.target.value)}
                        className={selectCls}
                        aria-label="태어난 일"
                      >
                        <option value="">일</option>
                        {momDayOptions.map((d) => (
                          <option key={d} value={String(d)}>
                            {d}일
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {momYear && momMonth && momDay && (
                    <p className="mt-2 text-[13.5px] text-sage-deep">
                      {momYear}년 {momMonth}월 {momDay}일
                    </p>
                  )}
                </div>

                {/* 나의 출생시간 (Child와 동일한 UI) */}
                <div>
                  <span className="text-[14px] font-semibold text-cocoa">
                    태어난 시간{" "}
                    <span className="font-medium text-cocoa-faint">
                      (몰라도 괜찮아요)
                    </span>
                  </span>
                  <label className="mt-2 flex items-center gap-2.5 text-[14px] text-cocoa-soft">
                    <input
                      type="checkbox"
                      checked={!birthTimeKnown}
                      onChange={(e) => setBirthTimeKnown(!e.target.checked)}
                      className="h-4 w-4 accent-coral"
                    />
                    시간을 몰라요
                  </label>
                  {birthTimeKnown && (
                    <select
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">태어난 시(時)를 골라 주세요</option>
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={String(h)}>
                          {h.toString().padStart(2, "0")}시대 ({h}:00~{h}:59)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <Button type="submit" size="lg" disabled={!canSubmitProfile}>
                  다음: 내 반응 5문항 체크
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </Button>
                <p className="-mt-2 text-center text-[12.5px] text-cocoa-faint">
                  입력한 정보는 이 기기에만 안전하게 저장돼요.
                </p>
              </form>
            </div>
          )}

          {/* STEP 2: Mom Mini Check (5문항) */}
          {step === "mom_mini_check" && (
            <div className="animate-rise space-y-6">
              <div>
                <Eyebrow>내 반응 체크 · {currentQuestionIndex + 1}/5</Eyebrow>
                <h1 className="mt-2 text-[22px] font-bold leading-snug tracking-tight text-cocoa">
                  {MOM_QUESTIONS[currentQuestionIndex].prompt}
                </h1>
                <p className="mt-2 text-[14px] text-cocoa-soft">
                  정답은 없어요. 평소 내 모습과 가장 가까운 쪽을 골라주세요.
                </p>
              </div>

              <div className="space-y-3">
                {MOM_QUESTIONS[currentQuestionIndex].options.map((opt) => {
                  const currentDomain = MOM_QUESTIONS[currentQuestionIndex].domain;
                  const isSelected = localMomAnswers[currentDomain] === opt.optionId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectMomOption(currentDomain, opt.optionId)}
                      className={`w-full rounded-2xl border p-4.5 text-left transition-all ${
                        isSelected
                          ? "border-coral bg-coral-tint/40 shadow-xs"
                          : "border-line bg-milk hover:bg-cream/40"
                      }`}
                    >
                      <p className="text-[15px] font-medium leading-relaxed text-cocoa">
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                {currentQuestionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    이전 문항
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep("caregiver_profile")}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    내 기본 정보 수정
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2-B: Food Concern Micro Check (4문항, 식습관/편식 고민 시 노출) */}
          {step === "food_micro_check" && (
            <div className="animate-rise space-y-6">
              <div>
                <Eyebrow>식습관 관찰 · {currentFoodQuestionIndex + 1}/4</Eyebrow>
                <h1 className="mt-2 text-[22px] font-bold leading-snug tracking-tight text-cocoa">
                  {FOOD_QUESTIONS[currentFoodQuestionIndex].title}
                </h1>
                <p className="mt-2 text-[14px] text-cocoa-soft">
                  {FOOD_QUESTIONS[currentFoodQuestionIndex].subtitle}
                </p>
              </div>

              <div className="space-y-3">
                {FOOD_QUESTIONS[currentFoodQuestionIndex].options.map((opt) => {
                  const currentQId = FOOD_QUESTIONS[currentFoodQuestionIndex].id;
                  const isSelected = foodAnswers?.[currentQId] === opt.patternId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectFoodOption(currentQId, opt.patternId)}
                      className={`w-full rounded-2xl border p-4.5 text-left transition-all ${
                        isSelected
                          ? "border-coral bg-coral-tint/40 shadow-xs"
                          : "border-line bg-milk hover:bg-cream/40"
                      }`}
                    >
                      <p className="text-[15px] font-medium leading-relaxed text-cocoa">
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                {currentFoodQuestionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentFoodQuestionIndex(currentFoodQuestionIndex - 1)}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    이전 문항
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("mom_mini_check");
                      setCurrentQuestionIndex(MOM_QUESTIONS.length - 1);
                    }}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    내 반응 체크로 돌아가기
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2-C: Sleep Concern Micro Check (4문항, 수면/잠 고민 시 노출) */}
          {step === "sleep_micro_check" && (
            <div id="section-sleep-micro-check" className="animate-rise space-y-6">
              <div>
                <Eyebrow>수면 관찰 · {currentSleepQuestionIndex + 1}/4</Eyebrow>
                <h1 className="mt-2 text-[22px] font-bold leading-snug tracking-tight text-cocoa">
                  {SLEEP_QUESTIONS[currentSleepQuestionIndex].title}
                </h1>
                <p className="mt-2 text-[14px] text-cocoa-soft">
                  {SLEEP_QUESTIONS[currentSleepQuestionIndex].subtitle}
                </p>
              </div>

              <div className="space-y-3">
                {SLEEP_QUESTIONS[currentSleepQuestionIndex].options.map((opt) => {
                  const currentQId = SLEEP_QUESTIONS[currentSleepQuestionIndex].id;
                  const isSelected = sleepAnswers?.[currentQId] === opt.patternId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectSleepOption(currentQId, opt.patternId)}
                      className={`w-full rounded-2xl border p-4.5 text-left transition-all ${
                        isSelected
                          ? "border-coral bg-coral-tint/40 shadow-xs"
                          : "border-line bg-milk hover:bg-cream/40"
                      }`}
                    >
                      <p className="text-[15px] font-medium leading-relaxed text-cocoa">
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                {currentSleepQuestionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentSleepQuestionIndex(currentSleepQuestionIndex - 1)}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    이전 문항
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep("mom_mini_check")}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    내 반응 체크로 돌아가기
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Current Conflict Input (Concern is Report Anchor) */}
          {step === "conflict_scene" && (
            <div className="animate-rise space-y-6">
              <div>
                <Eyebrow>반복되는 장면 · {concernLabel(currentConcern)}</Eyebrow>
                <h1 className="mt-2 text-[23px] font-bold leading-snug tracking-tight text-cocoa">
                  요즘 {childDisplayName}와 가장 자주
                  <br />
                  부딪히는 {concernLabel(currentConcern)} 장면을 알려주세요.
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-cocoa-soft">
                  직접 경험하신 일상의 구체적인 장면을 바탕으로 리포트가 만들어집니다.
                </p>
              </div>

              <Card tone="plain" className="p-6 space-y-4">
                <div>
                  <label className="text-[13px] font-bold text-cocoa">
                    A. 요즘 {concernLabel(currentConcern)}에서 가장 힘든 순간은?
                  </label>
                  <select
                    value={scenarioId}
                    onChange={(e) => setScenarioId(e.target.value)}
                    className={`mt-2 ${selectCls}`}
                  >
                    {matchingScenarios.map((sc) => (
                      <option key={sc.scenarioId} value={sc.scenarioId}>
                        {sc.title} ({sc.situationPrompt})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[13px] font-bold text-cocoa">
                    B. 그 순간 {childDisplayName}의 첫 반응은 어떤가요?
                  </label>
                  <input
                    type="text"
                    value={childFirstReaction}
                    onChange={(e) => setChildFirstReaction(e.target.value)}
                    placeholder={`예: ${defaultDefaultsForConcern.childReaction}`}
                    className="mt-2 w-full rounded-[1.05rem] border border-line bg-milk px-4 py-3 text-[14.5px] text-cocoa focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-bold text-cocoa">
                    C. 나의 첫 반응과 자주 나오는 말은 무엇인가요?
                  </label>
                  <input
                    type="text"
                    value={momFirstReaction}
                    onChange={(e) => setMomFirstReaction(e.target.value)}
                    placeholder={`예: ${defaultDefaultsForConcern.momReaction}`}
                    className="mt-2 w-full rounded-[1.05rem] border border-line bg-milk px-4 py-3 text-[14.5px] text-cocoa focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15"
                  />
                  <input
                    type="text"
                    value={momTypicalPhrase}
                    onChange={(e) => setMomTypicalPhrase(e.target.value)}
                    placeholder={`내가 자주 하는 말 (예: ${defaultDefaultsForConcern.typicalPhrase})`}
                    className="mt-2 w-full rounded-[1.05rem] border border-line bg-milk px-4 py-2.5 text-[13.5px] text-cocoa focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-bold text-cocoa">
                    D. 그다음 보통 어떻게 흘러가나요?
                  </label>
                  <input
                    type="text"
                    value={subsequentEscalation}
                    onChange={(e) => setSubsequentEscalation(e.target.value)}
                    placeholder={`예: ${defaultDefaultsForConcern.escalation}`}
                    className="mt-2 w-full rounded-[1.05rem] border border-line bg-milk px-4 py-3 text-[14.5px] text-cocoa focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-bold text-cocoa">
                    E. 최근 얼마나 자주 반복되나요?
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { id: "daily", label: "거의 매일" },
                      { id: "several_times_a_week", label: "주 2~3회" },
                      { id: "weekly", label: "주 1회 정도" },
                      { id: "occasional", label: "가끔 / 특정 상황" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          setRecentFrequency(
                            f.id as NonNullable<CurrentConflictInput["recentFrequency"]>
                          )
                        }
                        className={`rounded-xl py-2.5 text-[13px] font-bold transition-all ${
                          recentFrequency === f.id
                            ? "bg-coral text-white shadow-xs"
                            : "bg-milk text-cocoa border border-line hover:bg-cream/50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentConcern === "meal") {
                      setStep("food_micro_check");
                      setCurrentFoodQuestionIndex(FOOD_QUESTIONS.length - 1);
                    } else if (currentConcern === "sleep") {
                      setStep("sleep_micro_check");
                      setCurrentSleepQuestionIndex(SLEEP_QUESTIONS.length - 1);
                    } else {
                      setStep("mom_mini_check");
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-cocoa-soft hover:text-cocoa"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {currentConcern === "meal"
                    ? "이전: 식습관 체크"
                    : currentConcern === "sleep"
                    ? "이전: 수면 체크"
                    : "이전: 내 반응 체크"}
                </button>
                <Button size="lg" onClick={handleSaveConflictAndNext}>
                  확인하고 리포트 생성하기
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Input Summary */}
          {step === "summary" && (
            <div className="animate-rise space-y-6">
              <div>
                <Eyebrow>리포트 준비 완료</Eyebrow>
                <h1 className="mt-2 text-[24px] font-bold leading-snug tracking-tight text-cocoa">
                  {childDisplayName}와 {momDisplayName}의
                  <br />
                  관계 사용설명서를 열어볼게요.
                </h1>
                <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa-soft">
                  직접 입력해주신 관찰과 장면을 바탕으로 두 사람의 상호작용 리포트가 준비되었습니다.
                </p>
              </div>

              <div className="rounded-3xl border border-coral-tint bg-gradient-to-b from-cream via-milk to-milk p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-cream-dark pb-3">
                  <span className="text-[13px] font-bold text-cocoa">아이</span>
                  <span className="text-[14px] font-bold text-coral-deep">
                    {childDisplayName} · {childAgeInfo?.ageDisplay || "만 3세"} ({child.gender === "boy" ? "남아" : "여아"})
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-cream-dark pb-3">
                  <span className="text-[13px] font-bold text-cocoa">아이와의 관계</span>
                  <span className="flex items-center gap-2 text-[14px] font-bold text-cocoa">
                    {resolvedRoleLabel}
                    <button
                      type="button"
                      onClick={() => setStep("relationship")}
                      className="rounded-lg bg-milk px-2 py-0.5 text-[11.5px] font-bold text-coral-deep"
                    >
                      수정
                    </button>
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-cream-dark pb-3">
                  <span className="text-[13px] font-bold text-cocoa">나</span>
                  <span className="text-[14px] font-bold text-cocoa">
                    {momDisplayName} · 반응 체크 5문항 완료
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-cream-dark pb-3">
                  <span className="text-[13px] font-bold text-cocoa">가장 자주 부딪히는 장면</span>
                  <span className="text-[14px] font-bold text-sage-deep">
                    {selectedScenarioObj?.title || `${concernLabel(currentConcern)} 상황`}
                  </span>
                </div>

                <div className="rounded-2xl bg-milk/80 p-3.5 text-[13px] text-cocoa-soft leading-relaxed">
                  “{childFirstReaction}” ↔ “{momFirstReaction}”
                </div>
              </div>

              <div className="pt-2">
                <Button size="lg" onClick={handleCompleteAndGoCheckout}>
                  관계 사용설명서 만들기
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
