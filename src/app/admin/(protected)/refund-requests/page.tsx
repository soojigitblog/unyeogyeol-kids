import {
  getOrderForAdmin,
  listRefundRequestsForAdmin,
} from "@/lib/server/refundRequestService";
import { getProduct } from "@/lib/commerce/products";
import { RefundRequestsPanel } from "@/components/admin/RefundRequestsPanel";

export const dynamic = "force-dynamic";

export default async function AdminRefundRequestsPage() {
  const rows = await listRefundRequestsForAdmin();

  const items = await Promise.all(
    rows.map(async (row) => {
      const order = await getOrderForAdmin(row.order_id);
      const product = order ? getProduct(order.productId) : null;
      return {
        id: row.id,
        orderId: row.order_id,
        productName: product?.name ?? "상품",
        amount: order?.amount ?? 0,
        reason: row.reason,
        screenshotDataUrl: row.screenshot_data_url,
        status: row.status,
        createdAt: row.created_at,
        decidedAt: row.decided_at,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-cocoa">환불 신청</h1>
      <p className="mt-2 text-sm text-cocoa-soft">
        승인해도 이 시스템이 자동으로 환불하지 않습니다. 승인은 주문 상태만
        REFUNDED로 표시하며, 실제 결제 취소는 토스 대시보드에서 직접 처리해야
        합니다.
      </p>
      <RefundRequestsPanel items={items} />
    </div>
  );
}
