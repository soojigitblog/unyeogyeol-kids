import { Card } from "@/components/ui/Card";

// P3.6: Phase 1/2에서 실제 유료 리포트 구성이 바뀌어서(재능씨앗/성장행동/감정·학습·
// 관계가이드/로드맵/미래분야/미션) 예시 내용을 실제 섹션 기준으로 다시 작성했다.
// 가상의 샘플("리호")이며 실제 사용자 데이터를 참조하지 않는다.

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
        실제 내 결과와 혼동되지 않도록 가상의 아이(&ldquo;리호&rdquo;)로 만든 예시예요.
      </p>

      <div className="mt-4 space-y-3">
        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">💬 아이에게 통하는 말</p>
          <p className="mt-1.5 text-[14px] text-cocoa-soft">
            ❌ &ldquo;빨리 준비해.&rdquo;
          </p>
          <p className="mt-1 text-[14px] font-semibold text-coral-deep">
            ✅ &ldquo;양말이랑 바지 중에 뭐부터 할래?&rdquo;
          </p>
        </section>

        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">⚡ 우리 집 충돌지도</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
            외출 준비 · 매우높음 — 급하게 재촉할 때 가장 크게 부딪혀요.
          </p>
        </section>

        <section className="rounded-2xl border border-sage-tint bg-sage-tint/20 p-4">
          <p className="text-[12px] font-bold text-sage-deep">🌱 재능 씨앗 TOP1</p>
          <p className="mt-1.5 text-[14px] font-semibold text-cocoa">
            작은 차이를 발견하는 관찰력
          </p>
        </section>

        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">🎯 재능을 키우는 실제 행동</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
            추천 놀이: 숨은 그림 찾기, 다른 그림 찾기 · 부모 질문: &ldquo;뭐가 달라졌어?&rdquo;
          </p>
        </section>

        <section className="rounded-2xl bg-cream/80 p-4">
          <p className="text-[12px] font-bold text-cocoa-soft">❤️ 엄마×아이 관계 가이드</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-cocoa">
            엄마가 급하게 재촉할수록 아이는 더 버틸 수 있어요. 명령 대신 선택지를 주면
            빨라져요.
          </p>
        </section>
      </div>
    </Card>
  );
}
