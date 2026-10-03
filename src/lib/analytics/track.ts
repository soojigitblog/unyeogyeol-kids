// P3.6 Analytics wrapper — 특정 공급자에 종속되지 않는 얇은 인터페이스.
// 현재는 연결된 Analytics 도구가 없어 개발 모드에서만 console.debug로 확인하고,
// 프로덕션에서는 완전 no-op(네트워크 호출/PII 전송 없음). 나중에 실제 공급자를
// 붙일 때 이 파일 하나만 바꾸면 된다.

export type AnalyticsEventName =
  | "landing_view"
  | "preview_view"
  | "free_result_completed"
  | "locked_section_clicked"
  | "checkout_clicked"
  | "checkout_started"
  | "payment_completed"
  | "report_opened";

export function trackEvent(name: AnalyticsEventName, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", name, props ?? {});
  }
  // 프로덕션: 의도적으로 no-op. fetch/전송 없음 — 이름/생년월일 등 PII를 props에
  // 넣지 않는다(호출부 규칙).
}
