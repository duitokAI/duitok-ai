import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.POKAYA_FLICKER_PORT || 4193);
const baseUrl = process.env.POKAYA_FLICKER_URL || `http://127.0.0.1:${port}`;
const maxDeltaPx = Number(process.env.POKAYA_FLICKER_MAX_DELTA_PX || 1);
let dbPath = "";

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
    window.__pokayaLongTasks = [];
    try {
      window.__pokayaLongTaskObserver?.disconnect?.();
      window.__pokayaLongTaskObserver = new PerformanceObserver((list) => {
        window.__pokayaLongTasks.push(...list.getEntries().map((entry) => Math.round(entry.duration)));
      });
      window.__pokayaLongTaskObserver.observe({ type: "longtask", buffered: true });
    } catch {
      window.__pokayaLongTaskObserver = null;
    }
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
    const stats = () => ({ renders: 0, libraryPatches: 0, libraryAppends: 0, ...(window.__pokayaPerfStats || {}) });
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

    const beforeLibraryStats = stats();
    document.querySelector('[data-page="library"]')?.click();
    await sleep(250);
    const libraryBefore = rect(".asset-library-main");
    const deferredBefore = document.querySelectorAll("[data-asset-deferred-result]").length;
    const beforeMoreStats = stats();
    const moreStart = performance.now();
    document.querySelector("[data-asset-library-more]")?.click();
    await sleep(350);
    const loadMoreMs = Math.round(performance.now() - moreStart);
    const afterMoreStats = stats();
    await sleep(1000);
    const deferredAfterHydrate = document.querySelectorAll("[data-asset-deferred-result]").length;
    const libraryAfter = rect(".asset-library-main");
    const longTasks = window.__pokayaLongTasks || [];
    out.contentLibrary = {
      main: delta(libraryBefore, libraryAfter),
      deferredBefore,
      deferredAfterHydrate,
      tileCount: document.querySelectorAll(".asset-tile").length,
      loadMoreMs,
      loadMoreRenderDelta: afterMoreStats.renders - beforeMoreStats.renders,
      loadMoreAppendDelta: afterMoreStats.libraryAppends - beforeMoreStats.libraryAppends,
      libraryAppendDelta: afterMoreStats.libraryAppends - beforeLibraryStats.libraryAppends,
      longTaskCount: longTasks.length,
      maxLongTaskMs: longTasks.length ? Math.max(...longTasks) : 0
    };

    return out;
  });
}

async function seedLibraryResults(email) {
  if (process.env.POKAYA_FLICKER_URL) return;
  const db = JSON.parse(await readFile(dbPath, "utf8"));
  const user = (db.users || []).find((item) => String(item.email || "").toLowerCase() === String(email || "").toLowerCase());
  const project = (db.projects || []).find((item) => item.userId === user?.id) || db.projects?.[0];
  if (!user || !project) return;
  const now = Date.now();
  project.results = Array.from({ length: 96 }, (_, index) => {
    const hue = (index * 29) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="hsl(${hue},78%,62%)"/><stop offset="1" stop-color="hsl(${(hue + 52) % 360},84%,74%)"/></linearGradient></defs><rect width="480" height="480" fill="url(#g)"/><circle cx="${120 + (index % 5) * 56}" cy="${130 + (index % 4) * 44}" r="88" fill="rgba(255,255,255,.42)"/></svg>`;
    return {
      id: `flicker-lib-${index}`,
      type: "image",
      title: `Library perf asset ${index + 1}`,
      prompt: "Interaction flicker and library performance smoke asset",
      imageUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      model: "GPT Image 2",
      aspectRatio: "1:1",
      createdAt: new Date(now - index * 60_000).toISOString(),
      updatedAt: new Date(now - index * 60_000).toISOString()
    };
  });
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

const { chromium } = await loadPlaywright();
const dataDir = await mkdtemp(path.join(os.tmpdir(), "pokaya-flicker-data-"));
dbPath = path.join(dataDir, "db.json");
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
  const email = `flicker-${Date.now()}@pokaya.local`;
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "pokaya-flicker-test");
  await page.click('form[data-form="login"] button[type="submit"]');
  await page.waitForTimeout(900);
  await seedLibraryResults(email);
  await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("pokaya-user") || "{}");
    localStorage.setItem(`pokaya-first-wizard:${String(user.email || "test").toLowerCase()}`, "done");
  });
  await page.goto(`${baseUrl}/studio`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const result = await measure(page);
  await browser.close();

  console.log(JSON.stringify(result, null, 2));

  assertStable("Image model menu", result.imageModelMenu);
  assertStable("Video model menu", result.videoModelMenu);
  assertStable("Audio preset menu composer", result.audioPresetMenu?.composer);
  assertStable("Audio preset menu main bar", result.audioPresetMenu?.mainBar);
  assertStable("Audio mode switch", result.audioModeSwitch);
  assertStable("Content Library main", result.contentLibrary?.main);
  if (!process.env.POKAYA_FLICKER_URL && Number(result.contentLibrary?.tileCount || 0) < 48) {
    throw new Error(`Content Library seeded assets did not render after load more: ${result.contentLibrary?.tileCount || 0}/48`);
  }
  if (Number(result.contentLibrary?.loadMoreRenderDelta || 0) > 0) {
    throw new Error(`Content Library load more triggered full render: ${result.contentLibrary.loadMoreRenderDelta}`);
  }
  if (!process.env.POKAYA_FLICKER_URL && Number(result.contentLibrary?.libraryAppendDelta || 0) < 1) {
    throw new Error("Content Library did not use append path.");
  }
  if (Number(result.contentLibrary?.loadMoreMs || 0) > 900) {
    throw new Error(`Content Library load more is too slow: ${result.contentLibrary.loadMoreMs}ms`);
  }
  if (Number(result.contentLibrary?.maxLongTaskMs || 0) > 250) {
    throw new Error(`Studio interaction long task exceeded budget: ${result.contentLibrary.maxLongTaskMs}ms`);
  }

  console.log("Interaction flicker checks passed.");
} finally {
  if (server) server.kill("SIGTERM");
  await rm(dataDir, { recursive: true, force: true });
}
