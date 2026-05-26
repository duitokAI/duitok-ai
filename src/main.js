import "./styles.css";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isStudioPath = () => window.location.pathname.startsWith("/studio");
const pathIs = (path) => window.location.pathname === path;

const steps = [
  ["image", "image", "Image", "01"],
  ["ugc", "video", "UGC", "02"],
  ["auto", "wand-sparkles", "Auto Content", "03"],
  ["original", "film", "Original Video", "04"],
  ["clone", "layers-3", "Clone Prompt", "05"],
  ["story", "book-open", "Storytelling", "06"],
  ["viral", "film", "Viral", "07"]
];

const pages = [
  ["attachments", "image", "Attachments"],
  ["billing", "credit-card", "Billing"],
  ["topup", "wallet-cards", "Top Up Credit"],
  ["affiliate", "users", "Affiliate"],
  ["usage", "activity", "Usage"],
  ["autopost", "send", "Auto Post TikTok"],
  ["whatsapp", "message-circle", "Join Discussion WhatsApp"]
];

const state = {
  loading: true,
  user: JSON.parse(localStorage.getItem("duitok-user") || "null"),
  db: null,
  page: "dashboard",
  step: "image",
  projectId: null,
  modal: null,
  search: "",
  live: false,
  chat: false
};

const icon = (name, size = 20) => `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function api(path, options = {}) {
  const res = await fetch(`${apiBaseUrl}/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.headers.get("content-type")?.includes("application/json") ? res.json() : res;
}

async function boot() {
  if (isStudioPath() && state.user) await ensureStudioData();
  state.loading = false;
  render();
  showPaymentReturnNotice();
}

async function ensureStudioData() {
  if (state.db) return;
  state.db = await api("/state");
  state.projectId = state.db.projects[0]?.id;
}

function set(patch) {
  Object.assign(state, patch);
  render();
}

function project() {
  return state.db.projects.find((item) => item.id === state.projectId) || state.db.projects[0];
}

function render() {
  app.innerHTML = state.loading ? `<main class="loading">${icon("loader-circle")} Loading...</main>` : route();
  bind();
  window.lucide?.createIcons();
}

function route() {
  if (isStudioPath()) return state.user ? studio() : login();
  if (pathIs("/login")) return login();
  if (pathIs("/register")) return registerPage();
  if (pathIs("/affiliate")) return affiliatePage();
  return publicSite();
}

