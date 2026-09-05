// P2.3 — REAL SESSION E2E (Case A: 하람×아빠×수면, Case B: 열무×외할머니×식습관)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("dev-artifacts/screenshots/p23");
const SESSION_KEY = "uyk_session_v1";
const PURCHASE_KEY = "uyk_purchase_v1";

fs.mkdirSync(OUT, { recursive: true });

const errors = [];
function watch(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text()))
      errors.push(`[${tag}] console.${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${String(e).slice(0, 300)}`));
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function clearStorage(page) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    (keys) => keys.forEach((k) => localStorage.removeItem(k)),
    [SESSION_KEY, PURCHASE_KEY]
  );
}

async function answerFreeQuestions(page) {
  await page.waitForURL("**/free/questions", { timeout: 15000 });
  for (let i = 0; i < 10; i++) {
    await page.locator("main .flex.flex-col.gap-3 button").first().click();
    await page.waitForTimeout(350);
  }
  await page.waitForURL("**/free/result", { timeout: 20000 });
}

async function fillCaregiverBirth(page, year = "1990", month = "5", day = "20") {
  await page.locator("select").nth(0).selectOption(year);
  await page.locator("select").nth(1).selectOption(month);
  await page.locator("select").nth(2).selectOption(day);
}

async function answerMomMiniCheck(page, opts) {
  for (const label of opts) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(350);
  }
}

async function answerMicroCheck(page, opts) {
  for (const label of opts) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(350);
  }
}

async function completeSetupToCheckout(page, {
  caregiverRole,
  momOpts,
  microOpts,
  conflict,
}) {
  await page.getByRole("button", { name: caregiverRole }).click();
  await page.getByRole("button", { name: /다음:.*기본 정보/ }).click();
  await fillCaregiverBirth(page);
  await page.getByRole("button", { name: /다음: 내 반응 5문항 체크/ }).click();
  await answerMomMiniCheck(page, momOpts);
  await answerMicroCheck(page, microOpts);

  if (conflict?.childFirst) {
    await page.getByPlaceholder(conflict.childFirst.placeholder).first().fill(conflict.childFirst.text);
  }
  if (conflict?.momFirst) {
    await page.getByPlaceholder(conflict.momFirst.placeholder).first().fill(conflict.momFirst.text);
  }
  if (conflict?.typicalPhrase) {
    await page.getByPlaceholder(conflict.typicalPhrase.placeholder).first().fill(conflict.typicalPhrase.text);
  }
  if (conflict?.escalation) {
    await page.getByPlaceholder(conflict.escalation.placeholder).first().fill(conflict.escalation.text);
  }

  await page.getByRole("button", { name: "확인하고 리포트 생성하기" }).click();
  await page.getByRole("button", { name: "관계 사용설명서 만들기" }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "관계 사용설명서 만들기" }).click();
  await page.waitForURL("**/checkout/signature", { timeout: 15000 });
}

async function mockPurchaseAndOpenReport(page, shotPrefix = "") {
  await page.getByRole("button", { name: /12,900원 결제 후 결과 보기/ }).click();
  await page.waitForURL("**/checkout/signature/success", { timeout: 15000 });
  if (shotPrefix) await shot(page, `${shotPrefix}-success.png`);
  await page.getByRole("link", { name: "내 관계 사용설명서 보기" }).click();
  await page.waitForURL("**/paid/signature", { timeout: 15000 });
  await page.waitForTimeout(800);
}

async function runCaseA(page) {
  const tag = "caseA";
  await clearStorage(page);

  await page.getByRole("link", { name: "무료로 우리 아이 기질 보기" }).first().click();
  await page.waitForURL("**/free/child");
  await page.getByPlaceholder("예: 하윤, 콩이").fill("하람");
  await page.locator("#birth_year").selectOption("2023");
  await page.locator("#birth_month").selectOption("3");
  await page.locator("#birth_day").selectOption("15");
  await page.getByRole("button", { name: "여아" }).click();
  await page.getByRole("button", { name: "질문 보러 가기" }).click();

  await answerFreeQuestions(page);
  await page.getByRole("link", { name: /요즘 가장 힘든 장면 골라보기/ }).click();
  await page.waitForURL("**/concern");
  await page.getByRole("button", { name: "잠" }).click();
  await page.getByRole("button", { name: "우리 아이 이야기 보기" }).click();
  await page.waitForURL("**/products");
  await shot(page, "caseA-01-products.png");
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  await shot(page, "caseA-01b-free-vs-paid-preview.png");

  await page.getByRole("link", { name: "우리 둘 이야기 보기" }).click();
  await page.waitForURL("**/paid/signature/setup");

  await completeSetupToCheckout(page, {
    caregiverRole: "아빠",
    momOpts: [
      "시간을 맞추려 말이 빨라지거나",
      "왜 안 되는지 이유를 차근차근",
      "규칙과 해야 할 일임을 분명하게",
      "아쉽지만 다음 순서나 대안을",
      "감정이 가라앉은 뒤 안아주거나",
    ],
    microOpts: [
      "하던 활동을 조금 더 마무리",
      "익숙한 순서를 찾으려",
      "곁에 더 있어달라고",
      "다른 놀이/행동을 이어가려",
    ],
    conflict: null,
  });
  await shot(page, "caseA-02-checkout.png");

  await mockPurchaseAndOpenReport(page, "caseA");
  await shot(page, "caseA-03-report-cover.png");

  for (const [sel, file] of [
    ["#section-two-person", "caseA-05-two-person.png"],
    ["#section-conflict-chain", "caseA-06-conflict-chain.png"],
    ["#section-share", "caseA-07-share-summary.png"],
  ]) {
    const el = await page.$(sel);
    if (el) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await el.screenshot({ path: path.join(OUT, file) });
    }
  }

  const mainText = await page.locator("main").innerText();
  const checks = {
    childName: mainText.includes("하람"),
    fatherRole: mainText.includes("아빠"),
    sleepConcern: mainText.includes("잠") || mainText.includes("수면"),
    noFixture: !mainText.includes("Fixture") && !mainText.includes("Family A"),
    noMealLeak: !mainText.includes("식탁") && !mainText.includes("반찬"),
    ownershipCover: mainText.includes("내 관계 사용설명서"),
  };

  await page.goto(BASE + "/my-results", { waitUntil: "networkidle" });
  await shot(page, "caseA-04-my-results.png");
  const myResultsText = await page.locator("main").innerText();
  checks.myResultsListed =
    myResultsText.includes("하람") && myResultsText.includes("아빠");
  checks.browserOnlyNotice = myResultsText.includes("이 브라우저에서 다시 볼 수 있어요");

  await page.getByRole("link", { name: "다시 보기" }).click();
  await page.waitForURL("**/paid/signature");
  checks.reopen = (await page.locator("main").innerText()).includes("하람");

  // Dedup: reload report should not duplicate my-results
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.goto(BASE + "/my-results", { waitUntil: "networkidle" });
  const cardCount = await page.locator("main a", { hasText: "다시 보기" }).count();
  checks.dedup = cardCount === 1;

  console.log(`P2.3 E2E ${tag}:`, JSON.stringify(checks, null, 2));
  if (!Object.values(checks).every(Boolean)) {
    throw new Error(`${tag} failed: ${JSON.stringify(checks)}`);
  }
  return checks;
}

