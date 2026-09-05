import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.resolve("dev-artifacts/screenshots/p22");
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. 390px Mobile Viewport Screenshots
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000/paid/signature", { waitUntil: "networkidle" });

  // Hide sticky header and Next.js dev badges for clean element screenshots
  await mobilePage.evaluate(() => {
    document.querySelectorAll("header, nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay]").forEach((el) => el.remove());
  });

  // 01 cover
  const coverEl = await mobilePage.$("#section-cover");
  if (coverEl) await coverEl.screenshot({ path: `${outDir}/390-01-cover.png` });

  // 01-2 two-person
  const twoPersonEl = await mobilePage.$("#section-two-person");
  if (twoPersonEl) await twoPersonEl.screenshot({ path: `${outDir}/390-01-2-two-person.png` });

  // 02 recurring-scene
  const sceneEl = await mobilePage.$("#section-recurring-scene");
  if (sceneEl) await sceneEl.screenshot({ path: `${outDir}/390-02-recurring-scene.png` });

  // 03 perspective
  const perspEl = await mobilePage.$("#section-perspective-gap");
  if (perspEl) await perspEl.screenshot({ path: `${outDir}/390-03-perspective.png` });

  // 04 interaction-pattern
  const whyEl = await mobilePage.$("#section-interaction-pattern");
  if (whyEl) await whyEl.screenshot({ path: `${outDir}/390-04-why-repeat.png` });

  // 04-2 fortune-relationship
  const fortuneEl = await mobilePage.$("#section-fortune-relationship");
  if (fortuneEl) await fortuneEl.screenshot({ path: `${outDir}/390-04-2-fortune-relationship.png` });

  // 05 conflict-chain
  const chainEl = await mobilePage.$("#section-conflict-chain");
  if (chainEl) await chainEl.screenshot({ path: `${outDir}/390-05-conflict-chain.png` });

  // 06 where-to-break
  const breakEl = await mobilePage.$("#section-conflict-chain .border-2");
  if (breakEl) await breakEl.screenshot({ path: `${outDir}/390-06-where-to-break.png` });

  // 07 mom-exhaustion
  const momEl = await mobilePage.$("#section-mom-exhaustion");
  if (momEl) await momEl.screenshot({ path: `${outDir}/390-07-mom-exhaustion.png` });

  // 08 phrases
  const phrasesEl = await mobilePage.$("#section-phrases");
  if (phrasesEl) await phrasesEl.screenshot({ path: `${outDir}/390-08-phrases.png` });

  // 09 actions
  const actionsEl = await mobilePage.$("#section-actions");
  if (actionsEl) await actionsEl.screenshot({ path: `${outDir}/390-09-actions.png` });

  // 10 final-anchor
  const anchorEl = await mobilePage.$("#section-anchor");
  if (anchorEl) await anchorEl.screenshot({ path: `${outDir}/390-10-final-anchor.png` });

  // Full 390px page
  await mobilePage.screenshot({ path: `${outDir}/390-full-report.png`, fullPage: true });

  // 2. 430px Viewport Screenshots
  const ctx430 = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page430 = await ctx430.newPage();
  await page430.goto("http://localhost:3000/paid/signature", { waitUntil: "networkidle" });
  await page430.evaluate(() => {
    document.querySelectorAll("header, nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay]").forEach((el) => el.remove());
  });

  const cover430 = await page430.$("#section-cover");
  if (cover430) await cover430.screenshot({ path: `${outDir}/430-cover.png` });

  const chain430 = await page430.$("#section-conflict-chain");
  if (chain430) await chain430.screenshot({ path: `${outDir}/430-conflict-chain.png` });

  const phrases430 = await page430.$("#section-phrases");
  if (phrases430) await phrases430.screenshot({ path: `${outDir}/430-phrases.png` });

  // 3. Desktop Viewport Screenshots
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto("http://localhost:3000/paid/signature", { waitUntil: "networkidle" });
  await desktopPage.evaluate(() => {
    document.querySelectorAll("nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay]").forEach((el) => el.remove());
  });
  await desktopPage.screenshot({ path: `${outDir}/desktop-full-report.png`, fullPage: true });

  console.log("All P2.2 screenshots captured successfully into " + outDir);
  await browser.close();
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
