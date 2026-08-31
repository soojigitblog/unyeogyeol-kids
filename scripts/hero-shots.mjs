import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "acceptance-screenshots";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const [w, h, tag] of [[390, 844, "390"], [430, 932, "430"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  // first viewport (스크롤 전)
  await page.screenshot({ path: `${OUT}/hero-${tag}-firstview.png` });
  // 전체 hero 영역 (phrase preview 포함)
  await page.screenshot({ path: `${OUT}/hero-${tag}-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log("HERO SHOTS DONE");
