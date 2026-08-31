// P1.1 §14: 일반 Chromium(Playwright)에서 hydration/runtime 오류가 0인지 확인.
// Cursor 브라우저의 data-cursor-ref 주입 없이 검증한다.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ROUTES = ["/", "/free/child", "/free/questions", "/free/result", "/concern", "/products", "/safety"];

const errors = [];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });

// 결과/설문 라우트가 리다이렉트되지 않도록 세션 시드
await context.addInitScript(() => {
  localStorage.setItem(
    "uyk_session_v1",
    JSON.stringify({
      child: { name: "하윤", birthDate: "2021-04-10", gender: "girl", birthTimeKnown: false },
      answers: {
        new_environment: 3, failure: 3, self_assertion: 4, transition: 1,
        social_approach: 3, play_immersion: 3, praise: 3, rule_response: 2,
        emotional_expression: 4, parent_instruction: 4,
      },
      concern: "gojib", concernNote: "",
    }),
  );
});

for (const route of ROUTES) {
  const page = await context.newPage();
  page.on("console", (msg) => {
    const t = msg.text();
    if (msg.type() === "error" || /hydrat/i.test(t)) {
      errors.push({ route, kind: "console." + msg.type(), text: t });
    }
  });
  page.on("pageerror", (err) => {
    errors.push({ route, kind: "pageerror", text: String(err) });
  });
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.close();
}

await browser.close();

if (errors.length === 0) {
  console.log("HYDRATION_CHECK: PASS — 0 errors across " + ROUTES.length + " routes");
} else {
  console.log("HYDRATION_CHECK: FAIL — " + errors.length + " error(s)");
  for (const e of errors) console.log(`  [${e.route}] ${e.kind}: ${e.text.slice(0, 300)}`);
}
