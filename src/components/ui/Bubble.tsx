import type { ReactNode } from "react";

type Tone = "coral" | "sage" | "sky" | "butter";

const tones: Record<Tone, string> = {
  coral: "bg-coral-tint text-coral-deep",
  sage: "bg-sage-tint text-sage-deep",
  sky: "bg-sky-tint text-[#5b8b91]",
  butter: "bg-butter-tint text-[#a98416]",
};

/** Hero 의 감정 말풍선. 아이/엄마의 실제 마음속 문장을 담는다. */
export function Bubble({
  children,
  tone = "coral",
  className = "",
  float = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  float?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-[1.1rem] px-3.5 py-2 text-[13.5px] font-medium shadow-soft ${
        tones[tone]
      } ${float ? "animate-floaty" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