function publicSite() {
  return `
    <main class="public-shell">
      <div class="promo-bar">${icon("timer", 18)} Promo RM75/bulan ends tonight · 13 launch slots left</div>
      <nav class="public-nav">
        ${brand("Content Engine")}
        <div class="public-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="/affiliate">Affiliate</a>
          <a href="#faq">FAQ</a>
        </div>
        <button class="dark-button" data-action="open-login">${icon("log-in")} Sign in</button>
      </nav>
      <section class="public-hero">
        <div>
          <p class="eyebrow">1,300+ Malaysia sellers can scale content faster</p>
          <h1>Competitors post 10 videos. You start today.</h1>
          <p class="public-copy">Paste a product link and let Duitok  AI plan images, UGC scripts, Malay hooks, captions, and TikTok Shop posting ideas without a creator team.</p>
          <div class="public-actions">
            <button class="gold-button" data-action="open-register">${icon("sparkles")} Start creating</button>
            <button class="dark-button" data-action="open-whatsapp">${icon("message-circle")} WhatsApp</button>
          </div>
          <div class="trust-row"><span>4.9 rating</span><span>7 sellers generating now</span><span>30-day guarantee</span></div>
        </div>
        <section class="hero-board">
          <div class="race-card"><span>You</span><b>1 video / day</b></div>
          <div class="race-card hot"><span>Competitor</span><b>10 videos / day</b></div>
          <div class="race-meter"><i></i></div>
          <strong>Duitok  AI catches up in minutes</strong>
        </section>
      </section>
      <section class="public-grid three">
        <article><span>Speed</span><h3>100 ideas in one sitting.</h3><p>Generate a full content month while your team handles orders.</p></article>
        <article><span>Price</span><h3>Lean enough for small sellers.</h3><p>Start from RM75/month, then top up credits only when you generate.</p></article>
        <article><span>Simple</span><h3>Paste link. Choose output. Export.</h3><p>No prompt engineering course. No editor timeline. No production calendar mess.</p></article>
      </section>
      <section class="split-section">
        <div><p class="eyebrow">Seller reality</p><h2>Every day without fresh content is reach left on the table.</h2><p>Between packing orders, replying customers, checking stock, and chasing suppliers, content becomes the thing you know you should do but keep delaying.</p></div>
        <div class="pain-list">
          <article><h3>Not enough time</h3><p>Manual shooting turns one simple product into a half-day task.</p></article>
          <article><h3>Content ideas dry up</h3><p>Repeating the same angle makes the algorithm bored before buyers even see you.</p></article>
          <article><h3>AI tools feel scattered</h3><p>One app for image, one app for script, one spreadsheet for captions. Too much switching.</p></article>
          <article><h3>Competitors move faster</h3><p>Volume plus consistency wins attention. Slow teams pay for it later.</p></article>
        </div>
      </section>
      <section id="features" class="feature-section">
        <p class="eyebrow">Your advantage</p>
        <h2>Five content weapons for TikTok Shop sellers.</h2>
        <div class="feature-mosaic">
          ${featureCard("STOP THE PANIC", "10 days of content in one click.", "Let the AI plan hooks, scripts, captions, CTAs, and batch angles before your next campaign starts.", "calendar-check")}
          ${featureCard("PROTECT IDENTITY", "Use avatar-first UGC.", "Create creator-style scripts and assets without turning your own face into the brand.", "user-round")}
          ${featureCard("FAST OUTPUT", "From product link to post idea.", "Move from product URL to ready content angles in minutes, not meetings.", "zap")}
          ${featureCard("REVERSE ENGINEER", "Decode viral references.", "Turn competitor patterns into your own product-safe hook structure.", "scan-search")}
          ${featureCard("SLEEP MODE", "Plan while the shop runs.", "Prepare posting schedules and exportable content batches for the week ahead.", "moon")}
        </div>
      </section>
      <section id="demo" class="demo-section">
        <div>
          <p class="eyebrow">Live output reel</p>
          <h2>Output previews, not theory.</h2>
          <p>Use these as placeholders for real generated video once your AI media API is connected. The layout is ready for MP4 cards, captions, duration badges, and product categories.</p>
        </div>
        <div class="demo-reel">
          ${demoCard("8s", "Hijab skincare UGC", "Malay soft-sell hook")}
          ${demoCard("16s", "Kitchenware proof", "Before/after angle")}
          ${demoCard("9:16", "Gadget review", "Objection handling")}
        </div>
      </section>
      <section class="comparison-section">
        <p class="eyebrow">Manual vs Duitok  AI</p>
        <h2>The old workflow burns days. The new one compresses decisions.</h2>
        <div class="compare-grid">
          <article><span>Old way</span><h3>Manual production</h3><ul><li>Find creator or shoot yourself</li><li>Write script and brief</li><li>Edit, revise, caption manually</li><li>Repeat again tomorrow</li></ul></article>
          <article class="winner"><span>Duitok  AI way</span><h3>AI-assisted content engine</h3><ul><li>Paste product link</li><li>Pick image, UGC, clone, or story mode</li><li>Generate batch-ready outputs</li><li>Export or continue inside Studio</li></ul></article>
        </div>
      </section>
      <section class="testimonial-section">
        <p class="eyebrow">Real seller style feedback</p>
        <h2>Built for sellers who need output, not another complicated dashboard.</h2>
        <div class="quote-grid">
          ${quote("Feels like a small content team inside one tab.", "Aina R.", "Skincare seller")}
          ${quote("The Malay hooks are the part I needed most. Faster than briefing a freelancer.", "Faizul A.", "Supplement brand")}
          ${quote("Clone mode makes competitor research useful instead of stressful.", "Nadia M.", "Fashion seller")}
          ${quote("I can plan a week of content before lunch.", "Hafiz Z.", "Gadget seller")}
        </div>
      </section>
      <section id="pricing" class="pricing-section">
        <div><p class="eyebrow">Pricing</p><h2>One launch plan. Add credits when you need more output.</h2><p>Subscription unlocks the Studio. Credits are used for generation, exports, and future AI worker actions.</p></div>
        <article class="price-card">
          <span>Launch offer</span>
          <h3>Duitok  AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM75</b><small>/month</small></div>
          <ul><li>Image Studio</li><li>UGC Script Studio</li><li>Auto Content Batch</li><li>Clone Prompt Mode</li><li>Storytelling Frameworks</li><li>VIP support channel</li></ul>
          <button class="gold-button" data-action="open-register">${icon("credit-card")} Claim RM75 plan</button>
        </article>
      </section>
      <section class="signup-section">
        <div><p class="eyebrow">Start now</p><h2>Register and activate in one minute.</h2><p>Use the Studio sign-in flow now. Payment and account automation will connect to CHIP when your merchant keys are ready.</p></div>
        <form class="lead-form" data-form="lead">
          <label>Full name<input name="name" placeholder="Your name"></label>
          <label>WhatsApp<input name="phone" placeholder="+60"></label>
          <label>Email<input name="email" placeholder="you@duitok.com"></label>
          <button class="gold-button" type="submit">${icon("lock")} Continue to registration</button>
        </form>
      </section>
      <section id="faq" class="faq-section">
        <p class="eyebrow">FAQ</p>
        <h2>Questions sellers ask before starting.</h2>
        <details open><summary>Do I need to know how to shoot video?</summary><p>No. Duitok  AI is designed around product links, prompts, scripts, and repeatable content structures.</p></details>
        <details><summary>Can this work for Malay content?</summary><p>Yes. The product is shaped for Malaysia seller workflows and informal Bahasa Melayu content direction.</p></details>
        <details><summary>Is auto-posting ready?</summary><p>The current build prepares scheduling states and exports. Full TikTok auto-posting should be connected after API approval.</p></details>
        <details><summary>Where do I manage projects?</summary><p>Go to /studio, sign in, and use the workspace for projects, billing, usage, affiliate, and support.</p></details>
      </section>
      <footer class="public-footer"><b>Duitok  AI</b><span>© 2026</span><a href="mailto:hello@duitok.com">hello@duitok.com</a></footer>
    </main>`;
}

