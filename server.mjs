import "dotenv/config";
import crypto from "node:crypto";
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
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
const autoPostExtensionDir = path.join(root, "public", "duitok-autopost-extension");
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
const tiktokAuthBaseUrl = (process.env.TIKTOK_AUTH_BASE_URL || "https://www.tiktok.com").replace(/\/$/, "");
const tiktokOpenApiBaseUrl = (process.env.TIKTOK_OPEN_API_BASE_URL || "https://open.tiktokapis.com").replace(/\/$/, "");
const tiktokRedirectPath = process.env.TIKTOK_REDIRECT_PATH || "/api/tiktok/oauth/callback";
const tiktokScopes = process.env.TIKTOK_SCOPES || "user.info.basic,video.publish";
const wuyinBaseUrl = (process.env.WUYIN_BASE_URL || "https://api.wuyinkeji.com").replace(/\/$/, "");
const wuyinImagePaths = {
  "Veo 3.1": "/api/async/video_veo3.1_fast",
  "Sora 2": "/api/async/video_sora2",
  "Gemini Omni": "/api/async/video_google_omni",
  "Grok Imagine Video": "/api/async/video_grok_imagine"
};
const wuyinVideoModel = process.env.WUYIN_VIDEO_MODEL || "veo3.1-fast";
const grsaiBaseUrl = (process.env.GRSAI_BASE_URL || "https://grsaiapi.com").replace(/\/$/, "");
const grsaiDrawPath = process.env.GRSAI_DRAW_PATH || "/v1/draw/nano-banana";
const grsaiResultPath = process.env.GRSAI_RESULT_PATH || "/v1/draw/result";
const grsaiNanoModel = process.env.GRSAI_NANO_MODEL || "nano-banana-pro";
const atlasBaseUrl = (process.env.ATLASCLOUD_BASE_URL || "https://api.atlascloud.ai").replace(/\/$/, "");
const atlasGenerateVideoPath = process.env.ATLASCLOUD_GENERATE_VIDEO_PATH || "/api/v1/model/generateVideo";
const atlasPredictionPathPrefix = process.env.ATLASCLOUD_PREDICTION_PATH_PREFIX || "/api/v1/model/prediction";
const atlasSeedanceModel = process.env.ATLASCLOUD_SEEDANCE_MODEL || "bytedance/seedance-2.0/text-to-video";
const allowedMediaModels = new Set(["GPT Image 2", "Nano Banana Pro", "Seedance 2.0", "Veo 3.1", "Sora 2", "Gemini Omni", "Grok Imagine Video"]);
const publicMediaModelMap = {
  "Duitok Image": "GPT Image 2",
  "Duitok Image Pro": "Nano Banana Pro",
  "Duitok Video": "Seedance 2.0",
  "Duitok Video Plus": "Veo 3.1",
  "Duitok Story Video": "Sora 2",
  "Duitok Omni Video": "Gemini Omni",
  "Duitok Motion Video": "Grok Imagine Video"
};
const internalMediaModelMap = Object.fromEntries(Object.entries(publicMediaModelMap).map(([label, model]) => [model, label]));
const adminUserId = "u_1";
const authSecret = process.env.AUTH_SECRET || process.env.CHIP_API_TOKEN || "duitok-local-dev-secret";
const assetStorageProvider = process.env.ASSET_STORAGE_PROVIDER || "external";
const r2Endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
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
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.startsWith("chrome-extension://"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Signature");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (/^\/api\/(?:state|export|admin|media|agent|projects)/.test(req.path)) {
    res.setHeader("Cache-Control", "no-store");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({
  verify: (req, _res, buffer) => {
    req.rawBody = buffer;
  }
}));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "duitok-ai",
    storage: postgresPool ? "postgres" : "json",
    generation: "available"
  });
});

function defaultBilling() {
  return {
    plan: "Duitok AI Pro",
    credits: 83,
    nextBill: "2026-06-26",
    invoices: []
  };
}

function defaultModelCosts() {
  return {
    "GPT Image 2": { costRm: 0.024, costUsd: 0.006, unit: "image" },
    "Nano Banana Pro": { costRm: 0.105, costRmb: 0.18, unit: "image" },
    "Seedance 2.0": { costRm: 0.48, costUsd: 0.4, unit: "4s video" },
    "Veo 3.1": { costRm: 0.234, costRmb: 0.4, unit: "8s video" },
    "Sora 2": { costRm: 0.093, costRmb: 0.16, unit: "8s video" },
    "Gemini Omni": { costRm: 0.584, costRmb: 1, unit: "10s video" },
    "Grok Imagine Video": { costRm: 0.292, costRmb: 0.5, unit: "10s video" }
  };
}

function defaultAgentPermissions() {
  return {
    generate: true,
    updateProject: true,
    schedule: true,
    publish: true,
    support: true,
    billing: false,
    admin: false
  };
}

function storageStatus() {
  const r2Ready = Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_PUBLIC_BASE_URL && r2Endpoint);
  return {
    provider: r2Ready ? "cloudflare-r2" : assetStorageProvider,
    ready: assetStorageProvider === "external" || r2Ready,
    durableAssets: r2Ready,
    message: r2Ready ? "Generated assets can be mirrored to your own CDN." : "Using provider URLs until R2 credentials are configured."
  };
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function sha256(value, encoding = "hex") {
  return crypto.createHash("sha256").update(value).digest(encoding);
}

