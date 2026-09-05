// P2.4 REAL SERVER API VERIFICATION (no browser needed)
//
// 무엇을 검증하는가:
//   - 인증 헤더 없음/틀림 차단, Guest A/B 격리, 미결제 접근 차단
//   - 서버가 클라이언트 가격 위조를 무시하고 상품 카탈로그 가격을 강제하는지
//   - 실제 Toss TEST API가 가짜 paymentKey/금액 불일치를 거부하는지(mock 아님)
//   - My Results 빈 목록(미결제)
//
// 성격: DB에 실제로 쓰기(guest_session/report/order 생성)를 수행한다 — READ-ONLY 아님.
// 종료 시 자신이 만든 guest_session들을 cascade 정리한다(PAID row는 안전장치로 삭제 안 함).
//
// 필요 env:
//   BASE_URL (기본 http://localhost:3002) — 검증 대상 dev 서버
//   ALLOW_P24_TEST_MUTATION=true — 없으면 즉시 종료
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — 종료 시 self-cleanup에 사용(없으면 cleanup 생략, 경고만)
//
// 선택 env:
//   P24_EXISTING_PAID_REPORT_IDS="uuid1,uuid2" — 이미 존재하는 PAID report에 대한
//     교차 접근 차단(cross-guest access denial) 테스트를 추가로 돌리고 싶을 때만 지정.
//     지정하지 않으면 이 서브테스트는 건너뛴다(하드코딩된 실제 ID를 소스에 남기지 않기 위함).

import { requireMutationGuard, safeDeleteGuestSessionCascade, loadDotEnvLocalIfMissing } from "./lib/p24-guard.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3000";