function registerPage() {
  return `
    <main class="public-shell">
      <nav class="public-nav">
        ${brand("Checkout")}
        <button class="dark-button" data-action="open-home">${icon("arrow-left")} Home</button>
      </nav>
      <section class="register-hero">
        <div>
          <p class="eyebrow">Start now</p>
          <h1>Register, pay, and activate your Studio.</h1>
          <p class="public-copy">This page mirrors the Duitok  AI checkout flow: plan confirmation on one side, buyer details on the other. CHIP payment will be connected after your merchant keys are ready.</p>
          <div class="checkout-steps">
            <article><b>1</b><span>Subscribe plan</span><p>Unlock all content tools and low generation rates.</p></article>
            <article><b>2</b><span>Top up credits</span><p>RM1 = 1 credit. Credits are used when generating assets.</p></article>
            <article><b>3</b><span>Generate outputs</span><p>Image, UGC, clone, story, and batch tools deduct automatically.</p></article>
          </div>
        </div>
        <article class="price-card checkout-card">
          <span>Launch offer</span>
          <h3>Duitok  AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM75</b><small>/month</small></div>
          <ul><li>Full Studio access</li><li>Prompt library</li><li>Image and video workflows</li><li>Clone prompt mode</li><li>VIP WhatsApp support</li></ul>
        </article>
      </section>
      <section id="checkout" class="signup-section checkout-section">
        <div>
          <p class="eyebrow">Buyer details</p>
          <h2>Account info for login and support.</h2>
          <p>After payment is connected, this form should create a pending purchase, redirect to CHIP, then activate the account after callback.</p>
        </div>
        <form class="lead-form" data-form="register">
          <label>Full name<input name="name" placeholder="Your full name" required></label>
          <label>WhatsApp<input name="phone" placeholder="+60" required></label>
          <label>Email<input name="email" type="email" placeholder="you@duitok.com" required></label>
          <label class="check-label"><input type="checkbox" required> <span>I agree to Terms and Privacy Policy.</span></label>
          <button class="gold-button" type="submit">${icon("credit-card")} Pay RM75 - FPX / DuitNow QR</button>
          <small>Secured via CHIP Payment once API keys are configured.</small>
        </form>
      </section>
    </main>`;
}

