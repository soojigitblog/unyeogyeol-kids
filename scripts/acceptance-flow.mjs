// P1.1 Final Acceptance: 일반 Chromium 으로 전체 Free Flow 실행.
//  - console error / pageerror / hydration / navigation 실패 = 0 확인
//  - 실제 렌더 스크린샷 13종 생성 (Cursor browser 아님 → 지연/artifact 없음)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "acceptance-screenshots";
mkdirSync(OUT, { recursive: true });

const errors = [];
function watch(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text()))
      errors.push(`[${tag}] console.${m.type()}: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${String(e).slice(0, 200)}`));
  page.on("requestfailed", (r) => {
    // 이미지/폰트 등 리소스 실패도 기록 (favicon 제외)
    if (!/favicon/.test(r.url())) errors.push(`[${tag}] requestfailed: ${r.url()}`);
  });
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
watch(page, "flow");

// ── 01 Landing Hero (390) ─────────────────────────────
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await shot(page, "01-landing-hero");

// ── 02 Child Info (390) — 실제 입력 ───────────────────
await page.getByRole("link", { name: "무료로 우리 아이 기질 보기" }).first().click();
await page.waitForURL("**/free/child");
await page.getByPlaceholder("예: 하윤, 콩이").fill("하윤");
await page.locator("#birth_year").selectOption("2021");
await page.locator("#birth_month").selectOption("4");
await page.locator("#birth_day").selectOption("10");
await page.getByRole("button", { name: "여아" }).click();
await page.waitForTimeout(300);
await shot(page, "02-child-info");

// 질문으로 이동
await page.getByRole("button", { name: "질문 보러 가기" }).click();
await page.waitForURL("**/free/questions");
await page.waitForTimeout(400);

// ── 03/04/05 Questionnaire (첫/중간/마지막) ───────────
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(350);
  if (i === 0) await shot(page, "03-question-q1");
  if (i === 5) await shot(page, "04-question-middle");
  if (i === 9) await shot(page, "05-question-last");
  // main 안의 첫 선택지 클릭 (options 뒤에 '이전 질문' 존재)
  const opts = page.locator("main button");
  await opts.nth(i % 2 === 0 ? 0 : 1).click(); // 답을 섞어 다양화
}
await page.waitForURL("**/free/result", { timeout: 8000 });
await page.waitForTimeout(700);

// 공유하기 모달 열기 및 스크린샷
await page.getByRole("button", { name: /이 결과 공유하기/ }).click();
await page.waitForTimeout(400);
await shot(page, "06-share-modal");
await page.getByRole("button", { name: "닫기" }).click();
await page.waitForTimeout(300);

// ── 06/07/08 Free Result ─────────────────────────────
await page.evaluate(() => window.scrollTo(0, 0));
await shot(page, "06-free-result-top");
await page.getByText("엄마가 오해하기 쉬운 한 가지").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot(page, "07-free-result-misunderstanding");
await page.getByText("오늘 바꿔볼 한마디").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot(page, "08-free-result-phrase");

// ── 09 Concern (390) + 기타 UX ────────────────────────
await page.getByRole("link", { name: /우리 아이 이야기 이어가기/ }).click();
await page.waitForURL("**/concern");
await page.waitForTimeout(400);
await page.getByRole("button", { name: "고집" }).click();
await page.waitForTimeout(200);
await shot(page, "09-concern");
// 기타 입력 UX 확인
await page.getByRole("button", { name: "기타" }).click();
await page.waitForTimeout(200);
const etcVisible = await page
  .getByPlaceholder(/편하게 적어 주세요/)
  .isVisible()
  .catch(() => false);
console.log("ETC_TEXTAREA_VISIBLE:", etcVisible);

// ── 430px: hero + result ──────────────────────────────
await page.setViewportSize({ width: 430, height: 932 });
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await shot(page, "10-hero-430");
await page.goto(BASE + "/free/result", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await shot(page, "11-free-result-430");

// ── Desktop: landing + result (fullPage) ──────────────
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/12-landing-desktop.png`, fullPage: true });
await page.goto(BASE + "/free/result", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/13-free-result-desktop.png`, fullPage: true });

await browser.close();

console.log("SCREENSHOTS: 13 written to " + OUT);
if (errors.length === 0) console.log("RUNTIME_CHECK: PASS — 0 errors");
else {
  console.log("RUNTIME_CHECK: FAIL — " + errors.length);
  errors.forEach((e) => console.log("  " + e));
}
