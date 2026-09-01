import { Card } from "@/components/ui/Card";

export function SignatureResultPreview() {
  return (
    <Card tone="plain" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[17px] font-bold text-cocoa">결과 미리보기</h3>
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold text-cocoa-soft">
          예시 결과
        </span>
      </div>
      <p className="mt-1.5 text-[13px] text-cocoa-soft">
        실제 내 결과와 혼동되지 않도록 예시로 보여드려요.
      </p>

      <div className="mt-4 space-y-3">
        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">우리 둘의 시선 요약</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
            아빠는 정해진 취침 시간에 맞춰 잠자리 흐름을 이어가려는 반응이 있었어요. 아이는
            잠자리 시간이 되어도 읽던 그림책을 조금 더 이어가려는 모습이 있었어요.
          </p>
        </section>

        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">반복되는 갈등 흐름</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[14px] text-cocoa">
            <li>잠자리 시간이 됨</li>
            <li>아이가 하던 활동을 이어가려 함</li>
            <li>보호자가 잠자리로 가도록 말함</li>
            <li>아이가 잠들기를 미룸</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-sage-tint bg-sage-tint/20 p-4">
          <p className="text-[12px] font-bold text-sage-deep">여기서 끊어볼 수 있어요</p>
          <p className="mt-1.5 text-[14px] font-semibold text-cocoa">
            잠자리로 가기 전 마지막 행동 하나 정하기
          </p>
        </section>

        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">오늘 바꿔볼 말</p>
          <p className="mt-1.5 text-[14px] text-cocoa">
            전: 이제 그만하고 빨리 자.
            <br />
            후: 그림책 한 페이지만 더 보고 잠옷 입으러 갈까?
          </p>
        </section>

        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">출생정보 관계 힌트</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
            출생정보는 참고 힌트로만 활용하고, 실제로 알려주신 행동과 반응을 더 중요하게
            봅니다.
          </p>
        </section>
      </div>
    </Card>
  );
}
