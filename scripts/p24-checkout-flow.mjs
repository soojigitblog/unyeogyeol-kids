// P2.4 — 무료 플로우 → 설정 → 체크아웃까지 브라우저로 진행하는 재사용 가능한 회귀 스크립트.
// (구 p24-prepare-checkout-caseA.mjs + p24-caseB-regression-check.mjs 통합)
//
// 두 가지 모드:
//   1) 기본(회귀 확인 전용): headless로 체크아웃까지 진행, 렌더링/가격/누수 여부만 확인하고
//      결제 버튼은 누르지 않는다. 끝나면 만든 테스트 데이터를 자체 정리한다.
//   2) PROCEED_TO_PAYMENT=true: headed(화면에 보이는) 브라우저로 열어 "결제하기"까지 클릭해
//      실제 Toss TEST 결제창을 띄운 뒤, 사람이 이어서 카드 인증을 완료하도록 창을 열어둔 채
//      대기한다(자동 종료 안 함, self-cleanup도 하지 않음 — 결제가 완료될 데이터이므로).
//
// 성격: 브라우저로 실제 앱 API를 호출하므로 report/order row가 실제로 생성된다 — READ-ONLY 아님.
//
// 필요 env:
//   ALLOW_P24_TEST_MUTATION=true — 없으면 즉시 종료
//   BASE_URL (기본 http://localhost:3002)
//
// 페르소나 env(전부 선택, 기본값은 CASE A):
//   CHILD_NAME, BIRTH_YEAR, BIRTH_MONTH, BIRTH_DAY, GENDER(girl|boy)
//   CONCERN_LABEL (예: "훈육", "잠", "밥")
//   CAREGIVER_ROLE (예: "엄마", "아빠", "외할머니")
//   PROCEED_TO_PAYMENT=true|false (기본 false)
//
// self-cleanup(모드 1에서만, SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 있을 때만):
//   이 스크립트가 만든 guest_session을 삭제(PAID 보유 시 자동 스킵).

import { chromium } from "playwright";
import { requireMutationGuard, safeDeleteGuestSessionCascade, loadDotEnvLocalIfMissing } from "./lib/p24-guard.mjs";

requireMutationGuard("scripts/p24-checkout-flow.mjs");
await loadDotEnvLocalIfMissing(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PROCEED_TO_PAYMENT = process.env.PROCEED_TO_PAYMENT === "true";

// 기본값 = CASE A(엄마 × 정수지 × 훈육) — 이 프로젝트의 기존 fixture/테스트와 동일한 합성 시나리오.
const PERSONA = {
  childName: process.env.CHILD_NAME || "정수지",
  birthYear: process.env.BIRTH_YEAR || "2022",
  birthMonth: process.env.BIRTH_MONTH || "6",
  birthDay: process.env.BIRTH_DAY || "11",
  gender: process.env.GENDER || "girl",
  concernLabel: process.env.CONCERN_LABEL || "훈육",
  caregiverRole: process.env.CAREGIVER_ROLE || "엄마",
  caregiverBirthYear: process.env.CAREGIVER_BIRTH_YEAR || "1992",
  caregiverBirthMonth: process.env.CAREGIVER_BIRTH_MONTH || "3",
  caregiverBirthDay: process.env.CAREGIVER_BIRTH_DAY || "8",
};

// concern별 micro-check(4문항)는 meal/sleep에만 존재한다(discipline 등은 없음).
const MICRO_CHECK_CONCERNS = {
  잠: ["하던 활동을 조금 더 마무리", "익숙한 순서를 찾으려", "곁에 더 있어달라고", "다른 놀이/행동을 이어가려"],
  밥: ["손대지 않고 밀어내거나", "익숙하지 않은 반찬은 남겨두고", "권유가 반복될수록 더 강하게", "자리를 뜨고 다른 곳으로"],
};
const MOM_OPTIONS = [
  "시간을 맞추려 말이 빨라지거나",
  "왜 안 되는지 이유를 차근차근",
  "규칙과 해야 할 일임을 분명하게",
  "아쉽지만 다음 순서나 대안을",
  "감정이 가라앉은 뒤 안아주거나",
];

async function driveToCheckout(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());

  await page.getByRole("link", { name: "무료로 우리 아이 기질 보기" }).first().click();
  await page.waitForURL("**/free/child");
  await page.getByPlaceholder("예: 하윤, 콩이").fill(PERSONA.childName);
  await page.locator("#birth_year").selectOption(PERSONA.birthYear);
  await page.locator("#birth_month").selectOption(PERSONA.birthMonth);
  await page.locator("#birth_day").selectOption(PERSONA.birthDay);
  await page.locator(`label[for="child-gender-${PERSONA.gender}"]`).click();
  await page.getByRole("button", { name: "질문 보러 가기" }).click();

  await page.waitForURL("**/free/questions", { timeout: 15000 });
  for (let i = 0; i < 10; i++) {
    await page.locator("main .flex.flex-col.gap-3 button").first().click();
    await page.waitForTimeout(300);
  }
  await page.waitForURL("**/free/result", { timeout: 20000 });

  await page.getByRole("link", { name: /요즘 가장 힘든 장면 골라보기/ }).click();
  await page.waitForURL("**/concern");
  await page.getByRole("button", { name: PERSONA.concernLabel }).click();
  await page.getByRole("button", { name: "우리 아이 이야기 보기" }).click();
  await page.waitForURL("**/products");
  await page.getByRole("link", { name: "우리 둘 이야기 보기" }).click();
  await page.waitForURL("**/paid/signature/setup");

  await page.getByRole("button", { name: PERSONA.caregiverRole }).click();
  await page.getByRole("button", { name: /다음:.*기본 정보/ }).click();
  await page.locator("select").nth(0).selectOption(PERSONA.caregiverBirthYear);
  await page.locator("select").nth(1).selectOption(PERSONA.caregiverBirthMonth);
  await page.locator("select").nth(2).selectOption(PERSONA.caregiverBirthDay);
  await page.getByRole("button", { name: /다음: 내 반응 5문항 체크/ }).click();
  for (const label of MOM_OPTIONS) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(300);
  }

  const microOpts = MICRO_CHECK_CONCERNS[PERSONA.concernLabel];
  if (microOpts) {
    for (const label of microOpts) {
      await page.getByRole("button", { name: new RegExp(label) }).click();
      await page.waitForTimeout(300);
    }
  }

  await page.getByRole("button", { name: "확인하고 리포트 생성하기" }).click();
  await page.getByRole("button", { name: "관계 사용설명서 만들기" }).click();
  await page.waitForURL("**/checkout/signature", { timeout: 20000 });
  await page.waitForTimeout(1500);

  return errors;
}

