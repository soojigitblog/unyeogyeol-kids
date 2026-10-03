// P4 운영 안전장치 — 서버 시작 시 1회 실행되는 Next.js 공식 훅.
// COMMERCE_STORE=memory가 실수로 운영에 배포되면 결제/리포트가 전부 가짜 인메모리
// 스토어로 조용히 흘러간다(첫 요청이 올 때까지 아무 에러도 안 남). 그 사고를
// 배포 직후 서버 기동 시점에 바로 드러내기 위한 가드다.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.NODE_ENV === "production" && process.env.COMMERCE_STORE === "memory") {
    throw new Error(
      "PRODUCTION_SAFETY: COMMERCE_STORE=memory in production. This would silently route " +
        "all payments/reports to the fake in-memory store instead of Supabase. Set " +
        "COMMERCE_STORE=supabase (or remove the variable) before deploying."
    );
  }

  const { assertPaymentEnv } = await import("@/lib/commerce/paymentMode");
  assertPaymentEnv();
}
