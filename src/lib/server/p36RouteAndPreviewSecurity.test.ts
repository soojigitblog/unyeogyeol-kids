// P3.6 보안 테스트 보강 — Phase 3에서 새로 발견된 갭만 다룬다(기존 p24Security.test.ts/
// p24Snapshot.test.ts가 이미 다루는 소유권/불변성 시나리오는 재검증하지 않는다).

import { describe, expect, it, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { resetMemoryDb } from "@/lib/supabase/memoryStore";
import { resetSupabaseAdminForTests } from "@/lib/supabase/admin";
import { confirmPayment, createGuestSession, createOrder, prepareSignatureReport } from "@/lib/server/commerceService";
import { SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";
import { GET as reportGet } from "@/app/api/reports/[reportId]/route";
import { buildFreeLockPreview } from "@/lib/interpretation/freeLockPreview";
import type { SignaturePrepareInput } from "@/lib/server/reportBuilder";

const sample = {
  child: { name: "테스트", birthDate: "2023-06-01", birthTimeKnown: false, gender: "girl" as const },
  answers: { new_environment: 2 as const, transition: 1 as const, self_assertion: 4 as const },
  caregiverProfile: { role: "mother" as const, roleLabel: "엄마", birthDate: "1990-01-01", birthTimeKnown: false },
  momAnswers: { time_pressure_style: "opt_time_control", instruction_resistance_style: "opt_inst_firm" },
  conflictInput: {
    concernId: "discipline" as const,
    scenarioId: "sc_discipline_instruction",
    recentFrequency: "daily" as const,
  },
  concern: "discipline" as const,
} satisfies SignaturePrepareInput;

function requestFor(reportId: string, sessionId: string, accessToken: string) {
  return new NextRequest(`http://localhost/api/reports/${reportId}`, {
    headers: { "x-guest-session-id": sessionId, "x-guest-access-token": accessToken },
  });
}

const PAID_KEYS = ["talkingPoints", "conflictMap", "talentSeeds", "growthContent", "guides", "chapter01_recurringScene"];

describe("P3.6 라우트 레벨 보안", () => {
  beforeEach(() => {
    process.env.COMMERCE_STORE = "memory";
    process.env.PAYMENT_MODE = "mock";
    resetSupabaseAdminForTests();
    resetMemoryDb();
  });

  it("(b) 다른 게스트 세션으로 report 라우트를 직접 호출하면 403이고 body에 리포트가 없다", async () => {
    const ownerGuest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(ownerGuest.sessionId, sample);
    const order = await createOrder(ownerGuest.sessionId, SIGNATURE_PRODUCT_ID, reportId);
    await confirmPayment(ownerGuest.sessionId, { orderId: order.orderId, amount: order.amount });

    const attackerGuest = await createGuestSession();
    const res = await reportGet(requestFor(reportId, attackerGuest.sessionId, attackerGuest.accessToken), {
      params: Promise.resolve({ reportId }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.report).toBeUndefined();
  });

  it("(c) 결제 전(LOCKED) 리포트를 정당한 소유자가 조회해도 403이고 유료 키가 body에 전혀 없다", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, sample);
    // 결제하지 않음 — status는 여전히 LOCKED

    const res = await reportGet(requestFor(reportId, guest.sessionId, guest.accessToken), {
      params: Promise.resolve({ reportId }),
    });
    expect(res.status).toBe(403);
    const bodyText = JSON.stringify(await res.json());
    for (const key of PAID_KEYS) {
      expect(bodyText).not.toContain(key);
    }
  });

  it("(g) paidExtrasStore.ts는 service-role(getSupabaseAdmin)만 쓰고 src/lib/server 밖에서 import되지 않는다", () => {
    const storeFile = path.join(process.cwd(), "src/lib/server/paidExtrasStore.ts");
    const storeSource = fs.readFileSync(storeFile, "utf-8");
    expect(storeSource).toContain("getSupabaseAdmin");
    expect(storeSource).not.toMatch(/anon|NEXT_PUBLIC_SUPABASE/);

    const srcDir = path.join(process.cwd(), "src");
    const offenders: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") continue;
          walk(full);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && full !== storeFile) {
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes("paidExtrasStore") && !full.includes(`${path.sep}server${path.sep}`)) {
            offenders.push(full);
          }
        }
      }
    }
    walk(srcDir);
    expect(offenders).toEqual([]);
  });
});

describe("P3.6 무료/잠금 미리보기는 결제·AI 경로를 전혀 타지 않는다 (h)", () => {
  it("정적 검사: freeLockPreview.ts / lock 컴포넌트 소스에 AI·유료API 호출 문자열이 없다", () => {
    const files = [
      "src/lib/interpretation/freeLockPreview.ts",
      "src/components/lock/BlurredText.tsx",
      "src/components/lock/LockedListItem.tsx",
      "src/components/lock/ConflictMapPreviewRow.tsx",
      "src/components/lock/StickyUnlockCta.tsx",
    ];
    const forbidden = ["generateKidsStructured", "generatePaidExtras", "/api/reports", "fetch("];
    for (const rel of files) {
      const content = fs.readFileSync(path.join(process.cwd(), rel), "utf-8");
      for (const term of forbidden) {
        expect(content).not.toContain(term);
      }
    }
  });

  it("샘플 랜딩 카드는 실제 방문자 데이터(useKids)를 참조하지 않는다", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "src/components/landing/SampleResultShowcase.tsx"),
      "utf-8"
    );
    expect(content).not.toContain("useKids");
  });

  it("런타임: AI/paid-extras 모듈을 강제로 죽여도 buildFreeLockPreview는 정상 동작한다", async () => {
    vi.doMock("@/lib/server/generatePaidExtras", () => {
      throw new Error("AI/PAID MODULE SHOULD NEVER BE IMPORTED BY FREE PREVIEW");
    });
    const result = buildFreeLockPreview({
      answers: { self_assertion: 4, new_environment: 2 },
      dayMasterElement: "fire",
    });
    expect(result.talents).toHaveLength(5);
    expect(result.talkingPoints).toHaveLength(13);
    expect(result.conflictMap).toHaveLength(13);
    vi.doUnmock("@/lib/server/generatePaidExtras");
  });
});
