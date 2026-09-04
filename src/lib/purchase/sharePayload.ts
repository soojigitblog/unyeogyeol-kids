import type { SignatureReport } from "@/lib/types";

/** 공유용 텍스트 — 생년월일·출생시간·사주 Fact 제외 */
export function buildShareSummaryText(report: SignatureReport): string {
  const child = report.meta.childName;
  const cg = report.meta.caregiverRoleLabel;
  const concern = report.meta.concernLabel;
  // P2.5 §12: 본문 복붙 금지. 두 줄로만 압축한다.
  const misaligned = report.twoPersonSummary?.misalignedPoint ?? "";
  const anchor = report.chapter08_corePromise.oneSentenceAnchor;

  return [
    `${cg} × ${child} · ${concern}`,
    "우리 아이 × 나 관계 사용설명서",
    "",
    "우리 둘은 여기서 엇갈려요",
    misaligned,
    "",
    "다음번에 기억할 한 가지",
    anchor,
  ].join("\n");
}

export function assertSharePrivacy(text: string): boolean {
  const banned = [
    "생년월일",
    "출생시간",
    "일주",
    "시주",
    "dayMaster",
    "fortune:",
    "사주",
    "paymentKey",
    "orderId",
    "access token",
  ];
  return !banned.some((t) => text.includes(t));
}
