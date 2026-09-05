import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "페이지를 찾을 수 없어요 · 운의결 KIDS",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-8">
        <Container>
          <Card className="p-8 text-center">
            <h1 className="text-[22px] font-bold leading-snug text-cocoa">
              페이지를 찾을 수 없어요.
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa-soft">
              주소가 잘못되었거나 페이지가 이동했을 수 있어요.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href="/" size="lg">
                홈으로 돌아가기
              </ButtonLink>
              <ButtonLink href="/my-results" variant="secondary">
                내 결과 보기
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