async function runCaseB(page) {
  const tag = "caseB";
  await clearStorage(page);

  await page.getByRole("link", { name: "무료로 우리 아이 기질 보기" }).first().click();
  await page.waitForURL("**/free/child");
  await page.getByPlaceholder("예: 하윤, 콩이").fill("열무");
  await page.locator("#birth_year").selectOption("2022");
  await page.locator("#birth_month").selectOption("6");
  await page.locator("#birth_day").selectOption("10");
  await page.getByRole("button", { name: "남아" }).click();
  await page.getByRole("button", { name: "질문 보러 가기" }).click();

  await answerFreeQuestions(page);
  await page.getByRole("link", { name: /요즘 가장 힘든 장면 골라보기/ }).click();
  await page.waitForURL("**/concern");
  await page.getByRole("button", { name: "밥" }).click();
  await page.getByRole("button", { name: "우리 아이 이야기 보기" }).click();
  await page.waitForURL("**/products");

  await page.getByRole("link", { name: "우리 둘 이야기 보기" }).click();
  await page.waitForURL("**/paid/signature/setup");

  await completeSetupToCheckout(page, {
    caregiverRole: "외할머니",
    momOpts: [
      "시간을 맞추려 말이 빨라지거나",
      "왜 안 되는지 이유를 차근차근",
      "규칙과 해야 할 일임을 분명하게",
      "아쉽지만 다음 순서나 대안을",
      "감정이 가라앉은 뒤 안아주거나",
    ],
    microOpts: [
      "손대지 않고 밀어내거나",
      "익숙하지 않은 반찬은 남겨두고",
      "권유가 반복될수록 더 강하게",
      "자리를 뜨고 다른 곳으로",
    ],
    conflict: {
      childFirst: {
        placeholder: /새로운 반찬/,
        text: "새로운 반찬을 보자마자 입을 닫고 숟가락을 밀어냄",
      },
      momFirst: {
        placeholder: /한 입만/,
        text: "'한 입만 먹어보자' 하고 숟가락을 건넴",
      },
      typicalPhrase: {
        placeholder: /내가 자주 하는 말/,
        text: "한 입만 먹어보자",
      },
      escalation: {
        placeholder: /고개를 돌리거나/,
        text: "아이가 고개를 돌리며 식탁 분위기가 굳어짐",
      },
    },
  });
  await shot(page, "caseB-01-checkout.png");

  await mockPurchaseAndOpenReport(page);
  await shot(page, "caseB-02-report-cover.png");

  const mainText = await page.locator("main").innerText();
  const checks = {
    childName: mainText.includes("열무"),
    grandmotherRole: mainText.includes("외할머니"),
    mealConcern: mainText.includes("밥") || mainText.includes("식"),
    noFixture: !mainText.includes("Fixture"),
    noSleepLeak: !mainText.includes("그림책 읽기"),
    noMotherDefault: !/\b엄마\b/.test(mainText.replace(/엄마 × 아이/g, "")),
  };

  await page.goto(BASE + "/my-results", { waitUntil: "networkidle" });
  checks.myResults =
    (await page.locator("main").innerText()).includes("열무") &&
    (await page.locator("main").innerText()).includes("외할머니");

  console.log(`P2.3 E2E ${tag}:`, JSON.stringify(checks, null, 2));
  if (!Object.values(checks).every(Boolean)) {
    throw new Error(`${tag} failed: ${JSON.stringify(checks)}`);
  }
  return checks;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  watch(page, "p23");

  // Shared commerce screenshots on Case A path
  await runCaseA(page);

  // Shared commerce screenshots (Case A session still active)
  await page.goto(BASE + "/products", { waitUntil: "networkidle" });
  await shot(page, "shared-products.png");

  await runCaseB(page);

  await browser.close();

  console.log("Screenshots:", OUT);
  if (errors.length) {
    console.log("RUNTIME ERRORS:", errors.length);
    errors.forEach((e) => console.log(" ", e));
    process.exit(1);
  }
  console.log("P2.3 REAL SESSION E2E (2 cases): PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
