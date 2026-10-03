import { Card } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";

const GENERAL_STEPS = ["성격 풀이", "직업 추천", "미래 운세"];
const OURS_STEPS = [
  "타고난 기질",
  "실제 생활 모습",
  "아이에게 통하는 말",
  "부모 충돌지도",
  "재능 성장 행동",
  "연령별 성장 가이드",
];

export function VsGeneralSajuDiagram() {
  return (
    <div>
      <h2 className="text-[24px] font-bold leading-snug tracking-tight text-cocoa">
        직업 하나를 알려주는 사주보다
        <br />
        지금 아이에게 필요한 것을 알려드립니다.
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card tone="plain" className="p-5">
          <p className="text-[12.5px] font-bold text-cocoa-soft">일반적인 자녀 사주</p>
          <div className="mt-3 flex flex-col items-center gap-1.5">
            {GENERAL_STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <span className="rounded-full bg-cream px-3 py-1.5 text-[13.5px] text-cocoa-soft">
                  {s}
                </span>
                {i < GENERAL_STEPS.length - 1 ? (
                  <span aria-hidden className="text-cocoa-faint">↓</span>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card tone="coral" className="p-5">
          <p className="text-[12.5px] font-bold text-coral-deep">운의결 키즈</p>
          <div className="mt-3 flex flex-col items-center gap-1.5">
            {OURS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <span className="rounded-full bg-white px-3 py-1.5 text-[13.5px] font-semibold text-cocoa">
                  {s}
                </span>
                {i < OURS_STEPS.length - 1 ? (
                  <span aria-hidden className="text-coral">↓</span>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[15px] font-semibold text-cocoa">
        미래만 보는 것이 아니라
        <ArrowRight className="h-4 w-4 text-coral" strokeWidth={2.4} />
        오늘의 육아가 달라지게 합니다.
      </p>
    </div>
  );
}
