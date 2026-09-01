const FAQ_ITEMS = [
  {
    q: "사주만 보고 결과를 내나요?",
    a: "아니요. 실제 관찰 행동과 현재 고민 장면을 우선합니다.",
  },
  {
    q: "엄마가 아니어도 볼 수 있나요?",
    a: "네. 아빠, 할머니, 이모 등 아이와의 실제 관계를 선택할 수 있어요.",
  },
  {
    q: "출생시간을 몰라도 되나요?",
    a: "네. 모르는 경우 시간 관련 정보는 제외합니다.",
  },
  {
    q: "아이를 진단하는 서비스인가요?",
    a: "아니요. 발달·의학적 판단이 아니라 관계를 이해하기 위한 가이드입니다.",
  },
];

export function CommerceFaq() {
  return (
    <div className="space-y-3">
      <h3 className="text-[17px] font-bold text-cocoa">자주 묻는 질문</h3>
      {FAQ_ITEMS.map((item) => (
        <details
          key={item.q}
          className="rounded-2xl border border-line bg-milk px-4 py-3"
        >
          <summary className="cursor-pointer text-[14px] font-semibold text-cocoa">
            {item.q}
          </summary>
          <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
