import "dotenv/config";
import crypto from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import pg from "pg";
import { createServer as createViteServer } from "vite";

const { Pool } = pg;
const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(root, "data");
const dbPath = path.join(dataDir, "db.json");
const distDir = path.join(root, "dist");
const port = Number(process.env.PORT || 4173);
const serveStatic = process.env.SERVE_STATIC !== "false";
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
const postgresStateId = process.env.POSTGRES_STATE_ID || "default";
const apimartBaseUrl = (process.env.APIMART_BASE_URL || "https://api.apimart.ai").replace(/\/$/, "");
const apimartChatPath = process.env.APIMART_CHAT_PATH || "/v1/chat/completions";
const apimartImagePath = process.env.APIMART_IMAGE_PATH || "/v1/images/generations";
const apimartTaskPathPrefix = process.env.APIMART_TASK_PATH_PREFIX || "/v1/tasks";
const apimartTextModel = process.env.APIMART_TEXT_MODEL || "gpt-5-mini";
const apimartImageModel = process.env.APIMART_IMAGE_MODEL || "gpt-image-2";
const deepseekBaseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const deepseekChatPath = process.env.DEEPSEEK_CHAT_PATH || "/chat/completions";
const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const wuyinBaseUrl = (process.env.WUYIN_BASE_URL || "https://api.wuyinkeji.com").replace(/\/$/, "");
const wuyinImagePaths = {
  "Nano Banana Pro": "/api/async/image_nanoBanana_pro",
  "Veo 3.1": "/api/video/veo",
  "Sora 2": "/api/async/video_sora2"
};
const wuyinVideoModel = process.env.WUYIN_VIDEO_MODEL || "veo3.1-fast";
const allowedMediaModels = new Set(["GPT Image 2", "Nano Banana Pro", "Veo 3.1", "Sora 2"]);
const postgresPool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.POSTGRES_SSL === "false" ? false : { rejectUnauthorized: false }
    })
  : null;
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.PUBLIC_APP_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const app = express();
app.use((req, res, next) => {
  const origin = req.get("origin")?.replace(/\/$/, "");
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Signature");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({
  verify: (req, _res, buffer) => {
    req.rawBody = buffer;
  }
}));

app.get("/api/health", (_req, res) => {
  const aiProviders = [
    process.env.APIMART_API_KEY ? "apimart" : null,
    process.env.DEEPSEEK_API_KEY ? "deepseek" : null,
    process.env.WUYIN_API_KEY ? "wuyin" : null
  ].filter(Boolean);
  res.json({
    ok: true,
    service: "duitok-ai",
    storage: postgresPool ? "postgres" : "json",
    ai: aiProviders.join("+") || "mock",
    imageProvider: "model-router"
  });
});

function blankProject(id, name) {
  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    image: { model: "GPT Image 2", mode: "Create Image", prompt: "" },
    ugc: { avatar: "Malay female", voice: "BM Casual", length: "30 seconds", script: "Hook, product proof, objection, offer, CTA." },
    auto: { platform: "TikTok", batch: "7 posts", tone: "Viral hook", productUrl: "" },
    original: { brief: "Rewrite this into Duitok  AI style while keeping the product claim safe." },
    clone: { url: "", rules: "Keep structure, change product, rewrite hook, avoid copying exact words." },
    story: { arc: "Problem -> proof -> offer", market: "Malaysia TikTok Shop", notes: "" },
    viral: { url: "", depth: "Quick decode" },
    results: []
  };
}

function usage(action, credits) {
  return { id: crypto.randomUUID(), action, credits, createdAt: new Date().toISOString() };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!stored.includes(":")) return password === stored;
  const [salt, hash] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const seed = {
  users: [{ id: "u_1", email: "admin@duitok.com", passwordHash: hashPassword("duitok123"), name: "Duitok  AI Admin" }],
  liveCount: 10,
  projects: [
    blankProject("p_1", "Project 1"),
    blankProject("p_2", "Project 2"),
    blankProject("p_3", "Project 3")
  ],
  attachments: [],
  billing: {
    plan: "Duitok  AI Pro",
    credits: 83,
    nextBill: "2026-06-26",
    invoices: [
      { id: "INV-2026-001", amount: 79, createdAt: "2026-05-26T08:00:00.000Z" },
      { id: "INV-2026-000", amount: 30, createdAt: "2026-05-20T08:00:00.000Z" }
    ]
  },
  payments: [],
  affiliate: { code: "DUIT2026", clicks: 128, payout: 420 },
  usage: [
    usage("Image generation", 4),
    usage("UGC generation", 8),
    usage("Viral decode", 3)
  ],
  schedule: [
    { id: "s_1", title: "Serum soft sell", platform: "TikTok", time: "Tue 20:30", status: "Ready" },
    { id: "s_2", title: "Lunchbox proof video", platform: "TikTok", time: "Wed 12:15", status: "Draft" },
    { id: "s_3", title: "Wireless mic review", platform: "TikTok", time: "Fri 21:00", status: "Ready" }
  ],
  supportTickets: []
};

