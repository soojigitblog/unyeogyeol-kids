import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, createAdminSessionToken, isValidAdminPassword } from "@/lib/admin/adminAuth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const password = body.password ?? "";
  if (!password || !isValidAdminPassword(password)) {
    return NextResponse.json({ error: "INVALID_PASSWORD", message: "비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
