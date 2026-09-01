import { NextRequest } from "next/server";
import {
  commerceErrorResponse,
  confirmPayment,
  CommerceError,
} from "@/lib/server/commerceService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";
import { getPaymentMode } from "@/lib/commerce/paymentMode";

/** Development/CI mock confirm — same server logic as Toss, without external API */
export async function POST(request: NextRequest) {
  try {
    if (getPaymentMode() !== "mock") {
      return Response.json({ error: "MOCK_CONFIRM_DISABLED" }, { status: 403 });
    }
    const guest = await requireGuestAuth(request);
    const body = (await request.json()) as {
      orderId?: string;
      amount?: number;
    };
    if (!body.orderId || typeof body.amount !== "number") {
      return Response.json({ error: "INVALID_CONFIRM" }, { status: 400 });
    }
    const result = await confirmPayment(guest.sessionId, {
      orderId: body.orderId,
      amount: body.amount,
    });
    return Response.json(result);
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    if (e instanceof CommerceError) {
      return commerceErrorResponse(e.message);
    }
    return commerceErrorResponse("CONFIRM_FAILED", 500);
  }
}