function normalizeDb(db) {
  db.users ||= structuredClone(seed.users);
  db.liveCount ||= seed.liveCount;
  db.projects ||= structuredClone(seed.projects);
  db.attachments ||= [];
  db.billing ||= structuredClone(seed.billing);
  db.payments ||= [];
  db.affiliate ||= structuredClone(seed.affiliate);
  db.usage ||= structuredClone(seed.usage);
  db.schedule ||= structuredClone(seed.schedule);
  db.supportTickets ||= [];
  return db;
}

let postgresReady;

async function ensurePostgresSchema() {
  if (!postgresPool) return;
  postgresReady ||= postgresPool.query(`
    create table if not exists app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await postgresReady;
}

async function ensureDb() {
  if (postgresPool) {
    await ensurePostgresSchema();
    const result = await postgresPool.query("select data from app_state where id = $1", [postgresStateId]);
    if (result.rows[0]?.data) {
      const rawDb = result.rows[0].data;
      const shouldBackfill = !rawDb.users || !rawDb.projects || !rawDb.billing || !rawDb.usage || !rawDb.schedule;
      const db = normalizeDb(rawDb);
      if (shouldBackfill) await saveDb(db);
      return db;
    }
    const db = structuredClone(seed);
    await saveDb(db);
    return db;
  }

  await mkdir(dataDir, { recursive: true });
  try {
    return normalizeDb(JSON.parse(await readFile(dbPath, "utf8")));
  } catch {
    await writeFile(dbPath, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }
}

async function saveDb(db) {
  normalizeDb(db);
  if (postgresPool) {
    await ensurePostgresSchema();
    await postgresPool.query(
      `insert into app_state (id, data, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do update set data = excluded.data, updated_at = now()`,
      [postgresStateId, JSON.stringify(db)]
    );
    return publicState(db);
  }

  await writeFile(dbPath, JSON.stringify(db, null, 2));
  return publicState(db);
}

let dbMutationQueue = Promise.resolve();

function mutateDb(handler) {
  const run = dbMutationQueue.then(async () => {
    const db = await ensureDb();
    return handler(db);
  });
  dbMutationQueue = run.catch(() => {});
  return run;
}

function publicState(db) {
  const { users: _users, ...rest } = db;
  return rest;
}

function setDeep(target, dotted, value) {
  const parts = dotted.split(".");
  let cursor = target;
  while (parts.length > 1) {
    const key = parts.shift();
    cursor[key] ||= {};
    cursor = cursor[key];
  }
  cursor[parts[0]] = value;
}

function findProject(db, id) {
  const project = db.projects.find((item) => item.id === id);
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }
  return project;
}

function generatedCopy(action, step) {
  const map = {
    "generate-image": ["Image result", "Generated image prompt and render state saved. Real AI API can replace this worker later."],
    "generate-ugc": ["UGC video", "Avatar, voice, script, and render queue state saved."],
    "generate-auto": ["Auto content batch", "Seven-post TikTok content schedule created."],
    "analyze-original": ["Original video analysis", "Hook, proof moment, objection, and CTA extracted."],
    "clone-prompt": ["Clone prompt", "Reference structure converted into a Duitok  AI-safe prompt."],
    "write-story": ["Story script", "Story arc written with problem, proof, offer, and CTA."],
    "decode-viral": ["Viral decode", "Competitor pattern decoded into repeatable checklist."]
  };
  return map[action] || [`${step} result`, "Generated output saved."];
}

function requireApimartConfig() {
  const apiKey = process.env.APIMART_API_KEY;
  if (!apiKey || apiKey.includes("replace_with")) {
    const error = new Error("APIMart belum configure. Isi APIMART_API_KEY dalam Render Environment Variables dulu.");
    error.status = 503;
    throw error;
  }
  return apiKey;
}

function providerForMediaModel(model) {
  if (model === "GPT Image 2") return process.env.APIMART_API_KEY ? "apimart" : "mock";
  if (model === "Nano Banana Pro" || model === "Veo 3.1" || model === "Sora 2") return process.env.WUYIN_API_KEY ? "wuyin" : "mock";
  return "unsupported";
}

function requireDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.includes("replace_with")) {
    const error = new Error("DeepSeek belum configure. Isi DEEPSEEK_API_KEY dalam Environment Variables dulu.");
    error.status = 503;
    throw error;
  }
  return apiKey;
}

async function apimartRequest(pathname, options = {}) {
  const apiKey = requireApimartConfig();
  const response = await fetch(`${apimartBaseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(Number(process.env.APIMART_TIMEOUT_MS || 120000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.code && payload.code >= 400)) {
    const error = new Error(payload.message || payload.detail || payload.error || `APIMart request failed (${response.status})`);
    error.status = response.status || 502;
    throw error;
  }
  return payload.data || payload;
}

async function deepseekRequest(body) {
  const apiKey = requireDeepSeekConfig();
  const response = await fetch(`${deepseekBaseUrl}${deepseekChatPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.DEEPSEEK_TIMEOUT_MS || 120000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || payload.message || `DeepSeek request failed (${response.status})`);
    error.status = response.status || 502;
    throw error;
  }
  return payload;
}

function requireWuyinConfig() {
  const apiKey = process.env.WUYIN_API_KEY;
  if (!apiKey || apiKey.includes("replace_with")) {
    const error = new Error("速创API belum configure. Isi WUYIN_API_KEY dalam Render Environment Variables dulu.");
    error.status = 503;
    throw error;
  }
  return apiKey;
}

async function wuyinRequest(pathname, { method = "GET", body, query = {} } = {}) {
  const apiKey = requireWuyinConfig();
  const url = new URL(`${wuyinBaseUrl}${pathname}`);
  url.searchParams.set("key", apiKey);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(Number(process.env.WUYIN_TIMEOUT_MS || 120000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.code && payload.code !== 200)) {
    const error = new Error(payload.msg || payload.message || `速创API request failed (${response.status})`);
    error.status = response.status || 502;
    throw error;
  }
  return payload.data || payload;
}

function formatProjectContext(project, action, step) {
  return JSON.stringify({
    action,
    step,
    projectName: project.name,
    image: project.image,
    ugc: project.ugc,
    auto: project.auto,
    original: project.original,
    clone: project.clone,
    story: project.story,
    viral: project.viral
  }, null, 2);
}

function buildTextPrompt(project, action, step) {
  const taskMap = {
    "generate-ugc": "Write a practical UGC video script with hook, scene notes, creator lines, objection handling, offer, and CTA.",
    "generate-auto": "Create a batch content plan with post ideas, hooks, captions, visual directions, and CTA for each post.",
    "analyze-original": "Analyze the original video brief and return hook, proof moment, content structure, remake notes, and safer rewrite.",
    "clone-prompt": "Turn the reference into a reusable clone prompt. Keep the structure but do not copy exact words.",
    "write-story": "Write a short-form storytelling script for TikTok Shop using the selected arc and market.",
    "decode-viral": "Decode the competitor pattern into repeatable hooks, angles, pacing, proof, objections, and CTA checklist."
  };
  return [
    taskMap[action] || "Generate the requested Duitok AI content output.",
    "",
    "Context:",
    formatProjectContext(project, action, step),
    "",
    "Output in clean Markdown. Be specific, seller-friendly, and optimized for Malaysia TikTok Shop workflows."
  ].join("\n");
}

async function generateTextWithApimart(project, action, step) {
  const data = await apimartRequest(apimartChatPath, {
    method: "POST",
    body: JSON.stringify({
      model: apimartTextModel,
      stream: false,
      messages: [
        {
          role: "system",
          content: "You are Duitok AI, an AI content studio for Malaysia sellers. Produce usable marketing outputs, not generic advice."
        },
        { role: "user", content: buildTextPrompt(project, action, step) }
      ]
    })
  });
  return data.choices?.[0]?.message?.content?.trim() || data.output_text || data.text || JSON.stringify(data, null, 2);
}

function imageModelFromProject(project) {
  const modelMap = {
    "GPT Image 2": "gpt-image-2"
  };
  return process.env.APIMART_IMAGE_MODEL || modelMap[project.image?.model] || apimartImageModel;
}

async function pollApimartTask(taskId) {
  const maxAttempts = Number(process.env.APIMART_IMAGE_POLL_ATTEMPTS || 24);
  const delayMs = Number(process.env.APIMART_IMAGE_POLL_MS || 2500);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const data = await apimartRequest(`${apimartTaskPathPrefix}/${encodeURIComponent(taskId)}?language=en`);
    if (data.status === "completed") return data;
    if (["failed", "cancelled"].includes(data.status)) {
      const error = new Error(data.fail_reason || data.error || `APIMart image task ${data.status}`);
      error.status = 502;
      throw error;
    }
  }
  const error = new Error("APIMart image task is still processing. Please try again later.");
  error.status = 202;
  throw error;
}

function extractImageUrls(taskData) {
  return (taskData.result?.images || [])
    .flatMap((image) => Array.isArray(image.url) ? image.url : [image.url])
    .filter(Boolean);
}

function extractUrlsDeep(value) {
  const urls = [];
  const visit = (item, keyName = "") => {
    if (!item) return;
    if (typeof item === "string") {
      const matches = item.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
      urls.push(...matches.filter((url) => /\.(png|jpe?g|webp|gif|mp4|mov|webm)(\?|$)/i.test(url) || /url/i.test(keyName)));
      return;
    }
    if (Array.isArray(item)) return item.forEach((entry) => visit(entry, keyName));
    if (typeof item === "object") Object.entries(item).forEach(([key, entry]) => visit(entry, key));
  };
  visit(value);
  return [...new Set(urls)];
}

async function generateImageWithApimart(project) {
  const prompt = [
    project.image?.prompt || "Create a high-converting TikTok Shop product image.",
    `Mode: ${project.image?.mode || "Create Image"}.`,
    "Style: realistic commercial product scene, clear product focus, vertical-social friendly, no fake brand claims."
  ].join("\n");
  const data = await apimartRequest(apimartImagePath, {
    method: "POST",
    body: JSON.stringify({
      model: imageModelFromProject(project),
      prompt,
      n: 1,
      size: process.env.APIMART_IMAGE_SIZE || "1:1",
      resolution: process.env.APIMART_IMAGE_RESOLUTION || "1K"
    })
  });
  const task = Array.isArray(data) ? data[0] : data;
  const taskId = task?.task_id || task?.id;
  if (!taskId) return { text: JSON.stringify(data, null, 2), urls: [] };
  const taskData = await pollApimartTask(taskId);
  const urls = extractImageUrls(taskData);
  return {
    text: urls.length ? `Image generated with APIMart.\n\nTask ID: ${taskId}` : `Image task completed.\n\nTask ID: ${taskId}`,
    urls,
    taskId
  };
}

function wuyinPathFromProject(project) {
  return wuyinImagePaths[project.image?.model] || process.env.WUYIN_IMAGE_PATH || "/api/async/image_nanoBanana_pro";
}

function wuyinImageBody(project, prompt) {
  const model = project.image?.model || "";
  const aspectRatio = process.env.WUYIN_IMAGE_ASPECT_RATIO || "1:1";
  const imageSize = process.env.WUYIN_IMAGE_SIZE || "1K";
  if (model === "Veo 3.1") {
    return {
      model: wuyinVideoModel,
      prompt,
      type: "text2video",
      ratio: process.env.WUYIN_VIDEO_RATIO || "9:16"
    };
  }
  if (model === "Sora 2") {
    return {
      prompt,
      aspectRatio: process.env.WUYIN_SORA_ASPECT_RATIO || process.env.WUYIN_VIDEO_RATIO || "9:16",
      duration: process.env.WUYIN_SORA_DURATION || "10",
      size: process.env.WUYIN_SORA_SIZE || "small"
    };
  }
  return { prompt, size: imageSize, aspectRatio };
}

async function pollWuyinTask(taskId) {
  const maxAttempts = Number(process.env.WUYIN_IMAGE_POLL_ATTEMPTS || 36);
  const delayMs = Number(process.env.WUYIN_IMAGE_POLL_MS || 3000);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const data = await wuyinRequest("/api/async/detail", { query: { id: taskId } });
    if (data.status === 2 || data.status === "success" || data.status === "completed") return data;
    if (data.status === 3 || data.status === "failed") {
      const error = new Error(data.message || data.msg || `速创API image task ${data.status}`);
      error.status = 502;
      throw error;
    }
  }
  const error = new Error("速创API image task is still processing. Please try again later.");
  error.status = 202;
  throw error;
}

async function generateImageWithWuyin(project) {
  const prompt = [
    project.image?.prompt || "Create a high-converting TikTok Shop product image.",
    `Mode: ${project.image?.mode || "Create Image"}.`,
    "Style: realistic commercial product scene, clear product focus, vertical-social friendly, no fake brand claims."
  ].join("\n");
  const data = await wuyinRequest(wuyinPathFromProject(project), {
    method: "POST",
    body: wuyinImageBody(project, prompt)
  });
  const taskId = data.id || data.task_id;
  if (!taskId) return { text: JSON.stringify(data, null, 2), urls: [] };
  const taskData = await pollWuyinTask(taskId);
  const urls = extractUrlsDeep(taskData);
  return {
    text: urls.length ? `Image generated with 速创API.\n\nTask ID: ${taskId}` : `Image task completed with 速创API.\n\nTask ID: ${taskId}`,
    urls,
    taskId
  };
}

async function generateVideoWithWuyin(project) {
  const prompt = [
    project.image?.prompt || "Create a high-converting TikTok Shop product video.",
    `Mode: ${project.image?.mode || "Create Video"}.`,
    "Style: realistic short-form ecommerce video, native-looking TikTok Shop pacing, clear product focus, no fake brand claims."
  ].join("\n");
  const data = await wuyinRequest(wuyinPathFromProject(project), {
    method: "POST",
    body: wuyinImageBody(project, prompt)
  });
  const taskId = data.id || data.task_id;
  if (!taskId) return { text: JSON.stringify(data, null, 2), urls: [] };
  const taskData = await pollWuyinTask(taskId);
  const urls = extractUrlsDeep(taskData);
  return {
    text: urls.length ? `Video generated with 速创API.\n\nTask ID: ${taskId}` : `Video task completed with 速创API.\n\nTask ID: ${taskId}`,
    urls,
    taskId
  };
}

async function generateWithApimart(project, action, step) {
  if (action === "generate-image") {
    const image = await generateImageWithApimart(project);
    return { title: "APIMart Image", body: image.text, imageUrl: image.urls[0], taskId: image.taskId };
  }
  const body = await generateTextWithApimart(project, action, step);
  const [fallbackTitle] = generatedCopy(action, step);
  return { title: fallbackTitle.replace(/^(Image|UGC|Auto|Original|Clone|Story|Viral)/, "APIMart $1"), body };
}

async function generateWithProvider(project, action, step) {
  if (action === "generate-image") {
    const model = project.image?.model || "GPT Image 2";
    if (!allowedMediaModels.has(model)) {
      const error = new Error("This Duitok plan only supports GPT Image 2, Nano Banana Pro, Veo 3.1, and Sora 2.");
      error.status = 400;
      throw error;
    }
    const provider = providerForMediaModel(model);
    if (provider === "wuyin" && (model === "Veo 3.1" || model === "Sora 2")) {
      const video = await generateVideoWithWuyin(project);
      return { title: `速创API ${model}`, body: video.text, videoUrl: video.urls[0], taskId: video.taskId, provider: "wuyin" };
    }
    if (provider === "wuyin") {
      const image = await generateImageWithWuyin(project);
      return { title: "速创API Nano Banana Pro", body: image.text, imageUrl: image.urls[0], taskId: image.taskId, provider: "wuyin" };
    }
    if (provider === "apimart") {
      const image = await generateImageWithApimart(project);
      return { title: "APIMart GPT Image 2", body: image.text, imageUrl: image.urls[0], taskId: image.taskId, provider: "apimart" };
    }
  }
  if (process.env.APIMART_API_KEY) {
    return { ...(await generateWithApimart(project, action, step)), provider: "apimart" };
  }
  const [title, body] = generatedCopy(action, step);
  return { title, body, provider: "mock" };
}

async function saveGeneratedResult(projectId, action, step, generated) {
  return mutateDb(async (currentDb) => {
    const project = findProject(currentDb, projectId);
    project.results.push({
      id: crypto.randomUUID(),
      type: step,
      title: generated.title,
      body: generated.body,
      imageUrl: generated.imageUrl,
      videoUrl: generated.videoUrl,
      taskId: generated.taskId,
      provider: generated.provider,
      createdAt: new Date().toISOString()
    });
    currentDb.billing.credits = Math.max(0, currentDb.billing.credits - 4);
    currentDb.usage.unshift(usage(generated.title, 4));
    return saveDb(currentDb);
  });
}

function publicAppUrl(pathname) {
  const base = (process.env.PUBLIC_APP_URL || `http://localhost:${port}`).replace(/\/$/, "");
  return `${base}${pathname}`;
}

function compactWorkspaceState(db) {
  return {
    credits: db.billing?.credits,
    plan: db.billing?.plan,
    projects: db.projects.map((project) => ({
      id: project.id,
      name: project.name,
      image: project.image,
      ugc: project.ugc,
      auto: project.auto,
      original: project.original,
      clone: project.clone,
      story: project.story,
      viral: project.viral,
      resultCount: project.results.length,
      latestResults: project.results.slice(-3).map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        createdAt: item.createdAt
      }))
    })),
    schedule: db.schedule,
    recentUsage: db.usage.slice(0, 8)
  };
}

const agentTools = [
  {
    type: "function",
    function: {
      name: "open_workspace",
      description: "Move the user to a Duitok workspace page, step, or project. Use this when navigation helps.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", description: "dashboard, project, library, autopost, billing, topup, usage, affiliate, whatsapp" },
          step: { type: "string", description: "image, ugc, auto, original, clone, story, viral" },
          projectId: { type: "string", description: "Existing project id, if relevant." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new Duitok project for the user.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name." }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_project_field",
      description: "Update a project field before generating output.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          field: { type: "string", description: "Dotted field path, for example image.prompt, ugc.script, auto.productUrl, clone.url, story.notes, viral.url." },
          value: { type: "string" }
        },
        required: ["projectId", "field", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_project_output",
      description: "Run one of Duitok's existing generation functions and save the result.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          action: {
            type: "string",
            enum: ["generate-image", "generate-ugc", "generate-auto", "analyze-original", "clone-prompt", "write-story", "decode-viral"]
          },
          step: {
            type: "string",
            enum: ["image", "ugc", "auto", "original", "clone", "story", "viral"]
          }
        },
        required: ["projectId", "action", "step"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "toggle_schedule_status",
      description: "Toggle a scheduled post between Ready and Posted.",
      parameters: {
        type: "object",
        properties: {
          scheduleId: { type: "string" }
        },
        required: ["scheduleId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description: "Create a support ticket when the user asks for human help or reports a platform problem.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" }
        },
        required: ["message"]
      }
    }
  }
];

