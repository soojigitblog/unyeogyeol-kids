import { AccordionCard } from "./AccordionCard";

/** "사주 근거 보기" — 재능 씨앗에서만 쓴다(충돌지도/통하는말은 사주 신호가 없음). */
export function FortuneVsObservationAccordion({
  fortuneReasonLine,
  observationNote,
}: {
  fortuneReasonLine: string | null;
  observationNote: string;
}) {
  return (
    <AccordionCard title="왜 이렇게 나왔나요?" summary="사주 근거 보기">
      <div className="space-y-3 text-[13.5px] leading-relaxed">
        {fortuneReasonLine ? (
          <div>
            <p className="text-[12px] font-bold text-sage-deep">사주에서 본 경향</p>
            <p className="mt-1 text-cocoa">{fortuneReasonLine}</p>
          </div>
        ) : null}
        <div>
          <p className="text-[12px] font-bold text-coral-deep">실제 관찰</p>
          <p className="mt-1 text-cocoa">{observationNote}</p>
        </div>
      </div>
    </AccordionCard>
  );
}
