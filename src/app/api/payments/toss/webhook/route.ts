import { NextRequest } from "next/server";
import {
  CommerceError,
  confirmPaymentFromTossWebhook,
} from "@/lib/server/commerceService";
import { isLivePaymentEnabled, isTossTestMode } from "@/lib/commerce/paymentMode";

type TossWebhookPayload = {
  eventType?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
  };
};

/**
 * Configure this URL in the Toss Payments dashboard for PAYMENT_STATUS_CHANGED.
 * A forged request cannot unlock a report: the server re-confirms every tuple
 * with Toss using the secret key before changing an order or report.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isLivePaymentEnabled() && !isTossTestMode()) {
      return Response.json({ ok: true, ignored: true });
    }

    const payload = (await request.json()) as TossWebhookPayload;
    const payment = payload.data;
    if (
      payload.eventType !== "PAYMENT_STATUS_CHANGED" ||
      payment?.status !== "DONE" ||
      !payment.paymentKey ||
      !payment.orderId ||
      typeof payment.totalAmount !== "number"
    ) {
      return Response.json({ ok: true, ignored: true });
    }

    await confirmPaymentFromTossWebhook({
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
      amount: payment.totalAmount,
    });
    return Response.json({ ok: true });
  } catch (error) {
    // A non-2xx response makes Toss retry delivery. Never return provider
    // details or order identifiers to an unauthenticated caller.
    if (error instanceof CommerceError) {
      return Response.json({ ok: false }, { status: 500 });
    }
    return Response.json({ ok: false }, { status: 500 });
  }
}
