// P3.2 GUEST PAID RESULT RECOVERY — 보안/동시성 회귀 테스트
//
// 목적: canonical ownership(report_ownerships, commerceService.ts)은 전혀 건드리지 않고
// recovery 기능이 그 위에 순수 additive 계층으로만 동작하는지, 그리고 §18에서 요구한
// "report당 활성 recovery code는 항상 정확히 1개"를 동시 요청 상황에서도 보장하는지 검증한다.

import { describe, expect, it, beforeEach } from "vitest";
import { resetMemoryDb } from "@/lib/supabase/memoryStore";
import { resetSupabaseAdminForTests, getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  CommerceError,
  confirmPayment,
  createGuestSession,
  createOrder,
  hasReportAccess,
  prepareSignatureReport,
} from "@/lib/server/commerceService";
import { issueOrRotateRecoveryCode, recoverByCode } from "@/lib/server/recoveryService";
import {
  hasReportAccessAny,
  getUnlockedReportAny,
  listMyResultsWithGrants,
} from "@/lib/server/reportAccess";
import { SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";
import { normalizeRecoveryCode, hashRecoveryCode } from "@/lib/commerce/recoveryCode";
import type { SignaturePrepareInput } from "@/lib/server/reportBuilder";

const caseA = {
  child: {
    name: "하람",
    birthDate: "2023-03-15",
    birthTimeKnown: false,
    gender: "girl" as const,
  },
  answers: { new_environment: 2 as const, transition: 1 as const },
  caregiverProfile: {
    role: "father" as const,
    roleLabel: "아빠",
    birthDate: "1990-05-20",
    birthTimeKnown: false,
  },
  momAnswers: {
    time_pressure_style: "opt_time_control",
    instruction_resistance_style: "opt_inst_firm",
  },
  conflictInput: {
    concernId: "sleep" as const,
    scenarioId: "sc_sleep_bedtime_delay",
    childFirstReaction: "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함",
    momFirstReaction: "'이제 자야 할 시간이야' 하고 재촉함",
    subsequentEscalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
    recentFrequency: "daily" as const,
    momTypicalPhrase: "이제 자야 할 시간이야",
  },
  concern: "sleep" as const,
} satisfies SignaturePrepareInput;

async function purchasedReport(input: SignaturePrepareInput) {
  const guest = await createGuestSession();
  const { reportId } = await prepareSignatureReport(guest.sessionId, input);
  const order = await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);
  await confirmPayment(guest.sessionId, { orderId: order.orderId, amount: 12900 });
  return { guest, reportId, order };
}

