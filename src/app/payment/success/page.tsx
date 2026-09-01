"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import {
  apiConfirmMockPayment,
  apiConfirmTossPayment,
} from "@/lib/commerce/apiClient";
import { saveCommerceDraft } from "@/lib/commerce/commerceDraft";

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "mock";

function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [reportId, setReportId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      const orderId = searchParams?.get("orderId");
      const paymentKey = searchParams?.get("paymentKey");
      const amountParam = searchParams?.get("amount");
      const reportParam = searchParams?.get("reportId");

      try {
        if (PAYMENT_MODE === "toss_test" && paymentKey && orderId && amountParam) {
          const amount = Number(amountParam);
          const result = await apiConfirmTossPayment(paymentKey, orderId, amount);
          setReportId(result.reportId);
          saveCommerceDraft({ reportId: result.reportId, orderId: result.orderId, amount });
          setStatus("ok");
          return;
        }

        if (PAYMENT_MODE === "mock" && orderId && amountParam) {
          const amount = Number(amountParam);
          const result = await apiConfirmMockPayment(orderId, amount);
          setReportId(result.reportId);
          saveCommerceDraft({ reportId: result.reportId, orderId: result.orderId, amount });
          setStatus("ok");
          return;
        }

        if (reportParam && PAYMENT_MODE === "mock") {
          setReportId(reportParam);
          setStatus("ok");
          return;
        }

        if (reportParam) {
          const { apiCheckReportAccess } = await import("@/lib/commerce/apiClient");
          const allowed = await apiCheckReportAccess(reportParam);
          if (allowed) {
            setReportId(reportParam);
            setStatus("ok");
            return;
          }
        }

        setMessage("결제 확인 정보가 올바르지 않아요.");
        setStatus("error");
      } catch {
        setMessage("결제 확인 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
        setStatus("error");
      }
    }
    confirm();
  }, [searchParams, router]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-8">
        <Container>
          <Card tone="coral" className="p-8 text-center">
            {status === "loading" && (
              <p className="text-[15px] text-cocoa-soft">결제를 확인하고 있어요…</p>
            )}
            {status === "ok" && (
              <>
                <h1 className="text-[22px] font-bold leading-snug text-cocoa">
                  결제가 확인됐어요.
                  <br />
                  우리 둘의 관계 사용설명서를 바로 볼 수 있어요.
                </h1>
                <p className="mt-3 text-[14.5px] leading-relaxed text-cocoa-soft">
                  직접 알려주신 장면과 반응을 바탕으로 정리했어요.
                </p>
                <div className="mt-6">
                  <ButtonLink
                    href={reportId ? `/paid/signature?reportId=${reportId}` : "/my-results"}
                    size="lg"
                  >
                    내 관계 사용설명서 보기
                  </ButtonLink>
                </div>
              </>
            )}
            {status === "error" && (
              <>
                <h1 className="text-[20px] font-bold text-cocoa">결제를 확인하지 못했어요</h1>
                <p className="mt-2 text-[14px] text-cocoa-soft">{message}</p>
                <div className="mt-6">
                  <ButtonLink href="/checkout/signature" size="lg">
                    결제 다시 시도
                  </ButtonLink>
                </div>
              </>
            )}
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-cocoa">확인 중…</div>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
