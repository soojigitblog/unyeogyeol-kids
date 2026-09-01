import { describe, expect, it, beforeEach, vi } from "vitest";
import { resetMemoryDb } from "@/lib/supabase/memoryStore";
import { resetSupabaseAdminForTests } from "@/lib/supabase/admin";
import {
  confirmPayment,
  createGuestSession,
  createOrder,
  getUnlockedReport,
  hasReportAccess,
  listMyResults,
  prepareSignatureReport,
  CommerceError,
} from "@/lib/server/commerceService";
import { getProductPrice } from "@/lib/commerce/products";
import { buildShareSummaryText, assertSharePrivacy } from "@/lib/purchase/sharePayload";

import type { SignaturePrepareInput } from "@/lib/server/reportBuilder";

const sampleInput = {
  child: {
    name: "하람",
    birthDate: "2023-03-15",
    birthTimeKnown: false,
    gender: "girl" as const,
  },
  answers: { new_environment: 2 as const, transition: 2 as const, self_assertion: 2 as const },
  caregiverProfile: {
    role: "father" as const,
    roleLabel: "아빠",
    birthDate: "1990-05-20",
    birthTimeKnown: false,
  },
  momAnswers: {
    time_pressure_style: "opt_time_control",
    emotion_coping_style: "opt_emo_explain",
    instruction_resistance_style: "opt_inst_firm",
    routine_flexibility_style: "opt_rout_replan",
    conflict_recovery_style: "opt_rec_repair",
  },
  conflictInput: {
    concernId: "sleep" as const,
    scenarioId: "sc_sleep_bedtime_delay",
    childFirstReaction: "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함",
    momFirstReaction: "'이제 자야 할 시간이야, 빨리 누워' 하고 재촉함",
    subsequentEscalation: "아이가 침대에서 딴청을 피우며 잠들기를 미룸",
    recentFrequency: "several_times_a_week" as const,
    momTypicalPhrase: "이제 자야 할 시간이야, 빨리 누워",
  },
  concern: "sleep" as const,
  sleepAnswers: {
    bedtime_transition: "sleep_transition_needs_completion",
    routine_order: "sleep_routine_prefers_familiar_sequence",
    lights_off_departure: "sleep_separation_requests_presence",
    pre_sleep: "sleep_prebed_continues_activity",
  },
} satisfies SignaturePrepareInput;

describe("P2.4 Commerce Server", () => {
  beforeEach(() => {
    process.env.COMMERCE_STORE = "memory";
    process.env.PAYMENT_MODE = "mock";
    resetSupabaseAdminForTests();
    resetMemoryDb();
  });

  it("server product price is 12900", () => {
    expect(getProductPrice("signature_relationship")).toBe(12900);
  });

  it("prepare → order → confirm → ownership", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, sampleInput);
    const order = await createOrder(
      guest.sessionId,
      "signature_relationship",
      reportId
    );
    expect(order.amount).toBe(12900);

    const before = await hasReportAccess(guest.sessionId, reportId);
    expect(before).toBe(false);

    const paid = await confirmPayment(guest.sessionId, {
      orderId: order.orderId,
      amount: 12900,
    });
    expect(paid.status).toBe("PAID");

    const after = await hasReportAccess(guest.sessionId, reportId);
    expect(after).toBe(true);

    const report = await getUnlockedReport(guest.sessionId, reportId);
    expect(report?.meta.childName).toBe("하람");
  });

  it("rejects client amount manipulation", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, sampleInput);
    const order = await createOrder(
      guest.sessionId,
      "signature_relationship",
      reportId
    );
    await expect(
      confirmPayment(guest.sessionId, { orderId: order.orderId, amount: 100 })
    ).rejects.toBeInstanceOf(CommerceError);
  });

  it("duplicate confirm is idempotent", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, sampleInput);
    const order = await createOrder(
      guest.sessionId,
      "signature_relationship",
      reportId
    );
    await confirmPayment(guest.sessionId, { orderId: order.orderId, amount: 12900 });
    const again = await confirmPayment(guest.sessionId, {
      orderId: order.orderId,
      amount: 12900,
    });
    expect(again.alreadyPaid).toBe(true);
    const list = await listMyResults(guest.sessionId);
    expect(list.length).toBe(1);
  });

  it("other guest cannot access report", async () => {
    const guestA = await createGuestSession();
    const guestB = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guestA.sessionId, sampleInput);
    const order = await createOrder(
      guestA.sessionId,
      "signature_relationship",
      reportId
    );
    await confirmPayment(guestA.sessionId, { orderId: order.orderId, amount: 12900 });
    expect(await hasReportAccess(guestB.sessionId, reportId)).toBe(false);
    expect(await getUnlockedReport(guestB.sessionId, reportId)).toBeNull();
  });

  it("share payload privacy", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, sampleInput);
    const order = await createOrder(
      guest.sessionId,
      "signature_relationship",
      reportId
    );
    await confirmPayment(guest.sessionId, { orderId: order.orderId, amount: 12900 });
    const report = await getUnlockedReport(guest.sessionId, reportId);
    const text = buildShareSummaryText(report!);
    expect(assertSharePrivacy(text)).toBe(true);
    expect(text).not.toContain("paymentKey");
  });

  it("live payment mode is blocked", async () => {
    vi.resetModules();
    process.env.PAYMENT_MODE = "live";
    const { getPaymentMode } = await import("@/lib/commerce/paymentMode");
    expect(() => getPaymentMode()).toThrow("LIVE payment is not enabled");
    vi.resetModules();
    process.env.PAYMENT_MODE = "mock";
  });
});