function affiliatePage() {
  return `
    <main class="public-shell affiliate-shell">
      <nav class="public-nav">
        ${brand("Affiliate")}
        <button class="dark-button" data-action="open-home">${icon("arrow-left")} Main page</button>
      </nav>
      <section class="affiliate-hero">
        <div>
          <p class="eyebrow">Affiliate program</p>
          <h1>Earn monthly commission by sharing Duitok  AI.</h1>
          <p class="public-copy">For creators, agencies, coaches, and seller communities. Share one link, help sellers create faster, and earn on active subscriptions.</p>
          <div class="public-actions">
            <a class="gold-button" href="#affiliate-form">${icon("users")} Apply now</a>
            <button class="dark-button" data-action="open-register">${icon("sparkles")} Try product</button>
          </div>
        </div>
        <div class="commission-orbit">
          <b>RM15</b>
          <span>per referral / month</span>
          <i>UGC</i><i>Image</i><i>Auto Post</i><i>Clone</i>
        </div>
      </section>
      <section class="public-grid three">
        <article><span>Recurring</span><h3>20% while they stay active.</h3><p>One successful referral can keep paying every month.</p></article>
        <article><span>Fast setup</span><h3>Get tracking link and sample creatives.</h3><p>Use your own audience without building a product from scratch.</p></article>
        <article><span>Low friction</span><h3>Sellers already understand the pain.</h3><p>Content volume, Malay scripts, and TikTok consistency are easy to explain.</p></article>
      </section>
      <section class="feature-section">
        <p class="eyebrow">How it works</p>
        <h2>Four steps to start earning.</h2>
        <div class="checkout-steps affiliate-steps">
          <article><b>1</b><span>Apply affiliate</span><p>Send your name, channel, and audience type.</p></article>
          <article><b>2</b><span>Get account access</span><p>Use the product so your content can show real workflows.</p></article>
          <article><b>3</b><span>Share your link</span><p>Every buyer through your link is tracked to your wallet.</p></article>
          <article><b>4</b><span>Cash out</span><p>Request payout after crossing the minimum threshold.</p></article>
        </div>
      </section>
      <section id="affiliate-form" class="signup-section">
        <div><p class="eyebrow">Apply</p><h2>Tell us where you will promote.</h2><p>This will become the affiliate application flow once database and notifications are connected.</p></div>
        <form class="lead-form" data-form="affiliate">
          <label>Full name<input name="name" placeholder="Your name" required></label>
          <label>WhatsApp<input name="phone" placeholder="+60" required></label>
          <label>Audience/channel<input name="channel" placeholder="TikTok, Telegram, agency, community..." required></label>
          <button class="gold-button" type="submit">${icon("send")} Submit application</button>
        </form>
      </section>
      <footer class="public-footer"><b>Duitok  AI Affiliate</b><span>© 2026</span><a href="mailto:hello@duitok.com">hello@duitok.com</a></footer>
    </main>`;
}

function featureCard(kicker, title, text, ic) {
  return `<article>${icon(ic, 30)}<span>${kicker}</span><h3>${title}</h3><p>${text}</p></article>`;
}

function quote(text, name, role) {
  return `<article><p>"${text}"</p><b>${name}</b><span>${role}</span></article>`;
}

function demoCard(duration, title, text) {
  return `<article><div class="demo-screen">${icon("play", 36)}</div><span>${duration}</span><h3>${title}</h3><p>${text}</p></article>`;
}

function login() {
  return `
    <main class="login-shell">
      <section class="login-card">
        ${brand()}
        <p class="eyebrow">Welcome back</p>
        <h1>Sign in untuk teruskan generate UGC viral.</h1>
        <form data-form="login" class="login-form">
          <label>Email<input name="email" type="email" value="admin@duitok.com" required></label>
          <label>Password<input name="password" type="password" value="duitok123" required></label>
          <button class="gold-button" type="submit">${icon("log-in")} Sign in</button>
        </form>
        <button class="text-button" data-action="forgot">Lupa password? Hantar di WhatsApp -></button>
        <button class="text-button" data-action="register">Belum ada akaun? Pilih plan & daftar</button>
      </section>
      ${modal()}
    </main>`;
}

function studio() {
  return `
    <div class="studio-shell">
      <aside class="sidebar">
        ${brand()}
        <button class="side-primary ${state.page === "dashboard" ? "active" : ""}" data-page="dashboard">${icon("sparkles")} Dashboard</button>
        <button class="new-project" data-action="new-project">${icon("plus")} <span>New project</span><b>${state.db.projects.length}/5</b></button>
        <label class="search-box">${icon("search", 18)}<input data-search value="${esc(state.search)}" placeholder="Search"></label>
        <div class="side-section">${icon("folder", 18)} Projects</div>
        <div class="project-list">${projectButtons()}</div>
        <div class="side-section account">Public Tools</div>
        ${pages.map(([id, ic, label]) => `<button class="side-link ${state.page === id ? "active" : ""}" data-page="${id}">${icon(ic)} ${label}${id === "whatsapp" ? icon("arrow-up-right", 14) : ""}</button>`).join("")}
        <button class="side-link logout" data-action="logout">${icon("log-out")} Sign out</button>
      </aside>
      <main class="workspace">${page()}</main>
      <button class="live-tab" data-action="live">${icon("activity", 18)} LIVE - ${state.db.liveCount}</button>
      <button class="chat-bubble" data-action="chat">${icon("message-circle", 34)}</button>
      ${state.live ? livePanel() : ""}
      ${state.chat ? chatPanel() : ""}
      ${modal()}
    </div>`;
}

