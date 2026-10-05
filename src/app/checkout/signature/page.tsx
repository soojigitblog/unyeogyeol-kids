"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useKids } from "@/lib/store";
import { concernLabel } from "@/lib/concerns";
import { resolveRoleLabel } from "@/lib/caregiver";
import { SIGNATURE_PRICE_KRW } from "@/lib/purchase/commerce";
import { isSignatureSetupComplete } from "@/lib/purchase/setupGuard";
import { apiCreateOrder, apiPrepareSignature, apiCheckReportAccess } from "@/lib/commerce/apiClient";
import { loadCommerceDraft, saveCommerceDraft } from "@/lib/commerce/commerceDraft";
import { ensureGuestSession } from "@/lib/commerce/guestSession";
import { trackEvent } from "@/lib/analytics/track";

const INCLUDES = [
  "아이에게 통하는 말 13가지 · 부모×아이 충돌지도 13가지",
  "재능 씨앗 TOP5 + 재능별 추천 놀이와 활동",
  "감정·학습 사용설명서 · 엄마·아빠 관계 가이드",
  "연령별 성장 로드맵 · 미래 연결 분야 · 오늘의 육아 미션",
];

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "disabled";
const IS_MOCK_PAYMENT =
  PAYMENT_MODE === "mock" && process.env.NODE_ENV !== "production";
const IS_PAYMENT_ENABLED =
  IS_MOCK_PAYMENT || PAYMENT_MODE === "toss_test" || PAYMENT_MODE === "portone_test" || PAYMENT_MODE === "live";

