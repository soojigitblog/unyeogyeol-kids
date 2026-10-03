import type { ConflictLevel } from "@/lib/types";

const LEVEL_ORDER: ConflictLevel[] = ["낮음", "보통", "높음", "매우높음"];

const LEVEL_COLOR: Record<ConflictLevel, string> = {
  낮음: "bg-sage",
  보통: "bg-butter",
  높음: "bg-peach",
  매우높음: "bg-coral",
};

export function ConflictLevelMeter({ level }: { level: ConflictLevel }) {
  const activeIndex = LEVEL_ORDER.indexOf(level);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1" role="img" aria-label={`충돌 수준: ${level}`}>
        {LEVEL_ORDER.map((l, i) => (
          <span
            key={l}
            className={`h-2 w-6 rounded-full ${i <= activeIndex ? LEVEL_COLOR[level] : "bg-line"}`}
          />
        ))}
      </div>
      <span className="text-[13px] font-semibold text-cocoa">{level}</span>
    </div>
  );
}
