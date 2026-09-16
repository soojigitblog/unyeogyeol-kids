import { NextResponse, type NextRequest } from "next/server";
import { hasValidAdminSessionApi } from "@/lib/admin/adminAuth";
import {
  decideRefundRequest,
  getRefundRequestById,
} from "@/lib/server/refundRequestService";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasValidAdminSessionApi(request)) {
    return NextResponse.json({ error: "FORBIDDEN", message: "관리자만 가능합니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    decision?: "APPROVED" | "REJECTED";
  };
  if (body.decision !== "APPROVED" && body.decision !== "REJECTED") {
    return NextResponse.json({ error: "INVALID_BODY", message: "요청 값이 올바르지 않습니다." }, { status: 400 });
  }

  const existing = await getRefundRequestById(id);
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND", message: "요청을 찾을 수 없습니다." }, { status: 404 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "ALREADY_DECIDED", message: "이미 처리된 요청입니다." }, { status: 409 });
  }

  await decideRefundRequest({ id, decision: body.decision, adminNote: null });
  return NextResponse.json({ ok: true });
}
