// P2.2V.8 — REAL SESSION E2E (하람 × 아빠 × 수면)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("dev-artifacts/screenshots/p228");
const STORAGE_KEY = "uyk_session_v1";

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

async function answerFreeQuestions(page) {
  await page.waitForURL("**/free/questions", { timeout: 15000 });
  for (let i = 0; i < 10; i++) {
    await page.locator("main .flex.flex-col.gap-3 button").first().click();
    await page.waitForTimeout(400);
  }
  await page.waitForURL("**/free/result", { timeout: 20000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  watch(page, "p228");

  // Clear session
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

  // 1. Landing
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await shot(page, "01-landing.png");

  // 2. Child info — 하람, 36개월 여아 (2023-03)
  await page.getByRole("link", { name: "무료로 우리 아이 기질 보기" }).first().click();
  await page.waitForURL("**/free/child");
  await page.getByPlaceholder("예: 하윤, 콩이").fill("하람");
  await page.locator("#birth_year").selectOption("2023");
  await page.locator("#birth_month").selectOption("3");
  await page.locator("#birth_day").selectOption("15");
  await page.getByRole("button", { name: "여아" }).click();
  await page.getByRole("button", { name: "질문 보러 가기" }).click();

  // 3. Free 10 questions
  await answerFreeQuestions(page);
  await shot(page, "02-free-result.png");

  // 4. Concern — 잠
  await page.getByRole("link", { name: /요즘 가장 힘든 장면 골라보기/ }).click();
  await page.waitForURL("**/concern");
  await page.getByRole("button", { name: "잠" }).click();
  await page.getByRole("button", { name: "우리 아이 이야기 보기" }).click();
  await page.waitForURL("**/products");
  await shot(page, "03-products.png");

  // 5. Products → Setup
  await page.getByRole("link", { name: "우리 둘 이야기 보기" }).click();
  await page.waitForURL("**/paid/signature/setup");

  // 6. Relationship — 아빠
  await page.getByRole("button", { name: "아빠" }).click();
  await page.getByRole("button", { name: /다음:.*기본 정보/ }).click();
  await shot(page, "04-relationship.png");

  // 7. Caregiver profile
  await page.locator("select").nth(0).selectOption("1990");
  await page.locator("select").nth(1).selectOption("5");
  await page.locator("select").nth(2).selectOption("20");
  await page.getByRole("button", { name: /다음: 내 반응 5문항 체크/ }).click();

  // 8. Mom mini check 5 — pace + firm for sleep rule A
  const momOpts = [
    "시간을 맞추려 말이 빨라지거나",
    "왜 안 되는지 이유를 차근차근",
    "규칙과 해야 할 일임을 분명하게",
    "아쉽지만 다음 순서나 대안을",
    "감정이 가라앉은 뒤 안아주거나",
  ];
  for (const label of momOpts) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(400);
  }

  // 9. Sleep micro check 4
  const sleepOpts = [
    "하던 활동을 조금 더 마무리",
    "익숙한 순서를 찾으려",
    "곁에 더 있어달라고",
    "다른 놀이/행동을 이어가려",
  ];
  for (const label of sleepOpts) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(400);
  }
  await shot(page, "05-sleep-micro-check-done.png");

  // 10. Conflict input — sleep defaults may already be filled; reinforce custom scene
  await page.getByPlaceholder(/그림책 읽기를 계속/).fill(
    "잠자리에 갈 시간이 되어도 하던 그림책 읽기를 계속 이어가려 함"
  );
  await page.getByPlaceholder(/자야 할 시간이야/).first().fill(
    "'이제 자야 할 시간이야, 빨리 누워' 하고 재촉함"
  );
  await page.getByPlaceholder(/내가 자주 하는 말/).fill("이제 자야 할 시간이야, 빨리 누워");
  await page.getByPlaceholder(/침대에서 딴청/).fill(
    "아이가 침대에서 딴청을 피우며 잠들기를 미룸"
  );
  await page.getByRole("button", { name: "확인하고 리포트 생성하기" }).click();
  await page.getByRole("button", { name: "관계 사용설명서 만들기" }).waitFor({ timeout: 10000 });
  await shot(page, "06-summary.png");

  // 11. Summary → Checkout → Mock Purchase → Report
  await page.getByRole("button", { name: "관계 사용설명서 만들기" }).click();
  await page.waitForURL("**/checkout/signature", { timeout: 15000 });
  await page.getByRole("button", { name: /12,900원 결제 후 결과 보기/ }).click();
  await page.waitForURL("**/checkout/signature/success", { timeout: 15000 });
  await page.getByRole("link", { name: "내 관계 사용설명서 보기" }).click();
  await page.waitForURL("**/paid/signature");
  await page.waitForTimeout(1000);
  await shot(page, "07-summary-nav.png");

  // 12. Report sections
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "08-report-cover.png");

  const sections = [
    ["#section-two-person", "09-two-person.png"],
    ["#section-conflict-chain", "10-conflict-chain.png"],
    ["#section-phrases", "11-phrases.png"],
    ["#section-actions", "12-actions.png"],
    ["#section-fortune-relationship", "13-fortune.png"],
    ["#section-anchor", "14-anchor.png"],
  ];
  for (const [sel, file] of sections) {
    const el = await page.$(sel);
    if (el) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await el.screenshot({ path: path.join(OUT, file) });
    }
  }

  // Data integrity checks (customer-visible main only, exclude dev toolbar)
  const bodyText = await page.locator("main").innerText();
  const checks = {
    childName: bodyText.includes("하람"),
    fatherRole: bodyText.includes("아빠"),
    noMotherLeak: !/\b엄마\b/.test(bodyText.replace(/엄마 × 아이/g, "")),
    sleepConcern: bodyText.includes("잠") || bodyText.includes("수면"),
    conflictInput: bodyText.includes("그림책") || bodyText.includes("잠자리"),
    noMealTemplate: !bodyText.includes("식탁") && !bodyText.includes("반찬"),
    noEnglish:
      !bodyText.includes("Conflict Chain") &&
      !bodyText.includes("Signature Report") &&
      !bodyText.includes("OUR RELATIONSHIP ANCHOR") &&
      !bodyText.includes("Collaboration Flow"),
  };

  await browser.close();

  console.log("P2.2V.8 REAL SESSION E2E — DATA CHECKS:");
  console.log(JSON.stringify(checks, null, 2));
  console.log("Screenshots:", OUT);

  if (errors.length) {
    console.log("RUNTIME ERRORS:", errors.length);
    errors.forEach((e) => console.log(" ", e));
  }

  const allPass = Object.values(checks).every(Boolean) && errors.length === 0;
  if (!allPass) process.exit(1);
  console.log("REAL SESSION E2E: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
