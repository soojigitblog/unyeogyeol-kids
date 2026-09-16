// P3.2 §10: Paid 접근 판정 중앙화.
//
// canonical(hasReportAccess/getUnlockedReport/listMyResults, commerceService.ts)은
// 단 한 줄도 바꾸지 않는다 — 이 파일은 그 위에 "OR report_access_grants" 분기를
// 추가하는 순수 additive 레이어다. Paid 결과를 읽는 모든 경로
// (/api/reports/[reportId], /api/reports/[reportId]/access, /api/my-results, 그리고
// 이 API들을 호출하는 /paid/signature, /my-results, "다시 보기" reopen)는 반드시
// 이 파일의 *Any 함수를 통해서만 접근 여부를 판정해야 한다.

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getProduct } from "@/lib/commerce/products";
import { hasReportAccess, listMyResults, type MyResultItem } from "./commerceService";
import type { SignatureReport } from "@/lib/types";

export interface MyResultItemWithGrantInfo extends MyResultItem {
  /** 고객에게 노출하는 라벨이 아니라, UI가 "보관 코드 발급" 버튼을 보여줄지 결정하는 내부 플래그. */
  canManageRecoveryCode: boolean;
}

export async function hasReportAccessAny(
  sessionId: string,
  reportId: string
): Promise<boolean> {
  const canonical = await hasReportAccess(sessionId, reportId);
  if (canonical) return true;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("report_access_grants")
    .select("id")
    .eq("guest_session_id", sessionId)
    .eq("report_id", reportId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getUnlockedReportAny(
  sessionId: string,
  reportId: string
): Promise<SignatureReport | null> {
  const allowed = await hasReportAccessAny(sessionId, reportId);
  if (!allowed) return null;

  // 주의: canonical getUnlockedReport와 달리 owner_session_id 재대조를 하지 않는다 —
  // recovery grant로 접근하는 세션은 원 구매자의 owner_session_id와 다른 게 정상이다.
  // 접근 가부는 위 hasReportAccessAny(canonical OR grant) 판정 결과만을 신뢰한다.
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("report_payload_json, status")
    .eq("id", reportId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== "UNLOCKED") return null;
  return data.report_payload_json as SignatureReport;
}

export async function listMyResultsWithGrants(
  sessionId: string
): Promise<MyResultItemWithGrantInfo[]> {
  const owned = await listMyResults(sessionId);
  const ownedItems: MyResultItemWithGrantInfo[] = owned.map((item) => ({
    ...item,
    canManageRecoveryCode: true,
  }));

  const supabase = getSupabaseAdmin();
  const { data: grants, error: grantsErr } = await supabase
    .from("report_access_grants")
    .select("report_id")
    .eq("guest_session_id", sessionId)
    .is("revoked_at", null);
  if (grantsErr) throw grantsErr;

  const ownedIds = new Set(ownedItems.map((o) => o.reportId));
  const grantedIds = (grants ?? [])
    .map((g) => g.report_id as string)
    .filter((id) => !ownedIds.has(id));
  if (!grantedIds.length) return ownedItems;

  const { data: reports, error: reportsErr } = await supabase
    .from("reports")
    .select("id, report_payload_json, product_id, created_at")
    .in("id", grantedIds)
    .eq("status", "UNLOCKED");
  if (reportsErr) throw reportsErr;

  const grantedItems: MyResultItemWithGrantInfo[] = (reports ?? []).map((r) => {
    const payload = r.report_payload_json as SignatureReport;
    const product = getProduct(r.product_id as string);
    return {
      reportId: r.id as string,
      childName: payload.meta.childName,
      caregiverRoleLabel: payload.meta.caregiverRoleLabel,
      concernLabel: payload.meta.concernLabel,
      productName: product.name,
      createdAt: (r.created_at as string | undefined) ?? new Date().toISOString(),
      // recovery grant로 접근한 결과는 이 브라우저가 canonical owner가 아니므로
      // 코드 발급/회전 버튼을 노출하지 않는다(§14).
      canManageRecoveryCode: false,
    };
  });

  return [...ownedItems, ...grantedItems];
}
