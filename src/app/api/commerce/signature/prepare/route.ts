import { NextRequest } from "next/server";
import {
  commerceErrorResponse,
  prepareSignatureReport,
} from "@/lib/server/commerceService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";
import type { SignaturePrepareInput } from "@/lib/server/reportBuilder";

export async function POST(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    const body = (await request.json()) as SignaturePrepareInput;
    if (!body.child?.birthDate || !body.caregiverProfile?.birthDate || !body.concern) {
      return Response.json(
        { error: "INVALID_INPUT", message: "필수 입력이 누락되었어요." },
        { status: 400 }
      );
    }
    const result = await prepareSignatureReport(guest.sessionId, body);
    return Response.json(result);
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return commerceErrorResponse("PREPARE_FAILED", 500);
  }
}
