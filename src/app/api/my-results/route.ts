import { NextRequest } from "next/server";
import { listMyResultsWithGrants } from "@/lib/server/reportAccess";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";

export async function GET(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    // P3.2: canonical 소유 결과 + 유효한 recovery grant 결과를 합쳐서 반환(중복 report는 1개만)
    const results = await listMyResultsWithGrants(guest.sessionId);
    return Response.json({ results });
  } catch (e) {
    if (e instanceof GuestAuthError) {
      return guestAuthErrorResponse(e.message);
    }
    return Response.json(
      { error: "LIST_FAILED", message: "결과 목록을 불러오지 못했어요." },
      { status: 500 }
    );
  }
}