async function runRegressionOnly() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 1400 } });
  const page = await context.newPage();

  const errors = await driveToCheckout(page);

  const checkoutText = await page.locator("main").innerText();
  console.log(`CHECKOUT_HAS_CHILD_NAME(${PERSONA.childName}):`, checkoutText.includes(PERSONA.childName));
  console.log(`CHECKOUT_HAS_ROLE(${PERSONA.caregiverRole}):`, checkoutText.includes(PERSONA.caregiverRole));
  console.log("CHECKOUT_HAS_PRICE_12900:", checkoutText.includes("12,900"));
  console.log("PAGE_ERRORS:", JSON.stringify(errors.slice(0, 10)));

  const draft = await page.evaluate(() => localStorage.getItem("uyk_commerce_draft_v1"));
  console.log("DRAFT:", draft);
  let ownerSessionId = null;
  try {
    ownerSessionId = JSON.parse(await page.evaluate(() => localStorage.getItem("uyk_guest_v1")) || "{}")?.sessionId;
  } catch { /* ignore */ }

  console.log("REGRESSION_CHECK_DONE (결제 버튼 클릭 없음)");
  await browser.close();

  if (ownerSessionId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("=== CLEANUP ===");
    const result = await safeDeleteGuestSessionCascade(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, ownerSessionId);
    console.log("cleanup:", JSON.stringify(result));
  } else {
    console.log("[WARN] guest session 식별 실패 또는 service key 없음 — self-cleanup 생략. 필요시 수동 확인.");
  }
}

async function runProceedToPayment() {
  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  await driveToCheckout(page);
  console.log("READY: checkout 페이지 도달 ->", page.url());

  console.log("이제 '12,900원 결제하기' 버튼을 클릭해서 Toss 결제창을 엽니다...");
  await page.getByRole("button", { name: /12,900원 결제하기/ }).click();
  await page.waitForTimeout(3000);

  console.log("=== READY FOR HUMAN ===");
  console.log("Toss TEST 결제창이 열렸습니다. 브라우저 창에서 직접 결제수단을 선택하고 카드 인증을 완료해주세요.");
  console.log("이 창은 열어둔 채로 유지됩니다(자동 정리 없음 — 실제 결제 데이터이므로).");

  await new Promise(() => {}); // 브라우저를 계속 열어둔 채로 프로세스 유지
}

if (PROCEED_TO_PAYMENT) {
  runProceedToPayment().catch((e) => {
    console.error("CHECKOUT_FLOW_ERROR:", e);
    process.exit(1);
  });
} else {
  runRegressionOnly().catch((e) => {
    console.error("CHECKOUT_FLOW_ERROR:", e);
    process.exit(1);
  });
}