function brand(label = "Studio") {
  return `<div class="brand-lockup"><span class="logo-mark">${icon("scissors", 28)}</span><div><b>Duitok  AI</b><strong>${label}</strong></div></div>`;
}

function projectButtons() {
  return state.db.projects
    .filter((item) => item.name.toLowerCase().includes(state.search.toLowerCase()))
    .map((item) => `<button class="project-button ${item.id === state.projectId ? "active" : ""}" data-project="${item.id}">${icon("folder")} <span>${item.name}</span></button>`)
    .join("") || `<p class="empty-text">No projects found.</p>`;
}

function page() {
  if (state.page !== "dashboard") return accountPage();
  const p = project();
  return `
    <header class="project-head">
      <div><p class="folder-label">${icon("folder", 18)} Project</p><h1>${p.name}</h1></div>
      <button class="sop-button" data-action="sop">${icon("book-open", 25)} SOP Image</button>
    </header>
    <nav class="step-tabs">
      ${steps.map(([id, ic, label, no]) => `<button class="${state.step === id ? "active" : ""}" data-step="${id}">${icon(ic)} <span>${label}</span><b>${no}</b></button>`).join("")}
    </nav>
    <section class="canvas-card">${stepPanel(p)}</section>`;
}

function stepPanel(p) {
  const panels = {
    image: imagePanel,
    ugc: ugcPanel,
    auto: autoPanel,
    original: originalPanel,
    clone: clonePanel,
    story: storyPanel,
    viral: viralPanel
  };
  return panels[state.step](p);
}

function imagePanel(p) {
  return `
    <div class="generator-box"><h2>🖼️ Image Generator</h2><div class="form-grid two">${select("image.model", "Model", ["Banana Pro", "Seedream", "Nano Banana"], p.image.model)}${select("image.mode", "Mode", ["Create Image", "Edit Image", "Product Scene"], p.image.mode)}</div></div>
    ${upload("Avatar Reference (Optional)", "Click or drop character face image", "Face / person - used for all variations", "camera", "avatar")}
    ${upload("Product Reference (Optional)", "Click or drop product image", "Product - used for all images and videos", "package", "product")}
    ${prompt("image.prompt", p.image.prompt, "Describe the product shot, background, pose, outfit, and mood.", "generate-image", "Generate Image")}
    ${results(p, "image")}`;
}

function ugcPanel(p) {
  return `<div class="generator-box"><h2>${icon("video")} UGC Generator</h2><div class="form-grid three">${select("ugc.avatar", "Avatar", ["Malay female", "Chinese male", "Hijab creator"], p.ugc.avatar)}${select("ugc.voice", "Voice", ["BM Casual", "Manglish", "English MY"], p.ugc.voice)}${select("ugc.length", "Length", ["15 seconds", "30 seconds", "45 seconds"], p.ugc.length)}</div></div>${prompt("ugc.script", p.ugc.script, "Write the UGC script.", "generate-ugc", "Generate UGC")}${results(p, "ugc")}`;
}

function autoPanel(p) {
  return `<div class="generator-box"><h2>${icon("wand-sparkles")} Auto Content</h2><div class="form-grid three">${select("auto.platform", "Platform", ["TikTok", "Instagram Reels", "YouTube Shorts"], p.auto.platform)}${select("auto.batch", "Batch", ["3 posts", "7 posts", "14 posts"], p.auto.batch)}${select("auto.tone", "Tone", ["Educational", "Soft sell", "Viral hook"], p.auto.tone)}</div></div><div class="prompt-block"><label>Product URL<input data-field="auto.productUrl" value="${esc(p.auto.productUrl)}" placeholder="https://www.tiktok.com/shop/..."></label><button class="gold-button" data-action="generate-auto">${icon("calendar-plus")} Build Batch</button></div>${schedule()}`;
}

function originalPanel(p) {
  return `${upload("Original Video", "Upload original video", "MP4 / MOV - used for caption and remake", "film", "original")}${prompt("original.brief", p.original.brief, "Rewrite brief.", "analyze-original", "Analyze Video")}${results(p, "original")}`;
}

function clonePanel(p) {
  return `<div class="generator-box"><h2>${icon("layers-3")} Clone Prompt</h2><label>Reference video URL<input data-field="clone.url" value="${esc(p.clone.url)}" placeholder="Paste viral TikTok URL"></label></div>${prompt("clone.rules", p.clone.rules, "Clone rules.", "clone-prompt", "Generate Clone Prompt")}${results(p, "clone")}`;
}

