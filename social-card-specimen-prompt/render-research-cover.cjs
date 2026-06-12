const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const root = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(root, "research-cover.html")}`);
  await page.waitForLoadState("networkidle");
  await page.locator("#research-cover").screenshot({
    path: path.join(root, "output", "xhs-research-cover.png"),
  });
  await browser.close();
})();
