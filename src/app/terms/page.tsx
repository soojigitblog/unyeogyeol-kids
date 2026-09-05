import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "이용약관 · 운의결 KIDS",
};

const SECTIONS = [
  {
    t: "제1조 (목적)",
    d: [
      "이 약관은 운의결 kids(이하 &lsquo;서비스&rsquo;)가 제공하는 온라인 서비스의 이용조건 및 절차, 이용자와 서비스 운영자의 권리·의무 및 책임사항을 정하는 것을 목적으로 해요.",
    ],
  },
  {
    t: "제2조 (서비스의 성격)",
    d: [
      "서비스는 이용자가 입력한 아이의 출생정보와 실제 관찰된 행동을 바탕으로, 아이의 기질과 보호자와의 상호작용 방식을 이해하는 데 도움을 주는 참고용 콘텐츠를 제공해요.",
      "서비스는 의학적·심리적 진단, 발달 평가, 치료를 제공하지 않아요. 아이의 발달이 걱정되시면 전문 의료·발달 기관의 정식 평가를 받으시길 권해요.",
    ],
  },
  {
    t: "제3조 (이용계약의 성립)",
    d: [
      "서비스는 별도의 회원가입 절차 없이 이용할 수 있어요. 이용자가 서비스 화면의 안내에 따라 정보를 입력하고 다음 단계로 진행하는 시점에 이 약관에 동의한 것으로 봐요.",
    ],
  },
  {
    t: "제4조 (유료 서비스 및 결제)",
    d: [
      "유료 상품의 가격, 포함 내용은 결제 전 화면에 표시돼요. 결제는 결제대행사(토스페이먼츠)를 통해 처리돼요.",
      "결제 완료 시점의 리포트 내용은 스냅샷으로 저장되며, 이후 서비스 로직이 변경되더라도 이미 구매한 리포트의 내용은 바뀌지 않아요.",
    ],
  },
  {
    t: "제5조 (청약철회 및 환불)",
    d: [
      "청약철회 및 환불에 관한 사항은 별도의 &lsquo;환불·취소 안내&rsquo; 페이지를 따라요.",
    ],
  },
  {
    t: "제6조 (이용자의 의무)",
    d: [
      "이용자는 서비스 이용 시 타인의 정보를 도용하거나 허위 정보를 입력하지 않아야 해요.",
      "이용자는 서비스에서 얻은 내용을 아이의 발달·정신건강에 대한 의학적 판단의 근거로 사용해서는 안 돼요.",
    ],
  },
  {
    t: "제7조 (서비스 제공의 중지 및 변경)",
    d: [
      "서비스는 시스템 점검, 장애 등 부득이한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있어요.",
      "서비스 내용은 개선을 위해 변경될 수 있으며, 이미 결제한 리포트의 내용에는 소급 적용되지 않아요.",
    ],
  },
  {
    t: "제8조 (면책)",
    d: [
      "서비스가 제공하는 내용은 이용자가 직접 입력한 정보를 바탕으로 한 참고용 콘텐츠이며, 아이의 상태에 대한 확정적 판단이나 보장을 의미하지 않아요.",
    ],
  },
  {
    t: "제9조 (문의)",
    d: ["약관과 관련한 문의는 아래로 연락해 주세요.", "[운영 담당자 연락처 준비 중 — 정식 오픈 시 안내됩니다]"],
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container>
          <h1 className="text-[24px] font-bold tracking-tight text-cocoa">이용약관</h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-cocoa-soft">
            운의결 kids 서비스 이용에 관한 약관이에요.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {SECTIONS.map((s) => (
              <Card key={s.t}>
                <h2 className="text-[15px] font-bold text-cocoa">{s.t}</h2>
                <div className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-cocoa-soft">
                  {s.d.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <p className="mt-6 text-[12.5px] text-cocoa-faint">시행일: 2026년 9월 5일</p>

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
