const LEVEL_STYLE: Record<string, string> = {
  매우강함: "bg-coral text-white",
  강함: "bg-peach text-cocoa",
  보통: "bg-butter text-cocoa",
  잠재: "bg-line text-cocoa-soft",
};

export function TalentLevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold ${
        LEVEL_STYLE[level] ?? "bg-line text-cocoa-soft"
      }`}
    >
      {level}
    </span>
  );
}