function r2SigningKey(dateStamp) {
  const dateKey = hmac(`AWS4${process.env.R2_SECRET_ACCESS_KEY}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function r2ObjectUrl(key) {
  return `${String(process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function extensionFromContentType(contentType, fallbackUrl = "") {
  const cleanType = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (cleanType === "image/jpeg") return "jpg";
  if (cleanType === "image/png") return "png";
  if (cleanType === "image/webp") return "webp";
  if (cleanType === "image/gif") return "gif";
  if (cleanType === "video/mp4") return "mp4";
  if (cleanType === "video/webm") return "webm";
  const match = String(fallbackUrl).split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() || "bin";
}

async function putR2Object(key, bytes, contentType) {
  const bucket = process.env.R2_BUCKET;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !accessKey || !secretKey || !r2Endpoint) throw Object.assign(new Error("R2 storage is not configured."), { status: 503 });

  const endpoint = new URL(r2Endpoint);
  const objectPath = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(bytes);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${endpoint.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n") + "\n";
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", objectPath, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = hmac(r2SigningKey(dateStamp), stringToSign, "hex");
  const response = await fetch(`${endpoint.origin}${objectPath}`, {
    method: "PUT",
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "Content-Type": contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate
    },
    body: bytes
  });
  if (!response.ok) {
    const error = new Error(`R2 upload failed: ${response.status} ${await response.text().catch(() => "")}`.trim());
    error.status = 502;
    throw error;
  }
  return r2ObjectUrl(key);
}

async function mirrorAssetToStorage(sourceUrl, { userId, projectId, resultId, type }) {
  const status = storageStatus();
  if (!sourceUrl || !status.durableAssets) return { url: sourceUrl, originalUrl: sourceUrl, storage: "external" };
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Asset download failed: ${response.status}`);
    const contentType = response.headers.get("content-type") || (type === "video" ? "video/mp4" : "image/png");
    const bytes = Buffer.from(await response.arrayBuffer());
    const extension = extensionFromContentType(contentType, sourceUrl);
    const key = [
      "generated-assets",
      userId,
      projectId,
      `${resultId}.${extension}`
    ].map((part) => String(part).replace(/[^a-zA-Z0-9._-]/g, "-")).join("/");
    return {
      url: await putR2Object(key, bytes, contentType),
      originalUrl: sourceUrl,
      storage: "cloudflare-r2",
      storageKey: key,
      bytes: bytes.length,
      contentType
    };
  } catch (error) {
    console.error("R2 asset mirror failed", error);
    return { url: sourceUrl, originalUrl: sourceUrl, storage: "external", storageError: error.message };
  }
}

function blankProject(id, name, userId = adminUserId) {
  return {
    id,
    userId,
    name,
    createdAt: new Date().toISOString(),
    image: { model: "GPT Image 2", mode: "Create Image", duration: "8", prompt: "" },
    ugc: { avatar: "Malay female", voice: "BM Casual", length: "30 seconds", script: "Hook, product proof, objection, offer, CTA." },
    auto: { platform: "TikTok", batch: "7 posts", tone: "Viral hook", productUrl: "" },
    original: { brief: "Rewrite this into Duitok  AI style while keeping the product claim safe." },
    clone: { url: "", rules: "Keep structure, change product, rewrite hook, avoid copying exact words." },
    story: { arc: "Problem -> proof -> offer", market: "Malaysia TikTok Shop", notes: "" },
    viral: { url: "", depth: "Quick decode" },
    results: []
  };
}

function usage(action, credits, userId = adminUserId) {
  return { id: crypto.randomUUID(), userId, action, credits, createdAt: new Date().toISOString() };
}

function creditEntry(userId, type, credits, note, meta = {}) {
  return {
    id: crypto.randomUUID(),
    userId,
    type,
    credits,
    note,
    meta,
    createdAt: new Date().toISOString()
  };
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

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
    status: user.status || "active",
    agentPermissions: { ...defaultAgentPermissions(), ...(user.agentPermissions || {}) }
  };
}

function signAuthToken(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    role: user.role || "user",
    exp: Date.now() + Number(process.env.AUTH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000)
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", authSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyAuthToken(token, db) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", authSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.exp && Date.now() > Number(data.exp)) return null;
  return db.users.find((user) => user.id === data.userId) || null;
}

async function requireAuth(req) {
  const db = await ensureDb();
  const token = String(req.get("authorization") || req.query.token || "").replace(/^Bearer\s+/i, "");
  const user = verifyAuthToken(token, db);
  if (!user) {
    const error = new Error("Login required.");
    error.status = 401;
    throw error;
  }
  if ((user.status || "active") === "suspended" && (user.role || "user") !== "admin") {
    const error = new Error("Account suspended. Please contact support.");
    error.status = 403;
    throw error;
  }
  return { db, user };
}

function requireAdminUser(user) {
  const allowedAdminIds = (process.env.ADMIN_USER_IDS || adminUserId).split(",").map((item) => item.trim()).filter(Boolean);
  if ((user.role || "user") !== "admin" || !allowedAdminIds.includes(user.id)) {
    const error = new Error("Admin access required.");
    error.status = 403;
    throw error;
  }
}

const seed = {
  users: [{ id: adminUserId, email: "admin@duitok.com", passwordHash: hashPassword("duitok123"), name: "Duitok AI Admin", role: "admin", billing: defaultBilling() }],
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
    {
      id: "s_1",
      title: "Serum soft sell",
      platform: "TikTok",
      time: "Tue 20:30",
      status: "Ready",
      caption: "POV kulit nampak kusam walaupun dah pakai skincare. Ini cara soft sell serum tanpa overclaim.",
      hashtags: "#tiktokshopmalaysia #skincaremalaysia #duitok",
      mediaUrl: "",
      productUrl: ""
    },
    {
      id: "s_2",
      title: "Lunchbox proof video",
      platform: "TikTok",
      time: "Wed 12:15",
      status: "Draft",
      caption: "Test lunchbox leakproof sebelum bawa pergi kerja. Simple proof, terus nampak value.",
      hashtags: "#tiktokshop #malaysiaseller #lunchbox",
      mediaUrl: "",
      productUrl: ""
    },
    {
      id: "s_3",
      title: "Wireless mic review",
      platform: "TikTok",
      time: "Fri 21:00",
      status: "Ready",
      caption: "Before vs after audio test untuk seller yang selalu shoot content sendiri.",
      hashtags: "#contentcreator #wirelessmic #duitok",
      mediaUrl: "",
      productUrl: ""
    }
  ],
  tiktok: {
    connections: [],
    oauthStates: [],
    publishes: []
  },
  supportTickets: []
};

function normalizeDb(db) {
  db.users ||= structuredClone(seed.users);
  db.users = db.users.map((user) => ({
    ...user,
    role: user.id === adminUserId || user.email === "admin@duitok.com" ? "admin" : user.role || "user",
    status: user.status || "active",
    billing: { ...defaultBilling(), ...(user.billing || {}) },
    agentPermissions: { ...defaultAgentPermissions(), ...(user.agentPermissions || {}) }
  }));
  if (!db.users.some((user) => user.email === "admin@duitok.com")) db.users.unshift(structuredClone(seed.users[0]));
  db.liveCount ||= seed.liveCount;
  db.projects ||= structuredClone(seed.projects);
  db.projects = db.projects.map((project) => ({ userId: project.userId || adminUserId, ...project }));
  db.attachments ||= [];
  db.attachments = db.attachments.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.billing ||= structuredClone(seed.billing);
  db.payments ||= [];
  db.payments = db.payments.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.affiliate ||= structuredClone(seed.affiliate);
  db.usage ||= structuredClone(seed.usage);
  db.usage = db.usage.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.schedule ||= structuredClone(seed.schedule);
  db.schedule = db.schedule.map((item, index) => ({
    userId: item.userId || adminUserId,
    caption: item.caption || `${item.title || `Post ${index + 1}`}\n\nGenerated with Duitok AI.`,
    hashtags: item.hashtags || "#duitok #tiktokshopmalaysia",
    mediaUrl: item.mediaUrl || "",
    productUrl: item.productUrl || "",
    ...item
  }));
  db.tiktok ||= structuredClone(seed.tiktok);
  db.tiktok.connections ||= [];
  db.tiktok.connections = db.tiktok.connections.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.tiktok.oauthStates ||= [];
  db.tiktok.publishes ||= [];
  db.tiktok.publishes = db.tiktok.publishes.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.supportTickets ||= [];
  db.supportTickets = db.supportTickets.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.generationJobs ||= [];
  db.apiCalls ||= [];
  db.creditLedger ||= [];
  db.creditLedger = db.creditLedger.map((item) => ({ userId: item.userId || adminUserId, ...item }));
  db.modelCosts = { ...defaultModelCosts(), ...(db.modelCosts || {}) };
  db.storage ||= storageStatus();
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
    const db = normalizeDb(structuredClone(seed));
    await writeFile(dbPath, JSON.stringify(db, null, 2));
    return db;
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

const providerLeakPatterns = [
  /\bAPIMart\b/gi,
  /\bGRS AI\b/gi,
  /\bGRSAI\b/gi,
  /\bAtlas Cloud\b/gi,
  /速创API/gi,
  /\bWuyin\b/gi,
  /无垠科技/gi,
  /\bGPT Image 2\b/gi,
  /\bNano Banana Pro\b/gi,
  /\bSeedance 2\.0\b/gi,
  /\bVeo 3\.1\b/gi,
  /\bSora 2\b/gi,
  /\bGemini Omni\b/gi,
  /\bGrok Imagine Video\b/gi
];

function publicGenerationTitle(type = "text") {
  if (type === "video") return "Duitok AI Video";
  if (type === "image") return "Duitok AI Image";
  return "Duitok AI Result";
}

function publicGenerationBody(type = "text") {
  if (type === "video") return "Video generated with Duitok AI.";
  if (type === "image") return "Image generated with Duitok AI.";
  return "Generated with Duitok AI.";
}

function publicGenerationError() {
  return "Generation failed. Please try again or contact support if it keeps happening.";
}

function internalMediaModel(model) {
  return publicMediaModelMap[model] || model || "GPT Image 2";
}

function publicMediaModel(model) {
  return internalMediaModelMap[internalMediaModel(model)] || model || "Duitok Image";
}

function isVideoMediaModel(model) {
  return ["Seedance 2.0", "Veo 3.1", "Sora 2", "Gemini Omni", "Grok Imagine Video"].includes(internalMediaModel(model));
}

function redactProviderText(value, fallback = "") {
  let text = String(value || fallback || "");
  if (!text) return text;
  text = text.replace(/Task ID:\s*[^\n]+/gi, "Reference ID hidden");
  for (const pattern of providerLeakPatterns) text = text.replace(pattern, "Duitok AI");
  return text.replace(/Duitok AI\s+Duitok AI/gi, "Duitok AI").replace(/\n{3,}/g, "\n\n").trim();
}

function safeLedgerMetadata(metadata = {}) {
  const {
    model: _model,
    provider: _provider,
    providerTaskId: _providerTaskId,
    taskId: _taskId,
    endpoint: _endpoint,
    originalImageUrl: _originalImageUrl,
    originalVideoUrl: _originalVideoUrl,
    ...safe
  } = metadata || {};
  return safe;
}

function publicMediaMarker(value) {
  return value ? "duitok-media-ready" : undefined;
}

function publicState(db, user = db.users?.find((item) => item.id === adminUserId)) {
  const isAdmin = (user?.role || "user") === "admin";
  const owns = (item) => isAdmin || item.userId === user.id;
  const userBilling = user?.billing || defaultBilling();
  const sanitizeResult = (result) => {
    if (isAdmin) return result;
    const {
      costRm: _costRm,
      costRmb: _costRmb,
      costUsd: _costUsd,
      originalImageUrl: _originalImageUrl,
      originalVideoUrl: _originalVideoUrl,
      assetStorageKey: _assetStorageKey,
      assetStorageError: _assetStorageError,
      taskId: _taskId,
      providerTaskId: _providerTaskId,
      provider: _provider,
      model: _model,
      providerTitle: _providerTitle,
      providerBody: _providerBody,
      ...safe
    } = result;
    const publicType = safe.videoUrl ? "video" : safe.imageUrl ? "image" : safe.type;
    return {
      ...safe,
      imageUrl: publicMediaMarker(safe.imageUrl),
      videoUrl: publicMediaMarker(safe.videoUrl),
      title: redactProviderText(safe.title, publicGenerationTitle(publicType)),
      body: redactProviderText(safe.body, publicGenerationBody(publicType))
    };
  };
  const sanitizeProject = (project) => ({
    ...project,
    image: {
      ...(project.image || {}),
      model: publicMediaModel(project.image?.model)
    },
    results: (project.results || []).map(sanitizeResult)
  });
  const sanitizeJob = (job) => {
    if (isAdmin) return job;
    const {
      costRm: _costRm,
      costRmb: _costRmb,
      costUsd: _costUsd,
      provider: _provider,
      endpoint: _endpoint,
      model: _model,
      taskId: _taskId,
      providerTaskId: _providerTaskId,
      providerTextOutput: _providerTextOutput,
      providerErrorMessage: _providerErrorMessage,
      originalImageUrl: _originalImageUrl,
      originalVideoUrl: _originalVideoUrl,
      assetStorageKey: _assetStorageKey,
      assetStorageError: _assetStorageError,
      ...safe
    } = job;
    return {
      ...safe,
      imageUrl: publicMediaMarker(safe.imageUrl),
      videoUrl: publicMediaMarker(safe.videoUrl),
      textOutput: redactProviderText(safe.textOutput, publicGenerationBody(safe.type)),
      errorMessage: safe.status === "failed" ? publicGenerationError() : redactProviderText(safe.errorMessage || "")
    };
  };
  const sanitizeSchedule = (item) => isAdmin ? item : ({
    ...item,
    mediaUrl: item.mediaUrl ? "duitok-media-ready" : "",
    caption: redactProviderText(item.caption || ""),
    title: redactProviderText(item.title || "")
  });
  const sanitizePublish = (item) => isAdmin ? item : ({
    id: item.id,
    userId: item.userId,
    scheduleId: item.scheduleId,
    connectionId: item.connectionId,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  });
  const sanitizeUsage = (item) => isAdmin ? item : ({ ...item, action: redactProviderText(item.action, "Duitok generation") });
  const sanitizeCreditLedger = (item) => isAdmin ? item : ({
    ...item,
    note: redactProviderText(item.note, item.type),
    metadata: safeLedgerMetadata(item.metadata)
  });
  const projects = (db.projects || []).filter(owns).map(sanitizeProject);
  const usageRows = (db.usage || []).filter(owns).map(sanitizeUsage);
  const scheduleRows = (db.schedule || []).filter(owns).map(sanitizeSchedule);
  const generationJobs = (db.generationJobs || []).filter(owns).map(sanitizeJob);
  const apiCalls = isAdmin ? (db.apiCalls || []).filter(owns) : [];
  const payments = (db.payments || []).filter(owns);
  const supportTickets = (db.supportTickets || []).filter(owns);
  const attachments = (db.attachments || []).filter(owns);
  const creditLedger = (db.creditLedger || []).filter(owns).map(sanitizeCreditLedger);
  const tiktokConnections = (db.tiktok?.connections || []).filter(owns);
  const tiktokPublishes = (db.tiktok?.publishes || []).filter(owns).map(sanitizePublish);
  const userRevenue = (userId) => db.payments.filter((payment) => payment.userId === userId && payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const userCost = (userId) => db.generationJobs.filter((job) => job.userId === userId).reduce((sum, job) => sum + Number(job.costRm || 0), 0);
  const userLastUsed = (userId) => {
    const timestamps = [
      ...db.generationJobs.filter((job) => job.userId === userId).map((job) => job.completedAt || job.createdAt),
      ...db.usage.filter((item) => item.userId === userId).map((item) => item.createdAt)
    ].filter(Boolean).sort().reverse();
    return timestamps[0] || null;
  };
  const admin = isAdmin ? {
    users: db.users.map((item) => ({
      ...publicUser(item),
      billing: item.billing || defaultBilling(),
      projectCount: db.projects.filter((project) => project.userId === item.id).length,
      generationCount: db.generationJobs.filter((job) => job.userId === item.id).length,
      totalRevenueRm: userRevenue(item.id),
      totalCostRm: userCost(item.id),
      totalProfitRm: userRevenue(item.id) - userCost(item.id),
      lastUsedAt: userLastUsed(item.id)
    })),
    generationJobs: db.generationJobs || [],
    apiCalls: db.apiCalls || [],
    payments: db.payments || [],
    supportTickets: db.supportTickets || [],
    creditLedger: db.creditLedger || [],
    modelCosts: db.modelCosts || defaultModelCosts(),
    storage: storageStatus(),
    totals: {
      users: db.users.length,
      generations: db.generationJobs.length,
      costRm: db.generationJobs.reduce((sum, job) => sum + Number(job.costRm || 0), 0),
      revenueRm: db.payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      failedCalls: db.apiCalls.filter((call) => call.status === "failed").length
    }
  } : null;
  return {
    liveCount: db.liveCount,
    projects,
    attachments,
    billing: userBilling,
    payments,
    affiliate: db.affiliate,
    usage: usageRows,
    schedule: scheduleRows,
    generationJobs,
    apiCalls,
    creditLedger,
    supportTickets,
    currentUser: user ? publicUser(user) : null,
    admin,
    storage: isAdmin ? storageStatus() : { durableAssets: storageStatus().durableAssets },
    tiktok: {
      connections: tiktokConnections.map((item) => ({
        id: item.id,
        openId: item.openId,
        unionId: item.unionId,
        displayName: item.displayName,
        avatarUrl: item.avatarUrl,
        scopes: item.scopes,
        expiresAt: item.expiresAt,
        connectedAt: item.connectedAt,
        creatorInfo: item.creatorInfo || null
      })),
      publishes: tiktokPublishes
    }
  };
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

function findProject(db, id, user) {
  const project = db.projects.find((item) => item.id === id);
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }
  if (user && (user.role || "user") !== "admin" && project.userId !== user.id) {
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

function resultTypeForGeneration(action, step, generated = {}) {
  if (action === "generate-image") {
    if (generated.videoUrl) return "video";
    return "image";
  }
  const normalized = String(step || "").toLowerCase();
  if (["image", "ugc", "auto", "original", "clone", "story", "viral"].includes(normalized)) return normalized;
  return normalized || "text";
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
  model = internalMediaModel(model);
  if (model === "GPT Image 2") return process.env.APIMART_API_KEY ? "apimart" : "mock";
  if (model === "Nano Banana Pro") return process.env.GRSAI_API_KEY ? "grsai" : "mock";
  if (model === "Seedance 2.0") return process.env.ATLASCLOUD_API_KEY ? "atlascloud" : "mock";
  if (model === "Veo 3.1" || model === "Sora 2" || model === "Gemini Omni" || model === "Grok Imagine Video") return process.env.WUYIN_API_KEY ? "wuyin" : "mock";
  return "unsupported";
}

function generationCostFor(db, project, action, generated) {
  const model = internalMediaModel(project.image?.model);
  const provider = generated.provider || providerForMediaModel(model);
  if (action !== "generate-image") return { costRm: 0.01, costRmb: 0, costUsd: 0, model: "APIMart Text", provider: "apimart", unit: "text" };
  const costs = { ...defaultModelCosts(), ...(db.modelCosts || {}) };
  return { model, provider, ...(costs[model] || { costRm: 0, costRmb: 0, unit: "unknown" }) };
}

function videoDurationFor(project, model = project.image?.model) {
  model = internalMediaModel(model);
  if (model === "Seedance 2.0") return Number(project.image?.duration || process.env.ATLASCLOUD_SEEDANCE_DURATION || 4);
  if (model === "Sora 2") return Number(project.image?.duration || process.env.WUYIN_SORA_DURATION || 8);
  if (model === "Gemini Omni") return 10;
  if (model === "Grok Imagine Video") return Number(project.image?.duration || process.env.WUYIN_GROK_DURATION || 8);
  if (model === "Veo 3.1") return 8;
  return 0;
}

function roundCredits(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function creditChargeFor(project, action) {
  if (action !== "generate-image") return 0.1;
  const model = internalMediaModel(project.image?.model);
  if (model === "GPT Image 2") return 0.1;
  if (model === "Nano Banana Pro") return 0.2;
  if (model === "Seedance 2.0") return roundCredits(videoDurationFor(project, model) * 0.1);
  if (model === "Veo 3.1") return 0.4;
  if (model === "Sora 2") return roundCredits(videoDurationFor(project, model) * 0.06);
  if (model === "Gemini Omni") return 1.3;
  if (model === "Grok Imagine Video") return roundCredits(videoDurationFor(project, model) * 0.06);
  return 0.1;
}

function assertGenerationAccess(db, user, requiredCredits = 0.1) {
  if ((user.role || "user") === "admin") return;

  user.billing ||= defaultBilling();
  if (Number(user.billing.credits || 0) < requiredCredits) {
    const error = new Error("Not enough credits. Please top up before generating.");
    error.status = 402;
    throw error;
  }

  const now = Date.now();
  const perMinuteLimit = Number(process.env.USER_GENERATE_PER_MINUTE || 3);
  const perDayLimit = Number(process.env.USER_GENERATE_PER_DAY || 50);
  const userJobs = (db.generationJobs || []).filter((job) => job.userId === user.id);
  const inLastMinute = userJobs.filter((job) => Date.parse(job.createdAt || 0) > now - 60 * 1000).length;
  const inLastDay = userJobs.filter((job) => Date.parse(job.createdAt || 0) > now - 24 * 60 * 60 * 1000).length;

  if (inLastMinute >= perMinuteLimit || inLastDay >= perDayLimit) {
    const error = new Error("Too many generations. Please wait a moment and try again.");
    error.status = 429;
    throw error;
  }
}

function requireAgentPermission(user, permission) {
  if ((user.role || "user") === "admin") return;
  const permissions = { ...defaultAgentPermissions(), ...(user.agentPermissions || {}) };
  if (!permissions[permission]) {
    const error = new Error(`Duitok Agent does not have ${permission} permission for this account.`);
    error.status = 403;
    throw error;
  }
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

function hasDeepSeekConfig() {
  return Boolean(process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes("replace_with"));
}

function requireTikTokConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret || clientKey.includes("replace_with") || clientSecret.includes("replace_with")) {
    const error = new Error("TikTok belum configure. Isi TIKTOK_CLIENT_KEY dan TIKTOK_CLIENT_SECRET dalam Environment Variables dulu.");
    error.status = 503;
    throw error;
  }
  return { clientKey, clientSecret };
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

async function tiktokRequest(pathname, { method = "GET", body, accessToken, headers = {} } = {}) {
  const response = await fetch(`${tiktokOpenApiBaseUrl}${pathname}`, {
    method,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(body instanceof URLSearchParams ? { "Content-Type": "application/x-www-form-urlencoded" } : { "Content-Type": "application/json; charset=UTF-8" }),
      ...headers
    },
    body: body instanceof URLSearchParams ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(Number(process.env.TIKTOK_TIMEOUT_MS || 120000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.error && payload.error.code && payload.error.code !== "ok")) {
    const error = new Error(payload.error?.message || payload.message || `TikTok request failed (${response.status})`);
    error.status = response.status || 502;
    error.payload = payload;
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

function requireAtlasConfig() {
  const apiKey = process.env.ATLASCLOUD_API_KEY;
  if (!apiKey || apiKey.includes("replace_with")) {
    const error = new Error("Atlas Cloud belum configure. Isi ATLASCLOUD_API_KEY dalam Render Environment Variables dulu.");
    error.status = 503;
    throw error;
  }
  return apiKey;
}

function requireGrsaiConfig() {
  const apiKey = process.env.GRSAI_API_KEY;
  if (!apiKey || apiKey.includes("replace_with")) {
    const error = new Error("GRS AI belum configure. Isi GRSAI_API_KEY dalam Render Environment Variables dulu.");
    error.status = 503;
    throw error;
  }
  return apiKey;
}

function parseJsonishPayload(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const parsedLines = text
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^data:\s*/, ""))
      .filter((line) => line && line !== "[DONE]")
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return parsedLines.at(-1) || { raw: text };
  }
}

async function grsaiRequest(pathname, { method = "POST", body } = {}) {
  const apiKey = requireGrsaiConfig();
  const response = await fetch(`${grsaiBaseUrl}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(Number(process.env.GRSAI_TIMEOUT_MS || 120000))
  });
  const payload = parseJsonishPayload(await response.text());
  if (!response.ok || (payload.code && payload.code !== 0)) {
    const error = new Error(payload.msg || payload.message || payload.error || `GRS AI request failed (${response.status})`);
    error.status = response.status || 502;
    throw error;
  }
  return payload;
}

async function atlasRequest(pathname, { method = "POST", body } = {}) {
  const apiKey = requireAtlasConfig();
  const response = await fetch(`${atlasBaseUrl}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(Number(process.env.ATLASCLOUD_TIMEOUT_MS || 120000))
  });
  const text = await response.text();
  const payload = parseJsonishPayload(text);
  if (!response.ok || payload.error || payload.message?.toLowerCase?.().includes("error")) {
    const error = new Error(payload.error || payload.message || payload.msg || `Atlas Cloud request failed (${response.status})`);
    error.status = response.status || 502;
    throw error;
  }
  return payload;
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
  return process.env.APIMART_IMAGE_MODEL || modelMap[internalMediaModel(project.image?.model)] || apimartImageModel;
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

function flattenUrlValues(value) {
  const urls = [];
  const visit = (item) => {
    if (!item) return;
    if (typeof item === "string") {
      if (/^https?:\/\//i.test(item)) urls.push(item);
      return;
    }
    if (Array.isArray(item)) return item.forEach(visit);
    if (typeof item === "object") Object.values(item).forEach(visit);
  };
  visit(value);
  return urls;
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
  return wuyinImagePaths[internalMediaModel(project.image?.model)] || process.env.WUYIN_IMAGE_PATH || "/api/async/image_nanoBanana_pro";
}

function grsaiImageBody(prompt) {
  return {
    model: grsaiNanoModel,
    prompt,
    aspectRatio: process.env.GRSAI_NANO_ASPECT_RATIO || process.env.WUYIN_IMAGE_ASPECT_RATIO || "1:1",
    imageSize: process.env.GRSAI_NANO_IMAGE_SIZE || process.env.WUYIN_IMAGE_SIZE || "1K",
    shutProgress: true
  };
}

function wuyinImageBody(project, prompt) {
  const model = internalMediaModel(project.image?.model);
  const aspectRatio = process.env.WUYIN_IMAGE_ASPECT_RATIO || "1:1";
  const imageSize = process.env.WUYIN_IMAGE_SIZE || "1K";
  if (model === "Veo 3.1") {
    return {
      prompt,
      aspectRatio: process.env.WUYIN_VIDEO_RATIO || "9:16",
      size: process.env.WUYIN_VEO_SIZE || "720p"
    };
  }
  if (model === "Sora 2") {
    return {
      prompt,
      aspectRatio: process.env.WUYIN_SORA_ASPECT_RATIO || process.env.WUYIN_VIDEO_RATIO || "9:16",
      duration: String(videoDurationFor(project, model)),
      size: process.env.WUYIN_SORA_SIZE || "small"
    };
  }
  if (model === "Gemini Omni") {
    return {
      prompt,
      duration: process.env.WUYIN_OMNI_DURATION || "10",
      size: process.env.WUYIN_OMNI_SIZE || "720x1280"
    };
  }
  if (model === "Grok Imagine Video") {
    return {
      prompt,
      duration: String(videoDurationFor(project, model)),
      aspect_ratio: process.env.WUYIN_GROK_ASPECT_RATIO || process.env.WUYIN_VIDEO_RATIO || "9:16"
    };
  }
  return { prompt, size: imageSize, aspectRatio };
}

function atlasSeedanceBody(project, prompt) {
  const aspectRatio = process.env.ATLASCLOUD_SEEDANCE_ASPECT_RATIO || process.env.WUYIN_VIDEO_RATIO || "9:16";
  const [width, height] = aspectRatio === "1:1"
    ? [1024, 1024]
    : aspectRatio === "16:9"
      ? [1280, 720]
      : [720, 1280];
  return {
    model: atlasSeedanceModel,
    prompt,
    width: Number(process.env.ATLASCLOUD_SEEDANCE_WIDTH || width),
    height: Number(process.env.ATLASCLOUD_SEEDANCE_HEIGHT || height),
    duration: videoDurationFor(project, "Seedance 2.0"),
    fps: Number(process.env.ATLASCLOUD_SEEDANCE_FPS || 24),
    watermark: process.env.ATLASCLOUD_SEEDANCE_WATERMARK === "true",
    return_last_frame: false
  };
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

async function pollGrsaiTask(taskId) {
  const maxAttempts = Number(process.env.GRSAI_IMAGE_POLL_ATTEMPTS || 36);
  const delayMs = Number(process.env.GRSAI_IMAGE_POLL_MS || 3000);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const payload = await grsaiRequest(grsaiResultPath, { body: { id: taskId } });
    const data = payload.data || payload;
    const status = String(data.status || payload.status || "").toLowerCase();
    if (data.progress >= 100 || ["succeeded", "success", "completed"].includes(status)) return payload;
    if (["failed", "error", "cancelled"].includes(status) || data.failure_reason || data.error) {
      const error = new Error(data.failure_reason || data.error || payload.msg || `GRS AI image task ${status || "failed"}`);
      error.status = 502;
      throw error;
    }
  }
  const error = new Error("GRS AI image task is still processing. Please try again later.");
  error.status = 202;
  throw error;
}

async function pollAtlasPrediction(predictionId) {
  const maxAttempts = Number(process.env.ATLASCLOUD_POLL_ATTEMPTS || 60);
  const delayMs = Number(process.env.ATLASCLOUD_POLL_MS || 5000);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const payload = await atlasRequest(`${atlasPredictionPathPrefix}/${encodeURIComponent(predictionId)}`, { method: "GET" });
    const data = payload.data || payload;
    const status = String(data.status || payload.status || "").toLowerCase();
    if (["completed", "succeeded", "success"].includes(status)) return payload;
    if (["failed", "error", "cancelled", "canceled"].includes(status)) {
      const error = new Error(data.error || data.message || payload.error || payload.message || `Atlas Cloud Seedance task ${status || "failed"}`);
      error.status = 502;
      throw error;
    }
  }
  const error = new Error("Atlas Cloud Seedance task is still processing. Please try again later.");
  error.status = 202;
  throw error;
}

function extractAtlasOutputs(taskData) {
  const data = taskData.data || taskData;
  const outputs = Array.isArray(data.outputs) ? data.outputs : [];
  return [...new Set([...flattenUrlValues(outputs), ...extractUrlsDeep(taskData)])];
}

function extractGrsaiUrls(taskData) {
  const data = taskData.data || taskData;
  const resultUrls = Array.isArray(data.results)
    ? data.results.flatMap((result) => flattenUrlValues(result?.url || result?.image_url || result?.imageUrl || result?.output)).filter(Boolean)
    : [];
  return [...new Set([...resultUrls, ...extractUrlsDeep(taskData)])];
}

async function generateImageWithGrsai(project) {
  const prompt = [
    project.image?.prompt || "Create a high-converting TikTok Shop product image.",
    `Mode: ${project.image?.mode || "Create Image"}.`,
    "Style: realistic commercial product scene, clear product focus, vertical-social friendly, no fake brand claims."
  ].join("\n");
  const payload = await grsaiRequest(grsaiDrawPath, {
    body: grsaiImageBody(prompt)
  });
  const data = payload.data || payload;
  const taskId = data.id || data.task_id || payload.id || payload.task_id;
  if (!taskId) return { text: JSON.stringify(payload, null, 2), urls: extractGrsaiUrls(payload) };
  const taskData = await pollGrsaiTask(taskId);
  const urls = extractGrsaiUrls(taskData);
  return {
    text: urls.length ? `Image generated with GRS AI.\n\nTask ID: ${taskId}` : `Image task completed with GRS AI.\n\nTask ID: ${taskId}`,
    urls,
    taskId
  };
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

async function generateVideoWithAtlasSeedance(project) {
  const prompt = [
    project.image?.prompt || "Create a high-converting TikTok Shop product video.",
    `Mode: ${project.image?.mode || "Create Video"}.`,
    "Style: realistic short-form ecommerce video, native-looking TikTok Shop pacing, clear product focus, no fake brand claims."
  ].join("\n");
  const payload = await atlasRequest(atlasGenerateVideoPath, {
    body: atlasSeedanceBody(project, prompt)
  });
  const data = payload.data || payload;
  const predictionId = data.id || data.prediction_id || payload.id || payload.prediction_id;
  if (!predictionId) return { text: JSON.stringify(payload, null, 2), urls: extractAtlasOutputs(payload) };
  const taskData = await pollAtlasPrediction(predictionId);
  const urls = extractAtlasOutputs(taskData);
  return {
    text: urls.length ? `Video generated with Atlas Cloud Seedance 2.0.\n\nTask ID: ${predictionId}` : `Seedance 2.0 task completed with Atlas Cloud.\n\nTask ID: ${predictionId}`,
    urls,
    taskId: predictionId
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
    const model = internalMediaModel(project.image?.model);
    if (!allowedMediaModels.has(model)) {
      const error = new Error("This Duitok plan only supports GPT Image 2, Nano Banana Pro, Seedance 2.0, Veo 3.1, Sora 2, Gemini Omni, and Grok Imagine Video.");
      error.status = 400;
      throw error;
    }
    const provider = providerForMediaModel(model);
    if (provider === "atlascloud" && model === "Seedance 2.0") {
      const video = await generateVideoWithAtlasSeedance(project);
      return { title: "Atlas Cloud Seedance 2.0", body: video.text, videoUrl: video.urls[0], taskId: video.taskId, provider: "atlascloud" };
    }
    if (provider === "wuyin" && (model === "Veo 3.1" || model === "Sora 2" || model === "Gemini Omni" || model === "Grok Imagine Video")) {
      const video = await generateVideoWithWuyin(project);
      return { title: `速创API ${model}`, body: video.text, videoUrl: video.urls[0], taskId: video.taskId, provider: "wuyin" };
    }
    if (provider === "grsai") {
      const image = await generateImageWithGrsai(project);
      return { title: "GRS AI Nano Banana Pro", body: image.text, imageUrl: image.urls[0], taskId: image.taskId, provider: "grsai" };
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

async function saveGeneratedResult(projectId, action, step, generated, user) {
  return mutateDb(async (currentDb) => {
    const project = findProject(currentDb, projectId, user);
    const cost = generationCostFor(currentDb, project, action, generated);
    const creditsToCharge = creditChargeFor(project, action);
    const resultId = crypto.randomUUID();
    const jobId = crypto.randomUUID();
    const assetType = generated.videoUrl ? "video" : generated.imageUrl ? "image" : "text";
    const publicTitle = publicGenerationTitle(assetType);
    const publicBody = publicGenerationBody(assetType);
    const mirrored = await mirrorAssetToStorage(generated.videoUrl || generated.imageUrl, {
      userId: project.userId,
      projectId,
      resultId,
      type: assetType
    });
    const result = {
      id: resultId,
      type: resultTypeForGeneration(action, step, generated),
      title: publicTitle,
      body: publicBody,
      providerTitle: generated.title,
      providerBody: generated.body,
      imageUrl: generated.imageUrl ? mirrored.url : undefined,
      videoUrl: generated.videoUrl ? mirrored.url : undefined,
      originalImageUrl: generated.imageUrl && mirrored.originalUrl !== mirrored.url ? mirrored.originalUrl : undefined,
      originalVideoUrl: generated.videoUrl && mirrored.originalUrl !== mirrored.url ? mirrored.originalUrl : undefined,
      assetStorage: mirrored.storage,
      assetStorageKey: mirrored.storageKey,
      assetStorageError: mirrored.storageError,
      taskId: generated.taskId,
      providerTaskId: generated.taskId,
      provider: generated.provider,
      model: internalMediaModel(project.image?.model),
      costRm: cost.costRm,
      createdAt: new Date().toISOString()
    };
    project.results.push(result);
    const owner = currentDb.users.find((item) => item.id === project.userId) || user;
    owner.billing ||= defaultBilling();
    owner.billing.credits = Math.max(0, roundCredits(Number(owner.billing.credits || 0) - creditsToCharge));
    const job = {
      id: jobId,
      userId: project.userId,
      projectId,
      resultId: result.id,
      action,
      step,
      type: assetType,
      status: "succeeded",
      taskId: generated.taskId,
      providerTaskId: generated.taskId,
      prompt: project.image?.prompt || "",
      imageUrl: result.imageUrl,
      videoUrl: result.videoUrl,
      originalImageUrl: result.originalImageUrl,
      originalVideoUrl: result.originalVideoUrl,
      assetStorage: result.assetStorage,
      assetStorageKey: result.assetStorageKey,
      assetStorageError: result.assetStorageError,
      textOutput: publicBody,
      providerTextOutput: generated.body,
      creditsCharged: creditsToCharge,
      createdAt: result.createdAt,
      completedAt: result.createdAt,
      ...cost
    };
    currentDb.generationJobs.unshift(job);
    currentDb.apiCalls.unshift({
      id: crypto.randomUUID(),
      userId: project.userId,
      projectId,
      generationJobId: job.id,
      provider: job.provider,
      model: job.model,
      endpoint: job.provider === "atlascloud" ? atlasGenerateVideoPath : job.provider === "grsai" ? grsaiDrawPath : job.provider === "wuyin" ? wuyinPathFromProject(project) : apimartImagePath,
      status: "succeeded",
      taskId: generated.taskId,
      costRm: job.costRm,
      createdAt: result.createdAt
    });
    currentDb.usage.unshift(usage(publicTitle, creditsToCharge, project.userId));
    currentDb.creditLedger.unshift(creditEntry(project.userId, "debit", -creditsToCharge, publicTitle, {
      projectId,
      resultId: result.id,
      generationJobId: job.id
    }));
    await saveDb(currentDb);
    return publicState(currentDb, user);
  });
}

async function saveFailedGeneration(projectId, action, step, error, user) {
  return mutateDb(async (currentDb) => {
    const project = findProject(currentDb, projectId, user);
    const cost = generationCostFor(currentDb, project, action, { provider: providerForMediaModel(project.image?.model) });
    const createdAt = new Date().toISOString();
    const job = {
      id: crypto.randomUUID(),
      userId: project.userId,
      projectId,
      action,
      step,
      type: action === "generate-image" && isVideoMediaModel(project.image?.model) ? "video" : action === "generate-image" ? "image" : "text",
      status: "failed",
      taskId: null,
      prompt: project.image?.prompt || "",
      creditsCharged: 0,
      errorMessage: publicGenerationError(),
      providerErrorMessage: error.message || "Generation failed",
      createdAt,
      completedAt: createdAt,
      model: cost.model,
      provider: cost.provider,
      unit: cost.unit
    };
    currentDb.generationJobs.unshift(job);
    currentDb.apiCalls.unshift({
      id: crypto.randomUUID(),
      userId: project.userId,
      projectId,
      generationJobId: job.id,
      provider: job.provider,
      model: job.model,
      endpoint: job.provider === "atlascloud" ? atlasGenerateVideoPath : job.provider === "grsai" ? grsaiDrawPath : job.provider === "wuyin" ? wuyinPathFromProject(project) : apimartImagePath,
      status: "failed",
      errorMessage: job.providerErrorMessage || job.errorMessage,
      costRm: 0,
      createdAt
    });
    currentDb.usage.unshift(usage("Generation failed", 0, project.userId));
    await saveDb(currentDb);
    return publicState(currentDb, user);
  });
}

async function enqueueGeneration(projectId, action, step, user) {
  const jobId = crypto.randomUUID();
  const state = await mutateDb(async (currentDb) => {
    const project = findProject(currentDb, projectId, user);
    const creditsToCharge = creditChargeFor(project, action);
    assertGenerationAccess(currentDb, user, creditsToCharge);
    const cost = generationCostFor(currentDb, project, action, { provider: providerForMediaModel(project.image?.model) });
    const createdAt = new Date().toISOString();
    currentDb.generationJobs.unshift({
      id: jobId,
      userId: project.userId,
      projectId,
      action,
      step,
      type: action === "generate-image" && isVideoMediaModel(project.image?.model) ? "video" : action === "generate-image" ? "image" : "text",
      status: "queued",
      prompt: project.image?.prompt || "",
      creditsCharged: 0,
      creditsRequired: creditsToCharge,
      duration: videoDurationFor(project),
      createdAt,
      model: cost.model,
      provider: cost.provider,
      unit: cost.unit
    });
    currentDb.usage.unshift(usage("Queued generation", 0, project.userId));
    await saveDb(currentDb);
    return publicState(currentDb, user);
  });
  setTimeout(() => processGenerationJob(jobId).catch((error) => console.error("Generation job failed", error)), 0);
  return { jobId, state };
}

async function processGenerationJob(jobId) {
  const snapshot = await mutateDb(async (db) => {
    const job = db.generationJobs.find((item) => item.id === jobId);
    if (!job || job.status !== "queued") return null;
    const project = db.projects.find((item) => item.id === job.projectId);
    if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
    job.status = "processing";
    job.startedAt = new Date().toISOString();
    await saveDb(db);
    return { job: structuredClone(job), project: structuredClone(project) };
  });
  if (!snapshot) return;

  try {
    const generated = await generateWithProvider(snapshot.project, snapshot.job.action, snapshot.job.step);
    await completeQueuedGeneration(jobId, generated);
  } catch (error) {
    await failQueuedGeneration(jobId, error);
  }
}

async function completeQueuedGeneration(jobId, generated) {
  await mutateDb(async (currentDb) => {
    const job = currentDb.generationJobs.find((item) => item.id === jobId);
    if (!job) return saveDb(currentDb);
    const project = currentDb.projects.find((item) => item.id === job.projectId);
    if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
    const owner = currentDb.users.find((item) => item.id === project.userId);
    const cost = generationCostFor(currentDb, project, job.action, generated);
    const creditsToCharge = creditChargeFor(project, job.action);
    const completedAt = new Date().toISOString();
    const resultId = crypto.randomUUID();
    const assetType = generated.videoUrl ? "video" : generated.imageUrl ? "image" : "text";
    const publicTitle = publicGenerationTitle(assetType);
    const publicBody = publicGenerationBody(assetType);
    const mirrored = await mirrorAssetToStorage(generated.videoUrl || generated.imageUrl, {
      userId: project.userId,
      projectId: project.id,
      resultId,
      type: assetType
    });
    const result = {
      id: resultId,
      type: resultTypeForGeneration(job.action, job.step, generated),
      title: publicTitle,
      body: publicBody,
      providerTitle: generated.title,
      providerBody: generated.body,
      imageUrl: generated.imageUrl ? mirrored.url : undefined,
      videoUrl: generated.videoUrl ? mirrored.url : undefined,
      originalImageUrl: generated.imageUrl && mirrored.originalUrl !== mirrored.url ? mirrored.originalUrl : undefined,
      originalVideoUrl: generated.videoUrl && mirrored.originalUrl !== mirrored.url ? mirrored.originalUrl : undefined,
      assetStorage: mirrored.storage,
      assetStorageKey: mirrored.storageKey,
      assetStorageError: mirrored.storageError,
      taskId: generated.taskId,
      providerTaskId: generated.taskId,
      provider: generated.provider,
      model: internalMediaModel(project.image?.model),
      costRm: cost.costRm,
      createdAt: completedAt
    };
    project.results.push(result);
    if (owner) {
      owner.billing ||= defaultBilling();
      owner.billing.credits = Math.max(0, roundCredits(Number(owner.billing.credits || 0) - creditsToCharge));
    }
    Object.assign(job, {
      resultId: result.id,
      status: "succeeded",
      taskId: generated.taskId,
      providerTaskId: generated.taskId,
      imageUrl: result.imageUrl,
      videoUrl: result.videoUrl,
      originalImageUrl: result.originalImageUrl,
      originalVideoUrl: result.originalVideoUrl,
      assetStorage: result.assetStorage,
      assetStorageKey: result.assetStorageKey,
      assetStorageError: result.assetStorageError,
      textOutput: publicBody,
      providerTextOutput: generated.body,
      creditsCharged: creditsToCharge,
      creditsRequired: creditsToCharge,
      duration: videoDurationFor(project),
      completedAt,
      ...cost
    });
    currentDb.apiCalls.unshift({
      id: crypto.randomUUID(),
      userId: project.userId,
      projectId: project.id,
      generationJobId: job.id,
      provider: job.provider,
      model: job.model,
      endpoint: job.provider === "atlascloud" ? atlasGenerateVideoPath : job.provider === "grsai" ? grsaiDrawPath : job.provider === "wuyin" ? wuyinPathFromProject(project) : apimartImagePath,
      status: "succeeded",
      taskId: generated.taskId,
      costRm: job.costRm,
      createdAt: completedAt
    });
    currentDb.usage.unshift(usage(publicTitle, creditsToCharge, project.userId));
    currentDb.creditLedger.unshift(creditEntry(project.userId, "debit", -creditsToCharge, publicTitle, {
      projectId: project.id,
      resultId: result.id,
      generationJobId: job.id
    }));
    await saveDb(currentDb);
    return publicState(currentDb);
  });
}

async function failQueuedGeneration(jobId, error) {
  await mutateDb(async (currentDb) => {
    const job = currentDb.generationJobs.find((item) => item.id === jobId);
    if (!job) return saveDb(currentDb);
    const project = currentDb.projects.find((item) => item.id === job.projectId);
    const completedAt = new Date().toISOString();
    Object.assign(job, {
      status: "failed",
      errorMessage: publicGenerationError(),
      providerErrorMessage: error.message || "Generation failed",
      creditsCharged: 0,
      completedAt
    });
    currentDb.apiCalls.unshift({
      id: crypto.randomUUID(),
      userId: job.userId,
      projectId: job.projectId,
      generationJobId: job.id,
      provider: job.provider,
      model: job.model,
      endpoint: project ? (job.provider === "atlascloud" ? atlasGenerateVideoPath : job.provider === "grsai" ? grsaiDrawPath : job.provider === "wuyin" ? wuyinPathFromProject(project) : apimartImagePath) : "",
      status: "failed",
      errorMessage: job.providerErrorMessage || job.errorMessage,
      costRm: 0,
      createdAt: completedAt
    });
    currentDb.usage.unshift(usage("Generation failed", 0, job.userId));
    await saveDb(currentDb);
    return publicState(currentDb);
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

function autoPostJobs(db) {
  return db.schedule.map((item) => ({
    id: item.id,
    title: item.title,
    platform: item.platform || "TikTok",
    time: item.time,
    status: item.status,
    caption: item.caption || "",
    hashtags: item.hashtags || "",
    mediaUrl: item.mediaUrl || "",
    productUrl: item.productUrl || "",
    updatedAt: item.updatedAt || item.createdAt || null,
    postedAt: item.postedAt || null
  }));
}

function tiktokRedirectUri() {
  return publicAppUrl(tiktokRedirectPath);
}

function latestTikTokConnection(db, userId) {
  const connections = db.tiktok?.connections || [];
  return userId ? connections.find((item) => item.userId === userId) || null : connections[0] || null;
}

function findTikTokConnection(db, id, user) {
  const connection = id
    ? db.tiktok.connections.find((item) => item.id === id)
    : latestTikTokConnection(db, user && (user.role || "user") !== "admin" ? user.id : null);
  if (!connection) {
    const error = new Error("TikTok account not connected yet.");
    error.status = 400;
    throw error;
  }
  if (user && (user.role || "user") !== "admin" && connection.userId !== user.id) {
    const error = new Error("TikTok account not found.");
    error.status = 404;
    throw error;
  }
  return connection;
}

function tiktokPostTitle(job) {
  return [job.caption, job.hashtags].filter(Boolean).join("\n\n").trim().slice(0, 2200);
}

async function refreshTikTokConnection(connection) {
  const { clientKey, clientSecret } = requireTikTokConfig();
  if (!connection.refreshToken) return connection;
  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt).getTime() : 0;
  if (expiresAt && expiresAt - Date.now() > 5 * 60 * 1000) return connection;

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken
  });
  const payload = await tiktokRequest("/v2/oauth/token/", { method: "POST", body });
  const data = payload.data || payload;
  connection.accessToken = data.access_token || connection.accessToken;
  connection.refreshToken = data.refresh_token || connection.refreshToken;
  connection.expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : connection.expiresAt;
  connection.refreshExpiresAt = data.refresh_expires_in ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString() : connection.refreshExpiresAt;
  connection.scopes = data.scope || connection.scopes;
  connection.updatedAt = new Date().toISOString();
  return connection;
}

async function queryTikTokCreatorInfo(connection) {
  const payload = await tiktokRequest("/v2/post/publish/creator_info/query/", {
    method: "POST",
    accessToken: connection.accessToken,
    body: {}
  });
  connection.creatorInfo = payload.data || null;
  connection.creatorInfoFetchedAt = new Date().toISOString();
  return connection.creatorInfo;
}

async function listFilesRecursive(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath, base));
    } else if (entry.isFile()) {
      files.push({
        path: fullPath,
        name: path.relative(base, fullPath).replaceAll(path.sep, "/")
      });
    }
  }
  return files;
}

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

async function zipDirectory(dir) {
  await stat(dir);
  const files = await listFilesRecursive(dir);
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const file of files) {
    const data = await readFile(file.path);
    const name = Buffer.from(file.name);
    const checksum = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
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
      name: "create_schedule_draft",
      description: "Create a TikTok scheduler draft from Agent-created content, generated results, or user-provided caption details.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project this draft belongs to, when available." },
          resultId: { type: "string", description: "Generated result to attach, when available." },
          title: { type: "string", description: "Short post title." },
          platform: { type: "string", description: "Defaults to TikTok." },
          time: { type: "string", description: "Human-readable scheduled time, for example Today 20:30 or Fri 21:00." },
          status: { type: "string", description: "Draft or Ready. Defaults to Draft." },
          caption: { type: "string" },
          hashtags: { type: "string" },
          mediaUrl: { type: "string", description: "Public image/video URL if already generated." },
          productUrl: { type: "string" }
        },
        required: ["title", "caption"]
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
      name: "update_autopost_job",
      description: "Update an Auto Post job caption, hashtags, media URL, product URL, or status before publishing.",
      parameters: {
        type: "object",
        properties: {
          scheduleId: { type: "string" },
          status: { type: "string", description: "Optional status such as Draft, Ready, Processing, Posted." },
          caption: { type: "string" },
          hashtags: { type: "string" },
          mediaUrl: { type: "string", description: "Public video URL for TikTok PULL_FROM_URL publishing." },
          productUrl: { type: "string" }
        },
        required: ["scheduleId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_tiktok_creator_info",
      description: "Query the connected TikTok account's creator info and posting options.",
      parameters: {
        type: "object",
        properties: {
          connectionId: { type: "string", description: "Optional TikTok connection id. Uses the latest connection if omitted." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "publish_tiktok_video",
      description: "Start an official TikTok Direct Post for an Auto Post job. Requires a connected TikTok account and a public mediaUrl.",
      parameters: {
        type: "object",
        properties: {
          scheduleId: { type: "string" },
          mediaUrl: { type: "string", description: "Optional public video URL. Uses the job mediaUrl if omitted." },
          connectionId: { type: "string", description: "Optional TikTok connection id. Uses the latest connection if omitted." },
          privacyLevel: { type: "string", description: "TikTok privacy level, defaults to SELF_ONLY." },
          isAigc: { type: "boolean", description: "Whether to mark the video as AI-generated content. Defaults to true." }
        },
        required: ["scheduleId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_tiktok_publish_status",
      description: "Check the status of an official TikTok publish request.",
      parameters: {
        type: "object",
        properties: {
          publishId: { type: "string", description: "TikTok publish_id or Duitok publish record id." }
        },
        required: ["publishId"]
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

async function executeAgentTool(name, args, user) {
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
    requireAgentPermission(user, "updateProject");
    const projectId = crypto.randomUUID();
    const db = await mutateDb(async (currentDb) => {
      currentDb.projects.push(blankProject(projectId, args.name || `Project ${currentDb.projects.length + 1}`, user.id));
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return {
      ok: true,
      message: "Project created.",
      db,
      data: { projectId },
      uiAction: { page: "project", projectId }
    };
  }

  if (name === "update_project_field") {
    requireAgentPermission(user, "updateProject");
    const db = await mutateDb(async (currentDb) => {
      setDeep(findProject(currentDb, args.projectId, user), args.field, args.value);
      currentDb.usage.unshift(usage(`Agent updated ${args.field}`, 0, user.id));
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return { ok: true, message: `${args.field} updated.`, db, data: { projectId: args.projectId, field: args.field } };
  }

  if (name === "generate_project_output") {
    requireAgentPermission(user, "generate");
    const db = await ensureDb();
    const projectSnapshot = structuredClone(findProject(db, args.projectId, user));
    assertGenerationAccess(db, user, creditChargeFor(projectSnapshot, args.action));
    let generated;
    try {
      generated = await generateWithProvider(projectSnapshot, args.action, args.step);
    } catch (error) {
      await saveFailedGeneration(args.projectId, args.action, args.step, error, user).catch(() => null);
      throw error;
    }
    const nextDb = await saveGeneratedResult(args.projectId, args.action, args.step, generated, user);
    const project = nextDb.projects.find((item) => item.id === args.projectId);
    const result = project?.results?.[project.results.length - 1];
    return {
      ok: true,
      message: `${result?.title || "Duitok AI Result"} saved.`,
      db: nextDb,
      data: {
        projectId: args.projectId,
        resultId: result?.id,
        resultType: result?.type,
        title: result?.title,
        mediaUrl: result?.videoUrl || result?.imageUrl || ""
      }
    };
  }

  if (name === "create_schedule_draft") {
    requireAgentPermission(user, "schedule");
    const scheduleId = crypto.randomUUID();
    const db = await mutateDb(async (currentDb) => {
      let result = null;
      let project = null;
      if (args.projectId) project = findProject(currentDb, args.projectId, user);
      if (args.resultId) {
        const projects = (currentDb.projects || []).filter((item) => (user.role || "user") === "admin" || item.userId === user.id);
        for (const item of projects) {
          const found = (item.results || []).find((entry) => entry.id === args.resultId);
          if (found) {
            project = item;
            result = found;
            break;
          }
        }
        if (!result) throw Object.assign(new Error("Generated result not found"), { status: 404 });
      }
      const item = {
        id: scheduleId,
        userId: project?.userId || user.id,
        projectId: project?.id || args.projectId || "",
        resultId: result?.id || args.resultId || "",
        title: args.title || result?.title || project?.name || "Agent draft",
        platform: args.platform || "TikTok",
        time: args.time || "Today 20:30",
        status: args.status || "Draft",
        caption: args.caption || result?.body || "",
        hashtags: args.hashtags || "#duitok #tiktokshop",
        mediaUrl: args.mediaUrl || result?.videoUrl || result?.imageUrl || "",
        productUrl: args.productUrl || project?.auto?.productUrl || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      currentDb.schedule.unshift(item);
      currentDb.usage.unshift(usage(`Agent created schedule draft: ${item.title}`, 0, item.userId));
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return {
      ok: true,
      message: "Scheduler draft created.",
      db,
      data: { scheduleId },
      uiAction: { page: "autopost" }
    };
  }

  if (name === "toggle_schedule_status") {
    requireAgentPermission(user, "schedule");
    const db = await mutateDb(async (currentDb) => {
      const item = currentDb.schedule.find((entry) => entry.id === args.scheduleId);
      if (!item) throw Object.assign(new Error("Schedule item not found"), { status: 404 });
      if ((user.role || "user") !== "admin" && item.userId !== user.id) throw Object.assign(new Error("Schedule item not found"), { status: 404 });
      item.status = item.status === "Ready" ? "Posted" : "Ready";
      currentDb.usage.unshift(usage(`Agent updated schedule: ${item.title}`, 0, item.userId));
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return { ok: true, message: "Schedule updated.", db };
  }

  if (name === "update_autopost_job") {
    requireAgentPermission(user, "schedule");
    const db = await mutateDb(async (currentDb) => {
      const item = currentDb.schedule.find((entry) => entry.id === args.scheduleId);
      if (!item) throw Object.assign(new Error("Auto post job not found"), { status: 404 });
      if ((user.role || "user") !== "admin" && item.userId !== user.id) throw Object.assign(new Error("Auto post job not found"), { status: 404 });
      if (args.status) item.status = String(args.status);
      if (args.caption !== undefined) item.caption = String(args.caption);
      if (args.hashtags !== undefined) item.hashtags = String(args.hashtags);
      if (args.mediaUrl !== undefined) item.mediaUrl = String(args.mediaUrl);
      if (args.productUrl !== undefined) item.productUrl = String(args.productUrl);
      item.updatedAt = new Date().toISOString();
      if (item.status === "Posted") item.postedAt = item.updatedAt;
      currentDb.usage.unshift(usage(`Agent Auto Post ${item.status}: ${item.title}`, 0, item.userId));
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return { ok: true, message: "Auto post job updated.", db };
  }

  if (name === "query_tiktok_creator_info") {
    requireAgentPermission(user, "publish");
    const db = await mutateDb(async (currentDb) => {
      const connection = findTikTokConnection(currentDb, args.connectionId, user);
      if ((user.role || "user") !== "admin" && connection.userId !== user.id) throw Object.assign(new Error("TikTok account not found"), { status: 404 });
      await refreshTikTokConnection(connection);
      await queryTikTokCreatorInfo(connection);
      currentDb.usage.unshift(usage("Agent queried TikTok creator info", 0, connection.userId));
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return { ok: true, message: "TikTok creator info updated.", db };
  }

  if (name === "publish_tiktok_video") {
    requireAgentPermission(user, "publish");
    const result = await mutateDb(async (currentDb) => {
      const currentJob = currentDb.schedule.find((entry) => entry.id === args.scheduleId);
      if (!currentJob) throw Object.assign(new Error("Auto post job not found"), { status: 404 });
      if ((user.role || "user") !== "admin" && currentJob.userId !== user.id) throw Object.assign(new Error("Auto post job not found"), { status: 404 });
      const requestedMediaUrl = args.mediaUrl === "duitok-media-ready" ? "" : args.mediaUrl;
      const mediaUrl = requestedMediaUrl || currentJob.mediaUrl;
      if (!mediaUrl) throw Object.assign(new Error("TikTok Direct Post needs a public mediaUrl."), { status: 400 });

      const connection = findTikTokConnection(currentDb, args.connectionId, user);
      if ((user.role || "user") !== "admin" && connection.userId !== currentJob.userId) throw Object.assign(new Error("TikTok account not found"), { status: 404 });
      await refreshTikTokConnection(connection);
      if (!connection.creatorInfo) await queryTikTokCreatorInfo(connection);

      const publishBody = {
        post_info: {
          title: tiktokPostTitle(currentJob),
          privacy_level: args.privacyLevel || "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
          brand_content_toggle: false,
          brand_organic_toggle: false,
          is_aigc: args.isAigc !== undefined ? Boolean(args.isAigc) : true
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: mediaUrl
        }
      };
      const payload = await tiktokRequest("/v2/post/publish/video/init/", {
        method: "POST",
        accessToken: connection.accessToken,
        body: publishBody
      });
      const publish = {
        id: crypto.randomUUID(),
        userId: currentJob.userId,
        scheduleId: currentJob.id,
        connectionId: connection.id,
        publishId: payload.data?.publish_id,
        status: "PROCESSING",
        request: publishBody,
        response: payload.data || payload,
        createdAt: new Date().toISOString()
      };
      currentDb.tiktok.publishes.unshift(publish);
      currentJob.status = "Processing";
      currentJob.mediaUrl = mediaUrl;
      currentJob.updatedAt = publish.createdAt;
      currentDb.usage.unshift(usage(`Agent TikTok publish started: ${currentJob.title}`, 0, currentJob.userId));
      await saveDb(currentDb);
      const safeState = publicState(currentDb, user);
      return { publish: safeState.tiktok.publishes.find((item) => item.id === publish.id) || null, db: safeState };
    });
    return { ok: true, message: `TikTok publish started: ${result.publish?.id || "queued"}`, db: result.db };
  }

  if (name === "check_tiktok_publish_status") {
    requireAgentPermission(user, "publish");
    const result = await mutateDb(async (currentDb) => {
      const publish = currentDb.tiktok.publishes.find((item) => item.publishId === args.publishId || item.id === args.publishId);
      if (!publish) throw Object.assign(new Error("TikTok publish record not found"), { status: 404 });
      if ((user.role || "user") !== "admin" && publish.userId !== user.id) throw Object.assign(new Error("TikTok publish record not found"), { status: 404 });
      const connection = findTikTokConnection(currentDb, publish.connectionId, user);
      await refreshTikTokConnection(connection);
      const payload = await tiktokRequest("/v2/post/publish/status/fetch/", {
        method: "POST",
        accessToken: connection.accessToken,
        body: { publish_id: publish.publishId }
      });
      publish.status = payload.data?.status || publish.status;
      publish.statusResponse = payload.data || payload;
      publish.updatedAt = new Date().toISOString();
      const job = currentDb.schedule.find((item) => item.id === publish.scheduleId);
      if (job && /PUBLISH_COMPLETE|SUCCESS|DONE|POSTED/i.test(String(publish.status))) {
        job.status = "Posted";
        job.postedAt = publish.updatedAt;
      }
      currentDb.usage.unshift(usage(`Agent checked TikTok publish: ${publish.status}`, 0, publish.userId));
      await saveDb(currentDb);
      const safeState = publicState(currentDb, user);
      return { publish: safeState.tiktok.publishes.find((item) => item.id === publish.id) || null, db: safeState };
    });
    return { ok: true, message: `TikTok publish status: ${result.publish.status}`, db: result.db };
  }

  if (name === "create_support_ticket") {
    requireAgentPermission(user, "support");
    const db = await mutateDb(async (currentDb) => {
      currentDb.supportTickets.unshift({ id: crypto.randomUUID(), userId: user.id, message: args.message, createdAt: new Date().toISOString() });
      await saveDb(currentDb);
      return publicState(currentDb, user);
    });
    return { ok: true, message: "Support ticket created.", db };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}

function inferAgentAction(content) {
  const text = String(content || "").toLowerCase();
  return {
    wantsProject: /create|project|项目|專案|新建|创建|建立|buat project|projek/.test(text),
    wantsSeedance: /seedance|视频|影片|video|t2v|text.?to.?video/.test(text),
    wantsGenerate: /generate|生成|hasilkan|buat|run|create|做|产出/.test(text),
    wantsSchedule: /schedule|排期|发布|posting|post|draft|草稿|日历|calendar/.test(text),
    wantsAutoBatch: /7\s*天|七天|week|weekly|batch|content plan|内容计划|內容計劃|auto content/.test(text)
  };
}

function agentProjectName(content) {
  const compact = String(content || "").replace(/\s+/g, " ").trim();
  if (!compact) return `Agent Project ${new Date().toISOString().slice(0, 10)}`;
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

async function runDeterministicAgent(content, { projectId, user }) {
  const intent = inferAgentAction(content);
  const toolResults = [];
  const uiActions = [];
  let latestDb = null;
  let activeProjectId = projectId;

  async function run(name, args) {
    const result = await executeAgentTool(name, args, user);
    if (result.db) latestDb = result.db;
    if (result.uiAction) uiActions.push(result.uiAction);
    if (result.data?.projectId) activeProjectId = result.data.projectId;
    toolResults.push({ name, args, result: { ok: result.ok, message: result.message, error: result.error, data: result.data } });
    return result;
  }

  if (!activeProjectId || intent.wantsProject) {
    await run("create_project", { name: agentProjectName(content) });
  }

  if (intent.wantsSeedance) {
    await run("update_project_field", { projectId: activeProjectId, field: "image.model", value: "Seedance 2.0" });
    await run("update_project_field", { projectId: activeProjectId, field: "image.prompt", value: content });
    const duration = String(content).match(/\b(4|6|8|10|12|15)\s*s(?:ec|econd|秒)?/i)?.[1];
    if (duration) await run("update_project_field", { projectId: activeProjectId, field: "image.duration", value: duration });
    if (intent.wantsGenerate) await run("generate_project_output", { projectId: activeProjectId, action: "generate-image", step: "image" });
  } else if (intent.wantsAutoBatch) {
    await run("update_project_field", { projectId: activeProjectId, field: "auto.productUrl", value: content });
    await run("update_project_field", { projectId: activeProjectId, field: "auto.batch", value: "7 posts" });
    await run("update_project_field", { projectId: activeProjectId, field: "auto.tone", value: "Viral hook" });
    if (intent.wantsGenerate) await run("generate_project_output", { projectId: activeProjectId, action: "generate-auto", step: "auto" });
  }

  if (intent.wantsSchedule) {
    await run("create_schedule_draft", {
      projectId: activeProjectId,
      title: agentProjectName(content),
      caption: content,
      hashtags: "#duitok #tiktokshop",
      status: "Draft"
    });
  } else if (activeProjectId) {
    uiActions.push({ page: "project", projectId: activeProjectId });
  }

  const actionNames = toolResults.map((item) => item.name).join(", ");
  return {
    reply: toolResults.length
      ? `Done. I ran: ${actionNames}. DeepSeek is not configured, so I used Duitok's built-in action runner for this request.`
      : "DeepSeek is not configured yet. I can still create projects, fill Seedance prompts, generate supported outputs, and create scheduler drafts when your request includes those actions.",
    db: latestDb,
    toolResults,
    uiActions
  };
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
  const user = db.users.find((item) => item.id === payment.userId) || db.users.find((item) => item.id === adminUserId);
  user.billing ||= defaultBilling();
  user.billing.credits += payment.credits;
  user.billing.invoices.unshift({ id: `INV-${Date.now()}`, amount: payment.amount, createdAt: new Date().toISOString() });
  db.usage.unshift(usage(`Top up ${payment.credits} credits`, 0, user.id));
  db.creditLedger.unshift(creditEntry(user.id, "credit", payment.credits, `Top up RM${payment.amount}`, {
    paymentId: payment.id,
    orderId: payment.orderId,
    chipPurchaseId: payment.chipPurchaseId
  }));
  return payment;
}

app.get("/api/state", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    res.json(publicState(db, user));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/users/:id", async (req, res, next) => {
  try {
    const { user } = await requireAuth(req);
    requireAdminUser(user);
    const state = await mutateDb(async (db) => {
      const target = db.users.find((item) => item.id === req.params.id);
      if (!target) throw Object.assign(new Error("User not found"), { status: 404 });
      if (req.body.status) target.status = String(req.body.status);
      if (req.body.plan) {
        target.billing ||= defaultBilling();
        target.billing.plan = String(req.body.plan);
      }
      if (req.body.agentPermissions && typeof req.body.agentPermissions === "object") {
        target.agentPermissions = { ...defaultAgentPermissions(), ...(target.agentPermissions || {}), ...req.body.agentPermissions };
      }
      target.updatedAt = new Date().toISOString();
      db.usage.unshift(usage(`Admin updated user: ${target.email}`, 0, user.id));
      await saveDb(db);
      return publicState(db, user);
    });
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users/:id/credits", async (req, res, next) => {
  try {
    const { user } = await requireAuth(req);
    requireAdminUser(user);
    const delta = Number(req.body.delta || 0);
    if (!Number.isFinite(delta) || delta === 0) throw Object.assign(new Error("Credit delta required"), { status: 400 });
    const state = await mutateDb(async (db) => {
      const target = db.users.find((item) => item.id === req.params.id);
      if (!target) throw Object.assign(new Error("User not found"), { status: 404 });
      target.billing ||= defaultBilling();
      target.billing.credits = Math.max(0, Number(target.billing.credits || 0) + delta);
      const note = req.body.note || `Admin ${delta > 0 ? "added" : "removed"} credits`;
      db.creditLedger.unshift(creditEntry(target.id, delta > 0 ? "admin_credit" : "admin_debit", delta, note, {
        adminUserId: user.id
      }));
      db.usage.unshift(usage(`${note}: ${target.email}`, 0, user.id));
      await saveDb(db);
      return publicState(db, user);
    });
    res.json(state);
  } catch (error) {
    next(error);
  }
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
        name: email.split("@")[0],
        role: email === "admin@duitok.com" ? "admin" : "user",
        status: "active",
        billing: defaultBilling(),
        agentPermissions: defaultAgentPermissions()
      };
      db.users.push(user);
      db.projects.push(blankProject(crypto.randomUUID(), "Project 1", user.id));
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
    if ((user.status || "active") === "suspended" && (user.role || "user") !== "admin") {
      const error = new Error("Account suspended. Please contact support.");
      error.status = 403;
      throw error;
    }
    return { user: publicUser(user), token: signAuthToken(user), state: publicState(db, user) };
  });
  res.json(payload);
});

