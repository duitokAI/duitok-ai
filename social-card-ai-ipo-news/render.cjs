const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const root = __dirname;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${path.join(root, 'index.html')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.locator('#xhs-01').screenshot({
    path: path.join(root, 'output', 'xhs-01-ai-ipo-news.png'),
  });

  await browser.close();
  console.log(path.join(root, 'output', 'xhs-01-ai-ipo-news.png'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
