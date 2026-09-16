import { NextRequest } from "next/server";
import { commerceErrorResponse } from "@/lib/server/commerceService";
import { getUnlockedReportAny } from "@/lib/server/reportAccess";
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
    // P3.2: canonical ownership OR 유효한 recovery grant (reportAccess.ts, hasReportAccess/getUnlockedReport 원본 무변경)
    const report = await getUnlockedReportAny(guest.sessionId, reportId);
    if (!report) {
      return commerceErrorResponse("ACCESS_DENIED", 403);
    }
    return Response.json({ report, reportId, reportVersion: "signature-v1" });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return commerceErrorResponse("REPORT_LOAD_FAILED", 500);
  }
}
