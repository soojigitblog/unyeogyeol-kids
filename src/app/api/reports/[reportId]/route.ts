import { NextRequest } from "next/server";
import {
  commerceErrorResponse,
  getUnlockedReport,
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
    const report = await getUnlockedReport(guest.sessionId, reportId);
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
