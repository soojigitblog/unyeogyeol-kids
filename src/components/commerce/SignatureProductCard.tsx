import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { formatKrw, SIGNATURE_PRICE_KRW } from "@/lib/purchase/commerce";

const FOR_WHO = [
  "같은 장면에서 실랑이가 반복돼요",
  "설명해도 아이가 바로 움직이지 않아요",
  "내가 어떻게 말해야 할지 모르겠어요",
  "아이와 내 방식이 왜 다른지 알고 싶어요",
];

const INCLUDES = [
  "우리 둘이 자주 엇갈리는 지점",
  "실제 반복 갈등 흐름",
  "여기서 끊어볼 한 지점",
  "오늘 바꿔볼 말",
  "바로 해볼 행동",
  "두 사람 출생정보 관계 힌트",
];

interface SignatureProductCardProps {
  setupHref: string;
  ctaLabel?: string;
  ctaDisabled?: boolean;
}

export function SignatureProductCard({
  setupHref,
  ctaLabel = "우리 둘 이야기 보기",
  ctaDisabled = false,
}: SignatureProductCardProps) {
  return (
    <Card tone="coral" className="p-6">
      <span className="inline-flex items-center rounded-full bg-coral px-3 py-1 text-[12px] font-bold tracking-wide text-white">
        Signature
      </span>
      <h2 className="mt-3 text-[21px] font-bold leading-snug text-cocoa">
        우리 아이 × 나 관계 사용설명서
      </h2>
      <p className="mt-2 text-[15px] font-semibold text-coral-deep">
        왜 우리 둘은 같은 순간에 자꾸 부딪힐까요?
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-cocoa-soft">
        아이의 실제 행동과 나의 반응, 요즘 반복되는 장면을 함께 보고 우리 둘이 어디서
        엇갈리는지 풀어보는 관계 사용설명서예요.
      </p>

      <div className="mt-5">
        <p className="text-[12.5px] font-bold text-cocoa-soft">이런 분께</p>
        <ul className="mt-2 space-y-1.5">
          {FOR_WHO.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[14px] text-cocoa">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <p className="text-[12.5px] font-bold text-cocoa-soft">받는 결과</p>
        <ul className="mt-2 space-y-1.5">
          {INCLUDES.map((item) => (
            <li key={item} className="text-[14px] text-cocoa">· {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3 border-t border-coral-tint pt-5">
        <div>
          <p className="text-[12px] text-cocoa-soft">가격</p>
          <p className="text-[26px] font-bold tracking-tight text-cocoa">
            {formatKrw(SIGNATURE_PRICE_KRW).replace("₩", "")}
            <span className="text-[16px] font-semibold">원</span>
          </p>
        </div>
        {ctaDisabled ? (
          <button
            type="button"
            disabled
            className="min-h-[56px] flex-1 rounded-cta bg-cocoa/20 px-4 text-[16px] font-semibold text-cocoa-soft"
          >
            곧 열려요
          </button>
        ) : (
          <ButtonLink href={setupHref} size="lg" className="flex-1">
            {ctaLabel}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