function storyPanel(p) {
  return `<div class="generator-box"><h2>${icon("book-open")} Storytelling</h2><div class="form-grid two">${select("story.arc", "Story Arc", ["Problem -> proof -> offer", "Before / after", "Founder journey"], p.story.arc)}${select("story.market", "Market", ["Malaysia TikTok Shop", "Local service", "Info product"], p.story.market)}</div></div>${prompt("story.notes", p.story.notes, "Story notes.", "write-story", "Write Story")}${results(p, "story")}`;
}

function viralPanel(p) {
  return `<div class="generator-box"><h2>${icon("film")} Viral Research</h2><div class="form-grid two"><label>Competitor URL<input data-field="viral.url" value="${esc(p.viral.url)}" placeholder="Paste competitor video"></label>${select("viral.depth", "Depth", ["Quick decode", "Deep script map", "Hook library"], p.viral.depth)}</div></div><div class="prompt-block"><button class="gold-button" data-action="decode-viral">${icon("trending-up")} Decode Viral</button><button class="dark-button" data-action="export-project">${icon("download")} Export Project</button></div>${results(p, "viral")}`;
}

function select(field, label, options, value) {
  return `<label>${label}<select data-field="${field}">${options.map((item) => `<option ${item === value ? "selected" : ""}>${item}</option>`).join("")}</select></label>`;
}

function upload(title, main, sub, ic, kind) {
  return `<section class="upload-card"><h2>${icon(ic)} ${title}</h2><label class="drop-zone"><input type="file" data-upload="${kind}" hidden><span>${icon(ic, 44)}</span><strong>${main}</strong><small>${sub}</small></label></section>`;
}

function prompt(field, value, placeholder, action, button) {
  return `<div class="prompt-block"><label>Prompt<textarea data-field="${field}" placeholder="${placeholder}">${esc(value)}</textarea></label><button class="gold-button" data-action="${action}">${icon("sparkles")} ${button}</button></div>`;
}

function results(p, type) {
  const items = p.results.filter((item) => item.type === type).slice(-4).reverse();
  if (!items.length) return `<section class="empty-result">${icon("sparkles")} No ${type} results yet.</section>`;
  return `<section class="result-grid">${items.map((item) => `<article><b>${item.title}</b><p>${item.body}</p><button data-result="${item.id}">${icon("download")} Export</button></article>`).join("")}</section>`;
}

function accountPage() {
  const map = {
    attachments: ["Attachments", "Upload records saved to backend.", table(state.db.attachments.map((x) => [x.name, x.kind, new Date(x.createdAt).toLocaleString()]))],
    billing: ["Billing", "Invoices and plan state are persisted.", `<div class="metric-row"><article><span>Plan</span><strong>${state.db.billing.plan}</strong></article><article><span>Credits</span><strong>${state.db.billing.credits}</strong></article><article><span>Next bill</span><strong>${state.db.billing.nextBill}</strong></article></div>${invoiceTable()}`],
    topup: ["Top Up Credit", "Credit purchases update the backend ledger.", `<div class="topup-grid">${[10, 30, 50, 100].map((x) => `<button data-topup="${x}"><strong>${x}</strong><span>credits</span><b>RM${x}</b></button>`).join("")}</div>`],
    affiliate: ["Affiliate", "Referral links and payouts.", `<div class="metric-row"><article><span>Code</span><strong>${state.db.affiliate.code}</strong></article><article><span>Clicks</span><strong>${state.db.affiliate.clicks}</strong></article><article><span>Payout</span><strong>RM${state.db.affiliate.payout}</strong></article></div><button class="gold-button" data-action="copy-affiliate">${icon("copy")} Copy referral link</button>`],
    usage: ["Usage", "Every generated action is written to history.", table(state.db.usage.map((x) => [x.action, `${x.credits} credits`, new Date(x.createdAt).toLocaleString()]))],
    autopost: ["Auto Post TikTok", "Publishing queue with saved states.", schedule()],
    whatsapp: ["Join Discussion WhatsApp", "Community handoff.", `<button class="gold-button" data-action="open-whatsapp">${icon("message-circle")} Open WhatsApp Group</button>`]
  };
  const [title, subtitle, body] = map[state.page];
  return `<header class="project-head"><div><p class="folder-label">${icon("folder", 18)} Public Workspace</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><button class="sop-button" data-action="export-all">${icon("download")} Export Data</button></header><section class="canvas-card slim">${body}</section>`;
}