async function executeAgentTool(name, args) {
  if (name === "open_workspace") {
    return {
      ok: true,
      uiAction: {
        page: args.page || undefined,
        step: args.step || undefined,
        projectId: args.projectId || undefined
      }
    };
  }

  if (name === "create_project") {
    const db = await mutateDb(async (currentDb) => {
      currentDb.projects.push(blankProject(crypto.randomUUID(), args.name || `Project ${currentDb.projects.length + 1}`));
      return saveDb(currentDb);
    });
    return { ok: true, message: "Project created.", db };
  }

  if (name === "update_project_field") {
    const db = await mutateDb(async (currentDb) => {
      setDeep(findProject(currentDb, args.projectId), args.field, args.value);
      currentDb.usage.unshift(usage(`Agent updated ${args.field}`, 0));
      return saveDb(currentDb);
    });
    return { ok: true, message: `${args.field} updated.`, db };
  }

  if (name === "generate_project_output") {
    const db = await ensureDb();
    const projectSnapshot = structuredClone(findProject(db, args.projectId));
    const generated = await generateWithProvider(projectSnapshot, args.action, args.step);
    const nextDb = await saveGeneratedResult(args.projectId, args.action, args.step, generated);
    return { ok: true, message: `${generated.title} saved.`, db: nextDb };
  }

  if (name === "toggle_schedule_status") {
    const db = await mutateDb(async (currentDb) => {
      const item = currentDb.schedule.find((entry) => entry.id === args.scheduleId);
      if (!item) throw Object.assign(new Error("Schedule item not found"), { status: 404 });
      item.status = item.status === "Ready" ? "Posted" : "Ready";
      currentDb.usage.unshift(usage(`Agent updated schedule: ${item.title}`, 0));
      return saveDb(currentDb);
    });
    return { ok: true, message: "Schedule updated.", db };
  }

  if (name === "create_support_ticket") {
    const db = await mutateDb(async (currentDb) => {
      currentDb.supportTickets.unshift({ id: crypto.randomUUID(), message: args.message, createdAt: new Date().toISOString() });
      return saveDb(currentDb);
    });
    return { ok: true, message: "Support ticket created.", db };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}

function requireChipConfig() {
  const token = process.env.CHIP_API_TOKEN;
  const brandId = process.env.CHIP_BRAND_ID;
  if (!token || !brandId || token.includes("replace_with") || brandId.includes("replace_with")) {
    const error = new Error("CHIP belum configure. Isi CHIP_API_TOKEN dan CHIP_BRAND_ID dalam .env dulu.");
    error.status = 503;
    throw error;
  }
  return { token, brandId };
}

async function createChipPurchase({ orderId, amount, email, fullName }) {
  const { token, brandId } = requireChipConfig();
  const response = await fetch("https://gate.chip-in.asia/api/v1/purchases/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client: {
        email: email || "customer@duitok.com",
        full_name: fullName || "Duitok  AI Customer"
      },
      purchase: {
        products: [{
          name: `Duitok  AI ${amount} credits`,
          price: amount * 100,
          quantity: 1
        }],
        currency: "MYR",
        metadata: {
          order_id: orderId,
          credits: amount
        }
      },
      brand_id: brandId,
      reference: orderId,
      success_redirect: publicAppUrl(`/?payment=success&order=${encodeURIComponent(orderId)}`),
      failure_redirect: publicAppUrl(`/?payment=failed&order=${encodeURIComponent(orderId)}`),
      cancel_redirect: publicAppUrl(`/?payment=cancelled&order=${encodeURIComponent(orderId)}`),
      success_callback: publicAppUrl("/api/payments/chip/callback")
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.detail || payload.message || "CHIP purchase creation failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function verifyChipSignature(req) {
  const publicKey = process.env.CHIP_PUBLIC_KEY?.replaceAll("\\n", "\n").trim();
  if (!publicKey) return { verified: false, reason: "CHIP_PUBLIC_KEY not configured" };

  const signature = req.get("x-signature");
  if (!signature) return { verified: false, reason: "Missing X-Signature" };

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(req.rawBody);
  verifier.end();
  return { verified: verifier.verify(publicKey, signature, "base64") };
}

function findOrderIdFromChipPayload(payload) {
  return payload.reference || payload.purchase?.metadata?.order_id || payload.metadata?.order_id;
}

async function markChipPurchasePaid(db, payload) {
  const orderId = findOrderIdFromChipPayload(payload);
  const payment = db.payments.find((item) => item.orderId === orderId || item.chipPurchaseId === payload.id);
  if (!payment || payment.status === "paid") return payment;

  payment.status = "paid";
  payment.rawStatus = payload.status;
  payment.paidAt = new Date().toISOString();
  db.billing.credits += payment.credits;
  db.billing.invoices.unshift({ id: `INV-${Date.now()}`, amount: payment.amount, createdAt: new Date().toISOString() });
  db.usage.unshift(usage(`Top up ${payment.credits} credits`, 0));
  return payment;
}

app.get("/api/state", async (_req, res) => {
  res.json(publicState(await ensureDb()));
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "admin@duitok.com").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const payload = await mutateDb(async (db) => {
    db.users ||= structuredClone(seed.users);
    let user = db.users.find((item) => item.email === email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        passwordHash: hashPassword(password),
        name: email.split("@")[0]
      };
      db.users.push(user);
      await saveDb(db);
    } else if (!verifyPassword(password, user.passwordHash || user.password)) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    } else if (!user.passwordHash) {
      user.passwordHash = hashPassword(password);
      delete user.password;
      await saveDb(db);
    }
    return { user: { id: user.id, email: user.email, name: user.name } };
  });
  res.json(payload);
});

