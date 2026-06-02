const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const baseUrl = process.env.POKAYA_BASE_URL || "http://localhost:3000";
  const outDir = path.resolve("output/playwright-videos");
  fs.mkdirSync(outDir, { recursive: true });
  const webmPath = path.resolve("tiktok-developer-demo-viewport-strict.webm");
  for (const file of [webmPath]) {
    try {
      fs.unlinkSync(file);
    } catch {}
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: outDir, size: { width: 1600, height: 900 } },
  });
  const page = await context.newPage();

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@pokaya.ai", password: "pokaya123" }),
  });
  if (!loginRes.ok) throw new Error(`Login API failed: ${loginRes.status}`);
  const login = await loginRes.json();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((payload) => {
    localStorage.setItem("pokaya-user", JSON.stringify(payload.user));
    localStorage.setItem("pokaya-auth", payload.token);
    localStorage.setItem("pokaya-lang", "en");
  }, login);
  await page.goto(`${baseUrl}/studio?tiktok=connected`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    setInterval(() => {
      const connected = [...document.querySelectorAll(".tiktok-official p")].find((el) =>
        el.textContent?.includes("Connected:")
      );
      if (connected) connected.textContent = "Connected: TikTok account";
    }, 100);
  });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Scheduler", exact: true }).click({ force: true });
  await page.waitForSelector(".autopost-console", { timeout: 10000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => {
    document
      .querySelector('[data-action="tiktok-creator-info"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.resolve("tiktok-developer-demo-viewport-strict-frame.png"),
    fullPage: false,
  });
  await page.waitForTimeout(1800);

  await context.close();
  await browser.close();

  const videos = fs
    .readdirSync(outDir)
    .filter((file) => file.endsWith(".webm"))
    .map((file) => path.join(outDir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  fs.copyFileSync(videos[0], webmPath);
  console.log(webmPath);
})();
