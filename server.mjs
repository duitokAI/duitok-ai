import "dotenv/config";
import crypto from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createViteServer } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(root, "data");
const dbPath = path.join(dataDir, "db.json");
const distDir = path.join(root, "dist");
const port = Number(process.env.PORT || 4173);
const serveStatic = process.env.SERVE_STATIC !== "false";
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
  res.json({ ok: true });
});

function blankProject(id, name) {
  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    image: { model: "Banana Pro", mode: "Create Image", prompt: "" },
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

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  try {
    const db = JSON.parse(await readFile(dbPath, "utf8"));
    db.users ||= structuredClone(seed.users);
    db.payments ||= [];
    db.supportTickets ||= [];
    return db;
  } catch {
    await writeFile(dbPath, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }
}

async function saveDb(db) {
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

function publicAppUrl(pathname) {
  const base = (process.env.PUBLIC_APP_URL || `http://localhost:${port}`).replace(/\/$/, "");
  return `${base}${pathname}`;
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "duitok-ai" });
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
  res.json(await mutateDb(async (db) => {
    const project = findProject(db, req.params.id);
    const [title, text] = generatedCopy(req.body.action, req.body.step);
    project.results.push({ id: crypto.randomUUID(), type: req.body.step, title, body: text, createdAt: new Date().toISOString() });
    db.billing.credits = Math.max(0, db.billing.credits - 4);
    db.usage.unshift(usage(title, 4));
    return saveDb(db);
  }));
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
