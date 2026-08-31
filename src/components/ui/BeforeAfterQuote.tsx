import { ArrowDown, Sparkles } from "lucide-react";

/**
 * 운의결 KIDS Signature UI 컴포넌트.
 * "기존 말" → "오늘 바꿔볼 말" 을 저장하고 싶은 카드 형태로.
 */
export function BeforeAfterQuote({
  before,
  after,
  whyItMayHelp,
}: {
  before: string;
  after: string;
  whyItMayHelp?: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-soft">
      <div className="p-4.5">
        <p className="text-[12.5px] font-medium text-cocoa-faint">평소 이렇게 말했다면</p>
        <p className="mt-1 text-[14.5px] leading-relaxed text-cocoa-soft line-through decoration-cocoa-faint/40">
          “{before}”
        </p>
      </div>

      <div className="relative flex justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-coral text-white shadow-soft">
          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      </div>

      <div className="bg-coral-tint p-4.5">
        <p className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-coral-deep">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          오늘 이렇게 바꿔볼까요
        </p>
        <p className="mt-1 text-[15.5px] font-semibold leading-relaxed text-cocoa">
          “{after}”
        </p>

        {whyItMayHelp && (
          <div className="mt-2.5 rounded-xl bg-milk/80 px-3 py-2 text-[12.5px] leading-relaxed text-cocoa-soft">
            {whyItMayHelp}
          </div>
        )}
      </div>
    </div>
  );
}
