import { NextRequest, NextResponse } from "next/server";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";
import {
  createRefundRequest,
  getOwnedPaidOrderForReport,
  getPendingRefundRequestForOrder,
  refundErrorResponse,
} from "@/lib/server/refundRequestService";
import {
  assertRefundRequestRateLimit,
  RefundRateLimitedError,
} from "@/lib/server/refundRequestRateLimit";

const MAX_SCREENSHOT_CHARS = 2_800_000; // ~2MB raw image, base64-encoded

export async function POST(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    const body = (await request.json().catch(() => ({}))) as {
      reportId?: string;
      reason?: string;
      screenshotDataUrl?: string | null;
    };

    const reason = (body.reason ?? "").trim();
    if (!body.reportId || reason.length < 5 || reason.length > 1000) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "환불 사유를 조금 더 자세히 적어 주세요." },
        { status: 400 }
      );
    }
    let screenshotDataUrl: string | null = null;
    if (body.screenshotDataUrl) {
      if (
        typeof body.screenshotDataUrl !== "string" ||
        !body.screenshotDataUrl.startsWith("data:image/") ||
        body.screenshotDataUrl.length > MAX_SCREENSHOT_CHARS
      ) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", message: "이미지 파일만 첨부할 수 있어요." },
          { status: 400 }
        );
      }
      screenshotDataUrl = body.screenshotDataUrl;
    }

    try {
      assertRefundRequestRateLimit(guest.sessionId);
    } catch (e) {
      if (e instanceof RefundRateLimitedError) {
        return NextResponse.json({ error: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." }, { status: 429 });
      }
      throw e;
    }

    const order = await getOwnedPaidOrderForReport(guest.sessionId, body.reportId);
    if (!order) {
      return refundErrorResponse("ORDER_NOT_PAID", 400);
    }

    const existingPending = await getPendingRefundRequestForOrder(order.id);
    if (existingPending) {
      return NextResponse.json({ ok: true, id: existingPending.id, already: true });
    }

    const row = await createRefundRequest({
      orderId: order.id,
      ownerSessionId: guest.sessionId,
      reason,
      screenshotDataUrl,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return NextResponse.json(
      { error: "REFUND_REQUEST_FAILED", message: "환불 신청에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
