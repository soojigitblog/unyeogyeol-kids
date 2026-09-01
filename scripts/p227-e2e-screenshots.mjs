// P2.2V.7 — 390px 역할별 리포트 스크린샷 (Playwright)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve("public/screenshots/p227");
fs.mkdirSync(outDir, { recursive: true });

async function hideChrome(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll(
        "header, nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay], [data-review-toolbar]"
      )
      .forEach((el) => el.remove());
  });
}

async function shotSection(page, selector, fileName) {
  const el = await page.$(selector);
  if (!el) {
    console.warn(`MISSING: ${selector} on ${page.url()}`);
    return false;
  }
  await el.screenshot({ path: path.join(outDir, fileName) });
  console.log(`OK: ${fileName}`);
  return true;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // 1. 관계 선택 (setup)
  await page.goto(`${BASE}/paid/signature/setup`, { waitUntil: "networkidle" });
  await hideChrome(page);
  await page.screenshot({ path: path.join(outDir, "390-setup-relationship.png"), fullPage: true });

  const fixtures = [
    {
      id: "B",
      label: "아빠",
      shots: [
        ["#section-cover", "390-B-father-cover.png"],
        ["#section-phrases .rounded-2xl:first-child", "390-B-before-after-phrase.png"],
      ],
    },
    {
      id: "C",
      label: "외할머니",
      shots: [["#section-two-person", "390-C-grandmother-two-person.png"]],
    },
    {
      id: "D",
      label: "이모",
      shots: [["#section-conflict-chain", "390-D-aunt-conflict-chain.png"]],
    },
    {
      id: "E",
      label: "큰이모",
      shots: [
        ["#section-conflict-chain .border-2", "390-E-custom-where-to-break.png"],
        ["#section-fortune-relationship", "390-E-fortune-relationship.png"],
        ["#section-anchor", "390-E-final-anchor.png"],
      ],
    },
  ];

  for (const fx of fixtures) {
    await page.goto(`${BASE}/paid/signature?family=${fx.id}`, { waitUntil: "networkidle" });
    await hideChrome(page);
    for (const [selector, fileName] of fx.shots) {
      await shotSection(page, selector, fileName);
    }
  }

  // Before/After (Family B phrases section)
  await page.goto(`${BASE}/paid/signature?family=B`, { waitUntil: "networkidle" });
  await hideChrome(page);
  await shotSection(page, "#section-phrases", "390-B-phrases-section.png");

  await browser.close();
  console.log(`P2.2V.7 screenshots saved to ${outDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