describe("P3.2 Guest Recovery", () => {
  beforeEach(() => {
    process.env.COMMERCE_STORE = "memory";
    process.env.PAYMENT_MODE = "mock";
    process.env.RECOVERY_CODE_SECRET = "test-only-secret-do-not-use-in-prod";
    resetSupabaseAdminForTests();
    resetMemoryDb();
  });

  // ── §0 불변조건: canonical ownership은 recovery 기능과 무관하게 그대로 동작 ──
  it("canonical owner는 recovery 코드 없이도 기존과 동일하게 접근 가능하다", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(true);
    expect(await hasReportAccessAny(guest.sessionId, reportId)).toBe(true);
  });

  it("reportId만으로는(canonical도 grant도 없이) 접근할 수 없다", async () => {
    const { reportId } = await purchasedReport(caseA);
    const stranger = await createGuestSession();
    expect(await hasReportAccessAny(stranger.sessionId, reportId)).toBe(false);
    expect(await getUnlockedReportAny(stranger.sessionId, reportId)).toBeNull();
  });

  // ── §4 발급 권한: canonical owner만 가능 ──
  it("결제하지 않은/타인 세션은 recovery 코드를 발급할 수 없다", async () => {
    const { reportId } = await purchasedReport(caseA);
    const stranger = await createGuestSession();
    await expect(
      issueOrRotateRecoveryCode(stranger.sessionId, reportId, { rotate: false })
    ).rejects.toThrow("ACCESS_DENIED");
  });

  it("recovery grant로 접근한 세션은 새 코드를 발급/회전할 수 없다(canonical 아님)", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    const { recoveryCode } = await issueOrRotateRecoveryCode(guest.sessionId, reportId, {
      rotate: false,
    });
    const recoveringDevice = await createGuestSession();
    await recoverByCode(recoveringDevice.sessionId, recoveryCode);
    expect(await hasReportAccessAny(recoveringDevice.sessionId, reportId)).toBe(true);

    await expect(
      issueOrRotateRecoveryCode(recoveringDevice.sessionId, reportId, { rotate: false })
    ).rejects.toThrow("ACCESS_DENIED");
  });

  // ── §2 활성 코드 유일성 (순차) ──
  it("이미 활성 코드가 있으면 rotate:false 재발급은 CODE_ALREADY_ISSUED", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    await issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate: false });
    await expect(
      issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate: false })
    ).rejects.toThrow("CODE_ALREADY_ISSUED");
  });

  // ── §18 동시성: 최초 발급 2건 동시 요청 ──
  it("동시 발급 요청 2건 중 정확히 1건만 성공하고 활성 코드는 1개만 남는다", async () => {
    const { guest, reportId } = await purchasedReport(caseA);

    const results = await Promise.allSettled([
      issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate: false }),
      issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate: false }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(CommerceError);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toBe("CODE_ALREADY_ISSUED");

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("report_recovery_codes")
      .select("id, revoked_at")
      .eq("report_id", reportId);
    const active = (data ?? []).filter((r) => r.revoked_at == null);
    expect(active).toHaveLength(1);
  });

  // ── §18 동시성: 회전 2건 동시 요청 ──
  it("동시 회전 요청 2건 후에도 활성 코드는 정확히 1개이고, 이전 코드/파생 grant는 모두 회수된다", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    const { recoveryCode: originalCode } = await issueOrRotateRecoveryCode(guest.sessionId, reportId, {
      rotate: false,
    });
    const device1 = await createGuestSession();
    await recoverByCode(device1.sessionId, originalCode);
    expect(await hasReportAccessAny(device1.sessionId, reportId)).toBe(true);

    const rotateResults = await Promise.allSettled([
      issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate: true }),
      issueOrRotateRecoveryCode(guest.sessionId, reportId, { rotate: true }),
    ]);
    expect(rotateResults.every((r) => r.status === "fulfilled")).toBe(true);

    const supabase = getSupabaseAdmin();
    const { data: codes } = await supabase
      .from("report_recovery_codes")
      .select("id, revoked_at")
      .eq("report_id", reportId);
    const active = (codes ?? []).filter((r) => r.revoked_at == null);
    expect(active).toHaveLength(1);

    // 원래 코드로는 더 이상 복구 불가
    await expect(recoverByCode(device1.sessionId, originalCode)).rejects.toThrow(
      "RECOVERY_CODE_INVALID"
    );
    // device1의 기존 grant는 원래 코드에서 파생됐으므로 회전 과정에서 회수됨
    expect(await hasReportAccessAny(device1.sessionId, reportId)).toBe(false);
    // canonical owner는 영향 없음
    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(true);
  });

  // ── §15 회전 시나리오(순차, 결과 명확성 확인용) ──
  it("코드 회전: 이전 코드 실패, 이전 grant 회수, 새 코드로 재복구 성공", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    const { recoveryCode: oldCode } = await issueOrRotateRecoveryCode(guest.sessionId, reportId, {
      rotate: false,
    });
    const otherDevice = await createGuestSession();
    await recoverByCode(otherDevice.sessionId, oldCode);
    expect(await hasReportAccessAny(otherDevice.sessionId, reportId)).toBe(true);

    const { recoveryCode: newCode } = await issueOrRotateRecoveryCode(guest.sessionId, reportId, {
      rotate: true,
    });
    expect(newCode).not.toBe(oldCode);

    await expect(recoverByCode(otherDevice.sessionId, oldCode)).rejects.toThrow(
      "RECOVERY_CODE_INVALID"
    );
    expect(await hasReportAccessAny(otherDevice.sessionId, reportId)).toBe(false);
    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(true);

    // §9: 이전에 revoke된 grant row가 있어도 새 코드로 재복구(재활성화)는 정상 동작해야 한다
    await recoverByCode(otherDevice.sessionId, newCode);
    expect(await hasReportAccessAny(otherDevice.sessionId, reportId)).toBe(true);
  });

  // ── 잘못된 코드 / 존재하지 않는 코드 ──
  it("잘못된 코드는 항상 RECOVERY_CODE_INVALID이며 존재 여부를 구분하지 않는다", async () => {
    const { reportId } = await purchasedReport(caseA);
    const device = await createGuestSession();
    await expect(recoverByCode(device.sessionId, "0000-0000-0000")).rejects.toThrow(
      "RECOVERY_CODE_INVALID"
    );
    expect(await hasReportAccessAny(device.sessionId, reportId)).toBe(false);
  });

  // ── §5 alphabet/entropy 정확성 ──
  it("normalize/hash는 대시·공백·대소문자를 일관되게 처리한다", () => {
    const a = normalizeRecoveryCode("abcd-efgh-jkmn");
    const b = normalizeRecoveryCode(" ABCD EFGH JKMN ");
    expect(a).toBe("ABCDEFGHJKMN");
    expect(a).toBe(b);
    expect(hashRecoveryCode(a)).toBe(hashRecoveryCode(b));
  });

  // ── §11 My Results 병합 ──
  it("My Results는 canonical 소유 결과와 recovery grant 결과를 합쳐서 보여준다", async () => {
    const { guest: buyer, reportId } = await purchasedReport(caseA);
    const { recoveryCode } = await issueOrRotateRecoveryCode(buyer.sessionId, reportId, {
      rotate: false,
    });
    const newDevice = await createGuestSession();
    await recoverByCode(newDevice.sessionId, recoveryCode);

    const buyerResults = await listMyResultsWithGrants(buyer.sessionId);
    expect(buyerResults).toHaveLength(1);
    expect(buyerResults[0].canManageRecoveryCode).toBe(true);

    const newDeviceResults = await listMyResultsWithGrants(newDevice.sessionId);
    expect(newDeviceResults).toHaveLength(1);
    expect(newDeviceResults[0].reportId).toBe(reportId);
    expect(newDeviceResults[0].canManageRecoveryCode).toBe(false);
  });

  // ── 평문/시크릿 미저장 확인 ──
  it("발급된 recovery code 평문은 DB 어디에도 저장되지 않는다(해시만 저장)", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    const { recoveryCode } = await issueOrRotateRecoveryCode(guest.sessionId, reportId, {
      rotate: false,
    });
    const plainNormalized = normalizeRecoveryCode(recoveryCode);

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("report_recovery_codes")
      .select("code_hash")
      .eq("report_id", reportId);
    for (const row of data ?? []) {
      expect(row.code_hash).not.toBe(plainNormalized);
      expect(row.code_hash).not.toContain(plainNormalized);
      expect(row.code_hash).toBe(hashRecoveryCode(plainNormalized));
    }
  });
});
