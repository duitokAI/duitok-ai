#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const taskDir = path.resolve(process.argv[2] || ".");
  const htmlPath = path.join(taskDir, "index.html");
  const outputDir = path.join(taskDir, "output");

  await fs.access(htmlPath);
  await fs.mkdir(outputDir, { recursive: true });

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });

  const posters = await page.locator(".poster").count();
  if (!posters) {
    throw new Error("No .poster elements found in index.html");
  }

  for (let i = 0; i < posters; i += 1) {
    const poster = page.locator(".poster").nth(i);
    const outputName = await poster.getAttribute("data-output");
    const fileName = `${String(i + 1).padStart(2, "0")}-${outputName || "poster"}.png`;
    await poster.screenshot({ path: path.join(outputDir, fileName) });
    console.log(`Rendered ${fileName}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
