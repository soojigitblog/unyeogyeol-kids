import type { TalentSeedItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { TalentLevelBadge } from "./TalentLevelBadge";
import { FortuneVsObservationAccordion } from "./FortuneVsObservationAccordion";

export function TalentSeedCard({ item, rank }: { item: TalentSeedItem; rank: number }) {
  return (
    <div className="space-y-2">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold text-cocoa">
            🌱 {rank}위 · {item.label}
          </p>
          <TalentLevelBadge level={item.strengthLevel} />
        </div>
        <p className="mt-2 text-[14px] font-medium text-coral-deep">{item.strengthLine}</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa">{item.realLifeLine}</p>
      </Card>
      <FortuneVsObservationAccordion
        fortuneReasonLine={item.fortuneReasonLine}
        observationNote={item.observationNote}
      />
    </div>
  );
}
