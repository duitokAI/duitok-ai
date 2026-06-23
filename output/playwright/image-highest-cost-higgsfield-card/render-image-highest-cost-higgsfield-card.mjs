import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "image-highest-cost-higgsfield-card.html");
const outputPath = path.join(__dirname, "image-highest-cost-higgsfield-card.png");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 2048, height: 1180 },
  deviceScaleFactor: 1
});

await page.goto(`file://${htmlPath}`);
await page.evaluate(() => document.fonts.ready);
await page.locator("#highest-cost-card").screenshot({
  path: outputPath,
  animations: "disabled"
});

await browser.close();