function table(rows) {
  return `<div class="table">${rows.map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><small>${c || ""}</small></div>`).join("") || `<p class="empty-text">No records yet.</p>`}</div>`;
}

function invoiceTable() {
  return `<div class="table">${state.db.billing.invoices.map((x) => `<div><span>${x.id}</span><b>RM${x.amount}</b><button data-invoice="${x.id}">${icon("download")} Download</button></div>`).join("")}</div>`;
}

function schedule() {
  return `<section class="schedule-list">${state.db.schedule.map((x) => `<article><b>${x.title}</b><span>${x.platform}</span><small>${x.time}</small><button data-schedule="${x.id}">${icon("settings")} ${x.status}</button></article>`).join("")}</section>`;
}

function modal() {
  if (!state.modal) return "";
  const title = { newProject: "Create New Project", register: "Choose Plan & Register", sop: "SOP Image", export: "Export Ready", chat: "Duitok  AI Support" }[state.modal];
  const body = {
    newProject: `<form data-form="project"><label>Project name<input name="name" placeholder="Project ${(state.db?.projects.length || 0) + 1}" required></label><button class="gold-button" type="submit">${icon("plus")} Create</button></form>`,
    register: `<form data-form="login"><label>Email<input name="email" type="email" placeholder="you@duitok.com" required></label><label>Password<input name="password" type="password" placeholder="Create password" required></label><button class="gold-button" type="submit">${icon("lock")} Register & Enter Studio</button></form>`,
    sop: `<div class="sop-sheet"><b>Image SOP</b><ol><li>Upload avatar face.</li><li>Upload product reference.</li><li>Select model and mode.</li><li>Write prompt.</li><li>Generate, save, export.</li></ol><button class="dark-button" data-action="download-sop">${icon("download")} Download SOP</button></div>`,
    export: `<p>Your export has started. Files are generated by the backend.</p><button class="gold-button" data-action="close-modal">${icon("check")} Done</button>`,
    chat: `<p>How can Duitok  AI help?</p><button class="gold-button" data-action="support-ticket">${icon("send")} Create Support Ticket</button>`
  }[state.modal];
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal"><button class="icon-only close" data-action="close-modal">${icon("x")}</button><p class="folder-label">${icon("sparkles", 18)} Duitok  AI</p><h2>${title}</h2>${body}</section></div>`;
}

function livePanel() {
  return `<aside class="live-panel"><h3>${icon("activity")} Live Activity</h3>${state.db.usage.slice(0, 6).map((x) => `<p>${x.action}<small>${x.credits} credits</small></p>`).join("")}</aside>`;
}

function chatPanel() {
  return `<aside class="chat-panel"><h3>${icon("message-circle")} Support</h3><p>Backend ticket queue is ready.</p><button data-action="support-ticket">Create ticket</button></aside>`;
}

function bind() {
  document.querySelectorAll("[data-page]").forEach((el) => el.addEventListener("click", () => set({ page: el.dataset.page })));
  document.querySelectorAll("[data-step]").forEach((el) => el.addEventListener("click", () => set({ step: el.dataset.step })));
  document.querySelectorAll("[data-project]").forEach((el) => el.addEventListener("click", () => set({ projectId: el.dataset.project, page: "dashboard" })));
  document.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", (e) => action(e, el.dataset.action)));
  document.querySelectorAll("[data-field]").forEach((el) => el.addEventListener("change", fieldChange));
  document.querySelectorAll("[data-upload]").forEach((el) => el.addEventListener("change", uploadChange));
  document.querySelectorAll("[data-topup]").forEach((el) => el.addEventListener("click", () => topup(Number(el.dataset.topup))));
  document.querySelectorAll("[data-schedule]").forEach((el) => el.addEventListener("click", () => scheduleUpdate(el.dataset.schedule)));
  document.querySelectorAll("[data-invoice]").forEach((el) => el.addEventListener("click", () => download(`/api/export/invoice/${el.dataset.invoice}`, `${el.dataset.invoice}.txt`)));
  document.querySelectorAll("[data-result]").forEach((el) => el.addEventListener("click", () => download(`/api/export/result/${el.dataset.result}`, `duitok-result.txt`)));
  document.querySelectorAll("form").forEach((el) => el.addEventListener("submit", submit));
  document.querySelector("[data-search]")?.addEventListener("input", (e) => set({ search: e.target.value }));
}

