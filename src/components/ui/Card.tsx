import type { ReactNode } from "react";

type Tone = "plain" | "coral" | "sage" | "sky" | "butter" | "peach";

const tones: Record<Tone, string> = {
  plain: "bg-card border-line",
  coral: "bg-coral-tint border-coral-soft/60",
  sage: "bg-sage-tint border-sage-soft/70",
  sky: "bg-sky-tint border-sky/50",
  butter: "bg-butter-tint border-butter/50",
  peach: "bg-peach-tint border-peach/50",
};

export function Card({
  children,
  tone = "plain",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border p-5 shadow-soft ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-coral-deep">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-coral" />
      {children}
    </span>
  );
}