app.get("/api/tiktok/connect", async (req, res, next) => {
  try {
    const { user } = await requireAuth(req);
    const { clientKey } = requireTikTokConfig();
    const state = crypto.randomBytes(18).toString("hex");
    await mutateDb(async (db) => {
      db.tiktok.oauthStates.unshift({ state, userId: user.id, createdAt: new Date().toISOString() });
      db.tiktok.oauthStates = db.tiktok.oauthStates.slice(0, 20);
      return saveDb(db);
    });
    const url = new URL(`${tiktokAuthBaseUrl}/v2/auth/authorize/`);
    url.searchParams.set("client_key", clientKey);
    url.searchParams.set("scope", tiktokScopes);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", tiktokRedirectUri());
    url.searchParams.set("state", state);
    res.redirect(url.toString());
  } catch (error) {
    next(error);
  }
});

app.get("/api/tiktok/oauth/callback", async (req, res, next) => {
  try {
    if (req.query.error) {
      return res.redirect(publicAppUrl(`/studio?tiktok=failed&reason=${encodeURIComponent(req.query.error_description || req.query.error)}`));
    }

    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) return res.status(400).send("Missing TikTok OAuth code or state.");

    const db = await ensureDb();
    const knownState = db.tiktok.oauthStates.find((item) => item.state === state);
    if (!knownState) return res.status(400).send("Invalid TikTok OAuth state.");

    const { clientKey, clientSecret } = requireTikTokConfig();
    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: tiktokRedirectUri()
    });
    const payload = await tiktokRequest("/v2/oauth/token/", { method: "POST", body });
    const data = payload.data || payload;

    await mutateDb(async (currentDb) => {
      currentDb.tiktok.oauthStates = currentDb.tiktok.oauthStates.filter((item) => item.state !== state);
      const existing = currentDb.tiktok.connections.find((item) => item.openId === data.open_id && item.userId === knownState.userId);
      const connection = existing || { id: crypto.randomUUID(), connectedAt: new Date().toISOString() };
      Object.assign(connection, {
        userId: knownState.userId,
        openId: data.open_id,
        unionId: data.union_id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scopes: data.scope,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
        refreshExpiresAt: data.refresh_expires_in ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      if (!existing) currentDb.tiktok.connections.unshift(connection);
      currentDb.usage.unshift(usage("TikTok account connected", 0, knownState.userId));
      return saveDb(currentDb);
    });

    res.redirect(publicAppUrl("/studio?tiktok=connected"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/tiktok/status", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    res.json(publicState(db, user).tiktok);
  } catch (error) {
    next(error);
  }
});

app.post("/api/tiktok/creator-info", async (req, res, next) => {
  try {
    const { user } = await requireAuth(req);
    const result = await mutateDb(async (db) => {
      const connection = findTikTokConnection(db, req.body.connectionId, user);
      if ((user.role || "user") !== "admin" && connection.userId !== user.id) throw Object.assign(new Error("TikTok account not found"), { status: 404 });
      await refreshTikTokConnection(connection);
      const creatorInfo = await queryTikTokCreatorInfo(connection);
      await saveDb(db);
      return { creatorInfo, tiktok: publicState(db, user).tiktok };
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", async (req, res) => {
  const { user } = await requireAuth(req);
  res.json(await mutateDb(async (db) => {
    db.projects.push(blankProject(crypto.randomUUID(), req.body.name, user.id));
    await saveDb(db);
    return publicState(db, user);
  }));
});

app.patch("/api/projects/:id/field", async (req, res) => {
  const { user } = await requireAuth(req);
  res.json(await mutateDb(async (db) => {
    setDeep(findProject(db, req.params.id, user), req.body.field, req.body.value);
    await saveDb(db);
    return publicState(db, user);
  }));
});

app.post("/api/projects/:id/generate", async (req, res) => {
  try {
    const { user } = await requireAuth(req);
    const result = await enqueueGeneration(req.params.id, req.body.action, req.body.step, user);
    res.json(result.state);
  } catch (error) {
    const { user } = await requireAuth(req).catch(() => ({ user: null }));
    if (user && ![402, 403, 404, 429].includes(error.status)) {
      await saveFailedGeneration(req.params.id, req.body.action, req.body.step, error, user).catch(() => null);
    }
    throw error;
  }
});

app.post("/api/agent", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    const history = Array.isArray(req.body.messages) ? req.body.messages.slice(-10) : [];
    const stateForUser = publicState(db, user);
    const projectId = req.body.projectId || stateForUser.projects[0]?.id;
    const latestUserMessage = [...history].reverse().find((item) => item.role === "user" && typeof item.content === "string")?.content || "";

    if (!hasDeepSeekConfig()) {
      const fallback = await runDeterministicAgent(latestUserMessage, { projectId, user });
      return res.json({
        reply: fallback.reply,
        db: fallback.db || stateForUser,
        toolResults: fallback.toolResults,
        uiActions: fallback.uiActions
      });
    }

    const messages = [
      {
        role: "system",
        content: [
          "You are Duitok Agent inside Duitok AI Studio for Malaysia TikTok Shop sellers.",
          "Help the user decide what to do next, and call Duitok platform tools when useful.",
          "You can navigate the UI, create projects, update project fields, generate outputs, create scheduler drafts, update schedule status, and create support tickets.",
          "Act like an operator, not a passive chatbot: when the user asks for an output, fill the relevant project fields and run the matching tool if enough information is available.",
          "Common workflows: product/content request = create_project -> update fields -> generate_project_output -> open_workspace. Weekly content plan = update auto.productUrl/auto fields -> generate-auto -> create_schedule_draft when captions are available. Seedance video = set image.model to Seedance 2.0, set image.prompt/duration, then generate-image.",
          "When a tool creates a project, result, or schedule draft, use the returned ids for the next tool call.",
          "Be concise, practical, and speak in the user's language. Ask only when required data is missing.",
          "Do not claim a tool ran unless it was actually called and returned success."
        ].join(" ")
      },
      {
        role: "system",
        content: `Current workspace JSON:\n${JSON.stringify(compactWorkspaceState(stateForUser), null, 2)}\nCurrent project id: ${projectId || "none"}`
      },
      ...history
        .filter((item) => ["user", "assistant"].includes(item.role) && typeof item.content === "string")
        .map((item) => ({ role: item.role, content: item.content.slice(0, 5000) }))
    ];

    const toolResults = [];
    const uiActions = [];
    let latestDb = stateForUser;

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
        const result = await executeAgentTool(name, args, user);
        if (result.db) latestDb = result.db;
        if (result.uiAction) uiActions.push(result.uiAction);
        const publicResult = { ok: result.ok, message: result.message, error: result.error, data: result.data };
        toolResults.push({ name, args, result: publicResult });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(publicResult)
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
  const { user } = await requireAuth(req);
  res.json(await mutateDb(async (db) => {
    db.attachments.unshift({ id: crypto.randomUUID(), userId: user.id, ...req.body, createdAt: new Date().toISOString() });
    db.usage.unshift(usage(`Uploaded ${req.body.kind}`, 0, user.id));
    await saveDb(db);
    return publicState(db, user);
  }));
});

app.post("/api/billing/topup", async (req, res, next) => {
  try {
    const { user } = await requireAuth(req);
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
        userId: user.id,
        orderId,
        chipPurchaseId: chipPurchase.id,
        checkoutUrl: chipPurchase.checkout_url,
        directPostUrl: chipPurchase.direct_post_url,
        amount,
        credits: amount,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      await saveDb(db);
      return publicState(db, user);
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
  const { user } = await requireAuth(req);
  res.json(await mutateDb(async (db) => {
    const item = db.schedule.find((entry) => entry.id === req.params.id);
    if (item && (user.role || "user") !== "admin" && item.userId !== user.id) throw Object.assign(new Error("Schedule item not found"), { status: 404 });
    if (item) item.status = item.status === "Ready" ? "Posted" : "Ready";
    await saveDb(db);
    return publicState(db, user);
  }));
});

app.get("/api/autopost/jobs", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    const state = publicState(db, user);
    res.json({ jobs: autoPostJobs(state) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/autopost/jobs/:id", async (req, res) => {
  const { user } = await requireAuth(req);
  res.json(await mutateDb(async (db) => {
    const item = db.schedule.find((entry) => entry.id === req.params.id);
    if (!item) {
      const error = new Error("Auto post job not found");
      error.status = 404;
      throw error;
    }
    if ((user.role || "user") !== "admin" && item.userId !== user.id) throw Object.assign(new Error("Auto post job not found"), { status: 404 });
    if (req.body.status) item.status = req.body.status;
    if (req.body.caption !== undefined) item.caption = String(req.body.caption);
    if (req.body.hashtags !== undefined) item.hashtags = String(req.body.hashtags);
    if (req.body.mediaUrl !== undefined && req.body.mediaUrl !== "duitok-media-ready") item.mediaUrl = String(req.body.mediaUrl);
    if (req.body.productUrl !== undefined) item.productUrl = String(req.body.productUrl);
    item.updatedAt = new Date().toISOString();
    if (item.status === "Posted") item.postedAt = item.updatedAt;
    db.usage.unshift(usage(`Auto Post ${item.status}: ${item.title}`, 0, item.userId));
    await saveDb(db);
    return publicState(db, user);
  }));
});

app.post("/api/tiktok/publish/:id", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    const job = db.schedule.find((entry) => entry.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Auto post job not found" });
    if ((user.role || "user") !== "admin" && job.userId !== user.id) return res.status(404).json({ error: "Auto post job not found" });
    if (!job.mediaUrl && !req.body.mediaUrl) {
      return res.status(400).json({ error: "TikTok Direct Post needs a public mediaUrl for PULL_FROM_URL. Upload/select a video first." });
    }

    const result = await mutateDb(async (currentDb) => {
      const currentJob = currentDb.schedule.find((entry) => entry.id === req.params.id);
      const connection = findTikTokConnection(currentDb, req.body.connectionId, user);
      if ((user.role || "user") !== "admin" && connection.userId !== currentJob.userId) throw Object.assign(new Error("TikTok account not found"), { status: 404 });
      await refreshTikTokConnection(connection);
      if (!connection.creatorInfo) await queryTikTokCreatorInfo(connection);

      const requestedMediaUrl = req.body.mediaUrl === "duitok-media-ready" ? "" : req.body.mediaUrl;
      const mediaUrl = requestedMediaUrl || currentJob.mediaUrl;
      const publishBody = {
        post_info: {
          title: tiktokPostTitle(currentJob),
          privacy_level: req.body.privacyLevel || "SELF_ONLY",
          disable_duet: Boolean(req.body.disableDuet),
          disable_comment: Boolean(req.body.disableComment),
          disable_stitch: Boolean(req.body.disableStitch),
          video_cover_timestamp_ms: Number(req.body.videoCoverTimestampMs || 1000),
          brand_content_toggle: Boolean(req.body.brandContent),
          brand_organic_toggle: Boolean(req.body.brandOrganic),
          is_aigc: req.body.isAigc !== undefined ? Boolean(req.body.isAigc) : true
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: mediaUrl
        }
      };
      const payload = await tiktokRequest("/v2/post/publish/video/init/", {
        method: "POST",
        accessToken: connection.accessToken,
        body: publishBody
      });
      const publish = {
        id: crypto.randomUUID(),
        userId: currentJob.userId,
        scheduleId: currentJob.id,
        connectionId: connection.id,
        publishId: payload.data?.publish_id,
        status: "PROCESSING",
        request: publishBody,
        response: payload.data || payload,
        createdAt: new Date().toISOString()
      };
      currentDb.tiktok.publishes.unshift(publish);
      currentJob.status = "Processing";
      currentJob.mediaUrl = mediaUrl;
      currentJob.updatedAt = publish.createdAt;
      currentDb.usage.unshift(usage(`TikTok publish started: ${currentJob.title}`, 0, currentJob.userId));
      await saveDb(currentDb);
      const safeState = publicState(currentDb, user);
      return { publish: safeState.tiktok.publishes.find((item) => item.id === publish.id) || null, db: safeState };
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/tiktok/publish/:publishId/status", async (req, res, next) => {
  try {
    const { user } = await requireAuth(req);
    const result = await mutateDb(async (db) => {
      const publish = db.tiktok.publishes.find((item) => item.publishId === req.params.publishId || item.id === req.params.publishId);
      if (!publish) {
        const error = new Error("TikTok publish record not found");
        error.status = 404;
        throw error;
      }
      if ((user.role || "user") !== "admin" && publish.userId !== user.id) throw Object.assign(new Error("TikTok publish record not found"), { status: 404 });
      const connection = findTikTokConnection(db, publish.connectionId, user);
      await refreshTikTokConnection(connection);
      const payload = await tiktokRequest("/v2/post/publish/status/fetch/", {
        method: "POST",
        accessToken: connection.accessToken,
        body: { publish_id: publish.publishId }
      });
      publish.status = payload.data?.status || publish.status;
      publish.statusResponse = payload.data || payload;
      publish.updatedAt = new Date().toISOString();
      const job = db.schedule.find((item) => item.id === publish.scheduleId);
      if (job && /PUBLISH_COMPLETE|SUCCESS|DONE|POSTED/i.test(String(publish.status))) {
        job.status = "Posted";
        job.postedAt = publish.updatedAt;
      }
      await saveDb(db);
      const safeState = publicState(db, user);
      return { publish: safeState.tiktok.publishes.find((item) => item.id === publish.id) || null, db: safeState };
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/support", async (req, res) => {
  const { user } = await requireAuth(req);
  res.json(await mutateDb(async (db) => {
    db.supportTickets.unshift({ id: crypto.randomUUID(), userId: user.id, message: req.body.message, createdAt: new Date().toISOString() });
    await saveDb(db);
    return publicState(db, user);
  }));
});

app.get("/api/export/all", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    res.attachment("duitok-data.json").json(publicState(db, user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/export/project/:id", async (req, res) => {
  const { db, user } = await requireAuth(req);
  findProject(db, req.params.id, user);
  const project = publicState(db, user).projects.find((item) => item.id === req.params.id);
  res.attachment("project.json").json(project);
});

app.get("/api/media/result/:id/:kind", async (req, res, next) => {
  try {
    const { db, user } = await requireAuth(req);
    const projects = (user.role || "user") === "admin" ? db.projects : db.projects.filter((project) => project.userId === user.id);
    const result = projects.flatMap((project) => project.results || []).find((item) => item.id === req.params.id);
    if (!result) {
      const error = new Error("Result not found");
      error.status = 404;
      throw error;
    }
    const isVideo = req.params.kind === "video";
    const sourceUrl = isVideo
      ? (result.videoUrl || result.originalVideoUrl)
      : (result.imageUrl || result.originalImageUrl);
    if (!sourceUrl) {
      const error = new Error("Result media not found");
      error.status = 404;
      throw error;
    }
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: isVideo ? "video/*,*/*;q=0.8" : "image/*,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(Number(process.env.MEDIA_PROXY_TIMEOUT_MS || 60000))
    });
    if (!response.ok) {
      const error = new Error(`Media fetch failed: ${response.status}`);
      error.status = 502;
      throw error;
    }
    const contentType = response.headers.get("content-type") || (isVideo ? "video/mp4" : "image/png");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    const bytes = Buffer.from(await response.arrayBuffer());
    res.send(bytes);
  } catch (error) {
    next(error);
  }
});

app.get("/api/export/result/:id", async (req, res) => {
  const { db, user } = await requireAuth(req);
  const result = publicState(db, user).projects.flatMap((project) => project.results || []).find((item) => item.id === req.params.id);
  res.attachment("result.txt").type("text/plain").send(`${result?.title || "Result"}\n\n${result?.body || ""}`);
});

app.get("/api/export/invoice/:id", async (req, res) => {
  const { user } = await requireAuth(req);
  const invoice = (user.billing?.invoices || []).find((item) => item.id === req.params.id);
  res.attachment("invoice.txt").type("text/plain").send(`Duitok  AI Invoice\n${invoice?.id || req.params.id}\nAmount: RM${invoice?.amount || 0}`);
});

app.get("/api/export/sop", (_req, res) => {
  res.attachment("sop.txt").type("text/plain").send("Duitok  AI Image SOP\n1. Upload avatar.\n2. Upload product.\n3. Select model.\n4. Write prompt.\n5. Generate and export.");
});

app.get("/api/export/autopost-extension", async (_req, res, next) => {
  try {
    const zip = await zipDirectory(autoPostExtensionDir);
    res
      .attachment("duitok-autopost-extension.zip")
      .type("application/zip")
      .send(zip);
  } catch (error) {
    next(error);
  }
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