async function action(event, name) {
  if (name === "close-modal" && event.target !== event.currentTarget && event.currentTarget.classList.contains("modal-backdrop")) return;
  if (name === "close-modal") return set({ modal: null });
  if (name === "new-project") return set({ modal: "newProject" });
  if (name === "sop") return set({ modal: "sop" });
  if (name === "register") return set({ modal: "register" });
  if (name === "open-home") {
    window.history.pushState({}, "", "/");
    return render();
  }
  if (name === "open-login") {
    window.history.pushState({}, "", "/login");
    return render();
  }
  if (name === "open-register") {
    window.history.pushState({}, "", "/register");
    return render();
  }
  if (name === "open-studio") {
    if (state.user) await ensureStudioData();
    window.history.pushState({}, "", "/studio");
    return render();
  }
  if (name === "live") return set({ live: !state.live });
  if (name === "chat") return set({ chat: !state.chat });
  if (name === "logout") {
    localStorage.removeItem("duitok-user");
    return set({ user: null, modal: null });
  }
  if (name === "forgot") return window.open("https://wa.me/60123456789", "_blank");
  if (name === "open-whatsapp") return window.open("https://wa.me/60123456789", "_blank");
  if (name === "copy-affiliate") { await navigator.clipboard?.writeText("https://duitok.com/ref/DUIT2026"); return notify("Affiliate link copied."); }
  if (name === "support-ticket") return mutate("/support", { method: "POST", body: JSON.stringify({ message: "Support ticket from studio" }) }, "Support ticket saved.");
  if (name === "download-sop") return download("/api/export/sop", "duitok-image-sop.txt");
  if (name === "export-all") return download("/api/export/all", "duitok-data.json");
  if (name === "export-project") return download(`/api/export/project/${state.projectId}`, `${project().name}.json`);
  if (name?.startsWith("generate") || ["analyze-original", "clone-prompt", "write-story", "decode-viral"].includes(name)) return generate(name);
}

async function submit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (event.currentTarget.dataset.form === "login") {
    const res = await api("/auth/login", { method: "POST", body: JSON.stringify(data) });
    state.db ||= await api("/state");
    state.projectId ||= state.db.projects[0]?.id;
    localStorage.setItem("duitok-user", JSON.stringify(res.user));
    window.history.pushState({}, "", "/studio");
    return set({ user: res.user, modal: null });
  }
  if (event.currentTarget.dataset.form === "lead") {
    notify("Opening registration.");
    window.history.pushState({}, "", "/register");
    return render();
  }
  if (event.currentTarget.dataset.form === "register") {
    notify("Payment API not connected yet. Opening Studio login.");
    window.history.pushState({}, "", "/studio");
    return render();
  }
  if (event.currentTarget.dataset.form === "affiliate") {
    return notify("Affiliate application saved for the next backend phase.");
  }
  if (event.currentTarget.dataset.form === "project") {
    const db = await api("/projects", { method: "POST", body: JSON.stringify(data) });
    return set({ db, projectId: db.projects.at(-1).id, modal: null, page: "dashboard" });
  }
}

async function fieldChange(event) {
  const db = await api(`/projects/${state.projectId}/field`, { method: "PATCH", body: JSON.stringify({ field: event.target.dataset.field, value: event.target.value }) });
  set({ db });
  notify("Saved.");
}

async function uploadChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const db = await api("/attachments", { method: "POST", body: JSON.stringify({ projectId: state.projectId, kind: event.target.dataset.upload, name: file.name, size: file.size, type: file.type }) });
  set({ db });
  notify(`${file.name} saved to backend.`);
}

async function generate(name) {
  const db = await api(`/projects/${state.projectId}/generate`, { method: "POST", body: JSON.stringify({ action: name, step: state.step }) });
  set({ db });
  notify("Generated result saved.");
}

async function topup(amount) {
  notify("Opening secure CHIP payment page...");
  const res = await api("/billing/topup", {
    method: "POST",
    body: JSON.stringify({
      amount,
      email: state.user?.email,
      fullName: state.user?.name
    })
  });
  window.location.href = res.checkoutUrl;
}

async function scheduleUpdate(id) {
  const db = await api(`/schedule/${id}`, { method: "PATCH" });
  set({ db });
  notify("Schedule status updated.");
}

async function mutate(path, options, message) {
  const db = await api(path, options);
  set({ db, modal: null });
  notify(message);
}

async function download(url, filename) {
  const res = await fetch(url.startsWith("/api") ? `${apiBaseUrl}${url}` : url);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  set({ modal: "export" });
}

function showPaymentReturnNotice() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");
  if (!payment) return;

  const messages = {
    success: "Payment received. Credits update after CHIP callback.",
    failed: "Payment failed. Please try again.",
    cancelled: "Payment cancelled."
  };
  window.history.replaceState({}, "", window.location.pathname);
  setTimeout(() => notify(messages[payment] || "Payment status updated."), 400);
}

boot().catch((error) => {
  state.loading = false;
  render();
  notify(error.message);
});
