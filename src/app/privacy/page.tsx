import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "개인정보처리방침 · 운의결 KIDS",
};

const SECTIONS = [
  {
    t: "1. 수집하는 개인정보 항목",
    d: [
      "운의결 kids는 서비스 이용을 위해 다음 정보를 입력받아요.",
      "· 아이 정보: 이름(선택), 생년월일, 성별, 태어난 시간(선택)",
      "· 보호자 정보: 아이와의 관계, 별명(선택), 생년월일, 태어난 시간(선택)",
      "· 이용 중 입력한 답변: 기질 체크 답변, 고민 선택, 실제 갈등 장면 설명",
      "· 결제 정보: 주문번호, 결제 금액, 결제 수단 처리 결과(Toss Payments로부터 전달받는 승인 정보)",
      "이름은 입력하지 않아도 서비스를 이용할 수 있어요.",
    ],
  },
  {
    t: "2. 개인정보를 수집하는 방법",
    d: [
      "운의결 kids는 회원가입이나 로그인 없이 이용하는 서비스예요.",
      "브라우저에 무작위로 발급되는 임시 식별자(게스트 세션)로 이용자를 구분하며, 이 식별자와 인증 정보는 이용자의 브라우저에만 저장돼요.",
    ],
  },
  {
    t: "3. 개인정보의 이용 목적",
    d: [
      "· 입력하신 아이의 기질·행동 정보를 바탕으로 리포트를 생성하기 위해",
      "· 유료 상품 결제 및 구매하신 결과를 다시 보여드리기 위해",
      "· 서비스 오류 확인 및 안정적인 운영을 위해",
      "입력하신 정보로 아이의 발달·의학적 상태를 진단하거나 아이의 미래를 단정하지 않아요.",
    ],
  },
  {
    t: "4. 개인정보의 보유 및 이용 기간",
    d: [
      "입력하신 정보와 생성된 리포트는 서비스를 제공하는 동안 보관돼요.",
      "결제가 완료된 리포트는 결제 당시의 내용을 그대로 보존해요 — 이후 서비스 내용이 바뀌어도 이미 구매하신 리포트의 내용은 임의로 바뀌지 않아요.",
      "관계 법령(전자상거래 등에서의 소비자보호에 관한 법률 등)에 따라 별도 보관이 필요한 거래 기록은 해당 법령이 정한 기간 동안 보관해요.",
    ],
  },
  {
    t: "5. 개인정보의 제3자 제공",
    d: [
      "운의결 kids는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않아요.",
      "다만 결제 처리를 위해 결제 정보(주문번호, 결제 금액)가 결제대행사(토스페이먼츠)에 전달돼요.",
    ],
  },
  {
    t: "6. 개인정보 처리 위탁",
    d: [
      "· 데이터베이스 저장·관리: Supabase (해외 인프라)",
      "· 결제 처리: 토스페이먼츠(주)",
      "위탁받은 업체가 개인정보를 안전하게 처리하도록 필요한 사항을 규정하고 있어요.",
    ],
  },
  {
    t: "7. 이용자의 권리",
    d: [
      "이용자는 언제든지 자신이 입력한 정보의 열람·정정·삭제를 요청할 수 있어요.",
      "현재는 회원가입 기반 서비스가 아니라 브라우저 임시 식별자로 운영되므로, 삭제를 원하시면 아래 문의처로 연락 주세요.",
    ],
  },
  {
    t: "8. 아동 관련 정보 처리에 대한 안내",
    d: [
      "운의결 kids는 보호자가 자신의 자녀를 이해하기 위해 자녀의 정보를 직접 입력하는 서비스예요. 아동이 직접 서비스를 이용하거나 정보를 입력하지 않아요.",
      "입력하시는 아이 정보는 리포트 생성 목적으로만 사용되며, 별도의 아동 프로파일링이나 광고 목적으로 사용하지 않아요.",
    ],
  },
  {
    t: "9. 개인정보 보호책임자 및 문의처",
    d: [
      "개인정보 처리와 관련한 문의, 불만 처리, 피해 구제를 위해 아래로 연락해 주세요.",
      "[운영 담당자 연락처 준비 중 — 정식 오픈 시 안내됩니다]",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-4">
        <Container>
          <h1 className="text-[24px] font-bold tracking-tight text-cocoa">
            개인정보처리방침
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-cocoa-soft">
            운의결 kids(이하 &lsquo;서비스&rsquo;)가 이용자의 개인정보를 어떻게 수집·이용·보호하는지
            알려드려요.
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
