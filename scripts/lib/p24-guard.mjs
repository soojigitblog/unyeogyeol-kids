// P2.4 검증 스크립트 공용 안전장치.
//
// 원칙:
//   - 이 파일은 secret 값을 절대 console.log 하지 않는다(존재 여부/길이만 로그 가능).
//   - 실제 Supabase에 쓰기(insert/update/delete)를 수행하는 스크립트는 반드시
//     requireMutationGuard() 를 먼저 통과해야 한다.
//   - PAID 상태 row는 어떤 정리(cleanup) 로직에서도 삭제 대상이 될 수 없다
//     (safeDeleteGuestSessionCascade 가 삭제 직전 항상 재확인한다).

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`FATAL: 환경변수 ${name} 가 설정되어 있지 않습니다. .env.local 을 로드했는지 확인하세요.`);
    console.error(`예: node --env-file=.env.local scripts/... 또는 dotenv-cli 사용`);
    process.exit(1);
  }
  return v;
}

/**
 * 실제 Supabase에 쓰기 작업을 하는 스크립트는 반드시 이 함수를 통과해야 한다.
 * ALLOW_P24_TEST_MUTATION=true 환경변수 또는 --yes CLI 플래그로 허용한다.
 * (--yes 는 package.json script에서 OS 무관하게 쓸 수 있도록 둔 대안이다 —
 *  Windows cmd/PowerShell은 유닉스식 `VAR=value command` 인라인 문법을 지원하지 않는다.)
 */
export function requireMutationGuard(scriptName) {
  const allowed = process.env.ALLOW_P24_TEST_MUTATION === "true" || process.argv.includes("--yes");
  if (!allowed) {
    console.error(`FATAL: ${scriptName} 은 실제 Supabase에 테스트 데이터를 쓰기(write)합니다.`);
    console.error(`의도적으로 실행하는 경우에만 아래 중 하나로 명시적으로 허용하세요:`);
    console.error(`  ALLOW_P24_TEST_MUTATION=true node ${scriptName}`);
    console.error(`  node ${scriptName} --yes`);
    console.error(`(기본값은 항상 거부입니다. 실수로 실제 데이터를 건드리는 것을 막기 위함입니다.)`);
    process.exit(1);
  }
}

/**
 * guest_session 을 cascade 삭제하기 전에, 이 guest 소유의 orders 중
 * status=PAID 가 하나라도 있으면 절대 삭제하지 않고 중단한다.
 * (PAID order / ownership / paid report 삭제 방지 하드 가드)
 */
export async function safeDeleteGuestSessionCascade(supabaseUrl, serviceKey, guestId) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const ordersRes = await fetch(
    `${supabaseUrl}/rest/v1/orders?owner_session_id=eq.${guestId}&select=status`,
    { headers }
  );
  const orders = await ordersRes.json().catch(() => []);
  const hasPaid = Array.isArray(orders) && orders.some((o) => o.status === "PAID");

  if (hasPaid) {
    console.error(`ABORT CLEANUP: guest ${guestId} 는 PAID order를 갖고 있어 삭제하지 않습니다.`);
    return { deleted: false, reason: "HAS_PAID_ORDER" };
  }

  const delRes = await fetch(`${supabaseUrl}/rest/v1/guest_sessions?id=eq.${guestId}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
  return { deleted: delRes.ok, status: delRes.status };
}

/** .env.local 을 process.env 에 없는 키만 보충 로드(있으면 그대로 둠, 값은 출력 안 함). */
export async function loadDotEnvLocalIfMissing(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length === 0) return;
  const fs = await import("node:fs");
  const path = await import("node:path");
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
