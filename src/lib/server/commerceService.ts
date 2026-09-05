// P2.4 REAL COMMERCE FOUNDATION — 보안 아키텍처 불변조건 (실제 Supabase+Toss TEST 환경에서 검증됨)
//
// 1. service_role key는 이 서버 모듈(및 getSupabaseAdmin)에서만 사용되며, 브라우저에는
//    절대 노출되지 않는다. 클라이언트는 이 키를 직접 볼 수 있는 어떤 경로도 갖지 않는다.
// 2. DB의 모든 커머스 테이블은 RLS가 켜져 있고 정책은 전부 `using (false)` —
//    anon key로는 어떤 행도 읽거나 쓸 수 없다(deny-all). 이 앱은 Supabase Auth/anon key를
//    아예 쓰지 않으므로, RLS는 "service_role 없이는 통째로 차단"이라는 방어선 역할만 한다.
// 3. Guest 간 격리(A가 B의 report를 볼 수 없음)는 RLS가 아니라 이 애플리케이션 레이어가
//    담당한다 — hasReportAccess/getUnlockedReport 가 매번 report_ownerships.owner_session_id
//    를 요청자의 owner_session_id와 대조한다. 새 commerce API를 추가할 때 이 체크를
//    빠뜨리면 RLS가 대신 막아주지 않는다 — ownership check 누락 = 데이터 유출.
// 4. 모든 paid report 조회 경로(/api/reports/[id], /api/reports/[id]/access, /my-results)는
//    guest 인증(requireGuestAuth: x-guest-session-id + x-guest-access-token 해시 대조) +
//    ownership 확인을 반드시 거친다. 둘 중 하나라도 생략된 새 라우트를 추가하지 말 것.
// 5. 결제 완료(status=UNLOCKED) 이후의 report_payload_json/report_version은 DB 트리거
//    (prevent_paid_report_payload_change, errcode P2401)로 재정의를 막는다 — 애플리케이션
//    코드에도 이 필드를 UPDATE하는 경로가 없어야 한다(정적 감사: p24Snapshot.test.ts).
// 6. 실제 검증 스크립트: scripts/p24-api-verify.mjs, scripts/p24-snapshot-trigger-verify.mjs,
//    scripts/p24-checkout-flow.mjs (npm run verify:p24). 전부 ALLOW_P24_TEST_MUTATION=true
//    또는 --yes 없이는 실행되지 않으며, 자신이 만든 테스트 데이터만 자체 정리하고
//    PAID row는 삭제 대상이 될 수 없도록 안전장치(scripts/lib/p24-guard.mjs)가 걸려 있다.

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  generateAccessToken,
  generateGuestSessionId,
  generateOrderId,
  hashAccessToken,
} from "@/lib/commerce/crypto";
import { getProduct, getProductPrice, SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";
import { getPaymentMode, getTossSecretKey } from "@/lib/commerce/paymentMode";
import {
  buildSignatureReportPayload,
  parseBirthTime,
  SIGNATURE_REPORT_VERSION,
  type SignaturePrepareInput,
} from "@/lib/server/reportBuilder";
import type { SignatureReport } from "@/lib/types";

export interface GuestSessionResult {
  sessionId: string;
  accessToken: string;
}

export async function createGuestSession(): Promise<GuestSessionResult> {
  const supabase = getSupabaseAdmin();
  const sessionId = generateGuestSessionId();
  const accessToken = generateAccessToken();
  const { error } = await supabase.from("guest_sessions").insert({
    id: sessionId,
    access_token_hash: hashAccessToken(accessToken),
  });
  if (error) throw error;
  return { sessionId, accessToken };
}

export async function prepareSignatureReport(
  ownerSessionId: string,
  input: SignaturePrepareInput
): Promise<{ reportId: string; reportVersion: string }> {
  const supabase = getSupabaseAdmin();
  const reportPayload = buildSignatureReportPayload(input);

  const { data: childRow, error: childErr } = await supabase
    .from("child_profiles")
    .insert({
      owner_session_id: ownerSessionId,
      name: input.child.name ?? null,
      gender: input.child.gender,
      birth_date: input.child.birthDate,
      birth_time: parseBirthTime(input.child),
      birth_time_unknown: !input.child.birthTimeKnown,
    })
    .select("id")
    .single();
  if (childErr) throw childErr;

  const { data: cgRow, error: cgErr } = await supabase
    .from("caregiver_profiles")
    .insert({
      owner_session_id: ownerSessionId,
      child_profile_id: childRow.id,
      role: input.caregiverProfile.role,
      role_label: input.caregiverProfile.roleLabel,
      display_name: input.caregiverProfile.roleLabel,
      birth_date: input.caregiverProfile.birthDate,
      birth_time: parseBirthTime(input.caregiverProfile),
      birth_time_unknown: !input.caregiverProfile.birthTimeKnown,
    })
    .select("id")
    .single();
  if (cgErr) throw cgErr;

  const microAnswers = {
    food: input.foodAnswers ?? {},
    sleep: input.sleepAnswers ?? {},
  };

  const { data: assessmentRow, error: assessErr } = await supabase
    .from("assessment_inputs")
    .insert({
      owner_session_id: ownerSessionId,
      child_profile_id: childRow.id,
      caregiver_profile_id: cgRow.id,
      free_answers_json: input.answers ?? {},
      deep_answers_json: {},
      caregiver_answers_json: input.momAnswers ?? {},
      concern_id: input.concern,
      concern_micro_answers_json: microAnswers,
      current_conflict_json: input.conflictInput,
      version: SIGNATURE_REPORT_VERSION,
    })
    .select("id")
    .single();
  if (assessErr) throw assessErr;

  const { data: reportRow, error: reportErr } = await supabase
    .from("reports")
    .insert({
      owner_session_id: ownerSessionId,
      child_profile_id: childRow.id,
      caregiver_profile_id: cgRow.id,
      assessment_input_id: assessmentRow.id,
      product_id: SIGNATURE_PRODUCT_ID,
      report_version: SIGNATURE_REPORT_VERSION,
      report_payload_json: reportPayload,
      status: "LOCKED",
    })
    .select("id")
    .single();
  if (reportErr) throw reportErr;

  return { reportId: reportRow.id, reportVersion: SIGNATURE_REPORT_VERSION };
}

export async function createOrder(
  ownerSessionId: string,
  productId: string,
  reportId: string
): Promise<{ orderId: string; amount: number; currency: string; dbOrderId: string }> {
  const supabase = getSupabaseAdmin();
  const product = getProduct(productId);
  const amount = getProductPrice(productId);

  const { data: report, error: reportErr } = await supabase
    .from("reports")
    .select("id, owner_session_id, status")
    .eq("id", reportId)
    .maybeSingle();
  if (reportErr) throw reportErr;
  if (!report || report.owner_session_id !== ownerSessionId) {
    throw new CommerceError("REPORT_NOT_FOUND");
  }
  if (report.status === "UNLOCKED") {
    throw new CommerceError("REPORT_ALREADY_UNLOCKED");
  }

  const orderId = generateOrderId();
  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_id: orderId,
      owner_session_id: ownerSessionId,
      product_id: productId,
      report_id: reportId,
      amount,
      currency: product.currency,
      status: "PAYMENT_PENDING",
      payment_provider: getPaymentMode() === "toss_test" ? "toss_test" : "mock",
      requested_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (orderErr) throw orderErr;

  return {
    orderId,
    amount,
    currency: product.currency,
    dbOrderId: orderRow.id,
  };
}

export interface ConfirmPaymentInput {
  paymentKey?: string;
  orderId: string;
  amount: number;
}

export interface ConfirmPaymentResult {
  status: "PAID";
  reportId: string;
  orderId: string;
  alreadyPaid: boolean;
}

export async function confirmPayment(
  ownerSessionId: string,
  input: ConfirmPaymentInput
): Promise<ConfirmPaymentResult> {
  const supabase = getSupabaseAdmin();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", input.orderId)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order || order.owner_session_id !== ownerSessionId) {
    throw new CommerceError("ORDER_NOT_FOUND");
  }

  if (order.status === "PAID") {
    return {
      status: "PAID",
      reportId: order.report_id,
      orderId: order.order_id,
      alreadyPaid: true,
    };
  }

  const serverAmount = getProductPrice(order.product_id);
  if (input.amount !== serverAmount || order.amount !== serverAmount) {
    throw new CommerceError("AMOUNT_MISMATCH");
  }

  const mode = getPaymentMode();
  if (mode === "toss_test") {
    if (!input.paymentKey) {
      throw new CommerceError("PAYMENT_KEY_REQUIRED");
    }
    await confirmTossPayment(input.paymentKey, order.order_id, serverAmount);
  }

  const now = new Date().toISOString();
  const { error: updateOrderErr } = await supabase
    .from("orders")
    .update({
      status: "PAID",
      payment_key: input.paymentKey ?? `mock_${order.order_id}`,
      approved_at: now,
      updated_at: now,
    })
    .eq("id", order.id);
  if (updateOrderErr) throw updateOrderErr;

  const { error: ownershipErr } = await supabase.from("report_ownerships").upsert(
    {
      owner_session_id: ownerSessionId,
      report_id: order.report_id,
      order_id: order.id,
      granted_at: now,
      revoked_at: null,
    },
    { onConflict: "order_id,report_id", ignoreDuplicates: true }
  );
  if (ownershipErr) throw ownershipErr;

  const { error: unlockErr } = await supabase
    .from("reports")
    .update({ status: "UNLOCKED", updated_at: now })
    .eq("id", order.report_id);
  if (unlockErr) throw unlockErr;

  return {
    status: "PAID",
    reportId: order.report_id,
    orderId: order.order_id,
    alreadyPaid: false,
  };
}

