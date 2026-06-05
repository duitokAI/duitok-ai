import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.POKAYA_FLICKER_PORT || 4193);
const baseUrl = process.env.POKAYA_FLICKER_URL || `http://127.0.0.1:${port}`;
const maxDeltaPx = Number(process.env.POKAYA_FLICKER_MAX_DELTA_PX || 1);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("Playwright is required for interaction flicker checks. Install it in dev with: npm i -D playwright");
  }
}

function waitForServer(child, url, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error ? reject(error) : resolve();
    };
    const timer = setInterval(async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) done();
      } catch {
        if (Date.now() - started > timeoutMs) done(new Error(`Timed out waiting for ${url}`));
      }
    }, 250);
    child.once("exit", (code) => done(new Error(`Server exited before ready with code ${code}`)));
  });
}

function rectDelta(before, after) {
  if (!before || !after) return null;
  return {
    dx: Math.round(after.x - before.x),
    dy: Math.round(after.y - before.y),
    dw: Math.round(after.w - before.w),
    dh: Math.round(after.h - before.h)
  };
}

function assertStable(label, delta) {
  if (!delta) throw new Error(`${label}: missing measurement target`);
  const max = Math.max(Math.abs(delta.dx), Math.abs(delta.dy), Math.abs(delta.dw), Math.abs(delta.dh));
  if (max > maxDeltaPx) {
    throw new Error(`${label}: moved/resized by ${max}px, delta=${JSON.stringify(delta)}`);
  }
}

async function measure(page) {
  return page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, cls: String(el.className || "") };
    };
    const delta = (before, after) => before && after ? {
      dx: Math.round(after.x - before.x),
      dy: Math.round(after.y - before.y),
      dw: Math.round(after.w - before.w),
      dh: Math.round(after.h - before.h)
    } : null;
    const clickTab = (index) => {
      const tabs = [...document.querySelectorAll(".studio-higgsfield-tabs button,.step-tabs button")];
      tabs[index]?.click();
      return tabs.map((tab) => tab.textContent.trim());
    };
    const out = { tabs: clickTab(0) };

    await sleep(350);
    document.documentElement.classList.add("is-generation-submitting");
    document.querySelector("[data-image-generate-console]")?.classList.add("is-generating");
    const imageBefore = rect("[data-image-generate-console]");
    document.querySelector(".image-model-picker summary")?.click();
    await sleep(180);
    const imageAfter = rect("[data-image-generate-console]");
    out.imageModelMenu = delta(imageBefore, imageAfter);

    clickTab(1);
    await sleep(450);
    document.documentElement.classList.add("is-generation-submitting");
    document.querySelector("[data-video-generate-console]")?.classList.add("is-generating");
    const videoBefore = rect("[data-video-generate-console]");
    document.querySelector(".video-model-picker summary")?.click();
    await sleep(180);
    const videoAfter = rect("[data-video-generate-console]");
    out.videoModelMenu = delta(videoBefore, videoAfter);

    clickTab(2);
    await sleep(450);
    const audioComposerBefore = rect(".audio-composer");
    const audioBarBefore = rect(".audio-main-bar");
    document.querySelector(".audio-preset-picker summary")?.click();
    await sleep(180);
    const audioComposerAfter = rect(".audio-composer");
    const audioBarAfter = rect(".audio-main-bar");
    out.audioPresetMenu = {
      composer: delta(audioComposerBefore, audioComposerAfter),
      mainBar: delta(audioBarBefore, audioBarAfter)
    };

    const modeBefore = rect(".audio-composer");
    document.querySelector('.audio-mode-dial [data-value="Translate"]')?.click();
    await sleep(220);
    const modeAfter = rect(".audio-composer");
    out.audioModeSwitch = delta(modeBefore, modeAfter);

    return out;
  });
}

const { chromium } = await loadPlaywright();
const dataDir = await mkdtemp(path.join(os.tmpdir(), "pokaya-flicker-data-"));
const server = process.env.POKAYA_FLICKER_URL ? null : spawn("node", ["server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(port),
    DATA_DIR: dataDir,
    ALLOW_PUBLIC_SIGNUP: "true",
    DEFAULT_USER_CREDITS: "83"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  if (server) await waitForServer(server, baseUrl);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', `flicker-${Date.now()}@pokaya.local`);
  await page.fill('input[name="password"]', "pokaya-flicker-test");
  await page.click('form[data-form="login"] button[type="submit"]');
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("pokaya-user") || "{}");
    localStorage.setItem(`pokaya-first-wizard:${String(user.email || "test").toLowerCase()}`, "done");
  });
  await page.goto(`${baseUrl}/studio`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const result = await measure(page);
  await browser.close();

  assertStable("Image model menu", result.imageModelMenu);
  assertStable("Video model menu", result.videoModelMenu);
  assertStable("Audio preset menu composer", result.audioPresetMenu?.composer);
  assertStable("Audio preset menu main bar", result.audioPresetMenu?.mainBar);
  assertStable("Audio mode switch", result.audioModeSwitch);

  console.log("Interaction flicker checks passed.");
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (server) server.kill("SIGTERM");
  await rm(dataDir, { recursive: true, force: true });
}
