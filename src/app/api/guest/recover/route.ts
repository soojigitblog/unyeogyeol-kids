import { NextRequest } from "next/server";
import { commerceErrorResponse, CommerceError } from "@/lib/server/commerceService";
import { recoverByCode } from "@/lib/server/recoveryService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";
import {
  assertNotRateLimited,
  getSessionBucket,
  getTrustedIpBucket,
  recordRecoveryAttempt,
  RateLimitedError,
} from "@/lib/server/rateLimit";

// P3.2 §8: 코드가 "해당 report 접근 자격"을 증명 — 세션 신원은 기존 Guest 인증 헤더로만 증명한다.
// body에는 recoveryCode만 있고 guest_session_id는 받지 않는다(클라이언트가 임의 세션에 grant를 붙이는 것 금지).
export async function POST(request: NextRequest) {
  let sessionId: string | null = null;
  const buckets = { sessionBucket: "", ipBucket: getTrustedIpBucket(request) };

  try {
    const guest = await requireGuestAuth(request);
    sessionId = guest.sessionId;
    buckets.sessionBucket = getSessionBucket(guest.sessionId);

    await assertNotRateLimited(buckets);

    const body = await request.json().catch(() => ({}));
    const recoveryCode = typeof body?.recoveryCode === "string" ? body.recoveryCode : "";

    const result = await recoverByCode(guest.sessionId, recoveryCode);
    await recordRecoveryAttempt(buckets, true);
    return Response.json(result);
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    if (e instanceof RateLimitedError) {
      return commerceErrorResponse("RECOVERY_CODE_INVALID", 429);
    }
    if (sessionId) {
      await recordRecoveryAttempt(buckets, false).catch(() => {});
    }
    if (e instanceof CommerceError) {
      return commerceErrorResponse("RECOVERY_CODE_INVALID", 400);
    }
    return commerceErrorResponse("RECOVERY_CODE_INVALID", 400);
  }
}
