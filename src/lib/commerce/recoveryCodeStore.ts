"use client";

import { createTabSessionStore } from "@/lib/storage/sessionStore";

// P3.2: 평문 recovery code는 DB에 저장하지 않으므로, 클라이언트가 유일하게 그 값을 들고
// 있을 수 있는 곳은 이 탭의 sessionStorage뿐이다(탭 종료 시 소멸 — 의도된 동작).
export function recoveryCodeTabStore(reportId: string) {
  return createTabSessionStore<string>(`uyk_recovery_code_${reportId}`);
}
