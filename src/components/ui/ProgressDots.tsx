// 심리검사 느낌을 피하고 부드럽게 진행 상황을 보여준다.
export function ProgressDots({
  current,
  total,
}: {
  current: number; // 1-based
  total: number;
}) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream">
        <div
          className="h-full rounded-full bg-coral transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < current ? "w-4 bg-coral" : "w-1.5 bg-coral-soft/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
