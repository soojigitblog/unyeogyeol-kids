import { NextRequest } from "next/server";
import { commerceErrorResponse, CommerceError } from "@/lib/server/commerceService";
import { issueOrRotateRecoveryCode } from "@/lib/server/recoveryService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";

// P3.2 §4: canonical owner만 발급/회전 가능. rotate:true 없이 이미 활성 코드가 있으면 409.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const guest = await requireGuestAuth(request);
    const { reportId } = await params;
    const body = await request.json().catch(() => ({}));
    const rotate = body?.rotate === true;

    const result = await issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate });
    return Response.json(result);
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    if (e instanceof CommerceError) {
      const status =
        e.message === "CODE_ALREADY_ISSUED"
          ? 409
          : e.message === "RECOVERY_CODE_ISSUE_FAILED"
            ? 500
            : 403;
      return commerceErrorResponse(e.message, status);
    }
    return commerceErrorResponse("RECOVERY_CODE_ISSUE_FAILED", 500);
  }
}
