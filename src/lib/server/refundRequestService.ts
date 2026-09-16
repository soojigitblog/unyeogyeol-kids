// P3.3 Refund requests — purely additive layer on top of P2.4 commerce.
// Does not modify commerceService.ts's canonical functions; only reads
// `orders` by (report_id, owner_session_id) to find the paid order, then
// manages its own `refund_requests` table.

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface RefundRequestRow {
  id: string;
  order_id: string;
  owner_session_id: string;
  reason: string;
  screenshot_data_url: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_note: string | null;
  decided_at: string | null;
  created_at: string;
}

export class RefundError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "RefundError";
  }
}

export function refundErrorResponse(code: string, status = 400) {
  const messages: Record<string, string> = {
    ORDER_NOT_FOUND: "이 결과를 볼 수 있는 구매 정보를 확인하지 못했어요.",
    ORDER_NOT_PAID: "결제가 완료된 주문만 환불 신청할 수 있어요.",
    ALREADY_PENDING: "이미 접수된 환불 신청이 있어요.",
    NOT_FOUND: "요청을 찾을 수 없어요.",
    ALREADY_DECIDED: "이미 처리된 요청이에요.",
  };
  return Response.json(
    { error: code, message: messages[code] ?? "요청을 처리하지 못했어요." },
    { status }
  );
}

/** Only the canonical paying owner of a PAID order for this report may request a refund. */
export async function getOwnedPaidOrderForReport(
  ownerSessionId: string,
  reportId: string
): Promise<{ id: string; amount: number; productId: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, amount, product_id, status, owner_session_id")
    .eq("report_id", reportId)
    .eq("owner_session_id", ownerSessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== "PAID") return null;
  return { id: data.id as string, amount: data.amount as number, productId: data.product_id as string };
}

export async function getPendingRefundRequestForOrder(
  orderId: string
): Promise<RefundRequestRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("order_id", orderId)
    .eq("status", "PENDING")
    .maybeSingle();
  if (error) throw error;
  return (data as RefundRequestRow) ?? null;
}

export async function createRefundRequest(input: {
  orderId: string;
  ownerSessionId: string;
  reason: string;
  screenshotDataUrl: string | null;
}): Promise<RefundRequestRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("refund_requests")
    .insert({
      order_id: input.orderId,
      owner_session_id: input.ownerSessionId,
      reason: input.reason,
      screenshot_data_url: input.screenshotDataUrl,
      status: "PENDING",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RefundRequestRow;
}

export async function getRefundRequestById(id: string): Promise<RefundRequestRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as RefundRequestRow) ?? null;
}

export async function listRefundRequestsForAdmin(): Promise<RefundRequestRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("refund_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as RefundRequestRow[]) ?? []).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export async function decideRefundRequest(input: {
  id: string;
  decision: "APPROVED" | "REJECTED";
  adminNote: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const decided_at = new Date().toISOString();
  const { error } = await supabase
    .from("refund_requests")
    .update({ status: input.decision, admin_note: input.adminNote, decided_at })
    .eq("id", input.id);
  if (error) throw error;

  if (input.decision === "APPROVED") {
    const request = await getRefundRequestById(input.id);
    if (request) {
      const { error: orderErr } = await supabase
        .from("orders")
        .update({ status: "REFUNDED" })
        .eq("id", request.order_id);
      if (orderErr) throw orderErr;
    }
  }
}

/** Order info for admin display (no ownership check — admin-only caller). */
export async function getOrderForAdmin(
  orderId: string
): Promise<{ id: string; amount: number; productId: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, amount, product_id")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id as string, amount: data.amount as number, productId: data.product_id as string };
}
