// P3.2 Guest Recovery v2.1 — commerceService.ts(confirmPayment 등 P2.4 FROZEN 로직)와
// 완전히 분리된 새 서비스 레이어. confirmPayment는 이 파일을 import하지 않는다(diff 0).

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { useMemoryCommerceStore as isMemoryCommerceStore, memoryIssueOrRotateRecoveryCode } from "@/lib/supabase/memoryStore";
import {
  generateRecoveryCode,
  formatRecoveryCode,
  normalizeRecoveryCode,
  hashRecoveryCode,
} from "@/lib/commerce/recoveryCode";
import { hasReportAccess, CommerceError } from "./commerceService";

export interface IssueRecoveryCodeResult {
  recoveryCode: string;
}

/**
 * 발급/회전. canonical owner만 호출 가능 — recovery grant로 접근하는 사용자는
 * hasReportAccess(canonical 전용, grant 포함하지 않음)를 통과하지 못해 여기서 막힌다(§4/§14).
 */
export async function issueOrRotateRecoveryCode(
  ownerSessionId: string,
  reportId: string,
  opts: { rotate: boolean }
): Promise<IssueRecoveryCodeResult> {
  const isCanonicalOwner = await hasReportAccess(ownerSessionId, reportId);
  if (!isCanonicalOwner) {
    throw new CommerceError("ACCESS_DENIED");
  }

  const supabase = getSupabaseAdmin();
  const { data: report, error: reportErr } = await supabase
    .from("reports")
    .select("id, status")
    .eq("id", reportId)
    .maybeSingle();
  if (reportErr) throw reportErr;
  if (!report || report.status !== "UNLOCKED") {
    throw new CommerceError("REPORT_NOT_UNLOCKED");
  }

  const { data: ownership, error: ownershipErr } = await supabase
    .from("report_ownerships")
    .select("order_id")
    .eq("owner_session_id", ownerSessionId)
    .eq("report_id", reportId)
    .is("revoked_at", null)
    .maybeSingle();
  if (ownershipErr) throw ownershipErr;
  if (!ownership) {
    throw new CommerceError("ACCESS_DENIED");
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", ownership.order_id)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order || order.status !== "PAID") {
    throw new CommerceError("ORDER_NOT_PAID");
  }

  const plainCode = generateRecoveryCode();
  const codeHash = hashRecoveryCode(plainCode);

  if (isMemoryCommerceStore()) {
    const result = memoryIssueOrRotateRecoveryCode({
      reportId,
      orderId: order.id as string,
      newCodeHash: codeHash,
      rotate: opts.rotate,
    });
    if (!result.ok) {
      throw new CommerceError("CODE_ALREADY_ISSUED");
    }
  } else {
    const { error } = await supabase.rpc("issue_or_rotate_recovery_code", {
      p_report_id: reportId,
      p_order_id: order.id,
      p_new_code_hash: codeHash,
      p_rotate: opts.rotate,
    });
    if (error) {
      const isAlreadyIssued =
        error.code === "23505" ||
        (typeof error.message === "string" && error.message.includes("RECOVERY_CODE_ALREADY_ISSUED"));
      throw new CommerceError(isAlreadyIssued ? "CODE_ALREADY_ISSUED" : "RECOVERY_CODE_ISSUE_FAILED");
    }
  }

  return { recoveryCode: formatRecoveryCode(plainCode) };
}

export interface RecoverByCodeResult {
  reportId: string;
}

/**
 * 코드로 복구. 실패 사유(코드 없음/만료/revoked/report 미확정)를 구분해 응답하지 않는다 —
 * 전부 동일한 CommerceError("RECOVERY_CODE_INVALID")로 던진다(§8).
 */
export async function recoverByCode(
  recoveringSessionId: string,
  rawCode: string
): Promise<RecoverByCodeResult> {
  const normalized = normalizeRecoveryCode(rawCode);
  if (!normalized) {
    throw new CommerceError("RECOVERY_CODE_INVALID");
  }
  const codeHash = hashRecoveryCode(normalized);

  const supabase = getSupabaseAdmin();
  const { data: codeRow, error: codeErr } = await supabase
    .from("report_recovery_codes")
    .select("id, report_id, order_id")
    .eq("code_hash", codeHash)
    .is("revoked_at", null)
    .maybeSingle();
  if (codeErr) throw codeErr;
  if (!codeRow) {
    throw new CommerceError("RECOVERY_CODE_INVALID");
  }

  // 방어적 이중 확인: canonical 쪽 report/order가 실제로 UNLOCKED/PAID인지 재검증.
  const { data: report, error: reportErr } = await supabase
    .from("reports")
    .select("id, status")
    .eq("id", codeRow.report_id)
    .maybeSingle();
  if (reportErr) throw reportErr;
  if (!report || report.status !== "UNLOCKED") {
    throw new CommerceError("RECOVERY_CODE_INVALID");
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", codeRow.order_id)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order || order.status !== "PAID") {
    throw new CommerceError("RECOVERY_CODE_INVALID");
  }

  const now = new Date().toISOString();
  // upsert onConflict(guest_session_id, report_id): 이전에 revoke된(다른 코드로 만들었던) grant
  // row가 남아 있어도 revoked_at:null + source_recovery_code_id를 새 코드로 갱신해
  // 재활성화한다(§9) — revoked row 때문에 정상 코드인데 복구가 실패하는 일이 없도록.
  const { error: grantErr } = await supabase.from("report_access_grants").upsert(
    {
      guest_session_id: recoveringSessionId,
      report_id: codeRow.report_id,
      grant_type: "RECOVERY_CODE",
      source_recovery_code_id: codeRow.id,
      created_at: now,
      revoked_at: null,
    },
    { onConflict: "guest_session_id,report_id" }
  );
  if (grantErr) throw grantErr;

  return { reportId: codeRow.report_id as string };
}
