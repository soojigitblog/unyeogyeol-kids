import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "환불·취소 안내 · 운의결 KIDS",
};

const SECTIONS = [
  {
    t: "청약철회(환불) 안내",
    d: [
      "전자상거래 등에서의 소비자보호에 관한 법률에 따라, 이용자는 결제일로부터 7일 이내에 청약철회(환불)를 요청할 수 있어요.",
      "다만 콘텐츠를 이미 열람하신 경우, 콘텐츠 제공이 즉시 이루어지는 디지털 콘텐츠의 특성상 청약철회가 제한될 수 있어요. 이 경우 결제 전 화면에서 관련 내용을 안내해요.",
    ],
  },
  {
    t: "환불 요청 방법",
    d: [
      "환불을 원하시면 아래 문의처로 주문번호와 함께 요청해 주세요.",
      "[운영 담당자 연락처 준비 중 — 정식 오픈 시 안내됩니다]",
    ],
  },
  {
    t: "환불 처리 기간",
    d: [
      "환불 요청이 접수되면 관련 법령이 정한 기간 내에 결제하신 수단으로 환불을 처리해요.",
    ],
  },
  {
    t: "테스트 결제 안내",
    d: [
      "현재 서비스는 테스트 결제 환경으로 운영되고 있어요. 테스트 결제 중에는 실제 금액이 청구되지 않으며, 이 안내는 정식 결제 오픈 이후 적용돼요.",
    ],
  },
];

export default function RefundPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container>
          <h1 className="text-[24px] font-bold tracking-tight text-cocoa">환불·취소 안내</h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-cocoa-soft">
            결제하신 상품의 환불·취소 절차를 안내해 드려요.
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
