import type { TalkingPointItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export function TalkingPointCard({ item }: { item: TalkingPointItem }) {
  return (
    <Card className="p-5">
      <p className="text-[15px] font-bold text-cocoa">{item.situationLabel}</p>
      <div className="mt-3 space-y-2 text-[14px]">
        <p className="text-cocoa-soft">
          <span aria-hidden>❌ </span>
          <span className="line-through decoration-cocoa-soft/60">{item.avoidPhrase}</span>
        </p>
        <p className="font-semibold text-coral-deep">
          <span aria-hidden>✅ </span>
          {item.workingPhrase}
        </p>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-cocoa-soft">{item.whyItWorks}</p>
      <p className="mt-2 rounded-lg bg-butter-tint px-3 py-2 text-[13px] text-cocoa">
        💡 {item.parentActionTip}
      </p>
    </Card>
  );
}
