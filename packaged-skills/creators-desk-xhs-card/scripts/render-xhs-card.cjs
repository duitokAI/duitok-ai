#!/usr/bin/env node
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function main() {
  const htmlPath = path.resolve(process.argv[2] || "xhs-card.html");
  const outPath = path.resolve(process.argv[3] || "output/xhs-card.png");
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML file not found: ${htmlPath}`);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState("networkidle");
  const target = page.locator("#research-cover, .poster").first();
  await target.screenshot({ path: outPath });
  await browser.close();
  console.log(outPath);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
