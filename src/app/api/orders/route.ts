import { NextRequest } from "next/server";
import {
  commerceErrorResponse,
  createOrder,
  CommerceError,
} from "@/lib/server/commerceService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";
import { SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";

export async function POST(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    const body = (await request.json()) as {
      productId?: string;
      reportId?: string;
    };
    const productId = body.productId ?? SIGNATURE_PRODUCT_ID;
    if (!body.reportId) {
      return Response.json(
        { error: "REPORT_ID_REQUIRED", message: "리포트 정보가 필요해요." },
        { status: 400 }
      );
    }
    const order = await createOrder(guest.sessionId, productId, body.reportId);
    return Response.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      reportId: body.reportId,
    });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    if (e instanceof CommerceError) {
      return commerceErrorResponse(e.message);
    }
    return commerceErrorResponse("ORDER_CREATE_FAILED", 500);
  }
}
