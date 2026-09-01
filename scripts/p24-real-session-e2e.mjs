// P2.4 — REAL SESSION E2E (server commerce + mock confirm)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("public/screenshots/p24");
const SESSION_KEY = "uyk_session_v1";
const GUEST_KEY = "uyk_guest_v1";
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
    [SESSION_KEY, GUEST_KEY, PURCHASE_KEY, "uyk_commerce_draft_v1"]
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

async function completeSetup(page, { caregiverRole, momOpts, microOpts }) {
  await page.getByRole("button", { name: caregiverRole }).click();
  await page.getByRole("button", { name: /다음:.*기본 정보/ }).click();
  await page.locator("select").nth(0).selectOption("1990");
  await page.locator("select").nth(1).selectOption("5");
  await page.locator("select").nth(2).selectOption("20");
  await page.getByRole("button", { name: /다음: 내 반응 5문항 체크/ }).click();
  for (const label of momOpts) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(350);
  }
  for (const label of microOpts) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(350);
  }
  await page.getByRole("button", { name: "확인하고 리포트 생성하기" }).click();
  await page.getByRole("button", { name: "관계 사용설명서 만들기" }).click();
  await page.waitForURL("**/checkout/signature", { timeout: 20000 });
}

async function runCase(page, config) {
  await clearStorage(page);
  await page.getByRole("link", { name: "무료로 우리 아이 기질 보기" }).first().click();
  await page.waitForURL("**/free/child");
  await page.getByPlaceholder("예: 하윤, 콩이").fill(config.childName);
  await page.locator("#birth_year").selectOption(config.year);
  await page.locator("#birth_month").selectOption(config.month);
  await page.locator("#birth_day").selectOption(config.day);
  await page.getByRole("button", { name: config.gender }).click();
  await page.getByRole("button", { name: "질문 보러 가기" }).click();
  await answerFreeQuestions(page);
  await page.getByRole("link", { name: /요즘 가장 힘든 장면 골라보기/ }).click();
  await page.waitForURL("**/concern");
  await page.getByRole("button", { name: config.concernBtn }).click();
  await page.getByRole("button", { name: "우리 아이 이야기 보기" }).click();
  await page.waitForURL("**/products");
  await page.getByRole("link", { name: "우리 둘 이야기 보기" }).click();
  await page.waitForURL("**/paid/signature/setup");
  await completeSetup(page, config.setup);
  await shot(page, `${config.tag}-checkout.png`);
  await page.getByRole("button", { name: /12,900원 결제하기/ }).click();
  await page.waitForURL("**/payment/success**", { timeout: 30000 });
  await shot(page, `${config.tag}-success.png`);
  await page.getByRole("link", { name: "내 관계 사용설명서 보기" }).click();
  await page.waitForURL("**/paid/signature**", { timeout: 20000 });
  await page.waitForTimeout(800);
  const mainText = await page.locator("main").innerText();
  const checks = { ...config.checks(mainText) };

  const reportUrl = page.url();
  await page.evaluate(() => localStorage.removeItem("uyk_purchase_v1"));
  await page.goto(reportUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#section-cover", { timeout: 20000 });
  checks.afterMockPurchaseDelete = (await page.locator("main").innerText()).includes(
    config.childName
  );

  await page.goto(BASE + "/my-results", { waitUntil: "networkidle" });
  checks.myResults = (await page.locator("main").innerText()).includes(config.childName);
  await page.getByRole("link", { name: "다시 보기" }).click();
  await page.waitForURL("**/paid/signature**");
  await page.waitForSelector("#section-cover", { timeout: 20000 });
  checks.reopen = (await page.locator("main").innerText()).includes(config.childName);

  console.log(`P2.4 E2E ${config.tag}:`, JSON.stringify(checks, null, 2));
  if (!Object.values(checks).every(Boolean)) throw new Error(`${config.tag} failed`);
  return checks;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  watch(page, "p24");

  await runCase(page, {
    tag: "caseA",
    childName: "하람",
    year: "2023",
    month: "3",
    day: "15",
    gender: "여아",
    concernBtn: "잠",
    setup: {
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
    },
    checks: (t) => ({
      childName: t.includes("하람"),
      fatherRole: t.includes("아빠"),
      noFixture: !t.includes("Fixture"),
    }),
  });

  await runCase(page, {
    tag: "caseB",
    childName: "열무",
    year: "2022",
    month: "6",
    day: "10",
    gender: "남아",
    concernBtn: "밥",
    setup: {
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
    },
    checks: (t) => ({
      childName: t.includes("열무"),
      grandmotherRole: t.includes("외할머니"),
      noFixture: !t.includes("Fixture"),
    }),
  });

  await browser.close();
  if (errors.length) {
    console.log("RUNTIME ERRORS:", errors);
    process.exit(1);
  }
  console.log("P2.4 REAL SESSION E2E: PASS");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
