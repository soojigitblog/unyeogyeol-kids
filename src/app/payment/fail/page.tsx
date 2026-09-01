"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { apiMarkOrderFailed } from "@/lib/commerce/apiClient";

function PaymentFailInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  useEffect(() => {
    if (orderId) {
      apiMarkOrderFailed(orderId).catch(() => undefined);
    }
  }, [orderId]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-8">
        <Container>
          <Card className="p-8 text-center">
            <h1 className="text-[22px] font-bold leading-snug text-cocoa">
              결제가 완료되지 않았어요.
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa-soft">
              결제 수단을 확인한 뒤 다시 시도할 수 있어요.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href="/checkout/signature" size="lg">
                결제 다시 시도
              </ButtonLink>
              <ButtonLink href="/products" variant="secondary">
                상품 페이지로
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-cocoa">불러오는 중…</div>}>
      <PaymentFailInner />
    </Suspense>
  );
}
