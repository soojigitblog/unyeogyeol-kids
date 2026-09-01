import type { ConcernId } from "@/lib/types";
import { getProductPrice, SIGNATURE_PRODUCT_ID, REPORT_VERSION } from "@/lib/commerce/products";

export { SIGNATURE_PRODUCT_ID, REPORT_VERSION };
export const SIGNATURE_PRICE_KRW = getProductPrice(SIGNATURE_PRODUCT_ID);

export type SignatureProductId = typeof SIGNATURE_PRODUCT_ID;

/** P2.3 localStorage mock — dev review only, not payment source of truth */
export function isLegacyMockPurchaseEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.PAYMENT_MODE === "mock" &&
    process.env.ENABLE_LEGACY_MOCK_PURCHASE === "true"
  );
}

export function buildSessionFingerprint(params: {
  childName?: string;
  childBirthDate?: string;
  caregiverRoleLabel?: string;
  concernId?: ConcernId | null;
}): string {
  return [
    params.childName ?? "",
    params.childBirthDate ?? "",
    params.caregiverRoleLabel ?? "",
    params.concernId ?? "",
    REPORT_VERSION,
  ].join("|");
}

export function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}
