// P2.4 — report_payload_json 불변성 DB 트리거를 실제 Supabase에서 직접 검증.
//
// 무엇을 검증하는가:
//   - LOCKED 상태 report는 payload 수정이 허용됨(결제 전 정상 동작)
//   - status를 UNLOCKED로 바꾼 뒤에는 report_payload_json / report_version 수정 시도가
//     DB 트리거(prevent_paid_report_payload_change, errcode P2401)에 의해 거부되는지
//
// 성격: 이 스크립트가 직접 만든 guest_session 1개 + 그 하위 child/caregiver/assessment/report
//   만 사용한다. 다른 어떤 기존 row도 건드리지 않는다. 종료 시 자신이 만든 데이터를 삭제한다
//   (PAID row는 safeDeleteGuestSessionCascade 안전장치로 삭제 대상이 될 수 없음 — 이 스크립트가
//    만드는 테스트 report는 실제 결제를 거치지 않으므로 애초에 PAID가 될 수 없다).
//
// 필요 env:
//   ALLOW_P24_TEST_MUTATION=true — 없으면 즉시 종료
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (process.env에 없으면 .env.local에서 보충 로드)

import { requireMutationGuard, requireEnv, safeDeleteGuestSessionCascade, loadDotEnvLocalIfMissing } from "./lib/p24-guard.mjs";

requireMutationGuard("scripts/p24-snapshot-trigger-verify.mjs");
await loadDotEnvLocalIfMissing(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

async function restCall(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function run() {
  console.log("=== Snapshot Immutability Trigger Verify (real DB) ===");

  const guest = await restCall("/guest_sessions", {
    method: "POST",
    body: JSON.stringify({ access_token_hash: "test_trigger_verify_hash_" + Date.now() }),
  });
  const guestId = guest.body?.[0]?.id;
  console.log("test guest created:", guestId, "status:", guest.status);

  const child = await restCall("/child_profiles", {
    method: "POST",
    body: JSON.stringify({ owner_session_id: guestId, gender: "girl", birth_date: "2022-01-01", birth_time_unknown: true }),
  });
  const childId = child.body?.[0]?.id;

  const cg = await restCall("/caregiver_profiles", {
    method: "POST",
    body: JSON.stringify({ owner_session_id: guestId, child_profile_id: childId, role: "mother", role_label: "엄마", birth_date: "1990-01-01", birth_time_unknown: true }),
  });
  const cgId = cg.body?.[0]?.id;

  const assessment = await restCall("/assessment_inputs", {
    method: "POST",
    body: JSON.stringify({ owner_session_id: guestId, child_profile_id: childId, caregiver_profile_id: cgId, concern_id: "discipline" }),
  });
  const assessmentId = assessment.body?.[0]?.id;

  const report = await restCall("/reports", {
    method: "POST",
    body: JSON.stringify({
      owner_session_id: guestId,
      child_profile_id: childId,
      caregiver_profile_id: cgId,
      assessment_input_id: assessmentId,
      product_id: "signature_relationship",
      report_payload_json: { original: true, marker: "ORIGINAL_PAYLOAD" },
      status: "LOCKED",
    }),
  });
  const reportId = report.body?.[0]?.id;
  console.log("test report created:", reportId, "status:", report.status);

  if (!reportId) {
    console.error("FATAL: could not create test report, aborting", report.body);
    process.exit(1);
  }

  try {
    const updateWhileLocked = await restCall(`/reports?id=eq.${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ report_payload_json: { original: true, marker: "UPDATED_WHILE_LOCKED" } }),
    });
    console.log("UPDATE_WHILE_LOCKED status:", updateWhileLocked.status);
    const lockedUpdateAllowed = updateWhileLocked.status >= 200 && updateWhileLocked.status < 300;

    const unlock = await restCall(`/reports?id=eq.${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "UNLOCKED" }),
    });
    console.log("UNLOCK status:", unlock.status);

    const updateAfterUnlock = await restCall(`/reports?id=eq.${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ report_payload_json: { hacked: true, marker: "SHOULD_BE_REJECTED" } }),
    });
    console.log("UPDATE_AFTER_UNLOCK status:", updateAfterUnlock.status, "code:", updateAfterUnlock.body?.code);
    const rejectedAsExpected = updateAfterUnlock.status >= 400;

    const reread = await restCall(`/reports?id=eq.${reportId}&select=report_payload_json,status`);
    const finalPayload = reread.body?.[0]?.report_payload_json;
    const payloadUnchanged = finalPayload?.marker === "UPDATED_WHILE_LOCKED";

    const versionUpdate = await restCall(`/reports?id=eq.${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ report_version: "tampered-v2" }),
    });
    console.log("VERSION_UPDATE_AFTER_UNLOCK status:", versionUpdate.status, "code:", versionUpdate.body?.code);
    const versionRejected = versionUpdate.status >= 400;

    console.log("\n=== RESULT ===");
    console.log("LOCKED 상태 payload 수정 허용(정상):", lockedUpdateAllowed);
    console.log("UNLOCKED 상태 payload 수정 거부(트리거 동작):", rejectedAsExpected);
    console.log("UNLOCKED 상태 payload 실제 불변 확인:", payloadUnchanged);
    console.log("UNLOCKED 상태 report_version 수정도 거부:", versionRejected);

    const allPass = lockedUpdateAllowed && rejectedAsExpected && payloadUnchanged && versionRejected;
    console.log("TRIGGER_VERIFY_ALL_PASS:", allPass);
    if (!allPass) process.exitCode = 1;
  } finally {
    console.log("\n=== CLEANUP ===");
    const result = await safeDeleteGuestSessionCascade(SUPABASE_URL, SERVICE_KEY, guestId);
    console.log("cleanup(guest cascade):", JSON.stringify(result));
  }
}

run().catch((e) => {
  console.error("TRIGGER_VERIFY_ERROR:", e);
  process.exit(1);
});
