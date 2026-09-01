// P2.4 보안·소유권 회귀 테스트 (§38 공격 테스트 / §51 자동 테스트)
//
// 목적: 결제하지 않은 사람이 유료 결과를 볼 수 없고, 다른 게스트의 결과에 접근할 수 없으며,
//       클라이언트가 금액이나 결제 상태를 조작해도 서버 권한이 바뀌지 않는지 검증한다.

import { describe, expect, it, beforeEach } from "vitest";
import { resetMemoryDb } from "@/lib/supabase/memoryStore";
import { resetSupabaseAdminForTests, getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  CommerceError,
  confirmPayment,
  createGuestSession,
  createOrder,
  getUnlockedReport,
  hasReportAccess,
  listMyResults,
  markOrderFailed,
  prepareSignatureReport,
} from "@/lib/server/commerceService";
import { getProductPrice, PRODUCTS, SIGNATURE_PRODUCT_ID } from "@/lib/commerce/products";
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

const caseB = {
  child: {
    name: "열무",
    birthDate: "2024-04-15",
    birthTimeKnown: true,
    birthTime: "09:30",
    gender: "boy" as const,
  },
  answers: { new_environment: 2 as const, self_assertion: 4 as const },
  caregiverProfile: {
    role: "maternal_grandmother" as const,
    roleLabel: "외할머니",
    birthDate: "1961-06-02",
    birthTimeKnown: false,
  },
  momAnswers: {
    time_pressure_style: "opt_time_control",
    instruction_resistance_style: "opt_inst_firm",
  },
  conflictInput: {
    concernId: "meal" as const,
    scenarioId: "sc_meal_new_food_reject",
    childFirstReaction: "처음 보는 반찬을 보자마자 입을 닫고 밀어냄",
    momFirstReaction: "'한 입만 먹어보자' 하고 숟가락을 건넴",
    subsequentEscalation: "아이가 고개를 돌리며 숟가락을 밀침",
    recentFrequency: "daily" as const,
    momTypicalPhrase: "한 입만 먹어보자",
  },
  concern: "meal" as const,
  foodAnswers: {
    new_food_reaction: "inspect_smell_shape" as const,
    preference_balance: "leave_unfamiliar" as const,
    prompt_response: "shake_head_close_mouth" as const,
    meal_flow_block: "put_down_spoon_divert" as const,
  },
} satisfies SignaturePrepareInput;

async function purchasedReport(input: SignaturePrepareInput) {
  const guest = await createGuestSession();
  const { reportId } = await prepareSignatureReport(guest.sessionId, input);
  const order = await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);
  await confirmPayment(guest.sessionId, { orderId: order.orderId, amount: 12900 });
  return { guest, reportId, order };
}

