import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "안내·안전 고지 · 운의결 kids",
};

const ITEMS = [
  {
    t: "진단이 아닌 ‘이해’를 위한 서비스예요",
    d: "사주나 기질 리딩으로는 아이의 발달이나 의학적 상태를 판단할 수 없어요. ADHD, 자폐, 발달지연, 언어발달, 지능, 정신질환, 치료 필요 여부 등은 다루지 않아요. 걱정되신다면 소아과·발달 전문기관의 정식 평가를 권해요.",
  },
  {
    t: "부모를 탓하지 않아요",
    d: "‘엄마 때문에’ ‘양육 방식 때문에’라고 말하지 않아요. 대신 두 사람의 반응 방식이 겹치면서 어떤 장면이 반복되는지를 함께 살펴봐요.",
  },
  {
    t: "아이의 미래를 단정하지 않아요",
    d: "‘무슨 직업이 될 아이’ ‘어떤 공부에 재능이 있다’ 같은 단정은 하지 않아요. 대신 아이가 어떤 방식으로 배우고 흥미를 찾는지를 이해하도록 도와요.",
  },
  {
    t: "개인정보는 조심히 다뤄요",
    d: "입력한 정보는 결과 계산에 쓰이고, 공유용 문구에는 생년월일과 이름이 담기지 않아요.",
  },
];

export default function SafetyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container>
          <h1 className="text-[26px] font-bold tracking-tight text-cocoa">
            안내와 안전 고지
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-cocoa-soft">
            운의결 kids를 안심하고 쓰실 수 있도록 몇 가지를 분명히 말씀드려요.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {ITEMS.map((item) => (
              <Card key={item.t}>
                <h2 className="text-[16px] font-bold text-cocoa">{item.t}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-cocoa-soft">
                  {item.d}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <ButtonLink href="/" variant="secondary">
              처음으로
            </ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