requireMutationGuard("scripts/p24-api-verify.mjs");
await loadDotEnvLocalIfMissing(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? " - " + detail : ""}`);
}

async function api(path, opts = {}, guest) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (guest) {
    headers["x-guest-session-id"] = guest.sessionId;
    headers["x-guest-access-token"] = guest.accessToken;
  }
  const res = await fetch(BASE + path, { ...opts, headers });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function createGuest() {
  const res = await fetch(BASE + "/api/guest/session", { method: "POST" });
  return res.json();
}

// 이 프로젝트의 기존 테스트/fixture 전반에서 이미 쓰이는 CASE A 시나리오 데이터
// (실제 고객 데이터 아님 — src/lib/interaction/fixtures.ts 등과 동일한 합성 시나리오).
const sampleInput = {
  child: { name: "정수지", birthDate: "2022-06-11", birthTimeKnown: false, gender: "girl" },
  answers: { new_environment: 2, transition: 2, self_assertion: 2 },
  caregiverProfile: { role: "mother", roleLabel: "엄마", birthDate: "1992-03-08", birthTimeKnown: false },
  momAnswers: { time_pressure_style: "opt_time_control", instruction_resistance_style: "opt_inst_firm" },
  conflictInput: {
    concernId: "discipline",
    scenarioId: "sc_discipline_instruction",
    childFirstReaction: "장난감 정리를 하라고 하면 하던 놀이를 계속 이어가려 함",
    momFirstReaction: "'이제 그만하고 정리하자'라고 말하며 재촉함",
    subsequentEscalation: "아이가 대답만 하고 자리에서 움직이지 않아 실랑이가 길어짐",
    recentFrequency: "daily",
    momTypicalPhrase: "이제 그만하고 정리하자",
  },
  concern: "discipline",
};

async function run() {
  console.log("=== P2.4 API VERIFY START ===");
  console.log("BASE:", BASE);

  const guestA = await createGuest();
  const guestB = await createGuest();
  record("Guest A/B 세션 생성", Boolean(guestA.sessionId && guestB.sessionId), `A=${guestA.sessionId?.slice(0, 8)} B=${guestB.sessionId?.slice(0, 8)}`);

  const noAuth = await fetch(BASE + "/api/my-results");
  record("인증 헤더 없는 요청 차단", noAuth.status === 401, `status=${noAuth.status}`);

  const badToken = await api("/api/my-results", {}, { sessionId: guestA.sessionId, accessToken: "wrong-token-xxx" });
  record("잘못된 accessToken 차단", badToken.status === 401, `status=${badToken.status}`);

  const prepared = await api("/api/commerce/signature/prepare", { method: "POST", body: JSON.stringify(sampleInput) }, guestA);
  record("Report 준비(prepare) 성공", prepared.status === 200 && Boolean(prepared.body?.reportId), JSON.stringify(prepared.body).slice(0, 100));
  const reportId = prepared.body?.reportId;

  const accessBeforePay = await api(`/api/reports/${reportId}/access`, {}, guestA);
  record("미결제 상태 access=false (본인)", accessBeforePay.body?.allowed === false, JSON.stringify(accessBeforePay.body));

  const reportBeforePay = await api(`/api/reports/${reportId}`, {}, guestA);
  record("미결제 상태 report 본문 403", reportBeforePay.status === 403, `status=${reportBeforePay.status}`);

  const bAccessUnpaid = await api(`/api/reports/${reportId}/access`, {}, guestB);
  record("다른 Guest(B) → A의 미결제 report 차단", bAccessUnpaid.body?.allowed === false, JSON.stringify(bAccessUnpaid.body));

  const orderTamper = await api("/api/orders", {
    method: "POST",
    body: JSON.stringify({ reportId, price: 100, amount: 1, unitPrice: 999999 }),
  }, guestA);
  record("가격 위조 필드 무시 & 서버가격 12900 강제", orderTamper.body?.amount === 12900, JSON.stringify(orderTamper.body));
  const orderId = orderTamper.body?.orderId;

  const mismatchConfirm = await api("/api/payments/toss/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, amount: 100, paymentKey: "fake_key_xxx" }),
  }, guestA);
  record("금액 위조 confirm 거부(AMOUNT_MISMATCH)", mismatchConfirm.body?.error === "AMOUNT_MISMATCH", JSON.stringify(mismatchConfirm.body));

  const fakeKeyConfirm = await api("/api/payments/toss/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, amount: 12900, paymentKey: "fake_key_that_does_not_exist_in_toss" }),
  }, guestA);
  record("가짜 paymentKey → 실제 Toss API 거부(TOSS_CONFIRM_FAILED)", fakeKeyConfirm.body?.error === "TOSS_CONFIRM_FAILED", JSON.stringify(fakeKeyConfirm.body));

  const missingKeyConfirm = await api("/api/payments/toss/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, amount: 12900 }),
  }, guestA);
  record("paymentKey 누락 거부(PAYMENT_KEY_REQUIRED)", missingKeyConfirm.body?.error === "PAYMENT_KEY_REQUIRED", JSON.stringify(missingKeyConfirm.body));

  const bConfirmATry = await api("/api/payments/toss/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, amount: 12900, paymentKey: "whatever" }),
  }, guestB);
  record("다른 Guest(B) → A의 orderId confirm 차단", bConfirmATry.body?.error === "ORDER_NOT_FOUND", JSON.stringify(bConfirmATry.body));

  // 선택: 이미 존재하는 PAID report에 대한 교차 접근 차단 (하드코딩 대신 env로만 받음)
  const existingPaidIds = (process.env.P24_EXISTING_PAID_REPORT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (existingPaidIds.length === 0) {
    console.log("[SKIP] 기존 PAID report 교차 접근 테스트 — P24_EXISTING_PAID_REPORT_IDS 미지정");
  }
  for (const rid of existingPaidIds) {
    const crossAccess = await api(`/api/reports/${rid}/access`, {}, guestA);
    record(`새 Guest → 지정된 PAID report(${rid.slice(0, 8)}) 접근 차단`, crossAccess.body?.allowed === false, JSON.stringify(crossAccess.body));
    const crossReport = await api(`/api/reports/${rid}`, {}, guestA);
    record(`새 Guest → 지정된 PAID report(${rid.slice(0, 8)}) 본문 403`, crossReport.status === 403, `status=${crossReport.status}`);
  }

  const myResultsA = await api("/api/my-results", {}, guestA);
  record("미결제 Guest My Results 비어있음", Array.isArray(myResultsA.body?.results) && myResultsA.body.results.length === 0, JSON.stringify(myResultsA.body));

  console.log("=== SUMMARY ===");
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${total} PASS`);
  if (passed !== total) {
    console.log("FAILED CASES:", results.filter((r) => !r.pass).map((r) => r.name));
    process.exitCode = 1;
  }

  // self-cleanup: 이 스크립트가 만든 guest_session 만 정리(PAID 보유 시 자동 스킵)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("=== CLEANUP ===");
    for (const g of [guestA, guestB]) {
      if (!g?.sessionId) continue;
      const r = await safeDeleteGuestSessionCascade(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, g.sessionId);
      console.log(`cleanup ${g.sessionId.slice(0, 8)}:`, JSON.stringify(r));
    }
  } else {
    console.log("[WARN] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 없어 self-cleanup 생략됨. 수동 확인 필요할 수 있음.");
  }
}

run().catch((e) => {
  console.error("API_VERIFY_ERROR:", e);
  process.exit(1);
});
