const { chromium } = require("playwright");
const path = require("path");

const root = __dirname;
const targets = [
  ["#xhs-01", "xhs-01-cover.png"],
  ["#xhs-02", "xhs-02-formula.png"],
  ["#xhs-03", "xhs-03-variables.png"],
  ["#xhs-04", "xhs-04-reference-wall.png"],
  ["#xhs-05", "xhs-05-annotation.png"],
  ["#xhs-06", "xhs-06-failure-modes.png"],
  ["#xhs-07", "xhs-07-copy-template.png"],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(root, "index.html")}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(900);

  for (const [selector, filename] of targets) {
    const node = page.locator(selector);
    await node.screenshot({ path: path.join(root, "output", filename) });
  }

  await browser.close();
})();
