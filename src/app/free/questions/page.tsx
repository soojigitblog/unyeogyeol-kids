"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Container } from "@/components/layout/Container";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useKids } from "@/lib/store";
import { getQuestionsForAgeBand, TOTAL_QUESTIONS } from "@/lib/questionnaire/questions";
import { getAgeBandCode } from "@/lib/questionnaire/ageBandTypes";
import { computeAge } from "@/lib/age";

function encourage(index: number, total: number): string {
  if (index === 0) return "아이를 떠올리며 골라주세요.";
  if (index === total - 1) return "마지막이에요. 조금만 더요!";
  if (index >= total / 2) return "절반 넘었어요. 잘하고 있어요.";
  return "조금만 더 알아볼게요.";
}

export default function QuestionsPage() {
  const router = useRouter();
  const { child, answers, setAnswer, ready } = useKids();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ready && !child) router.replace("/free/child");
  }, [ready, child, router]);

  if (!ready || !child) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1" />
      </>
    );
  }

  const ageInfo = computeAge(child.birthDate);
  const bandCode = getAgeBandCode(ageInfo?.ageInMonths ?? 36);
  const questions = getQuestionsForAgeBand(bandCode);
  const question = questions[index];
  const selected = answers[question.domain];

  function choose(value: 1 | 2 | 3 | 4) {
    setAnswer(question.domain, value);
    window.setTimeout(() => {
      if (index < TOTAL_QUESTIONS - 1) setIndex((i) => i + 1);
      else router.push("/free/result");
    }, 260);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-10 pt-2">
        <Container>
          <ProgressDots current={index + 1} total={TOTAL_QUESTIONS} />

          {index === 0 && (
            <div className="mt-4 rounded-xl border border-line-soft bg-milk/80 px-4 py-2.5 text-[13px] text-cocoa-faint">
              💡 특별히 힘들었던 하루보다, 최근 한 달 정도의 평소 모습을 떠올려 주세요.
            </div>
          )}

          <div key={question.id} className="mt-6 animate-rise">
            <p className="text-[14px] font-semibold text-coral-deep">
              {encourage(index, TOTAL_QUESTIONS)}
            </p>
            <h1 className="mt-3 text-[24px] font-bold leading-snug tracking-tight text-cocoa">
              {question.prompt}
            </h1>

            <div className="mt-6 flex flex-col gap-3">
              {question.options.map((opt) => {
                const active = selected === opt.value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt.value)}
                    className={`flex items-center gap-3 rounded-[1.15rem] border px-5 py-4 text-left text-[15.5px] leading-snug transition-all duration-150 active:scale-[0.99] ${
                      active
                        ? "border-coral bg-coral-tint text-cocoa shadow-soft"
                        : "border-line bg-card text-cocoa hover:border-coral-soft"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
                        active
                          ? "border-coral bg-coral text-white"
                          : "border-line-soft bg-milk text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="inline-flex items-center gap-1 text-[14px] text-cocoa-faint transition-colors hover:text-cocoa-soft disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              이전 질문
            </button>
            <span className="text-[13px] text-cocoa-faint">
              정답은 없어요 · 평소 모습에 가깝게
            </span>
          </div>
        </Container>
      </main>
    </>
  );
}