app.post("/api/projects", async (req, res) => {
  res.json(await mutateDb(async (db) => {
    db.projects.push(blankProject(crypto.randomUUID(), req.body.name));
    return saveDb(db);
  }));
});

app.patch("/api/projects/:id/field", async (req, res) => {
  res.json(await mutateDb(async (db) => {
    setDeep(findProject(db, req.params.id), req.body.field, req.body.value);
    return saveDb(db);
  }));
});

app.post("/api/projects/:id/generate", async (req, res) => {
  const db = await ensureDb();
  const projectSnapshot = structuredClone(findProject(db, req.params.id));
  const generated = await generateWithProvider(projectSnapshot, req.body.action, req.body.step);
  res.json(await saveGeneratedResult(req.params.id, req.body.action, req.body.step, generated));
});

app.post("/api/agent", async (req, res, next) => {
  try {
    const db = await ensureDb();
    const history = Array.isArray(req.body.messages) ? req.body.messages.slice(-10) : [];
    const projectId = req.body.projectId || db.projects[0]?.id;
    const messages = [
      {
        role: "system",
        content: [
          "You are Duitok Agent inside Duitok AI Studio for Malaysia TikTok Shop sellers.",
          "Help the user decide what to do next, and call Duitok platform tools when useful.",
          "You can navigate the UI, create projects, update project fields, generate outputs, update schedule status, and create support tickets.",
          "Be concise, practical, and speak in the user's language. Ask only when required data is missing.",
          "Do not claim a tool ran unless it was actually called and returned success."
        ].join(" ")
      },
      {
        role: "system",
        content: `Current workspace JSON:\n${JSON.stringify(compactWorkspaceState(db), null, 2)}\nCurrent project id: ${projectId || "none"}`
      },
      ...history
        .filter((item) => ["user", "assistant"].includes(item.role) && typeof item.content === "string")
        .map((item) => ({ role: item.role, content: item.content.slice(0, 5000) }))
    ];

    const toolResults = [];
    const uiActions = [];
    let latestDb = publicState(db);

    for (let round = 0; round < 3; round += 1) {
      const completion = await deepseekRequest({
        model: deepseekModel,
        messages,
        tools: agentTools,
        tool_choice: "auto",
        stream: false
      });
      const message = completion.choices?.[0]?.message;
      if (!message) throw Object.assign(new Error("DeepSeek returned an empty response"), { status: 502 });

      messages.push(message);
      const calls = message.tool_calls || [];
      if (!calls.length) {
        return res.json({
          reply: message.content || "Done.",
          db: latestDb,
          toolResults,
          uiActions
        });
      }

      for (const call of calls) {
        const name = call.function?.name;
        let args = {};
        try {
          args = JSON.parse(call.function?.arguments || "{}");
        } catch {
          args = {};
        }
        const result = await executeAgentTool(name, args);
        if (result.db) latestDb = result.db;
        if (result.uiAction) uiActions.push(result.uiAction);
        toolResults.push({ name, args, result: { ok: result.ok, message: result.message, error: result.error } });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ ok: result.ok, message: result.message, error: result.error })
        });
      }
    }

    res.json({
      reply: "I completed the available Duitok actions. Check the updated workspace.",
      db: latestDb,
      toolResults,
      uiActions
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/attachments", async (req, res) => {
  res.json(await mutateDb(async (db) => {
    db.attachments.unshift({ id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() });
    db.usage.unshift(usage(`Uploaded ${req.body.kind}`, 0));
    return saveDb(db);
  }));
});

