import { Card } from "@/components/ui/Card";

const ROWS: { label: string; free: string; paid: string }[] = [
  { label: "관계 사용설명서", free: "—", paid: "✓" },
  { label: "아이의 모습", free: "✓", paid: "✓" },
  { label: "아이 + 나의 반응", free: "—", paid: "✓" },
  { label: "기질 키워드", free: "✓", paid: "✓" },
  { label: "실제 반복 갈등 장면", free: "—", paid: "✓" },
  { label: "오늘 한마디", free: "✓", paid: "✓" },
  { label: "Before / After", free: "—", paid: "✓" },
  { label: "일반 관찰", free: "✓", paid: "—" },
  { label: "Concern별 관계 분석", free: "—", paid: "✓" },
  { label: "Where To Break", free: "—", paid: "✓" },
  { label: "출생정보 관계 힌트", free: "—", paid: "✓" },
];

export function FreeVsPaidCompare() {
  return (
    <Card className="p-5">
      <h3 className="text-[17px] font-bold text-cocoa">무료와 무엇이 다른가요?</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-cocoa-soft">
        무료는 <b className="font-semibold text-cocoa">우리 아이가 어떤 모습인지</b>를 봅니다.
        유료는 <b className="font-semibold text-cocoa">나와 아이가 왜 특정 장면에서 엇갈리는지</b>를
        봅니다.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-3 bg-cream px-3 py-2 text-[12px] font-bold text-cocoa-soft">
          <span>항목</span>
          <span className="text-center">무료</span>
          <span className="text-center text-coral-deep">유료</span>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-3 border-t border-line px-3 py-2.5 text-[13px]"
          >
            <span className="text-cocoa">{row.label}</span>
            <span className="text-center text-cocoa-soft">{row.free}</span>
            <span className="text-center font-semibold text-cocoa">{row.paid}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
