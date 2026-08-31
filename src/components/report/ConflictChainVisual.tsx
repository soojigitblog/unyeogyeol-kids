import React from "react";
import { ArrowDown, CheckCircle2, Sparkles } from "lucide-react";

interface Step {
  stepNumber: number;
  stage: string;
  /** "아이" / "둘 다" 또는 관계명(예: 아빠, 할머니, 큰이모). */
  actor: string;
  description: string;
}

interface ConflictChainVisualProps {
  steps: Step[];
  targetStep?: number;
  isCollaborative?: boolean;
  childName: string;
  /** 관계명(예: 아빠 / 할머니 / 큰이모). */
  caregiverRoleLabel?: string;
}

export function ConflictChainVisual({
  steps,
  targetStep = 2,
  isCollaborative = false,
  caregiverRoleLabel = "보호자",
}: ConflictChainVisualProps) {
  const stageLabels: Record<string, string> = {
    trigger: isCollaborative ? "시작 순간" : "갈등의 불씨",
    mom_reaction: isCollaborative
      ? `${caregiverRoleLabel}의 반응`
      : `${caregiverRoleLabel}의 첫 반응`,
    child_reaction: isCollaborative ? "아이의 반응" : "아이의 반응",
    escalation: isCollaborative ? "호흡 연결" : "긴장감 상승",
    exhausted_end: isCollaborative ? "편안한 마무리" : "지친 마무리",
  };

  return (
    <div className="space-y-2.5">
      {steps.map((step, idx) => {
        const isBreak = !isCollaborative && step.stepNumber === targetStep;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={step.stepNumber}>
            <div
              className={`relative rounded-2xl border p-4 transition-all ${
                isBreak
                  ? "border-coral bg-coral-tint/40 shadow-sm"
                  : "border-cream-dark bg-milk shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      isBreak
                        ? "bg-coral text-white"
                        : "bg-cream-dark text-cocoa-soft"
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span className="text-[12px] font-semibold text-cocoa-soft">
                    {stageLabels[step.stage] || step.stage}
                  </span>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    step.actor === "아이"
                      ? "bg-sage-tint text-sage-deep"
                      : step.actor === "둘 다"
                      ? "bg-cream-dark text-cocoa"
                      : "bg-coral-tint text-coral-deep"
                  }`}
                >
                  {step.actor}
                </span>
              </div>

              <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa">
                {step.description}
              </p>

              {isBreak && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-coral px-3 py-1 text-[12px] font-bold text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  ★ 여기서 끊어볼 수 있어요
                </div>
              )}
            </div>

            {!isLast && (
              <div className="flex justify-center py-0.5">
                <ArrowDown className="h-4 w-4 text-cream-dark" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
