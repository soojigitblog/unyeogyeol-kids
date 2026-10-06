import { NextRequest } from "next/server";
import { commerceErrorResponse, confirmPayment, CommerceError } from "@/lib/server/commerceService";
import { requireGuestAuth, GuestAuthError, guestAuthErrorResponse } from "@/lib/server/guestAuth";

export async function POST(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    const body = (await request.json()) as { paymentKey?: string; orderId?: string; amount?: number };
    const { paymentKey, orderId, amount } = body;
    if (!paymentKey || !orderId || typeof amount !== "number") return commerceErrorResponse("PAYMENT_KEY_REQUIRED");
    return Response.json(await confirmPayment(guest.sessionId, { paymentKey, orderId, amount }));
  } catch (e) {
    if (e instanceof GuestAuthError) return guestAuthErrorResponse(e.message);
    if (e instanceof CommerceError) return commerceErrorResponse(e.message);
    return commerceErrorResponse("CONFIRM_FAILED", 500);
  }
}
