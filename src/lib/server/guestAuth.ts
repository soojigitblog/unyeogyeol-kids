import { NextRequest } from "next/server";
import { hashAccessToken } from "@/lib/commerce/crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const GUEST_SESSION_HEADER = "x-guest-session-id";
export const GUEST_TOKEN_HEADER = "x-guest-access-token";

export interface GuestAuthContext {
  sessionId: string;
  accessToken: string;
}

export function readGuestHeaders(request: NextRequest): GuestAuthContext | null {
  const sessionId = request.headers.get(GUEST_SESSION_HEADER);
  const accessToken = request.headers.get(GUEST_TOKEN_HEADER);
  if (!sessionId || !accessToken) return null;
  return { sessionId, accessToken };
}

export async function verifyGuestSession(
  ctx: GuestAuthContext
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guest_sessions")
    .select("id")
    .eq("id", ctx.sessionId)
    .eq("access_token_hash", hashAccessToken(ctx.accessToken))
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function requireGuestAuth(
  request: NextRequest
): Promise<GuestAuthContext> {
  const ctx = readGuestHeaders(request);
  if (!ctx) {
    throw new GuestAuthError("GUEST_AUTH_REQUIRED");
  }
  const valid = await verifyGuestSession(ctx);
  if (!valid) {
    throw new GuestAuthError("GUEST_AUTH_INVALID");
  }
  return ctx;
}

export class GuestAuthError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "GuestAuthError";
  }
}

export function guestAuthErrorResponse(code: string, status = 401) {
  return Response.json({ error: code }, { status });
}
