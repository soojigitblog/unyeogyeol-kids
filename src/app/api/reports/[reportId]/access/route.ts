import { NextRequest } from "next/server";
import { commerceErrorResponse } from "@/lib/server/commerceService";
import { hasReportAccessAny } from "@/lib/server/reportAccess";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const guest = await requireGuestAuth(request);
    const { reportId } = await params;
    // P3.2: canonical ownership OR 유효한 recovery grant
    const allowed = await hasReportAccessAny(guest.sessionId, reportId);
    return Response.json({ allowed, reportId });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return commerceErrorResponse("ACCESS_CHECK_FAILED", 500);
  }
}
