import { NextRequest } from "next/server";
import {
  commerceErrorResponse,
  getUnlockedReport,
  hasReportAccess,
} from "@/lib/server/commerceService";
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
    const allowed = await hasReportAccess(guest.sessionId, reportId);
    return Response.json({ allowed, reportId });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return commerceErrorResponse("ACCESS_CHECK_FAILED", 500);
  }
}
