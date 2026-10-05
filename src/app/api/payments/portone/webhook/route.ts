import { NextRequest } from "next/server";
import { Webhook } from "@portone/server-sdk";
import { confirmPaymentFromPortOneWebhook } from "@/lib/server/commerceService";

/** Signature is checked against the raw request, then the provider is re-fetched. */
export async function POST(request: NextRequest) {
  const secret = process.env.PORTONE_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ ok: false }, { status: 503 });
  try {
    const raw = await request.text();
    const event = await Webhook.verify(secret, raw, Object.fromEntries(request.headers));
    if (Webhook.isUnrecognizedWebhook(event) || event.type !== "Transaction.Paid") return Response.json({ ok: true, ignored: true });
    const orderId = String(event.data.paymentId).replace(/^kids_/, "");
    await confirmPaymentFromPortOneWebhook({ paymentKey: event.data.paymentId, orderId, amount: 0 });
    return Response.json({ ok: true });
  } catch { return Response.json({ ok: false }, { status: 500 }); }
}
