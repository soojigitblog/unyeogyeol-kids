import { NextRequest } from "next/server";
import { listMyResults } from "@/lib/server/commerceService";
import {
  GuestAuthError,
  guestAuthErrorResponse,
  requireGuestAuth,
} from "@/lib/server/guestAuth";

export async function GET(request: NextRequest) {
  try {
    const guest = await requireGuestAuth(request);
    const results = await listMyResults(guest.sessionId);
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