async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<void> {
  const secretKey = getTossSecretKey();
  if (!secretKey) throw new CommerceError("TOSS_KEYS_MISSING");

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!res.ok) {
    throw new CommerceError("TOSS_CONFIRM_FAILED");
  }
  const body = (await res.json()) as { status?: string; totalAmount?: number };
  if (body.status !== "DONE" || body.totalAmount !== amount) {
    throw new CommerceError("TOSS_CONFIRM_INVALID");
  }
}

export async function hasReportAccess(
  ownerSessionId: string,
  reportId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("report_ownerships")
    .select("id, revoked_at")
    .eq("owner_session_id", ownerSessionId)
    .eq("report_id", reportId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getUnlockedReport(
  ownerSessionId: string,
  reportId: string
): Promise<SignatureReport | null> {
  const allowed = await hasReportAccess(ownerSessionId, reportId);
  if (!allowed) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("report_payload_json, status, owner_session_id")
    .eq("id", reportId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.owner_session_id !== ownerSessionId) return null;
  if (data.status !== "UNLOCKED") return null;
  return data.report_payload_json as SignatureReport;
}

export interface MyResultItem {
  reportId: string;
  childName: string;
  caregiverRoleLabel: string;
  concernLabel: string;
  productName: string;
  createdAt: string;
}

export async function listMyResults(ownerSessionId: string): Promise<MyResultItem[]> {
  const supabase = getSupabaseAdmin();
  const { data: ownerships, error } = await supabase
    .from("report_ownerships")
    .select("report_id, granted_at, revoked_at")
    .eq("owner_session_id", ownerSessionId)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false });
  if (error) throw error;
  if (!ownerships?.length) return [];

  const reportIds = ownerships.map((o) => o.report_id);
  const { data: reports, error: reportErr } = await supabase
    .from("reports")
    .select("id, report_payload_json, product_id, created_at")
    .in("id", reportIds)
    .eq("status", "UNLOCKED");
  if (reportErr) throw reportErr;

  return (reports ?? []).map((r) => {
    const payload = r.report_payload_json as SignatureReport;
    const product = getProduct(r.product_id);
    const ownership = ownerships.find((o) => o.report_id === r.id);
    const createdAt =
      (r.created_at as string | undefined) ??
      (ownership?.granted_at as string | undefined) ??
      new Date().toISOString();
    return {
      reportId: r.id,
      childName: payload.meta.childName,
      caregiverRoleLabel: payload.meta.caregiverRoleLabel,
      concernLabel: payload.meta.concernLabel,
      productName: product.name,
      createdAt,
    };
  });
}

export async function markOrderFailed(orderId: string, ownerSessionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("orders")
    .update({
      status: "FAILED",
      failed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("owner_session_id", ownerSessionId)
    .neq("status", "PAID");
}

export class CommerceError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "CommerceError";
  }
}

export function commerceErrorResponse(code: string, status = 400) {
  const messages: Record<string, string> = {
    REPORT_NOT_FOUND: "리포트를 찾을 수 없어요.",
    ORDER_NOT_FOUND: "주문을 찾을 수 없어요.",
    AMOUNT_MISMATCH: "결제 금액이 일치하지 않아요.",
    ACCESS_DENIED: "이 결과를 볼 수 있는 구매 정보를 확인하지 못했어요.",
    PAYMENT_KEY_REQUIRED: "결제 정보가 올바르지 않아요.",
    TOSS_CONFIRM_FAILED: "결제 승인에 실패했어요.",
  };
  return Response.json(
    { error: code, message: messages[code] ?? "요청을 처리하지 못했어요." },
    { status }
  );
}