describe("P2.4 결제 소유권 보안", () => {
  beforeEach(() => {
    process.env.COMMERCE_STORE = "memory";
    process.env.PAYMENT_MODE = "mock";
    resetSupabaseAdminForTests();
    resetMemoryDb();
  });

  // ── 결제 전 접근 차단 ──────────────────────────────────
  it("결제하지 않은 리포트는 조회할 수 없다", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);

    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(false);
    expect(await getUnlockedReport(guest.sessionId, reportId)).toBeNull();
    expect(await listMyResults(guest.sessionId)).toHaveLength(0);
  });

  it("주문만 만들고 결제하지 않으면 리포트는 LOCKED 로 남는다", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);
    await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("reports")
      .select("status")
      .eq("id", reportId)
      .maybeSingle();
    expect(data?.status).toBe("LOCKED");
    expect(await getUnlockedReport(guest.sessionId, reportId)).toBeNull();
  });

  it("결제 실패 주문은 소유권을 만들지 않는다", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);
    const order = await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);

    await markOrderFailed(order.orderId, guest.sessionId);

    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(false);
    expect(await getUnlockedReport(guest.sessionId, reportId)).toBeNull();
  });

  it("success URL 을 직접 열어도(존재하지 않는 주문 confirm) unlock 되지 않는다", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);

    await expect(
      confirmPayment(guest.sessionId, { orderId: "ORD-19700101-DEADBEEF", amount: 12900 })
    ).rejects.toBeInstanceOf(CommerceError);
    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(false);
  });

  // ── 다른 게스트 격리 ───────────────────────────────────
  it("다른 게스트는 남의 주문을 결제 승인할 수 없다", async () => {
    const guestA = await createGuestSession();
    const guestB = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guestA.sessionId, caseA);
    const order = await createOrder(guestA.sessionId, SIGNATURE_PRODUCT_ID, reportId);

    await expect(
      confirmPayment(guestB.sessionId, { orderId: order.orderId, amount: 12900 })
    ).rejects.toBeInstanceOf(CommerceError);
    expect(await hasReportAccess(guestA.sessionId, reportId)).toBe(false);
  });

  it("다른 게스트는 남의 리포트로 주문을 만들 수 없다", async () => {
    const guestA = await createGuestSession();
    const guestB = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guestA.sessionId, caseA);

    await expect(
      createOrder(guestB.sessionId, SIGNATURE_PRODUCT_ID, reportId)
    ).rejects.toBeInstanceOf(CommerceError);
  });

  it("다른 게스트의 결과 목록에는 내 결과가 보이지 않는다", async () => {
    const { guest: buyer } = await purchasedReport(caseA);
    const stranger = await createGuestSession();

    expect(await listMyResults(buyer.sessionId)).toHaveLength(1);
    expect(await listMyResults(stranger.sessionId)).toHaveLength(0);
  });

  // ── 가격 조작 차단 ─────────────────────────────────────
  it("서버 상품 가격은 12,900원 고정이며 클라이언트 금액을 신뢰하지 않는다", async () => {
    expect(getProductPrice(SIGNATURE_PRODUCT_ID)).toBe(12900);
    expect(PRODUCTS[SIGNATURE_PRODUCT_ID].currency).toBe("KRW");

    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);
    // 클라이언트가 100원을 보내도 주문 금액은 서버 카탈로그 기준
    const order = await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);
    expect(order.amount).toBe(12900);

    for (const wrong of [100, 0, 12899, 129000]) {
      await expect(
        confirmPayment(guest.sessionId, { orderId: order.orderId, amount: wrong })
      ).rejects.toBeInstanceOf(CommerceError);
    }
    expect(await hasReportAccess(guest.sessionId, reportId)).toBe(false);
  });

  // ── 중복 승인 / Idempotency ────────────────────────────
  it("동일 주문을 3번 승인해도 소유권은 1개만 생성된다", async () => {
    const guest = await createGuestSession();
    const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);
    const order = await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);

    const first = await confirmPayment(guest.sessionId, {
      orderId: order.orderId,
      amount: 12900,
    });
    expect(first.alreadyPaid).toBe(false);

    for (let i = 0; i < 2; i += 1) {
      const again = await confirmPayment(guest.sessionId, {
        orderId: order.orderId,
        amount: 12900,
      });
      expect(again.alreadyPaid).toBe(true);
      expect(again.reportId).toBe(reportId);
    }

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("report_ownerships")
      .select("id")
      .eq("report_id", reportId);
    expect(data).toHaveLength(1);
    expect(await listMyResults(guest.sessionId)).toHaveLength(1);
  });

  it("이미 결제한 리포트로는 새 주문을 만들 수 없다", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    await expect(
      createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId)
    ).rejects.toBeInstanceOf(CommerceError);
  });

  // ── Snapshot 불변 ──────────────────────────────────────
  it("구매한 리포트는 저장된 snapshot 그대로 다시 열린다", async () => {
    const { guest, reportId } = await purchasedReport(caseB);

    const first = await getUnlockedReport(guest.sessionId, reportId);
    const second = await getUnlockedReport(guest.sessionId, reportId);
    expect(first).not.toBeNull();
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));

    // 저장된 payload 와 고객이 보는 결과가 동일해야 한다.
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("reports")
      .select("report_payload_json, report_version")
      .eq("id", reportId)
      .maybeSingle();
    expect(JSON.stringify(data?.report_payload_json)).toBe(JSON.stringify(first));
    expect(data?.report_version).toBe("signature-v1");
  });

  it("관계(외할머니)와 고민이 저장된 snapshot 에 그대로 반영된다", async () => {
    const { guest, reportId } = await purchasedReport(caseB);
    const report = await getUnlockedReport(guest.sessionId, reportId);

    expect(report?.meta.childName).toBe("열무");
    expect(report?.meta.caregiverRoleLabel).toBe("외할머니");
    expect(report?.meta.concernLabel).toContain("식습관");
    // 관계 일반화 회귀: 다른 호칭이 섞이지 않는다
    expect(JSON.stringify(report)).not.toContain("엄마");
    expect(JSON.stringify(report)).not.toContain("아빠");
  });

  // ── 주문번호 / 상태 ────────────────────────────────────
  it("주문번호는 ORD-YYYYMMDD-RANDOM 형식이며 매번 다르다", async () => {
    const guest = await createGuestSession();
    const ids = new Set<string>();
    for (let i = 0; i < 3; i += 1) {
      const { reportId } = await prepareSignatureReport(guest.sessionId, caseA);
      const order = await createOrder(guest.sessionId, SIGNATURE_PRODUCT_ID, reportId);
      expect(order.orderId).toMatch(/^ORD-\d{8}-[0-9A-F]{8}$/);
      ids.add(order.orderId);
    }
    expect(ids.size).toBe(3);
  });

  it("결제 성공 시 주문 상태가 PAID 로 바뀌고 승인 시각이 기록된다", async () => {
    const { guest, order } = await purchasedReport(caseA);
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("orders")
      .select("status, approved_at, amount, owner_session_id")
      .eq("order_id", order.orderId)
      .maybeSingle();

    expect(data?.status).toBe("PAID");
    expect(data?.approved_at).toBeTruthy();
    expect(data?.amount).toBe(12900);
    expect(data?.owner_session_id).toBe(guest.sessionId);
  });

  // ── 개인정보 최소 저장 (§9) ────────────────────────────
  it("저장된 리포트 payload 에 결제 키나 접근 토큰이 섞이지 않는다", async () => {
    const { guest, reportId } = await purchasedReport(caseA);
    const report = await getUnlockedReport(guest.sessionId, reportId);
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain("paymentKey");
    expect(serialized).not.toContain("payment_key");
    expect(serialized).not.toContain(guest.accessToken);
    expect(serialized).not.toContain("ORD-");
  });
});