export default function SignatureCheckoutPage() {
  const router = useRouter();
  const {
    child,
    concern,
    caregiverProfile,
    momAnswers,
    conflictInput,
    foodAnswers,
    sleepAnswers,
    answers,
    ready,
  } = useKids();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [amount, setAmount] = useState(SIGNATURE_PRICE_KRW);
  const [consents, setConsents] = useState({ terms: false, privacy: false, refund: false, product: false });
  const initStarted = useRef(false);

  const setupComplete = isSignatureSetupComplete({
    child,
    caregiverProfile,
    momAnswers,
    conflictInput,
    concern,
  });

  useEffect(() => {
    if (!ready) return;
    if (!child) {
      router.replace("/free/child");
      return;
    }
    if (!setupComplete) {
      router.replace("/paid/signature/setup");
    }
  }, [ready, child, setupComplete, router]);

  const initCheckout = useCallback(async () => {
    if (!child || !caregiverProfile || !conflictInput || !concern) return;
    if (!IS_PAYMENT_ENABLED) {
      setError("유료 리포트 결제는 현재 오픈 준비 중이에요.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    trackEvent("checkout_started");
    try {
      await ensureGuestSession();
      const draft = loadCommerceDraft();
      let nextReportId = draft.reportId;
      if (nextReportId) {
        const alreadyPaid = await apiCheckReportAccess(nextReportId);
        if (alreadyPaid) {
          router.replace(`/paid/signature?reportId=${nextReportId}`);
          return;
        }
      }
      if (!nextReportId) {
        const prepared = await apiPrepareSignature({
          child,
          answers: answers ?? {},
          caregiverProfile,
          momAnswers: momAnswers ?? {},
          conflictInput,
          concern,
          foodAnswers,
          sleepAnswers,
        });
        nextReportId = prepared.reportId;
        saveCommerceDraft({ reportId: nextReportId });
      }
      setReportId(nextReportId);

      const order = await apiCreateOrder(nextReportId);
      setOrderId(order.orderId);
      setAmount(order.amount);
      saveCommerceDraft({
        reportId: nextReportId,
        orderId: order.orderId,
        amount: order.amount,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "CHECKOUT_INIT_FAILED");
    } finally {
      setLoading(false);
    }
  }, [
    child,
    caregiverProfile,
    conflictInput,
    concern,
    answers,
    momAnswers,
    foodAnswers,
    sleepAnswers,
    router,
  ]);

  useEffect(() => {
    if (ready && setupComplete && !initStarted.current) {
      initStarted.current = true;
      initCheckout();
    }
  }, [ready, setupComplete, initCheckout]);

  async function handleMockPayment() {
    if (!orderId || !IS_MOCK_PAYMENT || !Object.values(consents).every(Boolean)) return;
    trackEvent("checkout_clicked", { method: "mock" });
    setPaying(true);
    setError(null);
    try {
      const { apiConfirmMockPayment } = await import("@/lib/commerce/apiClient");
      const result = await apiConfirmMockPayment(orderId, amount);
      saveCommerceDraft({ reportId: result.reportId, orderId: result.orderId, amount });
      trackEvent("payment_completed", { method: "mock" });
      router.push(`/payment/success?orderId=${result.orderId}&reportId=${result.reportId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PAYMENT_FAILED");
    } finally {
      setPaying(false);
    }
  }

  async function handleTossPayment() {
    if (!orderId || !reportId || !Object.values(consents).every(Boolean) || (PAYMENT_MODE !== "toss_test" && PAYMENT_MODE !== "live")) return;
    trackEvent("checkout_clicked", { method: "toss" });
    setPaying(true);
    setError(null);
    try {
      const clientKey = PAYMENT_MODE === "live"
        ? process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
        : process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY_TEST;
      if (!clientKey) throw new Error("TOSS_CLIENT_KEY_MISSING");
      const guest = await ensureGuestSession();
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: guest.sessionId });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName: "우리 아이 × 나 관계 사용설명서",
        successUrl: `${window.location.origin}/payment/success?reportId=${reportId}`,
        failUrl: `${window.location.origin}/payment/fail?orderId=${orderId}`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "TOSS_PAYMENT_FAILED");
      setPaying(false);
    }
  }

  async function handlePortOnePayment() {
    if (!orderId || !reportId || PAYMENT_MODE !== "portone_test" || !Object.values(consents).every(Boolean)) return;
    setPaying(true); setError(null);
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_KSNET_CHANNEL_KEY;
      if (!storeId || !channelKey) throw new Error("PORTONE_CONFIG_MISSING");
      const { requestPayment } = await import("@portone/browser-sdk/v2");
      const result = await requestPayment({ storeId, channelKey, paymentId: `kids_${orderId}`, orderName: "우리 아이 × 나 관계 사용설명서", totalAmount: amount, currency: "KRW", payMethod: "CARD", productType: "DIGITAL", redirectUrl: `${window.location.origin}/payment/success?provider=portone&orderId=${encodeURIComponent(orderId)}&reportId=${encodeURIComponent(reportId)}&amount=${amount}`, customData: { orderId } });
      if (result?.paymentId) router.push(`/payment/success?provider=portone&paymentId=${encodeURIComponent(result.paymentId)}&orderId=${encodeURIComponent(orderId)}&reportId=${encodeURIComponent(reportId)}&amount=${amount}`);
    } catch (e) { setError(e instanceof Error ? e.message : "PORTONE_PAYMENT_FAILED"); setPaying(false); }
  }

  const cgLabel = resolveRoleLabel(caregiverProfile);
  const childName = child?.name || "우리 아이";
  const isTestPayment = PAYMENT_MODE === "toss_test" || IS_MOCK_PAYMENT;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-28 pt-4">
        <Container className="lg:max-w-[600px]">
          <Card tone="coral" className="p-6">
            <p className="text-[12px] font-bold text-coral-deep">결제 전 확인</p>
            <h1 className="mt-2 text-[22px] font-bold leading-snug text-cocoa">
              우리 아이 × 나 관계 사용설명서
            </h1>

            <div className="mt-4 space-y-2 rounded-2xl bg-milk p-4 text-[14px]">
              <p>
                <span className="text-cocoa-soft">아이</span>{" "}
                <b className="text-cocoa">{childName}</b>
              </p>
              <p>
                <span className="text-cocoa-soft">관계</span>{" "}
                <b className="text-cocoa">{cgLabel}</b>
              </p>
              <p>
                <span className="text-cocoa-soft">고민</span>{" "}
                <b className="text-cocoa">{concern ? concernLabel(concern) : "—"}</b>
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[12.5px] font-bold text-cocoa-soft">포함 내용</p>
              <ul className="mt-2 space-y-1">
                {INCLUDES.map((item) => (
                  <li key={item} className="text-[14px] text-cocoa">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-2xl bg-cream/80 p-4 text-[13px] leading-relaxed text-cocoa-soft">
              <p>아이의 실제 행동과 알려주신 장면을 중심으로 정리합니다.</p>
              <p className="mt-1.5">
                출생정보는 관계를 이해하기 위한 참고 힌트로만 활용합니다.
              </p>
              <p className="mt-1.5">발달·의학적 진단을 제공하지 않습니다.</p>
            </div>

            {isTestPayment && (
              <p className="mt-4 rounded-xl bg-sage-tint/50 px-3 py-2 text-[12.5px] text-sage-deep">
                테스트 결제입니다. 실제 금액이 청구되지 않습니다.
              </p>
            )}

            <div className="mt-6 border-t border-coral-tint pt-5">
              <p className="text-[12px] text-cocoa-soft">결제 금액</p>
              <p className="text-[28px] font-bold text-cocoa">
                {SIGNATURE_PRICE_KRW.toLocaleString("ko-KR")}
                <span className="text-[16px] font-semibold">원</span>
              </p>
            </div>

            {loading && (
              <p className="mt-4 text-[13px] text-cocoa-soft">주문을 준비하고 있어요…</p>
            )}
            {error && (
              <p className="mt-4 text-[13px] text-coral-deep">{error}</p>
            )}

            <div className="mt-4 space-y-2 text-[11.5px] leading-relaxed text-cocoa-soft/80">{([['terms','이용약관','/terms'],['privacy','개인정보처리방침','/privacy'],['refund','환불·취소 안내','/refund-policy'],['product','상품명·가격·디지털 리포트 제공 시점 확인','']] as const).map(([key,label,href]) => <label key={key} className="flex gap-2"><input type="checkbox" checked={consents[key]} onChange={(e) => setConsents({ ...consents, [key]: e.target.checked })} />{href ? <Link href={href} className="underline">{label}</Link> : <span>{label}</span>} (필수)</label>)}</div>
          </Card>
        </Container>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-milk/95 px-4 py-3 backdrop-blur-sm">
        <Container className="px-0 lg:max-w-[600px]">
          {IS_MOCK_PAYMENT ? (
            <Button size="lg" disabled={loading || paying || !orderId || !Object.values(consents).every(Boolean)} onClick={handleMockPayment}>
              {SIGNATURE_PRICE_KRW.toLocaleString("ko-KR")}원 결제하기
            </Button>
          ) : PAYMENT_MODE === "portone_test" ? (
            <Button size="lg" disabled={loading || paying || !orderId || !Object.values(consents).every(Boolean)} onClick={handlePortOnePayment}>{SIGNATURE_PRICE_KRW.toLocaleString("ko-KR")}원 결제하기</Button>
          ) : PAYMENT_MODE === "toss_test" || PAYMENT_MODE === "live" ? (
            <Button size="lg" disabled={loading || paying || !orderId || !Object.values(consents).every(Boolean)} onClick={handleTossPayment}>
              {SIGNATURE_PRICE_KRW.toLocaleString("ko-KR")}원 결제하기
            </Button>
          ) : (
            <Button size="lg" disabled>
              유료 리포트 오픈 준비 중입니다
            </Button>
          )}
        </Container>
      </div>
      <SiteFooter />
    </>
  );
}
