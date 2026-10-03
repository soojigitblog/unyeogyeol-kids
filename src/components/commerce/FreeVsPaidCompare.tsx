import { Card } from "@/components/ui/Card";

const ROWS: { label: string; free: string; paid: string }[] = [
  { label: "기질 키워드 · 한 문장", free: "✓", paid: "✓" },
  { label: "아이에게 통하는 말 (13가지 중)", free: "1개", paid: "13개 전체" },
  { label: "부모×아이 충돌지도 (13가지 중)", free: "1개", paid: "13개 전체" },
  { label: "재능 씨앗 TOP5", free: "1개 이름만", paid: "5개 전체 + 사주 근거" },
  { label: "재능을 키우는 실제 행동", free: "—", paid: "✓" },
  { label: "감정 사용설명서", free: "—", paid: "✓" },
  { label: "학습 사용설명서", free: "—", paid: "✓" },
  { label: "엄마·아빠 관계 가이드", free: "—", paid: "✓" },
  { label: "연령별 성장 로드맵", free: "—", paid: "✓" },
  { label: "미래 연결 분야", free: "—", paid: "✓" },
  { label: "오늘의 육아 미션", free: "1개", paid: "✓" },
];

export function FreeVsPaidCompare() {
  return (
    <Card className="p-5">
      <h3 className="text-[17px] font-bold text-cocoa">무료와 무엇이 다른가요?</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-cocoa-soft">
        무료는 <b className="font-semibold text-cocoa">우리 아이가 어떤 모습인지</b> 살짝 봅니다.
        유료는 <b className="font-semibold text-cocoa">
          통하는 말·충돌지도·재능·감정·학습·관계·성장로드맵
        </b>까지 전부 확인할 수 있어요.
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
