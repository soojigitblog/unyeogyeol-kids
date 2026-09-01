import { NextRequest } from "next/server";
import { createGuestSession } from "@/lib/server/commerceService";

export async function POST(_request: NextRequest) {
  try {
    const session = await createGuestSession();
    return Response.json(session);
  } catch {
    return Response.json(
      { error: "GUEST_SESSION_FAILED", message: "게스트 세션을 만들지 못했어요." },
      { status: 500 }
    );
  }
}
