import { NextRequest } from "next/server";
import { markOrderFailed } from "@/lib/server/commerceService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";

export async function POST(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    const body = (await request.json()) as { orderId?: string };
    if (!body.orderId) {
      return Response.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
    }
    await markOrderFailed(body.orderId, guest.sessionId);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return Response.json({ error: "FAIL_MARK_FAILED" }, { status: 500 });
  }
}
