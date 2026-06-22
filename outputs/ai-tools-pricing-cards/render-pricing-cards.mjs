import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "pricing-cards.html");

const cards = [
  ["prompt-card", "01-prompt-tools.png"],
  ["image-card", "02-image-models.png"],
  ["video-card", "03-video-models.png"]
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 2100, height: 1220 },
  deviceScaleFactor: 1
});

await page.goto(`file://${htmlPath}`);
await page.evaluate(() => document.fonts.ready);

for (const [id, filename] of cards) {
  const element = page.locator(`#${id}`);
  await element.screenshot({
    path: path.join(__dirname, filename),
    animations: "disabled"
  });
}

await browser.close();
