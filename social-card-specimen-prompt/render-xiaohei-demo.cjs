const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const root = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(root, "xiaohei-demo.html")}`);
  await page.locator("#xiaohei-demo").screenshot({
    path: path.join(root, "output", "xiaohei-prompt-machine-demo.png"),
  });
  await browser.close();
})();
