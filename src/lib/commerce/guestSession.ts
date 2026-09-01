"use client";

import { createLocalSessionStore } from "@/lib/storage/sessionStore";

export interface GuestSession {
  sessionId: string;
  accessToken: string;
}

const STORAGE_KEY = "uyk_guest_v1";
const store = createLocalSessionStore<GuestSession>(STORAGE_KEY);

export function loadGuestSession(): GuestSession | null {
  return store.load();
}

export function saveGuestSession(session: GuestSession): void {
  store.save(session);
}

export function clearGuestSession(): void {
  store.clear();
}

export async function ensureGuestSession(): Promise<GuestSession> {
  const existing = loadGuestSession();
  if (existing?.sessionId && existing?.accessToken) {
    return existing;
  }
  const res = await fetch("/api/guest/session", { method: "POST" });
  if (!res.ok) {
    throw new Error("GUEST_SESSION_FAILED");
  }
  const session = (await res.json()) as GuestSession;
  saveGuestSession(session);
  return session;
}

export function guestAuthHeaders(session: GuestSession): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-guest-session-id": session.sessionId,
    "x-guest-access-token": session.accessToken,
  };
}
