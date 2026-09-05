"use client";

import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 고객에게는 원문 메시지를 노출하지 않고, 콘솔에만 남긴다(디버깅용).
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-8">
        <Container>
          <Card className="p-8 text-center">
            <h1 className="text-[22px] font-bold leading-snug text-cocoa">
              잠시 문제가 생겼어요.
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa-soft">
              다시 시도해 주세요. 계속되면 잠시 후 다시 방문해 주세요.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" onClick={() => reset()}>
                다시 시도
              </Button>
              <ButtonLink href="/" variant="secondary">
                홈으로 돌아가기
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