app.post("/api/billing/topup", async (req, res, next) => {
  try {
    const amount = Number(req.body.amount || 0);
    if (![10, 30, 50, 100].includes(amount)) return res.status(400).json({ error: "Invalid top up amount" });

    const orderId = `DT-${Date.now()}`;
    const chipPurchase = await createChipPurchase({
      orderId,
      amount,
      email: req.body.email,
      fullName: req.body.fullName
    });

    await mutateDb(async (db) => {
      db.payments.unshift({
        id: crypto.randomUUID(),
        orderId,
        chipPurchaseId: chipPurchase.id,
        checkoutUrl: chipPurchase.checkout_url,
        directPostUrl: chipPurchase.direct_post_url,
        amount,
        credits: amount,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      return saveDb(db);
    });

    res.json({
      orderId,
      checkoutUrl: chipPurchase.checkout_url,
      directPostUrl: chipPurchase.direct_post_url
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/chip/callback", async (req, res, next) => {
  try {
    const verification = verifyChipSignature(req);
    if (process.env.NODE_ENV === "production" && !verification.verified) {
      return res.status(401).json({ error: verification.reason || "Invalid CHIP signature" });
    }
    await mutateDb(async (db) => {
      await markChipPurchasePaid(db, req.body);
      return saveDb(db);
    });
    res.json({ ok: true, verified: verification.verified });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/schedule/:id", async (req, res) => {
  res.json(await mutateDb(async (db) => {
    const item = db.schedule.find((entry) => entry.id === req.params.id);
    if (item) item.status = item.status === "Ready" ? "Posted" : "Ready";
    return saveDb(db);
  }));
});

app.post("/api/support", async (req, res) => {
  res.json(await mutateDb(async (db) => {
    db.supportTickets.unshift({ id: crypto.randomUUID(), message: req.body.message, createdAt: new Date().toISOString() });
    return saveDb(db);
  }));
});

app.get("/api/export/all", async (_req, res) => {
  res.attachment("duitok-data.json").json(publicState(await ensureDb()));
});

app.get("/api/export/project/:id", async (req, res) => {
  const db = await ensureDb();
  res.attachment("project.json").json(findProject(db, req.params.id));
});

app.get("/api/export/result/:id", async (req, res) => {
  const db = await ensureDb();
  const result = db.projects.flatMap((project) => project.results).find((item) => item.id === req.params.id);
  res.attachment("result.txt").type("text/plain").send(`${result?.title || "Result"}\n\n${result?.body || ""}`);
});

app.get("/api/export/invoice/:id", async (req, res) => {
  const db = await ensureDb();
  const invoice = db.billing.invoices.find((item) => item.id === req.params.id);
  res.attachment("invoice.txt").type("text/plain").send(`Duitok  AI Invoice\n${invoice?.id || req.params.id}\nAmount: RM${invoice?.amount || 0}`);
});

app.get("/api/export/sop", (_req, res) => {
  res.attachment("sop.txt").type("text/plain").send("Duitok  AI Image SOP\n1. Upload avatar.\n2. Upload product.\n3. Select model.\n4. Write prompt.\n5. Generate and export.");
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Server error" });
});

if (process.env.NODE_ENV === "production" && serveStatic) {
  app.use(express.static(distDir));
  app.use((_req, res) => {
    createReadStream(path.join(distDir, "index.html")).pipe(res);
  });
} else if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Duitok  AI running on http://localhost:${port}`);
});
