import "./styles.css";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isStudioPath = () => window.location.pathname.startsWith("/studio") || window.location.pathname.startsWith("/admin");
const pathIs = (path) => window.location.pathname === path;
const ownerAdminEmails = new Set(["admin@pokaya.ai"]);
const whatsappGroupUrl = "https://chat.whatsapp.com/ERz2477U1gJFJHFsXtiMJH?mode=gi_t";
const supportWhatsappUrl = "https://wa.me/60163100131";
const promoCycleMs = 5 * 60 * 60 * 1000;
const legacyBrandPrefix = ["dui", "tok"].join("");
const storageKeys = {
  user: "pokaya-user",
  token: "pokaya-auth",
  adminKey: "pokaya-admin-key",
  lang: "pokaya-lang",
  sidebarCollapsed: "pokaya-sidebar-collapsed",
  studioWallZoom: "pokaya-studio-wall-zoom",
  agentMessages: "pokaya-agent-messages",
  agentContextSummary: "pokaya-agent-context-summary",
  agentHistory: "pokaya-agent-history",
  agentHistoryBackup: "pokaya-agent-history-backup",
  agentDraftId: "pokaya-agent-draft-id",
  agentDraftInputs: "pokaya-agent-draft-inputs",
  agentActiveRun: "pokaya-agent-active-run"
};
const studioWallZoomMin = 2;
const studioWallZoomMax = 4;
function migrateStorageKey(key) {
  const legacyKey = `${legacyBrandPrefix}-${key.replace(/^pokaya-/, "")}`;
  const value = localStorage.getItem(key) ?? localStorage.getItem(legacyKey);
  if (value !== null && localStorage.getItem(key) === null) localStorage.setItem(key, value);
  localStorage.removeItem(legacyKey);
  return value;
}
Object.values(storageKeys).forEach(migrateStorageKey);
const agentHistoryStorageKey = storageKeys.agentHistory;
const agentDraftHistoryId = "__agent_new_chat_draft__";
function readStoredJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}
const agentHistoryLimit = 40;
let sidebarScrollTop = 0;
let promoCountdownTimer = null;
let assetSearchTimer = null;
let adminSearchTimer = null;
let sopSearchTimer = null;
let imagePresetSaveTimer = null;
let autoFrameworkSaveTimer = null;
let autoFrameworkSaveSeq = 0;
let imageConsoleScrollCleanup = null;
let studioWallInfiniteScrollCleanup = null;
let sidebarTooltipCleanup = null;
let navigationFrame = null;
let aspectRatioPopoverCleanup = null;
let imageCountSaveTimer = null;
let imageCountSaveSeq = 0;
let imageConsoleExpandLockUntil = 0;
let imageConsoleExpandedUntilUserScroll = false;
let imageConsoleUserScrollIntentUntil = 0;
const imageReferenceSaveSeq = new Map();
let resultTitleSaveTimer = null;
let generationPollTimer = null;
const generationStateEtags = new Map();
const studioWallLoadingKeys = new Set();
const resultPreviewPreloadCache = new Map();
let assetLibraryWarmFrame = null;
const quickFieldSaveTimers = new Map();
let quickFieldSaveSeq = 0;
const pendingAgentChatSync = new Set();

const steps = [
  ["image", "image", "stepImage", "01"],
  ["ugc", "video", "stepUgc", "02"],
  ["auto", "audio-lines", "stepAuto", "03"],
  ["original", "film", "stepOriginal", "04"],
  ["clone", "layers-3", "stepClone", "05"],
  ["story", "book-open", "stepStory", "06"]
];

const pages = [
  ["attachments", "image", "attachments"],
  ["billing", "credit-card", "billing"],
  ["topup", "wallet-cards", "topup"],
  ["affiliate", "users", "affiliate"],
  ["usage", "activity", "usage"],
  ["autopost", "send", "autopost"],
  ["whatsapp", "message-circle", "whatsapp"]
];

const wizardFeatures = [
  ["product-image", "image", "AI Product Image"],
  ["visual-card", "panels-top-left", "Visual Card"],
  ["short-video", "video", "AI Short Video"],
  ["ugc-script", "mic-2", "UGC Script"],
  ["content-plan", "calendar-days", "7-Day Content Plan"],
  ["clone-style", "copy-check", "Clone Viral Style"],
  ["ask-agent", "bot", "Ask Pokaya Agent"]
];

function defaultUgcPromptBuilder() {
  return {
    shotType: "Medium",
    shot: "Medium shot, waist up",
    subject: "same person from reference image, same appearance, holding the same product",
    actionType: "Hold + Smile",
    action: "She holds the product in her right hand facing the camera, smiles naturally, and speaks directly to camera with gentle hand gestures.",
    beginning: "",
    middle: "",
    closing: "",
    tone: "Santai",
    voice: "Perempuan 20an",
    style: "Cinematic",
    stylePrompt: "Soft natural lighting, shallow depth of field, cinematic film look, audio dialogue only, clean vertical frame.",
    builtPrompt: ""
  };
}

const state = {
  loading: true,
  user: readStoredJson(storageKeys.user, null),
  token: localStorage.getItem(storageKeys.token) || "",
  adminKey: localStorage.getItem(storageKeys.adminKey) || "",
  lang: localStorage.getItem(storageKeys.lang) || "zh",
  db: null,
  studioBootError: "",
  page: "project",
  step: "image",
  projectId: null,
  modal: null,
  search: "",
  adminUserId: null,
  adminSearch: "",
  adminStatusFilter: "all",
  adminSort: "lastActivity",
  adminOpsOpen: false,
  dateFrom: "2026-05-01",
  dateTo: "2026-05-26",
  live: false,
  chat: false,
  sopTopic: "dashboard",
  sopSearch: "",
  sopStepAnchor: "",
  sopProgress: readStoredJson("pokaya-sop-progress", {}),
  agentInput: "",
  agentInputComposing: false,
  agentRenderAfterComposition: false,
  agentBusy: false,
  agentTyping: false,
  sidebarCollapsed: localStorage.getItem(storageKeys.sidebarCollapsed) === "true",
  studioWallZoom: Number(localStorage.getItem(storageKeys.studioWallZoom) || 2),
  agentBusyStartedAt: 0,
  agentWorkingTick: 0,
  agentDebugOpen: false,
  agentVisualPhase: "idle",
  agentTaskMode: "idle",
  agentIdleActivity: "sleep",
  agentQueue: [],
  agentMessages: readStoredJson(storageKeys.agentMessages, []),
  agentContextSummary: "",
  agentAttachments: [],
  agentExpandedMessages: {},
  agentHistoryOpen: false,
  agentHistorySessions: [
    ...readStoredJson(agentHistoryStorageKey, []),
    ...readStoredJson(storageKeys.agentHistoryBackup, [])
  ],
  agentHistorySearch: "",
  agentHistoryEditingId: null,
  activeAgentHistoryId: null,
  activeAgentDraftId: localStorage.getItem(storageKeys.agentDraftId) || "",
  agentRecoveredRun: readStoredJson(storageKeys.agentActiveRun, null),
  activeAgentRunId: null,
  queuePolling: false,
  langOpen: false,
  imagePromptGroup: "avatar",
  generating: false,
  optimisticGenerationJobs: [],
  promptAdvancedBusy: false,
  promptAdvancedEnabled: false,
  projectMenuId: null,
  editingProjectId: null,
  paymentReturn: null,
  topupAmount: 10,
  usageFilter: "all",
  settingsSection: "account",
  affiliateTab: "overview",
  attachmentPickerKind: "avatar",
  attachmentPickerFilter: "avatar",
  ugcPromptBuilder: defaultUgcPromptBuilder(),
  activeResultId: null,
  selectedResultIds: [],
  bulkDeleteBusy: false,
  bulkReferenceBusy: "",
  resultTitleSavedId: null,
  imageCanvasSelectedResultId: null,
  editImageBusy: false,
  assetSearch: "",
  assetTypeFilter: "all",
  assetProjectFilter: "all",
  studioWallLimits: {},
  wizardStep: 1,
  wizardFeature: "",
  wizardProductName: "",
  wizardProductLink: "",
  wizardLanguage: localStorage.getItem(storageKeys.lang) === "zh" ? "中文" : localStorage.getItem(storageKeys.lang) === "en" ? "English" : "Bahasa Melayu",
  wizardStyle: "Soft sell",
  wizardBusy: false
};

const agentLayoutFixtureParam = "assistant-layout";
const agentLayoutFixtureEnabled = () => {
  const params = new URLSearchParams(window.location.search);
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  return params.get("agentFixture") === agentLayoutFixtureParam && (localHost || import.meta.env.MODE !== "production");
};

const creditsPerUsd = 1000;
const usdPerRm = 0.21;

function creditsForUsd(amount) {
  return Math.round(Number(amount || 0) * creditsPerUsd);
}

function formatUsdAmount(value) {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function formatPaymentAmount(payment = {}) {
  const currency = payment.currency || (payment.kind === "topup" ? "USD" : "MYR");
  const amount = Number(payment.amount || 0);
  if (currency === "USD") return formatUsdAmount(amount);
  return `RM${amount.toFixed(2)}`;
}

function formatUsdCost(value) {
  return `$${Number(value || 0).toFixed(3)}`;
}

let agentVisualTimer = null;
let agentWorkingTimer = null;
let agentTypingTimer = null;
let agentTypingRunId = 0;
let agentAbortController = null;

const languages = [
  ["ms", "BM"],
  ["zh", "中文"],
  ["en", "EN"]
];

const brandAssets = {
  horizontal: "/brand/pokaya/final/pokaya-logo-horizontal-transparent.png",
  mascot: "/brand/pokaya/final/pokaya-mascot-transparent.png",
  mascotUi: "/brand/pokaya/final/pokaya-mascot-ui-192.png",
  appIcon: "/brand/pokaya/final/pokaya-app-icon-master.png",
  banner: "/brand/pokaya/final/pokaya-logo-horizontal-light.png",
  stacked: "/brand/pokaya/final/pokaya-logo-horizontal-transparent.png",
  sidebar: "/brand/pokaya/final/pokaya-sidebar-logo-transparent.png",
  agentModel: "/models/agent/pokaya-agent.glb"
};

const mascotIcon = (className = "mascot-icon") => `<img class="${className}" src="${brandAssets.mascotUi}" width="192" height="192" alt="" aria-hidden="true" loading="eager" decoding="sync" fetchpriority="high">`;
const studioMark = () => `<span class="studio-nav-mark" aria-hidden="true"><span></span><i></i><b></b></span>`;

const imagePromptPresets = {
  avatar: {
    label: "Avatar",
    icon: "user-round",
    groups: [
      ["Female", [
        ["Kebaya 20s", "#ff2f6d", "A Malaysian woman in her 20s wearing a modern kebaya, friendly TikTok affiliate creator pose, holding the product naturally, clean home studio, soft daylight, realistic skin texture, vertical social commerce image."],
        ["Casual 20s", "#ff2f6d", "A casual Malaysian female creator in her 20s, relaxed outfit, confident smile, unboxing the product on a desk, TikTok Shop affiliate vibe, bright clean background, realistic lifestyle product photography."],
        ["Makcik", "#a12ab8", "A warm Malay makcik creator, trustworthy facial expression, demonstrating the product like a real recommendation to family, modest outfit, cozy Malaysian kitchen background, realistic UGC product image."],
        ["Kitchen", "#a12ab8", "A female home creator in a Malaysian kitchen, using the product during a daily routine, natural hand pose, practical household UGC style, bright tiles, realistic lighting, product clearly visible."],
        ["Nenek", "#f58b00", "A kind Malaysian grandmother creator, gentle smile, holding the product close to camera, warm home setting, trustworthy family recommendation mood, realistic TikTok affiliate product image."],
        ["Nenek Garden", "#f58b00", "A Malaysian grandmother in a small home garden, peaceful morning light, presenting the product naturally, plants and outdoor tiles in the background, sincere TikTok Shop review style."]
      ]],
      ["Male", [
        ["Baju Melayu 20s", "#1e90ff", "A young Malay male creator in baju melayu, clean and confident TikTok affiliate pose, holding the product at chest level, festive Malaysian home setting, realistic social commerce image."],
        ["Casual 20s", "#1e90ff", "A casual Malaysian male creator in his 20s, simple streetwear, energetic expression, showing the product to camera, bedroom studio setup, modern TikTok review image."],
        ["Abang Pro", "#009b8f", "A professional abang creator, neat casual shirt, confident product demonstration, clean office desk, credible Malaysian affiliate seller look, realistic lighting and sharp product focus."],
        ["Pakcik", "#825846", "A friendly Malaysian pakcik creator, trustworthy smile, explaining the product with one hand gesture, simple home background, authentic local review style, realistic product photography."]
      ]]
    ]
  },
  product: {
    label: "Product",
    icon: "package",
    groups: [
      ["Scene", [
        ["Clean Studio", "#ff2f6d", "A clean studio product hero image for TikTok Shop, product centered, soft shadow, pastel background, crisp packaging details, high conversion affiliate thumbnail style."],
        ["Lifestyle Desk", "#a12ab8", "The product placed on a Malaysian creator desk with phone, notes, and packing boxes, realistic daily use context, bright natural light, TikTok affiliate lifestyle image."],
        ["Before After", "#f58b00", "A split-scene product image showing before and after benefit, clear visual contrast, product in the center, clean labels, social commerce ad style, realistic and not over-edited."]
      ]],
      ["Commerce", [
        ["TikTok Thumbnail", "#1e90ff", "A scroll-stopping TikTok Shop thumbnail, product large in foreground, creator hand pointing at the product, clean background, strong contrast, readable space for offer text."],
        ["Bundle Shot", "#009b8f", "A product bundle arrangement with multiple units, clean ecommerce composition, soft gradient background, premium but affordable Malaysian TikTok Shop style."],
        ["Unboxing", "#825846", "A realistic unboxing scene, open parcel box, product packaging visible, creator hands in frame, casual home table, authentic affiliate review mood."]
      ]]
    ]
  },
  sales: {
    label: "Sales",
    icon: "badge-dollar-sign",
    groups: [
      ["Hook", [
        ["Problem Hook", "#ff2f6d", "A TikTok affiliate sales image showing the customer problem clearly, product as the practical solution, expressive creator reaction, Malaysian home context, high curiosity visual hook."],
        ["Proof Shot", "#a12ab8", "A proof-focused product image with creator showing result or benefit, confident expression, product visible, clean space for testimonial text, realistic UGC sales style."],
        ["Offer Push", "#f58b00", "A promotional TikTok Shop image with product, creator, and clear sale energy, bright background, room for price badge and voucher text, urgent but trustworthy affiliate style."]
      ]],
      ["Audience", [
        ["For Moms", "#1e90ff", "A product image targeted to busy Malaysian moms, warm home setting, practical benefit shown through daily routine, gentle trustworthy tone, realistic TikTok Shop recommendation."],
        ["For Students", "#009b8f", "A product image targeted to Malaysian students, compact desk or dorm setting, affordable and useful feeling, energetic creator pose, TikTok affiliate image style."],
        ["For Office", "#825846", "A product image targeted to office workers, neat desk setup, professional creator using the product during workday, clean credible sales visual, realistic lighting."]
      ]]
    ]
  }
};

const copy = {
  ms: {
    contentEngine: "Pokaya AI",
    checkout: "Checkout",
    studio: "Studio",
    navFeatures: "Tools",
    navPricing: "Harga",
    navAffiliate: "Affiliate",
    navFaq: "FAQ",
    signIn: "Log masuk",
    promo: "Harga pengguna awal RM79.80/bulan dibuka untuk masa terhad",
    heroEyebrow: "AI content tool untuk TikTok Affiliate",
    heroTitle: "Nak guna AI buat content, tapi tak tahu mula dari produk mana?",
    heroTitleLead: "Nak guna AI buat content,",
    heroTitleHot: "tapi tak tahu",
    heroTitleTail: "mula dari produk mana?",
    demoCta: "Lihat cara guna",
    heroCopy: "Pokaya AI bantu anda tukar satu produk menjadi visual, short-video direction, script dan content angle untuk TikTok Affiliate. Mula dengan produk, bukan dengan 10 tool berasingan.",
    startCreating: "Mula guna Pokaya AI",
    heroTrust1: "RM79.80/bulan",
    heroTrust2: "Image serendah 20 sen",
    heroTrust3: "Video serendah RM0.40",
    heroTrust4: "Confirm credit sebelum generate",
    whatsappCta: "WhatsApp",
    rating: "30-day money back",
    sellersNow: "Cancel bila-bila",
    guarantee: "FPX online banking",
    videoPrice: "Video RM0.40",
    you: "Anda",
    competitor: "Competitor",
    oneVideo: "1 video / hari",
    tenVideos: "10 video / hari",
    catchUp: "Dari idea kosong ke output yang boleh digunakan",
    speed: "Cepat",
    speedTitle: "Buat content tanpa buka 10 tool",
    speedCopy: "Idea, prompt, image, video dan caption disusun supaya lebih cepat digunakan.",
    price: "RM79.80",
    priceTitle: "Satu tempat untuk mula guna AI secara praktikal",
    priceCopy: "Image AI, Video AI, Audio, Prompt Library, Storytelling, Clone Video dan affiliate pack dalam satu platform.",
    simple: "Senang",
    simpleTitle: "Tak perlu jadi prompt expert",
    simpleCopy: "Pilih tujuan, isi maklumat ringkas, dan Pokaya bantu susun output.",
    sellerReality: "Realiti AI sekarang",
    painTitle: "Masalah anda bukan tak ada AI. Masalahnya AI terlalu bersepah.",
    painCopy: "Satu tool untuk image, satu tool untuk video, satu tempat cari prompt, satu lagi tutorial ajar cara buat content. Akhirnya anda banyak belajar, tapi content masih belum siap.",
    notEnoughTime: "Tak tahu nak mula",
    notEnoughTimeCopy: "Anda tahu AI penting, tapi tak jelas langkah pertama yang patut dibuat hari ini.",
    ideasDry: "Terlalu banyak AI tool",
    ideasDryCopy: "Satu tool untuk gambar, satu untuk video, satu untuk prompt, satu untuk caption. Akhirnya pening.",
    scatteredTools: "Tak pandai prompt",
    scatteredToolsCopy: "Output nampak biasa sebab prompt tak cukup spesifik, tapi belajar prompt dari kosong makan masa.",
    competitorsFaster: "Susah konsisten",
    competitorsFasterCopy: "AI hanya berguna kalau digunakan setiap hari. Tanpa sistem, semangat hilang selepas beberapa hari.",
    advantage: "AI tools siap guna",
    weaponsTitle: "Pilih tugas. Isi maklumat. Generate output.",
    liveOutput: "Output Pokaya AI",
    outputTitle: "Bukan teori. Ini jenis output yang anda boleh hasilkan dalam Pokaya AI.",
    outputCopy: "Contoh image, video, prompt dan content plan yang boleh digunakan untuk content, produk dan affiliate.",
    hookTitle: "Sales Prompt",
    hookSample: "Prompt siap untuk hook, caption, storytelling, sales angle dan content idea.",
    scriptTitle: "Video AI",
    scriptSample: "Video pendek untuk TikTok, Reels, Shorts, ads dan product demo tanpa shoot manual.",
    captionTitle: "Audio",
    captionSample: "Beri suara kepada video anda dengan voiceover, preset suara dan arahan emosi yang lebih jelas.",
    planTitle: "Affiliate Pack",
    planSample: "Pakej khas untuk beginner yang mahu mula promote produk dengan hook, script dan visual.",
    howKicker: "Cara guna",
    howTitle: "Pilih tugas, isi maklumat, terus generate output",
    howCopy: "Pokaya dibina untuk beginner: pilih apa yang anda mahu buat, masukkan produk, niche atau idea, kemudian generate prompt, image, script, video atau content plan.",
    demoTitle: "Output sebenar dari Pokaya AI",
    demoCopy: "Contoh image, video, prompt dan content plan yang boleh digunakan untuk content, produk, affiliate dan online promotion.",
    oldWay: "Cara lama",
    newWay: "Cara Pokaya AI",
    pricingTitle: "Satu tempat untuk mula guna AI secara praktikal.",
    pricingCopy: "RM79.80/bulan untuk akses Pokaya AI Pro: image, video, prompt, content idea dan TikTok Affiliate Pack.",
    launchOffer: "Limited offer · Pokaya AI Pro",
    claimPlan: "Mula guna Pokaya AI sekarang",
    riskReversal: "Pokaya AI tidak menjamin income. Ia bantu anda hasilkan content, prompt, visual dan video dengan lebih cepat supaya anda boleh test lebih banyak peluang.",
    controlKicker: "Trust & compliance",
    controlTitle: "Kami jual alat dan cara guna, bukan janji kaya cepat",
    controlCopy: "Pokaya AI membantu anda buat content, visual, video dan prompt dengan lebih tersusun. Anda tetap perlu pilih peluang, publish, test dan review hasil sendiri.",
    startNow: "Mula sekarang",
    registerTitle: "Daftar & mula guna Pokaya AI.",
    registerCopy: "Isi info anda, bayar melalui FPX atau DuitNow QR, dan akaun Pokaya AI anda akan diaktifkan selepas pembayaran berjaya.",
    fullName: "Nama penuh",
    email: "Email",
    password: "Password",
    continueRegistration: "Teruskan ke registration",
    faqTitle: "Soalan biasa",
    changeLanguage: "Tukar bahasa",
    languageMenuLabel: "Language",
    workspace: "Studio",
    business: "Business",
    startHere: "Start Here",
    pokayaAgent: "Pokaya Agent",
    dashboard: "Dashboard",
    newProject: "New project",
    search: "Cari",
    projects: "Studio",
    publicTools: "Public Tools",
    contentLibrary: "Content Library",
    logout: "Sign out",
    project: "Project",
    sopImage: "SOP Image",
    stepImage: "Image",
    stepUgc: "Video",
    stepAuto: "Audio",
    stepOriginal: "Original Video",
    stepClone: "Clone Prompt",
    stepStory: "Storytelling",
    stepViral: "Viral",
    attachments: "Attachments",
    billing: "Billing",
    topup: "Top Up Credit",
    affiliate: "Affiliate",
    usage: "Usage",
    autopost: "Auto Post TikTok",
    whatsapp: "WhatsApp Group",
    imageGenerator: "Image Generator",
    model: "Model",
    mode: "Mode",
    avatarRef: "Avatar Reference (Optional)",
    productRef: "Product Reference (Optional)",
    dropAvatar: "Click atau drop gambar muka character",
    dropProduct: "Click atau drop gambar produk",
    prompt: "Prompt",
    generateImage: "Generate Media",
    generating: "Pokaya AI is generating...",
    noResults: "Belum ada result",
    export: "Export",
    saveDone: "Saved.",
    generatedSaved: "Generated result saved.",
    loginTitle: "Welcome back",
    loginCopy: "Sign in untuk teruskan generate UGC viral.",
    continueWithGoogle: "Continue with Google",
    loginDivider: "atau",
    googleLoginSuccess: "Google login berjaya.",
    googleLoginFailed: "Google login gagal. Cuba lagi atau guna email.",
    welcomeBack: "Welcome back",
    forgot: "Lupa password? Hantar di WhatsApp ->",
    noAccount: "Belum ada akaun? Pilih plan & daftar",
    noAccountLead: "Belum ada akaun?",
    noAccountAction: "Pilih plan & daftar",
    createProject: "Create New Project",
    choosePlan: "Choose Plan & Register",
    exportReady: "Export Ready",
    supportTitle: "Pokaya AI Support",
    supportTicket: "Create Support Ticket",
    liveActivity: "Live Activity",
    support: "Support",
    creditBalance: "Baki Credit",
    topUpShort: "Top Up",
    expired: "Expired",
    pro: "Pro",
    settings: "Settings",
    contactSupport: "Contact Support",
    humanSupport: "Support Manusia",
    whatsappSupport: "WhatsApp",
    dashboardSubtitle: "Ringkasan produksi untuk workspace short-video selling anda.",
    dashboardKicker: "Dashboard",
    sopDashboard: "SOP Dashboard",
    statImage: "Image",
    statUgc: "UGC",
    statAuto: "Audio",
    statOriginal: "Original Video",
    statClone: "Clone Prompt",
    statReady: "Ready to Post",
    statCredits: "Credits Used",
    statToday: "{count} hari ini",
    statVisualAssets: "Visual assets",
    statVideoReady: "Video-ready",
    statBatchPlans: "Batch plans",
    statAnalyzed: "Analyzed",
    statPatterns: "Patterns",
    statScheduler: "Scheduler",
    statQueued: "Queued",
    statUsage: "Usage",
    statCreditsNote: "{count} credits",
    filterDateRange: "Filter by date range",
    fromDate: "From Date",
    toDate: "To Date",
    apply: "Apply",
    reset: "Reset",
    dailyProduction: "Daily Production",
    totalInRange: "{count} total in range",
    chartVideoResearch: "Video/Research",
    daysLeft: "{count} hari lagi",
    expiresOn: "Tamat {date}",
    noExpiryDate: "Tiada tarikh tamat",
    accountAttachmentsSubtitle: "Rekod upload yang disimpan dalam backend.",
    accountBillingSubtitle: "Plan, renewal, rate dan payment history.",
    accountTopupSubtitle: "Pembelian credit dikemaskini dalam backend ledger.",
    accountAffiliateSubtitle: "Urus referral earnings dan cashout.",
    accountUsageSubtitle: "Penggunaan credit daripada backend ledger.",
    accountAutopostSubtitle: "Queue TikTok publishing dibantu Chrome extension.",
    accountWhatsappSubtitle: "Masuk ke komuniti WhatsApp Pokaya.",
    accountSettingsSubtitle: "Info akaun, WhatsApp support contact dan password.",
    openWhatsappGroup: "Buka WhatsApp Group",
    currentPlan: "Plan Semasa",
    cancelSubscription: "Cancel subscription",
    renewal: "Renewal",
    status: "Status",
    rates: "Rates",
    paymentHistory: "Payment history",
    date: "Date",
    usageAction: "Action",
    usagePrompt: "Prompt",
    usagePreview: "Type",
    usageCredit: "Credits",
    usageBalance: "Balance",
    description: "Description",
    amount: "Amount",
    noPaymentRecords: "Belum ada rekod payment.",
    check: "Check",
    referralWalletBalance: "Wallet Balance",
    referralTotalEarned: "Total Earned",
    referralTotalCashedOut: "Total Cashed Out",
    referralClicks: "Clicks",
    referralCode: "Your Referral Code",
    copyCode: "Copy Code",
    shareReferralLink: "Share this link: earn 20% when they top up and use Pokaya",
    referralLink: "Referral link",
    copyLink: "Copy Link",
    affiliateOverview: "Overview",
    affiliateCommissions: "Commissions",
    affiliateReferrals: "Referrals",
    affiliateCashOut: "Cash Out",
    affiliateHowTitle: "How affiliate works",
    affiliateHow1: "Share your Pokaya link or referral code with sellers.",
    affiliateHow2: "When they top up and use Pokaya through your link, you earn 20% commission.",
    affiliateHow3: "Example: they top up $100, you get $20. They top up $1000, you get $200.",
    affiliateHow4: "Cash out after the minimum RM50 threshold to a Malaysian bank account.",
    totalReferrals: "Total referrals",
    commissionEvents: "Commission events",
    totalEarned: "Total earned",
    availableWithdraw: "Available to withdraw",
    pendingCashouts: "Pending cashouts",
    minimumCashout: "Minimum cashout",
    imageGenerate: "Image Generate",
    imagesPossible: "images possible",
    video8s: "Video 8s",
    videosPossible: "videos possible",
    autoContentPack: "Audio voiceover pack",
    batch: "batch",
    autoContentPackNote: "10 video x 8s + 1 master plan",
    selectCreditPackage: "Pilih pakej credit",
    creditRateNote: "USD 1 = 1000 credits. Tiada hidden fees.",
    instantTopupChip: "Instant top-up via CHIP",
    credits: "Credits",
    payForCredits: "Pay {amount} for {credits} Credits",
    topupSecureNote: "Secured via Chip · priced in USD",
    topupHistory: "Top up history",
    noTopupRecords: "Belum ada rekod top up.",
    creditsAdded: "+{credits} credits",
    starterPack: "Starter pack",
    tryItOut: "Try it out",
    common: "Common",
    bestValue: "Best value",
    best: "Best",
    powerUser: "Power user",
    profile: "Profile",
    profileSubtitle: "Info akaun & contact",
    displayName: "Display Name",
    saveProfile: "Save Profile",
    whatsappSettingsSubtitle: "Untuk login + support notifications",
    whatsappNumber: "WhatsApp Number",
    saveWhatsapp: "Save WhatsApp",
    changePassword: "Change Password",
    changePasswordSubtitle: "Ganti password dari yang dihantar via WhatsApp",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New",
    confirmNewPassword: "Confirm New",
    renameProject: "Rename project",
    deleteProject: "Delete project",
    saveName: "Save name",
    deleteProjectConfirm: "Delete {name}? This removes its generated assets, prompts, and schedules from this workspace.",
    toastDeletingProject: "Deleting project...",
    toastKeepOneProject: "Keep at least one project.",
    toastProjectDeleted: "{name} has been successfully deleted.",
    cancel: "Cancel",
    done: "Done",
    exportStarted: "Your export has started. Files are generated by the backend.",
    supportMessage: "Message",
    supportPlaceholder: "Tell us what happened, what you tried, and your WhatsApp number if you want a reply.",
    createPassword: "Create password",
    registerEnterStudio: "Register & Enter Studio",
    toastAffiliateCopied: "Affiliate link copied.",
    toastAffiliateCodeCopied: "Affiliate code copied.",
    toastSupportSaved: "Support ticket saved."
  },
  zh: {
    contentEngine: "Pokaya AI",
    checkout: "结账",
    studio: "工作台",
    navFeatures: "功能",
    navPricing: "价格",
    navAffiliate: "联盟",
    navFaq: "FAQ",
    signIn: "登录",
    promo: "RM79.80/月｜给自己一个开始 AI 副业的入口",
    promoSub: "适合想用 AI 做 TikTok Affiliate、短视频带货和产品推广的人。",
    heroEyebrow: "给 TikTok Affiliate 的 AI 内容工具",
    heroTitle: "想用 AI 赚钱，但不知道从哪里开始？",
    heroTitleLead: "想用 AI 赚钱，",
    heroTitleHot: "但不知道",
    heroTitleTail: "从哪里开始？",
    demoCta: "看看怎么用",
    heroCopy: "Pokaya AI 帮您先从 TikTok Affiliate 内容开始。不用一开始就会拍摄、剪辑或写脚本，您可以用 AI 更快生成产品素材、短视频内容、口播文案和推广内容。",
    startCreating: "开始使用 Pokaya AI",
    heroTrust1: "RM79.80/月",
    heroTrust2: "图片低至 20 sen",
    heroTrust3: "视频低至 RM0.40",
    heroTrust4: "扣费前先确认",
    whatsappCta: "WhatsApp",
    rating: "30 天退款保障",
    sellersNow: "随时取消",
    guarantee: "FPX online banking",
    videoPrice: "视频 RM0.40",
    you: "您",
    competitor: "竞争对手",
    oneVideo: "1 条 / 天",
    tenVideos: "10 条 / 天",
    catchUp: "从空白想法到可用成品",
    speed: "快",
    speedTitle: "不用打开 10 个工具也能做内容",
    speedCopy: "Idea、prompt、image、video 和 caption 都整理在同一个地方。",
    price: "RM79.80",
    priceTitle: "一个能直接开始的 AI 工具箱",
    priceCopy: "Image AI、Video AI、Audio、Prompt Library、Storytelling、Clone Video 和 affiliate pack 集中在一个平台。",
    simple: "简单",
    simpleTitle: "不用先变成 prompt 专家",
    simpleCopy: "选择目标，填写简单资料，Pokaya 帮您整理出可以直接使用的 output。",
    sellerReality: "很多人不是不想用 AI 赚钱",
    painTitle: "是根本不知道<br>第一步要做什么",
    painCopy: "每天看到别人说 AI 可以赚钱，看到别人做 TikTok Affiliate。轮到自己开始时，却卡在选品、脚本、素材、工具和第一条内容。",
    notEnoughTime: "不知道选什么产品",
    notEnoughTimeCopy: "想开始 TikTok Affiliate，但不知道哪个产品适合先做内容测试。",
    ideasDry: "不知道拍什么内容",
    ideasDryCopy: "刷了很多教程，轮到自己还是不知道第一条视频该怎么开头。",
    scatteredTools: "不会写脚本和 prompt",
    scatteredToolsCopy: "知道 AI 有用，但不知道怎么把 AI 变成可以发布的内容。",
    competitorsFaster: "一直收藏但没开始",
    competitorsFasterCopy: "教程越看越多，工具越存越多，真正发布的内容却迟迟没有做出来。",
    advantage: "Pokaya AI 帮您准备好",
    weaponsTitle: "做 TikTok Affiliate 内容需要的 AI 工具",
    liveOutput: "看看可以生成什么",
    outputTitle: "产品素材、短视频内容、口播文案和推广内容",
    outputCopy: "这里展示真实生成效果，不是复杂教学。您可以看到 AI 如何帮您把一个产品变成可以发布和测试的内容。",
    hookTitle: "内容 idea",
    hookSample: "不知道拍什么时，用 AI 生成内容方向、卖点角度和短视频 hook。",
    scriptTitle: "口播文案",
    scriptSample: "不会写脚本时，生成口播、推广文案、caption 和 CTA，不用从零开始。",
    captionTitle: "产品素材",
    captionSample: "没有素材时，生成产品相关图片、短视频素材和 visual direction。",
    planTitle: "Affiliate Pack",
    planSample: "先从 TikTok Affiliate 开始，用 AI 做内容，用内容推广产品。",
    howKicker: "怎么开始",
    howTitle: "开通、生成内容<br>然后开始发布和测试",
    howCopy: "Pokaya 给新手一个清楚入口：输入产品或方向，生成素材、文案和短视频内容，整理后用于 TikTok Affiliate、短视频带货和产品推广。",
    demoTitle: "看看 Pokaya AI 可以帮您生成什么",
    demoCopy: "适合 TikTok Affiliate 新手、小卖家、内容创作者，以及想用 AI 做产品推广但不想从零写脚本的人。",
    oldWay: "旧方法",
    newWay: "Pokaya AI 方法",
    pricingTitle: "Pokaya AI Pro",
    pricingCopy: "RM79.80/月，您开通的不只是一个工具，而是一个 AI 副业开始入口。一个更快生成素材、文案和内容的地方。",
    launchOffer: "限时优惠 · Pokaya AI Pro",
    claimPlan: "现在开始使用 Pokaya AI",
    riskReversal: "Pokaya AI 不保证收入。它帮助您更快生成内容素材、文案和方向，实际结果取决于选品、发布、测试和执行。",
    controlKicker: "信任与合规",
    controlTitle: "我们卖的是 AI 内容工具<br>不是暴富承诺",
    controlCopy: "Pokaya AI 帮您更有结构地做 TikTok Affiliate 内容。您仍然需要选择产品、发布内容、观察反馈并持续优化。",
    startNow: "现在开始",
    registerTitle: "您不需要等自己完全准备好，才开始 AI 副业",
    registerCopy: "真正开始，往往只需要一个清楚入口。Pokaya AI 帮您先从 TikTok Affiliate 内容开始，用 AI 生成素材、文案和短视频内容。",
    fullName: "姓名",
    email: "邮箱",
    password: "密码",
    continueRegistration: "继续注册",
    faqTitle: "开始前<br>您可能会问",
    changeLanguage: "切换语言",
    languageMenuLabel: "Language",
    workspace: "创作中心",
    business: "业务",
    startHere: "新手开始",
    pokayaAgent: "Pokaya Agent",
    dashboard: "总控",
    newProject: "新项目",
    search: "搜索",
    projects: "创作中心",
    publicTools: "公开工具",
    contentLibrary: "内容库",
    logout: "退出登录",
    project: "项目",
    sopImage: "图片 SOP",
    stepImage: "图片",
    stepUgc: "Video",
    stepAuto: "声音",
    stepOriginal: "原创视频",
    stepClone: "复刻提示词",
    stepStory: "故事脚本",
    stepViral: "爆款",
    attachments: "附件",
    billing: "账单",
    topup: "充值 Credit",
    affiliate: "联盟",
    usage: "用量",
    autopost: "自动发布 TikTok",
    whatsapp: "WhatsApp 群",
    imageGenerator: "Image Generator",
    model: "模型",
    mode: "模式",
    avatarRef: "人物参考（可选）",
    productRef: "产品参考（可选）",
    dropAvatar: "点击或拖入人物脸部图片",
    dropProduct: "点击或拖入产品图片",
    prompt: "提示词",
    generateImage: "生成作品",
    generating: "Pokaya AI 正在生成...",
    noResults: "还没有结果",
    export: "导出",
    saveDone: "已保存。",
    generatedSaved: "生成结果已保存。",
    loginTitle: "Welcome back",
    loginCopy: "登录后继续生成爆款 UGC。",
    continueWithGoogle: "使用 Google 登录",
    loginDivider: "或",
    googleLoginSuccess: "Google 登录成功。",
    googleLoginFailed: "Google 登录失败，请重试或使用邮箱登录。",
    welcomeBack: "欢迎回来",
    forgot: "忘记密码？去 WhatsApp 联系 ->",
    noAccount: "还没有账号？选择计划并注册",
    noAccountLead: "还没有账号？",
    noAccountAction: "选择计划并注册",
    createProject: "创建新项目",
    choosePlan: "选择计划并注册",
    exportReady: "导出已开始",
    supportTitle: "Pokaya AI 客服",
    supportTicket: "创建客服工单",
    liveActivity: "实时动态",
    support: "客服",
    creditBalance: "Credit 余额",
    topUpShort: "充值",
    expired: "已过期",
    pro: "Pro",
    settings: "设置",
    contactSupport: "联系客服",
    humanSupport: "人工客服",
    whatsappSupport: "WhatsApp",
    dashboardSubtitle: "您的短视频带货工作台生产总览。",
    dashboardKicker: "总控",
    sopDashboard: "SOP 总控",
    statImage: "图片",
    statUgc: "UGC",
    statAuto: "Audio",
    statOriginal: "原创视频",
    statClone: "复刻提示词",
    statReady: "待发布",
    statCredits: "已用 Credit",
    statToday: "今日 {count}",
    statVisualAssets: "视觉素材",
    statVideoReady: "视频素材",
    statBatchPlans: "批量计划",
    statAnalyzed: "已分析",
    statPatterns: "结构模板",
    statScheduler: "排程器",
    statQueued: "队列中",
    statUsage: "用量",
    statCreditsNote: "{count} credits",
    filterDateRange: "按日期筛选",
    fromDate: "开始日期",
    toDate: "结束日期",
    apply: "应用",
    reset: "重置",
    dailyProduction: "每日产出",
    totalInRange: "范围内共 {count}",
    chartVideoResearch: "视频 / 分析",
    daysLeft: "剩余 {count} 天",
    expiresOn: "{date} 到期",
    noExpiryDate: "没有到期日",
    accountAttachmentsSubtitle: "已上传并保存到后台的记录。",
    accountBillingSubtitle: "计划、续费、费率和付款记录。",
    accountTopupSubtitle: "充值记录会同步到后台账本。",
    accountAffiliateSubtitle: "管理您的推荐链接、收益和提现。",
    accountUsageSubtitle: "后台账本里的 Credit 使用记录。",
    accountAutopostSubtitle: "Chrome extension 辅助的 TikTok 发布队列。",
    accountWhatsappSubtitle: "进入 Pokaya WhatsApp 社群。",
    accountSettingsSubtitle: "账号资料、WhatsApp 客服联系方式和密码。",
    openWhatsappGroup: "打开 WhatsApp 群",
    currentPlan: "当前计划",
    cancelSubscription: "取消订阅",
    renewal: "续费日期",
    status: "状态",
    rates: "费率",
    paymentHistory: "付款记录",
    date: "日期",
    usageAction: "动作",
    usagePrompt: "提示词",
    usagePreview: "类型",
    usageCredit: "Credit",
    usageBalance: "余额",
    description: "说明",
    amount: "金额",
    noPaymentRecords: "还没有付款记录。",
    check: "检查",
    referralWalletBalance: "钱包余额",
    referralTotalEarned: "累计收益",
    referralTotalCashedOut: "已提现",
    referralClicks: "点击数",
    referralCode: "您的推荐码",
    copyCode: "复制码",
    shareReferralLink: "分享链接：用户入金使用后，您拿 20% 佣金",
    referralLink: "推荐链接",
    copyLink: "复制链接",
    affiliateOverview: "总览",
    affiliateCommissions: "佣金",
    affiliateReferrals: "推荐用户",
    affiliateCashOut: "提现",
    affiliateHowTitle: "Affiliate 如何运作",
    affiliateHow1: "把您的 Pokaya 分享链接或推荐码发给用户。",
    affiliateHow2: "对方通过您的链接入金并使用 Pokaya 后，您可获得 20% 佣金。",
    affiliateHow3: "例子：用户入金 $100，您拿 $20；用户入金 $1000，您拿 $200。",
    affiliateHow4: "达到最低 RM50 后，可以提现到马来西亚银行账户。",
    totalReferrals: "总推荐数",
    commissionEvents: "佣金事件",
    totalEarned: "累计收益",
    availableWithdraw: "可提现",
    pendingCashouts: "处理中提现",
    minimumCashout: "最低提现",
    imageGenerate: "图片生成",
    imagesPossible: "张图片",
    video8s: "8 秒视频",
    videosPossible: "条视频",
    autoContentPack: "Audio 配音包",
    batch: "组",
    autoContentPackNote: "10 条 8 秒视频 + 1 份主计划",
    selectCreditPackage: "选择充值配套",
    creditRateNote: "USD 1 = 1000 credits，没有隐藏费用。",
    instantTopupChip: "通过 CHIP 即时充值",
    credits: "Credits",
    payForCredits: "支付 {amount} 获得 {credits} Credits",
    topupSecureNote: "通过 Chip 保障付款 · 以 USD 计价",
    topupHistory: "充值记录",
    noTopupRecords: "还没有充值记录。",
    creditsAdded: "+{credits} credits",
    starterPack: "入门包",
    tryItOut: "试用",
    common: "常用",
    bestValue: "最划算",
    best: "推荐",
    powerUser: "高频用户",
    profile: "个人资料",
    profileSubtitle: "账号资料和联系方式",
    displayName: "显示名称",
    saveProfile: "保存资料",
    whatsappSettingsSubtitle: "用于登录和客服通知",
    whatsappNumber: "WhatsApp 号码",
    saveWhatsapp: "保存 WhatsApp",
    changePassword: "修改密码",
    changePasswordSubtitle: "修改通过 WhatsApp 发给您的密码",
    oldPassword: "旧密码",
    newPassword: "新密码",
    confirmNewPassword: "确认新密码",
    confirmNewPassword: "确认新密码",
    renameProject: "重命名项目",
    deleteProject: "删除项目",
    saveName: "保存名称",
    deleteProjectConfirm: "删除 {name}？这会移除这个项目的生成作品、提示词和排程。",
    toastDeletingProject: "正在删除项目...",
    toastKeepOneProject: "至少需要保留一个项目。",
    toastProjectDeleted: "{name} 已成功被删除。",
    cancel: "取消",
    done: "完成",
    exportStarted: "导出已开始，文件会由后台生成。",
    supportMessage: "问题描述",
    supportPlaceholder: "告诉我们发生了什么、您试过什么，如果要回复请留下 WhatsApp。",
    createPassword: "创建密码",
    registerEnterStudio: "注册并进入工作台",
    toastAffiliateCopied: "推荐链接已复制。",
    toastAffiliateCodeCopied: "推荐码已复制。",
    toastSupportSaved: "客服工单已保存。"
  },
  en: {
    contentEngine: "Pokaya AI",
    checkout: "Checkout",
    studio: "Studio",
    navFeatures: "Features",
    navPricing: "Pricing",
    navAffiliate: "Affiliate",
    navFaq: "FAQ",
    signIn: "Sign in",
    promo: "Early-user price RM79.80/month is open for a limited time",
    heroEyebrow: "AI content tool for TikTok Affiliate",
    heroTitle: "Want to use AI for content, but do not know which product to start with?",
    heroTitleLead: "Want to use AI for content,",
    heroTitleHot: "but do not know",
    heroTitleTail: "which product to start with?",
    demoCta: "See how it works",
    heroCopy: "Pokaya AI helps turn one product into visuals, short-video direction, voiceover scripts, and promotion angles for TikTok Affiliate. Start from a product, not from ten separate AI tools.",
    startCreating: "Start using Pokaya AI",
    heroTrust1: "RM79.80/month",
    heroTrust2: "Image from 20 sen",
    heroTrust3: "Video from RM0.40",
    heroTrust4: "Confirm credit first",
    whatsappCta: "WhatsApp",
    rating: "30-day money back",
    sellersNow: "Cancel anytime",
    guarantee: "FPX online banking",
    videoPrice: "Video RM0.40",
    you: "You",
    competitor: "Competitor",
    oneVideo: "1 video / day",
    tenVideos: "10 videos / day",
    catchUp: "From blank ideas to usable outputs",
    speed: "Fast",
    speedTitle: "Create content faster",
    speedCopy: "Generate ideas, prompts, visuals, scripts, and videos without opening 10 different tools.",
    price: "RM79.80",
    priceTitle: "One practical AI toolkit",
    priceCopy: "Image AI, Video AI, Audio, Prompt Library, Storytelling, Clone Video, and affiliate packs in one platform.",
    simple: "Easy",
    simpleTitle: "No prompt expertise needed",
    simpleCopy: "Choose a task, add simple details, and Pokaya helps structure output you can use.",
    sellerReality: "The current AI reality",
    painTitle: "Many people want to use AI to earn, but most are stuck at the first step",
    painCopy: "Too many tools, too many prompts, too many tutorials. Content does not get finished, products do not get promoted, and ideas stay as ideas.",
    notEnoughTime: "No product-selection method",
    notEnoughTimeCopy: "The wrong product makes every video harder to sell. Beginners need a product SOP, not random guessing.",
    ideasDry: "No video structure",
    ideasDryCopy: "Hooks, scripts, CTAs, and captions feel random when there is no proven template.",
    scatteredTools: "Generic AI is still confusing",
    scatteredToolsCopy: "Normal AI can generate text, but it does not teach what selling template to use, how to post, or how to review data.",
    competitorsFaster: "Only 2-3 videos/day",
    competitorsFasterCopy: "Too little output means too little testing data to find winning products and videos.",
    advantage: "Ready AI tools",
    weaponsTitle: "5 AI tools to start creating promotable content",
    liveOutput: "Pokaya AI output",
    outputTitle: "Not theory. These are outputs you can create with Pokaya AI.",
    outputCopy: "Examples of images, videos, prompts, and content plans for content, products, affiliate, and online promotion.",
    hookTitle: "Sales Prompt",
    hookSample: "Ready prompts for hooks, captions, storytelling, sales angles, and content ideas.",
    scriptTitle: "Video AI",
    scriptSample: "Create short videos for TikTok, Reels, Shorts, ads, and product demos without doing everything manually.",
    captionTitle: "Audio",
    captionSample: "Give your video a voice with voiceover prompts, voice presets, and clear emotional direction.",
    planTitle: "Affiliate Pack",
    planSample: "A starter pack for beginners who want to promote products with hooks, scripts, content angles, and visuals.",
    howKicker: "How it works",
    howTitle: "Choose a task, add details, generate output",
    howCopy: "Pokaya is built for beginners: choose what you want to do, add a product, niche, or idea, then generate prompts, images, scripts, videos, or content plans.",
    demoTitle: "Real output from Pokaya AI",
    demoCopy: "Examples of image, video, prompt, and content outputs you can use for content, products, affiliate, and online promotion.",
    oldWay: "Old way",
    newWay: "Pokaya AI way",
    pricingTitle: "One plan. Main AI tools included.",
    pricingCopy: "Full access to Pokaya AI's core tools. Built for beginners who want to create content, promote products, and explore online income opportunities with AI.",
    launchOffer: "Limited offer · Pokaya AI Pro",
    claimPlan: "Start using Pokaya AI now",
    riskReversal: "Pokaya AI does not guarantee income. Pokaya helps you create content, ideas, visuals, videos, and plans faster so you can test more opportunities.",
    controlKicker: "Trust & compliance",
    controlTitle: "We sell AI tools and practical steps, not a get-rich promise",
    controlCopy: "Pokaya AI helps you create content, visuals, videos, and prompts with more structure. You still choose opportunities, publish, test, and review results.",
    startNow: "Start now",
    registerTitle: "Register and start in 1 minute",
    registerCopy: "Enter your details, pay with FPX or DuitNow QR, and your Pokaya AI account will be activated after successful payment.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    continueRegistration: "Continue to registration",
    faqTitle: "Common questions",
    changeLanguage: "Change language",
    languageMenuLabel: "Language",
    workspace: "Studio",
    business: "Business",
    startHere: "Start Here",
    pokayaAgent: "Pokaya Agent",
    dashboard: "Dashboard",
    newProject: "New project",
    search: "Search",
    projects: "Studio",
    publicTools: "Public Tools",
    contentLibrary: "Content Library",
    logout: "Sign out",
    project: "Project",
    sopImage: "SOP Image",
    stepImage: "Image",
    stepUgc: "Video",
    stepAuto: "Audio",
    stepOriginal: "Original Video",
    stepClone: "Clone Prompt",
    stepStory: "Storytelling",
    stepViral: "Viral",
    attachments: "Attachments",
    billing: "Billing",
    topup: "Top Up Credit",
    affiliate: "Affiliate",
    usage: "Usage",
    autopost: "Auto Post TikTok",
    whatsapp: "WhatsApp Group",
    imageGenerator: "Image Generator",
    model: "Model",
    mode: "Mode",
    avatarRef: "Avatar Reference (Optional)",
    productRef: "Product Reference (Optional)",
    dropAvatar: "Click or drop character face image",
    dropProduct: "Click or drop product image",
    prompt: "Prompt",
    generateImage: "Generate Media",
    generating: "Pokaya AI is generating...",
    noResults: "No results yet",
    export: "Export",
    saveDone: "Saved.",
    generatedSaved: "Generated result saved.",
    loginTitle: "Welcome back",
    loginCopy: "Sign in to keep generating viral UGC.",
    continueWithGoogle: "Continue with Google",
    loginDivider: "or",
    googleLoginSuccess: "Google login successful.",
    googleLoginFailed: "Google login failed. Please try again or use email.",
    welcomeBack: "Welcome back",
    forgot: "Forgot password? Send WhatsApp ->",
    noAccount: "No account yet? Choose a plan & register",
    noAccountLead: "No account yet?",
    noAccountAction: "Choose a plan & register",
    createProject: "Create New Project",
    choosePlan: "Choose Plan & Register",
    exportReady: "Export Ready",
    supportTitle: "Pokaya AI Support",
    supportTicket: "Create Support Ticket",
    liveActivity: "Live Activity",
    support: "Support",
    creditBalance: "Credit Balance",
    topUpShort: "Top Up",
    expired: "Expired",
    pro: "Pro",
    settings: "Settings",
    contactSupport: "Contact Support",
    humanSupport: "Human Support",
    whatsappSupport: "WhatsApp",
    dashboardSubtitle: "Production summary for your TikTok affiliate workspace.",
    dashboardKicker: "Dashboard",
    sopDashboard: "SOP Dashboard",
    statImage: "Image",
    statUgc: "UGC",
    statAuto: "Product Scanner",
    statOriginal: "Original Video",
    statClone: "Clone Prompt",
    statReady: "Ready to Post",
    statCredits: "Credits Used",
    statToday: "{count} today",
    statVisualAssets: "Visual assets",
    statVideoReady: "Video-ready",
    statBatchPlans: "Batch plans",
    statAnalyzed: "Analyzed",
    statPatterns: "Patterns",
    statScheduler: "Scheduler",
    statQueued: "Queued",
    statUsage: "Usage",
    statCreditsNote: "{count} credits",
    filterDateRange: "Filter by date range",
    fromDate: "From Date",
    toDate: "To Date",
    apply: "Apply",
    reset: "Reset",
    dailyProduction: "Daily Production",
    totalInRange: "{count} total in range",
    chartVideoResearch: "Video/Research",
    daysLeft: "{count} days left",
    expiresOn: "Expires {date}",
    noExpiryDate: "No expiry date",
    accountAttachmentsSubtitle: "Upload records saved to backend.",
    accountBillingSubtitle: "Plan, renewal, rates, and payment history.",
    accountTopupSubtitle: "Credit purchases update the backend ledger.",
    accountAffiliateSubtitle: "Manage your referral earnings and cashout.",
    accountUsageSubtitle: "Credit usage from the backend ledger.",
    accountAutopostSubtitle: "Chrome extension assisted TikTok publishing queue.",
    accountWhatsappSubtitle: "Enter the Pokaya WhatsApp community.",
    accountSettingsSubtitle: "Account info, WhatsApp support contact, and password.",
    openWhatsappGroup: "Open WhatsApp Group",
    currentPlan: "Current Plan",
    cancelSubscription: "Cancel subscription",
    renewal: "Renewal",
    status: "Status",
    rates: "Rates",
    paymentHistory: "Payment history",
    date: "Date",
    usageAction: "Action",
    usagePrompt: "Prompt",
    usagePreview: "Type",
    usageCredit: "Credits",
    usageBalance: "Balance",
    description: "Description",
    amount: "Amount",
    noPaymentRecords: "No payment records yet.",
    check: "Check",
    referralWalletBalance: "Wallet Balance",
    referralTotalEarned: "Total Earned",
    referralTotalCashedOut: "Total Cashed Out",
    referralClicks: "Clicks",
    referralCode: "Your Referral Code",
    copyCode: "Copy Code",
    shareReferralLink: "Share this link: earn 20% when they top up and use Pokaya",
    referralLink: "Referral link",
    copyLink: "Copy Link",
    affiliateOverview: "Overview",
    affiliateCommissions: "Commissions",
    affiliateReferrals: "Referrals",
    affiliateCashOut: "Cash Out",
    affiliateHowTitle: "How affiliate works",
    affiliateHow1: "Share your Pokaya link or referral code with users.",
    affiliateHow2: "When they top up and use Pokaya through your link, you earn 20% commission.",
    affiliateHow3: "Example: they top up $100, you get $20. They top up $1000, you get $200.",
    affiliateHow4: "Cash out after the minimum RM50 threshold to a Malaysian bank account.",
    totalReferrals: "Total referrals",
    commissionEvents: "Commission events",
    totalEarned: "Total earned",
    availableWithdraw: "Available to withdraw",
    pendingCashouts: "Pending cashouts",
    minimumCashout: "Minimum cashout",
    imageGenerate: "Image Generate",
    imagesPossible: "images possible",
    video8s: "Video 8s",
    videosPossible: "videos possible",
    autoContentPack: "Product Scanner (10 video pack)",
    batch: "batch",
    autoContentPackNote: "10 video x 8s + 1 master plan",
    selectCreditPackage: "Select credit package",
    creditRateNote: "USD 1 = 1000 credits. No hidden fees.",
    instantTopupChip: "Instant top-up via CHIP",
    credits: "Credits",
    payForCredits: "Pay {amount} for {credits} Credits",
    topupSecureNote: "Secured via Chip · priced in USD",
    topupHistory: "Top up history",
    noTopupRecords: "No top up records yet.",
    creditsAdded: "+{credits} credits",
    starterPack: "Starter pack",
    tryItOut: "Try it out",
    common: "Common",
    bestValue: "Best value",
    best: "Best",
    powerUser: "Power user",
    profile: "Profile",
    profileSubtitle: "Account info & contact",
    displayName: "Display Name",
    saveProfile: "Save Profile",
    whatsappSettingsSubtitle: "For login + support notifications",
    whatsappNumber: "WhatsApp Number",
    saveWhatsapp: "Save WhatsApp",
    changePassword: "Change Password",
    changePasswordSubtitle: "Change the password sent via WhatsApp",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New",
    confirmNewPassword: "Confirm New",
    renameProject: "Rename project",
    deleteProject: "Delete project",
    saveName: "Save name",
    deleteProjectConfirm: "Delete {name}? This removes its generated assets, prompts, and schedules from this workspace.",
    toastDeletingProject: "Deleting project...",
    toastKeepOneProject: "Keep at least one project.",
    toastProjectDeleted: "{name} has been successfully deleted.",
    cancel: "Cancel",
    done: "Done",
    exportStarted: "Your export has started. Files are generated by the backend.",
    supportMessage: "Message",
    supportPlaceholder: "Tell us what happened, what you tried, and your WhatsApp number if you want a reply.",
    createPassword: "Create password",
    registerEnterStudio: "Register & Enter Studio",
    toastAffiliateCopied: "Affiliate link copied.",
    toastAffiliateCodeCopied: "Affiliate code copied.",
    toastSupportSaved: "Support ticket saved."
  }
};

const t = (key) => {
  const current = copy[state.lang] || copy.en;
  if (Object.prototype.hasOwnProperty.call(current, key)) return current[key];
  if (Object.prototype.hasOwnProperty.call(copy.en, key)) return copy.en[key];
  return key;
};

const tf = (key, values = {}) => Object.entries(values).reduce(
  (text, [name, value]) => text.replaceAll(`{${name}}`, value),
  t(key)
);

function languageSwitch() {
  const current = languages.find(([id]) => id === state.lang) || languages[0];
  const label = t("changeLanguage");
  return `
    <div class="lang-menu ${state.langOpen ? "open" : ""}">
      <button class="lang-switch" type="button" data-lang-toggle aria-label="${esc(label)}" title="${esc(label)}">
        ${icon("globe-2", 15)}<small>${t("languageMenuLabel")}</small><span>${current[1]}</span>${icon(state.langOpen ? "chevron-up" : "chevron-down", 14)}
      </button>
      <div class="lang-options" role="menu">
        ${languages.map(([id, label]) => `<button class="${state.lang === id ? "active" : ""}" type="button" data-lang="${id}" role="menuitem">${label}</button>`).join("")}
      </div>
    </div>`;
}

function heroTitleMarkup() {
  return [
    ["span", t("heroTitleLead")],
    ["mark", t("heroTitleHot")],
    ["span", t("heroTitleTail")]
  ]
    .filter(([, text]) => String(text || "").trim())
    .map(([tag, text]) => `<${tag}>${text}</${tag}>`)
    .join("");
}

const icon = (name, size = 20) => {
  if (["sparkles", "wand-sparkles"].includes(name)) {
    return `<img class="mascot-icon mascot-icon-inline" src="${brandAssets.mascotUi}" width="192" height="192" alt="" aria-hidden="true" loading="eager" decoding="sync" fetchpriority="high" style="width:${size}px;height:${size}px">`;
  }
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
};
const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function promoContent() {
  const content = {
    ms: {
      before: "RM79.80/bulan｜Pintu mula AI side income",
      after: "Untuk TikTok Affiliate, short video selling dan product promotion."
    },
    zh: {
      before: t("promo"),
      after: t("promoSub")
    },
    en: {
      before: "RM79.80/month｜A clear entry point for an AI side hustle",
      after: "Built for TikTok Affiliate, short-video selling, and product promotion."
    }
  };
  return content[state.lang] || content.en;
}

function promoBar() {
  const promo = promoContent();
  return `
    <div class="promo-bar" aria-live="polite">
      ${icon("flame", 20)}
      <span class="promo-copy">
        <strong>${promo.before}</strong><span>${promo.after}</span>
      </span>
    </div>`;
}

function formatPromoTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function updatePromoCountdown() {
  const el = document.querySelector("[data-promo-countdown]");
  clearInterval(promoCountdownTimer);
  promoCountdownTimer = null;
  if (!el) return;

  const tick = () => {
    const elapsed = Date.now() % promoCycleMs;
    const remaining = elapsed === 0 ? promoCycleMs : promoCycleMs - elapsed;
    el.textContent = formatPromoTime(remaining);
  };
  tick();
  promoCountdownTimer = setInterval(tick, 1000);
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function api(path, options = {}) {
  const { timeoutMs = 0, headers: optionHeaders = {}, ...fetchOptions } = options;
  const headers = { "Content-Type": "application/json", ...optionHeaders };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (state.adminKey) headers["X-Admin-Key"] = state.adminKey;
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const res = await fetch(`${apiBaseUrl}/api${path}`, {
    headers,
    ...fetchOptions,
    signal: controller?.signal || fetchOptions.signal
  }).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
  if (!res.ok) {
    const error = new Error((await res.json().catch(() => ({}))).error || "Request failed");
    error.status = res.status;
    throw error;
  }
  return res.headers.get("content-type")?.includes("application/json") ? res.json() : res;
}

async function boot() {
  state.studioBootError = "";
  render();
  const handledOAuth = await handleOAuthRedirect();
  if (handledOAuth) {
    state.loading = false;
    render();
    showPaymentReturnNotice();
    return;
  }
  if (window.location.pathname.startsWith("/admin")) state.page = "admin";
  if (window.location.pathname.startsWith("/studio/agent")) state.page = "agent";
  if (isStudioPath()) await ensureStudioData();
  state.loading = false;
  render();
  showPaymentReturnNotice();
}

async function handleOAuthRedirect() {
  if (!pathIs("/login")) return false;
  const params = new URLSearchParams(window.location.search);
  const oauthCode = params.get("oauth");
  const oauthError = params.get("oauth_error");
  if (oauthError) {
    window.history.replaceState({}, "", "/login");
    notify(t("googleLoginFailed"));
    return false;
  }
  if (!oauthCode) return false;
  try {
    const res = await api("/auth/oauth-session", {
      method: "POST",
      body: JSON.stringify({ code: oauthCode })
    });
    localStorage.setItem(storageKeys.token, res.token);
    localStorage.setItem(storageKeys.user, JSON.stringify(res.user));
    state.token = res.token;
    state.user = res.user;
    state.db = res.state;
    state.projectId = res.state.projects[0]?.id;
    state.page = shouldShowFirstGenerationWizard(res.state, res.user) ? "wizard" : "project";
    window.history.replaceState({}, "", "/studio");
    notify(t("googleLoginSuccess"));
    return true;
  } catch (error) {
    window.history.replaceState({}, "", "/login");
    notify(error.message || t("googleLoginFailed"));
    return false;
  }
}

async function ensureStudioData() {
  if (state.db) return;
  if (agentLayoutFixtureEnabled()) {
    applyAgentLayoutFixture();
    return;
  }
  if (!state.user || !state.token) {
    window.history.replaceState({}, "", "/login");
    return;
  }
  try {
    state.db = await loadStudioState();
  } catch (error) {
    if (isAuthExpiredError(error)) {
      clearStoredSession();
      window.history.replaceState({}, "", "/login");
      notify(agentUserSafeError(error));
      return;
    }
    throw error;
  }
  state.projectId = state.db.projects[0]?.id;
  hydrateAgentChatsFromBackend();
  hydrateAgentChatIdentity();
  restoreAgentChatFromUrl({ quiet: true, replace: true });
  if (state.page === "dashboard" && shouldShowFirstGenerationWizard()) state.page = "wizard";
}

function applyAgentLayoutFixture() {
  const now = new Date().toISOString();
  const project = {
    id: "fixture-project",
    name: "Agent Layout Fixture",
    niche: "TikTok Shop beauty",
    product: "Bleu de Chanel 洁面啫喱",
    audience: "想快速做 TikTok Shop 内容的新手卖家",
    language: "中文",
    tone: "清楚、直接、能执行",
    results: [
      {
        id: "fixture-result-1",
        type: "image",
        title: "洁面啫喱产品图",
        prompt: "Clean studio product hero image",
        createdAt: now
      }
    ],
    resultCount: 1,
    createdAt: now,
    updatedAt: now
  };
  state.user = {
    id: "fixture-user",
    email: "fixture@pokaya.local",
    name: "Agent Fixture",
    role: "admin",
    billing: { credits: 83 }
  };
  state.db = {
    currentUser: state.user,
    projects: [project],
    results: project.results,
    attachments: [],
    billing: {
      plan: "Pokaya AI Pro",
      status: "Active",
      credits: 83,
      nextBill: "2026-06-26",
      invoices: []
    },
    usage: [],
    creditLedger: [],
    schedule: [
      { id: "fixture-schedule-1", title: "洁面啫喱开箱", platform: "TikTok", time: "Tonight 8:00 PM", status: "Ready", caption: "测试固定 fixture 排期", hashtags: "#pokaya" },
      { id: "fixture-schedule-2", title: "雪花秀卖点卡", platform: "TikTok", time: "Tomorrow 12:00 PM", status: "Draft", caption: "测试固定 fixture 排期", hashtags: "#beauty" },
      { id: "fixture-schedule-3", title: "Chanel 对比内容", platform: "TikTok", time: "Friday 9:00 PM", status: "Draft", caption: "测试固定 fixture 排期", hashtags: "#skincare" }
    ],
    payments: [],
    affiliate: {},
    admin: { users: [], payments: [], projects: [project], apiCalls: [], totals: {} },
    tiktok: { connections: [], publishes: [] }
  };
  state.projectId = project.id;
  state.page = "agent";
  state.lang = "zh";
  state.agentBusy = false;
  state.agentTyping = false;
  state.agentQueue = [];
  state.agentAttachments = [];
  state.agentHistoryOpen = false;
  state.agentDebugOpen = false;
  state.agentMessages = agentLayoutFixtureMessages();
}

function agentLayoutFixtureMessages() {
  return [
    {
      role: "assistant",
      content: "你好！我是 Pokaya Agent，你在 Pokaya AI Studio 里的智能助手。\n\n我可以帮你做这些事情：研究趋势、创建内容方案、生成产品图和视频、制作周内容计划。\n\n目前你的工作区里有几个内容方向，像是 Bleu de Chanel 洁面啫喱、雪花秀等。你可以直接告诉我：今天先做哪一个产品，我会帮你整理下一步。",
      agentRun: {
        id: "fixture-run-completed",
        status: "completed",
        plan: [
          { id: "understand", label: "理解需求", status: "completed", detail: "识别当前 workspace 的内容方向。" },
          { id: "reply", label: "回复建议", status: "completed", detail: "整理用户可以直接执行的下一步。" }
        ],
        toolCards: []
      }
    },
    {
      role: "user",
      content: "帮我看看今天该做什么"
    },
    {
      role: "assistant",
      content: "可以。我会先看当前项目、生成结果和排期，再给你一个最短可执行计划。\n\n建议今天先做：\n- 选一个主产品\n- 生成 1 张产品图\n- 写 3 个短视频开头\n- 把最好的结果排到今晚发布",
      agentRun: {
        id: "fixture-run-waiting",
        status: "waiting_confirmation",
        plan: [
          { id: "understand", label: "理解需求", status: "completed" },
          { id: "inspect", label: "检查 workspace", status: "completed" },
          { id: "confirm", label: "等待确认", status: "waiting_confirmation", detail: "涉及生成素材前需要确认。" }
        ],
        confirmation: {
          token: "fixture-confirm-token",
          title: "确认生成产品图",
          message: "这个动作会使用测试 fixture 的确认卡布局，不会真的扣 credit。",
          impact: "生成 1 张产品图",
          creditsRequired: 0.2,
          creditBalance: 83,
          toolName: "generate_project_output",
          args: { model: "Fixture Image" }
        }
      }
    }
  ];
}

async function loadStudioState() {
  try {
    return await api("/state", { timeoutMs: 12000 });
  } catch (error) {
    if (isAuthExpiredError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 700));
    return api("/state", { timeoutMs: 18000 });
  }
}

function isAuthExpiredError(error = {}) {
  return error.status === 401 || /login required|unauthorized|session/i.test(error.message || "");
}

function clearStoredSession() {
  localStorage.removeItem(storageKeys.user);
  localStorage.removeItem(storageKeys.token);
  state.user = null;
  state.token = "";
  state.db = null;
  state.studioBootError = "";
}

async function refreshState() {
  const db = await api("/state");
  set({ db });
  return db;
}

function set(patch) {
  const statePatch = { ...patch };
  delete statePatch.suppressAgentAutoScroll;
  const modalOnly = shouldPatchModalOnly(statePatch);
  const agentScroll = captureAgentThreadScroll();
  const agentInputFocus = captureAgentInputFocus(statePatch);
  const deferForAgentComposition = agentInputFocus?.composing && !Object.prototype.hasOwnProperty.call(statePatch, "agentInput") && state.page === "agent";
  const shouldScrollAgentThread = shouldAutoScrollAgentThread(patch, agentScroll);
  rememberSidebarScroll();
  if (agentInputFocus && !Object.prototype.hasOwnProperty.call(statePatch, "agentInput")) state.agentInput = agentInputFocus.value;
  Object.assign(state, statePatch);
  if (deferForAgentComposition) {
    state.agentRenderAfterComposition = true;
    return;
  }
  if (modalOnly) {
    updateModalRoot();
    if (Object.prototype.hasOwnProperty.call(statePatch, "projectMenuId") && !statePatch.projectMenuId) closeProjectMenusInDom();
    return;
  }
  if (shouldPatchAgentChatOnly(statePatch) && patchAgentChatDom(statePatch)) {
    restoreAgentInputFocus(agentInputFocus);
    if (shouldScrollAgentThread) scrollAgentThreadToBottom();
    else restoreAgentThreadScroll(agentScroll);
    return;
  }
  render();
  restoreAgentInputFocus(agentInputFocus);
  if (shouldScrollAgentThread) scrollAgentThreadToBottom();
  else restoreAgentThreadScroll(agentScroll);
}

function captureAgentInputFocus(patch = {}) {
  if (state.page !== "agent") return null;
  const input = document.querySelector("[data-agent-input]");
  if (!input || document.activeElement !== input) return null;
  if (Object.prototype.hasOwnProperty.call(patch, "agentInput")) return null;
  return {
    value: input.value,
    start: input.selectionStart,
    end: input.selectionEnd,
    composing: state.agentInputComposing || input.dataset.composing === "true"
  };
}

function restoreAgentInputFocus(snapshot = null) {
  if (!snapshot || state.page !== "agent") return;
  requestAnimationFrame(() => {
    const input = document.querySelector("[data-agent-input]");
    if (!input) return;
    input.focus({ preventScroll: true });
    input.value = snapshot.value;
    state.agentInput = snapshot.value;
    if (snapshot.composing) {
      autoResizeAgentInput(input);
      return;
    }
    const end = Math.min(snapshot.end ?? snapshot.value.length, snapshot.value.length);
    input.setSelectionRange(Math.min(snapshot.start ?? end, end), end);
    autoResizeAgentInput(input);
  });
}

function shouldAutoScrollAgentThread(patch = {}, scroll = null) {
  if (state.page !== "agent") return false;
  if (patch.suppressAgentAutoScroll) return false;
  const affectsThread = Object.prototype.hasOwnProperty.call(patch, "agentMessages")
    || Object.prototype.hasOwnProperty.call(patch, "agentBusy")
    || Object.prototype.hasOwnProperty.call(patch, "agentQueue");
  return affectsThread && (!scroll || scroll.nearBottom);
}

function shouldPatchAgentChatOnly(patch = {}) {
  if (state.page !== "agent") return false;
  if (!document.querySelector(".agent-chat-shell.agent-page-panel")) return false;
  const keys = Object.keys(patch);
  if (!keys.length) return false;
  const agentOnlyKeys = new Set([
    "agentMessages",
    "agentInput",
    "agentAttachments",
    "agentBusy",
    "agentTyping",
    "agentQueue",
    "agentBusyStartedAt",
    "agentWorkingTick",
    "agentTaskMode",
    "agentVisualPhase",
    "agentIdleActivity",
    "agentContextSummary",
    "agentRecoveredRun",
    "activeAgentHistoryId",
    "activeAgentDraftId",
    "db"
  ]);
  return keys.every((key) => agentOnlyKeys.has(key));
}

function patchAgentChatDom(patch = {}) {
  const shell = document.querySelector(".agent-chat-shell.agent-page-panel");
  if (!shell) return false;
  const affectsThread = ["agentMessages", "agentBusy", "agentTyping", "agentQueue", "agentBusyStartedAt", "agentWorkingTick", "db"].some((key) => Object.prototype.hasOwnProperty.call(patch, key));
  const affectsForm = ["agentInput", "agentAttachments", "agentBusy", "agentTyping", "agentMessages"].some((key) => Object.prototype.hasOwnProperty.call(patch, key));
  const affectsToolbar = ["agentBusy", "agentTyping", "activeAgentHistoryId"].some((key) => Object.prototype.hasOwnProperty.call(patch, key));
  if (affectsToolbar) {
    const toolbar = shell.querySelector(".agent-chat-toolbar");
    if (!toolbar) return false;
    toolbar.outerHTML = agentChatToolbar();
    bindAgentControls();
  }
  if (affectsThread) {
    const thread = shell.querySelector(".agent-thread");
    if (!thread) return false;
    thread.innerHTML = agentThreadHtml();
    bindAgentThreadControls(thread);
  }
  if (affectsForm) {
    const form = shell.querySelector(".agent-form");
    if (!form) return false;
    form.outerHTML = agentFormHtml();
    bindAgentControls();
  }
  if (state.agentDebugOpen) {
    const debug = shell.querySelector(".agent-debug-panel");
    const nextDebug = agentDebugPanel();
    if (debug && nextDebug) debug.outerHTML = nextDebug;
  }
  window.lucide?.createIcons();
  return true;
}

function captureAgentThreadScroll() {
  if (state.page !== "agent") return null;
  const thread = document.querySelector(".agent-chat-shell .agent-thread");
  if (!thread) return null;
  const distanceFromBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight;
  return {
    top: thread.scrollTop,
    height: thread.scrollHeight,
    nearBottom: distanceFromBottom < 96
  };
}

function restoreAgentThreadScroll(scroll = null) {
  if (!scroll || state.page !== "agent") return;
  const restore = () => {
    const thread = document.querySelector(".agent-chat-shell .agent-thread");
    if (!thread) return;
    const heightDelta = thread.scrollHeight - scroll.height;
    thread.scrollTop = Math.max(0, scroll.top + Math.min(0, heightDelta));
  };
  requestAnimationFrame(restore);
}

function scrollAgentThreadToBottom() {
  const scroll = () => {
    const thread = document.querySelector(".agent-chat-shell .agent-thread");
    if (!thread) return;
    thread.scrollTo({ top: thread.scrollHeight, behavior: "auto" });
  };
  requestAnimationFrame(() => {
    scroll();
    requestAnimationFrame(scroll);
  });
  [80, 240, 600].forEach((delay) => window.setTimeout(scroll, delay));
}

function shouldPatchModalOnly(patch) {
  if (!isStudioPath() || state.loading || !document.getElementById("modal-root")) return false;
  const keys = Object.keys(patch);
  return keys.includes("modal") && keys.every((key) => ["modal", "editingProjectId", "projectMenuId", "activeAgentRunId"].includes(key));
}

function updateModalRoot() {
  const root = document.getElementById("modal-root");
  if (!root) return render();
  root.innerHTML = modal();
  bindModal(root);
  window.lucide?.createIcons();
}

function bindModal(root) {
  root.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", (event) => action(event, el.dataset.action)));
  root.querySelectorAll("form").forEach((el) => el.addEventListener("submit", submit));
  root.querySelectorAll("[data-image-preset]").forEach((el) => el.addEventListener("click", () => applyImagePreset(el.dataset.imagePreset)));
}

function closeProjectMenusInDom() {
  document.querySelectorAll(".project-menu-item.menu-open").forEach((item) => item.classList.remove("menu-open"));
  document.querySelectorAll(".project-action-menu").forEach((menu) => menu.remove());
}

function rememberSidebarScroll() {
  const sidebar = document.querySelector(".sidebar-scroll-area") || document.querySelector(".sidebar");
  if (sidebar) sidebarScrollTop = sidebar.scrollTop;
}

function restoreSidebarScroll() {
  const sidebar = document.querySelector(".sidebar-scroll-area") || document.querySelector(".sidebar");
  if (!sidebar) return;
  const maxScroll = Math.max(0, sidebar.scrollHeight - sidebar.clientHeight);
  sidebar.scrollTop = Math.min(sidebarScrollTop, maxScroll);
}

function stabilizeImageConsoleExpansion(duration = 900) {
  imageConsoleExpandLockUntil = Math.max(imageConsoleExpandLockUntil, Date.now() + duration);
  const scrollSnapshot = {
    windowY: window.scrollY || 0,
    windowX: window.scrollX || 0,
    workspace: document.querySelector(".workspace")?.scrollTop || 0,
    shell: document.querySelector(".studio-shell")?.scrollTop || 0
  };
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const restore = () => {
    window.scrollTo(scrollSnapshot.windowX, scrollSnapshot.windowY);
    const workspace = document.querySelector(".workspace");
    const shell = document.querySelector(".studio-shell");
    if (workspace) workspace.scrollTop = scrollSnapshot.workspace;
    if (shell) shell.scrollTop = scrollSnapshot.shell;
    document.querySelectorAll(".image-generate-console").forEach((el) => {
      el.classList.add("is-hover-expanded");
      el.classList.remove("is-compact");
    });
  };
  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  [40, 120, 260, 600, duration].forEach((delay) => window.setTimeout(restore, delay));
}

function bindImageConsoleCompact() {
  imageConsoleScrollCleanup?.();
  imageConsoleScrollCleanup = null;
  const consoleEl = document.querySelector(".image-higgsfield-mode .image-generate-console");
  if (!consoleEl) return;
  let ticking = false;
  let compact = consoleEl.classList.contains("is-compact");
  let hovering = false;
  let menuOpen = false;
  let compactAt = 1;
  let expandAt = 0;
  const modelPickers = [...consoleEl.querySelectorAll(".image-model-picker")];
  const aspectMenus = [...consoleEl.querySelectorAll(".image-aspect-ratio-menu")];
  const resolutionMenus = [...consoleEl.querySelectorAll(".image-resolution-menu")];
  const allMenus = [...modelPickers, ...aspectMenus, ...resolutionMenus];
  const closeImageConsoleMenus = (except = null) => {
    allMenus.forEach((el) => {
      if (el !== except) el.removeAttribute("open");
    });
    if (!except?.classList?.contains("image-aspect-ratio-menu")) closeAspectRatioPopover();
  };
  const closeModelMenus = () => closeImageConsoleMenus();
  const updateMenuState = () => {
    menuOpen = allMenus.some((el) => el.hasAttribute("open")) || Boolean(document.querySelector(".floating-aspect-ratio-options"));
    consoleEl.classList.toggle("has-open-menu", menuOpen);
    if (menuOpen) {
      consoleEl.classList.add("is-hover-expanded");
      consoleEl.classList.remove("is-compact");
    }
  };
  const scrollTargets = [
    window,
    document.querySelector(".workspace"),
    document.querySelector(".studio-shell")
  ].filter(Boolean);
  const uniqueScrollTargets = [...new Set(scrollTargets)];
  const scrollOffset = () => Math.max(
    window.scrollY || 0,
    ...uniqueScrollTargets
      .filter((target) => target !== window)
      .map((target) => target.scrollTop || 0)
  );
  const refreshThresholds = () => {
    compactAt = 1;
    expandAt = 0;
  };
  const sync = () => {
    ticking = false;
    const scrollY = scrollOffset();
    const nextCompact = compact ? scrollY > expandAt : scrollY > compactAt;
    if (nextCompact !== compact) compact = nextCompact;
    updateMenuState();
    const expandLocked = imageConsoleExpandedUntilUserScroll || Date.now() < imageConsoleExpandLockUntil || consoleEl.contains(document.activeElement);
    if (expandLocked) {
      consoleEl.classList.add("is-hover-expanded");
      consoleEl.classList.remove("is-compact");
    }
    const shouldCompact = compact && !hovering && !menuOpen && !expandLocked;
    consoleEl.classList.toggle("is-compact", shouldCompact);
    if (shouldCompact) closeModelMenus();
  };
  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sync);
  };
  const expandForHover = () => {
    hovering = true;
    imageConsoleExpandedUntilUserScroll = true;
    consoleEl.classList.add("is-hover-expanded");
    consoleEl.classList.remove("is-compact");
  };
  const expandForPointerHover = (event) => {
    if (event.pointerType === "touch") return;
    expandForHover();
  };
  const releaseHoverExpansion = () => {
    hovering = false;
    updateMenuState();
    requestSync();
  };
  const markUserScrollIntent = () => {
    imageConsoleUserScrollIntentUntil = Date.now() + 800;
  };
  const handleUserScrollKey = (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
      markUserScrollIntent();
    }
  };
  const handleScroll = () => {
    const hasUserScrollIntent = Date.now() < imageConsoleUserScrollIntentUntil;
    if (hasUserScrollIntent) {
      imageConsoleExpandLockUntil = 0;
      imageConsoleExpandedUntilUserScroll = false;
      if (hovering) hovering = false;
      if (!menuOpen) consoleEl.classList.remove("is-hover-expanded");
    }
    requestSync();
  };
  const restoreAfterFocus = (event) => {
    if (event.relatedTarget && consoleEl.contains(event.relatedTarget)) return;
    releaseHoverExpansion();
  };
  const handleResize = () => {
    refreshThresholds();
    requestSync();
  };
  const handleMenuToggle = (event) => {
    const menu = event.currentTarget;
    if (menu.hasAttribute("open")) closeImageConsoleMenus(menu);
    updateMenuState();
    requestSync();
  };
  const handleSummaryPointerDown = (event) => {
    const menu = event.target.closest?.(".image-model-picker,.image-resolution-menu,.image-aspect-ratio-menu");
    if (!menu) return;
    stabilizeImageConsoleExpansion(700);
    closeImageConsoleMenus(menu);
    updateMenuState();
  };
  uniqueScrollTargets.forEach((target) => target.addEventListener("scroll", handleScroll, { passive: true }));
  window.addEventListener("wheel", markUserScrollIntent, { passive: true, capture: true });
  window.addEventListener("touchmove", markUserScrollIntent, { passive: true, capture: true });
  window.addEventListener("keydown", handleUserScrollKey, true);
  window.addEventListener("resize", handleResize);
  consoleEl.addEventListener("mouseenter", expandForHover);
  consoleEl.addEventListener("mousemove", expandForHover);
  consoleEl.addEventListener("mouseleave", releaseHoverExpansion);
  consoleEl.addEventListener("pointerenter", expandForPointerHover);
  consoleEl.addEventListener("pointermove", expandForPointerHover);
  consoleEl.addEventListener("pointerleave", releaseHoverExpansion);
  consoleEl.addEventListener("focusin", expandForHover);
  consoleEl.addEventListener("focusout", restoreAfterFocus);
  allMenus.forEach((el) => el.addEventListener("toggle", handleMenuToggle));
  consoleEl.querySelectorAll(".image-model-picker summary,.image-resolution-menu summary,.image-aspect-ratio-menu summary").forEach((el) => el.addEventListener("pointerdown", handleSummaryPointerDown));
  refreshThresholds();
  sync();
  imageConsoleScrollCleanup = () => {
    uniqueScrollTargets.forEach((target) => target.removeEventListener("scroll", handleScroll));
    window.removeEventListener("wheel", markUserScrollIntent, true);
    window.removeEventListener("touchmove", markUserScrollIntent, true);
    window.removeEventListener("keydown", handleUserScrollKey, true);
    window.removeEventListener("resize", handleResize);
    consoleEl.removeEventListener("mouseenter", expandForHover);
    consoleEl.removeEventListener("mousemove", expandForHover);
    consoleEl.removeEventListener("mouseleave", releaseHoverExpansion);
    consoleEl.removeEventListener("pointerenter", expandForPointerHover);
    consoleEl.removeEventListener("pointermove", expandForPointerHover);
    consoleEl.removeEventListener("pointerleave", releaseHoverExpansion);
    consoleEl.removeEventListener("focusin", expandForHover);
    consoleEl.removeEventListener("focusout", restoreAfterFocus);
    allMenus.forEach((el) => el.removeEventListener("toggle", handleMenuToggle));
    consoleEl.querySelectorAll(".image-model-picker summary,.image-resolution-menu summary,.image-aspect-ratio-menu summary").forEach((el) => el.removeEventListener("pointerdown", handleSummaryPointerDown));
  };
}


function bindCollapsedSidebarTooltips() {
  sidebarTooltipCleanup?.();
  sidebarTooltipCleanup = null;
  document.querySelectorAll(".sidebar-hover-tooltip").forEach((el) => el.remove());
  const targetSelector = ".agent-primary-card[aria-label], .side-primary[aria-label], .side-link[aria-label], .side-support-button[aria-label], .sidebar-collapse-toggle[aria-label]";
  const tooltip = document.createElement("div");
  tooltip.className = "sidebar-hover-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);
  let activeTarget = null;
  const resolveTarget = (event) => {
    const target = event.target.closest?.(targetSelector);
    if (!target || !target.closest(".studio-shell.sidebar-collapsed")) return null;
    return target;
  };
  const hide = () => {
    activeTarget = null;
    tooltip.classList.remove("is-visible");
    tooltip.textContent = "";
  };
  const show = (target) => {
    const label = target.getAttribute("aria-label") || target.getAttribute("title") || target.textContent.trim();
    if (!label) return hide();
    activeTarget = target;
    target.setAttribute("title", label);
    const rect = target.getBoundingClientRect();
    tooltip.textContent = label;
    const tooltipWidth = Math.max(tooltip.offsetWidth, 120);
    const left = Math.min(rect.right + 12, window.innerWidth - tooltipWidth - 12);
    tooltip.style.left = `${Math.max(88, Math.round(left))}px`;
    tooltip.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
    tooltip.classList.add("is-visible");
  };
  const handlePointerOver = (event) => {
    const target = resolveTarget(event);
    if (target && target !== activeTarget) show(target);
  };
  const handlePointerOut = (event) => {
    if (!activeTarget) return;
    const related = event.relatedTarget;
    if (related && activeTarget.contains(related)) return;
    hide();
  };
  const handleFocusIn = (event) => {
    const target = resolveTarget(event);
    if (target) show(target);
  };
  document.addEventListener("pointerover", handlePointerOver);
  document.addEventListener("pointerout", handlePointerOut);
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("focusout", hide);
  sidebarTooltipCleanup = () => {
    document.removeEventListener("pointerover", handlePointerOver);
    document.removeEventListener("pointerout", handlePointerOut);
    document.removeEventListener("focusin", handleFocusIn);
    document.removeEventListener("focusout", hide);
    tooltip.remove();
  };
}

function project() {
  return state.db.projects.find((item) => item.id === state.projectId) || state.db.projects[0];
}

function wizardStorageKey(user = state.user) {
  return `pokaya-first-wizard:${String(user?.email || user?.id || "guest").toLowerCase()}`;
}

function shouldShowFirstGenerationWizard(db = state.db, user = state.user) {
  if (!db || !user || user.role === "admin") return false;
  if (localStorage.getItem(wizardStorageKey(user)) === "done") return false;
  const ownedProjects = db.projects || [];
  const hasResults = ownedProjects.some((item) => (item.results || []).length > 0);
  return !ownedProjects.length || !hasResults;
}

function markFirstGenerationWizardDone() {
  if (state.user) localStorage.setItem(wizardStorageKey(state.user), "done");
}

function dbWithProjectField(db, projectId, field, value) {
  const path = field.split(".");
  return {
    ...db,
    projects: db.projects.map((item) => {
      if (item.id !== projectId) return item;
      const next = { ...item };
      let cursor = next;
      path.slice(0, -1).forEach((key) => {
        cursor[key] = { ...(cursor[key] || {}) };
        cursor = cursor[key];
      });
      cursor[path.at(-1)] = value;
      return next;
    })
  };
}

function dbWithPreservedAttachments(nextDb, previousDb, attachmentIds = []) {
  if (!nextDb || !previousDb || !attachmentIds.length) return nextDb;
  const existingIds = new Set((nextDb.attachments || []).map((item) => item.id));
  const preserved = (previousDb.attachments || []).filter((item) => attachmentIds.includes(item.id) && !existingIds.has(item.id));
  return preserved.length ? { ...nextDb, attachments: [...preserved, ...(nextDb.attachments || [])] } : nextDb;
}

function dbWithoutResult(db, resultId) {
  if (!db || !resultId) return db;
  return {
    ...db,
    projects: (db.projects || []).map((item) => ({
      ...item,
      results: (item.results || []).filter((result) => result.id !== resultId),
      resultCount: Math.max(0, Number(item.resultCount || 0) - ((item.results || []).some((result) => result.id === resultId) ? 1 : 0))
    }))
  };
}

function routeShell(content) {
  const dock = pathIs("/login") ? `<div class="global-lang-dock">${languageSwitch()}</div>` : "";
  return `${dock}${content}`;
}

function render() {
  if (assetLibraryWarmFrame) {
    window.cancelAnimationFrame(assetLibraryWarmFrame);
    assetLibraryWarmFrame = null;
  }
  initDelegatedEvents();
  app.innerHTML = state.loading ? `<main class="loading">${icon("loader-circle")} Loading...</main>` : routeShell(route());
  applyStudioChineseLocalization();
  bind();
  window.lucide?.createIcons();
  updatePromoCountdown();
  restoreSidebarScroll();
  bindImageConsoleCompact();
  bindStudioWallInfiniteScroll();
  bindCollapsedSidebarTooltips();
  scrollToSopAnchor();
  scheduleAssetLibraryThumbWarmup();
}

function initDelegatedEvents() {
  if (app.dataset.delegatedEvents === "true") return;
  app.dataset.delegatedEvents = "true";
  app.addEventListener("click", handleDelegatedClick);
  app.addEventListener("pointerdown", handleDelegatedPointerDown, { passive: true });
  app.addEventListener("pointerover", handleDelegatedPreviewWarm, { passive: true });
  app.addEventListener("focusin", handleDelegatedPreviewWarm);
}

function handleDelegatedPointerDown(event) {
  const resultActionButton = event.target.closest?.("[data-result-action]");
  if (resultActionButton && app.contains(resultActionButton)) flashResultActionButton(resultActionButton);
  const resultPreviewTarget = event.target.closest?.("[data-result-preview]");
  if (resultPreviewTarget && app.contains(resultPreviewTarget)) warmResultPreview(resultPreviewTarget.dataset.resultPreview);
  const historyTarget = event.target.closest?.("[data-agent-history-restore],[data-agent-history-restore-row]");
  if (historyTarget && app.contains(historyTarget) && !event.target.closest("[data-agent-history-rename], [data-agent-history-delete], [data-agent-history-title-input]")) {
    markAgentHistorySelection(historyTarget.dataset.agentHistoryRestore || historyTarget.dataset.agentHistoryRestoreRow || "");
  }
}

function handleDelegatedPreviewWarm(event) {
  const resultPreviewTarget = event.target.closest?.("[data-result-preview]");
  if (resultPreviewTarget && app.contains(resultPreviewTarget)) warmResultPreview(resultPreviewTarget.dataset.resultPreview);
}

function handleDelegatedClick(event) {
  const target = event.target.closest?.("[data-page],[data-step],[data-step-open],[data-project],[data-studio-wall-more],[data-result-select],[data-bulk-result-action],[data-result-action],[data-result-preview],[data-result-prompt],[data-image-canvas-result],[data-image-model-option],[data-generation-cancel],[data-generation-retry],[data-generation-edit],[data-settings-section],[data-agent-history-restore],[data-agent-history-restore-row]");
  if (!target || !app.contains(target)) return;

  if (target.dataset.agentHistoryRestore) {
    event.preventDefault();
    return restoreAgentHistory(target.dataset.agentHistoryRestore);
  }
  if (target.dataset.agentHistoryRestoreRow) {
    if (event.target.closest("[data-agent-history-rename], [data-agent-history-delete], [data-agent-history-title-input]")) return;
    event.preventDefault();
    return restoreAgentHistory(target.dataset.agentHistoryRestoreRow);
  }
  if (target.dataset.page) return scheduleNavigation({ page: target.dataset.page });
  if (target.dataset.step) return scheduleNavigation({ step: target.dataset.step });
  if (target.dataset.stepOpen) return scheduleNavigation({ page: "project", step: target.dataset.stepOpen });
  if (target.dataset.project) return scheduleNavigation({ projectId: target.dataset.project, page: "project", projectMenuId: null });
  if (target.dataset.studioWallMore) return showMoreStudioWall(target.dataset.studioWallMore);
  if (target.dataset.resultSelect) return toggleResultSelection(target.dataset.resultSelect);
  if (target.dataset.bulkResultAction) return bulkResultAction(target.dataset.bulkResultAction);
  if (target.dataset.resultAction) return resultAction(target);
  if (target.dataset.resultPreview) {
    const fromAgent = Boolean(target.closest?.(".agent-generation-card, .agent-tool-cards"));
    return set({ modal: "previewResult", activeResultId: target.dataset.resultPreview, resultDetailSource: fromAgent ? "agent" : "" });
  }
  if (target.dataset.resultPrompt) return set({ modal: "resultPrompt", activeResultId: target.dataset.resultPrompt });
  if (target.dataset.imageCanvasResult) return set({ imageCanvasSelectedResultId: target.dataset.imageCanvasResult });
  if (target.dataset.imageModelOption) {
    stabilizeImageConsoleExpansion(1000);
    target.closest("details")?.removeAttribute("open");
    return saveImageModelQuick(target.dataset.imageModelOption, target);
  }
  if (target.dataset.settingsSection) {
    return set({ settingsSection: normalizeSettingsSection(target.dataset.settingsSection) });
  }
  if (target.dataset.generationCancel) return cancelGenerationJob(target.dataset.generationCancel);
  if (target.dataset.generationRetry) return retryGenerationJob(target.dataset.generationRetry);
  if (target.dataset.generationEdit) return editGenerationJobPrompt(target.dataset.generationEdit);
}

function scheduleNavigation(patch = {}) {
  const nextPage = patch.page;
  const nextStep = patch.step;
  const nextProjectId = patch.projectId;
  const samePage = !nextPage || nextPage === state.page;
  const sameStep = !nextStep || nextStep === state.step;
  const sameProject = !nextProjectId || nextProjectId === state.projectId;
  if (samePage && sameStep && sameProject && !patch.modal && !patch.projectMenuId) return;
  if (!samePage || !sameStep || !sameProject) patch.selectedResultIds = [];
  document.documentElement.classList.add("is-route-changing");
  if (navigationFrame) window.cancelAnimationFrame(navigationFrame);
  navigationFrame = window.requestAnimationFrame(() => {
    navigationFrame = null;
    set(patch);
    window.setTimeout(() => document.documentElement.classList.remove("is-route-changing"), 90);
  });
}

function studioChineseDictionary() {
  return {
    "Language": "Language",
    "Workspace": "工作区",
    "Business": "业务",
    "Start Here": "新手开始",
    "Pokaya Agent": "Pokaya Agent",
    "Admin CRM": "管理员 CRM",
    "SOP": "SOP",
    "Dashboard": "总控",
    "New project": "新项目",
    "Projects": "项目",
    "Project": "项目",
    "Public Tools": "公开工具",
    "Content Library": "内容库",
    "Sign out": "退出登录",
    "Billing": "账单",
    "Top Up Credit": "充值 Credit",
    "Top Up": "充值",
    "Usage": "用量",
    "Affiliate": "联盟",
    "Auto Post TikTok": "自动发布 TikTok",
    "Join Discussion WhatsApp": "WhatsApp 群",
    "WhatsApp Group": "WhatsApp 群",
    "Settings": "设置",
    "Human Support": "人工客服",
    "Support": "客服",
    "Credit Balance": "Credit 余额",
    "Current Plan": "当前计划",
    "Cancel subscription": "取消订阅",
    "Renewal": "续费日期",
    "Status": "状态",
    "Rates": "费率",
    "Payment history": "付款记录",
    "Date": "日期",
    "Description": "说明",
    "Amount": "金额",
    "Check": "检查",
    "Export": "导出",
    "Export Data": "导出数据",
    "Generated Assets": "生成素材",
    "Pokaya Asset Library": "Pokaya 素材库",
    "Find, reuse, schedule, rename, download, and keep building from every generated asset.": "查找、复用、排期、改名、下载，并继续使用所有生成素材。",
    "Search product, prompt, result...": "搜索产品、prompt、结果...",
    "All": "全部",
    "All products": "全部产品",
    "Total assets": "素材总数",
    "Visible": "当前显示",
    "Products": "产品",
    "No assets match this filter.": "没有符合筛选条件的素材。",
    "Image": "图片",
    "Images": "图片",
    "Video": "视频",
    "Videos": "视频",
    "Text": "文字",
    "Auto": "自动",
    "Clone": "复刻",
    "Post": "发布",
    "Other": "其他",
    "Image Generator": "图片生成器",
    "Model": "模型",
    "Mode": "模式",
    "Avatar Reference (Optional)": "人物参考（可选）",
    "Product Reference (Optional)": "产品参考（可选）",
    "Prompt": "提示词",
    "Generate Media": "生成作品",
    "No results yet": "还没有结果",
    "Generated asset": "生成素材",
    "Pokaya asset": "Pokaya 素材",
    "No prompt saved for this result.": "这个结果没有保存 prompt。",
    "Text result": "文字结果",
    "Visual Card": "视觉卡片",
    "AI Product Image": "AI 产品图",
    "AI Short Video": "AI 短视频",
    "UGC Script": "UGC 脚本",
    "Content Plan": "内容计划",
    "Clone Viral Style": "复刻爆款结构",
    "Ask Pokaya Agent": "询问 Pokaya Agent",
    "Beginner setup": "新手开始",
    "Selected tool": "选择的功能",
    "Prompt preview": "Prompt 预览",
    "Estimated credits": "预计 credits",
    "Product name": "产品名",
    "Product link": "产品链接",
    "Style": "风格",
    "Back": "返回",
    "Continue": "继续",
    "Start now": "开始使用",
    "Skip setup": "跳过引导",
    "Not sure yet": "还不确定",
    "Soft sell": "柔和销售",
    "Review": "测评",
    "Problem-solution": "痛点解决",
    "Offer push": "优惠推动",
    "Full name": "姓名",
    "Email": "邮箱",
    "Password": "密码",
    "Welcome back": "欢迎回来",
    "Continue with Google": "使用 Google 登录",
    "Profile": "个人资料",
    "Account info & contact": "账号资料和联系方式",
    "Display Name": "显示名称",
    "Save Profile": "保存资料",
    "WhatsApp Number": "WhatsApp 号码",
    "Save WhatsApp": "保存 WhatsApp",
    "Change Password": "修改密码",
    "Old Password": "旧密码",
    "New Password": "新密码",
    "Confirm New": "确认新密码",
    "Rename project": "重命名项目",
    "Delete project": "删除项目",
    "Save name": "保存名称",
    "Cancel": "取消",
    "Done": "完成",
    "Message": "消息",
    "Create password": "创建密码",
    "Register & Enter Studio": "注册并进入工作台",
    "Wallet Balance": "钱包余额",
    "Total Earned": "累计收益",
    "Total Cashed Out": "累计提现",
    "Clicks": "点击",
    "Your Referral Code": "您的推荐码",
    "Copy Code": "复制代码",
    "Share this link to invite sellers": "分享这个链接邀请用户",
    "Referral link": "推荐链接",
    "Copy Link": "复制链接",
    "Overview": "总览",
    "Commissions": "佣金",
    "Referrals": "推荐",
    "Cash Out": "提现",
    "How affiliate works": "联盟如何运作",
    "Total referrals": "推荐总数",
    "Commission events": "佣金事件",
    "Total earned": "累计收益",
    "Available to withdraw": "可提现",
    "Pending cashouts": "待处理提现",
    "Minimum cashout": "最低提现",
    "Image Generate": "图片生成",
    "images possible": "可生成图片数",
    "Video 8s": "8 秒视频",
    "videos possible": "可生成视频数",
    "Audio (10 video pack)": "Audio（10 条视频包）",
    "batch": "批次",
    "10 video x 8s + 1 master plan": "10 条 8 秒视频 + 1 份主计划",
    "Select credit package": "选择充值配套",
    "Instant top-up via CHIP": "通过 CHIP 即时充值",
    "Credits": "Credits",
    "Top up history": "充值记录",
    "Starter pack": "入门包",
    "Try it out": "先试试",
    "Common": "常用",
    "Best value": "最划算",
    "Best": "推荐",
    "Power user": "高频用户",
    "Total Spend": "总消耗",
    "generated": "已生成",
    "Auto Plans": "自动计划",
    "batches": "批次",
    "Filter": "筛选",
    "All time": "全部时间",
    "Action": "动作",
    "Preview": "预览",
    "Credit": "Credit",
    "Balance": "余额",
    "Usage activity": "用量记录",
    "Credit activity": "Credit 记录",
    "No activity in this range.": "这个范围内没有活动。",
    "Live Activity": "实时动态",
    "SOP Library": "SOP 库",
    "On This SOP": "本篇 SOP",
    "Publish & Operate": "发布与运营",
    "Progress": "进度",
    "Continue": "继续",
    "Step": "步骤",
    "Guide": "指南",
    "What is this?": "这是什么？",
    "When should I use this?": "什么时候使用？",
    "How to use it": "怎么使用",
    "Tip": "提示",
    "Workflow tip": "操作建议",
    "Before you leave this SOP": "离开这篇 SOP 前",
    "Coming soon": "即将上线",
    "Close SOP": "关闭 SOP",
    "Idle mode": "待命模式",
    "Image station": "图片工位",
    "Video station": "视频工位",
    "Copy station": "文案工位",
    "Schedule station": "排期工位",
    "Chat station": "沟通工位",
    "Sleeping": "休息中",
    "Chatting": "沟通中",
    "Working": "工作中",
    "Avatar": "人物",
    "Product shot": "产品图",
    "Thumbnail": "封面",
    "Hook": "开头",
    "Scene": "场景",
    "Script": "脚本",
    "Caption": "Caption",
    "Queue": "队列",
    "Listen": "倾听",
    "Clarify": "追问",
    "Reply": "回复",
    "Standby": "待命中",
    "Working": "工作中",
    "Needs confirmation": "需要确认",
    "Completed": "已完成",
    "New Chat": "新对话",
    "History": "历史",
    "More": "更多",
    "Debug": "调试",
    "Close": "关闭",
    "Send": "发送",
    "Workspace Summary": "Workspace 摘要",
    "Current project": "当前项目",
    "Results": "结果",
    "Schedule": "排期",
    "Next step": "下一步",
    "No project yet": "还没有项目",
    "Ready": "准备好了",
    "You": "你",
    "Agent": "Agent",
    "Status": "状态",
    "Run": "运行",
    "Steps": "步骤",
    "Tool cards": "工具卡片",
    "No agent run yet.": "还没有 Agent 运行记录。",
    "Trend research": "趋势分析",
    "Fit": "匹配度",
    "Score": "分数",
    "Sources": "来源",
    "Content plan": "内容计划",
    "Open project": "打开项目",
    "Create drafts": "创建草稿",
    "Visual card": "视觉卡片",
    "Social selling card": "社交销售卡片",
    "Publish-ready social card saved.": "可发布的社交卡片已保存。",
    "Video prompt": "视频 prompt",
    "Workspace checklist": "Workspace 检查清单",
    "Workspace looks ready for the next Agent task.": "Workspace 已准备好执行下一个 Agent 任务。",
    "Memory updated": "记忆已更新",
    "Drafts created": "草稿已创建",
    "Agent action needs recovery.": "Agent 动作需要恢复。",
    "Try": "尝试",
    "Open": "打开",
    "Title": "标题",
    "Publish time": "发布时间",
    "Hashtags": "Hashtags",
    "Product URL": "产品 URL",
    "Payment received. Checking activation status...": "已收到付款，正在检查开通状态...",
    "Payment failed. Please try again.": "付款失败，请重试。",
    "Payment cancelled.": "付款已取消。"
  };
}

function translateStudioChineseText(text) {
  const dict = studioChineseDictionary();
  const trimmed = String(text || "").trim();
  if (!trimmed) return text;
  if (dict[trimmed]) return String(text).replace(trimmed, dict[trimmed]);
  let next = String(text);
  const phraseMap = [
    ["days left", "天"],
    ["Expires", "到期"],
    ["items", "项"],
    ["credits", "credits"],
    ["checklist done", "项清单完成"],
    ["total in range", "范围内总数"],
    ["generated", "已生成"],
    ["No payment records yet.", "还没有付款记录。"],
    ["No top up records yet.", "还没有充值记录。"]
  ];
  phraseMap.forEach(([from, to]) => {
    next = next.replaceAll(from, to);
  });
  return next;
}

function applyStudioChineseLocalization() {
  if (state.lang !== "zh" || !isStudioPath()) return;
  const root = app.querySelector(".studio-shell");
  if (!root) return;
  const skipSelector = "textarea, input, code, pre, .result-prompt p, .result-text-preview, .visual-card-preview, .agent-message, .agent-chat-bubble";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(skipSelector)) return NodeFilter.FILTER_REJECT;
      if (!String(node.nodeValue || "").trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    node.nodeValue = translateStudioChineseText(node.nodeValue);
  });
  root.querySelectorAll("[title], [aria-label], [placeholder]").forEach((el) => {
    ["title", "aria-label", "placeholder"].forEach((attr) => {
      if (el.hasAttribute(attr)) el.setAttribute(attr, translateStudioChineseText(el.getAttribute(attr)));
    });
  });
}

function route() {
  if (isStudioPath()) return studio();
  if (pathIs("/login")) return login();
  if (pathIs("/register")) return registerPage();
  if (pathIs("/affiliate")) return affiliatePage();
  if (pathIs("/terms")) return legalPage("terms");
  if (pathIs("/privacy")) return legalPage("privacy");
  return publicSite();
}

function scrollToSopAnchor() {
  if (!state.sopStepAnchor) return;
  const target = document.getElementById(`sop-step-${state.sopStepAnchor}`);
  if (!target) return;
  requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "smooth" }));
  state.sopStepAnchor = "";
}

function heroOfferCopy() {
  const data = {
    ms: "<b>RM79.80/bulan</b>, bukan beli banyak AI tools. Ini pintu untuk mula buat content, promote produk dan bina peluang side income dengan AI.",
    zh: "<b>RM79.80/月</b>，买的不是一堆 AI 工具，而是一个让您开始用 AI 做内容、推广产品、发展副业机会的入口。",
    en: "<b>RM79.80/month</b>, not a pile of random AI tools. It is a clear entry point to create content, promote products, and start an AI-assisted side hustle."
  };
  return data[state.lang] || data.ms;
}

function heroAgentPanel() {
  const data = {
    ms: {
      product: "Wireless earbuds",
      audience: "Students, commuters, office workers",
      question: "How can I promote this product on TikTok?",
      answer: "Focus on one pain: cheap earbuds sound weak. Generate a comparison visual, a 12s demo idea, and a Bahasa voiceover.",
      assets: [["Image", "Comparison visual", "20 sen"], ["Video", "12s demo direction", "RM0.40"], ["Script", "Bahasa voiceover", "Ready"]],
      confirm: "Pokaya will ask before spending credits."
    },
    zh: {
      product: "蓝牙耳机",
      audience: "学生、通勤族、办公室人群",
      question: "这个产品要怎么做 TikTok Affiliate 内容？",
      answer: "先抓一个痛点：便宜耳机音质差。生成对比图片、12 秒短视频方向和 Bahasa 口播脚本。",
      assets: [["图片", "对比素材", "20 sen"], ["视频", "12 秒方向", "RM0.40"], ["文案", "Bahasa 口播", "Ready"]],
      confirm: "真正扣 credit 前，Pokaya 会先让用户确认。"
    },
    en: {
      product: "Wireless earbuds",
      audience: "Students, commuters, office workers",
      question: "How should I promote this product on TikTok?",
      answer: "Start with one pain: cheap earbuds sound weak. Generate a comparison visual, a 12s demo direction, and a Bahasa voiceover.",
      assets: [["Image", "Comparison visual", "20 sen"], ["Video", "12s demo direction", "RM0.40"], ["Script", "Bahasa voiceover", "Ready"]],
      confirm: "Pokaya asks before spending credits."
    }
  };
  const content = data[state.lang] || data.ms;
  return `
    <aside class="hero-agent-panel hero-workbench" aria-label="Pokaya Agent content workflow preview">
      <div class="agent-panel-top hero-workbench-top">
        <img src="${brandAssets.mascot}" alt="" aria-hidden="true">
        <div><b>Pokaya Agent</b><span>Your AI operator</span></div>
        <em>READY</em>
      </div>
      <div class="hero-product-brief">
        <div class="hero-product-image">${icon("headphones", 34)}</div>
        <div>
          <span>Product brief</span>
          <b>${content.product}</b>
          <small>${content.audience}</small>
        </div>
      </div>
      <div class="agent-chat-preview">
        <p class="chat-user">${content.question}</p>
        <p class="chat-agent">${content.answer}</p>
      </div>
      <div class="asset-output-grid">
        ${content.assets.map(([kind, title, cost]) => `
          <article>
            <span>${kind}</span>
            <b>${title}</b>
            <small>${cost}</small>
          </article>`).join("")}
      </div>
      <div class="prompt-preview-card hero-credit-confirm">
        ${icon("shield-check", 18)}
        <p>${content.confirm}</p>
      </div>
    </aside>`;
}

function publicSite() {
  return `
    <main class="public-shell">
      ${promoBar()}
      <nav class="public-nav">
        ${brand()}
        <div class="public-links">
          <a href="#features">${t("navFeatures")}</a>
          <a href="#pricing">${t("navPricing")}</a>
          <a href="/affiliate">${t("navAffiliate")}</a>
          <a href="#faq">${t("navFaq")}</a>
        </div>
        <div class="nav-actions">
          <button class="dark-button" data-action="open-login">${icon("log-in")} ${t("signIn")}</button>
          ${languageSwitch()}
        </div>
      </nav>
      <section class="public-hero video-scene-hero">
        <div class="hero-copy-layer">
          <p class="eyebrow">${t("heroEyebrow")}</p>
          <h1 class="hero-headline hero-headline-${state.lang}">${heroTitleMarkup()}</h1>
          <p class="public-copy">${t("heroCopy")}</p>
          <div class="public-actions">
            <button class="gold-button" data-action="open-register">${icon("sparkles")} ${t("startCreating")}</button>
            <a class="dark-button demo-button" href="#demo">${icon("play-circle")} ${t("demoCta")}</a>
          </div>
          <p class="hero-offer-copy">${heroOfferCopy()}</p>
          <div class="trust-row">
            <span>${icon("badge-check", 16)}${t("heroTrust1")}</span>
            <span>${icon("shield-check", 16)}${t("heroTrust2")}</span>
            <span>${icon("wallet-cards", 16)}${t("heroTrust3")}</span>
            <span>${icon("coins", 16)}${t("heroTrust4")}</span>
          </div>
        </div>
        ${heroAgentPanel()}
      </section>
      <section class="test-volume-section">
        <div>
          <p class="eyebrow">${testVolumeContent().kicker}</p>
          <h2>${testVolumeContent().title}</h2>
          <p>${testVolumeContent().copy}</p>
        </div>
        <div class="volume-formula">${testVolumeSteps()}</div>
      </section>
      <section class="split-section">
        <div><p class="eyebrow">${t("sellerReality")}</p><h2>${t("painTitle")}</h2><p>${t("painCopy")}</p></div>
        <div class="pain-list">
          ${painCards()}
        </div>
      </section>
      <section class="system-section">
        <div>
          <p class="eyebrow">${whyPokayaContent().kicker}</p>
          <h2>${whyPokayaContent().title}</h2>
          <p>${whyPokayaContent().copy}</p>
        </div>
        <div class="system-grid">${whyPokayaCards()}</div>
      </section>
      <section class="output-preview-section">
        <div>
          <p class="eyebrow">${t("liveOutput")}</p>
          <h2>${t("outputTitle")}</h2>
          <p>${t("outputCopy")}</p>
        </div>
        <div class="output-preview-grid">${outputPreviewCards()}</div>
      </section>
      <section id="features" class="workflow-section">
        <div>
          <p class="eyebrow">${t("howKicker")}</p>
          <h2>${t("howTitle")}</h2>
          <p>${t("howCopy")}</p>
          <button class="gold-button section-cta" data-action="open-register">${icon("sparkles")} ${t("startCreating")}</button>
        </div>
        <div class="workflow-steps">${workflowSteps()}</div>
      </section>
      <section class="feature-section">
        <p class="eyebrow">${t("advantage")}</p>
        <h2>${t("weaponsTitle")}</h2>
        <div class="feature-mosaic">
          ${featureMosaicCards()}
        </div>
      </section>
      <section id="demo" class="demo-section">
        <div>
          <p class="eyebrow">${demoKickerContent()}</p>
          <h2>${t("demoTitle")}</h2>
          <p>${t("demoCopy")}</p>
          <button class="gold-button section-cta" data-action="open-register">${icon("credit-card")} ${t("claimPlan")}</button>
        </div>
        <div class="demo-reel">
          ${demoGalleryCards()}
        </div>
      </section>
      <section class="comparison-section">
        <p class="eyebrow">Manual vs Pokaya AI</p>
        <h2>${comparisonContent().title}</h2>
        <div class="compare-grid">
          <article><span>${t("oldWay")}</span><h3>${comparisonContent().oldTitle}</h3><ul>${comparisonContent().oldBullets.map((item) => `<li>${item}</li>`).join("")}</ul></article>
          <article class="winner"><span>${t("newWay")}</span><h3>${comparisonContent().newTitle}</h3><ul>${comparisonContent().newBullets.map((item) => `<li>${item}</li>`).join("")}</ul></article>
        </div>
      </section>
      <section class="scenario-section">
        <div>
          <p class="eyebrow">${scenarioContent().kicker}</p>
          <h2>${scenarioContent().title}</h2>
          <p>${scenarioContent().copy}</p>
        </div>
        <div class="scenario-grid">${scenarioCards()}</div>
      </section>
      <section id="pricing" class="pricing-section">
        <div>
          <p class="eyebrow">${t("navPricing")}</p>
          <h2>${t("pricingTitle")}</h2>
          <p>${t("pricingCopy")}</p>
          <div class="pricing-breakdown">${pricingBreakdownRows()}</div>
          <div class="pricing-steps">${pricingSteps()}</div>
        </div>
        <article class="price-card">
          <span>${t("launchOffer")}</span>
          <img class="price-brand-mark" src="${brandAssets.mascot}" alt="" aria-hidden="true">
          <h3>Pokaya AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM79.80</b><small>${pricePeriodContent().period}</small></div>
          <div class="included-credit-banner">${includedCreditBanner()}</div>
          <div class="usage-price-grid">${usagePriceCards()}</div>
          <ul>${pricingBullets().map((item) => `<li>${item}</li>`).join("")}</ul>
          <p class="risk-note">${t("riskReversal")}</p>
          <button class="gold-button" data-action="open-register">${icon("credit-card")} ${t("claimPlan")}</button>
        </article>
      </section>
      <section class="control-section">
        <div>
          <p class="eyebrow">${t("controlKicker")}</p>
          <h2>${t("controlTitle")}</h2>
          <p>${t("controlCopy")}</p>
        </div>
        <div class="control-grid">${controlCards()}</div>
      </section>
      <section class="signup-section">
        <div><p class="eyebrow">${t("startNow")}</p><h2>${t("registerTitle")}</h2><p>${t("registerCopy")}</p><img class="signup-brand-banner" src="${brandAssets.banner}" alt="Pokaya AI"></div>
        <form class="lead-form" data-form="lead">
          <label>${t("fullName")}<input name="name" placeholder="Your name"></label>
          <label>WhatsApp<input name="phone" placeholder="+60"></label>
          <label>${t("email")}<input name="email" placeholder="you@pokaya.ai"></label>
          <button class="gold-button" type="submit">${icon("lock")} ${t("continueRegistration")}</button>
        </form>
      </section>
      <section id="faq" class="faq-section">
        <p class="eyebrow">${t("navFaq")}</p>
        <h2>${t("faqTitle")}</h2>
        ${faqItems().map((item, index) => `<details ${index === 0 ? "open" : ""}><summary>${item.q}</summary><p>${item.a}</p></details>`).join("")}
      </section>
      ${footerBrand("Pokaya AI")}
    </main>`;
}

function registerPage() {
  const checkout = checkoutPageContent();
  return `
    <main class="public-shell">
      <nav class="public-nav">
        ${brand(t("checkout"))}
        <div class="nav-actions">
          <button class="dark-button" data-action="open-home">${icon("arrow-left")} Home</button>
          ${languageSwitch()}
        </div>
      </nav>
      <section class="register-hero">
        <div>
          <p class="eyebrow">${t("startNow")}</p>
          <h1>${t("registerTitle")}</h1>
          <p class="public-copy">${t("registerCopy")}</p>
          <div class="checkout-steps">
            ${checkout.steps.map(([number, title, body]) => `<article><b>${number}</b><span>${title}</span><p>${body}</p></article>`).join("")}
          </div>
        </div>
        <article class="price-card checkout-card">
          <span>${t("launchOffer")}</span>
          <img class="price-brand-mark" src="${brandAssets.mascot}" alt="" aria-hidden="true">
          <h3>Pokaya AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM79.80</b><small>${pricePeriodContent().period}</small></div>
          <div class="included-credit-banner">${includedCreditBanner()}</div>
          <div class="usage-price-grid">${usagePriceCards()}</div>
          <ul><li>Full Studio access</li><li>Prompt Library</li><li>Image AI tools</li><li>Video AI tools</li><li>Audio tools</li><li>Clone Video & Storytelling tools</li><li>TikTok Affiliate Pack</li><li>VIP tool updates</li></ul>
        </article>
      </section>
      <section id="checkout" class="signup-section checkout-section">
        <div>
          <p class="eyebrow">${checkout.buyerKicker}</p>
          <h2>${checkout.buyerTitle}</h2>
          <p>${checkout.buyerCopy}</p>
        </div>
        <form class="lead-form" data-form="register">
          <label>${t("fullName")}<input name="name" placeholder="${checkout.namePlaceholder}" required></label>
          <label>WhatsApp<input name="phone" placeholder="+60" required></label>
          <label>Email<input name="email" type="email" placeholder="you@pokaya.ai" required></label>
          <label>${t("password")}<input name="password" type="password" placeholder="${checkout.passwordPlaceholder}" minlength="6" required></label>
          <label class="check-label"><input type="checkbox" required> <span>${checkout.termsLead} <a href="/terms">Terms</a> ${checkout.termsAnd} <a href="/privacy">Privacy Policy</a>.</span></label>
          <button class="gold-button" type="submit">${icon("credit-card")} ${checkout.payButton}</button>
          <small>${checkout.secureNote}</small>
        </form>
      </section>
    </main>`;
}

function checkoutPageContent() {
  const data = {
    ms: {
      steps: [
        ["1", "Subscribe plan", "RM79.80/bulan unlock Pokaya AI Pro."],
        ["2", "Use credits", "Image dan video guna credit dengan kos jelas sebelum generate."],
        ["3", "Generate outputs", "Prompt, image, video, clone, story dan content tools deduct automatik."]
      ],
      buyerKicker: "Buyer details",
      buyerTitle: "Account info untuk login dan support.",
      buyerCopy: "Order Pokaya AI Pro akan dibuat dan anda akan dibawa ke halaman pembayaran CHIP yang selamat.",
      namePlaceholder: "Nama penuh anda",
      passwordPlaceholder: "Create password",
      termsLead: "Saya bersetuju dengan",
      termsAnd: "dan",
      payButton: "Bayar RM79.80 - FPX / DuitNow QR",
      secureNote: "Secured via CHIP Payment."
    },
    zh: {
      steps: [
        ["1", "订阅计划", "RM79.80/月开通 Pokaya AI Pro。"],
        ["2", "使用 credit", "图片和视频会使用 credit，生成前显示清楚成本。"],
        ["3", "生成 output", "Prompt、image、video、clone、story 和 content tools 会自动扣除。"]
      ],
      buyerKicker: "购买资料",
      buyerTitle: "用于登录和 support 的账号信息。",
      buyerCopy: "系统会创建 Pokaya AI Pro 订单，并跳转到安全的 CHIP 付款页面。",
      namePlaceholder: "您的姓名",
      passwordPlaceholder: "创建密码",
      termsLead: "我同意",
      termsAnd: "和",
      payButton: "支付 RM79.80 - FPX / DuitNow QR",
      secureNote: "通过 CHIP Payment 安全付款。"
    },
    en: {
      steps: [
        ["1", "Subscribe plan", "RM79.80/month unlocks Pokaya AI Pro."],
        ["2", "Use credits", "Images and videos use credits with clear cost before generation."],
        ["3", "Generate outputs", "Prompt, image, video, clone, story, and content tools deduct automatically."]
      ],
      buyerKicker: "Buyer details",
      buyerTitle: "Account info for login and support.",
      buyerCopy: "This creates a pending Pokaya AI Pro order and redirects you to the secure CHIP payment page.",
      namePlaceholder: "Your full name",
      passwordPlaceholder: "Create password",
      termsLead: "I agree to",
      termsAnd: "and",
      payButton: "Pay RM79.80 - FPX / DuitNow QR",
      secureNote: "Secured via CHIP Payment."
    }
  };
  return data[state.lang] || data.ms;
}

function affiliatePage() {
  return `
    <main class="public-shell affiliate-shell">
      <nav class="public-nav">
        ${brand(t("affiliate"))}
        <div class="nav-actions">
          <button class="dark-button" data-action="open-home">${icon("arrow-left")} Main page</button>
          ${languageSwitch()}
        </div>
      </nav>
      <section class="affiliate-hero">
        <div>
          <p class="eyebrow">Affiliate program</p>
          <h1>Earn monthly commission by sharing Pokaya AI.</h1>
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
          <article><b>2</b><span>Get account access</span><p>Use the product so your content can show real outputs.</p></article>
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
      ${footerBrand("Pokaya AI Affiliate")}
    </main>`;
}

function legalPage(type) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const updated = "Last updated: May 26, 2026";
  const sections = isPrivacy
    ? [
        ["Information we collect", "Pokaya AI collects account details, project content, uploaded product or creator references, generation prompts, billing records, usage logs, and TikTok connection data when you choose to connect a TikTok account."],
        ["How we use information", "We use this information to provide the Studio, generate content, manage subscriptions and credits, support your account, improve reliability, and publish or prepare posts only when you request it."],
        ["TikTok data", "If you connect TikTok, we use TikTok OAuth data only to identify the connected account, check creator or posting eligibility, and submit content through approved TikTok APIs. We do not sell TikTok account data."],
        ["Sharing", "We share information with service providers that operate hosting, payments, AI generation, analytics, support, and official publishing integrations. We disclose information if required by law or to protect users and the service."],
        ["Retention and deletion", "We keep account and project data while your account is active or as needed for legal, tax, security, and operational reasons. You may request deletion by contacting hello@pokaya.ai."],
        ["Contact", "For privacy questions, account deletion, or data access requests, contact hello@pokaya.ai."]
      ]
    : [
        ["Service", "Pokaya AI is a web application for TikTok Shop sellers and content teams to create, organize, schedule, and publish or prepare product content."],
        ["Accounts", "You are responsible for keeping your login secure, providing accurate information, and using the service only for content and products you are allowed to promote."],
        ["Generated content", "AI output can contain mistakes. You are responsible for reviewing claims, captions, assets, disclosures, music, product details, and compliance before publishing."],
        ["TikTok publishing", "When TikTok integrations are enabled, posts are created only from user-approved queue items. TikTok may review, limit, reject, or remove content according to its own rules and API policies."],
        ["Payments and credits", "Subscription and generation credits unlock product features. Usage-based credits may be deducted when generation or publishing actions are requested, subject to the plan terms shown at checkout."],
        ["Acceptable use", "Do not use Pokaya AI to infringe intellectual property, impersonate others, bypass platform rules, make unsafe product claims, spam, or publish illegal or harmful content."],
        ["Contact", "For support or legal questions, contact hello@pokaya.ai."]
      ];

  return `
    <main class="public-shell legal-shell">
      <nav class="public-nav">
        ${brand("Pokaya AI")}
        <div class="public-links">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </div>
        <div class="nav-actions">
          <button class="dark-button" data-action="open-register">${icon("sparkles")} Start</button>
          ${languageSwitch()}
        </div>
      </nav>
      <section class="legal-hero">
        <p class="eyebrow">Legal</p>
        <h1>${title}</h1>
        <p>${updated}</p>
      </section>
      <section class="legal-content">
        ${sections.map(([heading, body]) => `<article><h2>${heading}</h2><p>${body}</p></article>`).join("")}
      </section>
      ${footerBrand("Pokaya AI")}
    </main>`;
}

function featureCard(kicker, title, text, ic) {
  return `<article>${icon(ic, 30)}<span>${kicker}</span><h3>${title}</h3><p>${text}</p></article>`;
}

function heroPanelContent() {
  const data = {
    ms: { label: "AI Tool Kit", title: "Prompt, image, video<br>dan content plan" },
    zh: { label: "AI 工具箱", title: "Prompt、图片、视频<br>和内容计划" },
    en: { label: "AI Tool Kit", title: "Prompts, images, videos<br>and content plans" }
  };
  return data[state.lang] || data.ms;
}

function pricePeriodContent() {
  const data = {
    ms: { proof: "RM79.80/bulan", period: "/bulan" },
    zh: { proof: "RM79.80/月", period: "/月" },
    en: { proof: "RM79.80/month", period: "/month" }
  };
  return data[state.lang] || data.ms;
}

function featureMosaicCards() {
  const data = {
    ms: [
      ["01", "Image AI", "Hasilkan gambar produk, creator shot, thumbnail dan promo visual untuk content harian.", "image"],
      ["02", "Video AI", "Buat video pendek untuk TikTok, Reels, Shorts, ads dan product demo tanpa shoot manual.", "video"],
      ["03", "Prompt Library", "Prompt siap untuk hook, caption, storytelling, sales angle dan content idea.", "message-square-text"],
      ["04", "Audio", "Beri suara kepada video dengan voiceover, preset suara dan arahan emosi.", "audio-lines"],
      ["05", "TikTok Affiliate Pack", "Pakej pertama yang dioptimumkan untuk beginner yang mahu mula promote produk.", "badge-dollar-sign"]
    ],
    zh: [
      ["01", "不知道拍什么？", "用 AI 生成内容 idea、短视频方向和产品角度，先找到可以发布的第一批内容。", "image"],
      ["02", "不会写脚本？", "生成口播文案、推广文案、caption 和产品卖点，不用从零开始想。", "message-square-text"],
      ["03", "没有素材？", "生成产品图片、creator shot、短视频素材和可继续变体的视觉方向。", "video"],
      ["04", "不想研究工具？", "常用 AI 内容功能集中在一个平台，不用到处切换和重新整理。", "sparkles"],
      ["05", "想开始 AI 副业？", "先从 TikTok Affiliate 内容开始，用 AI 做内容，用内容推广产品。", "badge-dollar-sign"]
    ],
    en: [
      ["01", "Image AI", "Create product images, creator shots, thumbnails, and promo visuals for daily content.", "image"],
      ["02", "Video AI", "Create short videos for TikTok, Reels, Shorts, ads, and product demos without manual filming.", "video"],
      ["03", "Prompt Library", "Ready prompts for hooks, captions, storytelling, sales angles, and content ideas.", "message-square-text"],
      ["04", "Audio", "Give your videos a voice with voiceover direction, presets, and emotion controls.", "audio-lines"],
      ["05", "TikTok Affiliate Pack", "The first optimized pack for beginners who want to start promoting products.", "badge-dollar-sign"]
    ]
  };
  return (data[state.lang] || data.ms).map(([kicker, title, text, ic]) => featureCard(kicker, title, text, ic)).join("");
}

function painCards() {
  const data = {
    ms: [
      ["map", "Tak tahu nak mula", "Anda tahu AI penting, tapi tak jelas langkah pertama yang patut dibuat hari ini."],
      ["layers", "Terlalu banyak AI tool", "Satu tool untuk gambar, satu untuk video, satu untuk prompt, satu untuk caption. Akhirnya pening."],
      ["message-square-text", "Tak pandai prompt", "Output nampak biasa sebab prompt tak cukup spesifik, tapi belajar prompt dari kosong makan masa."],
      ["timer", "Content lambat siap", "Nak buat satu post pun lama. Idea, visual, caption dan video semua kena fikir manual."],
      ["repeat", "Susah konsisten", "AI hanya berguna kalau digunakan setiap hari. Tanpa sistem, semangat hilang selepas beberapa hari."],
      ["sparkles", "Tiada cara guna yang jelas", "Pokaya AI bukan bagi satu lagi chatbot. Pokaya bagi alat dan langkah yang boleh terus digunakan."]
    ],
    zh: [
      ["map", "不知道选什么产品", "想做 TikTok Affiliate，但第一步就卡在产品和方向。"],
      ["layers", "不知道拍什么内容", "看到别人发视频很简单，自己打开镜头或 AI 工具就空白。"],
      ["message-square-text", "不知道怎么写脚本", "产品卖点、开头、口播、caption 都要自己想，很容易拖延。"],
      ["timer", "不知道用哪个 AI 工具", "图片、视频、prompt、素材分别散在不同地方，越研究越慢。"],
      ["repeat", "不知道怎么变成可发布内容", "AI 给了答案，但还要自己整理成 TikTok 能用的素材和脚本。"],
      ["sparkles", "一直收藏教程但没开始", "Pokaya AI 想解决的，就是让您真正做出第一条内容。"]
    ],
    en: [
      ["map", "Do not know where to start", "You know AI matters, but the first step to do today is unclear."],
      ["layers", "Too many AI tools", "One tool for images, one for video, one for prompts, one for captions. It becomes messy."],
      ["message-square-text", "Prompting feels hard", "Outputs look generic when prompts are not specific, but learning from zero takes time."],
      ["timer", "Content takes too long", "One post needs ideas, visuals, captions, and videos. Manual work slows everything."],
      ["repeat", "Hard to stay consistent", "AI only helps when used repeatedly. Without a system, motivation fades after a few days."],
      ["sparkles", "No clear steps", "Pokaya AI is not another chatbot. Pokaya gives tools and steps you can use directly."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([ic, title, text]) => `<article>${icon(ic, 24)}<h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function whyPokayaContent() {
  const data = {
    ms: {
      kicker: "Kenapa bukan AI biasa",
      title: "Guna AI sendiri mudah jadi random, Pokaya beri cara guna yang lebih jelas",
      copy: "AI umum hanya beri jawapan. Pokaya membungkus prompt, image, video dan content plan menjadi tools yang lebih terus guna untuk content dan promotion."
    },
    zh: {
      kicker: "现实区",
      title: "别人已经开始用 AI 做内容<br>您还在想第一步怎么开始？",
      copy: "TikTok Affiliate 的机会不只是给会拍视频的人。AI 出现之后，做内容的门槛已经变低了。您要做的，是选产品、发布内容、观察反馈，然后持续优化。"
    },
    en: {
      kicker: "Why not generic AI",
      title: "Generic AI can become random. Pokaya gives tools and steps to follow",
      copy: "Generic AI gives answers. Pokaya packages prompts, images, videos, and content plans into tools that are easier to use for content and promotion."
    }
  };
  return data[state.lang] || data.ms;
}

function whyPokayaCards() {
  const data = {
    ms: [
      ["layout-template", "Ada cara guna", "Pilih tugas seperti image, video, audio, prompt atau affiliate pack."],
      ["message-square-text", "Ada prompt siap", "Tidak perlu mula dari kosong untuk hook, caption, sales angle atau storytelling."],
      ["wand-sparkles", "Ada platform", "Generate dan simpan output dalam satu tempat, bukan lompat antara banyak tool."],
      ["badge-dollar-sign", "Ada arah income", "Fokus pada content, promotion dan peluang income tanpa menjanjikan hasil tetap."]
    ],
    zh: [
      ["layout-template", "选产品和方向", "先把产品、niche 或 affiliate 方向放进 Pokaya。"],
      ["message-square-text", "生成内容角度", "让 AI 帮您拆出 hook、卖点、口播、caption 和内容 idea。"],
      ["wand-sparkles", "生成素材", "用平台模型生成产品图、短视频素材和可复用 prompt。"],
      ["badge-dollar-sign", "开始发布测试", "把内容用于 TikTok Affiliate、短视频带货和产品推广，不承诺固定结果。"]
    ],
    en: [
      ["layout-template", "Clear steps", "Choose tasks such as image, video, audio, prompt, or affiliate pack."],
      ["message-square-text", "Ready prompts", "Hooks, captions, sales angles, and storytelling do not start from a blank page."],
      ["wand-sparkles", "Platform", "Generate and save outputs in one place instead of jumping between tools."],
      ["badge-dollar-sign", "Income direction", "Focused on content, promotion, and online income opportunities without promising results."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([ic, title, text]) => `<article>${icon(ic, 26)}<h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function outputPreviewCards() {
  return [
    ["01", t("hookTitle"), t("hookSample")],
    ["02", t("scriptTitle"), t("scriptSample")],
    ["03", t("captionTitle"), t("captionSample")],
    ["04", t("planTitle"), t("planSample")]
  ]
    .map(([kicker, title, text]) => `<article><span>${kicker}</span><h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function workflowSteps() {
  const data = {
    ms: [
      ["mouse-pointer-2", "Pilih tugas", "Pilih Image AI, Video AI, Audio, Prompt Library atau TikTok Affiliate Pack."],
      ["file-input", "Isi maklumat ringkas", "Masukkan produk, niche, idea, reference atau tujuan content yang anda mahu buat."],
      ["message-square-text", "Generate prompt & plan", "Pokaya bantu susun hook, caption, script, angle atau content plan."],
      ["image", "Generate visual", "Hasilkan image, creator shot, thumbnail atau product visual untuk digunakan."],
      ["video", "Generate video", "Buat video pendek, UGC, clone prompt atau story output mengikut tugas yang dipilih."],
      ["repeat", "Ulang dan test", "Simpan output, guna semula prompt, dan test lebih banyak idea dengan lebih tersusun."]
    ],
    zh: [
      ["credit-card", "开通 Pokaya AI Pro", "支付 RM79.80/月，解锁 Pokaya AI 的 AI 内容工具。"],
      ["package", "输入产品或方向", "填写产品、niche、想法、reference 或想推广的内容目标。"],
      ["message-square-text", "生成内容 idea 和文案", "生成短视频方向、口播脚本、推广文案、caption 和 CTA。"],
      ["image", "生成图片和视频素材", "用 AI 生成产品图片、短视频素材、creator shot 或 visual direction。"],
      ["folder-check", "整理成可发布内容", "把输出保存、下载、复制 prompt 或继续生成变体。"],
      ["send", "开始发布和推广", "用于 TikTok Affiliate、短视频带货和产品推广，再根据反馈持续优化。"]
    ],
    en: [
      ["mouse-pointer-2", "Choose a task", "Pick Image AI, Video AI, Audio, Prompt Library, or TikTok Affiliate Pack."],
      ["file-input", "Add simple details", "Enter a product, niche, idea, reference, or content goal."],
      ["message-square-text", "Generate prompt and plan", "Pokaya helps structure hooks, captions, scripts, angles, or content plans."],
      ["image", "Generate visuals", "Create images, creator shots, thumbnails, or product visuals."],
      ["video", "Generate videos", "Create short videos, UGC, clone prompts, or story outputs based on the selected task."],
      ["repeat", "Repeat and test", "Save outputs, reuse prompts, and test more ideas with structure."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([ic, title, text], index) => `<article><b>${String(index + 1).padStart(2, "0")}</b>${icon(ic, 24)}<h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function demoGalleryCards() {
  const data = {
    ms: [
      ["Skincare", "Kenapa kulit nampak kusam selepas tengah hari?", "UGC selling video", "RM0.40", "video"],
      ["Kitchenware", "Tool kecil ini boleh jimat separuh masa dapur", "Product demo video", "RM0.40", "video"],
      ["Supplement", "Before-after angle untuk buyer yang ragu-ragu", "Proof script", "RM0.40", "video"],
      ["Gadget", "3 sebab buyer selalu pilih model ini", "Comparison video", "RM0.40", "video"],
      ["Fashion", "Try-on angle untuk satu produk, banyak gaya", "Style video", "RM0.40", "video"],
      ["Product cover", "Cover visual untuk hook pertama", "AI product image", "20 sen", "image"],
      ["Beauty", "Buat buyer rasa ini rutin pagi yang mudah", "Routine video", "RM0.40", "video"],
      ["Home", "Masalah kecil rumah yang selalu orang abaikan", "Problem-solution video", "RM0.40", "video"],
      ["Baby", "Angle ibu baru yang perlukan penyelesaian cepat", "Emotion script", "RM0.40", "video"],
      ["Fitness", "Satu produk, tiga sebab orang mahu cuba", "Benefit video", "RM0.40", "video"],
      ["Travel", "Hook visual untuk barang travel ringan", "Lifestyle video", "RM0.40", "video"],
      ["Pet", "Buat produk nampak berguna dalam 8 saat", "Use-case video", "RM0.40", "video"],
      ["Food", "Angle rasa, tekstur dan craving dalam satu shot", "Food promo video", "RM0.40", "video"],
      ["Office", "Barang meja kerja yang nampak premium", "Desk setup video", "RM0.40", "video"],
      ["Bundle", "Tiga offer angle untuk set produk sama", "Offer script", "RM0.40", "video"]
    ],
    zh: [
      ["Skincare", "为什么您的皮肤一到下午就暗沉？", "UGC 带货视频", "RM0.40", "video"],
      ["Kitchenware", "这个厨房小工具，真的省掉一半时间", "产品演示视频", "RM0.40", "video"],
      ["Supplement", "给还在犹豫的买家一个 before-after 证明", "证明型脚本", "RM0.40", "video"],
      ["Gadget", "买这个 model 前先看这 3 个点", "对比型视频", "RM0.40", "video"],
      ["Fashion", "一件单品，拆出多个 try-on 角度", "穿搭展示视频", "RM0.40", "video"],
      ["Product cover", "让用户停下来的第一张封面图", "AI 产品图", "20 sen", "image"],
      ["Beauty", "把产品拍成一个早晨护肤习惯", "生活方式视频", "RM0.40", "video"],
      ["Home", "这个家居痛点，很多买家每天都遇到", "痛点解决视频", "RM0.40", "video"],
      ["Baby", "新手妈妈看到会停下来的角度", "情绪型脚本", "RM0.40", "video"],
      ["Fitness", "一个产品，拆出 3 个想试的理由", "卖点型视频", "RM0.40", "video"],
      ["Travel", "轻便旅行用品，先用画面抓注意力", "场景型视频", "RM0.40", "video"],
      ["Pet", "8 秒内让宠物用品看起来有用", "使用场景视频", "RM0.40", "video"],
      ["Food", "把口感、味道和想吃感放进一个镜头", "食品推广视频", "RM0.40", "video"],
      ["Office", "让桌面小物看起来更高级", "桌搭展示视频", "RM0.40", "video"],
      ["Bundle", "同一组产品，拆出 3 个 offer 角度", "优惠型脚本", "RM0.40", "video"]
    ],
    en: [
      ["Skincare", "Why does your skin look dull by afternoon?", "UGC selling video", "RM0.40", "video"],
      ["Kitchenware", "This small kitchen tool saves half the prep time", "Product demo video", "RM0.40", "video"],
      ["Supplement", "A before-after proof angle for hesitant buyers", "Proof script", "RM0.40", "video"],
      ["Gadget", "3 reasons buyers choose this model", "Comparison video", "RM0.40", "video"],
      ["Fashion", "One product, multiple try-on angles", "Style video", "RM0.40", "video"],
      ["Product cover", "A cover image that stops the scroll", "AI product image", "20 sen", "image"],
      ["Beauty", "Turn the product into a simple morning routine", "Lifestyle video", "RM0.40", "video"],
      ["Home", "A small home problem buyers see every day", "Problem-solution video", "RM0.40", "video"],
      ["Baby", "An angle that makes new parents pause", "Emotion script", "RM0.40", "video"],
      ["Fitness", "One product, three reasons to try it", "Benefit video", "RM0.40", "video"],
      ["Travel", "A lightweight travel product with a visual hook", "Lifestyle video", "RM0.40", "video"],
      ["Pet", "Make a pet product look useful in 8 seconds", "Use-case video", "RM0.40", "video"],
      ["Food", "Show taste, texture, and craving in one shot", "Food promo video", "RM0.40", "video"],
      ["Office", "Make a desk item look premium", "Desk setup video", "RM0.40", "video"],
      ["Bundle", "Three offer angles for one product set", "Offer script", "RM0.40", "video"]
    ]
  };
  return (data[state.lang] || data.ms).map(([category, hook, type, cost, kind]) => demoCard(category, hook, type, cost, kind)).join("");
}

function demoKickerContent() {
  const data = {
    ms: "Real Output Demo",
    zh: "真实输出 Demo",
    en: "Real Output Demo"
  };
  return data[state.lang] || data.ms;
}

function comparisonContent() {
  const data = {
    ms: {
      title: "Cara lama vs Cara Pokaya AI",
      oldTitle: "Buat sendiri dengan banyak tool",
      oldBullets: ["Cari prompt di internet", "Buka banyak AI tools berbeza", "Cuba prompt satu-satu", "Generate image di satu tempat", "Generate video di tempat lain", "Tulis caption manual", "Susun content plan sendiri"],
      newTitle: "Cara Pokaya AI",
      newBullets: ["Pilih tugas yang anda perlukan", "Isi produk, niche atau idea", "Generate prompt, image, script atau video", "Simpan output dalam satu platform", "Gunakan TikTok Affiliate Pack untuk mula promote produk", "Test lebih banyak angle dengan lebih cepat", "Ulang langkah yang sama setiap hari"]
    },
    zh: {
      title: "以前做 TikTok Affiliate 内容 vs 用 Pokaya AI",
      oldTitle: "自己从零开始",
      oldBullets: ["自己找产品", "自己想脚本", "自己拍视频", "自己剪辑", "自己写 caption", "自己找灵感", "自己研究 AI 工具", "做一条内容就卡很久"],
      newTitle: "用 Pokaya AI 开始",
      newBullets: ["选择产品方向", "用 AI 生成内容 idea", "用 AI 生成产品素材", "用 AI 生成口播文案", "用 AI 辅助制作短视频内容", "整理好之后就开始发布和测试"]
    },
    en: {
      title: "Old way vs Pokaya AI way",
      oldTitle: "Do it yourself with many tools",
      oldBullets: ["Search prompts online", "Open many different AI tools", "Try prompts one by one", "Generate images in one place", "Generate videos somewhere else", "Write captions manually", "Build the content plan yourself"],
      newTitle: "Choose a task, then generate",
      newBullets: ["Choose the task you need", "Enter a product, niche, or idea", "Generate prompts, images, scripts, or videos", "Save outputs in one platform", "Use TikTok Affiliate Pack to start promoting products", "Test more angles faster", "Repeat the same steps every day"]
    }
  };
  return data[state.lang] || data.ms;
}

function testVolumeContent() {
  const data = {
    ms: {
      kicker: "AI bukan susah",
      title: "Yang susah ialah tahu langkah seterusnya",
      copy: "Pokaya AI susun tools AI penting menjadi langkah yang lebih jelas supaya anda boleh buat content, promote produk dan explore peluang income tanpa mula dari kosong."
    },
    zh: {
      kicker: "三个核心卖点",
      title: "先降低开始门槛<br>再让您真正开始发布",
      copy: "Pokaya AI 不只是把工具放在一起，而是帮 TikTok Affiliate 新手把第一步变清楚：从产品、角度、素材到可以发布的内容。"
    },
    en: {
      kicker: "AI is not the hard part",
      title: "The hard part is knowing the next step",
      copy: "Pokaya AI organizes important AI tools into clearer steps so you can create content, promote products, and explore online income opportunities without starting from zero."
    }
  };
  return data[state.lang] || data.ms;
}

function testVolumeSteps() {
  const data = {
    ms: [
      ["1", "Cepat", "Generate idea, prompt, visual, script dan video tanpa buka 10 tool berbeza."],
      ["2", "Senang", "Pilih tujuan, isi maklumat ringkas, dan Pokaya bantu susun output."],
      ["3", "Lengkap", "Image AI, Video AI, Audio, Prompt Library dan Affiliate Pack dalam satu platform."],
      ["4", "Praktikal", "Fokus pada output yang boleh digunakan untuk content, produk dan promotion."]
    ],
    zh: [
      ["1", "更快开始", "不用再卡在“我要拍什么？”，用 AI 生成产品内容、短视频方向和推广文案。"],
      ["2", "更低门槛", "不需要一开始就买器材、请人拍摄或学复杂剪辑，先用 AI 做出内容素材。"],
      ["3", "更像副业入口", "先从 TikTok Affiliate 内容开始，用 AI 做内容，用内容推广产品。"]
    ],
    en: [
      ["1", "Fast", "Generate ideas, prompts, visuals, scripts, and videos without opening 10 tools."],
      ["2", "Easy", "Choose a goal, enter simple information, and let Pokaya structure the output."],
      ["3", "Complete", "Image AI, Video AI, Audio, Prompt Library, and Affiliate Pack in one platform."],
      ["4", "Practical", "Focus on outputs that can be used for content, products, and promotion."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([number, title, text]) => `<article><b>${number}</b><span>${title}</span><p>${text}</p></article>`)
    .join("");
}

function dreamContent() {
  const data = {
    ms: {
      kicker: "Apa yang anda beli",
      title: "Bukan sekadar tool AI. Ini tempat mula guna AI secara praktikal.",
      copy: "Pokaya AI bantu anda berhenti lompat antara terlalu banyak tool. Anda dapat satu tempat untuk prompt, image, video, content plan dan affiliate pack."
    },
    zh: {
      kicker: "您买到的是什么",
      title: "不只是 AI 工具<br>而是开始实用 AI 的地方",
      copy: "Pokaya AI 帮您停止在太多工具之间跳来跳去。您得到的是一个放 prompt、image、video、content plan 和 affiliate pack 的工作台。"
    },
    en: {
      kicker: "What you are buying",
      title: "Not just another AI tool. A practical place to start using AI.",
      copy: "Pokaya AI helps you stop jumping between too many tools. You get one place for prompts, images, videos, content plans, and affiliate packs."
    }
  };
  return data[state.lang] || data.ms;
}

function dreamCards() {
  const data = {
    ms: [
      ["RM79.80", "Akses Pro", "Satu plan untuk tools utama Pokaya AI."],
      ["Tools", "Image + Video", "Generate visual, video, prompt dan content plan."],
      ["Pack", "Affiliate pack", "TikTok Affiliate sebagai pakej pertama yang dioptimumkan."],
      ["Rutin", "Guna harian", "Bina habit content, promotion dan testing idea."]
    ],
    zh: [
      ["RM79.80", "Pro 访问", "一个计划解锁 Pokaya AI 主要工具。"],
      ["Tools", "图片 + 视频", "生成 visual、video、prompt 和 content plan。"],
      ["Pack", "Affiliate 工具包", "TikTok Affiliate 是第一个被优化的工具包。"],
      ["习惯", "每天使用", "建立内容、推广和想法测试的日常节奏。"]
    ],
    en: [
      ["RM79.80", "Pro access", "One plan for Pokaya AI's main tools."],
      ["Tools", "Image + Video", "Generate visuals, videos, prompts, and content plans."],
      ["Pack", "Affiliate pack", "TikTok Affiliate is the first optimized pack."],
      ["Routine", "Daily usage", "Build a content, promotion, and idea-testing habit."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([value, name, role]) => `<article><p>${value}</p><b>${name}</b><span>${role}</span></article>`)
    .join("");
}

function studentCaseContent() {
  const data = {
    ms: {
      kicker: "First optimized pack",
      title: "Dioptimumkan dahulu untuk TikTok Affiliate.",
      copy: "Pokaya AI bermula dengan TikTok Affiliate Pack kerana ramai beginner mahu mula promote produk tetapi tidak tahu nak buat content apa.",
      note: "TikTok Affiliate ialah use case pertama, bukan limit platform. Pokaya tetap ialah AI toolkit untuk content, promotion dan online income.",
      badge: "TikTok Affiliate Pack",
      cardCopy: "Hook + script + visual + content angle.",
      bullets: ["Product angle ideas", "Hook & script generator", "Malay content prompt", "Product image and video generation"]
    },
    zh: {
      kicker: "第一个优化工具包",
      title: "先为 TikTok Affiliate 深度优化",
      copy: "Pokaya AI 从 TikTok Affiliate Pack 开始，因为很多新手想推广产品，却不知道第一批内容该怎么做。",
      note: "TikTok Affiliate 是第一个 use case，不是平台边界。Pokaya 仍然是面向内容、推广和线上收入机会的 AI 工具箱。",
      badge: "TikTok Affiliate Pack",
      cardCopy: "Hook + script + visual + content angle。",
      bullets: ["产品角度 ideas", "Hook & script generator", "Malay content prompt", "产品图片和视频生成"]
    },
    en: {
      kicker: "First optimized pack",
      title: "Optimized first for TikTok Affiliate.",
      copy: "Pokaya AI starts with TikTok Affiliate because many beginners want to promote products but do not know what content to create first.",
      note: "TikTok Affiliate is the first use case, not the platform limit. Pokaya is still an AI toolkit for content, promotion, and online income opportunities.",
      badge: "TikTok Affiliate Pack",
      cardCopy: "Hook + script + visual + content angle.",
      bullets: ["Product angle ideas", "Hook & script generator", "Malay content prompt", "Product image and video generation"]
    }
  };
  return data[state.lang] || data.ms;
}

function sevenDayContent() {
  const data = {
    ms: {
      kicker: "Beginner path",
      title: "Selepas subscribe, mula dengan tugas paling mudah dahulu",
      copy: "Pokaya bukan suruh anda tekan butang secara rawak. Ia memberi urutan kerja supaya beginner tahu langkah pertama, output pertama dan cara guna pertama yang boleh diulang."
    },
    zh: {
      kicker: "新手路径",
      title: "订阅后<br>先从最简单的任务开始",
      copy: "Pokaya 不是让您随机按按钮，而是给新手一个执行顺序：先完成第一个 output，再重复同一套步骤。"
    },
    en: {
      kicker: "Beginner path",
      title: "After subscribing, start with the easiest task first",
      copy: "Pokaya does not ask you to press random buttons. It gives beginners a sequence for the first output and repeatable steps."
    }
  };
  return data[state.lang] || data.ms;
}

function sevenDaySteps() {
  const data = {
    ms: [
      ["Step 1", "Pilih tugas pertama", "Mula dengan Image AI, Video AI, Audio atau Prompt Library."],
      ["Step 2", "Isi input", "Masukkan produk, niche, idea atau reference yang anda ada."],
      ["Step 3", "Generate output", "Hasilkan prompt, visual, script, video atau content plan."],
      ["Step 4", "Simpan dan guna", "Download, copy atau simpan output dalam workspace."],
      ["Step 5", "Cuba Affiliate Pack", "Jika mahu promote produk, buka TikTok Affiliate Pack."],
      ["Step 6", "Buat variasi", "Generate beberapa versi hook, visual atau script."],
      ["Step 7", "Ulang rutin", "Gunakan langkah yang sama setiap kali mahu buat content baru."]
    ],
    zh: [
      ["Step 1", "选择第一个任务", "从 Image AI、Video AI、Audio 或 Prompt Library 开始。"],
      ["Step 2", "填写输入", "输入产品、niche、想法或 reference。"],
      ["Step 3", "生成 output", "生成 prompt、visual、script、video 或 content plan。"],
      ["Step 4", "保存并使用", "下载、复制或保存到 workspace。"],
      ["Step 5", "尝试 Affiliate Pack", "如果要推广产品，打开 TikTok Affiliate Pack。"],
      ["Step 6", "生成变体", "生成多个版本的 hook、visual 或 script。"],
      ["Step 7", "重复使用", "每次要做新内容时，重复同一套步骤。"]
    ],
    en: [
      ["Step 1", "Choose your first task", "Start with Image AI, Video AI, Audio, or Prompt Library."],
      ["Step 2", "Add input", "Enter a product, niche, idea, or reference you already have."],
      ["Step 3", "Generate output", "Create a prompt, visual, script, video, or content plan."],
      ["Step 4", "Save and use it", "Download, copy, or save the output in your workspace."],
      ["Step 5", "Try Affiliate Pack", "If you want to promote products, open the TikTok Affiliate Pack."],
      ["Step 6", "Create variations", "Generate several versions of hooks, visuals, or scripts."],
      ["Step 7", "Repeat the routine", "Use the same steps whenever you need new content."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([day, title, text]) => `<article><span>${day}</span><h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function scenarioContent() {
  const data = {
    ms: {
      kicker: "First optimized pack",
      title: "Dioptimumkan dahulu untuk TikTok Affiliate",
      copy: "Pokaya AI bermula dengan TikTok Affiliate Pack kerana ramai beginner mahu mula promote produk tetapi tidak tahu nak buat content apa. Gunakan Pokaya untuk cari angle, tulis hook, hasilkan visual, buat script dan susun content harian."
    },
    zh: {
      kicker: "第一个深度优化工具包",
      title: "先为 TikTok Affiliate 做深度优化",
      copy: "Pokaya AI 从 TikTok Affiliate Pack 开始，因为很多新手想推广产品，却不知道该做什么内容。用 Pokaya 找 angle、写 hook、生成 visual、做 script，并整理日常 content。"
    },
    en: {
      kicker: "First optimized pack",
      title: "Optimized first for TikTok Affiliate",
      copy: "Pokaya AI starts with TikTok Affiliate Pack because many beginners want to promote products but do not know what content to create. Use Pokaya to find angles, write hooks, generate visuals, create scripts, and plan daily content."
    }
  };
  return data[state.lang] || data.ms;
}

function scenarioCards() {
  const data = {
    ms: ["Product angle ideas", "Hook & script generator", "Malay content prompt", "Product image generation", "Video AI", "Caption and CTA ideas", "Clone/reference tools", "Daily content plan"],
    zh: ["Product angle ideas", "Hook & script generator", "Malay content prompt", "产品图生成", "Video AI", "Caption 和 CTA idea", "Clone/reference tools", "日常 content plan"],
    en: ["Product angle ideas", "Hook & script generator", "Malay content prompts", "Product image generation", "Video AI", "Caption and CTA ideas", "Clone/reference tools", "Daily content plan"]
  };
  return (data[state.lang] || data.ms)
    .map((item) => `<article>${icon("play-square", 20)}<span>${item}</span></article>`)
    .join("");
}

function pricingBullets() {
  const data = {
    ms: ["Image AI untuk gambar produk & content", "Video AI untuk TikTok, Reels & ads", "Audio voiceover workspace", "Unlimited Generate", "Prompt Library untuk sales & marketing", "Access Image Studio", "Access Video Studio", "Clone Video & Storytelling tools", "TikTok Affiliate Pack", "VIP group & tool updates"],
    zh: ["AI 产品图片生成", "AI 短视频素材生成", "Audio 配音工作台", "口播文案辅助", "推广文案辅助", "内容 idea 辅助", "TikTok Affiliate 内容工具", "Prompt Library", "Storytelling", "Clone Video", "VIP 交流群", "Image AI 低至 20 sen", "Video AI 低至 RM0.40"],
    en: ["Image AI for product and content images", "Video AI for TikTok, Reels, and ads", "Audio voiceover workspace", "Unlimited Generate", "Prompt Library for sales and marketing", "Access Image Studio", "Access Video Studio", "Clone Video and Storytelling tools", "TikTok Affiliate Pack", "VIP group and tool updates"]
  };
  return data[state.lang] || data.ms;
}

function usagePriceCards() {
  const data = {
    ms: [
      ["Image AI", "20 sen", "setiap gambar"],
      ["Video", "RM0.40", "setiap video"]
    ],
    zh: [
      ["Image AI", "20 sen", "每张生成"],
      ["视频", "RM0.40", "每条生成"]
    ],
    en: [
      ["Image AI", "20 sen", "per generation"],
      ["Video", "RM0.40", "per generation"]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([label, price, note]) => `<article><span>${label}</span><b>${price}</b><small>${note}</small></article>`)
    .join("");
}

function pricingBreakdownRows() {
  const data = {
    ms: [
      ["Plan Pro", "RM79.80/bulan"],
      ["Tool access", "Semua tools utama"],
      ["Image generation", "20 sen / image"],
      ["Video generation", "RM0.40 / video"]
    ],
    zh: [
      ["Pro 计划", "RM79.80/月"],
      ["工具权限", "所有主要工具"],
      ["图片生成", "20 sen / 张"],
      ["视频生成", "RM0.40 / 条"]
    ],
    en: [
      ["Pro plan", "RM79.80/month"],
      ["Tool access", "All main tools"],
      ["Image generation", "20 sen / image"],
      ["Video generation", "RM0.40 / video"]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([label, value]) => `<article><span>${label}</span><b>${value}</b></article>`)
    .join("");
}

function pricingSteps() {
  const data = {
    ms: [
      ["1", "Subscribe RM79.80/bulan", "Unlock semua studio, prompt library dan tools utama."],
      ["2", "Top up credit bila perlu", "USD 1 = 1000 credits. Credit digunakan untuk image dan video generation."],
      ["3", "Generate, auto-deduct", "Setiap generation auto-tolak ikut rate. Anda nampak kos sebelum generate."]
    ],
    zh: [
      ["1", "开通 Pokaya AI Pro", "支付 RM79.80/月，解锁 Pokaya AI 的 AI 内容工具。"],
      ["2", "使用 AI 生成内容", "根据您的产品和方向，生成图片、短视频素材、口播文案和推广内容。"],
      ["3", "开始发布和推广", "把生成好的内容整理后，用在 TikTok Affiliate、短视频带货和产品推广上。"]
    ],
    en: [
      ["1", "Subscribe RM79.80/month", "Unlock studios, prompt library, and main tools."],
      ["2", "Top up credits when needed", "USD 1 = 1000 credits. Credits are used for image and video generation."],
      ["3", "Generate, auto-deduct", "Each generation auto-deducts by rate. Show the cost before generation."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([step, title, text]) => `<article><b>${step}</b><span>${title}</span><p>${text}</p></article>`)
    .join("");
}

function includedCreditBanner() {
  const data = {
    ms: "Satu plan untuk image, video, prompt dan AI tools",
    zh: "RM79.80/月，给想用 AI 做 TikTok Affiliate 内容、短视频带货和产品推广的人。",
    en: "One plan for image, video, prompt, and AI tools"
  };
  return data[state.lang] || data.ms;
}

function controlCards() {
  const data = {
    ms: ["RM79.80/bulan untuk akses Pokaya AI Pro", "Pokaya AI bantu output, bukan guarantee income", "Anda tetap perlu pilih peluang, publish dan review result", "TikTok Affiliate ialah pack pertama, bukan seluruh identiti produk", "Semua kos generation perlu jelas sebelum generate"],
    zh: ["RM79.80/月开通 Pokaya AI Pro", "Pokaya AI 帮助生成 output，不保证收入", "您仍然需要选择机会、发布和复盘结果", "TikTok Affiliate 是第一个工具包，不是整个产品身份", "所有 generation 成本都应在生成前清楚显示"],
    en: ["RM79.80/month for Pokaya AI Pro access", "Pokaya AI helps with output; it does not guarantee income", "You still choose opportunities, publish, and review results", "TikTok Affiliate is the first pack, not the whole product identity", "Generation costs should be clear before generation"]
  };
  return (data[state.lang] || data.ms)
    .map((item) => `<article>${icon("check-circle-2", 20)}<p>${item}</p></article>`)
    .join("");
}

function faqItems() {
  const data = {
    ms: [
      ["Adakah Pokaya AI guarantee saya dapat income?", "Tidak. Pokaya AI tidak menjanjikan income. Pokaya AI membantu anda hasilkan content, idea, visual, video dan plan dengan lebih cepat supaya anda boleh test lebih banyak peluang."],
      ["Saya beginner, boleh guna?", "Boleh. Pokaya AI dibina untuk pengguna yang mahu mula guna AI tanpa perlu belajar banyak tool atau prompt yang rumit."],
      ["Adakah Pokaya AI hanya untuk TikTok Affiliate?", "Tidak. Pokaya AI ialah AI toolkit untuk content, sales dan online income. TikTok Affiliate ialah pack pertama yang kami optimalkan secara mendalam."],
      ["Apa beza Pokaya AI dengan ChatGPT?", "ChatGPT ialah chatbot umum. Pokaya AI membungkus prompt, image, video dan content plan menjadi tools yang lebih terus guna untuk content dan promotion."],
      ["Apa yang saya dapat dalam plan Pro?", "Anda dapat akses kepada Image AI, Video AI, Audio, Prompt Library, Storytelling, Clone Video, TikTok Affiliate Pack dan VIP group."],
      ["Perlu top up credit lagi?", "Jika generation menggunakan credit, anda hanya top up bila perlu. Plan Pro unlock platform, tools dan rate generate. Kos generation perlu dipaparkan sebelum anda generate."],
      ["Boleh cancel bila-bila?", "Boleh. Anda boleh cancel bila-bila melalui akaun anda atau hubungi support."],
      ["Boleh bayar guna FPX?", "Boleh. Pokaya AI menyokong FPX online banking dan kaedah pembayaran Malaysia yang tersedia."]
    ],
    zh: [
      ["Pokaya AI 是什么？", "Pokaya AI 是一个给 TikTok Affiliate 和短视频带货创作者使用的 AI 内容工具。您可以用它更快生成产品素材、短视频内容、口播文案和推广内容。"],
      ["Pokaya AI 保证赚钱吗？", "不保证。Pokaya AI 是内容工具，帮助您更快生成素材、文案和内容方向，实际结果取决于选品、发布、测试和执行。"],
      ["我完全不会做 TikTok Affiliate，可以用吗？", "可以。Pokaya AI 适合想用 AI 开始做 TikTok Affiliate 内容的人。您不需要一开始就会拍摄、剪辑或写脚本，可以先用 AI 辅助生成内容素材和文案。"],
      ["Pokaya AI 是课程吗？", "Pokaya AI 主要是 AI 内容工具平台，不是传统课程。它更适合想直接用 AI 生成内容、做产品推广和开始 TikTok Affiliate 内容的人。"],
      ["RM79.80/月包含什么？", "RM79.80/月可以开通 Pokaya AI Pro，使用平台里的 AI 内容工具，例如产品图片生成、短视频素材生成、Audio 配音工作台、口播文案、内容 idea、Prompt Library、Storytelling、Clone Video 和 VIP 交流群。"],
      ["我需要会剪辑吗？", "不需要一开始就会复杂剪辑。Pokaya AI 的重点是帮您更快生成内容素材和文案，让您降低开始做 TikTok Affiliate 内容的门槛。"],
      ["Pokaya AI 只适合 TikTok Affiliate 吗？", "现阶段 Pokaya AI 会重点帮助 TikTok Affiliate 用户做内容。如果您是小卖家、内容创作者，或者想用 AI 做产品推广，也可以用 Pokaya AI 生成内容素材和推广文案。"],
      ["为什么不用自己找 AI 工具？", "很多人不是没有 AI 工具，而是不知道该用哪个、怎么用、怎么把它变成可以发布的内容。Pokaya AI 把常用内容生成能力放在一个平台里，让您不用自己到处研究和切换工具。"],
      ["还需要 top up credit 吗？", "如果 generation 使用 credit，您只在需要时 top up。Pro 计划解锁平台、工具和生成 rate。生成前会清楚显示成本。"],
      ["可以随时取消吗？", "可以。您可以在账号里取消，或联系 support。"],
      ["可以用 FPX 付款吗？", "可以。Pokaya AI 支持 FPX online banking 和可用的马来西亚付款方式。"]
    ],
    en: [
      ["Does Pokaya AI guarantee income?", "No. Pokaya AI does not promise income. It helps you create content, ideas, visuals, videos, and plans faster so you can test more opportunities."],
      ["Can beginners use it?", "Yes. Pokaya AI is built for users who want to start using AI without learning many tools or complicated prompts first."],
      ["Is Pokaya AI only for TikTok Affiliate?", "No. Pokaya AI is an AI toolkit for content, sales, and online income. TikTok Affiliate is the first pack we optimized deeply."],
      ["How is Pokaya AI different from ChatGPT?", "ChatGPT is a general chatbot. Pokaya AI packages prompts, images, videos, and content plans into tools that are more directly usable for content and promotion."],
      ["What do I get in Pro?", "You get Image AI, Video AI, Audio, Prompt Library, Storytelling, Clone Video, TikTok Affiliate Pack, and VIP group access."],
      ["Do I need to top up credits?", "If generation uses credits, top up only when needed. Pro unlocks the platform, tools, and generation rates. Costs should be shown before generation."],
      ["Can I cancel anytime?", "Yes. You can cancel in your account or contact support."],
      ["Can I pay with FPX?", "Yes. Pokaya AI supports FPX online banking and available Malaysia payment methods."]
    ]
  };
  return (data[state.lang] || data.ms).map(([q, a]) => ({ q, a }));
}

function quote(text, name, role) {
  return `<article><p>"${text}"</p><b>${name}</b><span>${role}</span></article>`;
}

function demoCard(category, hook, type, cost, kind) {
  const ic = kind === "image" ? "image" : "play";
  return `<article>
    <span>${category}</span>
    <h3>${hook}</h3>
    <p>${type}</p>
    <div class="demo-screen">
      ${icon(ic, 34)}
      <small>${cost}</small>
    </div>
  </article>`;
}

function login() {
  const payment = state.paymentReturn;
  const emailValue = payment?.buyer?.email || "";
  const paymentNotice = payment ? `
    <div class="payment-return ${payment.status === "paid" ? "paid" : "pending"}">
      <b>${payment.status === "paid" ? t("paymentConfirmedShort") : tf("paymentStatusLabel", { status: esc(payment.status) })}</b>
      <p>${payment.status === "paid"
        ? t("paymentActiveCopy")
        : t("paymentPendingCopy")}</p>
      <div>
        <button class="dark-button mini-button" data-action="refresh-payment-status" data-order="${esc(payment.orderId)}">${icon("refresh-cw", 15)} ${t("refreshStatus")}</button>
        ${payment.checkoutUrl ? `<a class="gold-button mini-button" href="${esc(payment.checkoutUrl)}">${icon("credit-card", 15)} ${t("continueCheckout")}</a>` : ""}
      </div>
    </div>` : "";
  return `
    <main class="login-shell">
      <div class="login-brand">${brand()}</div>
      <section class="login-card">
        <div class="login-copy">
          <h1>${t("loginTitle")}</h1>
          <p>${t("loginCopy")}</p>
        </div>
        ${paymentNotice}
        <button class="google-login-button" data-action="google-login" type="button">
          <span class="google-mark" aria-hidden="true">G</span>
          <span>${t("continueWithGoogle")}</span>
        </button>
        <div class="login-divider"><span>${t("loginDivider")}</span></div>
        <form data-form="login" class="login-form">
          <label>${t("email")}<input name="email" type="email" autocomplete="email" value="${esc(emailValue)}" required></label>
          <label>${t("password")}<input name="password" type="password" autocomplete="current-password" required></label>
          <button class="gold-button" type="submit">${icon("log-in")} ${t("signIn")}</button>
        </form>
        <div class="login-links">
          <button class="text-button" data-action="forgot">${t("forgot")}</button>
          <span aria-hidden="true"></span>
          <button class="text-button login-register-link" data-action="register"><small>${t("noAccountLead")}</small> <b>${t("noAccountAction")}</b></button>
        </div>
      </section>
      ${modal()}
    </main>`;
}

function studio() {
  if (!state.db) return studioBootFallback();
  const collapsed = state.sidebarCollapsed;
  const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return `
    <div class="studio-shell ${collapsed ? "sidebar-collapsed" : ""}">
      <aside class="sidebar">
        <div class="sidebar-topbar">
          ${brand()}
          <button class="sidebar-collapse-toggle" data-action="toggle-sidebar" type="button" aria-label="${esc(collapseLabel)}" aria-expanded="${collapsed ? "false" : "true"}">
            ${icon(collapsed ? "panel-left-open" : "panel-left-close", 18)}
          </button>
        </div>
        <div class="sidebar-language">${languageSwitch()}</div>
        <button class="agent-primary-card ${state.page === "agent" ? "active" : ""}" data-page="agent" aria-label="${esc(t("pokayaAgent"))}">
          <span class="agent-primary-icon">${icon("bot", 21)}</span>
          <span class="agent-primary-copy"><b>${t("pokayaAgent")}</b><small>Your AI operator</small></span>
          <span class="agent-primary-status"><i></i>READY</span>
        </button>
        <div class="sidebar-scroll-area">
          <button class="side-primary ${state.page === "dashboard" ? "active" : ""}" data-page="dashboard" aria-label="${esc(t("dashboard"))}">${icon("layout-dashboard", 22)} <span>${t("dashboard")}</span></button>
          <button class="side-primary studio-nav-button ${state.page === "project" ? "active" : ""}" data-page="project" aria-label="${esc(t("projects"))}">${studioMark()} <span>${t("projects")}</span></button>
          ${isOwnerAdminAccount() ? `<button class="side-link ${state.page === "admin" ? "active" : ""}" data-page="admin" aria-label="Admin CRM">${icon("shield-check")} <span>Admin CRM</span></button>` : ""}
          <button class="side-link ${state.page === "library" ? "active" : ""}" data-page="library" aria-label="${esc(t("contentLibrary"))}">${icon("folder")} <span>${t("contentLibrary")}</span></button>
        <div class="side-section account">${icon("wallet-cards", 18)} ${t("business")}</div>
        ${[
          ["affiliate", "users", "affiliate"]
          ].map(([id, ic, key]) => `<button class="side-link ${state.page === id ? "active" : ""}" data-page="${id}" aria-label="${esc(t(key))}">${icon(ic)} <span>${t(key)}</span></button>`).join("")}
          <button class="side-link ${state.page === "sop" ? "active" : ""}" data-sop-target="dashboard" aria-label="SOP">${icon("book-open")} <span>SOP</span></button>
          <button class="side-link ${state.page === "autopost" ? "active" : ""}" data-page="autopost" aria-label="${esc(t("autopost"))}">${icon("send")} <span>${t("autopost")}</span></button>
          ${sidebarAccountPanel()}
        </div>
      </aside>
      <main class="workspace ${state.page === "library" ? "workspace-library" : ""}">${page()}</main>
      <div id="modal-root">${modal()}</div>
    </div>`;
}

function studioBootFallback() {
  const hasError = Boolean(state.studioBootError);
  const message = hasError
    ? state.studioBootError
    : state.lang === "zh"
      ? "正在打开 Studio..."
      : state.lang === "ms"
        ? "Sedang membuka Studio..."
        : "Opening Studio...";
  return `
    <main class="loading studio-boot-fallback">
      ${icon(hasError ? "circle-alert" : "loader-circle", 28)}
      <strong>${hasError ? "Studio loading failed" : "Loading Studio"}</strong>
      <span>${esc(message)}</span>
      ${hasError ? `<button class="dark-button mini-button" data-action="reload-page" type="button">${icon("refresh-cw", 16)} Refresh</button>` : ""}
    </main>`;
}

function brand(label = "") {
  const labelMarkup = label ? `<strong class="brand-context">${label}</strong>` : "";
  return `<div class="brand-lockup"><span class="brand-core" aria-label="Pokaya AI"><img class="brand-logo-mascot" src="${brandAssets.mascotUi}" width="192" height="192" alt="" aria-hidden="true" loading="eager" decoding="sync" fetchpriority="high"><span class="brand-wordmark"><span>Pokaya</span><span>AI</span></span></span>${labelMarkup}</div>`;
}

function footerBrand(label = "Pokaya AI") {
  const labelMarkup = label && label !== "Pokaya AI" ? `<b>${label}</b>` : "";
  return `
    <footer class="public-footer">
      <div class="footer-left">
        <span class="footer-brand"><span class="brand-core footer-brand-core" aria-label="Pokaya AI"><img class="brand-logo-mascot" src="${brandAssets.mascotUi}" width="192" height="192" alt="" aria-hidden="true" loading="lazy" decoding="async"><span class="brand-wordmark"><span>Pokaya</span><span>AI</span></span></span>${labelMarkup}</span>
        <span class="footer-year">© 2026</span>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="mailto:hello@pokaya.ai">hello@pokaya.ai</a>
      </nav>
    </footer>`;
}

function currentAccountUser() {
  return state.db?.currentUser || state.user || {};
}

function subscriptionStatus() {
  const billing = state.db?.billing || {};
  const nextBill = billing.nextBill || "";
  const expiresAt = nextBill ? new Date(`${nextBill}T23:59:59`) : null;
  const msLeft = expiresAt ? expiresAt.getTime() - Date.now() : 0;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil(msLeft / 86400000)) : 0;
  const expired = Boolean(expiresAt && msLeft < 0);
  return {
    plan: billing.plan || "Pokaya AI Pro",
    nextBill,
    daysLeft,
    expired,
    label: expired ? t("expired") : tf("daysLeft", { count: daysLeft }),
    expiryText: nextBill ? tf("expiresOn", { date: formatReadableDate(nextBill) }) : t("noExpiryDate")
  };
}

function formatReadableDate(value) {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).toLocaleDateString(state.lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function accountInitials(name = "") {
  const text = String(name || currentAccountUser().email || "D").trim();
  const parts = text.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : text.slice(0, 1)).toUpperCase();
}

function sidebarAccountPanel() {
  const user = currentAccountUser();
  const billing = state.db?.billing || {};
  const subscription = subscriptionStatus();
  return `
    <section class="sidebar-account-panel">
      <article class="sidebar-credit-card">
        <span>${icon("wallet-cards", 18)} ${t("creditBalance")}</span>
        <b>${formatCreditBalance(billing.credits || 0)}</b>
        <button type="button" data-action="open-settings" data-settings-open="topup">${icon("plus", 18)} ${t("topUpShort")}</button>
      </article>
      <article class="sidebar-subscription-card ${subscription.expired ? "expired" : ""}">
        <strong><i></i>${subscription.expired ? t("expired") : t("pro")} <em>·</em> ${subscription.label}</strong>
        <span>${subscription.expiryText}</span>
      </article>
      <div class="sidebar-user-card">
        <span class="sidebar-avatar">${accountInitials(user.name)}</span>
        <div><b>${esc(user.name || "Pokaya User")}</b><small>${esc(user.email || "")}</small></div>
      </div>
      <div class="sidebar-account-actions">
        <button type="button" class="${state.modal === "settings" ? "active" : ""}" data-action="open-settings">${icon("settings", 18)} ${t("settings")}</button>
        <button type="button" data-action="logout">${icon("log-out", 18)} ${t("logout")}</button>
      </div>
    </section>`;
}

function projectButtons() {
  return state.db.projects
    .map((item) => {
      const active = item.id === state.projectId && state.page === "project";
      const menuOpen = state.projectMenuId === item.id;
      return `
        <div class="project-menu-item ${active ? "active" : ""} ${menuOpen ? "menu-open" : ""}">
          <button class="project-button ${active ? "active" : ""}" data-project="${item.id}">
            <span class="project-icon">${icon("folder", 22)}</span>
            <span>${esc(item.name)}</span>
          </button>
          <button class="project-more" type="button" data-project-menu="${item.id}" aria-label="${t("projectActions")}" title="${t("projectActions")}">${icon("ellipsis", 18)}</button>
          ${menuOpen ? `
            <div class="project-action-menu">
              <button type="button" data-project-rename="${item.id}">${icon("pencil", 19)} ${t("renameProject")}</button>
              <button type="button" class="danger" data-project-delete="${item.id}">${icon("trash-2", 19)} ${t("deleteProject")}</button>
            </div>` : ""}
        </div>`;
    })
    .join("") || `<p class="empty-text">${t("noProjectsFound")}</p>`;
}

function page() {
  if (state.page === "admin") return adminPage();
  if (state.page === "wizard") return firstGenerationWizardPage();
  if (state.page === "agent") return agentPage();
  if (state.page === "dashboard") return dashboardOverview();
  if (state.page === "project") return projectPage();
  if (state.page === "library") return contentLibraryPage();
  if (state.page === "sop") return sopPage();
  if (state.page !== "dashboard") return accountPage();
}

function selectedDateRange() {
  const from = new Date(`${state.dateFrom}T00:00:00`);
  const to = new Date(`${state.dateTo}T23:59:59`);
  return { from, to };
}

function allResults() {
  return state.db.projects.flatMap((item) => item.results.map((result) => ({ ...result, projectId: item.id, projectName: item.name })));
}

function wizardCopy() {
  const content = {
    ms: {
      eyebrow: "Beginner setup",
      title: "Nak guna AI untuk buat duit? Mula dari satu fungsi dulu.",
      subtitle: "Pilih apa yang anda mahu cuba. Pokaya akan bawa anda ke langkah paling mudah, bukan terus bagi semua tab yang complicated.",
      stepLabels: ["Explore", "Choose", "Details", "Start"],
      featureTitle: "Apa yang AI boleh bantu anda buat?",
      chooseTitle: "Nak cuba yang mana dulu?",
      detailsTitle: "Beritahu sedikit tentang produk anda",
      reviewTitle: "Ready untuk mula",
      productLabel: "Product name",
      productPlaceholder: "contoh: serum, lunchbox, wireless mic",
      linkLabel: "Product link",
      linkPlaceholder: "optional: TikTok Shop / Shopee link",
      languageLabel: "Language",
      styleLabel: "Style",
      back: "Back",
      continue: "Continue",
      start: "Start now",
      skip: "Skip setup",
      selected: "Selected tool",
      prompt: "Prompt preview",
      credits: "Estimated credits",
      featureDescriptions: {
        "product-image": ["Generate product images, ad visuals, and poster-style content.", "Good if you do not have a designer."],
        "visual-card": ["Turn product text or a link into a publish-ready cover, carousel, or selling card.", "Good if you need TikTok covers or social cards fast."],
        "short-video": ["Create TikTok-style short video ideas or prompts.", "Good if you want video selling content but do not know what to shoot."],
        "ugc-script": ["Write hook, talking script, caption, and hashtags.", "Good if you want to record yourself or brief a creator."],
        "content-plan": ["Plan what to post for the next 7 days.", "Good if you do not know what to post every day."],
        "clone-style": ["Turn a viral structure into your own product version.", "Good if you saw something viral but cannot break it down."],
        "ask-agent": ["Let Pokaya Agent recommend the easiest starting point.", "Good if you are totally new."]
      }
    },
    zh: {
      eyebrow: "新手开始",
      title: "想用 AI 赚钱？先从一个功能开始。",
      subtitle: "你不用先研究完整 Studio。先看懂 Pokaya 可以帮你做什么，再选一个最想尝试的功能。",
      stepLabels: ["看功能", "选起点", "填资料", "开始"],
      featureTitle: "AI 可以先帮你做什么？",
      chooseTitle: "你想先试哪个？",
      detailsTitle: "简单告诉 Pokaya 你卖什么",
      reviewTitle: "准备开始",
      productLabel: "产品名",
      productPlaceholder: "例如：serum、lunchbox、wireless mic",
      linkLabel: "产品链接",
      linkPlaceholder: "可选：TikTok Shop / Shopee 链接",
      languageLabel: "语言",
      styleLabel: "风格",
      back: "返回",
      continue: "继续",
      start: "开始使用",
      skip: "跳过引导",
      selected: "选择的功能",
      prompt: "Prompt 预览",
      credits: "预计 credits",
      featureDescriptions: {
        "product-image": ["生成产品图、广告图、海报图。", "适合没有设计师、想快速做商品视觉的新手。"],
        "visual-card": ["把产品文案或链接变成可发布的封面、图文卡、卖点卡。", "适合想快速做 TikTok 封面、小红书图文素材的新手。"],
        "short-video": ["生成 TikTok 商品短视频想法或视频 prompt。", "适合想做短视频带货但不知道怎么拍的新手。"],
        "ugc-script": ["帮你写开头、口播、caption、hashtags。", "适合想自己拍，或给 creator brief 的新手。"],
        "content-plan": ["帮你安排未来 7 天每天发什么。", "适合不知道每天发什么的新手。"],
        "clone-style": ["把别人的爆款结构变成你的产品版本。", "适合看到别人爆了，但不会拆解的新手。"],
        "ask-agent": ["让 Pokaya Agent 帮你判断最容易的起点。", "适合完全新手，还没想清楚产品或方向的人。"]
      }
    },
    en: {
      eyebrow: "Beginner setup",
      title: "Want to make money with AI? Start with one simple tool.",
      subtitle: "You do not need to learn the full Studio first. See what Pokaya can do, then pick the first tool you want to try.",
      stepLabels: ["Explore", "Choose", "Details", "Start"],
      featureTitle: "What can AI help you create first?",
      chooseTitle: "What do you want to try first?",
      detailsTitle: "Tell Pokaya a little bit about what you sell",
      reviewTitle: "Ready to start",
      productLabel: "Product name",
      productPlaceholder: "e.g. serum, lunchbox, wireless mic",
      linkLabel: "Product link",
      linkPlaceholder: "optional: TikTok Shop / Shopee link",
      languageLabel: "Language",
      styleLabel: "Style",
      back: "Back",
      continue: "Continue",
      start: "Start now",
      skip: "Skip setup",
      selected: "Selected tool",
      prompt: "Prompt preview",
      credits: "Estimated credits",
      featureDescriptions: {
        "product-image": ["Generate product images, ad visuals, and poster-style content.", "Good if you do not have a designer."],
        "visual-card": ["Turn product text or a link into a publish-ready cover, carousel, or selling card.", "Good if you need TikTok covers or social cards fast."],
        "short-video": ["Create TikTok-style short video ideas or prompts.", "Good if you want video selling content but do not know what to shoot."],
        "ugc-script": ["Write hook, talking script, caption, and hashtags.", "Good if you want to record yourself or brief a creator."],
        "content-plan": ["Plan what to post for the next 7 days.", "Good if you do not know what to post every day."],
        "clone-style": ["Turn a viral structure into your own product version.", "Good if you saw something viral but cannot break it down."],
        "ask-agent": ["Let Pokaya Agent recommend the easiest starting point.", "Good if you are totally new."]
      }
    }
  };
  return content[state.lang] || content.en;
}

function wizardFeatureLabel(id = state.wizardFeature) {
  return wizardFeatures.find((item) => item[0] === id)?.[2] || "Ask Pokaya Agent";
}

function wizardEstimatedCredits(id = state.wizardFeature) {
  if (id === "product-image") return "0.10";
  if (id === "ask-agent") return "0";
  return "0.10";
}

function wizardPrompt() {
  const product = state.wizardProductName || "[your product]";
  const language = state.wizardLanguage || "Bahasa Melayu";
  const style = state.wizardStyle || "Soft sell";
  const prompts = {
    "product-image": `Create a clean product image for ${product}. Make it suitable for TikTok Shop, ads, or social media. Style: ${style}. Language: ${language} if text is needed. Make the product look clear, trustworthy, and easy to sell.`,
    "visual-card": `Create a publish-ready visual card for ${product}. Use Pokaya brand colors: soft pink, deep purple, coral accent, clean white surface. Language: ${language}. Style: ${style}. Output a TikTok cover or Xiaohongshu-style selling card with hook, proof, CTA, caption, and hashtags. Keep it beginner-friendly and easy to post.`,
    "short-video": `Create a TikTok-style short video idea for ${product}. Style: ${style}. Language: ${language}. Show what to say, what to show, and how to make the product interesting. Keep it simple for a beginner to understand or execute.`,
    "ugc-script": `Write a short UGC-style script for ${product}. Language: ${language}. Style: ${style}. Include hook, short script, caption, and hashtags. Make it beginner-friendly and easy to record.`,
    "content-plan": `Create a 7-day simple content plan for ${product}. Language: ${language}. Style: ${style}. Each day should include what to post, hook idea, content angle, and caption idea. Keep the plan simple enough for a beginner to follow.`,
    "clone-style": `Analyze a viral content style and turn it into a version for ${product}. Language: ${language}. Keep the structure, rewrite it safely and originally, and make the final output easy for a beginner to use.`,
    "ask-agent": `I am new and want to use AI to make money. My product is ${product}. Please recommend the easiest Pokaya feature for me to start with.`
  };
  return prompts[state.wizardFeature] || prompts["ask-agent"];
}

function firstGenerationWizardPage() {
  const c = wizardCopy();
  return `<section class="first-wizard-shell">
    <header class="first-wizard-hero">
      <div>
        <p class="folder-label">${icon("sparkles", 18)} ${c.eyebrow}</p>
        <h1>${c.title}</h1>
        <p>${c.subtitle}</p>
      </div>
      <button class="dark-button mini-button" data-action="skip-wizard">${icon("arrow-right", 16)} ${c.skip}</button>
    </header>
    <nav class="wizard-stepper" aria-label="Wizard steps">
      ${c.stepLabels.map((label, index) => `<button type="button" class="${state.wizardStep === index + 1 ? "active" : state.wizardStep > index + 1 ? "done" : ""}" data-wizard-jump="${index + 1}"><b>${index + 1}</b><span>${label}</span></button>`).join("")}
    </nav>
    ${state.wizardStep === 1 ? wizardFeatureIntro(c) : state.wizardStep === 2 ? wizardChooseTool(c) : state.wizardStep === 3 ? wizardDetails(c) : wizardReview(c)}
  </section>`;
}

function wizardFeatureIntro(c) {
  return `<section class="wizard-panel">
    <div class="wizard-panel-head">
      <h2>${c.featureTitle}</h2>
      <p>${state.lang === "zh" ? "先看懂每个功能可以帮你做什么，不需要懂模型或 prompt。" : "Start by understanding what each feature can do. No model knowledge needed."}</p>
    </div>
    <div class="wizard-feature-grid">
      ${wizardFeatures.map(([id, ic, label]) => wizardFeatureCard(id, ic, label, c, true)).join("")}
    </div>
  </section>`;
}

function wizardChooseTool(c) {
  return `<section class="wizard-panel">
    <div class="wizard-panel-head">
      <h2>${c.chooseTitle}</h2>
      <p>${state.lang === "zh" ? "完全不知道就选 Agent，它会帮你判断最容易的起点。" : "Not sure? Choose Agent and let it recommend the easiest starting point."}</p>
    </div>
    <div class="wizard-choice-list">
      ${wizardFeatures.map(([id, ic, label]) => wizardFeatureCard(id, ic, label, c, false)).join("")}
    </div>
    <div class="wizard-actions">
      <button class="dark-button" data-action="wizard-back">${icon("arrow-left", 17)} ${c.back}</button>
      <button class="gold-button" data-action="wizard-next" ${state.wizardFeature ? "" : "disabled"}>${c.continue} ${icon("arrow-right", 17)}</button>
    </div>
  </section>`;
}

function wizardFeatureCard(id, ic, label, c, autoAdvance = false) {
  const [body, helper] = c.featureDescriptions[id] || ["", ""];
  const active = state.wizardFeature === id;
  return `<button type="button" class="wizard-feature-card ${active ? "active" : ""}" data-wizard-feature="${id}" data-wizard-auto="${autoAdvance ? "true" : "false"}">
    <span>${icon(ic, 24)}</span>
    <strong>${label}</strong>
    <p>${body}</p>
    <small>${helper}</small>
  </button>`;
}

function wizardDetails(c) {
  return `<section class="wizard-panel wizard-detail-panel">
    <div class="wizard-panel-head">
      <h2>${c.detailsTitle}</h2>
      <p>${state.lang === "zh" ? "产品名和链接都可以之后再补。先开始，比填完美资料更重要。" : "Product details can be added later. Starting is more important than perfect setup."}</p>
    </div>
    <form class="wizard-form" data-form="wizard-details">
      <label>${c.productLabel}<input name="productName" data-wizard-field="wizardProductName" value="${esc(state.wizardProductName)}" placeholder="${esc(c.productPlaceholder)}"></label>
      <label>${c.linkLabel}<input name="productLink" data-wizard-field="wizardProductLink" value="${esc(state.wizardProductLink)}" placeholder="${esc(c.linkPlaceholder)}"></label>
      <div class="form-grid two">
        <label>${c.languageLabel}<select name="language" data-wizard-field="wizardLanguage">${["Bahasa Melayu", "English", "中文"].map((item) => `<option ${state.wizardLanguage === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label>${c.styleLabel}<select name="style" data-wizard-field="wizardStyle">${["Soft sell", "Review", "Problem-solution", "Offer push"].map((item) => `<option ${state.wizardStyle === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
      </div>
      <div class="wizard-actions">
        <button type="button" class="dark-button" data-action="wizard-back">${icon("arrow-left", 17)} ${c.back}</button>
        <button class="gold-button" type="submit">${c.continue} ${icon("arrow-right", 17)}</button>
      </div>
    </form>
  </section>`;
}

function wizardReview(c) {
  const promptText = wizardPrompt();
  return `<section class="wizard-panel wizard-review-panel">
    <div class="wizard-review-copy">
      <h2>${c.reviewTitle}</h2>
      <p>${state.lang === "zh" ? "确认后 Pokaya 会创建项目、预填 prompt，并帮你进入第一个工具。" : "Pokaya will create a project, prepare the prompt, and take you to the first tool."}</p>
      <div class="wizard-review-list">
        <p><span>${c.selected}</span><b>${wizardFeatureLabel()}</b></p>
        <p><span>${c.productLabel}</span><b>${esc(state.wizardProductName || "Not sure yet")}</b></p>
        <p><span>${c.languageLabel}</span><b>${esc(state.wizardLanguage)}</b></p>
        <p><span>${c.credits}</span><b>${wizardEstimatedCredits()} credits</b></p>
      </div>
      <div class="wizard-actions">
        <button type="button" class="dark-button" data-action="wizard-back">${icon("arrow-left", 17)} ${c.back}</button>
        <button type="button" class="gold-button" data-action="start-wizard" ${state.wizardBusy ? "disabled" : ""}>${icon(state.wizardBusy ? "loader-circle" : "sparkles", 18)} ${state.wizardBusy ? t("generating") : c.start}</button>
      </div>
    </div>
    <aside class="wizard-prompt-preview">
      <span>${icon("file-text", 18)} ${c.prompt}</span>
      <p>${esc(promptText)}</p>
    </aside>
  </section>`;
}

function inDateRange(item) {
  if (!item.createdAt) return true;
  const { from, to } = selectedDateRange();
  const date = new Date(item.createdAt);
  return date >= from && date <= to;
}

function dashboardStats() {
  const results = allResults().filter(inDateRange);
  const usage = state.db.usage.filter(inDateRange);
  const typeCount = (type) => results.filter((item) => item.type === type).length;
  const usedCredits = usage.reduce((sum, item) => sum + Number(item.credits || 0), 0);
  const readyPosts = state.db.schedule.filter((item) => item.status === "Ready").length;
  return {
    results,
    usage,
    usedCredits,
    cards: [
      [t("statImage"), typeCount("image"), "image"],
      [t("statUgc"), typeCount("ugc"), "video"],
      [t("statAuto"), typeCount("auto"), "bot"],
      [t("statOriginal"), typeCount("original"), "film"],
      [t("statClone"), typeCount("clone") + typeCount("viral"), "layers-3"],
      [t("statReady"), readyPosts, "send"],
      [t("statCredits"), usedCredits, "wallet-cards"]
    ]
  };
}

function dashboardOverview() {
  const stats = dashboardStats();
  return `
    <header class="project-head dashboard-head">
      <div>
        <p class="folder-label">${icon("layout-dashboard", 18)} ${t("dashboardKicker")}</p>
        <h1>${t("dashboard")}</h1>
        <p class="subtitle">${t("dashboardSubtitle")}</p>
      </div>
      <div class="head-actions">
        <button class="dark-button" data-action="open-settings" data-settings-open="topup">${icon("plus")} ${t("topup")}</button>
        <button class="sop-button" data-sop-target="dashboard">${icon("book-open", 24)} ${t("sopDashboard")}</button>
      </div>
    </header>
    <section class="dashboard-stat-grid">
      ${stats.cards.map(([label, value, ic]) => `<article><div><span>${label}</span><b>${value}</b></div>${icon(ic, 24)}</article>`).join("")}
    </section>
    <section class="date-filter-card">
      <h2>${icon("calendar-days", 22)} ${t("filterDateRange")}</h2>
      <label>${t("fromDate")}<input type="date" data-date-field="dateFrom" value="${state.dateFrom}"></label>
      <label>${t("toDate")}<input type="date" data-date-field="dateTo" value="${state.dateTo}"></label>
      <button class="gold-button" data-action="apply-date">${t("apply")}</button>
      <button class="dark-button" data-action="reset-date">${t("reset")}</button>
    </section>
    <section class="dashboard-main-grid">
      <article class="chart-card">
        <div class="card-title"><h2>${icon("trending-up", 22)} ${t("dailyProduction")}</h2><span>${tf("totalInRange", { count: stats.results.length })}</span></div>
        ${productionChart(stats.results)}
      </article>
    </section>`;
}

function productionChart(results) {
  const days = [];
  const { from, to } = selectedDateRange();
  const cursor = new Date(from);
  while (cursor <= to && days.length < 31) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const counts = days.map((day) => {
    const key = localDateKey(day);
    return {
      key,
      label: key.slice(5),
      image: results.filter((item) => item.type === "image" && item.createdAt?.startsWith(key)).length,
      ugc: results.filter((item) => item.type === "ugc" && item.createdAt?.startsWith(key)).length,
      auto: results.filter((item) => item.type === "auto" && item.createdAt?.startsWith(key)).length,
      video: results.filter((item) => ["original", "clone", "viral", "story"].includes(item.type) && item.createdAt?.startsWith(key)).length
    };
  });
  const max = Math.max(1, ...counts.map((item) => item.image + item.ugc + item.auto + item.video));
  return `
    <div class="legend-row"><span><i></i> ${t("statImage")}</span><span><i></i> ${t("statUgc")}</span><span><i></i> ${t("statAuto")}</span><span><i></i> ${t("chartVideoResearch")}</span></div>
    <div class="bar-chart">
      ${counts.map((item) => {
        const total = item.image + item.ugc + item.auto + item.video;
        return `<div class="bar-day" title="${item.key}: ${total}"><div class="bar-stack" style="height:${Math.max(4, (total / max) * 100)}%"><i style="height:${(item.image / Math.max(1, total)) * 100}%"></i><i style="height:${(item.ugc / Math.max(1, total)) * 100}%"></i><i style="height:${(item.auto / Math.max(1, total)) * 100}%"></i><i style="height:${(item.video / Math.max(1, total)) * 100}%"></i></div><small>${item.label}</small></div>`;
      }).join("")}
    </div>`;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextActionTitle() {
  const ready = state.db.schedule.filter((item) => item.status === "Ready").length;
  if (ready > 0) return `${ready} posts are ready to publish.`;
  return "Generate a batch before your next posting window.";
}

function nextActionCopy(stats) {
  const ready = state.db.schedule.filter((item) => item.status === "Ready").length;
  if (ready > 0) return "You have content in the queue. Schedule the best pieces for tonight's TikTok peak hours before generating more.";
  if (stats.results.length === 0) return "No content has been generated in this date range. Start with Video or Audio to build a publishing batch.";
  return "Your content exists, but nothing is marked ready. Move generated outputs into the Scheduler so the workspace becomes operational.";
}

function costBreakdown(stats) {
  const rows = [
    ["Image Credits", stats.usage.filter((item) => item.action.toLowerCase().includes("image")).reduce((sum, item) => sum + item.credits, 0)],
    ["Video / UGC Credits", stats.usage.filter((item) => /ugc|video|original/i.test(item.action)).reduce((sum, item) => sum + item.credits, 0)],
    ["Prompt / Research Credits", stats.usage.filter((item) => /viral|clone|story|auto/i.test(item.action)).reduce((sum, item) => sum + item.credits, 0)],
    ["Storage / Export Credits", 0],
    ["Total Credits", stats.usedCredits]
  ];
  return `<div class="cost-list">${rows.map(([label, credits]) => `<div><span>${label}</span><b>${credits} credits</b><small>Internal provider prices are not shown to users.</small></div>`).join("")}</div>`;
}

function recentActivity(usage) {
  const rows = usage.slice(0, 6);
  if (!rows.length) return `<p class="empty-text">No activity in this range.</p>`;
  return `<div class="activity-list">${rows.map((item) => `<div><span>${item.action}</span><b>${item.credits} credits</b><small>${new Date(item.createdAt).toLocaleString()}</small></div>`).join("")}</div>`;
}

function usageCategoryFromText(text = "") {
  const value = String(text).toLowerCase();
  if (/top up|activated|admin_credit|credit/.test(value)) return "credit";
  if (/image|photo|poster|visual/.test(value)) return "image";
  if (/ugc|video|cinema|original|film/.test(value)) return "video";
  if (/auto|batch|plan|schedule/.test(value)) return "auto";
  if (/clone|viral|decode|scrape|story/.test(value)) return "clone";
  if (/post|publish|tiktok/.test(value)) return "post";
  return "other";
}

function usageCategoryLabel(category) {
  return {
    image: "Image",
    video: "Video",
    auto: "Auto",
    clone: "Clone",
    post: "Post",
    credit: "Credit",
    other: "Other"
  }[category] || "Other";
}

function usageCategoryIcon(category) {
  return {
    image: "image",
    video: "video",
    auto: "wand-sparkles",
    clone: "layers-3",
    post: "send",
    credit: "wallet-cards",
    other: "activity"
  }[category] || "activity";
}

function usageRowsFromLedger() {
  const ledger = state.db.creditLedger || [];
  if (ledger.length) {
    const currentBalance = Number(state.db.billing?.credits || 0);
    let newerDelta = 0;
    return ledger
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((entry) => {
        const credits = Number(entry.credits || 0);
        const note = entry.note || entry.type || "Credit activity";
        const category = usageCategoryFromText(`${entry.type || ""} ${note}`);
        const balanceAfter = currentBalance - newerDelta;
        newerDelta += credits;
        return {
          id: entry.id,
          action: note,
          detail: entry.meta?.resultId ? `Result ${entry.meta.resultId.slice(0, 8)}` : entry.meta?.orderId || entry.type || "",
          credits,
          category,
          createdAt: entry.createdAt,
          balanceAfter
        };
      });
  }

  let balance = Number(state.db.billing?.credits || 0);
  return (state.db.usage || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((item) => {
      const credits = -Math.abs(Number(item.credits || 0));
      const row = {
        id: item.id,
        action: item.action || "Usage activity",
        detail: item.action || "",
        credits,
        category: usageCategoryFromText(item.action),
        createdAt: item.createdAt,
        balanceAfter: balance
      };
      balance -= credits;
      return row;
    });
}

function usagePage() {
  const rows = usageRowsFromLedger();
  const generatedResults = allResults();
  const currentBalance = Number(state.db.billing?.credits || 0);
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const monthKey = now.toISOString().slice(0, 7);
  const spendRows = rows.filter((item) => item.credits < 0);
  const totalSpend = spendRows.reduce((sum, item) => sum + Math.abs(item.credits), 0);
  const todaySpend = spendRows
    .filter((item) => item.createdAt && new Date(item.createdAt).toISOString().slice(0, 10) === todayKey)
    .reduce((sum, item) => sum + Math.abs(item.credits), 0);
  const monthSpend = spendRows
    .filter((item) => item.createdAt && new Date(item.createdAt).toISOString().slice(0, 7) === monthKey)
    .reduce((sum, item) => sum + Math.abs(item.credits), 0);
  const lastCharge = spendRows[0];
  const imageCount = generatedResults.filter((item) => item.type === "image").length;
  const videoCount = generatedResults.filter((item) => ["ugc", "original"].includes(item.type)).length;
  const autoCount = generatedResults.filter((item) => item.type === "auto").length;
  const filters = [
    ["all", "activity", "All"],
    ["image", "image", "Image"],
    ["video", "video", "Video"],
    ["auto", "wand-sparkles", "Auto"],
    ["clone", "layers-3", "Clone"],
    ["post", "send", "Post"]
  ];
  const visibleRows = rows.filter((row) => state.usageFilter === "all" || row.category === state.usageFilter);
  const summaryCards = [
    ["Current Balance", formatCreditNumber(currentBalance), "credits available", "balance", "wallet-cards"],
    ["Today Used", formatCreditNumber(todaySpend), "credits spent today", "today", "calendar-clock"],
    ["This Month", formatCreditNumber(monthSpend), "monthly spend", "month", "bar-chart-3"],
    ["Last Charge", lastCharge ? formatCreditNumber(Math.abs(lastCharge.credits)) : "0", lastCharge ? usageCategoryLabel(lastCharge.category) : "no usage yet", "last", lastCharge ? usageCategoryIcon(lastCharge.category) : "activity"]
  ];

  return `
    <section class="usage-experience">
      <div class="usage-summary-grid">
        ${summaryCards.map(([label, value, helper, tone, ic]) => `<article class="usage-summary-card ${tone}"><span>${icon(ic, 17)} ${label}</span><b>${value}</b><small>${helper}</small></article>`).join("")}
      </div>
      <section class="usage-ledger-panel">
        <div class="usage-panel-head">
          <div>
            <h2>${icon("receipt-text", 22)} Usage activity</h2>
            <p>${formatCreditNumber(totalSpend)} credits used · ${imageCount} images · ${videoCount} videos · ${autoCount} auto plans</p>
          </div>
          <small>${icon("calendar-days", 16)} All time</small>
        </div>
        <div class="usage-filter-row" aria-label="Usage filters">
          ${filters.map(([id, ic, label]) => `<button class="${state.usageFilter === id ? "active" : ""}" data-usage-filter="${id}" aria-pressed="${state.usageFilter === id ? "true" : "false"}">${icon(ic, 16)} ${label}</button>`).join("")}
        </div>
        <div class="usage-ledger-table" aria-label="Usage ledger">
          <div class="usage-ledger-head"><span>Activity</span><span>${t("date")}</span><span>${t("usageCredit")}</span><span>${t("usageBalance")}</span></div>
          ${visibleRows.map(usageLedgerRow).join("") || `<p class="empty-text">${t("noUsageRecords")}</p>`}
        </div>
      </section>
    </section>`;
}

function usageLedgerRow(row = {}) {
  const date = row.createdAt ? new Date(row.createdAt) : null;
  const dateText = date ? date.toLocaleDateString(state.lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const timeText = date ? date.toLocaleTimeString(state.lang === "zh" ? "zh-CN" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
  const creditClass = row.credits < 0 ? "debit" : "credit";
  return `<article class="usage-ledger-item">
    <div class="usage-ledger-activity">
      <em class="${row.category}">${icon(usageCategoryIcon(row.category), 16)}</em>
      <div>
        <strong>${esc(row.action)}</strong>
        <p>${esc(row.detail || row.action)}</p>
      </div>
    </div>
    <time><span>${esc(dateText)}</span><small>${esc(timeText)}</small></time>
    <b class="${creditClass}">${row.credits > 0 ? "+" : ""}${formatCreditNumber(row.credits)}</b>
    <span>${formatCreditNumber(row.balanceAfter)}</span>
  </article>`;
}

function generationQueueTable(jobs) {
  const rows = jobs.slice(0, 8);
  return table(rows.map((job) => [
    job.model || job.action,
    `${job.status} | ${job.creditsCharged || 0} credits`,
    job.errorMessage || job.completedAt || job.startedAt || job.createdAt || ""
  ]));
}

function paymentAge(payment) {
  if (!payment.createdAt) return "";
  const minutes = Math.floor((Date.now() - new Date(payment.createdAt).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "";
  if (minutes < 60) return `${minutes}m old`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h old`;
  return `${Math.floor(minutes / 1440)}d old`;
}

function whatsappLink(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function paymentRow(payment, adminActions = false) {
  const buyer = payment.buyer || {};
  const phoneLink = whatsappLink(buyer.phone);
  const kind = payment.kind || "topup";
  const status = `${payment.status} | ${kind} | ${formatPaymentAmount(payment)}`;
  const detail = [
    buyer.fullName || buyer.email || payment.userId || "",
    buyer.phone ? (phoneLink ? `<a href="${phoneLink}" target="_blank" rel="noreferrer">${esc(buyer.phone)}</a>` : esc(buyer.phone)) : "",
    payment.errorMessage ? `Error: ${esc(payment.errorMessage)}` : paymentAge(payment),
    adminActions && payment.status !== "paid" ? `<button class="dark-button mini-button" data-admin-clean-payment="${payment.id}">${icon("trash-2", 15)} Cleanup</button>` : ""
  ].filter(Boolean).join(" · ");
  return [payment.orderId, status, detail || (payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "")];
}

function contentLibraryPage() {
  const all = allResults().slice().sort(assetLibraryNewestFirst);
  const filterOptions = ["all", "image", "video", "text", "visual_card"];
  const activeFilter = filterOptions.includes(state.assetTypeFilter) ? state.assetTypeFilter : "all";
  const activeProject = state.assetProjectFilter || "all";
  const query = String(state.assetSearch || "").trim().toLowerCase();
  const filtered = all.filter((item) => {
    const kind = assetMediaKind(item);
    const projectMatch = activeProject === "all" || item.projectId === activeProject;
    const kindMatch = activeFilter === "all" || activeFilter === kind || activeFilter === item.type;
    const searchText = [
      item.title,
      item.providerTitle,
      item.prompt,
      item.providerBody,
      item.body,
      item.model,
      item.provider,
      item.projectName,
      item.id,
      item.taskId,
      item.providerTaskId
    ].filter(Boolean).join(" ").toLowerCase();
    const searchMatch = !query || searchText.includes(query);
    return projectMatch && kindMatch && searchMatch;
  });
  const counts = assetLibraryCounts(all);
  const groups = assetLibraryDateGroups(filtered);
  let renderedAssetIndex = 0;
  const sections = groups.map((group, index) => {
    const section = assetLibraryDateSection(group, index, renderedAssetIndex);
    renderedAssetIndex += group.entries.length;
    return section;
  }).join("");
  return `<section class="asset-library-experience studio-wall-zoomable" ${studioWallZoomStyleAttr()}>
    <aside class="asset-library-panel" aria-label="Content Library filters">
      <label class="asset-library-search">
        ${icon("search", 18)}
        <input data-asset-search value="${esc(state.assetSearch || "")}" placeholder="Search assets">
      </label>
      <nav class="asset-library-nav">
        ${assetLibraryNavButton("all", "box", "All Assets", counts.all, activeFilter)}
        ${assetLibraryNavButton("image", "image", "Image", counts.image, activeFilter)}
        ${assetLibraryNavButton("video", "video", "Video", counts.video, activeFilter)}
        ${assetLibraryNavButton("text", "file-text", "Text", counts.text, activeFilter)}
        ${assetLibraryNavButton("visual_card", "panels-top-left", "Visual Card", counts.visual_card, activeFilter)}
      </nav>
      <div class="asset-library-section-title"><span>Projects</span><button type="button" data-action="new-project" title="${esc(t("createProject"))}" aria-label="${esc(t("createProject"))}">${icon("plus", 14)}</button></div>
      <nav class="asset-library-projects">
        ${assetLibraryProjectButton("all", "All projects", all.length, activeProject)}
        ${state.db.projects.map((projectItem) => assetLibraryProjectButton(projectItem.id, projectItem.name, all.filter((item) => item.projectId === projectItem.id).length, activeProject)).join("")}
      </nav>
    </aside>
    <section class="asset-library-main">
      <div class="asset-library-filter-strip" aria-label="Asset type filters">
        ${filterOptions.map((kind) => `<button type="button" class="${activeFilter === kind ? "active" : ""}" data-asset-type="${kind}" aria-pressed="${activeFilter === kind ? "true" : "false"}">${icon(assetTypeIcon(kind), 16)} ${assetTypeLabel(kind)}<small>${counts[kind] || 0}</small></button>`).join("")}
      </div>
      ${groups.length ? sections : assetLibraryEmptyState(query)}
    </section>
  </section>`;
}

function assetMediaKind(item = {}) {
  if (item.videoUrl) return "video";
  if (item.visualCard || item.type === "visual_card") return "visual_card";
  if (item.imageUrl) return "image";
  return "text";
}

function assetTypeLabel(kind = "all") {
  const labels = {
    all: t("All"),
    image: t("Image"),
    video: t("Video"),
    text: "Text",
    visual_card: "Visual Card"
  };
  return labels[kind] || kind;
}

function assetTypeIcon(kind = "all") {
  return {
    all: "box",
    image: "image",
    video: "video",
    text: "file-text",
    visual_card: "panels-top-left"
  }[kind] || "box";
}

function assetLibraryCounts(items = []) {
  return items.reduce((counts, item) => {
    const kind = assetMediaKind(item);
    counts.all += 1;
    counts[kind] = (counts[kind] || 0) + 1;
    return counts;
  }, { all: 0, image: 0, video: 0, text: 0, visual_card: 0 });
}

function assetLibraryNavButton(kind, ic, label, count, activeFilter) {
  return `<button type="button" class="${activeFilter === kind ? "active" : ""}" data-asset-type="${esc(kind)}">${icon(ic, 18)} <span>${esc(label)}</span><small>${count || 0}</small></button>`;
}

function assetLibraryProjectButton(id, label, count, activeProject) {
  const active = activeProject === id;
  const filterButton = `<button type="button" class="${active ? "active" : ""}" data-asset-project="${esc(id)}" title="${esc(label)}">${icon(id === "all" ? "folder-open" : "folder", 17)} <span>${esc(label)}</span><small>${count || 0}</small></button>`;
  if (id === "all") return filterButton;
  return `<div class="asset-library-project-row ${active ? "active" : ""}">
    ${filterButton}
    <span class="asset-library-project-actions">
      <button type="button" data-project-rename="${esc(id)}" title="${esc(t("renameProject"))}" aria-label="${esc(t("renameProject"))}">${icon("pencil", 14)}</button>
      <button type="button" data-project-delete="${esc(id)}" title="${esc(t("deleteProject"))}" aria-label="${esc(t("deleteProject"))}">${icon("trash-2", 14)}</button>
    </span>
  </div>`;
}

function assetLibraryDateGroups(items = []) {
  const groups = new Map();
  items.forEach((item) => {
    const key = assetLibraryDateKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()]
    .map(([key, entries]) => ({
      key,
      label: assetLibraryDateLabel(key),
      entries: entries.slice().sort(assetLibraryNewestFirst)
    }))
    .sort((a, b) => assetLibraryDateSortValue(b.key) - assetLibraryDateSortValue(a.key));
}

function assetLibraryNewestFirst(a = {}, b = {}) {
  return assetLibraryItemSortValue(b) - assetLibraryItemSortValue(a);
}

function assetLibraryItemSortValue(item = {}) {
  const value = Date.parse(item.createdAt || item.updatedAt || "");
  return Number.isFinite(value) ? value : -Infinity;
}

function assetLibraryDateSortValue(key = "") {
  if (key === "unknown") return -Infinity;
  const value = Date.parse(`${key}T00:00:00`);
  return Number.isFinite(value) ? value : -Infinity;
}

function assetLibraryDateKey(item = {}) {
  const date = item.createdAt ? new Date(item.createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) return "unknown";
  return localDateKey(date);
}

function assetLibraryDateLabel(key) {
  if (key === "unknown") return "Unknown date";
  const today = localDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  if (key === today) return "Today";
  if (key === localDateKey(yesterdayDate)) return "Yesterday";
  const date = new Date(`${key}T00:00:00`);
  return date.toLocaleDateString(state.lang === "zh" ? "zh-CN" : "en-US", { month: "long", day: "numeric", year: "numeric" });
}

function assetLibraryDateSection(group, index = 0, startIndex = 0) {
  const zoomControl = index === 0 ? studioWallZoomControl() : "";
  return `<section class="asset-date-group">
    <header>
      <div class="asset-date-heading">
        <label><input type="checkbox" aria-label="Select ${esc(group.label)} assets"><span></span></label>
        <h2>${esc(group.label)}</h2>
        <small>${group.entries.length} assets</small>
      </div>
      ${zoomControl}
    </header>
    <div class="asset-timeline-grid">${group.entries.map((item, index) => assetLibraryCard(item, startIndex + index)).join("")}</div>
  </section>`;
}

function assetLibraryCard(item, index = 0) {
  const kind = assetMediaKind(item);
  const title = item.title || item.providerTitle || resultMediaLabel(item);
  return `<article class="asset-tile asset-tile-${esc(kind)}" data-result-id="${esc(item.id)}">
    <button type="button" class="asset-tile-preview" data-result-preview="${esc(item.id)}" aria-label="Preview ${esc(title)}">
      ${assetLibraryPreview(item, kind, index)}
    </button>
  </article>`;
}

function assetLibraryPreview(item, kind, index = 0) {
  if (kind === "text") {
    const body = resultPromptText(item).replaceAll("\n", " ").trim() || item.providerBody || item.body || "Text result";
    return `<div class="asset-text-thumb">${icon("file-text", 28)}<strong>${esc(item.title || "Text result")}</strong><p>${esc(body)}</p></div>`;
  }
  return resultPreview(item, { clickable: false, wall: true, priority: index < 6, thumbWidth: 384, sizes: "(max-width: 760px) 42vw, 180px" });
}

function assetLibraryEmptyState(query) {
  return `<section class="empty-result asset-library-empty">${icon("folder-search", 34)}<b>No assets match this ${query ? "search" : "filter"}.</b><p>Try clearing search or switching back to All Assets.</p></section>`;
}

function isOwnerAdminAccount() {
  return state.user?.role === "admin" && ownerAdminEmails.has(String(state.user?.email || "").toLowerCase());
}

function adminMoney(value) {
  return `RM ${Number(value || 0).toFixed(2)}`;
}

function adminTime(value) {
  if (!value) return "No activity";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No activity" : date.toLocaleString();
}

function adminLastActivity(user, jobs = [], payments = [], ledger = []) {
  const values = [
    user?.lastActiveAt,
    user?.updatedAt,
    user?.createdAt,
    ...jobs.map((item) => item.updatedAt || item.createdAt),
    ...payments.map((item) => item.updatedAt || item.createdAt),
    ...ledger.map((item) => item.createdAt)
  ].filter(Boolean).map((item) => new Date(item).getTime()).filter(Number.isFinite);
  return values.length ? new Date(Math.max(...values)).toISOString() : "";
}

function adminStatusBadge(status = "active") {
  const value = String(status || "active").toLowerCase();
  return `<span class="admin-status-badge ${value}">${esc(value)}</span>`;
}

function adminActionQueue(items = []) {
  const visible = items.filter(Boolean);
  return `<section class="admin-action-queue">
    <div class="card-title"><h2>${icon("list-checks", 22)} Action Queue</h2><span>${visible.filter((item) => item.level !== "ok").length} items</span></div>
    <div class="admin-action-grid">
      ${visible.map((item) => `<button type="button" class="admin-action-item ${item.level || "ok"}" ${item.action || ""}>
        ${icon(item.icon || "circle-check", 20)}
        <span>${esc(item.title)}</span>
        <b>${esc(item.value)}</b>
        <small>${esc(item.note)}</small>
      </button>`).join("")}
    </div>
  </section>`;
}

function adminPage() {
  if (!isOwnerAdminAccount()) return `<section class="canvas-card slim"><h1>Admin access required</h1></section>`;
  if (state.user?.adminLocked || !state.db?.admin) {
    return `<section class="canvas-card slim"><h1>Admin verification</h1><p class="subtitle">Enter your private admin key to unlock provider operations, costs, endpoints, and user controls.</p><form data-form="admin-key" class="login-form"><label>Admin key<input name="adminKey" type="password" autocomplete="off" value="${esc(state.adminKey || "")}" required></label><button class="gold-button" type="submit">${icon("shield-check")} Unlock Admin</button></form></section>`;
  }
  const admin = state.db.admin || {};
  const totals = admin.totals || {};
  const users = admin.users || [];
  const jobs = admin.generationJobs || [];
  const calls = admin.apiCalls || [];
  const adminAuditLogs = admin.adminAuditLogs || [];
  const payments = admin.payments || [];
  const creditLedger = admin.creditLedger || [];
  const projects = admin.projects || state.db.projects || [];
  const query = state.adminSearch.trim().toLowerCase();
  const failedCalls = calls.filter((call) => /fail|error|blocked/i.test(`${call.status || ""} ${call.error || ""}`));
  const pendingPayments = payments.filter((payment) => payment.status && payment.status !== "paid");
  const userRows = users.map((user) => {
    const userJobs = jobs.filter((job) => job.userId === user.id);
    const userPayments = payments.filter((payment) => payment.userId === user.id);
    const userLedger = creditLedger.filter((entry) => entry.userId === user.id);
    const failedJobs = userJobs.filter((job) => /fail|error/i.test(`${job.status || ""} ${job.errorMessage || ""}`));
    const lastActivity = adminLastActivity(user, userJobs, userPayments, userLedger);
    const credits = Number(user.billing?.credits ?? 0);
    const lifecycle = Number(user.totalRevenueRm || 0) > 0 ? "paid" : userJobs.length ? "activated" : "new";
    return { ...user, userJobs, userPayments, userLedger, failedJobs, lastActivity, credits, lifecycle };
  });
  const filteredUsers = userRows
    .filter((user) => {
      const haystack = [user.email, user.id, user.role, user.status, user.lifecycle].join(" ").toLowerCase();
      const statusMatch = state.adminStatusFilter === "all"
        || (state.adminStatusFilter === "lowCredits" ? user.credits < 6 : state.adminStatusFilter === "failed" ? user.failedJobs.length > 0 : haystack.includes(state.adminStatusFilter.toLowerCase()));
      return statusMatch && (!query || haystack.includes(query));
    })
    .sort((a, b) => {
      if (state.adminSort === "credits") return a.credits - b.credits;
      if (state.adminSort === "revenue") return Number(b.totalRevenueRm || 0) - Number(a.totalRevenueRm || 0);
      if (state.adminSort === "cost") return Number(b.totalCostRm || 0) - Number(a.totalCostRm || 0);
      if (state.adminSort === "profit") return Number(b.totalProfitRm || 0) - Number(a.totalProfitRm || 0);
      return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
    });
  const selectedUser = userRows.find((user) => user.id === state.adminUserId) || filteredUsers[0] || userRows[0];
  const selectedJobs = jobs.filter((job) => job.userId === selectedUser?.id);
  const selectedPayments = payments.filter((payment) => payment.userId === selectedUser?.id);
  const selectedLedger = creditLedger.filter((entry) => entry.userId === selectedUser?.id);
  const selectedProjects = projects.filter((project) => project.userId === selectedUser?.id);
  const selectedFailedJobs = selectedJobs.filter((job) => /fail|error/i.test(`${job.status || ""} ${job.errorMessage || ""}`));
  const modelCosts = admin.modelCosts || {};
  const permissions = selectedUser?.agentPermissions || {};
  const lowCreditUsers = userRows.filter((user) => user.credits < 6 && (user.status || "active") !== "suspended");
  const highCostJobs = jobs.filter((job) => Number(job.costRm || 0) >= 1);
  const healthItems = [
    ["Users", totals.users || users.length, "users", `${filteredUsers.length} visible`, "data-admin-filter=\"all\""],
    ["Active", userRows.filter((user) => (user.status || "active") === "active").length, "user-check", "Active accounts", "data-admin-filter=\"active\""],
    ["Generations", totals.generations || jobs.length, "sparkles", "All jobs", ""],
    ["Revenue", adminMoney(totals.revenueRm), "receipt-text", "Paid CHIP", ""],
    ["Cost", adminMoney(totals.costRm), "wallet-cards", "Provider cost", "data-admin-toggle-ops=\"true\""],
    ["Failed", totals.failedCalls || failedCalls.length, "triangle-alert", "Needs review", "data-admin-toggle-ops=\"true\""]
  ];
  const queueItems = [
    {
      level: failedCalls.length ? "danger" : "ok",
      icon: failedCalls.length ? "triangle-alert" : "circle-check",
      title: "Failed API calls",
      value: `${failedCalls.length || totals.failedCalls || 0}`,
      note: failedCalls.length ? "Review provider/model failures" : "No failed calls in current state",
      action: "data-admin-toggle-ops=\"true\""
    },
    {
      level: lowCreditUsers.length ? "warning" : "ok",
      icon: lowCreditUsers.length ? "battery-warning" : "badge-check",
      title: "Low credit users",
      value: `${lowCreditUsers.length}`,
      note: lowCreditUsers.length ? "Users below 6 credits" : "No low-credit active users",
      action: "data-admin-filter=\"lowCredits\""
    },
    {
      level: pendingPayments.length ? "warning" : "ok",
      icon: pendingPayments.length ? "receipt-text" : "circle-check",
      title: "Pending payments",
      value: `${pendingPayments.length}`,
      note: pendingPayments.length ? "Payment cleanup may be needed" : "Payments look clean",
      action: ""
    },
    {
      level: highCostJobs.length ? "warning" : "ok",
      icon: "gauge",
      title: "High-cost jobs",
      value: `${highCostJobs.length}`,
      note: highCostJobs.length ? "Inspect model cost spikes" : "No high-cost jobs flagged",
      action: "data-admin-toggle-ops=\"true\""
    }
  ];
  return `
    <header class="project-head dashboard-head admin-crm-head">
      <div>
        <p class="folder-label">${icon("shield-check", 18)} Admin CRM</p>
        <h1>Pokaya Multi-User CRM</h1>
        <p class="subtitle">Operate users, payments, failed calls, credits, and provider diagnostics from one focused workspace.</p>
      </div>
      <div class="head-actions">
        <button class="dark-button mini-button" data-admin-toggle-ops="true">${icon("activity", 16)} Ops Diagnostics</button>
      </div>
    </header>
    <section class="admin-health-strip">
      ${healthItems.map(([label, value, ic, note, action]) => `<button type="button" ${action}>
        ${icon(ic, 18)}
        <span>${label}</span>
        <b>${value}</b>
        <small>${note}</small>
      </button>`).join("")}
    </section>
    ${adminActionQueue(queueItems)}
    <section class="admin-crm-layout">
      <article class="activity-card admin-users-card">
        <div class="card-title"><h2>${icon("users", 22)} Users CRM</h2><span>${filteredUsers.length}/${users.length} accounts</span></div>
        <div class="admin-crm-toolbar">
          <label>${icon("search", 15)}<input data-admin-search placeholder="Search email, user id, role..." value="${esc(state.adminSearch)}"></label>
          <select data-admin-status-filter>
            ${[
              ["all", "All users"],
              ["active", "Active"],
              ["suspended", "Suspended"],
              ["admin", "Admin"],
              ["lowCredits", "Low credits"],
              ["failed", "Has failures"]
            ].map(([value, label]) => `<option value="${value}" ${state.adminStatusFilter === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
          <select data-admin-sort>
            ${[
              ["lastActivity", "Last activity"],
              ["credits", "Credits low first"],
              ["revenue", "Revenue"],
              ["cost", "Cost"],
              ["profit", "Profit"]
            ].map(([value, label]) => `<option value="${value}" ${state.adminSort === value ? "selected" : ""}>Sort: ${label}</option>`).join("")}
          </select>
        </div>
        <div class="admin-user-table">
          <div class="admin-user-row head"><span>User</span><span>Status</span><span>Credits</span><span>Revenue</span><span>Cost</span><span>Last activity</span><span></span></div>
          ${filteredUsers.map((user) => `<button type="button" class="admin-user-row ${selectedUser?.id === user.id ? "selected" : ""}" data-admin-user="${esc(user.id)}">
            <span><b>${esc(user.email)}</b><small>${esc(user.role || "user")} | ${esc(user.lifecycle)} | ${user.projectCount || 0} projects</small></span>
            <span>${adminStatusBadge(user.status)}</span>
            <span>${user.credits}</span>
            <span>${adminMoney(user.totalRevenueRm)}</span>
            <span>${adminMoney(user.totalCostRm)}</span>
            <span>${adminTime(user.lastActivity)}</span>
            <span>${icon("chevron-right", 16)}</span>
          </button>`).join("") || `<p class="empty-text">No users match this filter.</p>`}
        </div>
      </article>
      <article class="activity-card admin-profile-card">
        <div class="card-title"><h2>${icon("id-card", 22)} User Detail</h2><span>${selectedUser?.email || "No user"}</span></div>
        ${selectedUser ? `<div class="admin-profile-head">
          <div><strong>${esc(selectedUser.email)}</strong><p>${esc(selectedUser.id)} | ${esc(selectedUser.lifecycle || "user")}</p></div>
          ${adminStatusBadge(selectedUser.status)}
        </div>
        <div class="metric-row admin-profile-metrics">
          <article><span>Credits</span><strong>${selectedUser.billing?.credits ?? 0}</strong></article>
          <article><span>Revenue</span><strong>${adminMoney(selectedUser.totalRevenueRm)}</strong></article>
          <article><span>Profit</span><strong>${adminMoney(selectedUser.totalProfitRm)}</strong></article>
          <article><span>Projects</span><strong>${selectedProjects.length}</strong></article>
          <article><span>Jobs</span><strong>${selectedJobs.length}</strong></article>
          <article><span>Failures</span><strong>${selectedFailedJobs.length}</strong></article>
        </div>
        <div class="admin-actions">
          <button class="gold-button mini-button" data-admin-credit="${selectedUser.id}" data-delta="10">${icon("plus", 15)} +10 credits</button>
          <button class="dark-button mini-button" data-admin-credit="${selectedUser.id}" data-delta="-10">${icon("minus", 15)} -10 credits</button>
          <button class="dark-button mini-button" data-admin-status="${selectedUser.id}" data-status="${selectedUser.status === "suspended" ? "active" : "suspended"}">${icon(selectedUser.status === "suspended" ? "unlock" : "ban", 15)} ${selectedUser.status === "suspended" ? "Unsuspend" : "Suspend"}</button>
          <button class="dark-button mini-button" data-admin-toggle-ops="true">${icon("bug", 15)} View failures</button>
        </div>
        <div class="admin-mini-section">
          <h3>Recent jobs</h3>
          ${table(selectedJobs.slice(0, 5).map((job) => [job.model || job.type || "Job", `${job.status || "queued"} | ${adminMoney(job.costRm)}`, job.errorMessage || job.taskId || job.createdAt || ""]))}
        </div>
        <div class="admin-mini-section">
          <h3>Finance</h3>
          ${table(selectedLedger.slice(0, 4).map((entry) => [entry.note || entry.type, `${entry.credits > 0 ? "+" : ""}${entry.credits} credits`, adminTime(entry.createdAt)]))}
          ${table(selectedPayments.slice(0, 3).map((payment) => paymentRow(payment, true)))}
        </div>
        <div class="admin-mini-section">
          <h3>Agent permissions</h3>
          <div class="permission-grid">${["generate", "updateProject", "schedule", "publish", "support"].map((key) => `<button class="${permissions[key] ? "gold-button" : "dark-button"} mini-button" data-agent-permission="${selectedUser.id}" data-permission="${key}" data-enabled="${permissions[key] ? "false" : "true"}">${permissions[key] ? icon("check", 15) : icon("x", 15)} ${key}</button>`).join("")}</div>
        </div>` : `<p class="empty-text">No user selected.</p>`}
      </article>
    </section>
    <section class="admin-diagnostics ${state.adminOpsOpen ? "open" : ""}">
      <button type="button" class="admin-diagnostics-toggle" data-admin-toggle-ops="true">${icon("shield-alert", 18)} Ops Diagnostics <span>${state.adminOpsOpen ? "Hide" : "Reveal"}</span></button>
      <div class="admin-diagnostics-body">
        <article class="activity-card">
          <div class="card-title"><h2>${icon("activity", 22)} API Calls</h2><span>${calls.length} records</span></div>
          ${table(calls.slice(0, 12).map((call) => [call.model || call.provider || "API call", `${call.status || "unknown"} | RM ${Number(call.costRm || 0).toFixed(3)}`, call.endpoint || call.taskId || call.errorMessage || ""]))}
        </article>
        <article class="activity-card">
          <div class="card-title"><h2>${icon("image", 22)} Generated Assets</h2><span>${jobs.length} jobs</span></div>
          ${table(jobs.slice(0, 12).map((job) => [job.model || job.type, `${job.provider || "provider"} | ${job.status || "status"}`, `RM ${Number(job.costRm || 0).toFixed(3)} | ${job.taskId || job.errorMessage || ""}`]))}
        </article>
        <article class="activity-card">
          <div class="card-title"><h2>${icon("sliders-horizontal", 22)} Internal Model Costs</h2><span>Admin only</span></div>
          ${table(Object.entries(modelCosts).map(([model, cost]) => [model, formatUsdCost(cost.costUsd ?? Number(cost.costRm || 0) * usdPerRm), cost.unit || ""]))}
        </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("shield-check", 22)} Guardrails</h2><span>Active</span></div>
        ${table([
          ["Credit check", "USD 1 = 1000 credits", "Blocks normal users when balance is below the estimated generation cost"],
          ["Rate limit", "3/minute, 50/day", "Admin accounts are exempt for testing"],
          ["Failure ledger", "No credit charge", "Failed API calls are recorded for admin review"],
          ["Admin audit", `${adminAuditLogs.length} events`, "Sensitive admin actions are logged"]
        ])}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("shield-check", 22)} Admin Audit</h2><span>${adminAuditLogs.length} events</span></div>
        ${table(adminAuditLogs.slice(0, 12).map((entry) => [entry.action, entry.email || entry.userId, entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""]))}
      </article>
      </div>
    </section>`;
}

function projectPage() {
  const p = project();
  return `
    <section class="project-step-topbar">
      ${studioTopStepTabs()}
    </section>
    <section class="canvas-card studio-workbench-card">
      <div class="studio-step-panel">${stepPanel(p)}</div>
    </section>`;
}

function studioTopStepTabs() {
  return `<nav class="step-tabs studio-top-step-tabs" aria-label="Creation tools">
    ${steps.map(([id, ic, key]) => `<button class="${state.step === id ? "active" : ""}" data-step="${id}" type="button">${icon(ic)} <span>${t(key)}</span></button>`).join("")}
  </nav>`;
}

function sopButtonLabel() {
  const labels = {
    ms: {
      image: "SOP Image",
      ugc: "SOP UGC",
      auto: "SOP Audio",
      original: "SOP Original Video",
      clone: "SOP Clone Prompt",
      story: "SOP Story",
      viral: "SOP Viral"
    },
    zh: {
      image: "图片 SOP",
      ugc: "UGC SOP",
      auto: "声音 SOP",
      original: "原创视频 SOP",
      clone: "复刻提示词 SOP",
      story: "故事脚本 SOP",
      viral: "爆款 SOP"
    },
    en: {
      image: "Image SOP",
      ugc: "UGC SOP",
      auto: "Product Scanner SOP",
      original: "Original Video SOP",
      clone: "Clone Prompt SOP",
      story: "Story SOP",
      viral: "Viral SOP"
    }
  };
  return labels[state.lang]?.[state.step] || labels.ms[state.step] || "SOP";
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

function studioStepMeta(step = state.step) {
  return {
    image: { title: "图片", icon: "image", action: "generate-image", promptField: "image.prompt", prompt: "Create a high-converting TikTok Shop product image...", types: ["image", "visual_card"], primary: "Generate" },
    ugc: { title: "UGC", icon: "video", action: "generate-ugc", promptField: "ugc.script", prompt: "Describe the UGC scene, product action, and spoken line...", types: ["ugc", "video"], primary: "Generate Video" },
    auto: { title: "商品扫描器", icon: "layout-template", action: "generate-auto", promptField: "auto.productUrl", prompt: "Paste product link or describe the product...", types: ["auto"], primary: "Generate Batch", input: true },
    original: { title: "原创视频", icon: "film", action: "analyze-original", promptField: "original.brief", prompt: "Describe the video scene, camera, action, mood, and dialogue...", types: ["original", "video"], primary: "Generate Video" },
    clone: { title: "影片 Prompt 提取", icon: "layers-3", action: "clone-prompt", promptField: "clone.notes", prompt: "Drop a reference video to extract its reusable prompt.", types: ["clone"], primary: "Extract Prompt" },
    story: { title: "故事脚本", icon: "book-open", action: "write-story", promptField: "story.notes", prompt: "Describe the story topic, emotion, product, or lesson...", types: ["story"], primary: "Preview" }
  }[step] || {};
}

function fieldValue(p, path = "") {
  return path.split(".").reduce((obj, key) => obj?.[key], p) || "";
}

function studioImmersiveShell(p, step) {
  const meta = studioStepMeta(step);
  return `<section class="studio-immersive-page studio-wall-zoomable" data-studio-mode="${esc(step)}" ${studioWallZoomStyleAttr()}>
    ${studioWallZoomControl()}
    ${studioResultWall(p, meta)}
    ${studioGenerateDock(p, meta)}
  </section>`;
}

function studioWallZoomValue() {
  const value = Number(state.studioWallZoom);
  if (!Number.isFinite(value)) return studioWallZoomMin;
  return Math.max(studioWallZoomMin, Math.min(studioWallZoomMax, Math.round(value)));
}

function studioWallZoomColumn(value = studioWallZoomValue()) {
  return [140, 220, 320, 460, 640][value] || 320;
}

function studioWallZoomStyleAttr() {
  const zoom = studioWallZoomValue();
  return `data-studio-wall-zoom-level="${zoom}" style="--studio-wall-column:${studioWallZoomColumn(zoom)}px"`;
}

function studioWallZoomControl() {
  const value = studioWallZoomValue();
  return `<div class="studio-wall-zoom-control" aria-label="Preview size" style="--studio-wall-zoom-progress:${((value - studioWallZoomMin) / (studioWallZoomMax - studioWallZoomMin)) * 100}%">
    <input type="range" min="${studioWallZoomMin}" max="${studioWallZoomMax}" step="1" value="${value}" data-studio-wall-zoom aria-label="Adjust preview size">
  </div>`;
}

function studioResultWall(p, meta = {}) {
  const types = Array.isArray(meta.types) ? meta.types : [state.step];
  const step = state.step || "image";
  const pending = pendingResultJobs(p, types);
  const items = p.results.filter((item) => studioResultBelongsToStep(item, step, types)).filter(studioResultIsDisplayable);
  const wallKey = studioWallKey(p, step, types);
  const unloadedCount = Math.max(0, Number(p.resultCount || 0) - (p.results || []).length);
  const timeline = [
    ...pending.map((job, index) => ({ kind: "pending", item: job, index, time: studioWallTimelineTime(job), rank: studioWallTimelineRank(job, index) })),
    ...items.map((item, index) => ({ kind: "result", item, index, time: studioWallTimelineTime(item), rank: studioWallTimelineRank(item, index) }))
  ].sort((a, b) => (b.time - a.time) || (a.rank - b.rank));
  const cards = timeline.map((entry, orderIndex) => entry.kind === "pending"
    ? studioPendingWallCard(entry.item, orderIndex)
    : studioWallCard(entry.item, entry.index, orderIndex));
  if (!cards.length) return "";
  return `<section class="studio-result-wall" data-studio-wall-key="${esc(wallKey)}" data-studio-wall-has-more="${unloadedCount ? "true" : "false"}">
    <div class="studio-wall-grid">
      ${cards.join("")}
    </div>
    ${studioBulkSelectionBar()}
  </section>`;
}

const studioWallPageSize = 24;

function generationJobTimelineTime(job = {}) {
  job = job || {};
  const raw = job.timelineAt || job.createdAt || job.startedAt || job.updatedAt || job.completedAt || "";
  return Date.parse(raw || 0) || 0;
}

function studioWallTimelineTime(item = {}) {
  item = item || {};
  const originJob = resultOriginJob(item);
  const raw = item.timelineAt || originJob?.timelineAt || originJob?.createdAt || item.createdAt || item.startedAt || item.updatedAt || item.completedAt || "";
  return Date.parse(raw || 0) || 0;
}

function studioWallTimelineRank(item = {}, fallback = 0) {
  const originJob = resultOriginJob(item);
  const batchIndex = Number(originJob?.batchIndex || item.batchIndex);
  if (Number.isFinite(batchIndex) && batchIndex > 0) return batchIndex;
  return Number.isFinite(fallback) ? fallback + 1000 : 9999;
}

function studioWallKey(projectItem, step = state.step, types = []) {
  return [projectItem?.id || "project", step || "image", ...types].join(":");
}

function studioWallLimit(key) {
  const saved = Number(state.studioWallLimits?.[key] || 0);
  return Math.max(studioWallPageSize, saved || studioWallPageSize);
}

async function showMoreStudioWall(key) {
  if (!key) return;
  if (studioWallLoadingKeys.has(key)) return;
  const [projectId, step = state.step, ...types] = key.split(":");
  const projectItem = (state.db?.projects || []).find((item) => item.id === projectId);
  const matchingCount = (projectItem?.results || []).filter((item) => studioResultBelongsToStep(item, step, types)).length;
  const nextLimit = Math.max(studioWallLimit(key) + studioWallPageSize, matchingCount + studioWallPageSize);
  const next = {
    ...(state.studioWallLimits || {}),
    [key]: nextLimit
  };
  set({ studioWallLimits: next });
  studioWallLoadingKeys.add(key);
  try {
    await loadOlderStudioWallResults(key, nextLimit);
  } finally {
    studioWallLoadingKeys.delete(key);
  }
}

function bindStudioWallInfiniteScroll() {
  studioWallInfiniteScrollCleanup?.();
  studioWallInfiniteScrollCleanup = null;
  const walls = [...document.querySelectorAll(".studio-result-wall[data-studio-wall-key][data-studio-wall-has-more='true']")];
  if (!walls.length) return;
  let ticking = false;
  let loading = false;
  const scrollTargets = [
    window,
    document.querySelector(".workspace"),
    document.querySelector(".studio-shell")
  ].filter(Boolean);
  const uniqueScrollTargets = [...new Set(scrollTargets)];
  const isNearViewportBottom = (wall) => wall.getBoundingClientRect().bottom - window.innerHeight < 900;
  const check = async () => {
    ticking = false;
    if (loading) return;
    const wall = walls.find((item) => item.dataset.studioWallHasMore === "true" && isNearViewportBottom(item));
    if (!wall?.dataset.studioWallKey) return;
    loading = true;
    try {
      await showMoreStudioWall(wall.dataset.studioWallKey);
    } finally {
      loading = false;
    }
  };
  const requestCheck = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(check);
  };
  uniqueScrollTargets.forEach((target) => target.addEventListener("scroll", requestCheck, { passive: true }));
  requestCheck();
  studioWallInfiniteScrollCleanup = () => {
    uniqueScrollTargets.forEach((target) => target.removeEventListener("scroll", requestCheck));
  };
}

async function loadOlderStudioWallResults(key, targetLimit) {
  if (!state.db) return;
  const [projectId, step = state.step, ...types] = key.split(":");
  const projectItem = (state.db.projects || []).find((item) => item.id === projectId);
  if (!projectItem || Number(projectItem.resultCount || 0) <= (projectItem.results || []).length) return;
  const matchingCount = (projectItem.results || []).filter((item) => studioResultBelongsToStep(item, step, types)).length;
  if (matchingCount >= targetLimit) return;
  const oldest = (projectItem.results || [])[0];
  if (!oldest?.id) return;
  try {
    const payload = await api(`/projects/${encodeURIComponent(projectId)}/results?before=${encodeURIComponent(oldest.id)}&limit=96`);
    const olderResults = Array.isArray(payload.results) ? payload.results : [];
    if (!olderResults.length) return;
    const olderIds = new Set(olderResults.map((item) => item.id));
    const nextDb = {
      ...state.db,
      projects: (state.db.projects || []).map((item) => item.id === projectId
        ? {
            ...item,
            resultCount: payload.resultCount || item.resultCount,
            results: [
              ...olderResults,
              ...(item.results || []).filter((result) => !olderIds.has(result.id))
            ]
          }
        : item)
    };
    set({ db: nextDb });
  } catch (error) {
    notify(error.message);
  }
}

function videoStudioStep(sourceStep = "") {
  return ["ugc", "original", "story"].includes(sourceStep) ? sourceStep : "ugc";
}

function studioResultBelongsToStep(item = {}, step = state.step, types = []) {
  if (item.type === "video") return step === videoStudioStep(item.sourceStep || item.step);
  return types.includes(item.type);
}

function studioResultIsDisplayable(item = {}) {
  if (item.imageUrl || item.videoUrl || item.visualCard || item.type === "visual_card") return true;
  if (item.type === "text" && (item.body || item.providerBody || item.prompt)) return true;
  return false;
}

function studioPendingWallCard(job, orderIndex = 0) {
  const aspectRatio = wallAspectRatioForItem(job, project());
  const mediaRatio = aspectRatioToMediaRatio(aspectRatio);
  const aspectClass = Number(mediaRatio) >= 1 ? "landscape" : "portrait";
  const isFailed = job.status === "failed";
  const statusLabel = generationJobStatusLabel(job);
  const timelineAt = job.timelineAt || job.createdAt || "";
  const promptPreview = String(job.promptSnapshot || job.prompt || "").replaceAll("\n", " ").trim();
  const statusIcon = `<span class="studio-wall-pending-spinner" role="status" aria-label="${esc(statusLabel)}" title="${esc(statusLabel)}">${icon(isFailed ? "triangle-alert" : "loader-circle", 22)}</span>`;
  const statusBody = `
      ${statusIcon}
      <b>${esc(statusLabel)}</b>
      <small>${esc(isFailed ? (job.errorMessage || "Please adjust the prompt and try again.") : promptPreview ? promptPreview.slice(0, 110) : generationJobStageHelp(job))}</small>`;
  const processingBody = `
      ${statusIcon}
      <b>${esc(generationJobCenterLabel(job))}</b>`;
  return `<article class="studio-wall-card studio-wall-pending ${aspectClass} ${isFailed ? "failed" : ""}" data-aspect-ratio="${esc(aspectRatio)}" data-media-ratio="${esc(mediaRatio)}" data-generation-job-id="${esc(job.id)}" data-generation-job-status="${esc(job.status || "queued")}" style="--media-ratio:${esc(mediaRatio)};--wall-aspect-ratio:${esc(aspectRatioToCss(aspectRatio))};aspect-ratio:var(--wall-aspect-ratio)">
    <div class="studio-wall-pending-controls" aria-label="${esc(statusLabel)}">
      ${isFailed ? `<div class="studio-wall-failed-center">${statusBody}
        <p class="generation-credit-refund-note"><strong>No Charge</strong></p>
        <div class="studio-wall-failed-actions"><button type="button" data-generation-retry="${esc(job.id)}">${icon("refresh-cw", 14)} Retry</button><button type="button" data-generation-edit="${esc(job.id)}">${icon("pencil-line", 14)} Edit</button></div>
      </div>` : `${processingBody}${job.optimistic ? "" : `<button type="button" data-generation-cancel="${esc(job.id)}" aria-label="Cancel generation" title="Cancel generation">${icon("ban", 22)}</button>`}`}
    </div>
  </article>`;
}

function studioWallCard(item, index = 0) {
  const promptText = resultPromptText(item).replaceAll("\n", " ").trim();
  const canSaveReference = Boolean(item.imageUrl || item.videoUrl);
  const aspectRatio = wallAspectRatioForItem(item);
  const mediaRatio = intrinsicMediaRatioForItem(item) || aspectRatioToMediaRatio(aspectRatio);
  const isNew = Date.now() - Date.parse(item.createdAt || 0) < 120000;
  const selected = selectedResultIdSet().has(item.id);
  const bulkSelecting = isBulkSelectingResults();
  return `<article class="studio-wall-card ${isNew ? "is-new" : ""} ${selected ? "is-selected" : ""} ${bulkSelecting ? "is-bulk-selecting" : ""}" data-aspect-ratio="${esc(aspectRatio)}" data-media-ratio="${esc(mediaRatio)}" data-result-id="${esc(item.id)}" style="--media-ratio:${esc(mediaRatio)};--wall-aspect-ratio:${esc(aspectRatioToCss(aspectRatio))}">
    ${isNew ? `<span class="studio-wall-new-badge">New</span>` : ""}
    <button type="button" class="studio-wall-select-toggle" data-result-select="${esc(item.id)}" aria-label="${selected ? "Unselect result" : "Select result"}" aria-pressed="${selected ? "true" : "false"}">
      ${selected ? icon("check", 17) : ""}
    </button>
    ${resultPreview(item, { clickable: true, wall: true, priority: index < 6 })}
    <div class="studio-wall-actions" aria-label="Image actions">
      <button type="button" data-result-action="save-avatar" data-result-id="${esc(item.id)}" data-tooltip="Save as Avatar" aria-label="Save as Avatar" ${canSaveReference ? "" : "disabled"}>${icon("user-round-plus", 17)}</button>
      <button type="button" data-result-action="save-product" data-result-id="${esc(item.id)}" data-tooltip="Save as Product" aria-label="Save as Product" ${canSaveReference ? "" : "disabled"}>${icon("package-plus", 17)}</button>
      <button type="button" data-result-action="download" data-result-id="${esc(item.id)}" data-result-kind="${item.videoUrl ? "video" : item.imageUrl ? "image" : "text"}" data-tooltip="Download" aria-label="Download">${icon("download", 18)}</button>
      <button type="button" data-result-action="delete" data-result-id="${esc(item.id)}" data-tooltip="Delete" aria-label="Delete">${icon("trash-2", 18)}</button>
    </div>
    <footer><b>${esc(item.title || resultModelLabel(item))}</b><span>${esc(promptText ? promptText.slice(0, 92) : resultMediaLabel(item))}</span></footer>
  </article>`;
}

function selectedResultIdSet() {
  return new Set(Array.isArray(state.selectedResultIds) ? state.selectedResultIds : []);
}

function selectedResults() {
  const ids = selectedResultIdSet();
  return allResults().filter((item) => ids.has(item.id));
}

function isBulkSelectingResults() {
  return selectedResultIdSet().size > 0;
}

function studioBulkSelectionBar() {
  const items = selectedResults();
  if (!items.length) return "";
  const downloadableCount = items.filter((item) => item.imageUrl || item.videoUrl).length;
  const selectedLabel = `${items.length} selected`;
  const busyKind = state.bulkReferenceBusy || "";
  const savingAvatar = busyKind === "avatar";
  const savingProduct = busyKind === "product";
  const savingReference = Boolean(busyKind);
  return `<div class="studio-bulk-selection-bar" role="region" aria-label="Bulk selected results">
    <div class="studio-bulk-selection-count">
      <span class="studio-bulk-selection-icon">${icon("panel-left", 21)}</span>
      <b>${esc(selectedLabel)}</b>
    </div>
    <div class="studio-bulk-selection-actions">
      <button type="button" data-bulk-result-action="download" ${downloadableCount && !savingReference ? "" : "disabled"}>${icon("download", 19)} <span>Download</span></button>
      <button type="button" data-bulk-result-action="delete" class="danger" ${savingReference ? "disabled" : ""}>${icon("trash-2", 19)} <span>Delete</span></button>
      <button type="button" data-bulk-result-action="save-avatar" ${savingReference ? "disabled" : ""}>${icon(savingAvatar ? "loader-circle" : "user-round-plus", 19)} <span>${savingAvatar ? "Saving" : "Save as Avatar"}</span></button>
      <button type="button" data-bulk-result-action="save-product" ${savingReference ? "disabled" : ""}>${icon(savingProduct ? "loader-circle" : "package-plus", 19)} <span>${savingProduct ? "Saving" : "Save as Product"}</span></button>
      <button type="button" data-bulk-result-action="clear" class="icon-only-bulk ghost" aria-label="Clear selected results" ${savingReference ? "disabled" : ""}>${icon("x", 26)}</button>
    </div>
  </div>`;
}

function studioGenerateDock(p, meta = {}) {
  const value = fieldValue(p, meta.promptField);
  const input = meta.input
    ? `<input data-field="${esc(meta.promptField)}" value="${esc(value)}" placeholder="${esc(meta.prompt || "")}">`
    : `<textarea data-field="${esc(meta.promptField)}" rows="2" placeholder="${esc(meta.prompt || "")}">${esc(value)}</textarea>`;
  return `<section class="studio-generate-dock">
    <button class="studio-dock-add" type="button" data-action="open-attachment-picker" data-attachment-kind="product" title="Add reference">${icon("plus", 20)}</button>
    <div class="studio-dock-main">
      <div class="studio-dock-prompt">${input}</div>
      <div class="studio-dock-tools">
        ${studioDockChips(p, meta)}
      </div>
    </div>
    <button class="studio-dock-generate" type="button" data-action="${esc(meta.action || "generate-image")}" ${state.generating ? "disabled" : ""}>
      <b>${esc(state.generating ? t("generating") : meta.primary || "Generate")}</b>
      <span>${esc(studioDockCredit(meta))}</span>
    </button>
  </section>`;
}

function studioDockChips(p, meta = {}) {
  const step = state.step;
  const chips = {
    image: ["9:16", p.image?.model || "GPT Image 2", "~0.15 credit"],
    ugc: [p.ugc?.provider || "Veo 3.1", p.ugc?.imageMode || "Reference", "8s"],
    auto: [p.auto?.voicePreset || "Malay Soft Sell", p.auto?.audioLanguage || "Malay", p.auto?.audioMode || "Voiceover"],
    original: [originalProviderValue(p.original?.provider), p.original?.imageMode || "Text only", p.original?.aspectRatio || "9:16"],
    clone: ["Reference video", "Prompt", "Frame analysis"],
    story: [p.story?.language || "MY Bahasa Melayu", p.story?.visualStyle || "Cinematic", p.story?.voice || "Jamal"]
  }[step] || [];
  return chips.map((item) => `<span>${esc(item)}</span>`).join("");
}

function studioDockCredit(meta = {}) {
  return {
    image: "credit preview",
    ugc: "video credits",
    auto: "0.20 credit",
    original: "video credits",
    clone: "prompt credits",
    story: "story credits"
  }[state.step] || "credits";
}

function imagePanel(p) {
  const imageModelValues = imageModelOptions().map((item) => item.value);
  const selectedModel = imageModelValues.includes(p.image.model) ? p.image.model : String(p.image.model || "").toLowerCase().includes("pro") ? "Nano Banana Pro" : "GPT Image 2";
  const modeOptions = ["Create Image", "Virtualize (Poster/Ad)"];
  const selectedMode = modeOptions.includes(p.image.mode) ? p.image.mode : "Create Image";
  const imageTypes = ["image", "video", "visual_card"];
  const meta = studioStepMeta("image");
  const bulkSelecting = isBulkSelectingResults();
  return `<section class="image-canvas-studio image-higgsfield-mode studio-wall-zoomable ${bulkSelecting ? "is-bulk-selecting-results" : ""}" ${studioWallZoomStyleAttr()}>
    ${selectedMode === "Virtualize (Poster/Ad)" ? `<div class="image-studio-legacy">${virtualizePanel()}</div>` : `
      ${studioWallZoomControl()}
      ${studioResultWall(p, meta)}
      ${bulkSelecting ? "" : imageGenerateConsole(p, selectedModel)}
    `}
  </section>`;
}

function imageCanvasStage(p, selectedResult, history = [], pending = []) {
  return `<section class="image-canvas-stage">
    ${selectedResult ? imageCanvasPreview(selectedResult) : imageCanvasEmpty(p)}
    <aside class="image-history-rail">
      <header><b>${icon("history", 16)} History</b><span>${pending.length + history.length}</span></header>
      <div>
        ${pending.map(imagePendingThumb).join("")}
        ${history.length ? history.map((item) => imageHistoryThumb(item, selectedResult?.id)).join("") : ""}
      </div>
    </aside>
  </section>`;
}

function imageCanvasPreview(item) {
  const promptText = resultPromptText(item).replaceAll("\n", " ").trim();
  return `<article class="image-main-preview">
    <div class="image-preview-frame">${resultPreview(item)}</div>
    <footer>
      <div><b>${esc(item.title || resultModelLabel(item))}</b><span>${esc(promptText ? promptText.slice(0, 150) : "Generated Pokaya image")}</span></div>
      <div class="image-preview-actions">
        <button type="button" data-result-action="download" data-result-id="${esc(item.id)}" data-result-kind="${item.videoUrl ? "video" : item.imageUrl ? "image" : "text"}">${icon("download", 16)} Download</button>
        <button type="button" data-result-action="save" data-result-id="${esc(item.id)}">${icon("image-plus", 16)} Save ref</button>
        <button type="button" data-image-preset="${esc(`Create a fresh variation of this image. Keep the product logic and improve the composition for TikTok Shop conversion.\n\nReference: ${promptText || item.title || ""}`)}">${icon("wand-sparkles", 16)} Variation</button>
      </div>
    </footer>
  </article>`;
}

function imageCanvasEmpty(p) {
  const presets = [
    ["TikTok product image", "Create a high-converting TikTok Shop product image. Show the product clearly, with a Malaysian lifestyle scene, warm daylight, clean commercial composition, and room for short promo text."],
    ["Creator holding product", "A friendly Malaysian creator holding the product naturally, smiling at camera, bright clean home setting, realistic TikTok affiliate product photography."],
    ["Poster / ad image", "Create a clean vertical product poster for TikTok Shop with strong headline space, product hero in foreground, promo badge area, and warm lifestyle background."]
  ];
  return `<article class="image-main-preview image-empty-canvas">
    <div>
      <b>${icon("sparkles", 28)} Start with a prompt below</b>
      <p>Generate product visuals, creator shots, posters, and TikTok Shop images from one console.</p>
      <div>${presets.map(([label, text]) => `<button type="button" data-image-preset="${esc(text)}">${esc(label)}</button>`).join("")}</div>
    </div>
  </article>`;
}

function imagePendingThumb(job) {
  const statusLabel = generationJobStatusLabel(job);
  const wait = generationJobWaitSeconds(job);
  const promptPreview = String(job.promptSnapshot || job.prompt || "").replaceAll("\n", " ").trim();
  return `<article class="image-history-thumb pending" data-generation-job-id="${esc(job.id)}" data-generation-job-status="${esc(job.status || "queued")}" data-generation-job-stage="${esc(generationJobStatusKey(job))}">
    ${job.optimistic ? "" : `<button class="image-history-cancel-generation" type="button" data-generation-cancel="${esc(job.id)}" aria-label="取消生成" title="取消生成">${icon("circle-x", 17)}</button>`}
    <div class="image-history-pending-preview" aria-hidden="true">
      <i></i><i></i><i></i>
      <span>${icon("loader-circle", 23)}</span>
    </div>
    <b>${esc(statusLabel)}</b>
    <small>${esc(wait >= 45 ? "这次可能需要更久" : generationJobStageHelp(job, wait))}</small>
    ${promptPreview ? `<em>${esc(promptPreview.slice(0, 72))}</em>` : ""}
  </article>`;
}

function imageHistoryThumb(item, selectedId = "") {
  const active = item.id === selectedId;
  const token = encodeURIComponent(state.token || "");
  const imageSrc = item.imageUrl ? `/api/media/result/${encodeURIComponent(item.id)}/image?token=${token}` : "";
  const videoSrc = item.videoUrl ? `/api/media/result/${encodeURIComponent(item.id)}/video?token=${token}` : "";
  const media = item.imageUrl
    ? `<img src="${esc(imageSrc)}" alt="">`
    : item.videoUrl
      ? `<video src="${esc(videoSrc)}" muted playsinline></video>`
      : `<span>${icon("file-text", 22)}</span>`;
  return `<button class="image-history-thumb ${active ? "active" : ""}" type="button" data-image-canvas-result="${esc(item.id)}">
    ${media}
    <small>${esc(item.title || resultModelLabel(item))}</small>
  </button>`;
}

function imageBatchCount(p = project()) {
  const count = Number.parseInt(p?.image?.count, 10);
  if (!Number.isFinite(count)) return 1;
  return Math.min(4, Math.max(1, count));
}

function imageModelCapabilities(model = "GPT Image 2") {
  const commonRatios = ["9:16", "3:4", "2:3", "1:1", "4:3", "16:9", "3:2"];
  const capabilities = {
    "GPT Image 2": {
      aspectRatios: ["9:16", "3:4", "2:3", "1:1", "4:3", "16:9", "3:2", "4:5", "5:4", "1:2", "2:1", "1:3", "3:1", "9:21", "21:9"],
      resolutions: ["1K", "2K", "4K"]
    },
    "Seedream 5.0 Lite": {
      aspectRatios: [...commonRatios, "21:9"],
      resolutions: ["2K", "3K"]
    },
    "Seedream 4.5": {
      aspectRatios: [...commonRatios, "9:21", "21:9"],
      resolutions: ["2K", "4K"]
    },
    "Nano Banana Pro": {
      aspectRatios: ["9:16", "3:4", "2:3", "1:1", "16:9", "3:2", "4:5", "5:4", "21:9"],
      resolutions: ["1K", "2K", "4K"]
    },
    "Nano Banana 2": {
      aspectRatios: ["9:16", "3:4", "2:3", "1:1", "4:3", "16:9", "3:2", "4:5", "5:4", "1:4", "4:1", "1:8", "8:1", "21:9"],
      resolutions: ["512", "1K", "2K", "4K"]
    },
    "Grok Imagine": {
      aspectRatios: ["1:1", "16:9", "9:16", "3:2", "2:3"],
      resolutions: ["1K"]
    }
  };
  return capabilities[model] || capabilities["GPT Image 2"];
}

function imageResolutionOptionsForModel(model = "GPT Image 2") {
  const descriptions = {
    "512": { title: "512", description: "Small preview output", badge: "PREVIEW" },
    "1K": { title: "1k", description: "Fast draft preview", badge: "FAST" },
    "2K": { title: "2k", description: "Balanced daily quality", badge: "DEFAULT" },
    "3K": { title: "3k", description: "High-detail creative output", badge: "HD" },
    "4K": { title: "4k", description: "Best detail for final output", badge: "PRO" }
  };
  return imageModelCapabilities(model).resolutions.map((value) => ({ value, ...(descriptions[value] || descriptions["2K"]) }));
}

function normalizedImageSettingForModel(model, field, value) {
  const capabilities = imageModelCapabilities(model);
  if (field === "image.aspectRatio") {
    return capabilities.aspectRatios.includes(value) ? value : capabilities.aspectRatios[0] || "9:16";
  }
  if (field === "image.resolution") {
    const normalized = String(value || "").trim().toUpperCase();
    if (!capabilities.resolutions.length) return "";
    return capabilities.resolutions.includes(normalized) ? normalized : capabilities.resolutions[0] || "2K";
  }
  return value;
}

function imageGenerateConsole(p, selectedModel) {
  const avatar = selectedImageReference("avatar");
  const product = selectedImageReference("product");
  const promptImage = p.image?.promptImage || null;
  const unitCredit = imageModelCredit(selectedModel);
  const selectedCount = imageBatchCount(p);
  const credit = (unitCredit * selectedCount).toFixed(2);
  const promptText = String(p.image?.prompt || "");
  const longPromptClass = promptText.length > 120 || promptText.includes("\n") ? "has-long-prompt" : "";
  const enhanceLabel = state.promptAdvancedEnabled ? "Enhance on" : "Enhance off";
  const aspectRatioOptions = imageModelCapabilities(selectedModel).aspectRatios;
  const selectedAspectRatio = normalizedImageSettingForModel(selectedModel, "image.aspectRatio", p.image.aspectRatio);
  const resolutionOptions = imageResolutionOptionsForModel(selectedModel);
  const selectedResolution = normalizedImageSettingForModel(selectedModel, "image.resolution", p.image.resolution);
  const promptSummary = String(p.image.prompt || "").trim();
  const compactSummary = imageCompactPromptText(promptSummary);
  return `<section class="image-generate-console ${longPromptClass}" data-image-generate-console>
    <div class="image-console-main">
      <div class="image-console-prompt ${promptImage ? "has-prompt-image" : ""}" data-image-console-prompt-zone>
        <label class="image-prompt-insert" title="Insert image">
          ${icon("plus", 24)}
          <input type="file" data-upload="image-prompt" accept="image/*" hidden>
        </label>
        ${promptImage ? imagePromptMediaPreview(promptImage) : `<textarea data-field="image.prompt" data-image-console-prompt rows="2" placeholder="Describe your image">${esc(p.image.prompt || "")}</textarea>`}
      </div>
      <div class="image-console-compact-summary" data-image-compact-summary aria-hidden="true">${esc(compactSummary)}</div>
      <div class="image-console-tools">
        <div class="image-model-enhance-group">
          ${imageModelPicker(selectedModel)}
        <button class="image-prompt-enhance ${state.promptAdvancedEnabled ? "is-active" : ""}" type="button" data-action="toggle-prompt-advanced" aria-label="${esc(enhanceLabel)}" aria-pressed="${state.promptAdvancedEnabled ? "true" : "false"}" title="${esc(enhanceLabel)}" ${state.promptAdvancedBusy ? "disabled" : ""}>${icon("wand", 17)}</button>
        </div>
        ${imageAspectRatioPicker(selectedAspectRatio, aspectRatioOptions)}
        ${resolutionOptions.length ? imageResolutionPicker(selectedResolution, resolutionOptions) : ""}
        <div class="image-count-stepper" aria-label="Images to generate">
          <button type="button" data-action="image-count-down" aria-label="Generate fewer images" ${selectedCount <= 1 ? "disabled" : ""}>${icon("minus", 15)}</button>
          <span><b data-image-count-current>${selectedCount}</b><small>/4</small></span>
          <button type="button" data-action="image-count-up" aria-label="Generate more images" ${selectedCount >= 4 ? "disabled" : ""}>${icon("plus", 15)}</button>
        </div>
      </div>
    </div>
    <div class="image-console-references">
      ${imageReferenceThumb("avatar", avatar, "Avatar")}
      ${imageReferenceThumb("product", product, "Product")}
    </div>
    <button class="image-console-generate" type="button" data-action="generate-image" ${state.generating ? "aria-busy=\"true\"" : ""}>
      ${icon(state.generating ? "loader-circle" : "send", 20)}
      <b>${state.generating ? "Queuing" : t("generateImage")}</b>
      <small data-image-credit-label>${state.generating ? "You can keep typing" : `${credit} Credit`}</small>
    </button>
  </section>`;
}

function imageResolutionPicker(selectedResolution, options = []) {
  const selected = options.find((item) => item.value === selectedResolution) || options[1] || options[0];
  return `<details class="image-resolution-select image-resolution-menu">
    <summary aria-label="Select quality">
      ${icon("gem", 15)}
      <b data-resolution-current>${esc(selected?.title || "2k")}</b>
      ${icon("chevron-down", 16)}
    </summary>
    <div class="image-resolution-options" role="listbox" aria-label="Select quality">
      <div class="image-resolution-menu-title">Select quality</div>
      ${options.map((item) => {
        const active = item.value === selectedResolution;
        return `<div class="image-resolution-option ${active ? "active" : ""}" data-field-set="image.resolution" data-value="${esc(item.value)}" data-label="${esc(item.title)}" role="option" aria-selected="${active ? "true" : "false"}" tabindex="0">
          <span class="image-resolution-option-copy">
            <b>${esc(item.title)} <em>${esc(item.badge)}</em></b>
          </span>
          <span class="image-resolution-option-check" aria-hidden="true">${icon("check", 18)}</span>
        </div>`;
      }).join("")}
    </div>
  </details>`;
}

function aspectRatioGlyph(value = "9:16") {
  const [w = 9, h = 16] = String(value).split(":").map((item) => Number(item) || 1);
  const isWide = w > h;
  const maxSide = 22;
  const minSide = 10;
  const width = isWide ? maxSide : Math.max(minSide, Math.round(maxSide * (w / h)));
  const height = isWide ? Math.max(minSide, Math.round(maxSide * (h / w))) : maxSide;
  return `<span class="aspect-ratio-glyph" aria-hidden="true" style="--ratio-icon-width:${width}px;--ratio-icon-height:${height}px"></span>`;
}

function aspectRatioDescription(value = "9:16") {
  const descriptions = {
    "9:16": "Vertical shorts and mobile-first posts",
    "3:4": "Tall product or portrait scenes",
    "2:3": "Editorial vertical compositions",
    "1:1": "Square social feed images",
    "4:3": "Classic landscape product frames",
    "16:9": "Wide banners and video covers",
    "3:2": "Photo-style horizontal images"
  };
  return descriptions[value] || "Custom image composition";
}

function imageAspectRatioPicker(selectedAspectRatio, options = []) {
  return `<details class="image-aspect-ratio-select image-aspect-ratio-menu">
    <summary aria-label="Aspect ratio">
      ${icon("crop", 15)}
      <b>${esc(selectedAspectRatio)}</b>
      ${icon("chevron-down", 16)}
    </summary>
    <div class="image-aspect-ratio-options" role="listbox" aria-label="Aspect ratio">
      <div class="image-aspect-ratio-menu-title">Aspect ratio</div>
      ${options.map((value) => `<button type="button" class="${value === selectedAspectRatio ? "active" : ""}" data-field-set="image.aspectRatio" data-value="${esc(value)}" role="option" aria-selected="${value === selectedAspectRatio ? "true" : "false"}">
        ${aspectRatioGlyph(value)}
        <span class="image-aspect-ratio-option-copy">
          <b>${esc(value)}</b>
          <small>${esc(aspectRatioDescription(value))}</small>
        </span>
        <span class="image-aspect-ratio-option-check">${icon("check", 20)}</span>
      </button>`).join("")}
    </div>
  </details>`;
}

function bindAspectRatioFloatingMenus() {
  document.querySelectorAll(".image-aspect-ratio-menu summary").forEach((summary) => {
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openAspectRatioPopover(summary);
    });
  });
}

function closeAspectRatioPopover() {
  aspectRatioPopoverCleanup?.();
  aspectRatioPopoverCleanup = null;
  document.querySelector(".floating-aspect-ratio-options")?.remove();
  document.querySelectorAll(".image-aspect-ratio-menu[open]").forEach((el) => el.removeAttribute("open"));
  document.querySelectorAll(".image-generate-console.has-open-menu").forEach((consoleEl) => {
    const hasOpenDetails = consoleEl.querySelector(".image-model-picker[open],.image-resolution-menu[open],.image-aspect-ratio-menu[open]");
    if (!hasOpenDetails) consoleEl.classList.remove("has-open-menu");
  });
}

function openAspectRatioPopover(summary) {
  const source = summary.closest(".image-aspect-ratio-menu");
  const sourceId = source?.dataset.popoverSource || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (!source) return;
  source.dataset.popoverSource = sourceId;
  const options = [...source.querySelectorAll(".image-aspect-ratio-options [data-field-set]")]
    .map((button) => ({
      value: button.dataset.value || "",
      active: button.classList.contains("active")
    }))
    .filter((item) => item.value);
  if (!options.length) return;
  const existing = document.querySelector(".floating-aspect-ratio-options");
  if (existing?.dataset.sourceId === sourceId) {
    closeAspectRatioPopover();
    return;
  }
  closeAspectRatioPopover();
  const consoleEl = source.closest(".image-generate-console");
  consoleEl?.querySelectorAll(".image-model-picker[open],.image-resolution-menu[open]").forEach((el) => el.removeAttribute("open"));
  source.removeAttribute("open");
  consoleEl?.classList.add("has-open-menu", "is-hover-expanded");
  consoleEl?.classList.remove("is-compact");
  const popover = document.createElement("div");
  popover.className = "image-aspect-ratio-options floating-aspect-ratio-options";
  popover.dataset.sourceId = sourceId;
  popover.setAttribute("role", "listbox");
  popover.setAttribute("aria-label", "Aspect ratio");
  popover.innerHTML = `<div class="image-aspect-ratio-menu-title">Aspect ratio</div>${options.map((item) => `<button type="button" class="${item.active ? "active" : ""}" data-field-set="image.aspectRatio" data-value="${esc(item.value)}" role="option" aria-selected="${item.active ? "true" : "false"}">
    ${aspectRatioGlyph(item.value)}
    <span class="image-aspect-ratio-option-copy">
      <b>${esc(item.value)}</b>
      <small>${esc(aspectRatioDescription(item.value))}</small>
    </span>
    <span class="image-aspect-ratio-option-check">${icon("check", 20)}</span>
  </button>`).join("")}`;
  document.body.appendChild(popover);
  window.lucide?.createIcons();
  const place = () => {
    const rect = summary.getBoundingClientRect();
    const width = Math.max(188, popover.offsetWidth || 188);
    const height = popover.offsetHeight || 520;
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left + rect.width / 2 - width / 2));
    const top = rect.top - height - 10 > 12 ? rect.top - height - 10 : Math.min(window.innerHeight - height - 12, rect.bottom + 10);
    popover.style.left = `${left}px`;
    popover.style.top = `${Math.max(12, top)}px`;
  };
  place();
  popover.querySelectorAll("button").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stabilizeImageConsoleExpansion(1000);
    saveProjectFieldQuick("image.aspectRatio", button.dataset.value, button);
    closeAspectRatioPopover();
  }));
  const closeOnOutside = (event) => {
    if (popover.contains(event.target) || source.contains(event.target)) return;
    closeAspectRatioPopover();
  };
  const closeOnEscape = (event) => {
    if (event.key === "Escape") closeAspectRatioPopover();
  };
  setTimeout(() => document.addEventListener("pointerdown", closeOnOutside, { capture: true }), 0);
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, true);
  document.addEventListener("keydown", closeOnEscape);
  aspectRatioPopoverCleanup = () => {
    document.removeEventListener("pointerdown", closeOnOutside, { capture: true });
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, true);
    document.removeEventListener("keydown", closeOnEscape);
  };
}

function imageModelCredit(model = "") {
  return model === "Nano Banana Pro" ? 0.2 : 0.15;
}

function imageModelOptions() {
  return [
    {
      value: "GPT Image 2",
      provider: "openai",
      title: "GPT Image 2",
      description: "4K images with strong text rendering",
      badge: "NEW"
    },
    {
      value: "Seedream 5.0 Lite",
      provider: "seedream",
      title: "Seedream 5.0 Lite",
      description: "Fast image generation for high-quality creative visuals",
      badge: ""
    },
    {
      value: "Seedream 4.5",
      provider: "seedream",
      title: "Seedream 4.5",
      description: "Advanced image generation for polished commercial shots",
      badge: ""
    },
    {
      value: "Nano Banana Pro",
      provider: "google",
      title: "Nano Banana Pro",
      description: "Flagship image generation model for premium visuals",
      badge: ""
    },
    {
      value: "Nano Banana 2",
      provider: "google",
      title: "Nano Banana 2",
      description: "Next-generation image model for flexible visual creation",
      badge: ""
    },
    {
      value: "Grok Imagine",
      provider: "xai",
      title: "Grok Imagine",
      description: "Expressive image generation for creative concepts",
      badge: ""
    }
  ];
}

function imagePromptMediaPreview(item = {}) {
  return `<div class="image-prompt-media-preview">
    <img src="${esc(item.dataUrl || "")}" alt="${esc(item.name || "Prompt image")}" loading="lazy">
    <span>
      <b>${esc(item.name || "Pasted image")}</b>
      <small>Image mode</small>
    </span>
    <button type="button" data-action="clear-image-prompt-media" aria-label="Remove prompt image">${icon("x", 14)}</button>
  </div>`;
}

function imageModelPicker(selectedModel) {
  const models = imageModelOptions();
  const selected = models.find((item) => item.value === selectedModel) || models[0];
  return `<details class="image-model-picker">
    <summary aria-label="Select image model">
      <span class="image-model-current-icon" data-image-model-current-icon>${providerLogo(selected.provider)}</span>
      <span class="image-model-current-text"><b>${esc(selected.title)}</b></span>
      ${icon("chevron-down", 15)}
    </summary>
    <div class="image-model-menu">
      <div class="image-model-menu-title"><span>Featured models</span></div>
      ${models.map((item) => {
        const active = item.value === selectedModel;
        return `<button class="image-model-option ${active ? "active" : ""}" type="button" data-image-model-option="${esc(item.value)}" aria-pressed="${active ? "true" : "false"}">
          <span class="image-model-option-icon">${providerLogo(item.provider)}</span>
          <span class="image-model-option-copy">
            <b>
              <span>${esc(item.title)}</span>
              ${item.badge ? ` <em>${esc(item.badge)}</em>` : ""}
            </b>
            <small>${esc(item.description)}</small>
          </span>
          <span class="image-model-option-check" aria-hidden="true">${active ? icon("check", 18) : ""}</span>
        </button>`;
      }).join("")}
    </div>
  </details>`;
}

function providerLogo(provider) {
  if (provider === "google") {
    return `<span class="provider-logo provider-logo-google" aria-hidden="true">G</span>`;
  }
  if (provider === "seedream") {
    return `<span class="provider-logo provider-logo-seedream" aria-hidden="true">S</span>`;
  }
  if (provider === "xai") {
    return `<span class="provider-logo provider-logo-xai" aria-hidden="true">X</span>`;
  }
  return `<span class="provider-logo provider-logo-openai" aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 2.4a5.2 5.2 0 0 1 4.55 2.64 5.28 5.28 0 0 1 3.05 8.21 5.24 5.24 0 0 1-5.15 6.34A5.24 5.24 0 0 1 6 18.96a5.28 5.28 0 0 1-3.06-8.2A5.24 5.24 0 0 1 8.1 4.42 5.18 5.18 0 0 1 12 2.4Zm3.26 3.58a3.4 3.4 0 0 0-5.54-1.18l-.2.18 5.2 3 .54-2Zm-7.9.42a3.4 3.4 0 0 0-3.3 4.23l.07.26 5.2-3-1.97-1.49Zm10.02 2.42-.06.26-5.2 3 1.97 1.5a3.4 3.4 0 0 0 3.29-4.76ZM6.6 10.42l-.54 2a3.4 3.4 0 0 0 5.54 1.18l.2-.18-5.2-3Zm8.08 5.69-5.2-3-.54 2a3.4 3.4 0 0 0 5.54 1.18l.2-.18Zm-2.68-6.4-2.24 1.29 2.24 1.29 2.24-1.29L12 9.71Z"/>
    </svg>
  </span>`;
}

function imageReferenceField(kind) {
  return kind === "product" ? "image.productAttachmentId" : "image.avatarAttachmentId";
}

function setPendingImageReference(field, id, attachment = null) {
  state.imageReferencePending = {
    ...(state.imageReferencePending || {}),
    [field]: { projectId: state.projectId, id, attachment }
  };
}

function clearPendingImageReference(field, projectId = state.projectId) {
  const pending = { ...(state.imageReferencePending || {}) };
  if (pending[field]?.projectId === projectId) delete pending[field];
  state.imageReferencePending = pending;
}

function selectedImageReference(kind) {
  const field = imageReferenceField(kind);
  const pending = state.imageReferencePending?.[field];
  const hasPending = pending?.projectId === state.projectId;
  const selectedId = hasPending ? pending.id : kind === "avatar" ? project().image?.avatarAttachmentId : project().image?.productAttachmentId;
  if (!selectedId) return null;
  return hasPending && pending.attachment ? pending.attachment : (state.db.attachments || []).find((item) => item.id === selectedId) || null;
}

function imageReferenceThumb(kind, item, emptyLabel) {
  const label = kind === "avatar" ? "Avatar" : "Product";
  const displayLabel = emptyLabel || label;
  const preview = item ? attachmentPreview(item) : `<span class="image-reference-empty-icon">${icon(kind === "avatar" ? "circle-user-round" : "package", 34)}</span>`;
  const clearButton = item ? `<span class="image-reference-clear" role="button" tabindex="0" data-action="clear-image-reference" data-attachment-kind="${esc(kind)}" aria-label="${esc("Remove selected photo")}">${icon("x", 13)}</span>` : "";
  return `<button class="image-reference-thumb ${item ? "has-ref" : "is-empty-ref"}" type="button" data-action="open-attachment-picker" data-attachment-kind="${esc(kind)}" data-reference-label="${esc(displayLabel)}" aria-label="${esc(item ? `Change ${displayLabel}` : `Add ${displayLabel}`)}">
    ${preview}
    ${clearButton}
    ${item ? "" : `<div><b>${esc(displayLabel)}</b></div>`}
  </button>`;
}

function patchImageReferencesDom() {
  const references = document.querySelector(".image-higgsfield-mode .image-console-references");
  if (!references || !state.db || !state.projectId) return;
  references.innerHTML = `
    ${imageReferenceThumb("avatar", selectedImageReference("avatar"), "Avatar")}
    ${imageReferenceThumb("product", selectedImageReference("product"), "Product")}
  `;
  references.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", (event) => action(event, el.dataset.action));
  });
  window.lucide?.createIcons();
}

function closeModalDom() {
  state.modal = null;
  document.querySelector(".modal-backdrop")?.remove();
}

function virtualizePanel() {
  const promptText = "Recreate the uploaded poster/ad design using the uploaded real product photo. Keep the exact poster composition, lighting direction, typography space, product details, labels, and packaging. Replace only the placeholder product with the real product, make it commercial and ready for TikTok Shop.";
  return `
    <section class="virtualize-card">
      <div class="virtualize-head">
        <h2>🎨 Virtualize</h2>
        <span>Upload existing poster/ad + product</span>
      </div>
      <div class="virtualize-grid">
        ${virtualizeUpload("Poster / Ad Image", "Upload existing poster or ad design", "🖼️", "poster")}
        ${virtualizeUpload("Product Photo", "Upload real product photo", "📦", "product")}
      </div>
      <p class="virtualize-note">AI will recreate the poster design with your actual product. Keep exact product details, labels, and packaging.</p>
      <button class="virtualize-example" type="button" data-image-preset="${esc(promptText)}">View Example Prompt</button>
    </section>`;
}

function virtualizeUpload(title, main, emoji, kind) {
  return `<div class="virtualize-upload"><p>${title}</p><label class="drop-zone virtualize-drop"><input type="file" data-upload="${kind}" hidden><span>${emoji}</span><strong>${main}</strong></label></div>`;
}

function imagePromptSettings(p) {
  const active = imagePromptPresets[state.imagePromptGroup] || imagePromptPresets.avatar;
  return `
    <section class="prompt-settings">
      <h2>✏️ Prompt & Settings</h2>
      <div class="prompt-mode-tabs" aria-label="Image prompt modes">
        ${Object.entries(imagePromptPresets).map(([id, item]) => `<button class="${state.imagePromptGroup === id ? "active" : ""}" type="button" data-prompt-group="${id}">${icon(item.icon, 19)} ${item.label}</button>`).join("")}
      </div>
      <div class="preset-groups">
        ${active.groups.map(([title, presets]) => `
          <div class="preset-row">
            <p>${title}</p>
            <div>
              ${presets.map(([label, color, text]) => `<button class="${p.image.prompt === text ? "active" : ""}" style="--preset-color:${color}" type="button" data-image-preset="${esc(text)}">${label}</button>`).join("")}
            </div>
          </div>`).join("")}
      </div>
      ${prompt("image.prompt", p.image.prompt, "Describe your scene, or click a preset above for ready-made TikTok affiliate prompts.", "generate-image", t("generateImage"))}
    </section>`;
}

const ugcBuilderShotOptions = {
  "Medium": "Medium shot, waist up",
  "Close-up": "Close-up shot, face and product clearly visible",
  "Wide": "Wide shot showing creator, product, and room context",
  "Selfie": "Selfie-style handheld shot, creator speaking close to camera",
  "Low Angle": "Low angle shot, confident creator pose, product feels important",
  "Over Shoulder": "Over-shoulder shot showing creator using the product from a natural POV",
  "Product ECU": "Extreme close-up on product texture, label, and usage detail",
  "Arc/Circle": "Slow arc/circle camera movement around creator and product"
};

const ugcBuilderActionOptions = {
  "Hold + Smile": "She holds the product in her right hand facing the camera, smiles naturally, and speaks directly to camera with gentle hand gestures.",
  "Demo": "She demonstrates how to use the product step by step, keeps the product visible, and explains the key benefit naturally.",
  "Unbox": "She opens the parcel, takes out the product, reacts with a natural smile, and shows the product clearly to camera.",
  "Use": "She uses the product in a real daily routine, shows the result or practical benefit, and keeps the motion natural."
};

const ugcBuilderClosingOptions = ["Order sekarang", "Tekan bawah", "COD", "Jom cuba", "Link bawah"];

const ugcBuilderToneOptions = {
  "Santai": "relaxed and casual",
  "Excited": "energetic and excited",
  "Confident": "clear and confident",
  "Friendly": "warm and friendly",
  "Urgent": "direct with light urgency",
  "Storytelling": "storytelling and natural"
};

const ugcBuilderVoiceOptions = {
  "Perempuan 20an": "young Malay woman voice in her 20s, cheerful and trendy",
  "Makcik": "warm makcik voice, trustworthy and familiar",
  "Nenek": "gentle nenek voice, caring and sincere",
  "Lelaki 20an": "young Malaysian male voice in his 20s, casual and energetic",
  "Pakcik": "friendly pakcik voice, practical and believable",
  "Atuk": "calm atuk voice, patient and wise",
  "Kanak Perempuan": "young girl voice, bright and innocent",
  "Kanak Lelaki": "young boy voice, playful and clear"
};

const ugcBuilderStyleOptions = {
  "Cinematic": "Soft natural lighting, shallow depth of field, cinematic film look, audio dialogue only, clean vertical frame.",
  "UGC Raw": "Raw phone-recorded UGC look, realistic handheld movement, natural home lighting, authentic creator review style.",
  "Golden Hour": "Warm golden-hour light, soft glow, lifestyle upgrade feeling, clean vertical social commerce frame.",
  "Moody": "Moody indoor lighting, subtle contrast, premium product focus, realistic creator performance.",
  "Studio": "Bright studio lighting, clean background, sharp product visibility, polished TikTok Shop review style."
};

function ugcPanel(p) {
  const meta = studioStepMeta("ugc");
  const bulkSelecting = isBulkSelectingResults();
  const wall = studioResultWall(p, meta);
  return `<section class="video-page-studio video-prompt-extractor-page studio-wall-zoomable ${wall ? "" : "is-empty"} ${bulkSelecting ? "is-bulk-selecting-results" : ""}" data-studio-mode="ugc" ${studioWallZoomStyleAttr()}>
    ${studioWallZoomControl()}
    ${wall || videoEmptyStudioBackdrop()}
    ${bulkSelecting ? "" : videoGenerateConsole(p)}
  </section>`;
}

function videoEmptyStudioBackdrop() {
  return `<section class="video-empty-cinema" aria-label="Video studio">
    <div class="video-empty-cinema-frame">
      <span>CINEMA STUDIO 3.5</span>
      <h2>What would you shoot<br>with infinite budget?</h2>
    </div>
  </section>`;
}

function videoBatchCount(p = project()) {
  const count = Number.parseInt(p?.ugc?.count, 10);
  if (!Number.isFinite(count)) return 1;
  return Math.min(4, Math.max(1, count));
}

function videoDurationValue(p = project()) {
  const value = String(p?.ugc?.duration || "12s");
  return ["5s", "8s", "12s"].includes(value) ? value : "12s";
}

function videoAspectRatioValue(p = project()) {
  const value = String(p?.ugc?.aspectRatio || p?.image?.aspectRatio || "16:9");
  return ["9:16", "16:9", "1:1", "4:3", "3:4"].includes(value) ? value : "16:9";
}

function videoQualityValue(p = project()) {
  const value = String(p?.ugc?.quality || "720p").toLowerCase();
  return ["480p", "720p", "1080p"].includes(value) ? value : "720p";
}

function videoAudioValue(p = project()) {
  return String(p?.ugc?.audio || "On").toLowerCase() === "off" ? "Off" : "On";
}

function videoModelValue(p = project()) {
  const value = String(p?.ugc?.provider || "Seedance 2.0 Fast");
  if (/sora/i.test(value)) return "Sora 2";
  if (/veo/i.test(value)) return "Veo 3.1";
  if (/wan/i.test(value)) return "Wan 2.7";
  if (/kling.*motion|motion.*kling/i.test(value)) return "Kling V3 Motion Control";
  if (/kling.*omni|omni.*kling/i.test(value)) return "Kling V3 Omni";
  if (/hailuo|minimax/i.test(value)) return "MiniMax Hailuo 2.3";
  if (/seedance/i.test(value)) return "Seedance 2.0 Fast";
  return "Seedance 2.0 Fast";
}

function videoCreditEstimate(p = project()) {
  const duration = Number.parseInt(videoDurationValue(p), 10) || 12;
  const qualityMultiplier = videoQualityValue(p) === "1080p" ? 1.35 : videoQualityValue(p) === "480p" ? 0.78 : 1;
  const audioMultiplier = videoAudioValue(p) === "Off" ? 0.92 : 1;
  const unit = Math.max(0.15, (duration / 12) * 0.6 * qualityMultiplier * audioMultiplier);
  return (unit * videoBatchCount(p)).toFixed(2);
}

function videoGenerateConsole(p) {
  const promptText = String(p.ugc?.script || "");
  const longPromptClass = promptText.length > 120 || promptText.includes("\n") ? "has-long-prompt" : "";
  return `<section class="video-generate-console ${longPromptClass}" data-video-generate-console>
    <div class="video-console-main">
      <div class="video-console-prompt" data-video-console-prompt-zone>
        <button class="video-prompt-insert" type="button" data-action="open-attachment-picker" data-attachment-kind="product" title="Add video reference" aria-label="Add video reference">
          ${icon("plus", 24)}
        </button>
        <textarea data-field="ugc.script" data-video-console-prompt rows="2" placeholder="Describe the video you want to create...">${esc(p.ugc?.script || "")}</textarea>
        <button class="video-prompt-enhance ${state.promptAdvancedEnabled ? "is-active" : ""}" type="button" data-action="toggle-prompt-advanced" aria-label="${state.promptAdvancedEnabled ? "Enhance on" : "Enhance off"}" aria-pressed="${state.promptAdvancedEnabled ? "true" : "false"}" title="Prompt enhance" ${state.promptAdvancedBusy ? "disabled" : ""}>${icon("wand", 17)}</button>
      </div>
      <div class="video-console-tools">
        ${videoOptionMenu("model", "ugc.provider", videoModelValue(p), [
          ["Seedance 2.0 Fast", "Seedance 2.0 Fast"],
          ["Veo 3.1", "Veo 3.1"],
          ["Sora 2", "Sora 2"],
          ["Wan 2.7", "Wan 2.7"],
          ["Kling V3 Omni", "Kling Omni"],
          ["Kling V3 Motion Control", "Kling Motion"],
          ["MiniMax Hailuo 2.3", "Hailuo 2.3"]
        ], "audio-lines")}
        ${videoOptionMenu("ratio", "ugc.aspectRatio", videoAspectRatioValue(p), ["16:9", "9:16", "1:1", "4:3", "3:4"].map((value) => [value, value]), "rectangle-horizontal")}
        ${videoOptionMenu("quality", "ugc.quality", videoQualityValue(p), ["480p", "720p", "1080p"].map((value) => [value, value]), "gem")}
        ${videoOptionMenu("duration", "ugc.duration", videoDurationValue(p), ["5s", "8s", "12s"].map((value) => [value, value]), "clock-3")}
        ${videoCountStepper(p)}
        ${videoOptionMenu("audio", "ugc.audio", videoAudioValue(p), [["On", "On"], ["Off", "Off"]], videoAudioValue(p) === "Off" ? "volume-x" : "volume-2")}
      </div>
    </div>
    <button class="video-console-generate" type="button" data-action="generate-ugc" ${state.generating ? "aria-busy=\"true\" disabled" : ""}>
      ${icon(state.generating ? "loader-circle" : "send", 22)}
      <b>${state.generating ? "Queuing" : "Generate Video"}</b>
      <small data-video-credit-label>${state.generating ? "You can keep typing" : `${videoCreditEstimate(p)} Credit`}</small>
    </button>
  </section>`;
}

function videoOptionMenu(kind, field, selectedValue, options = [], iconName = "circle") {
  return `<details class="video-option-menu video-option-${esc(kind)}">
    <summary aria-label="${esc(kind)}">
      ${icon(iconName, 18)}
      <b data-video-option-current="${esc(field)}">${esc(selectedValue)}</b>
      ${icon("chevron-down", 16)}
    </summary>
    <div class="video-option-list" role="listbox" aria-label="${esc(kind)}">
      ${options.map(([value, label]) => `<button type="button" class="${value === selectedValue ? "active" : ""}" data-field-set="${esc(field)}" data-value="${esc(value)}" role="option" aria-selected="${value === selectedValue ? "true" : "false"}">${esc(label)}</button>`).join("")}
    </div>
  </details>`;
}

function videoCountStepper(p = project()) {
  const selectedCount = videoBatchCount(p);
  return `<div class="video-count-stepper" aria-label="Videos to generate">
    <button type="button" data-action="video-count-down" aria-label="Generate fewer videos" ${selectedCount <= 1 ? "disabled" : ""}>${icon("minus", 15)}</button>
    <span><b data-video-count-current>${selectedCount}</b><small>/4</small></span>
    <button type="button" data-action="video-count-up" aria-label="Generate more videos" ${selectedCount >= 4 ? "disabled" : ""}>${icon("plus", 15)}</button>
  </div>`;
}

function ugcProductReferences(provider) {
  return `
      <div class="ugc-reference-grid">
        <div>
          <p class="ugc-reference-title">Avatar Reference</p>
          <div class="ugc-reference-row">
            <label class="ugc-avatar-drop"><input type="file" data-upload="avatar" hidden><span>👤</span></label>
            <div class="ugc-reference-actions">
              <label><input type="file" data-upload="avatar" hidden>Attachments</label>
              <button type="button">x</button>
            </div>
          </div>
        </div>
        <div>
          <p class="ugc-reference-title product">Product Reference (0/3)</p>
          <div class="ugc-product-row">
            ${[1, 2, 3].map((index) => `<label class="ugc-product-slot"><input type="file" data-upload="product-${index}" hidden><span>${index}</span></label>`).join("")}
            <div class="ugc-reference-actions">
              <label><input type="file" data-upload="product" hidden>Attachments</label>
              <button type="button">🔍 Scrape ·10¢</button>
            </div>
          </div>
        </div>
      </div>
      <p class="ugc-scene-note">Both optional. Pick up to 3 products; each picked image is sent as a distinct reference to ${esc(provider.split(" ")[0])}.</p>`;
}

function ugcFrameReferences() {
  return `
      <div class="ugc-frame-grid">
        <div>
          <p class="ugc-reference-title">Start Frame *</p>
          <div class="ugc-frame-row">
            ${ugcFrameUpload("start-frame", "🖼️", true)}
            <div class="ugc-reference-actions">
              <label><input type="file" data-upload="start-frame" hidden>Attachments</label>
              <button type="button">x</button>
            </div>
          </div>
        </div>
        <div>
          <p class="ugc-reference-title muted">End Frame</p>
          <div class="ugc-frame-row">
            ${ugcFrameUpload("end-frame", "🏁", false)}
            <div class="ugc-reference-actions">
              <label><input type="file" data-upload="end-frame" hidden>Attachments</label>
              <button type="button">x</button>
            </div>
          </div>
        </div>
      </div>
      <p class="ugc-scene-note">Upload a required start frame. End frame is optional when you want the animation to land on a specific final image.</p>`;
}

function ugcFrameUpload(kind, emoji, required) {
  return `<label class="ugc-frame-drop ${required ? "required" : ""}"><input type="file" data-upload="${kind}" hidden><span>${emoji}</span></label>`;
}

function ugcTextOnlyNotice() {
  return `<div class="ugc-text-only">📝 Text only — no image needed</div>`;
}

function videoProviderButton(value, label, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="ugc.provider" data-value="${esc(value)}">${label}</button>`;
}

function wordCount(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function autoPanel(p) {
  const source = p.auto.source || "Affiliate";
  const provider = p.auto.provider || "Veo 3.1";
  const planStyle = p.auto.planStyle || "Normal Flow";
  const duration = p.auto.duration || "8s";
  const size = p.auto.size || "9:16";
  const ctaMode = p.auto.ctaMode || "Shop CTA";
  const quantity = String(p.auto.quantity || "5");
  const selectedFrameworks = Array.isArray(p.auto.frameworks) ? p.auto.frameworks : [];
  const frameworks = autoFrameworks();
  return studioImmersiveShell(p, "auto", `
    <section class="auto-content-card auto-command-card">
      <div class="auto-content-head">
        <h2>${icon("wand-sparkles", 26)} Product Scanner</h2>
        <span>AI → IMAGE → VIDEO → MERGE</span>
      </div>
      <div class="auto-source-tabs">
        ${autoButton("auto.source", "Affiliate", "🔗 Affiliate", source)}
        ${autoButton("auto.source", "Manual Product", "📦 Manual Product", source)}
      </div>
      <label class="auto-product-picker">
        <input data-field="auto.productUrl" value="${esc(p.auto.productUrl)}" placeholder="Pick a product from the dropdown →">
        <span>🕐 <b>0</b></span>
      </label>
      <p class="auto-helper">Untuk Fetch Buka Extension Auto Post Tab Affiliate</p>
      <div class="auto-persona-card form-grid three">
        ${select("auto.gender", "Gender", ["Female", "Male"], p.auto.gender || "Female")}
        ${select("auto.style", "Style", ["Hijab", "No Hijab", "Casual", "Professional"], p.auto.style || "Hijab")}
        ${select("auto.age", "Age", ["20s", "30s", "40s (Makcik)", "55+ (Nenek)"], p.auto.age || "30s")}
      </div>
      <p class="field-label">Provider</p>
      <div class="auto-provider-grid">
        ${autoButton("auto.provider", "Veo 3.1", "🎬 Veo 3.1", provider)}
        ${autoButton("auto.provider", "Sora 2", "⚡ Sora 2", provider)}
        ${autoButton("auto.provider", "GeminiOmni", "🔷 Pokaya AI", provider)}
      </div>
      <div class="auto-duration-row">
        ${autoButton("auto.duration", "8s", "8s (1 shot)", duration)}
        ${autoButton("auto.duration", "16s", "16s (2 shots)", duration)}
      </div>
      <label class="auto-size-field">Size${select("auto.size", "", ["9:16", "16:9", "1:1"], size)}</label>
      <p class="field-label">Plan Style</p>
      <div class="auto-plan-grid">
        ${autoPlanButton("Normal Flow", "AI plans the batch from selected frameworks.", planStyle)}
        ${autoPlanButton("Custom Idea", "Start from your own idea, then create variants.", planStyle, true)}
      </div>
      <p class="field-label">Frameworks <small>(pick up to 5 angles)</small></p>
      <div class="auto-framework-grid">
        ${frameworks.map((item) => autoFrameworkChip(item, selectedFrameworks)).join("")}
      </div>
      <section class="auto-cta-card">
        <p class="field-label">CTA Mode <small>(last 2 seconds)</small></p>
        <div class="auto-cta-list">
          ${autoChoiceCard("auto.ctaMode", "Shop CTA", "🛒 SHOP CTA", "\"Tekan beg kuning\" style ending with rotating variants.", ctaMode)}
          ${autoChoiceCard("auto.ctaMode", "Custom CTA", "✏️ CUSTOM CTA", "Use your own closing line or promotion instruction.", ctaMode)}
          ${autoChoiceCard("auto.ctaMode", "No CTA", "🚫 NO CTA", "Use the full video for content only.", ctaMode)}
        </div>
      </section>
      <div class="auto-submit-row">
        <label>Quantity${select("auto.quantity", "", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], quantity)}</label>
        <button class="gold-button auto-generate-button" data-action="generate-auto">${icon("video")} Generate</button>
      </div>
    </section>
    ${autoProcessLog(p)}
    ${autoHistoryPanel(p)}
  `);
}

function autoButton(field, value, label, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}">${label}</button>`;
}

function autoPlanButton(value, note, active, isNew = false) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="auto.planStyle" data-value="${esc(value)}">${isNew ? "<em>✨ NEW</em>" : ""}<b>${value}</b><span>${note}</span></button>`;
}

function autoChoiceCard(field, value, title, note, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}"><b>${title}</b><span>${note}</span></button>`;
}

function autoFrameworks() {
  return [
    ["UGC", "Hook + Pain (PAS)", "Pain, agitation, solution. Strong for problem-aware buyers."],
    ["PRD", "Product Hero (AIDA)", "Attention, interest, desire, action around the product."],
    ["UGC", "Testimonial", "Creator-style proof and personal recommendation."],
    ["UGC", "FOMO/Urgency", "Limited deal, stock, time, or trend pressure."],
    ["PRD", "Before/After", "Contrast the old situation with the product result."],
    ["UGC", "BAB (Before-After-Bridge)", "Show before state, after state, then bridge with product."],
    ["UGC", "4Ps (Promise-Picture-Proof-Push)", "Clear promise, visual example, proof, and CTA."],
    ["PRD", "USP Showcase", "Product-only highlight for one sharp selling point."],
    ["UGC", "Action Bias", "Push viewers to do one simple next action."],
    ["UGC", "Solution Focus", "Lead with solution and practical usefulness."],
    ["PRD", "Flat Lay / Aesthetic", "Clean product composition with lifestyle appeal."],
    ["UGC", "Benefit + Result", "Tie one feature to a visible buyer result."],
    ["UGC", "Fear of Loss", "Show what the buyer misses by not acting."],
    ["UGC", "UGC USP (Strict)", "Tight creator video around one unique claim."],
    ["PRD", "Product USP (Strict)", "Strict product-only USP breakdown."],
    ["POV", "PROD Goyang2 (Hand POV)", "Handheld product POV with energetic movement."]
  ];
}

function autoFrameworkChip([tag, label, info], selected = []) {
  const value = `${tag} ${label}`;
  const checked = selected.includes(value);
  const tagClass = tag === "UGC" ? "ugc-tag" : tag === "PRD" ? "prd-tag" : "pov-tag";
  return `<label class="${checked ? "selected" : ""}" title="${esc(info)}" data-auto-framework-card="${esc(value)}" role="checkbox" aria-checked="${checked ? "true" : "false"}" tabindex="0"><input type="checkbox" data-auto-framework-toggle="${esc(value)}" ${checked ? "checked" : ""}><span class="${tagClass}">${tag}</span><strong>${esc(label)}</strong><b>ⓘ</b></label>`;
}

function autoProcessLog(p) {
  const latest = (p.results || []).filter((item) => item.type === "auto").at(-1);
  return `<section class="auto-process-card">
    <header>${icon("clipboard-list", 18)} <b>Process Log</b></header>
    <pre>${latest ? esc(latest.body || latest.title || "Auto content batch created.") : "Process log will appear here..."}</pre>
  </section>`;
}

function autoHistoryPanel(p) {
  const items = p.results.filter((item) => item.type === "auto").slice(-8).reverse();
  return `<section class="auto-history-card">
    <header><h3>${icon("history", 18)} History — Product Scanner — ${esc(p.name)}</h3><span>${items.length} items</span></header>
    ${items.length ? `<div class="result-grid">${items.map(resultCard).join("")}</div>` : `<div class="viral-empty"><b>${icon("history", 28)}</b><strong>Belum ada history.</strong><span>Generate satu, ia akan muncul di sini.</span></div>`}
  </section>`;
}

function originalProviderValue(provider) {
  const aliases = {
    Grok: "Grok Imagine Video",
    Wan: "Wan 2.7",
    KlingOmni: "Kling V3 Omni",
    KlingMotion: "Kling V3 Motion Control",
    Hailuo: "MiniMax Hailuo 2.3",
    MiniMaxHailuo: "MiniMax Hailuo 2.3",
    GeminiOmni: "Gemini Omni"
  };
  return aliases[provider] || provider || "Veo 3.1";
}

function originalProviderLabel(provider) {
  const labels = {
    "Seedance 2.0": "Seedance",
    "Veo 3.1": "Veo",
    "Grok Imagine Video": "Grok",
    "Sora 2": "Sora",
    "Wan 2.7": "Wan",
    "Kling V3 Omni": "Kling Omni",
    "Kling V3 Motion Control": "Kling Motion",
    "MiniMax Hailuo 2.3": "Hailuo",
    "Gemini Omni": "Pokaya AI"
  };
  return labels[provider] || String(provider || "Video").split(" ")[0];
}

function originalProviderCredits(provider) {
  const credits = {
    "Seedance 2.0": "0.50",
    "Veo 3.1": "0.40",
    "Grok Imagine Video": "0.48",
    "Sora 2": "0.48",
    "Wan 2.7": "0.53",
    "Kling V3 Omni": "0.34",
    "Kling V3 Motion Control": "0.52",
    "MiniMax Hailuo 2.3": "0.29",
    "Gemini Omni": "1.30"
  };
  return credits[provider] || "0.40";
}

function originalPanel(p) {
  const provider = originalProviderValue(p.original.provider);
  const imageMode = p.original.imageMode || "Text only";
  const aspectRatio = p.original.aspectRatio || "9:16 (Vertical)";
  return studioImmersiveShell(p, "original", `
    <section class="original-video-card">
      <div class="original-video-head">
        <h2>🎞️ Original Video</h2>
        <p>Power-user raw video generator. Pick a provider — prompt sent 100% verbatim, no auto-locks or templates. Cascade fallback + history + deduct-on-success all work like other tabs.</p>
      </div>
      <p class="original-field-label">Provider</p>
      <div class="original-provider-grid">
        ${originalChoiceButton("original.provider", "Seedance 2.0", "🎞️ Seedance 2.0", provider)}
        ${originalChoiceButton("original.provider", "Veo 3.1", "🎬 Veo 3.1", provider)}
        ${originalChoiceButton("original.provider", "Grok Imagine Video", "⚡ Grok", provider)}
        ${originalChoiceButton("original.provider", "Sora 2", "✨ Sora 2", provider)}
        ${originalChoiceButton("original.provider", "Wan 2.7", "🌊 Wan 2.7", provider)}
        ${originalChoiceButton("original.provider", "Kling V3 Omni", "🎥 Kling Omni", provider)}
        ${originalChoiceButton("original.provider", "Kling V3 Motion Control", "🕹️ Kling Motion", provider)}
        ${originalChoiceButton("original.provider", "MiniMax Hailuo 2.3", "🎞️ Hailuo 2.3", provider)}
        ${originalChoiceButton("original.provider", "Gemini Omni", "🔷 Pokaya AI", provider)}
      </div>
      <p class="original-field-label">Image Mode</p>
      <div class="original-mode-grid">
        ${originalChoiceButton("original.imageMode", "Text only", "📝 Text only", imageMode)}
        ${originalChoiceButton("original.imageMode", "Start frame", "🖼️ Start frame", imageMode)}
        ${originalChoiceButton("original.imageMode", "References", "🧩 References", imageMode)}
      </div>
      <label class="original-prompt-field">
        <span>Prompt (sent verbatim — no auto-locks)</span>
        <textarea data-field="original.brief" placeholder="Describe the video — characters, action, mood, camera style, dialogue if any...">${esc(p.original.brief || "")}</textarea>
      </label>
      <div class="original-settings-grid">
        <label>
          <span>Aspect Ratio</span>
          <select data-field="original.aspectRatio">
            ${["9:16 (Vertical)", "1:1 (Square)", "16:9 (Landscape)"].map((item) => `<option ${item === aspectRatio ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
        <div>
          <span>Duration</span>
          <b>Fixed 8s</b>
        </div>
      </div>
      <button class="original-generate-button" data-action="analyze-original">🎬 Generate ${esc(originalProviderLabel(provider))} Video · ~${esc(originalProviderCredits(provider))} credits</button>
    </section>
  `);
}

function originalChoiceButton(field, value, label, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}">${label}</button>`;
}

function clonePanel(p) {
  const meta = studioStepMeta("clone");
  const wall = studioResultWall(p, meta);
  return `<section class="studio-immersive-page studio-wall-zoomable video-prompt-extractor-page ${wall ? "" : "is-empty"}" data-studio-mode="clone" ${studioWallZoomStyleAttr()}>
    ${studioWallZoomControl()}
    ${wall || ""}
    ${videoPromptExtractorDock(p)}
  </section>`;
}

function cloneReferenceVideo(p = project()) {
  return p?.clone?.referenceVideo || null;
}

function videoPromptExtractorEmpty() {
  return `<section class="studio-result-wall video-prompt-empty-wall">
    <div>
      ${icon("video", 34)}
      <b>Drop a reference video</b>
      <span>Pokaya AI will extract a reusable, timestamped video prompt.</span>
    </div>
  </section>`;
}

function videoPromptExtractorDock(p) {
  const video = cloneReferenceVideo(p);
  const hasVideo = Boolean(video?.dataUrl);
  const label = hasVideo ? video.name || "Reference video" : "Drop video here";
  const helper = hasVideo ? `${formatFileSize(video.size)} · Change` : "MP4, MOV, or WebM";
  const preview = hasVideo
    ? `<video src="${esc(video.dataUrl)}" muted playsinline preload="metadata"></video>`
    : `<span>${icon("video", 24)}</span>`;
  return `<section class="video-prompt-dock" data-drop-upload="clone-reference">
    <label class="video-prompt-upload ${hasVideo ? "has-video" : ""}">
      <input type="file" data-upload="clone-reference" accept="video/*" hidden>
      ${preview}
      <div><b>${esc(label)}</b><small>${esc(helper)}</small></div>
    </label>
    ${hasVideo ? `<button class="video-prompt-clear" type="button" data-action="clear-clone-reference" title="Remove video">${icon("x", 18)}</button>` : ""}
    <button class="video-prompt-extract" type="button" data-action="clone-prompt" ${hasVideo && !state.generating ? "" : "disabled"}>
      ${icon(state.generating ? "loader-circle" : "wand-sparkles", 20)}
      <b>${state.generating ? "Extracting..." : "Extract Prompt"}</b>
    </button>
  </section>`;
}

function formatFileSize(size = 0) {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "Video";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function storyPanel(p) {
  const visualStyle = p.story.visualStyle || "Cinematic";
  const voice = p.story.voice || "Jamal";
  const cta = p.story.cta || "Engagement";
  const styleCards = ["Cinematic", "3D Pixar", "Anime Ghibli", "Fantasy Epic", "Watercolor", "Cinematic Noir", "Vintage Film", "Editorial"];
  return studioImmersiveShell(p, "story", `
    <section class="storytelling-card">
      <header class="storytelling-head">
        <h2>Storytelling</h2>
        <p>AI-narrated storytelling videos in Bahasa Melayu</p>
      </header>
      <div class="story-steps">
        <div class="active"><b>1</b><strong>Prompt & Settings</strong><span>Define your video</span></div>
        <i></i>
        <div><b>2</b><strong>Review & Generate</strong><span>Final confirmation</span></div>
      </div>
      <label class="story-main-prompt">
        <span>Describe the video you want to make today <b>${wordCount(p.story.notes)}/1000</b></span>
        <textarea data-field="story.notes" maxlength="1000" placeholder="Describe the video you want to make today">${esc(p.story.notes || "")}</textarea>
      </label>
      <div class="story-select-row">
        ${select("story.language", "", ["MY Bahasa Melayu", "中文", "English"], p.story.language || "MY Bahasa Melayu")}
        ${select("story.ratio", "", ["9:16 Portrait", "1:1 Square", "16:9 Landscape"], p.story.ratio || "9:16 Portrait")}
      </div>
      <p class="story-section-label">Visual Style</p>
      <div class="story-style-grid">
        ${styleCards.map((item, index) => storyStyleButton(item, visualStyle, index)).join("")}
      </div>
      <p class="story-section-label">Voice</p>
      <div class="story-voice-grid">
        ${storyVoiceButton("Jamal", "Custom-cloned Malay male voice — warm authoritative delivery with native phrasing.", "Malay Male · Cloned · Warm", voice)}
        ${storyVoiceButton("Seasoned Man", "Deep, firm and resonant with steady articulation — authoritative like a news anchor.", "Malay Male · Deep · Polished", voice)}
        ${storyVoiceButton("Passionate Lady", "Bright, rich and expressive with a natural laid-back delivery. Candid influencer vibe.", "Malay Female · Bright · Expressive", voice)}
      </div>
      <section class="story-cta-card">
        <div><span>🎯</span><h3>Call-to-Action (final slide)</h3><p>How should the AI close the last slide?</p></div>
        <div class="story-cta-grid">
          ${storyChoiceButton("story.cta", "None", "🌊 None", "Natural close", cta)}
          ${storyChoiceButton("story.cta", "Engagement", "💬 Engagement", "Bait comments", cta)}
          ${storyChoiceButton("story.cta", "Follow", "👥 Follow", "Custom text", cta)}
        </div>
        <small>AI will end the last slide with a topic-relevant question that invites viewers to comment with their answer or experience.</small>
      </section>
      <div class="story-cost-grid">
        <article>Slide duration is locked to 5s for TikTok pace <b>5s per slide LOCKED</b></article>
        <article>Story length is locked to 10 slides for optimal viewer retention <b>12 slides LOCKED</b></article>
        <article>Estimated video duration <b>5s × 12 = 1m 0s</b></article>
        <article>Estimated cost (deducted on Generate) <b>RM 2.04</b><small>RM 0.07 × 12 images + RM 0.02 × 60 seconds audio</small></article>
      </div>
      <button class="story-preview-button" data-action="write-story">Preview & Continue</button>
    </section>
  `);
}

function storyStyleButton(value, active, index) {
  return `<button class="${active === value ? "active" : ""}" style="--story-hue:${index * 37 + 12}deg" type="button" data-field-set="story.visualStyle" data-value="${esc(value)}"><span>${value}</span><b>${value}</b></button>`;
}

function storyVoiceButton(value, body, tags, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="story.voice" data-value="${esc(value)}"><b>${value[0]}</b><strong>${value}</strong><span>${body}</span><em>${tags}</em></button>`;
}

function storyChoiceButton(field, value, label, note, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}"><b>${label}</b><span>${note}</span></button>`;
}

function viralPanel(p) {
  const feature = p.viral.feature || "Talking Object";
  const objective = p.viral.objective || "Proud";
  const language = p.viral.language || "Bahasa Melayu";
  const target = p.viral.target || "Auto Target";
  const mode = p.viral.mode || "Image -> Video";
  const performance = p.viral.performance || "Action";
  const dialog = p.viral.dialog || "Auto Dialog";
  return `
    <section class="viral-shell">
      <div class="viral-feature-card">
        <h2>🎬 Viral Feature</h2>
        <div class="viral-feature-grid">
          ${viralFeatureButton("Talking Object", "🗣️", feature)}
          ${["Coming soon", "Coming soon", "Coming soon", "Coming soon"].map((item) => `<button type="button" disabled><b>✨</b><span>${item}</span></button>`).join("")}
        </div>
      </div>
      <section class="viral-form-card">
        <h3>🗣️ Talking Object</h3>
        <label class="viral-field">
          <span>1. Object / Ingredient</span>
          <input data-field="viral.object" value="${esc(p.viral.object || "")}" placeholder="e.g. Banana, Biotin, Smartphone, L-Cystine">
        </label>
        <p class="viral-field-label">2. Objective</p>
        <div class="viral-choice-grid three">
          ${viralChoiceButton("viral.objective", "Proud", "💪", objective)}
          ${viralChoiceButton("viral.objective", "Grumpy", "😤", objective)}
          ${viralChoiceButton("viral.objective", "Villain", "😈", objective)}
        </div>
        <small>Confident mentor — drives saves (educational).</small>
        <label class="viral-field">
          <span>3. Purpose / Context (drives the scene)</span>
          <input data-field="viral.purpose" value="${esc(p.viral.purpose || "")}" placeholder='e.g. "Hair growth (D-Bio Plus)", "Skin glow", "Energy boost"'>
        </label>
        <small>Tip: Same purpose across multiple objects in the same project = same scene = looks like a coherent series.</small>
        <p class="viral-field-label">4. Language</p>
        <div class="viral-choice-grid two">
          ${viralChoiceButton("viral.language", "Bahasa Melayu", "🇲🇾", language)}
          ${viralChoiceButton("viral.language", "English", "🇺🇸", language)}
        </div>
        <p class="viral-field-label">5. Target / Scene</p>
        <div class="viral-choice-grid two">
          ${viralChoiceButton("viral.target", "Auto Target", "🤖", target)}
          ${viralChoiceButton("viral.target", "Custom Target", "📍", target)}
        </div>
        <small>AI picks the best background based on object + purpose.</small>
        <p class="viral-field-label">6. Mode</p>
        <div class="viral-choice-grid two">
          ${viralChoiceButton("viral.mode", "Image -> Video", "🖼️", mode)}
          ${viralChoiceButton("viral.mode", "Text -> Video", "📝", mode)}
        </div>
        <small>Generate banana-pro image first, then Veo uses it as start frame (pixel-identical character lock).</small>
        <p class="viral-field-label">7. Performance</p>
        <div class="viral-choice-grid two">
          ${viralChoiceButton("viral.performance", "Action", "⚡", performance)}
          ${viralChoiceButton("viral.performance", "Standing", "🎙️", performance)}
        </div>
        <small>Character actively performs its function (combat free radicals, strengthen hair roots, etc.) — drives engagement.</small>
        <p class="viral-field-label">8. Dialog</p>
        <div class="viral-choice-grid two">
          ${viralChoiceButton("viral.dialog", "Auto Dialog", "🤖", dialog)}
          ${viralChoiceButton("viral.dialog", "Custom Dialog", "✍️", dialog)}
        </div>
        <small>LLM auto-generates the dialog line from object + objective + language.</small>
        <button class="viral-generate-button" data-action="decode-viral">🗣️ Generate Talking Object Video</button>
      </section>
    </section>
    ${viralHistoryPanel(p)}`;
}

function viralFeatureButton(value, emoji, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="viral.feature" data-value="${esc(value)}"><b>${emoji}</b><span>${value}</span></button>`;
}

function viralChoiceButton(field, value, emoji, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}"><b>${emoji}</b><span>${value}</span></button>`;
}

function viralHistoryPanel(p) {
  const items = state.db.results.filter((item) => item.projectId === p.id && item.type === "viral");
  return `
    <section class="viral-history-card">
      <header><h3>${icon("history", 18)} History — Viral — ${esc(p.name)}</h3><span>${items.length} items</span></header>
      <div class="viral-history-filters">
        <button class="active">🗣️ Talking Object</button>
        <button>🎞️ Normal Video</button>
        <button class="active">🎬 Videos</button>
        <button>🖼️ Images</button>
      </div>
      ${items.length ? `<div class="result-grid">${items.map(resultCard).join("")}</div>` : `<div class="viral-empty"><b>${icon("history", 28)}</b><strong>Belum ada history.</strong><span>Generate satu, ia akan muncul di sini.</span></div>`}
    </section>`;
}

function select(field, label, options, value) {
  const optionValue = (item) => Array.isArray(item) ? item[0] : item;
  const optionLabel = (item) => Array.isArray(item) ? item[1] : item;
  const hasValue = options.some((item) => optionValue(item) === value);
  const list = value && !hasValue ? [value, ...options] : options;
  return `<label>${label}<select data-field="${field}">${list.map((item) => `<option value="${esc(optionValue(item))}" ${optionValue(item) === value ? "selected" : ""}>${esc(optionLabel(item))}</option>`).join("")}</select></label>`;
}

function upload(title, main, sub, ic, kind) {
  const selectedId = kind === "avatar" ? project().image?.avatarAttachmentId : project().image?.productAttachmentId;
  const selected = selectedId ? (state.db.attachments || []).find((item) => item.id === selectedId) : null;
  const selectedCopy = {
    zh: ["已选择照片", "点击更换"],
    ms: ["Foto dipilih", "Klik untuk tukar"],
    en: ["Photo selected", "Click to change"]
  }[state.lang] || ["Photo selected", "Click to change"];
  return `<section class="upload-card"><h2>${icon(ic)} ${title}</h2><button class="drop-zone attachment-open-zone" type="button" data-action="open-attachment-picker" data-attachment-kind="${esc(kind)}">
    <span>${icon(ic, 44)}</span>
    <strong>${selected ? esc(selectedCopy[0]) : main}</strong>
    <small>${selected ? esc(selectedCopy[1]) : sub}</small>
  </button></section>`;
}

function prompt(field, value, placeholder, action, button) {
  return `<div class="prompt-block"><label>${t("prompt")}<textarea data-field="${field}" placeholder="${placeholder}">${esc(value)}</textarea></label><button class="gold-button" data-action="${action}" ${state.generating ? "disabled" : ""}>${icon(state.generating ? "loader-circle" : "sparkles")} ${state.generating ? t("generating") : button}</button></div>`;
}

function results(p, type) {
  const types = Array.isArray(type) ? type : [type];
  const pending = pendingResultJobs(p, types);
  const items = p.results.filter((item) => types.includes(item.type)).slice(-4).reverse();
  if (!pending.length && !items.length) return `<section class="empty-result">${icon("sparkles")} ${t("noResults")}</section>`;
  return `<section class="result-grid">${pending.map(generationJobCard).join("")}${items.map(resultCard).join("")}</section>`;
}

function pendingResultJobs(projectItem, types) {
  const step = state.step || "image";
  const optimistic = (state.optimisticGenerationJobs || []).filter((job) => job.projectId === projectItem.id);
  const serverJobs = state.db?.generationJobs || [];
  const serverIds = new Set(serverJobs.map((job) => job.id));
  return [...optimistic.filter((job) => !serverIds.has(job.id)), ...serverJobs]
    .filter((job) => job.projectId === projectItem.id && ["queued", "processing", "failed"].includes(job.status)
      || (job.projectId === projectItem.id && job.status === "cancelled" && generationJobWaitSeconds(job, job.completedAt) < 8))
    .filter((job) => job.type === "video"
      ? step === videoStudioStep(job.step)
      : types.includes(job.type) || (job.action === "generate-image" && types.includes("image")))
    .sort((a, b) => {
      const aTime = Date.parse(a.completedAt || a.updatedAt || a.startedAt || a.createdAt || 0) || 0;
      const bTime = Date.parse(b.completedAt || b.updatedAt || b.startedAt || b.createdAt || 0) || 0;
      return bTime - aTime;
    });
}

function generationJobStatusKey(job = {}) {
  if (job.status === "failed") return "failed";
  if (job.status === "cancelled") return "cancelled";
  if (job.stage === "prompt_advanced") return "optimizing";
  if (job.stage === "saving_asset") return "saving";
  if (job.stage === "provider_submitted" || job.status === "processing") return "generating";
  return "queued";
}

function generationJobStatusLabel(job = {}) {
  if (job.status === "failed") return "Failed";
  if (job.status === "queued") return job.stage === "prompt_advanced" ? "Optimizing prompt" : "Queued";
  if (job.stage === "prompt_advanced") return "Optimizing prompt";
  if (job.stage === "provider_submitted") return job.type === "video" ? "Generating video" : "Generating image";
  if (job.stage === "saving_asset") return "Saving result";
  if (job.status === "processing") return "Processing";
  return job.status || "Queued";
}

function generationJobStageHelp(job = {}) {
  if (job.stage === "prompt_advanced") return "Prompt Advanced is running in the background.";
  if (job.stage === "provider_submitted") return "You can keep creating while this finishes.";
  if (job.stage === "saving_asset") return "Final asset is being saved to this project.";
  return "Task is queued. You can keep writing the next prompt.";
}

function generationJobCenterLabel(job = {}) {
  if (job.stage === "saving_asset") return "Saving";
  if (job.stage === "prompt_advanced") return "Optimizing";
  return "Generating";
}

function generationJobWaitSeconds(job = {}, fallbackTime = "") {
  const raw = fallbackTime || job.createdAt || job.startedAt || job.updatedAt || "";
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.round((Date.now() - time) / 1000));
}

function generationJobCard(job) {
  const isFailed = job.status === "failed";
  const label = generationJobStatusLabel(job);
  const type = job.type === "video" ? "VIDEO" : job.type === "image" ? "IMAGE" : "OUTPUT";
  const promptPreview = String(job.promptSnapshot || job.prompt || "").replaceAll("\n", " ").trim();
  return `<article class="result-card generation-job-card ${isFailed ? "failed" : ""}" aria-live="polite">
    <div class="generation-job-canvas">
      ${icon(isFailed ? "triangle-alert" : "loader-circle", 34)}
      <strong>${label}</strong>
      <span>${esc(isFailed ? (job.errorMessage || "Please adjust the prompt and try again.") : promptPreview ? promptPreview.slice(0, 110) : generationJobStageHelp(job))}</span>
      ${isFailed ? `<p class="generation-credit-refund-note"><strong>No Charge</strong></p>` : ""}
      ${isFailed ? `<div class="generation-job-actions"><button type="button" class="dark-button" data-generation-retry="${esc(job.id)}">${icon("refresh-cw", 14)} Retry</button><button type="button" class="dark-button" data-generation-edit="${esc(job.id)}">${icon("pencil-line", 14)} Edit prompt</button></div>` : ""}
    </div>
    <footer>
      <span>${icon(isFailed ? "triangle-alert" : "loader-circle", 16)}</span>
      <b>${esc(type)}</b>
    </footer>
  </article>`;
}

function resultCard(item) {
  const title = item.title || "Generated asset";
  const promptText = resultPromptText(item);
  const promptPreview = promptText.replaceAll("\n", " ").trim();
  const hasPrompt = Boolean(promptPreview);
  const canSaveReference = Boolean(item.imageUrl || item.videoUrl);
  const isLegacyVisual = Boolean(item.visualCard);
  const modelLabel = resultModelLabel(item);
  const safeTitle = esc(title);
  const mediaRatio = resultMediaRatio(item);
  return `
    <article class="result-card ${isLegacyVisual ? "legacy-visual-result" : ""}" data-media-ratio="${esc(mediaRatio)}" style="--media-ratio:${esc(mediaRatio)}">
      <header class="result-card-head">
        <span>${icon("circle-check", 18)}</span>
        <b>${esc(modelLabel)}</b>
      </header>
      ${resultPreview(item, { clickable: true })}
      <div class="result-meta">
        <span>${icon("cloud-check", 16)} ${esc(resultMediaLabel(item))}</span>
        <code># ${esc(item.taskId || item.providerTaskId || item.id)}</code>
      </div>
      <label class="result-name">
        <span>${icon("pencil-line", 18)}</span>
        <div>
          <b>Name</b>
          <input data-result-title="${esc(item.id)}" value="${safeTitle}" aria-label="Asset name">
        </div>
      </label>
      <div class="result-model-row">
        <span>${esc(modelLabel)}</span>
        <small>${item.provider ? esc(String(item.provider).toUpperCase()) : "POKAYA"}</small>
      </div>
      <button type="button" class="result-prompt result-prompt-trigger" data-result-prompt="${esc(item.id)}" ${hasPrompt ? "" : "disabled"} aria-label="Open full prompt">
        ${icon("pencil", 18)}
        <div><b>Prompt</b><p>${hasPrompt ? esc(promptPreview) : "No prompt saved for this result."}</p></div>
      </button>
      <div class="result-actions" aria-label="Result actions">
        <button type="button" data-result-action="save" data-result-id="${esc(item.id)}" title="保存到附件" ${canSaveReference ? "" : "disabled"}>${icon("cloud-upload", 19)}<span>保存</span></button>
        <button type="button" data-result-action="edit-image" data-result-id="${esc(item.id)}" title="Edit Image" ${canSaveReference ? "" : "disabled"}>${icon("palette", 19)}<span>编辑</span></button>
        <button type="button" data-result-action="download" data-result-id="${esc(item.id)}" data-result-kind="${item.videoUrl ? "video" : item.imageUrl ? "image" : "text"}" title="下载">${icon("download", 20)}<span>下载</span></button>
        <button type="button" data-result-action="delete" data-result-id="${esc(item.id)}" title="删除">${icon("trash-2", 20)}<span>删除</span></button>
      </div>
    </article>`;
}

function resultMediaLabel(item) {
  if (item.videoUrl) return "Generated video";
  if (item.imageUrl || item.visualCard) return "Generated image";
  return "Generated text";
}

function resultModelLabel(item) {
  const model = item.model || item.providerTitle || item.title || "";
  if (/gemini|video prompt|extract/i.test(model)) return "POKAYA AI";
  if (/seedream\s*5/i.test(model)) return "SEEDREAM 5.0 LITE";
  if (/seedream/i.test(model)) return "SEEDREAM 4.5";
  if (/banana\s*2/i.test(model)) return "NANO BANANA 2";
  if (/nano|banana/i.test(model)) return "NANO BANANA PRO";
  if (/grok imagine/i.test(model)) return "GROK IMAGINE";
  if (/gpt|apimart/i.test(model)) return "GPT IMAGE 2";
  return item.videoUrl ? "VIDEO MODEL" : "GPT IMAGE 2";
}

function resultTitle(item) {
  if (!item) return "Untitled image";
  return item.title || item.providerTitle || (item.videoUrl ? "Untitled video" : "Untitled image");
}

function resultModelDisplay(item) {
  const label = resultModelLabel(item || {});
  if (label === "NANO BANANA PRO") return "Nano Banana Pro";
  if (label === "NANO BANANA 2") return "Nano Banana 2";
  if (label === "SEEDREAM 5.0 LITE") return "Seedream 5.0 Lite";
  if (label === "SEEDREAM 4.5") return "Seedream 4.5";
  if (label === "GROK IMAGINE") return "Grok Imagine";
  if (label === "GPT IMAGE 2") return "GPT Image 2";
  return label === "VIDEO MODEL" ? "Video model" : label;
}

function resultModelProvider(item) {
  const label = resultModelLabel(item || {});
  if (label === "NANO BANANA PRO" || label === "NANO BANANA 2") return "google";
  if (label.startsWith("SEEDREAM")) return "seedream";
  if (label === "GROK IMAGINE") return "xai";
  return "openai";
}

function resultProject(item) {
  return item?.projectId ? state.db?.projects?.find((project) => project.id === item.projectId) : null;
}

function resultMediaSrc(item, kind = "image", options = {}) {
  if (!item) return "";
  const params = new URLSearchParams({ token: state.token || "" });
  if (kind === "video" && item.videoUrl) return `/api/media/result/${encodeURIComponent(item.id)}/video?${params.toString()}`;
  if (item.imageUrl) {
    const width = Number(options.width || 0);
    if (options.thumb) params.set("thumb", "1");
    if (options.thumb && width) params.set("w", String(width));
    return `/api/media/result/${encodeURIComponent(item.id)}/image?${params.toString()}`;
  }
  return "";
}

function warmResultPreview(resultId) {
  if (!resultId || typeof Image === "undefined") return;
  const item = findAssetResult(resultId);
  if (!item?.imageUrl || resultPreviewPreloadCache.has(resultId)) return;
  const src = resultMediaSrc(item, "image", { thumb: true, width: 640 });
  if (!src) return;
  const image = new Image();
  image.decoding = "async";
  image.loading = "eager";
  image.fetchPriority = "high";
  resultPreviewPreloadCache.set(resultId, image);
  if (resultPreviewPreloadCache.size > 24) {
    const [oldestId] = resultPreviewPreloadCache.keys();
    if (oldestId) resultPreviewPreloadCache.delete(oldestId);
  }
  image.src = src;
  image.decode?.().catch(() => {});
}

function scheduleAssetLibraryThumbWarmup() {
  if (state.page !== "library" || state.loading) return;
  assetLibraryWarmFrame = window.requestAnimationFrame(() => {
    assetLibraryWarmFrame = null;
    const warm = () => {
      [...document.querySelectorAll(".asset-library-main [data-result-preview]")]
        .slice(0, 8)
        .forEach((el) => warmResultPreview(el.dataset.resultPreview));
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 900 });
    else window.setTimeout(warm, 120);
  });
}

function resultResolutionLabel(item) {
  if (!item) return "Unknown";
  if (item.resolution?.width && item.resolution?.height) return `${item.resolution.width} x ${item.resolution.height}`;
  if (typeof item.resolution === "string" && item.resolution.trim()) return item.resolution.trim();
  if (item.width && item.height) return `${item.width} x ${item.height}`;
  const projectResolution = resultProject(item)?.image?.resolution;
  return projectResolution ? String(projectResolution).toUpperCase() : "Unknown";
}

function resultAspectRatioLabel(item) {
  if (!item) return "Unknown";
  return wallAspectRatioForItem(item, resultProject(item), "Unknown");
}

const supportedWallAspectRatios = ["9:16", "3:4", "2:3", "1:1", "4:3", "3:2", "16:9"];

function normalizeAspectRatio(value, fallback = "9:16") {
  const raw = String(value || "").trim();
  const normalized = raw.match(/(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)/);
  if (normalized) {
    const ratio = `${Number(normalized[1])}:${Number(normalized[2])}`;
    if (supportedWallAspectRatios.includes(ratio)) return ratio;
  }
  return supportedWallAspectRatios.includes(fallback) ? fallback : "9:16";
}

function aspectRatioToMediaRatio(value = "9:16") {
  const aspectRatio = normalizeAspectRatio(value);
  const [width, height] = aspectRatio.split(":").map(Number);
  const ratio = width / height;
  return Number.isFinite(ratio) && ratio > 0 ? ratio.toFixed(4) : "0.5625";
}

function aspectRatioToCss(value = "9:16") {
  return normalizeAspectRatio(value).replace(":", " / ");
}

function intrinsicMediaRatioForItem(item = {}) {
  const resolutionText = typeof item.resolution === "string" ? item.resolution : "";
  const resolutionMatch = resolutionText.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  const width = Number(
    item.width ||
    item.imageWidth ||
    item.videoWidth ||
    item.resolution?.width ||
    (resolutionMatch ? resolutionMatch[1] : 0)
  );
  const height = Number(
    item.height ||
    item.imageHeight ||
    item.videoHeight ||
    item.resolution?.height ||
    (resolutionMatch ? resolutionMatch[2] : 0)
  );
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return "";
  return Math.min(2.4, Math.max(0.35, width / height)).toFixed(4);
}

function projectWallAspectRatio(projectItem = project(), type = "image") {
  if (type === "video" || type === "ugc") return normalizeAspectRatio(projectItem?.ugc?.aspectRatio || projectItem?.image?.aspectRatio || "16:9", "16:9");
  if (type === "text" || type === "story") return normalizeAspectRatio(projectItem?.image?.aspectRatio || "1:1", "1:1");
  return normalizeAspectRatio(projectItem?.image?.aspectRatio || "9:16", "9:16");
}

function wallAspectRatioForItem(item = {}, projectItem = resultProject(item), fallback = "") {
  if (item?.aspectRatio) return normalizeAspectRatio(item.aspectRatio, fallback || projectWallAspectRatio(projectItem, item.type));
  if (item?.type === "video" || item?.action === "generate-ugc") return projectWallAspectRatio(projectItem, "video");
  if (item?.type === "text" || item?.type === "story") return projectWallAspectRatio(projectItem, "text");
  return fallback && fallback !== "Unknown" ? normalizeAspectRatio(fallback) : projectWallAspectRatio(projectItem, "image");
}

function resultMediaRatio(item = {}) {
  return aspectRatioToMediaRatio(wallAspectRatioForItem(item));
}

function mediaRatioSyncScript() {
  return [
    "const card=this.closest('.studio-wall-card,.result-card,.agent-generation-preview,.agent-generation-gallery-tile')",
    "if(card){",
    "const width=this.naturalWidth||this.videoWidth||1",
    "const height=this.naturalHeight||this.videoHeight||1",
    "const next=Math.min(2.4,Math.max(0.35,width/height))",
    "if(Number.isFinite(next)&&next>0){const ratio=next.toFixed(4);card.dataset.mediaRatio=ratio;card.dataset.intrinsicMediaRatio=ratio;card.style.setProperty('--media-ratio',ratio)}",
    "card.dataset.mediaReady='true'",
    "}"
  ].join(";");
}

function resultCreatedLabel(item) {
  if (!item?.createdAt) return "Unknown";
  const date = new Date(item.createdAt);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function resultSavedAsReference(item, kind) {
  if (!item?.id) return false;
  return (state.db?.attachments || []).some((attachment) => attachment.sourceResultId === item.id && attachment.kind === kind);
}

function resultHasVisibleProjectCategory(item) {
  return resultSavedAsReference(item, "file");
}

function resultReferenceButton(item, kind) {
  const saved = resultSavedAsReference(item, kind);
  const isAvatar = kind === "avatar";
  const label = saved ? `Saved as ${isAvatar ? "Avatar" : "Product"}` : `Save as ${isAvatar ? "Avatar" : "Product"}`;
  return `<button type="button" class="result-detail-reference-button ${isAvatar ? "avatar" : "product"} ${saved ? "is-saved" : ""}" data-result-action="save-${esc(kind)}" data-result-id="${esc(item?.id || "")}" ${item?.imageUrl || item?.videoUrl ? "" : "disabled"} ${saved ? "disabled" : ""}>
    ${icon(saved ? "check-circle-2" : isAvatar ? "circle-user-round" : "package", 20)}
    <span>${esc(label)}</span>
  </button>`;
}

function resultProjectSaveButton(item) {
  const saved = resultSavedAsReference(item, "file");
  const label = saved ? "Saved to project" : "Save to project";
  return `<button type="button" class="result-detail-project-button ${saved ? "is-saved" : ""}" data-result-action="save-project" data-result-id="${esc(item?.id || "")}" ${item?.imageUrl || item?.videoUrl ? "" : "disabled"} ${saved ? "disabled" : ""}>
    ${icon(saved ? "check-circle-2" : "folder-plus", 20)}
    <span>${esc(label)}</span>
  </button>`;
}

function resultPromptText(item) {
  const job = resultOriginJob(item);
  return job?.prompt || item.prompt || item.providerBody || item.body || "";
}

function resultOriginJob(item) {
  if (!item?.id) return null;
  return (state.db?.generationJobs || []).find((entry) => entry.id === item.generationJobId || entry.resultId === item.id || entry.taskId === item.taskId || entry.providerTaskId === item.providerTaskId) || null;
}

function resultOriginLabel(item) {
  if (state.activeResultId === item?.id && state.resultDetailSource === "agent") return "Pokaya Agent";
  const job = resultOriginJob(item);
  if (!job) return "Image Page";
  return job.action === "generate-image" ? "Image Page" : "Pokaya Agent";
}

function resultProjectName(item) {
  return resultProject(item)?.name || "Current project";
}

function resultProjectInfoRow(item) {
  if (!resultHasVisibleProjectCategory(item)) return "";
  return `<div><dt>Project</dt><dd>${esc(resultProjectName(item))}</dd></div>`;
}

function resultDownloadFilename(item, kind = "image") {
  const base = String(item?.title || item?.providerTitle || item?.id || "pokaya-asset")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "pokaya-asset";
  const ext = kind === "video" ? "mp4" : kind === "text" ? "txt" : "png";
  return `${base}.${ext}`;
}

function resultPreview(item, options = {}) {
  if (item.visualCard) {
    const visual = visualCardPreview(item.visualCard);
    if (options.clickable) return `<button type="button" class="result-preview-trigger" data-result-preview="${esc(item.id)}" aria-label="Open full preview">${visual}</button>`;
    return visual;
  }
  const imageBase = item.imageUrl ? resultMediaSrc(item, "image") : "";
  const thumbWidth = Number(options.thumbWidth) || studioWallThumbnailWidth();
  const imageSrc = item.imageUrl ? (options.wall ? resultMediaSrc(item, "image", { thumb: true, width: thumbWidth }) : imageBase) : "";
  const imageSizes = options.sizes || studioWallImageSizes();
  const imageSrcset = options.wall && item.imageUrl ? ` srcset="${[384, 640, 960].map((width) => `${resultMediaSrc(item, "image", { thumb: true, width })} ${width}w`).join(", ")}" sizes="${esc(imageSizes)}"` : "";
  const videoSrc = item.videoUrl ? resultMediaSrc(item, "video") : "";
  const imageError = "this.replaceWith(Object.assign(document.createElement('div'),{className:'result-media-error',textContent:'图片保存失败，请联系客服处理'}))";
  const ratioSync = mediaRatioSyncScript();
  const eagerMedia = Boolean(options.full || options.priority);
  const imagePriority = options.full || options.priority ? "high" : options.wall ? "auto" : "low";
  const imageDecoding = options.full ? "sync" : "async";
  const image = imageSrc ? `<img class="result-image" src="${imageSrc}"${imageSrcset} alt="${esc(item.title)}" loading="${eagerMedia ? "eager" : "lazy"}" decoding="${imageDecoding}" fetchpriority="${imagePriority}" draggable="false" onload="${esc(ratioSync)}" onerror="${esc(imageError)}">` : "";
  const videoPreload = eagerMedia ? "metadata" : "none";
  const video = videoSrc ? `<div class="result-video-shell"><video class="result-video" src="${videoSrc}" preload="${videoPreload}" playsinline onloadedmetadata="${esc(ratioSync)}"></video><button type="button" class="result-play-button" data-video-play="${esc(item.id)}">${icon("play", 26)}<span>点击播放</span></button></div>` : "";
  const videoPoster = videoSrc ? `<div class="result-video-shell result-video-poster" aria-hidden="true"><span class="result-video-poster-icon">${icon("video", 30)}</span><span class="result-play-button">${icon("play", 26)}<span>点击查看</span></span></div>` : "";
  const videoTriggerMedia = options.wall ? videoPoster : `<div class="result-video-shell"><video class="result-video" src="${videoSrc}" preload="${videoPreload}" playsinline muted onloadedmetadata="${esc(ratioSync)}"></video><span class="result-play-button">${icon("play", 26)}<span>点击查看</span></span></div>`;
  const videoTrigger = videoSrc ? `<button type="button" class="result-preview-trigger result-video-trigger" data-result-preview="${esc(item.id)}" aria-label="Open full video preview">${videoTriggerMedia}</button>` : "";
  const text = !image && !video ? `<div class="result-text-preview">${icon("file-text", 30)}<span>Text result</span></div>` : "";
  if (options.clickable && imageSrc) return `<button type="button" class="result-preview-trigger" data-result-preview="${esc(item.id)}" aria-label="Open full image preview">${image}</button>`;
  if (options.clickable && videoSrc) return videoTrigger;
  return `${image}${video}${text}`;
}

function studioWallThumbnailWidth() {
  const column = studioWallZoomColumn();
  if (column <= 180) return 384;
  if (column <= 360) return 640;
  return 960;
}

function studioWallImageSizes() {
  const column = studioWallZoomColumn();
  return `(max-width: 760px) 100vw, ${Math.min(960, Math.max(240, column))}px`;
}

function visualCardPreview(card = {}) {
  const sections = Array.isArray(card.sections) ? card.sections.slice(0, 3) : [];
  const bullets = Array.isArray(card.bullets) ? card.bullets.slice(0, 2) : [];
  return `<div class="visual-card-preview">
    <div class="visual-card-canvas">
      <span>${esc(card.eyebrow || "Legacy Concept")}</span>
      <h3>${esc(card.title || "Publish-ready selling card")}</h3>
      <p>${esc(card.subtitle || card.productName || "Product-first social content")}</p>
      ${sections.length ? `<div class="visual-card-sections">${sections.map((item) => `<b>${esc(item.label || "Point")}</b><small>${esc(item.text || "")}</small>`).join("")}</div>` : ""}
      ${bullets.length ? `<ul>${bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
      <em>${esc(card.layout || "social card")} · ${esc(card.language || "BM + English")}</em>
    </div>
  </div>`;
}

function accountPage() {
  const map = {
    attachments: [t("attachments"), t("accountAttachmentsSubtitle"), table(state.db.attachments.map((x) => [x.name, x.kind, new Date(x.createdAt).toLocaleString()]))],
    billing: [t("billing"), t("accountBillingSubtitle"), billingPage()],
    topup: [t("topup"), t("accountTopupSubtitle"), topupPage()],
    affiliate: [t("affiliate"), t("accountAffiliateSubtitle"), affiliateDashboard()],
    usage: [t("usage"), t("accountUsageSubtitle"), usagePage()],
    autopost: [t("autopost"), t("accountAutopostSubtitle"), autoPostPage()],
    whatsapp: [t("whatsapp"), t("accountWhatsappSubtitle"), `<button class="gold-button" data-action="open-whatsapp">${icon("message-circle")} ${t("openWhatsappGroup")}</button>`]
  };
  const [title, subtitle, body] = map[state.page] || map.usage;
  return `<header class="project-head"><div><p class="folder-label">${icon("folder", 18)} ${t("publicTools")}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div></header><section class="canvas-card slim">${body}</section>`;
}

function billingPage() {
  const billing = state.db.billing || {};
  const payments = state.db.payments || [];
  const plan = billing.plan || "Pokaya AI Pro";
  const nextBill = billing.nextBill || "22 Jun 2026";
  const status = billing.status || "Active";
  return `
    <section class="billing-experience">
      <div class="billing-plan-hero">
        <div class="billing-plan-copy">
          <span class="billing-pill">${mascotIcon("pill-mascot-icon")} ${t("currentPlan")}</span>
          <h2>${esc(plan.replace("Pokaya AI ", ""))}</h2>
          <p>${esc(status)} subscription · Renews ${esc(nextBill)}</p>
          <button class="billing-cancel-button" type="button">${t("cancelSubscription")}</button>
        </div>
        <div class="billing-plan-metrics">
          <article>
            <span>${t("renewal")}</span>
            <strong>${icon("calendar-days", 22)} ${esc(nextBill)}</strong>
          </article>
          <article>
            <span>${t("status")}</span>
            <strong><i></i>${esc(status)}</strong>
          </article>
        </div>
      </div>
      <section class="billing-history-section">
        <h2>${icon("badge-dollar-sign", 30)} ${t("paymentHistory")}</h2>
        <div class="billing-history-table">
          <div class="billing-history-head">
            <span>${t("date")}</span><span>${t("description")}</span><span>${t("amount")}</span><span>${t("status")}</span>
          </div>
          ${payments.slice(0, 10).map(billingPaymentRow).join("") || `<p class="empty-text">${t("noPaymentRecords")}</p>`}
        </div>
      </section>
    </section>`;
}

function billingPaymentRow(payment) {
  const status = payment.status || "pending";
  const credits = Number(payment.credits ?? ((payment.kind || "topup") === "topup" ? creditsForUsd(payment.amount) : payment.amount) ?? 0);
  const description = (payment.kind || "topup") === "subscription"
    ? "Pokaya AI Pro subscription"
    : `Top up ${formatCreditNumber(credits)} credits`;
  return `<div class="billing-history-row">
    <time>${formatTopupDate(payment.createdAt)}</time>
    <b>${esc(description)}</b>
    <strong>${formatPaymentAmount(payment)}</strong>
    <div class="billing-status-wrap">
      <span class="payment-status ${esc(status)}">${icon(status === "paid" ? "check-circle-2" : "clock", 16)} ${esc(status)}</span>
      ${status === "pending" ? `<button class="mini-button" data-action="refresh-payment-status" data-order="${esc(payment.orderId)}">${icon("refresh-cw", 15)} ${t("check")}</button>` : ""}
    </div>
  </div>`;
}

function affiliateDashboard() {
  const affiliate = state.db.affiliate || {};
  const code = affiliate.code || "POKAYA2026";
  const clicks = Number(affiliate.clicks || 0);
  const payout = Number(affiliate.payout || 0);
  const totalEarned = payout;
  const cashedOut = Number(affiliate.cashedOut || 0);
  const referrals = Number(affiliate.referrals || Math.max(0, Math.floor(clicks / 8)));
  const available = Math.max(0, payout - cashedOut);
  const referralLink = `https://pokaya.ai/ref/${encodeURIComponent(code)}`;
  const activeTab = ["overview", "commissions", "referrals", "cashout"].includes(state.affiliateTab) ? state.affiliateTab : "overview";
  const tabs = [
    ["overview", t("affiliateOverview")],
    ["commissions", t("affiliateCommissions")],
    ["referrals", t("affiliateReferrals")],
    ["cashout", t("affiliateCashOut")]
  ];
  const metrics = { clicks, payout, totalEarned, cashedOut, referrals, available };
  return `
    <section class="affiliate-dashboard">
      <div class="affiliate-stat-grid">
        ${affiliateStat(t("referralWalletBalance"), `RM ${available.toFixed(2)}`, "wallet-cards", "green")}
        ${affiliateStat(t("referralTotalEarned"), `RM ${totalEarned.toFixed(2)}`, "trending-up", "blue")}
        ${affiliateStat(t("referralTotalCashedOut"), `RM ${cashedOut.toFixed(2)}`, "circle-check", "purple")}
        ${affiliateStat(t("referralClicks"), formatCreditNumber(clicks), "users", "orange")}
      </div>
      <section class="affiliate-ref-card">
        <div class="affiliate-code-row">
          <div>
            <p>${t("referralCode")}</p>
            <strong>${esc(code)}</strong>
          </div>
          <button class="dark-button" data-action="copy-affiliate-code">${icon("copy", 18)} ${t("copyCode")}</button>
        </div>
        <div class="affiliate-link-box">
          <label>${t("shareReferralLink")}</label>
          <input readonly value="${esc(referralLink)}" aria-label="${esc(t("referralLink"))}">
          <button class="gold-button" data-action="copy-affiliate">${icon("copy", 18)} ${t("copyLink")}</button>
        </div>
      </section>
      <div class="affiliate-tabs" aria-label="Affiliate sections">
        ${tabs.map(([id, label]) => `<button class="${activeTab === id ? "active" : ""}" type="button" data-affiliate-tab="${id}" aria-selected="${activeTab === id ? "true" : "false"}">${label}</button>`).join("")}
      </div>
      ${affiliateTabPanel(activeTab, metrics)}
    </section>`;
}

function affiliateStat(label, value, ic, tone) {
  return `<article class="affiliate-stat ${tone}">${icon(ic, 22)}<span>${label}</span><b>${value}</b></article>`;
}

function affiliateMini(label, value) {
  return `<article><span>${label}</span><b>${value}</b></article>`;
}

function affiliateCommissionExamples() {
  const content = {
    zh: {
      title: "20% 佣金怎么算？",
      copy: "用户通过您的链接入金并使用 Pokaya，系统按入金金额计算 20% 佣金。",
      examples: [["用户入金", "$100", "您获得", "$20"], ["用户入金", "$1000", "您获得", "$200"]]
    },
    ms: {
      title: "Cara kira komisen 20%",
      copy: "Bila user top up dan guna Pokaya melalui link anda, sistem kira 20% komisen daripada jumlah top up.",
      examples: [["User top up", "$100", "Anda dapat", "$20"], ["User top up", "$1000", "Anda dapat", "$200"]]
    },
    en: {
      title: "How the 20% commission works",
      copy: "When a user tops up and uses Pokaya through your link, you earn 20% of the top-up amount.",
      examples: [["User tops up", "$100", "You earn", "$20"], ["User tops up", "$1000", "You earn", "$200"]]
    }
  }[state.lang] || {};
  return `<div class="affiliate-rate-box">
    <div>
      <h3>${content.title}</h3>
      <p>${content.copy}</p>
    </div>
    <div class="affiliate-rate-examples">
      ${content.examples.map(([inLabel, inAmount, outLabel, outAmount]) => `<article>
        <span>${inLabel}</span><b>${inAmount}</b><em>${outLabel}</em><strong>${outAmount}</strong>
      </article>`).join("")}
    </div>
  </div>`;
}

function affiliateTabPanel(tab, metrics) {
  const { clicks, totalEarned, cashedOut, referrals, available } = metrics;
  if (tab === "commissions") {
    return `<section class="affiliate-info-card">
      <div class="affiliate-how">
        <h2>${t("affiliateCommissions")}</h2>
        <p>${affiliateTabCopy("commissions")}</p>
      </div>
      <div class="affiliate-mini-grid">
        ${affiliateMini(t("commissionEvents"), referrals)}
        ${affiliateMini(t("totalEarned"), `RM ${totalEarned.toFixed(2)}`)}
        ${affiliateMini(t("availableWithdraw"), `RM ${available.toFixed(2)}`)}
        ${affiliateMini(t("pendingCashouts"), `RM ${Math.max(0, cashedOut).toFixed(2)}`)}
      </div>
    </section>`;
  }
  if (tab === "referrals") {
    return `<section class="affiliate-info-card">
      <div class="affiliate-how">
        <h2>${t("affiliateReferrals")}</h2>
        <p>${affiliateTabCopy("referrals")}</p>
      </div>
      <div class="affiliate-mini-grid">
        ${affiliateMini(t("totalReferrals"), referrals)}
        ${affiliateMini(t("referralClicks"), formatCreditNumber(clicks))}
        ${affiliateMini(t("commissionEvents"), referrals)}
        ${affiliateMini(t("totalEarned"), `RM ${totalEarned.toFixed(2)}`)}
      </div>
    </section>`;
  }
  if (tab === "cashout") {
    return `<section class="affiliate-info-card">
      <div class="affiliate-how">
        <h2>${t("affiliateCashOut")}</h2>
        <p>${affiliateTabCopy("cashout")}</p>
        <button class="gold-button affiliate-cashout-button" type="button" ${available >= 50 ? "" : "disabled"}>${icon("wallet-cards", 18)} ${t("affiliateCashOut")}</button>
      </div>
      <div class="affiliate-mini-grid">
        ${affiliateMini(t("availableWithdraw"), `RM ${available.toFixed(2)}`)}
        ${affiliateMini(t("pendingCashouts"), `RM ${Math.max(0, cashedOut).toFixed(2)}`)}
        ${affiliateMini(t("referralTotalCashedOut"), `RM ${cashedOut.toFixed(2)}`)}
        ${affiliateMini(t("minimumCashout"), "RM 50")}
      </div>
    </section>`;
  }
  return `<section class="affiliate-info-card">
    <div class="affiliate-how">
      <h2>${t("affiliateHowTitle")}</h2>
      <ul>
        <li>${t("affiliateHow1")}</li>
        <li>${t("affiliateHow2")}</li>
        <li>${t("affiliateHow3")}</li>
        <li>${t("affiliateHow4")}</li>
      </ul>
      ${affiliateCommissionExamples()}
    </div>
    <div class="affiliate-mini-grid">
      ${affiliateMini(t("totalReferrals"), referrals)}
      ${affiliateMini(t("commissionEvents"), referrals)}
      ${affiliateMini(t("totalEarned"), `RM ${totalEarned.toFixed(2)}`)}
      ${affiliateMini(t("availableWithdraw"), `RM ${available.toFixed(2)}`)}
      ${affiliateMini(t("pendingCashouts"), `RM ${Math.max(0, cashedOut).toFixed(2)}`)}
      ${affiliateMini(t("minimumCashout"), "RM 50")}
    </div>
  </section>`;
}

function affiliateTabCopy(tab) {
  const copy = {
    zh: {
      commissions: "这里汇总所有已追踪的佣金事件和可提现金额。",
      referrals: "这里查看通过您的链接或推荐码带来的推荐数据。",
      cashout: "达到最低 RM50 后，可以提交提现到马来西亚银行账户。"
    },
    ms: {
      commissions: "Lihat semua event komisen yang sudah dijejak dan jumlah yang boleh dikeluarkan.",
      referrals: "Semak referral yang datang daripada link atau kod anda.",
      cashout: "Bila capai minimum RM50, anda boleh request cash out ke akaun bank Malaysia."
    },
    en: {
      commissions: "Review tracked commission events and the amount available to withdraw.",
      referrals: "Check referrals coming through your link or referral code.",
      cashout: "Once you reach the RM50 minimum, request cash out to a Malaysian bank account."
    }
  }[state.lang] || {};
  return copy[tab] || "";
}

function topupPage() {
  const credits = Number(state.db.billing?.credits || 0);
  const selectedAmount = Number(state.topupAmount || 10);
  const selectedCredits = creditsForUsd(selectedAmount);
  const imageEstimateCredits = 6;
  const videoEstimateCredits = 50;
  const autoContentPackCredits = videoEstimateCredits * 10;
  const imagePossible = Math.floor(credits / imageEstimateCredits);
  const videoPossible = Math.floor(credits / videoEstimateCredits);
  const autoBatches = Math.floor(credits / autoContentPackCredits);
  return `
    <section class="topup-experience">
      <div class="credit-balance-panel">
        <div class="credit-balance-main">
          <span>${icon("wallet-cards", 18)} ${t("creditBalance")}</span>
          <p><b>${formatCreditBalance(credits)}</b><em>${t("credits").toLowerCase()}</em></p>
          <small>${t("creditRateNote")}</small>
        </div>
        <div class="credit-usage-grid">
          <article><span>${t("imageGenerate")}</span><b>~${imagePossible}</b><small>${t("imagesPossible")}</small></article>
          <article><span>${t("video8s")}</span><b>~${videoPossible}</b><small>${t("videosPossible")}</small></article>
          <article><span>${t("autoContentPack")}</span><b>~${autoBatches} ${t("batch")}</b><small>${t("autoContentPackNote")}</small></article>
        </div>
      </div>
      <div class="topup-purchase-panel">
        <div class="topup-panel-head">
          <div><h2>${t("selectCreditPackage")}</h2><p>${t("creditRateNote")}</p></div>
          <span>${icon("sparkles", 18)} ${t("instantTopupChip")}</span>
        </div>
        <div class="topup-package-grid">
          ${topupPackages().map((item) => `
            <button class="topup-package ${item.amount === selectedAmount ? "active" : ""}" type="button" data-topup-select="${item.amount}">
              ${item.badge ? `<i>${item.badge}</i>` : ""}
              <strong>${formatCreditNumber(item.credits)}</strong>
              <span>${t("credits")}</span>
              <b>${formatUsdAmount(item.amount)}</b>
              <small>${item.note}</small>
            </button>
          `).join("")}
        </div>
        <button class="topup-pay-button" data-topup="${selectedAmount}">${icon("zap", 22)} ${tf("payForCredits", { amount: formatUsdAmount(selectedAmount), credits: formatCreditNumber(selectedCredits) })} ${icon("arrow-right", 22)}</button>
        <p class="topup-secure-note">${t("topupSecureNote")}</p>
      </div>
      ${topupHistory()}
    </section>`;
}

function topupPackages() {
  return [
    { amount: 1, note: t("starterPack") },
    { amount: 5, note: t("tryItOut") },
    { amount: 10, note: t("common") },
    { amount: 20, note: t("bestValue"), badge: t("best") },
    { amount: 50, note: t("powerUser") }
  ].map((item) => ({ ...item, credits: creditsForUsd(item.amount) }));
}

function formatCreditNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatCreditBalance(value) {
  return Number(value || 0).toFixed(2);
}

function topupHistory() {
  const payments = (state.db.payments || []).filter((payment) => (payment.kind || "topup") === "topup").slice(0, 8);
  return `<div class="topup-history-panel">
    <h2>${icon("receipt", 22)} ${t("topupHistory")}</h2>
    <div class="topup-history-list">
      ${payments.map((payment) => {
        const status = payment.status || "pending";
        const credits = Number(payment.credits || payment.amount || 0);
        return `<div>
          <time>${formatTopupDate(payment.createdAt)}</time>
          <b>${tf("creditsAdded", { credits })}</b>
          <strong>${formatPaymentAmount(payment)}</strong>
          <span class="payment-status ${status}">${icon(status === "paid" ? "check-circle-2" : "clock", 16)} ${status}</span>
          ${status === "pending" ? `<button class="mini-button" data-action="refresh-payment-status" data-order="${esc(payment.orderId)}">${icon("refresh-cw", 15)} ${t("check")}</button>` : ""}
        </div>`;
      }).join("") || `<p class="empty-text">${t("noTopupRecords")}</p>`}
    </div>
  </div>`;
}

function formatTopupDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(state.lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function settingsPage() {
  const user = currentAccountUser();
  return `
    <section class="settings-page">
      <form class="settings-card" id="settings-section-profile" data-form="account-profile">
        <header>
          <span>${icon("user-round", 30)}</span>
          <div><h2>Account</h2><p>${t("profileSubtitle")}</p></div>
        </header>
        <div class="settings-form-grid">
          <label>${t("displayName")}<input name="name" value="${esc(user.name || "")}" autocomplete="name" required></label>
          <label>${t("email")}<input name="email" value="${esc(user.email || "")}" disabled></label>
        </div>
        <button class="gold-button" type="submit">${icon("save", 18)} Save Account</button>
      </form>
      <form class="settings-card" data-form="account-whatsapp">
        <header>
          <span>${icon("message-circle", 30)}</span>
          <div><h2>WhatsApp</h2><p>${t("whatsappSettingsSubtitle")}</p></div>
        </header>
        <label>${t("whatsappNumber")}<input name="phone" value="${esc(user.phone || "")}" placeholder="+60123456789" autocomplete="tel"></label>
        <button class="gold-button" type="submit">${icon("save", 18)} ${t("saveWhatsapp")}</button>
      </form>
      <form class="settings-card" data-form="account-password">
        <header>
          <span>${icon("lock-keyhole", 30)}</span>
          <div><h2>${t("changePassword")}</h2><p>${t("changePasswordSubtitle")}</p></div>
        </header>
        <label>${t("oldPassword")}<input name="oldPassword" type="password" autocomplete="current-password" required></label>
        <div class="settings-form-grid">
          <label>${t("newPassword")}<input name="newPassword" type="password" autocomplete="new-password" minlength="6" required></label>
          <label>${t("confirmNewPassword")}<input name="confirmPassword" type="password" autocomplete="new-password" minlength="6" required></label>
        </div>
        <button class="gold-button" type="submit">${icon("key-round", 18)} ${t("changePassword")}</button>
      </form>
    </section>`;
}

function table(rows) {
  return `<div class="table">${rows.map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><small>${c || ""}</small></div>`).join("") || `<p class="empty-text">No records yet.</p>`}</div>`;
}

function invoiceTable() {
  return `<div class="table">${state.db.billing.invoices.map((x) => `<div><span>${x.id}</span><b>${formatPaymentAmount(x)}</b><button data-invoice="${x.id}">${icon("download")} ${t("export")}</button></div>`).join("")}</div>`;
}

function autoPostPage() {
  const connection = state.db.tiktok?.connections?.[0];
  const publishes = state.db.tiktok?.publishes || [];
  const jobs = state.db.schedule || [];
  const counts = autopostCounts(jobs);
  const health = autopostHealth(jobs, connection);
  const primaryAction = jobs.length ? "Review Ready" : "Add from Asset Library";
  return `
    <section class="autopost-hero">
      <div>
        <p class="folder-label">${icon("send", 18)} Publishing Command Center</p>
        <h2>Review, prepare, and publish TikTok content.</h2>
        <p>Turn generated Pokaya assets into reviewed TikTok drafts, then publish with Extension Mode or Official Direct Post.</p>
      </div>
      <div class="autopost-hero-actions">
        <button class="gold-button" data-page="library">${icon("folder-open")} ${primaryAction}</button>
        <button class="dark-button" data-action="ask-agent-schedule">${icon("bot")} Ask Agent</button>
      </div>
    </section>
    <section class="autopost-metrics">
      ${autopostMetric("Draft", counts.Draft, "file-clock")}
      ${autopostMetric("Ready", counts.Ready, "circle-check")}
      ${autopostMetric("Processing", counts.Processing, "loader-circle")}
      ${autopostMetric("Posted", counts.Posted, "send")}
      ${autopostMetric("Failed", counts.Failed, "triangle-alert")}
    </section>
    <div class="autopost-console">
      <section class="autopost-queue">
        <div class="card-title">
          <h2>${icon("calendar-days", 22)} TikTok Queue</h2>
          <span>${jobs.length} scheduled items</span>
        </div>
        ${schedule({ compact: false })}
      </section>
      <aside class="autopost-rail">
        ${autopostHealthCard(health)}
        ${autopostModeCards(connection)}
        <section class="autopost-side-card">
          <header><strong>${icon("activity", 17)} Recent Direct Post</strong></header>
          <div class="tiktok-publishes">
            ${publishes.slice(0, 4).map((item) => `<article><b>${esc(item.status)}</b><span>${esc(item.publishId || item.id)}</span><button data-tiktok-status="${esc(item.publishId || item.id)}">${icon("activity")} Check</button></article>`).join("") || `<p class="empty-text">No official API publishes yet.</p>`}
          </div>
        </section>
      </aside>
    </div>`;
}

function autopostCounts(jobs = []) {
  return jobs.reduce((acc, item) => {
    const status = item.status || "Draft";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { Draft: 0, Ready: 0, Processing: 0, Posted: 0, Failed: 0 });
}

function autopostMetric(label, value, iconName) {
  return `<article><span>${icon(iconName, 18)} ${label}</span><b>${Number(value || 0)}</b></article>`;
}

function autopostReadiness(item = {}, connection = null) {
  const checks = [
    { key: "media", label: "Media", ok: Boolean(item.mediaUrl), fix: "Attach generated asset" },
    { key: "caption", label: "Caption", ok: Boolean(String(item.caption || "").trim()), fix: "Add caption" },
    { key: "hashtags", label: "Hashtags", ok: Boolean(String(item.hashtags || "").trim()), fix: "Add hashtags" },
    { key: "product", label: "Product URL", ok: Boolean(String(item.productUrl || "").trim()), fix: "Optional but recommended" },
    { key: "tiktok", label: "TikTok", ok: Boolean(connection), fix: "Connect TikTok for API mode" }
  ];
  const blockers = checks.filter((check) => !check.ok && !["product", "tiktok"].includes(check.key));
  const directPostBlockers = checks.filter((check) => !check.ok && check.key !== "product");
  return { checks, blockers, directPostBlockers, ready: blockers.length === 0, directPostReady: directPostBlockers.length === 0 };
}

function autopostHealth(jobs = [], connection = null) {
  const mediaReady = jobs.filter((item) => item.mediaUrl).length;
  const captionsReady = jobs.filter((item) => item.caption && item.hashtags).length;
  const blocked = jobs.filter((item) => !autopostReadiness(item, connection).ready).length;
  const directPostReady = jobs.filter((item) => autopostReadiness(item, connection).directPostReady).length;
  return [
    { label: "Asset media", ok: mediaReady > 0 || jobs.length === 0, detail: jobs.length ? `${mediaReady}/${jobs.length} jobs have media` : "Add assets from library" },
    { label: "Captions", ok: captionsReady > 0 || jobs.length === 0, detail: jobs.length ? `${captionsReady}/${jobs.length} jobs have caption + hashtags` : "Agent can create drafts" },
    { label: "Official Direct Post", ok: Boolean(connection), detail: connection ? `${directPostReady}/${jobs.length || 0} jobs API-ready` : "Optional; Extension Mode still works" },
    { label: "Blocked drafts", ok: blocked === 0, detail: blocked ? `${blocked} drafts need attention` : "No blocking issues" }
  ];
}

function autopostHealthCard(items = []) {
  return `<section class="autopost-side-card setup-health-card">
    <header><strong>${icon("clipboard-check", 17)} Publishing setup</strong></header>
    ${items.map((item) => `<p data-ok="${item.ok ? "true" : "false"}">${icon(item.ok ? "check-circle-2" : "circle-alert", 16)}<span><b>${esc(item.label)}</b><small>${esc(item.detail)}</small></span></p>`).join("")}
  </section>`;
}

function autopostModeCards(connection) {
  return `<section class="autopost-side-card publish-mode-card">
    <header><strong>${icon("split", 17)} Publishing modes</strong></header>
    <article>
      <b>${icon("puzzle", 16)} Extension Mode</b>
      <p>Chrome helper fills captions and hashtags. You still review and click final publish in TikTok.</p>
      <button class="gold-button" data-action="download-autopost-extension">${icon("download")} Download Extension</button>
      <details><summary>Setup steps</summary><ol><li>Download extension zip</li><li>Extract folder</li><li>Open chrome://extensions/</li><li>Enable Developer Mode</li><li>Load unpacked folder</li></ol></details>
    </article>
    <article>
      <b>${icon("badge-check", 16)} Official Direct Post</b>
      <p>${connection ? `Connected: ${connection.displayName || connection.openId || "TikTok account"}` : "Connect TikTok after Content Posting API access is approved."}</p>
      <div class="official-actions">
        <button class="gold-button" data-action="connect-tiktok">${icon("plug")} Connect TikTok</button>
        <button class="dark-button" data-action="tiktok-creator-info">${icon("refresh-cw")} Creator Info</button>
      </div>
    </article>
  </section>`;
}

function schedule(options = {}) {
  const jobs = state.db.schedule || [];
  const connection = state.db.tiktok?.connections?.[0];
  if (!jobs.length && state.page === "autopost") return `<section class="autopost-empty-state">
    ${icon("calendar-plus", 34)}
    <strong>No scheduled posts yet.</strong>
    <p>Turn generated assets into TikTok drafts from the Asset Library, or ask Agent to create a posting plan.</p>
    <div><button class="gold-button" data-page="library">${icon("folder-open")} Open Asset Library</button><button class="dark-button" data-action="ask-agent-schedule">${icon("bot")} Ask Agent</button></div>
  </section>`;
  if (state.page === "autopost" && !options.compact) {
    return `<section class="schedule-list autopost-job-list">${jobs.map((item) => autopostJobCard(item, connection)).join("")}</section>`;
  }
  return `<section class="schedule-list">${jobs.map((x) => `<article><b>${esc(x.title)}</b><span>${esc(x.platform)}</span><small>${esc(x.time)}</small><p>${esc([x.caption, x.hashtags].filter(Boolean).join("\n")).replaceAll("\n", "<br>")}</p><button data-schedule="${esc(x.id)}">${icon("settings")} ${esc(x.status)}</button>${state.page === "autopost" ? `<button data-tiktok-publish="${esc(x.id)}">${icon("send")} Official Post</button>` : ""}</article>`).join("")}</section>`;
}

function autopostJobCard(item = {}, connection = null) {
  const readiness = autopostReadiness(item, connection);
  const checks = readiness.checks.filter((check) => check.key !== "tiktok" || state.db.tiktok?.connections?.length);
  return `<article class="autopost-job-card" data-status="${esc(item.status || "Draft")}">
    <div class="autopost-job-main">
      <div>
        <span class="autopost-status-chip">${esc(item.status || "Draft")}</span>
        <h3>${esc(item.title || "Untitled TikTok draft")}</h3>
        <p>${esc(item.caption || "No caption yet.")}</p>
        <small>${esc([item.hashtags, item.productUrl ? "Product URL ready" : ""].filter(Boolean).join(" · "))}</small>
      </div>
      <div class="autopost-job-meta">
        <b>${icon("clock", 15)} ${esc(item.time || "No time")}</b>
        <span>${icon("folder", 15)} ${esc(projectNameForSchedule(item))}</span>
      </div>
    </div>
    <div class="autopost-readiness">
      ${checks.map((check) => `<span data-ok="${check.ok ? "true" : "false"}">${icon(check.ok ? "check" : "x", 13)} ${esc(check.label)}</span>`).join("")}
    </div>
    <div class="autopost-job-actions">
      <button data-autopost-edit="${esc(item.id)}">${icon("edit-3", 14)} Edit</button>
      <button data-autopost-status="${esc(item.id)}" data-status="${readiness.ready ? "Ready" : "Draft"}">${icon(readiness.ready ? "circle-check" : "wrench", 14)} ${readiness.ready ? "Mark Ready" : "Fix Draft"}</button>
      <button data-page="library">${icon("image", 14)} Find assets</button>
      <button data-tiktok-publish="${esc(item.id)}" ${readiness.directPostReady ? "" : "disabled"}>${icon("send", 14)} Direct Post</button>
      <button data-autopost-delete="${esc(item.id)}">${icon("trash-2", 14)} Delete</button>
    </div>
  </article>`;
}

function projectNameForSchedule(item = {}) {
  return state.db.projects.find((project) => project.id === item.projectId)?.name || "No project";
}

const settingsSectionIds = ["account", "billing", "topup", "usage"];

function normalizeSettingsSection(value = state.settingsSection) {
  return settingsSectionIds.includes(value) ? value : "account";
}

function settingsSectionItems() {
  return [
    ["account", "user-round", "Account", t("accountSettingsSubtitle"), settingsPage()],
    ["billing", "credit-card", t("billing"), t("accountBillingSubtitle"), billingPage()],
    ["topup", "wallet-cards", t("topup"), t("accountTopupSubtitle"), topupPage()],
    ["usage", "activity", t("usage"), t("accountUsageSubtitle"), usagePage()]
  ];
}

function activeSettingsSection() {
  const activeId = normalizeSettingsSection();
  return settingsSectionItems().find(([id]) => id === activeId) || settingsSectionItems()[0];
}

function modal() {
  if (!state.modal) return "";
  const editProject = state.db?.projects?.find((item) => item.id === state.editingProjectId);
  if (state.modal === "sop") return sopDashboardModal();
  if (state.modal === "attachmentPicker") return attachmentPickerModal();
  if (state.modal === "ugcPromptBuilder") return ugcPromptBuilderModal();
  if (state.modal === "previewResult") return resultPreviewModal();
  if (state.modal === "resultPrompt") return resultPromptModal();
  if (state.modal === "saveResultReference") return saveResultReferenceModal();
  if (state.modal === "editResultImage") return editResultImageModal();
  if (state.modal === "deleteResult") return deleteResultModal();
  if (state.modal === "bulkDeleteResults") return bulkDeleteResultModal();
  if (state.modal === "agentConfirm") return agentConfirmModal();
  if (state.modal === "settings") return settingsModal();
  const title = { newProject: t("createProject"), renameProject: t("renameProject"), deleteProject: t("deleteProject"), register: t("choosePlan"), sop: t("sopImage"), export: t("exportReady"), support: t("supportTitle") }[state.modal];
  const body = {
    newProject: `<form data-form="project"><label>${t("project")}<input name="name" placeholder="Project ${(state.db?.projects.length || 0) + 1}" required></label><button class="gold-button" type="submit">${icon("plus")} ${t("newProject")}</button></form>`,
    renameProject: `<form data-form="rename-project"><label>${t("project")}<input name="name" value="${esc(editProject?.name || "")}" required autofocus></label><button class="gold-button" type="submit">${icon("check")} ${t("saveName")}</button></form>`,
    deleteProject: `<div class="delete-confirm"><p>${tf("deleteProjectConfirm", { name: `<b>${esc(editProject?.name || t("project"))}</b>` })}</p><div><button class="dark-button" data-action="close-modal">${icon("x")} ${t("cancel")}</button><button class="gold-button danger-button" data-action="confirm-delete-project">${icon("trash-2")} ${t("deleteProject")}</button></div></div>`,
    register: `<form data-form="login"><label>${t("email")}<input name="email" type="email" placeholder="you@pokaya.ai" required></label><label>${t("password")}<input name="password" type="password" placeholder="${esc(t("createPassword"))}" required></label><button class="gold-button" type="submit">${icon("lock")} ${t("registerEnterStudio")}</button></form>`,
    sop: `<div class="sop-sheet"><b>Image SOP</b><ol><li>Upload avatar face.</li><li>Upload product reference.</li><li>Select model and mode.</li><li>Write prompt.</li><li>Generate, save, export.</li></ol><button class="dark-button" data-action="download-sop">${icon("download")} Download SOP</button></div>`,
    export: `<p>${t("exportStarted")}</p><button class="gold-button" data-action="close-modal">${icon("check")} ${t("done")}</button>`,
    support: `<form data-form="support" class="support-form"><label>${t("supportMessage")}<textarea name="message" placeholder="${esc(t("supportPlaceholder"))}" required></textarea></label><button class="gold-button" type="submit">${icon("send")} ${t("supportTicket")}</button></form>`
  }[state.modal];
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal"><button class="icon-only close" data-action="close-modal">${icon("x")}</button><p class="folder-label">${mascotIcon("label-mascot-icon")} Pokaya AI</p><h2>${title}</h2>${body}</section></div>`;
}

function settingsModal() {
  const activeId = normalizeSettingsSection();
  const [, , title, subtitle, body] = activeSettingsSection();
  return `<div class="modal-backdrop settings-modal-backdrop" data-action="close-modal">
    <section class="settings-modal" role="dialog" aria-modal="true" aria-label="${esc(t("settings"))}">
      <aside class="settings-modal-nav" aria-label="Account settings">
        <button class="settings-modal-close" type="button" data-action="close-modal" aria-label="Close">${icon("x", 28)}</button>
        ${settingsSectionItems().map(([id, ic, label]) => `<button class="${activeId === id ? "active" : ""}" type="button" data-settings-section="${esc(id)}" aria-selected="${activeId === id ? "true" : "false"}">${icon(ic, 22)} <span>${esc(label)}</span></button>`).join("")}
      </aside>
      <div class="settings-modal-main">
        <header class="settings-modal-head">
          <h2>${esc(title)}</h2>
          <p>${esc(subtitle)}</p>
        </header>
        <div class="settings-modal-scroll">
          ${body}
        </div>
      </div>
    </section>
  </div>`;
}

function ugcPromptBuilderModal() {
  const builder = state.ugcPromptBuilder || defaultUgcPromptBuilder();
  const builtPrompt = builder.builtPrompt || buildUgcPrompt(builder);
  return `<div class="modal-backdrop ugc-builder-backdrop" data-action="close-modal">
    <section class="ugc-builder-modal" role="dialog" aria-modal="true" aria-label="UGC Prompt Builder">
      <header class="ugc-builder-head">
        <div>
          <span>${icon("sparkles", 26)}</span>
          <h2>UGC Prompt Builder</h2>
          <p>5-Part Veo 3.1 Formula</p>
        </div>
        <button class="icon-only ugc-builder-close" data-action="close-modal" type="button" aria-label="Close">${icon("x", 28)}</button>
      </header>
      <div class="ugc-builder-scroll">
        <section class="ugc-builder-section">
          ${ugcBuilderSectionTitle("clapperboard", "Scene Setup", "5-Part Veo Formula")}
          <p class="ugc-builder-label">Shot Type</p>
          <div class="ugc-builder-options">
            ${Object.entries(ugcBuilderShotOptions).map(([label, value]) => ugcBuilderOption("shotType", label, builder.shotType, value, "shot")).join("")}
          </div>
          ${ugcBuilderInput("shot", builder.shot)}
          <p class="ugc-builder-label">Subject (from reference image)</p>
          ${ugcBuilderInput("subject", builder.subject)}
          <p class="ugc-builder-help">Veo follows your reference image for character + product</p>
          <p class="ugc-builder-label">Action</p>
          <div class="ugc-builder-options">
            ${Object.entries(ugcBuilderActionOptions).map(([label, value]) => ugcBuilderOption("actionType", label, builder.actionType, value, "action")).join("")}
          </div>
          ${ugcBuilderTextarea("action", builder.action, 3)}
        </section>
        <section class="ugc-builder-section">
          ${ugcBuilderSectionTitle("message-circle", "Dialog Script", "8 Seconds")}
          <div class="ugc-builder-timeline">
            ${ugcBuilderInput("beginning", builder.beginning, "0-2s: Beginning", "e.g. \"Ini rahsia cik somi balik awal!\"")}
            ${ugcBuilderTextarea("middle", builder.middle, 3, "2-6s: Middle", "e.g. \"Ramai kawan complain cik somi dia selalu balik lewat...\"")}
            ${ugcBuilderInput("closing", builder.closing, "6-8s: Closing", "e.g. \"Order yang ni, baru puas hati!\"")}
          </div>
          <div class="ugc-builder-small-options">
            ${ugcBuilderClosingOptions.map((item) => `<button type="button" data-ugc-builder-field="closing" data-ugc-builder-value="${esc(item)}">${esc(item)}</button>`).join("")}
          </div>
        </section>
        <section class="ugc-builder-section">
          ${ugcBuilderSectionTitle("mic-2", "Tone, Voice & Style", "Social Commerce")}
          <div class="ugc-builder-three">
            ${ugcBuilderSelect("tone", "Tone", Object.keys(ugcBuilderToneOptions), builder.tone)}
            ${ugcBuilderSelect("voice", "Voice", Object.keys(ugcBuilderVoiceOptions), builder.voice)}
            ${ugcBuilderSelect("style", "Style", Object.keys(ugcBuilderStyleOptions), builder.style)}
          </div>
          ${ugcBuilderTextarea("stylePrompt", builder.stylePrompt, 3, "Visual Style")}
        </section>
        <section class="ugc-builder-section">
          ${ugcBuilderSectionTitle("file-pen-line", "Build Prompt", "Final")}
          <button class="ugc-builder-build" type="button" data-action="build-ugc-prompt">${icon("wand-sparkles", 18)} Build Prompt</button>
          ${ugcBuilderTextarea("builtPrompt", builtPrompt, 8, "", "Built prompt will appear here...")}
          <div class="ugc-builder-actions">
            <button type="button" data-action="copy-ugc-prompt">${icon("copy", 17)} Copy</button>
            <button type="button" data-action="use-ugc-prompt">${icon("video", 17)} Use in Video</button>
            <button type="button" data-action="save-ugc-prompt-template">${icon("bookmark", 17)} Save</button>
          </div>
        </section>
      </div>
    </section>
  </div>`;
}

function ugcBuilderSectionTitle(ic, title, pill) {
  return `<div class="ugc-builder-section-head">
    <h3>${icon(ic, 24)} ${title}</h3>
    <span>${pill}</span>
  </div>`;
}

function ugcBuilderOption(field, label, active, value, targetField) {
  const data = targetField ? ` data-ugc-builder-target="${esc(targetField)}" data-ugc-builder-target-value="${esc(value)}"` : "";
  return `<button type="button" class="${active === label ? "active" : ""}" data-ugc-builder-option="${esc(field)}" data-ugc-builder-value="${esc(label)}"${data}>${esc(label)}</button>`;
}

function ugcBuilderInput(field, value, label = "", placeholder = "") {
  return `<label class="ugc-builder-field">${label ? `<span>${esc(label)}</span>` : ""}<input type="text" data-ugc-builder-input="${esc(field)}" value="${esc(value || "")}" placeholder="${esc(placeholder)}"></label>`;
}

function ugcBuilderTextarea(field, value, rows = 3, label = "", placeholder = "") {
  return `<label class="ugc-builder-field">${label ? `<span>${esc(label)}</span>` : ""}<textarea rows="${rows}" data-ugc-builder-input="${esc(field)}" placeholder="${esc(placeholder)}">${esc(value || "")}</textarea></label>`;
}

function ugcBuilderSelect(field, label, options, active) {
  return `<label class="ugc-builder-field"><span>${esc(label)}</span><select data-ugc-builder-input="${esc(field)}">${options.map((item) => `<option value="${esc(item)}" ${item === active ? "selected" : ""}>${esc(item)}</option>`).join("")}</select></label>`;
}

function buildUgcPrompt(source = state.ugcPromptBuilder) {
  const builder = { ...defaultUgcPromptBuilder(), ...(source || {}) };
  const tone = ugcBuilderToneOptions[builder.tone] || builder.tone;
  const voice = ugcBuilderVoiceOptions[builder.voice] || builder.voice;
  const beginning = builder.beginning || "Wait, tengok ni.";
  const middle = builder.middle || "Produk ni nampak simple, tapi bila guna memang rasa daily routine jadi lagi senang.";
  const closing = builder.closing || "Tekan bawah.";
  return [
    "8-second TikTok Shop UGC video, vertical 9:16.",
    `Shot: ${builder.shot}.`,
    `Subject: ${builder.subject}.`,
    `Action: ${builder.action}`,
    "Dialog timeline:",
    `0-2s hook: "${beginning}"`,
    `2-6s middle: "${middle}"`,
    `6-8s closing: "${closing}"`,
    `Tone: ${tone}.`,
    `Voice: ${voice}.`,
    `Visual style: ${builder.stylePrompt}`,
    "Requirements: keep the same person and same product from the reference image, keep product visible, use natural Malaysian creator delivery, avoid exaggerated claims, no fake before-after, no text overlays unless requested."
  ].join("\n");
}

function activeResult() {
  return state.activeResultId ? findAssetResult(state.activeResultId) : null;
}

function resultPreviewModal() {
  const item = activeResult();
  const bg = item?.imageUrl ? resultMediaSrc(item, "image", { thumb: true, width: 640 }) : "";
  const promptText = item ? resultPromptText(item) : "";
  const safeTitle = esc(resultTitle(item));
  return `<div class="modal-backdrop result-lightbox-backdrop" data-action="close-modal" ${bg ? `style="--result-bg-image: url('${esc(bg)}')"` : ""}>
    ${bg ? `<div class="result-lightbox-bg" aria-hidden="true" style="background-image: url('${esc(bg)}')"></div>` : ""}
    <section class="result-lightbox" role="dialog" aria-modal="true" aria-label="Result details">
      <button class="result-lightbox-close" data-action="close-modal" type="button" aria-label="Close">${icon("x", 34)}</button>
      <div class="result-lightbox-media">${item ? resultPreview(item, { full: true }) : ""}</div>
      <aside class="result-detail-panel">
        <header class="result-detail-head">
          <span class="result-detail-avatar">${icon(item?.videoUrl ? "video" : "image", 22)}</span>
          <label>
            <span>Image name</span>
            <div class="result-title-editor ${state.resultTitleSavedId === item?.id ? "is-saved" : ""}">
              <input data-result-title="${esc(item?.id || "")}" value="${safeTitle}" aria-label="Image name">
              <button type="button" data-result-title-save="${esc(item?.id || "")}" aria-label="Save image name" title="Save image name">
                ${icon(state.resultTitleSavedId === item?.id ? "check-circle-2" : "check", 20)}
              </button>
            </div>
          </label>
        </header>
        <section class="result-detail-card result-detail-prompt-card">
          <div class="result-detail-section-title">
            <span>${icon("list-plus", 18)} PROMPT</span>
            <button type="button" class="result-detail-copy" data-action="copy-result-prompt">${icon("copy", 16)} Copy</button>
          </div>
          ${promptText
            ? `<div class="result-detail-prompt"><pre>${esc(promptText)}</pre><small>Scroll to see all</small></div>`
            : `<p class="result-detail-empty">No prompt saved for this image.</p>`}
        </section>
        <section class="result-detail-card">
          <div class="result-detail-section-title"><span>${icon("info", 18)} INFORMATION</span></div>
          <dl class="result-detail-info">
            <div><dt>Source</dt><dd>${esc(resultOriginLabel(item))}</dd></div>
            ${resultProjectInfoRow(item)}
            <div><dt>Model</dt><dd>${esc(resultModelDisplay(item))}</dd></div>
            <div><dt>Resolution</dt><dd>${esc(resultResolutionLabel(item))}</dd></div>
            <div><dt>Aspect Ratio</dt><dd>${esc(resultAspectRatioLabel(item))}</dd></div>
            <div><dt>Created</dt><dd>${esc(resultCreatedLabel(item))}</dd></div>
          </dl>
        </section>
        <section class="result-detail-card result-detail-reference-card">
          <div class="result-detail-section-title"><span>${icon("bookmark-plus", 18)} SAVE AS REFERENCE</span></div>
          <div class="result-detail-reference-actions">
            ${resultReferenceButton(item, "avatar")}
            ${resultReferenceButton(item, "product")}
          </div>
          ${resultProjectSaveButton(item)}
          <div class="result-detail-file-actions">
            <button type="button" class="result-detail-file-button download" data-result-action="download" data-result-id="${esc(item?.id || "")}" data-result-kind="${item?.videoUrl ? "video" : item?.imageUrl ? "image" : "text"}">
              ${icon("download", 20)}
              <span>Download</span>
            </button>
            <button type="button" class="result-detail-file-button delete" data-result-action="delete" data-result-id="${esc(item?.id || "")}">
              ${icon("trash-2", 20)}
              <span>Delete</span>
            </button>
          </div>
        </section>
      </aside>
    </section>
  </div>`;
}

function resultPromptModal() {
  const item = activeResult();
  const promptText = item ? resultPromptText(item) : "";
  return `<div class="modal-backdrop result-prompt-backdrop" data-action="close-modal">
    <section class="result-prompt-modal" role="dialog" aria-modal="true" aria-label="Full Prompt">
      <header>
        <h2>Full Prompt</h2>
        <button type="button" class="result-prompt-close" data-action="close-modal" aria-label="Close">X</button>
      </header>
      <div class="result-prompt-modal-body">
        <pre>${esc(promptText || "No prompt saved for this result.")}</pre>
        <button type="button" class="result-prompt-copy" data-action="copy-result-prompt">${icon("copy", 22)} Copy Prompt</button>
      </div>
    </section>
  </div>`;
}

function saveResultReferenceModal() {
  const item = activeResult();
  return `<div class="modal-backdrop result-modal-backdrop" data-action="close-modal">
    <section class="modal result-choice-modal" role="dialog" aria-modal="true" aria-label="Save to Attachments">
      <button class="icon-only close" data-action="close-modal" type="button">${icon("x")}</button>
      <p class="folder-label">${mascotIcon("label-mascot-icon")} Pokaya AI</p>
      <h2>保存到 Attachments</h2>
      <p class="result-modal-copy">把这张图锁成后续生成可复用的参考素材。</p>
      ${item ? `<div class="result-modal-preview">${resultPreview(item)}</div>` : ""}
      <div class="result-save-options">
        <button type="button" data-result-action="save-product" data-result-id="${esc(state.activeResultId || "")}">
          ${icon("package", 28)}
          <b>Product</b>
          <span>产品包装、标签、hero shot，用来锁定产品外观。</span>
        </button>
        <button type="button" data-result-action="save-avatar" data-result-id="${esc(state.activeResultId || "")}">
          ${icon("circle-user-round", 28)}
          <b>Avatar</b>
          <span>人物、脸、角色参考，用来保持 UGC 形象一致。</span>
        </button>
      </div>
    </section>
  </div>`;
}

function editResultImageModal() {
  const item = activeResult();
  const attachments = (state.db?.attachments || []).filter((entry) => !entry.projectId || entry.projectId === item?.projectId);
  const referenceOptions = attachments.map((entry) => `<option value="${esc(entry.id)}">${esc(entry.kind || "file")} · ${esc(entry.name || "Attachment")}</option>`).join("");
  return `<div class="modal-backdrop result-modal-backdrop" data-action="close-modal">
    <section class="modal result-edit-modal" role="dialog" aria-modal="true" aria-label="Edit Image">
      <button class="icon-only close" data-action="close-modal" type="button">${icon("x")}</button>
      <p class="folder-label">${icon("palette", 18)} Edit Image</p>
      <h2>重新编辑这张图片</h2>
      <form data-form="result-edit-image" class="result-edit-form">
        ${item ? `<div class="result-edit-preview">${resultPreview(item)}</div>` : ""}
        <label>生成模型
          <select name="model">
            <option value="GPT Image 2" ${resultModelLabel(item || {}).includes("GPT") ? "selected" : ""}>GPT IMAGE 2</option>
            <option value="Nano Banana Pro" ${resultModelLabel(item || {}).includes("NANO") ? "selected" : ""}>NANO BANANA PRO</option>
          </select>
        </label>
        <label>Edit instruction
          <textarea name="instruction" required placeholder="例如：保留产品和排版，把背景换成更马来西亚夜市感，CTA 更醒目。">${esc(resultPromptText(item || {}).slice(0, 500))}</textarea>
        </label>
        <label>Reference image (optional)
          <select name="referenceAttachmentId">
            <option value="">不使用额外参考</option>
            ${referenceOptions}
          </select>
        </label>
        <div class="result-edit-actions">
          <button class="gold-button" type="submit" ${state.editImageBusy ? "disabled" : ""}>${icon(state.editImageBusy ? "loader-circle" : "palette")} ${state.editImageBusy ? "生成中" : "Apply Edit"}</button>
          <button class="dark-button" type="button" data-action="close-modal">Cancel</button>
        </div>
      </form>
    </section>
  </div>`;
}

function bulkDeleteResultModal() {
  const count = selectedResults().length;
  return `<div class="modal-backdrop result-modal-backdrop" data-action="close-modal">
    <section class="modal result-choice-modal" role="dialog" aria-modal="true" aria-label="Delete selected results">
      <button class="icon-only close" data-action="close-modal" type="button">${icon("x")}</button>
      <p class="folder-label">${icon("trash-2", 18)} Delete</p>
      <h2>删除 ${count} 个生成结果？</h2>
      <p class="result-modal-copy">只会删除当前项目里的生成结果。已经保存到 Attachments 的 Product / Avatar 会继续保留。</p>
      <div class="delete-confirm"><div><button class="dark-button" data-action="close-modal">${icon("x")} 取消</button><button class="gold-button danger-button" data-action="confirm-bulk-delete-results" ${state.bulkDeleteBusy ? "disabled" : ""}>${icon(state.bulkDeleteBusy ? "loader-circle" : "trash-2")} ${state.bulkDeleteBusy ? "删除中" : "删除"}</button></div></div>
    </section>
  </div>`;
}

function deleteResultModal() {
  return `<div class="modal-backdrop result-modal-backdrop" data-action="close-modal">
    <section class="modal result-choice-modal" role="dialog" aria-modal="true" aria-label="Delete result">
      <button class="icon-only close" data-action="close-modal" type="button">${icon("x")}</button>
      <p class="folder-label">${icon("trash-2", 18)} Delete</p>
      <h2>删除这个生成结果？</h2>
      <p class="result-modal-copy">只删除当前结果卡片；已经保存到 Attachments 的 Product / Avatar 会继续保留。</p>
      <div class="delete-confirm"><div><button class="dark-button" data-action="close-modal">${icon("x")} 取消</button><button class="gold-button danger-button" data-action="confirm-delete-result">${icon("trash-2")} 删除</button></div></div>
    </section>
  </div>`;
}

function attachmentPickerModal() {
  const kind = state.attachmentPickerKind || "avatar";
  const lockedKind = ["avatar", "product"].includes(kind);
  const filter = lockedKind ? kind : state.attachmentPickerFilter || "all";
  const title = filter === "avatar" ? "Pick Avatar" : filter === "product" ? "Pick Product" : "Pick from Attachments";
  const items = (state.db?.attachments || []).filter((item) => {
    const projectMatch = !item.projectId || item.projectId === state.projectId;
    const filterMatch = filter === "all" || item.kind === filter;
    return projectMatch && filterMatch;
  });
  return `<div class="modal-backdrop attachment-picker-backdrop" data-action="close-modal">
    <section class="attachment-picker-modal ${lockedKind ? `attachment-picker-modal-${esc(filter)}` : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="attachment-picker-head">
        <h2>${esc(title)}</h2>
        <div>
          <label class="attachment-add-button ${lockedKind ? `attachment-add-button-${esc(filter)}` : ""}">${icon("upload", 21)} <span>Add new</span><input type="file" data-upload="${esc(kind)}" data-upload-select="${lockedKind ? esc(filter) : ""}" accept="image/*,video/*" hidden></label>
          <button class="icon-only attachment-picker-close" data-action="close-modal" type="button">${icon("x", 28)}</button>
        </div>
      </header>
      <div class="attachment-picker-body">
        ${lockedKind ? "" : `<div class="attachment-picker-tabs">
          ${attachmentPickerTab("product", "box", filter)}
          ${attachmentPickerTab("avatar", "circle-user-round", filter)}
          ${attachmentPickerTab("all", "gallery-horizontal", filter)}
        </div>`}
        ${lockedKind ? attachmentPickerUploadPanel(filter, items.length) : ""}
        <div class="attachment-picker-grid ${lockedKind ? "is-locked" : ""}">
          ${items.length ? items.map((item) => attachmentPickerCard(item, kind)).join("") : lockedKind ? attachmentPickerSavedEmpty(filter) : attachmentPickerEmpty(filter)}
        </div>
      </div>
    </section>
  </div>`;
}

function attachmentPickerTab(value, ic, active) {
  const label = value === "all" ? "All" : value[0].toUpperCase() + value.slice(1);
  return `<button type="button" class="${active === value ? "active" : ""}" data-filter-kind="${esc(value)}" data-attachment-filter="${esc(value)}">${icon(ic, 18)} ${label}</button>`;
}

function attachmentPickerCard(item, targetKind) {
  const preview = attachmentPreview(item);
  const title = item.name || (item.kind === "avatar" ? "Avatar reference" : "Product reference");
  const isVideo = item.mediaKind === "video" || /^video\//i.test(item.type || "");
  return `<button class="attachment-picker-card" type="button" data-attachment-pick="${esc(item.id)}" data-attachment-target="${esc(targetKind)}">
    ${preview}
    <b>${esc(title)}</b>
    <small>${isVideo ? icon("video", 14) : icon("image", 14)} ${esc(item.prompt || item.type || "Saved reference")}</small>
  </button>`;
}

function attachmentPreview(item) {
  const token = encodeURIComponent(state.token || "");
  const inlinePreview = item.dataUrl || item.previewUrl || "";
  if (inlinePreview && /^data:image\//i.test(inlinePreview)) {
    return `<img src="${esc(inlinePreview)}" alt="${esc(item.name || "Attachment")}" loading="lazy" decoding="async" fetchpriority="low">`;
  }
  if ((item.assetStorageKey || item.mediaUrl) && item.mediaKind !== "video") {
    return `<img src="/api/media/attachment/${encodeURIComponent(item.id)}/image?token=${token}" alt="${esc(item.name || "Attachment")}" loading="lazy" decoding="async" fetchpriority="low">`;
  }
  if ((item.assetStorageKey || item.mediaUrl) && item.mediaKind === "video") {
    return `<div class="attachment-placeholder">${icon("video", 44)}</div>`;
  }
  if (item.sourceResultId && item.mediaKind !== "video") {
    return `<img src="/api/media/result/${encodeURIComponent(item.sourceResultId)}/image?token=${token}&thumb=1&w=640" alt="${esc(item.name || "Attachment")}" loading="lazy" decoding="async" fetchpriority="low">`;
  }
  if (item.sourceResultId && item.mediaKind === "video") {
    return `<div class="attachment-placeholder">${icon("video", 44)}</div>`;
  }
  return `<div class="attachment-placeholder">${icon(item.kind === "avatar" ? "camera" : "package", 44)}</div>`;
}

function attachmentPickerUploadPanel(kind, count = 0) {
  const isAvatar = kind === "avatar";
  const title = isAvatar ? "Drop avatar image here" : "Drop product image here";
  const copy = isAvatar
    ? "Drag from desktop, or click to upload a face / creator reference."
    : "Drag from desktop, or click to upload a product reference.";
  const saved = isAvatar ? `${count} saved avatar${count === 1 ? "" : "s"}` : `${count} saved product${count === 1 ? "" : "s"}`;
  return `<label class="attachment-upload-panel ${isAvatar ? "avatar" : "product"}" data-drop-upload="${esc(kind)}">
    <input type="file" data-upload="${esc(kind)}" data-upload-select="${esc(kind)}" accept="image/*,video/*" hidden>
    <span class="attachment-upload-panel-icon">${icon(isAvatar ? "circle-user-round" : "package", 34)}</span>
    <span>
      <strong>${esc(title)}</strong>
      <p>${esc(copy)}</p>
    </span>
    <small>${esc(saved)} · PNG, JPG, WebP, or video</small>
  </label>`;
}

function attachmentPickerSavedEmpty(kind) {
  const label = kind === "avatar" ? "avatars" : "products";
  return `<div class="attachment-picker-saved-empty">
    <b>No saved ${esc(label)} yet</b>
    <span>Use the upload area above to add one.</span>
  </div>`;
}

function attachmentPickerEmpty(kind) {
  const noun = kind === "all" ? "attachments" : kind === "avatar" ? "avatars" : "products";
  const uploadKind = kind === "all" ? state.attachmentPickerKind || "product" : kind;
  const actionLabel = kind === "avatar" ? "Drop avatar image here" : kind === "product" ? "Drop product image here" : "Drop image here";
  return `<label class="attachment-picker-empty" data-drop-upload="${esc(uploadKind)}">
    <input type="file" data-upload="${esc(uploadKind)}" accept="image/*,video/*" hidden>
    <span class="attachment-drop-icon">${icon("image-up", 42)}</span>
    <strong>${esc(actionLabel)}</strong>
    <p>Drag from desktop, or click this box to upload ${esc(noun === "attachments" ? "a reference" : `one of your ${noun}`)}.</p>
    <small>PNG, JPG, WebP, or video references</small>
  </label>`;
}

function sopDashboardContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Dashboard — Project & Production Summary",
      close: "Faham - tutup",
      path: "Welcome screen · pick / create project · daily stats",
      whatTitle: "Apa ini?",
      what: "Dashboard ialah landing page selepas login. Ia tunjuk ringkasan production keseluruhan, credit yang digunakan dan project yang sedang aktif. Semua generation seperti Image, UGC, Audio, Story, Cinema dan Clone mesti dibuat dalam satu project supaya history, cost dan output tidak bercampur.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna Dashboard setiap kali login, bila nak switch client atau campaign, dan bila nak semak output bulan ini: berapa banyak asset sudah generated, berapa credit/cost digunakan dan hari mana production paling aktif.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Buat satu project untuk satu client, campaign atau produk. Generate batch content, review output dalam history grid, kemudian ulang semula pada bulan baru supaya Dashboard boleh tunjuk progression yang jelas.",
      sections: { 7: "Detail — Stats Cards & Filter", 11: "Sidebar Layout — Apa Setiap Section" },
      steps: [
        { no: "1", title: "Dashboard overview", subtitle: "Stats cards, date filter dan daily production chart", copy: "Bahagian atas tunjuk total Image, UGC, Cinema, Audio dan Total Cost untuk date range yang dipilih. Bahagian tengah ialah filter tarikh. Chart bawah bantu korang nampak trend production setiap hari." },
        { no: "2", title: "Apa itu Project?", copy: "Project ialah folder kerja untuk satu client, campaign atau produk. Semua generation, history dan cost akan disimpan ikut project yang aktif.", bullets: ["Project 'meow' — client A skincare brand", "Project 'Project 1' — client B yoga pants"], after: "Tukar project di sidebar bermaksud tukar context kerja." },
        { no: "3", title: "Buat New Project", copy: "Tekan + New Project, masukkan nama yang jelas seperti 'Brand X Campaign Q1', kemudian create. Project baru akan muncul dalam sidebar.", tip: "Pakai nama specific. 'Skincare-A-Aug-Campaign' lebih mudah dibaca daripada 'Project 5'." },
        { no: "4", title: "Switch antara Projects", copy: "Klik nama project di sidebar untuk tukar workspace. Semua tab generation dan history akan ikut project yang dipilih." },
        { no: "5", title: "Search Projects", copy: "Gunakan search bar kalau project sudah banyak. Taip nama client, produk atau campaign untuk filter senarai project." },
        { no: "6", title: "Project menu (3-dot)", copy: "Hover project untuk buka menu 3-dot. Dari sini boleh rename atau delete project.", tip: "Rename selamat. Delete hanya bila project memang sudah tamat kerana history dalam project itu akan hilang." },
        { no: "7", title: "Stats cards", copy: "Cards menunjukkan total generation mengikut asset type dalam date range aktif.", bullets: ["Image — gambar dari Image tab", "UGC — video dari UGC tab", "Cinema — video cinematic / story output", "Audio — batch content plan dan video"] },
        { no: "8", title: "Total Cost", copy: "Total Cost menunjukkan credit atau kos generation dalam date range tersebut. Ini berguna untuk kira monthly spend atau charge client.", tip: "Untuk invoice bulanan, set From ke hari pertama bulan dan To ke hari terakhir bulan." },
        { no: "9", title: "Filter by Date Range", copy: "Pilih From Date dan To Date, kemudian tekan Apply. Reset akan kembali ke range default. Tarikh ikut timezone Malaysia." },
        { no: "10", title: "Daily Production chart", copy: "Chart ini tunjuk trend harian. Gunakan untuk cari spike, gap production atau hari campaign berjalan kuat." },
        { no: "11", title: "Logo & Dashboard button", copy: "Logo membawa korang balik ke workspace utama. Dashboard button akan aktif bila korang berada di overview ini." },
        { no: "12", title: "+ New Project button", copy: "Button ini create project baru. Badge kecil menunjukkan jumlah project semasa supaya korang tahu berapa workspace aktif." },
        { no: "13", title: "Projects list", copy: "Senarai project berada di sidebar. Klik row untuk switch project. Menu 3-dot muncul untuk rename atau delete." },
        { no: "14", title: "Account section", copy: "Bahagian account mengandungi Billing, Top Up Credit, Usage, Auto Post TikTok, SOP dan WhatsApp discussion." },
        { no: "15", title: "Credit Balance card", copy: "Kad ini tunjuk baki credit semasa dan shortcut untuk top up." },
        { no: "16", title: "Plan status badge", copy: "Badge Pro dan days left menunjukkan status subscription dan masa sebelum renewal." },
        { no: "17", title: "User card", copy: "Bahagian bawah sidebar tunjuk nama, email, Settings dan Sign out." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "Dashboard — 项目与产出总览",
      close: "我明白了 - 关闭",
      path: "登录首页 · 选择 / 创建项目 · 查看每日数据",
      whatTitle: "这是什么？",
      what: "Dashboard 是您登录后的工作台首页。它会汇总当前账号的整体产出、生成成本、Credit 使用情况和正在操作的项目。Image、UGC、Audio、Story、Cinema、Clone 等所有生成动作，都应该先归入一个 Project，方便您后续查看历史、复盘成本和管理客户交付。",
      whenTitle: "什么时候用？",
      when: "每次登录、切换客户 / Campaign、查看本月产出、核对成本或复盘每日生成节奏时，都先看 Dashboard。它不是一个装饰页，而是您判断下一步要继续生成、复盘还是发布的总控台。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "操作建议",
      workflow: "一个客户、一个 Campaign 或一个产品，尽量对应一个 Project。先批量生成内容，再在 history grid 里复盘，月底用 Dashboard 看总量、成本和节奏，下个月继续沿用同一个 Project 追踪增长。",
      sections: { 7: "细节 — 数据卡片与筛选", 11: "侧边栏 — 每个区域的作用" },
      steps: [
        { no: "1", title: "Dashboard 总览", subtitle: "数据卡片、日期筛选、每日产出图表", copy: "顶部是 Image、UGC、Cinema、Audio 和 Total Cost 的汇总。中间可以用日期筛选指定时间范围。下方图表用来查看每天的生成趋势。" },
        { no: "2", title: "Project 是什么？", copy: "Project 可以理解成一个工作文件夹，用来承载一个客户、一个 Campaign 或一个产品。所有生成内容、历史记录和成本都会归入当前 Project。", bullets: ["Project 'meow' — 客户 A 的护肤品牌", "Project 'Project 1' — 客户 B 的瑜伽裤产品"], after: "切换 sidebar 里的 Project，就等于切换当前工作上下文。" },
        { no: "3", title: "创建 New Project", copy: "点击 + New Project，输入清楚的项目名，例如 'Brand X Campaign Q1'，然后创建。新项目会出现在左侧 Projects 列表里。", tip: "命名尽量具体。'Skincare-A-Aug-Campaign' 比 'Project 5' 更容易管理。" },
        { no: "4", title: "切换 Project", copy: "点击 sidebar 里的项目名称，就会切换当前 workspace。所有生成 tab 和 history 都会跟着当前 Project 变化。" },
        { no: "5", title: "搜索 Project", copy: "项目变多后，用 sidebar 顶部的搜索框输入客户名、产品名或 Campaign 名，可以快速过滤项目。" },
        { no: "6", title: "Project 三点菜单", copy: "鼠标移到项目上，会出现 3-dot 菜单。您可以 Rename 或 Delete 项目。", tip: "Rename 是安全操作。Delete 会删除该项目里的历史内容，只在项目确实废弃时使用。" },
        { no: "7", title: "数据卡片", copy: "这些卡片显示当前日期范围内，各类资产的生成总量。", bullets: ["Image — Image tab 生成的图片", "UGC — UGC tab 生成的视频", "Cinema — cinematic / story 视频输出", "Audio — 批量内容计划和视频"] },
        { no: "8", title: "Total Cost", copy: "Total Cost 显示当前日期范围内消耗的 Credit 或生成成本，适合用来做月度成本核算或客户报价。", tip: "做月度 invoice 时，把 From 设为月初，把 To 设为月底。" },
        { no: "9", title: "日期筛选", copy: "选择 From Date 和 To Date 后点击 Apply。Reset 会回到默认时间范围。日期按马来西亚时间计算。" },
        { no: "10", title: "每日产出图表", copy: "这个图表用来观察每日生成趋势，帮助您发现爆发日、空档期或 Campaign 启动后的产出变化。" },
        { no: "11", title: "Logo 与 Dashboard 按钮", copy: "Logo 用来回到主工作台。Dashboard 按钮高亮时，代表您正在查看这个总览页。" },
        { no: "12", title: "+ New Project 按钮", copy: "这个按钮用来创建新项目。旁边的小数字显示当前项目数量和套餐上限。" },
        { no: "13", title: "Projects 列表", copy: "所有项目都在 sidebar 的 Projects 列表里。点击项目即可切换，三点菜单用于 rename 或 delete。" },
        { no: "14", title: "Account 区域", copy: "Account 区域包含 Billing、Top Up Credit、Usage、Auto Post TikTok、SOP 和 WhatsApp 社群入口。" },
        { no: "15", title: "Credit Balance 卡片", copy: "这里显示当前 Credit 余额，并提供快速充值入口。" },
        { no: "16", title: "Plan 状态", copy: "Pro 和 days left 会显示当前订阅状态，以及距离续费还有多少天。" },
        { no: "17", title: "用户卡片", copy: "sidebar 底部显示您的名称、邮箱、Settings 和 Sign out。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "Dashboard — Project & Production Summary",
      close: "Got it - close",
      path: "Welcome screen · choose / create project · review daily stats",
      whatTitle: "What is this?",
      what: "The Dashboard is the first workspace screen after login. It summarizes total production, generation cost, credit usage, and the active project. Every generation flow — Image, UGC, Audio, Story, Cinema, and Clone — should live inside a project so history, cost, and deliverables stay organized.",
      whenTitle: "When should I use it?",
      when: "Use the Dashboard whenever you log in, switch between clients or campaigns, check monthly output, review spend, or decide what to generate next. Think of it as the control room for production, not a decorative landing page.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Create one project per client, campaign, or product. Generate a content batch, review the history grid, then use the Dashboard at month end to track output, cost, and production rhythm before continuing the next batch.",
      sections: { 7: "Details — Stats Cards & Filter", 11: "Sidebar Layout — What Each Section Does" },
      steps: [
        { no: "1", title: "Dashboard overview", subtitle: "Stats cards, date filter, and daily production chart", copy: "The top cards summarize Image, UGC, Cinema, Audio, and Total Cost for the selected date range. The date filter controls the reporting window. The chart shows production activity by day." },
        { no: "2", title: "What is a Project?", copy: "A project is a workspace folder for one client, campaign, or product. All generated assets, history, and cost data are stored under the active project.", bullets: ["Project 'meow' — Client A skincare brand", "Project 'Project 1' — Client B yoga pants"], after: "Switching projects in the sidebar changes the working context." },
        { no: "3", title: "Create a New Project", copy: "Click + New Project, enter a clear name such as 'Brand X Campaign Q1', then create it. The new project appears in the Projects list.", tip: "Use specific names. 'Skincare-A-Aug-Campaign' is easier to manage than 'Project 5'." },
        { no: "4", title: "Switch between Projects", copy: "Click a project name in the sidebar to switch workspaces. Generation tabs and history grids will follow the selected project." },
        { no: "5", title: "Search Projects", copy: "When the list grows, use the sidebar search field to filter by client, product, or campaign name." },
        { no: "6", title: "Project menu (3-dot)", copy: "Hover over a project to reveal the 3-dot menu. Use it to rename or delete a project.", tip: "Rename is safe. Delete removes that project's history, so use it only for abandoned projects." },
        { no: "7", title: "Stats cards", copy: "Stats cards show generated asset totals for the active date range.", bullets: ["Image — images generated from the Image tab", "UGC — videos generated from the UGC tab", "Cinema — cinematic / story video output", "Audio — batch content plans and videos"] },
        { no: "8", title: "Total Cost", copy: "Total Cost shows credit spend or generation cost for the selected range. Use it for monthly accounting or client billing.", tip: "For a monthly invoice, set From to the first day of the month and To to the last day." },
        { no: "9", title: "Date Range Filter", copy: "Choose From Date and To Date, then click Apply. Reset returns to the default range. Dates follow Malaysia time." },
        { no: "10", title: "Daily Production chart", copy: "The chart shows daily production trends so you can spot spikes, gaps, or campaign launch activity." },
        { no: "11", title: "Logo & Dashboard button", copy: "The logo brings you back to the main workspace. The Dashboard button is highlighted when this overview is active." },
        { no: "12", title: "+ New Project button", copy: "Use this button to create a new project. The small badge shows your current project count." },
        { no: "13", title: "Projects list", copy: "All projects live in the sidebar list. Click a row to switch, or use the 3-dot menu to rename or delete." },
        { no: "14", title: "Account section", copy: "The Account section includes Billing, Top Up Credit, Usage, Auto Post TikTok, SOP, and the WhatsApp discussion group." },
        { no: "15", title: "Credit Balance card", copy: "This card shows your current credit balance and gives you a quick Top Up shortcut." },
        { no: "16", title: "Plan status", copy: "The Pro and days-left badge shows subscription status and time before renewal." },
        { no: "17", title: "User card", copy: "The bottom card shows your name, email, Settings, and Sign out." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopImageContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Tab Image — Generate Image AI",
      close: "Faham - tutup",
      path: "Banana Pro · GPT Image 2 · Imagen 4",
      whatTitle: "Apa ini?",
      what: "Tab Image digunakan untuk generate gambar avatar, produk atau scene custom dengan AI. Korang boleh combine character reference, product reference dan prompt supaya AI hasilkan gambar baru yang konsisten. Output 9:16 paling sesuai untuk TikTok dan boleh dipakai semula dalam UGC workflow.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna tab Image bila korang nak create avatar dahulu sebelum generate video, nak product placement tanpa photographer, atau nak banyak variasi muka avatar untuk digunakan semula dalam UGC tab.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Generate 5-10 avatar atau product scene yang paling kuat dahulu. Simpan output terbaik, kemudian reuse sebagai reference di UGC tab supaya video batch selepas itu nampak konsisten.",
      sections: { 5: "Dropdown & Pilihan — Apa Maksud Setiap Satu" },
      steps: [
        { no: "1", title: "Form overview", subtitle: "Image Generator, Character Reference, Product Reference", copy: "Tiga card utama ialah Image Generator untuk pilih Model dan Mode, Character Reference untuk drop muka avatar, dan Product Reference untuk drop gambar produk. Di bawah ada Prompt & Settings dengan preset Avatar, Product dan Sales." },
        { no: "2", title: "Upload Character Reference", copy: "Drag muka avatar yang korang nak guna. Pilih selfie yang clear dan fokus pada satu muka. AI akan cuba kekalkan muka itu dalam semua variation yang korang generate. Boleh juga guna From History kalau avatar pernah generated sebelum ini.", tip: "Satu muka clear sudah cukup. Kalau reference ada ramai orang, AI mudah confused." },
        { no: "3", title: "Upload Product Reference", copy: "Drag gambar produk kalau ada. Pastikan packaging, label dan bentuk produk jelas supaya AI boleh kekalkan produk dalam scene. Skip step ini kalau cuma nak buat avatar shot." },
        { no: "4", title: "Tekan Generate Image", copy: "Tekan Generate Image untuk mula. Cost RM0.20 per gambar. Pending card akan muncul di history bawah. Biasanya tunggu 15-30 saat. Lepas siap, gambar boleh download atau dipakai dalam UGC tab sebagai reference." },
        { no: "5", title: "Dropdown MODEL — pilih engine AI", copy: "Banana Pro ialah default dan paling stabil untuk muka Malaysia serta character consistency. GPT Image 2 lebih kreatif untuk aesthetic scene tetapi muka kadang kurang consistent. Imagen 4 paling realistic untuk product hero shot dan premium look.", tip: "Mula dengan Banana Pro untuk avatar. Switch ke GPT Image 2 untuk scene unik. Guna Imagen 4 untuk hero shot produk." },
        { no: "6", title: "Dropdown MODE — type of operation", copy: "Create Image ialah default untuk generate dari prompt dan reference. Mode lain seperti edit atau inpaint lebih advanced dan biasanya tidak perlu untuk UGC workflow standard.", tip: "Stick dengan Create Image untuk 95% case." },
        { no: "7", title: "Tab AVATAR / PRODUCT / SALES", copy: "Avatar berisi preset persona untuk muka creator. Product berisi preset untuk product shot seperti flat lay, pedestal atau splash. Sales berisi visual marketing-style untuk ads dan banners.", tip: "Tap preset untuk auto-fill prompt, kemudian edit ikut produk sendiri." },
        { no: "8", title: "Female persona presets", copy: "Kebaya 20s untuk anak dara modern, Casual 20s untuk Gen Z daily casual, Makcik untuk warm motherly look, Kitchen untuk cooking context, Nenek untuk senior trust vibe, dan Nenek Garden untuk outdoor senior scene.", tip: "Women's product: Kebaya 20s atau Casual 20s. Family product: Makcik. Testimoni grandparent: Nenek." },
        { no: "9", title: "Male persona presets", copy: "Baju Melayu 20s untuk young traditional look, Casual 20s untuk Gen Z daily casual, Abang Pro untuk professional 30s, dan Pakcik untuk warm paternal trust look.", tip: "Pakcik vibe sesuai untuk produk yang perlukan trust dan recommendation." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "Image 页面 — AI 图片生成",
      close: "我明白了 - 关闭",
      path: "Banana Pro · GPT Image 2 · Imagen 4",
      whatTitle: "这是什么？",
      what: "Image 页面用来生成 avatar、产品图或自定义场景。您可以上传人物参考、产品参考，再配合 prompt，让 AI 生成新的图片。9:16 输出最适合 TikTok，也可以继续作为 UGC 视频生成的参考图。",
      whenTitle: "什么时候用？",
      when: "当您要先做 avatar、没有摄影师但需要 product placement，或想批量生成多张 creator 形象再拿去 UGC tab 复用时，就先用 Image tab。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "操作建议",
      workflow: "先生成 5-10 张最稳定的 avatar 或产品场景图，挑出效果最好的保存下来，再在 UGC tab 里复用，这样后续视频会更统一。",
      sections: { 5: "下拉选项 — 每个选项是什么意思" },
      steps: [
        { no: "1", title: "表单总览", subtitle: "Image Generator、Character Reference、Product Reference", copy: "主要有三张卡：Image Generator 用来选择 Model 和 Mode；Character Reference 用来上传 avatar 人脸；Product Reference 用来上传产品图。下方的 Prompt & Settings 里有 Avatar、Product、Sales 三类 preset。" },
        { no: "2", title: "上传 Character Reference", copy: "上传您要保留的人物脸。最好用清晰自拍，并且画面里只有一个人。AI 会尽量在后续 variation 里保持这张脸的一致性。也可以用 From History 选择之前生成过的 avatar。", tip: "一张清楚的人脸就够了。参考图里如果有多人，AI 很容易混乱。" },
        { no: "3", title: "上传 Product Reference", copy: "如果有产品图，就上传包装、label 和形状都清楚的图片。AI 会尽量把产品保留在新场景里。如果只是生成 avatar，可以跳过这一步。" },
        { no: "4", title: "点击 Generate Image", copy: "点击 Generate Image 开始生成。每张图成本 RM0.20。下方 history 会出现 pending card，通常等待 15-30 秒。完成后可以下载，也可以拿到 UGC tab 作为 reference。" },
        { no: "5", title: "MODEL 下拉 — 选择 AI 引擎", copy: "Banana Pro 是默认选项，适合马来西亚人脸和角色一致性。GPT Image 2 更适合创意场景和 aesthetic visual，但人脸可能没那么稳定。Imagen 4 更适合高真实感产品 hero shot。", tip: "Avatar 先用 Banana Pro。需要特别场景时用 GPT Image 2。产品高级图用 Imagen 4。" },
        { no: "6", title: "MODE 下拉 — 操作类型", copy: "Create Image 是默认模式，用 prompt 和 reference 生成新图。其它 edit / inpaint 类模式更 advanced，标准 UGC 操作通常不用。", tip: "95% 情况保持 Create Image 就好。" },
        { no: "7", title: "AVATAR / PRODUCT / SALES tabs", copy: "Avatar 是人物 preset；Product 是产品图 preset，例如 flat lay、pedestal、splash；Sales 是广告和 banner 风格的营销视觉。", tip: "点击 preset 会自动填 prompt，您可以再按产品修改。" },
        { no: "8", title: "女性 persona presets", copy: "Kebaya 20s 是现代 kebaya 年轻女性；Casual 20s 是 Gen Z 日常风；Makcik 是温暖妈妈感；Kitchen 是厨房场景；Nenek 是长辈信任感；Nenek Garden 是户外花园长辈场景。", tip: "女性产品用 Kebaya 20s 或 Casual 20s；家庭产品用 Makcik；长辈 testimonial 用 Nenek。" },
        { no: "9", title: "男性 persona presets", copy: "Baju Melayu 20s 是年轻传统造型；Casual 20s 是 Gen Z 日常风；Abang Pro 是 30 岁左右专业形象；Pakcik 是温暖可信的叔叔感。", tip: "需要信任背书的产品，可以测试 Pakcik 风格。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "Image Tab — AI Image Generation",
      close: "Got it - close",
      path: "Banana Pro · GPT Image 2 · Imagen 4",
      whatTitle: "What is this?",
      what: "The Image tab is for generating avatar, product, or custom scene images with AI. You can combine a character reference, product reference, and prompt to create a new visual. 9:16 output works best for TikTok and can be reused later as a UGC video reference.",
      whenTitle: "When should I use it?",
      when: "Use the Image tab when you need an avatar before video generation, product placement without a photographer, or multiple creator-face variations to reuse in the UGC tab.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Generate 5-10 strong avatar or product-scene images first. Save the best outputs, then reuse them in the UGC tab so later video batches stay visually consistent.",
      sections: { 5: "Dropdowns & Options — What Each One Means" },
      steps: [
        { no: "1", title: "Form overview", subtitle: "Image Generator, Character Reference, Product Reference", copy: "The main cards are Image Generator for Model and Mode, Character Reference for an avatar face, and Product Reference for product images. Prompt & Settings includes Avatar, Product, and Sales presets." },
        { no: "2", title: "Upload Character Reference", copy: "Upload the avatar face you want to keep. Use a clear selfie with one person in frame. The AI will try to keep that face consistent across variations. You can also choose an earlier avatar from History.", tip: "One clear face is enough. If the reference has multiple people, the AI may mix them up." },
        { no: "3", title: "Upload Product Reference", copy: "Upload a product image if you have one. Make sure packaging, labels, and shape are clear so the AI can preserve the product in the scene. Skip this if you only need an avatar shot." },
        { no: "4", title: "Click Generate Image", copy: "Click Generate Image to start. Cost is RM0.20 per image. A pending card appears in history. Most generations complete in 15-30 seconds. Once ready, download it or reuse it in the UGC tab as a reference." },
        { no: "5", title: "MODEL dropdown — choose the AI engine", copy: "Banana Pro is the default and is strongest for Malaysian faces and character consistency. GPT Image 2 is more creative for aesthetic scenes, but faces may be less consistent. Imagen 4 is best for realistic premium product hero shots.", tip: "Start with Banana Pro for avatars. Use GPT Image 2 for unique scenes. Use Imagen 4 for premium product visuals." },
        { no: "6", title: "MODE dropdown — operation type", copy: "Create Image is the default mode for generating from prompt and references. Other edit or inpaint modes are advanced and usually not needed for the standard UGC workflow.", tip: "Keep Create Image for most cases." },
        { no: "7", title: "AVATAR / PRODUCT / SALES tabs", copy: "Avatar contains creator-persona presets. Product contains product-shot presets such as flat lay, pedestal, or splash. Sales contains marketing-style visuals for ads and banners.", tip: "Tap a preset to auto-fill the prompt, then edit it for your product." },
        { no: "8", title: "Female persona presets", copy: "Kebaya 20s is a modern young kebaya look. Casual 20s is Gen Z daily casual. Makcik gives a warm motherly feel. Kitchen is for cooking context. Nenek gives senior trust. Nenek Garden creates an outdoor senior scene.", tip: "Women's products: Kebaya 20s or Casual 20s. Family products: Makcik. Grandparent testimonial: Nenek." },
        { no: "9", title: "Male persona presets", copy: "Baju Melayu 20s is a young traditional look. Casual 20s is Gen Z daily casual. Abang Pro is a professional 30s look. Pakcik gives a warm, trusted uncle feel.", tip: "Use Pakcik when the product needs trust and recommendation energy." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopUgcContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Tab UGC — Generate Video Selfie Style",
      close: "Faham - tutup",
      path: "Veo 3.1 Fast · 8 saat · vertical 9:16",
      whatTitle: "Apa ini?",
      what: "Tab UGC digunakan untuk generate video gaya selfie atau handheld, seolah-olah orang sebenar sedang review produk dalam Bahasa Melayu. Avatar boleh pegang produk, bercakap ke kamera dan ikut dialog yang korang tulis. Format ini paling sesuai untuk affiliate dan TikTok Shop content.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna UGC bila korang nak satu video review dengan dialog yang sudah jelas. Kalau nak banyak video sekali gus dengan AI plan, guna Audio. Kalau nak AI bantu draft variasi, buka AI Agent UGC di chat panel bawah.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Tip terakhir",
      workflow: "Modesty rule auto-applied untuk persona Malaysia: long sleeves, no cleavage dan no thigh exposure. Dialog paling stabil ialah 20-24 patah perkataan BM supaya audio sync dalam video 8s lebih natural.",
      sections: { 1: "Cara guna Manual UGC (form atas)", 7: "Cara guna AI Agent UGC (chat panel)", 10: "Lepas Generate — History Grid", 12: "Dropdown & Pilihan — Apa Maksud Setiap Satu" },
      steps: [
        { no: "1", title: "Form UGC overview", subtitle: "Video Generator, Scene, Size, Generate UGC", copy: "Video Generator digunakan untuk duration 8s dan Image Mode. Scene ialah tempat upload produk, tulis prompt atau dialog, dan buka Prompt Builder kalau stuck. Size biasanya 9:16 untuk TikTok. Generate UGC ialah button kuning untuk mula generate.", tip: "Layout sama pada mobile; cuma scroll naik turun." },
        { no: "2", title: "Pilih Image Mode", copy: "Product Reference ialah default dan paling sesuai untuk product review. First Frame animate gambar yang sudah siap. Text to Video guna description sahaja tanpa image reference.", tip: "Untuk product review natural, pakai Product Reference supaya AI boleh letak avatar pegang produk dalam scene yang sesuai." },
        { no: "3", title: "Upload Image Reference", copy: "Tekan Upload atau drag gambar produk masuk. Gunakan History kalau nak reuse gambar dari project sebelum ini. Tekan X untuk buang reference.", tip: "Gambar produk yang clear, satu subjek dan lighting baik akan beri hasil video paling stabil. Elakkan background terlalu busy." },
        { no: "4", title: "Tulis Scene Prompt + Dialog", copy: "Describe setting, action dan dialog yang avatar perlu cakap. Untuk Veo 8s, sweet spot dialog ialah 18-22 perkataan. Tulis dalam 2-3 ayat yang natural macam bercakap dengan kawan.", tip: "Contoh: Malay woman in kitchen, holding a jar of sambal, smiling at camera, says: \"Korang, sambal ni gila pedas! Aku makan setiap hari sekarang. Cuba la!\"" },
        { no: "5", title: "Tekan Prompt Builder", copy: "Prompt Builder akan tanya persona, scene, hook, framework, voice dan dialog. Selepas itu sistem auto-generate prompt yang korang boleh edit sebelum generate.", tip: "First-timer memang patut guna Prompt Builder. Bila sudah biasa, baru tulis direct." },
        { no: "6", title: "Set Size + Generate UGC", copy: "Default size ialah 9:16 untuk TikTok. Tekan Generate UGC untuk mula. Pending card muncul di history bawah. Veo 3.1 Fast biasanya siap dalam 60-90 saat. Cost RM0.40 per video.", tip: "Boleh generate beberapa versi dengan prompt yang sedikit berbeza." },
        { no: "7", title: "Buka AI Agent UGC", copy: "Tekan floating chat button di bottom-right untuk buka AI Agent. Agent boleh chat dalam BM, cadangkan video variants dan submit terus untuk generate.", tip: "Agent ada skill library untuk persona, scene, hook, framework dan voice. Korang cuma explain apa nak buat." },
        { no: "8", title: "Cerita apa korang nak", copy: "Type natural macam WhatsApp. Contoh: 'Buat 3 video UGC untuk produk skincare aku, persona urban hijabi, hook pain confession'. Boleh attach gambar produk melalui icon clip.", tip: "Agent akan tanya soalan bila perlu seperti duration, voice, hijab/no hijab atau product angle." },
        { no: "9", title: "Type SUBMIT untuk fire generate", copy: "Bila variants sudah ready, agent akan tunjuk preview dan minta korang type SUBMIT. Confirmation dialog akan keluar supaya korang boleh review, edit jika perlu dan approve.", tip: "Untuk video tanpa orang, cakap 'buat video type product, tanpa orang'. Agent akan switch ke product mode." },
        { no: "10", title: "History Grid", subtitle: "Generated videos dengan action buttons", copy: "Bawah form ada History — UGC — project semasa. Setiap card ada thumbnail, model label, nama editable dan action buttons seperti Extend, Combine, Improve, Download dan Delete.", tip: "Tekan thumbnail untuk full-screen player. Kalau pending lama, tekan recheck status pada card." },
        { no: "11", title: "Extend ke 16 saat", copy: "Video status done boleh ditekan Extend untuk generate sambungan 8 saat lagi. Sistem akan merge segment 1 dan segment 2 menjadi video 16s.", tip: "Pakai Frame Anchor last untuk continuation yang lebih natural. Voice dikunci dari segment pertama supaya bunyi sama." },
        { no: "12", title: "Duration 8s", copy: "UGC fixed 8 saat per generation kerana limit Veo 3.1 Fast dan dialog BM paling sedap pada 18-22 perkataan. Kalau nak 16s, generate 8s dahulu lalu tekan Extend.", tip: "Cost RM0.40 per 8s shot. 16s extended = RM0.80." },
        { no: "13", title: "Image Mode dropdown", copy: "Product Reference auto-create scene daripada gambar produk. First Frame animate image yang sudah complete. Text to Video guna text sahaja dan tidak perlukan reference, tetapi avatar mungkin kurang consistent.", tip: "95% case gunakan Product Reference. First Frame untuk cinematic shot. Text to Video untuk scene tanpa produk." },
        { no: "14", title: "Size dropdown", copy: "9:16 ialah default untuk TikTok, Reels dan Shorts. 16:9 sesuai untuk YouTube long-form, Facebook, IG horizontal atau landing page hero video." },
        { no: "15", title: "Voice dropdown dalam Prompt Builder", copy: "Pilih voice ikut gender, pitch dan vibe. Untuk female casual review, cuba callirrhoe atau leda. Untuk male confident, cuba achird atau alnilam. Voice akan dikunci across segment 1 dan 2 supaya seamless." },
        { no: "16", title: "Action buttons kat History Card", copy: "Extend tambah 8s continuation. Combine merge 2-4 video. Improve regenerate dengan prompt enhancement. Download simpan MP4. Delete buang video dari history.", tip: "Combine sangat useful untuk jadikan 4 angle berbeza sebagai narrative video yang lebih panjang." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "UGC 页面 — 自拍风视频生成",
      close: "我明白了 - 关闭",
      path: "Veo 3.1 Fast · 8 秒 · 竖屏 9:16",
      whatTitle: "这是什么？",
      what: "UGC 页面用来生成自拍感、手持感的视频，就像真实 creator 用马来语对着镜头介绍产品。Avatar 可以拿着产品、看镜头说您写好的台词，适合 affiliate 和 TikTok Shop 内容。",
      whenTitle: "什么时候用？",
      when: "当您已经有明确台词，只想生成一条 UGC review 视频时，用 UGC tab。如果要一次做很多条并让 AI 帮您规划，用 Audio。如果想边聊边让 AI 起草，用下方的 AI Agent UGC。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "最后提示",
      workflow: "系统会自动套用适合马来西亚受众的 modesty rule，例如长袖、避免暴露。马来语台词控制在 20-24 个词以内，8 秒视频的口型和声音同步会更稳定。",
      sections: { 1: "手动 UGC 表单", 7: "AI Agent UGC 聊天面板", 10: "生成后 — History Grid", 12: "下拉选项 — 每个选项是什么意思" },
      steps: [
        { no: "1", title: "UGC 表单总览", subtitle: "Video Generator、Scene、Size、Generate UGC", copy: "Video Generator 用来选择 8s duration 和 Image Mode。Scene 用来上传产品图、写 prompt / dialog，并在卡住时打开 Prompt Builder。Size 通常选 9:16。Generate UGC 是开始生成的黄色按钮。", tip: "手机端也是同一套布局，只是上下滚动。" },
        { no: "2", title: "选择 Image Mode", copy: "Product Reference 是默认模式，最适合产品 review。First Frame 会把一张完整图片动画化。Text to Video 只靠文字描述，不需要图片。", tip: "自然产品 review 优先用 Product Reference，让 AI 自动安排 avatar 拿着产品出镜。" },
        { no: "3", title: "上传 Image Reference", copy: "点击 Upload 或把产品图拖进去。也可以用 History 复用之前项目里的图片。点 X 可以移除 reference。", tip: "产品图越清楚越好：单一主体、光线好、背景不乱，视频结果会更稳定。" },
        { no: "4", title: "写 Scene Prompt + Dialog", copy: "描述场景、动作和 avatar 要说的话。Veo 8 秒最适合 18-22 个词左右的台词。用 2-3 句自然口语来写，像跟朋友讲话。", tip: "例子：Malay woman in kitchen, holding a jar of sambal, smiling at camera, says: \"Korang, sambal ni gila pedas! Aku makan setiap hari sekarang. Cuba la!\"" },
        { no: "5", title: "使用 Prompt Builder", copy: "Prompt Builder 会依次问 persona、scene、hook、framework、voice 和 dialog，然后自动生成一版可以编辑的 prompt。", tip: "第一次用建议一定走 Prompt Builder。熟悉后再直接手写。" },
        { no: "6", title: "设置 Size + Generate UGC", copy: "默认 9:16，适合 TikTok。点击 Generate UGC 后，history 里会出现 pending card。Veo 3.1 Fast 通常 60-90 秒完成。每条视频成本 RM0.40。", tip: "可以用略微不同的 prompt 连续生成多个版本。" },
        { no: "7", title: "打开 AI Agent UGC", copy: "点击右下角 floating chat button 打开 AI Agent。它可以用 BM 和您聊天、提出 video variants，并直接提交生成。", tip: "Agent 有 persona、scene、hook、framework、voice 的 skill library，您只要说清楚想要什么。" },
        { no: "8", title: "告诉 Agent 您要什么", copy: "像 WhatsApp 一样自然输入。例子：'Buat 3 video UGC untuk produk skincare aku, persona urban hijabi, hook pain confession'。也可以用 clip icon 附上产品图。", tip: "Agent 会在需要时追问 duration、voice、hijab/no hijab 或产品角度。" },
        { no: "9", title: "输入 SUBMIT 开始生成", copy: "当 variants 准备好后，Agent 会给您 preview，并要求您输入 SUBMIT。之后会出现确认弹窗，让您最后 review、修改和 approve。", tip: "如果要无人物产品视频，说 'buat video type product, tanpa orang'，Agent 会切到 product mode。" },
        { no: "10", title: "History Grid", subtitle: "生成视频和操作按钮", copy: "表单下方是当前 project 的 UGC history。每张 card 有 thumbnail、model label、可编辑名称，以及 Extend、Combine、Improve、Download、Delete 等按钮。", tip: "点击 thumbnail 可以全屏播放。pending 太久时，点 card 上的 recheck status。" },
        { no: "11", title: "延长到 16 秒", copy: "done 状态的视频可以点击 Extend，再生成后续 8 秒。系统会把 segment 1 和 segment 2 自动 merge 成 16 秒视频。", tip: "用 Frame Anchor last，延续感会更自然。Voice 会沿用第一段，声音更统一。" },
        { no: "12", title: "Duration 8s", copy: "UGC 每次固定 8 秒，因为 Veo 3.1 Fast 的限制，也因为 18-22 个 BM 词最适合 8 秒口播。要 16 秒就先生成 8 秒，再 Extend。", tip: "8 秒成本 RM0.40。Extend 到 16 秒总成本 RM0.80。" },
        { no: "13", title: "Image Mode 下拉", copy: "Product Reference 会根据产品图自动生成场景。First Frame 会把完整图片动画化。Text to Video 只用文字，不需要 reference，但 avatar 一致性会弱一些。", tip: "95% 情况用 Product Reference。Cinematic shot 用 First Frame。无产品场景用 Text to Video。" },
        { no: "14", title: "Size 下拉", copy: "9:16 是 TikTok、Reels、Shorts 的默认竖屏比例。16:9 适合 YouTube long-form、Facebook、IG 横版或 landing page hero video。" },
        { no: "15", title: "Prompt Builder 里的 Voice", copy: "Voice 可以按性别、音高和气质选择。Female casual review 可试 callirrhoe 或 leda。Male confident 可试 achird 或 alnilam。Extend 时会锁定同一个 voice。" },
        { no: "16", title: "History Card 操作按钮", copy: "Extend 生成 8 秒续集。Combine 合并 2-4 条视频。Improve 用增强 prompt 重新生成。Download 保存 MP4。Delete 从 history 删除。", tip: "Combine 很适合把 4 个不同角度合成一条更长的 narrative video。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "UGC Tab — Selfie-Style Video Generation",
      close: "Got it - close",
      path: "Veo 3.1 Fast · 8 seconds · vertical 9:16",
      whatTitle: "What is this?",
      what: "The UGC tab generates selfie-style or handheld product review videos, as if a real creator is speaking Malay to camera. The avatar can hold the product, look at the camera, and deliver the dialog you wrote. It is built for affiliate and TikTok Shop content.",
      whenTitle: "When should I use it?",
      when: "Use UGC when you want one specific review video with a clear dialog. Use Audio when you want AI to plan many videos at once. Use AI Agent UGC when you want to chat and let AI draft variants with you.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Final tip",
      workflow: "A Malaysia-friendly modesty rule is applied automatically: long sleeves, no cleavage, and no thigh exposure. Keep Malay dialog around 20-24 words for the most stable 8-second audio sync.",
      sections: { 1: "Manual UGC Form", 7: "AI Agent UGC Chat Panel", 10: "After Generate — History Grid", 12: "Dropdowns & Options — What Each One Means" },
      steps: [
        { no: "1", title: "UGC form overview", subtitle: "Video Generator, Scene, Size, Generate UGC", copy: "Video Generator controls 8s duration and Image Mode. Scene is where you upload product images, write prompt/dialog, and open Prompt Builder if you are stuck. Size is usually 9:16 for TikTok. Generate UGC starts the job.", tip: "Mobile uses the same layout; just scroll through the sections." },
        { no: "2", title: "Choose Image Mode", copy: "Product Reference is the default and best for product reviews. First Frame animates a finished image. Text to Video uses only a written description with no image reference.", tip: "For natural product reviews, use Product Reference so AI can place the avatar holding the product in a fitting scene." },
        { no: "3", title: "Upload Image Reference", copy: "Click Upload or drag a product image in. Use History to reuse an image from the current project. Click X to remove the reference.", tip: "Clear product images with one subject, good lighting, and a simple background produce the best videos." },
        { no: "4", title: "Write Scene Prompt + Dialog", copy: "Describe the setting, action, and spoken dialog. For Veo 8s, the sweet spot is 18-22 spoken words. Write 2-3 natural sentences, like talking to a friend.", tip: "Example: Malay woman in kitchen, holding a jar of sambal, smiling at camera, says: \"Korang, sambal ni gila pedas! Aku makan setiap hari sekarang. Cuba la!\"" },
        { no: "5", title: "Use Prompt Builder", copy: "Prompt Builder asks about persona, scene, hook, framework, voice, and dialog, then generates an editable prompt for you.", tip: "First-time users should use Prompt Builder. Once you understand the pattern, write directly." },
        { no: "6", title: "Set Size + Generate UGC", copy: "Default size is 9:16 for TikTok. Click Generate UGC to start. A pending card appears in history. Veo 3.1 Fast usually completes in 60-90 seconds. Cost is RM0.40 per video.", tip: "Generate several versions by slightly changing the prompt." },
        { no: "7", title: "Open AI Agent UGC", copy: "Click the floating chat button at the bottom-right to open AI Agent. It can chat in Malay, propose video variants, and submit jobs directly.", tip: "The agent has a skill library for persona, scene, hook, framework, and voice. Just explain what you need." },
        { no: "8", title: "Tell Agent what you want", copy: "Type naturally, like WhatsApp. Example: 'Buat 3 video UGC untuk produk skincare aku, persona urban hijabi, hook pain confession'. You can also attach a product image with the clip icon.", tip: "The agent will ask follow-up questions when needed, such as duration, voice, hijab/no hijab, or product angle." },
        { no: "9", title: "Type SUBMIT to generate", copy: "When variants are ready, the agent shows a preview and asks you to type SUBMIT. A confirmation dialog appears so you can review, edit, and approve.", tip: "For no-person product videos, say 'buat video type product, tanpa orang'. The agent will switch to product mode." },
        { no: "10", title: "History Grid", subtitle: "Generated videos and action buttons", copy: "Below the form is the UGC history for the current project. Each card includes a thumbnail, model label, editable name, and actions such as Extend, Combine, Improve, Download, and Delete.", tip: "Click a thumbnail for full-screen playback. If a job stays pending too long, use recheck status on the card." },
        { no: "11", title: "Extend to 16 seconds", copy: "Done videos can be extended with another 8-second continuation. The system merges segment 1 and segment 2 into one 16-second video.", tip: "Use Frame Anchor last for a natural continuation. The voice is locked from segment 1 for consistency." },
        { no: "12", title: "Duration 8s", copy: "UGC generates 8 seconds per shot because of Veo 3.1 Fast limits and because 18-22 Malay words fit naturally in 8 seconds. For 16s, generate 8s first, then Extend.", tip: "Cost is RM0.40 per 8s shot. A 16s extended video costs RM0.80 total." },
        { no: "13", title: "Image Mode dropdown", copy: "Product Reference creates a scene from the product image. First Frame animates a finished image. Text to Video uses text only and needs no reference, but avatar consistency may be weaker.", tip: "Use Product Reference for most cases. Use First Frame for cinematic shots. Use Text to Video for scenes without products." },
        { no: "14", title: "Size dropdown", copy: "9:16 is the default for TikTok, Reels, and Shorts. 16:9 is useful for YouTube long-form, Facebook, horizontal IG, or landing page hero videos." },
        { no: "15", title: "Voice dropdown in Prompt Builder", copy: "Choose voices by gender, pitch, and vibe. For female casual review, try callirrhoe or leda. For male confident review, try achird or alnilam. Extended segments keep the same voice." },
        { no: "16", title: "History Card actions", copy: "Extend adds an 8s continuation. Combine merges 2-4 videos. Improve regenerates with prompt enhancement. Download saves MP4. Delete removes the video from history.", tip: "Combine is powerful for turning four different angles into a longer narrative video." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopAutoContentContent() {
  return sopAudioContentContent();
}

function sopAudioContentContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Audio Tab — Voiceover untuk video",
      close: "Faham - tutup",
      path: "Voiceover · Voice preset · Translate prepared",
      whatTitle: "Apa ini?",
      what: "Audio ialah workspace untuk beri suara kepada video. Tulis scene, emosi dan gaya suara; pilih voice preset; kemudian gunakan voiceover itu sebagai arahan audio untuk video content.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna Audio bila video anda sudah ada visual direction tetapi perlukan suara, tone, hook atau bahasa yang lebih jelas.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Mulakan dengan Voiceover. Change Voice dan Translate disediakan sebagai workflow seterusnya selepas backend audio action disambung.",
      sections: {},
      steps: [
        { no: "1", title: "Pilih mode", copy: "Voiceover ialah mode aktif pertama. Change Voice dan Translate dipaparkan sebagai coming soon supaya user faham arah produk tanpa submit palsu." },
        { no: "2", title: "Tulis prompt suara", copy: "Terangkan suara, scene dan emosi. Contoh: friendly Malay female voiceover, soft sell, warm and confident." },
        { no: "3", title: "Pilih voice preset", copy: "Gunakan preset seperti Malay Soft Sell, Energetic Creator atau Calm Explainer. Preset tidak mengubah layout composer." },
        { no: "4", title: "Generate Audio", copy: "Frontend sudah siap. Backend generate-audio perlu disambung sebelum audio clip sebenar boleh dibuat." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "Audio 页面 — 给短视频配音",
      close: "我明白了 - 关闭",
      path: "Voiceover · 声音预设 · 翻译预留",
      whatTitle: "这是什么？",
      what: "Audio 是给短视频配声音的工作台。您可以描述声音、场景和情绪，选择 voice preset，为视频准备口播配音方向。",
      whenTitle: "什么时候用？",
      when: "当您已经有视频画面或脚本方向，但需要更清楚的声音、语气、hook 或语言版本时，用 Audio。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "操作建议",
      workflow: "第一版先从 Voiceover 开始。Change Voice 和 Translate 作为后续后端能力预留，不做假提交。",
      sections: {},
      steps: [
        { no: "1", title: "选择模式", copy: "Voiceover 是当前可用的默认模式。Change Voice 和 Translate 会显示为 coming soon，避免用户误以为已经能生成。" },
        { no: "2", title: "填写声音 prompt", copy: "描述声音、场景和情绪。例如：friendly Malay female voiceover, soft sell, warm and confident。" },
        { no: "3", title: "选择声音预设", copy: "可以选择 Malay Soft Sell、Energetic Creator、Calm Explainer 等 preset。切换 preset 不应该让 composer 跳动。" },
        { no: "4", title: "生成 Audio", copy: "前端页面已经准备好；需要接入 backend generate-audio action 后，才能生成真实音频。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "Audio Tab — Voiceover for video",
      close: "Got it - close",
      path: "Voiceover · Voice preset · Translate prepared",
      whatTitle: "What is this?",
      what: "Audio is the workspace for giving videos a voice. Describe the voice, scene, and emotion, choose a preset, and prepare voiceover direction for video content.",
      whenTitle: "When should I use it?",
      when: "Use Audio when your video has visual direction but needs a clearer voice, tone, hook, or language version.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Start with Voiceover. Change Voice and Translate are reserved for the next backend audio phase.",
      sections: {},
      steps: [
        { no: "1", title: "Choose mode", copy: "Voiceover is the first active mode. Change Voice and Translate are shown as coming soon so users do not submit into a fake flow." },
        { no: "2", title: "Write the voice prompt", copy: "Describe the voice, scene, and emotion. Example: friendly Malay female voiceover, soft sell, warm and confident." },
        { no: "3", title: "Pick a voice preset", copy: "Use presets such as Malay Soft Sell, Energetic Creator, or Calm Explainer. Switching presets should not resize the composer." },
        { no: "4", title: "Generate Audio", copy: "The frontend is ready. A backend generate-audio action must be connected before real audio clips can be created." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopAutoLegacyContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Tab Audio — Banyak Video Sekali Klik",
      close: "Faham - tutup",
      path: "AI → Image → Video → Merge · 1-10 video per batch",
      whatTitle: "Apa ini?",
      what: "Audio digunakan untuk generate banyak video UGC daripada satu produk. Paste link TikTok Shop / Shopee atau upload produk manual, kemudian AI plan beberapa angle seperti UGC, Product dan Lifestyle, fire semua, lalu simpan caption, cover text dan hashtags untuk auto-post.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna Audio bila korang nak monthly content batch, contohnya 10-30 video untuk satu produk, atau nak test banyak hook dan framework untuk cari angle paling viral. Kalau cuma nak satu video dengan dialog specific, guna UGC tab.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Audio paling kuat bila digabungkan dengan Auto Post extension. Generate batch, review hasil, schedule hourly melalui TikTok native scheduler, kemudian biar TikTok handle posting.",
      sections: { 9: "Dropdown & Pilihan — Apa Maksud Setiap Satu" },
      steps: [
        { no: "1", title: "Form Audio overview", subtitle: "Affiliate / Manual Product, persona, duration, frameworks, CTA dan quantity", copy: "Mulakan dengan Affiliate link atau Manual Product. Selepas itu set Gender, Style, Age, duration 8s atau 16s, Plan Mode, frameworks, CTA mode dan Quantity 1-10." },
        { no: "2", title: "Affiliate vs Manual Product", copy: "Affiliate ialah default: paste link TikTok Shop atau Shopee supaya AI fetch nama, harga dan image. Manual Product sesuai untuk produk private, listing baru atau produk yang tidak boleh scrape.", tip: "Link pendek vt.tiktok.com selalunya gagal fetch. Buka link dalam browser, copy URL penuh /pdp/... kemudian paste semula." },
        { no: "3", title: "History Saved Products", copy: "Kalau produk pernah difetch, icon history di sebelah input akan tunjuk count. Click untuk pilih saved product tanpa burn another scrape call." },
        { no: "4", title: "Set Avatar Persona", copy: "Pilih Gender Female atau Male. Untuk Female, pilih Style Hijab atau No Hijab. Pilih Age seperti 20s, 30s, 40s Makcik atau 55+ Nenek. Persona ini akan digunakan merentas UGC frameworks." },
        { no: "5", title: "Pick Duration + Size", copy: "8s ialah paling cepat dan murah. 16s auto-merge dua segmen 8s menjadi satu video. Size default 9:16 untuk TikTok." },
        { no: "6", title: "Pick Frameworks", copy: "UGC frameworks untuk character speaking. PRD frameworks untuk product-only voiceover. LIFE frameworks untuk lifestyle scene dengan character dan produk.", tip: "Mix UGC + PRD untuk variety. Pick max 5 frameworks untuk 5 angle yang jelas." },
        { no: "7", title: "CTA Mode", copy: "Shop CTA auto-rotate variasi 'tekan beg kuning'. Custom CTA untuk offer sendiri. No CTA untuk content yang tidak terlalu salesy." },
        { no: "8", title: "Quantity + Generate", copy: "Pilih 1-10 video per batch. Tekan Generate: AI master-plan dahulu, kemudian image/video generation, lalu merge jika perlu. Batch 5 video biasanya mengambil beberapa minit.", tip: "Caption, cover_title, cover_subtitle dan hashtags akan disimpan untuk setiap video." },
        { no: "9", title: "Affiliate / Manual Product toggle", copy: "Affiliate auto-scrape info marketplace seperti nama produk, harga, gambar, deskripsi dan sold count. Manual Product membolehkan korang upload gambar dan tulis info sendiri, termasuk multi-product video.", tip: "Try Affiliate dahulu. Kalau fetch gagal, baru fallback ke Manual." },
        { no: "10", title: "Gender dropdown", copy: "Female sesuai untuk skincare, beauty, fashion, baby, kitchen dan food. Male sesuai untuk gym, gadget, automotive, men's grooming dan business.", tip: "Female biasanya convert lebih tinggi untuk kebanyakan produk Malaysia; Male guna untuk niche produk lelaki." },
        { no: "11", title: "Style dropdown", copy: "Hijab ialah default untuk Female dan selamat untuk audience Malaysia. No Hijab masih ikut modesty rule. Untuk Male, style tidak relevan dan akan disembunyikan.", tip: "Test Hijab dan No Hijab kalau audience produk korang luas." },
        { no: "12", title: "Age dropdown", copy: "20s untuk Gen Z/trendy products. 30s untuk mom atau professional. 40s Makcik untuk food, kitchen dan traditional medicine. 55+ Nenek untuk trust-based testimonial.", tip: "30s paling universal. 40s/Makcik kuat untuk housewife audience Malaysia." },
        { no: "13", title: "8s / 16s toggle", copy: "8s ialah satu Veo generation, RM0.40 per video. 16s ialah dua shot 8s yang auto-chained dan merged, RM0.80 per video. 16s sesuai untuk problem-to-solution story.", tip: "16s lebih sesuai untuk emotional products seperti skincare dan kesihatan. 8s sesuai untuk impulse products." },
        { no: "14", title: "Size dropdown", copy: "9:16 untuk TikTok, Reels dan Shorts. 16:9 untuk Facebook, YouTube horizontal, landing page hero atau ads horizontal." },
        { no: "15", title: "Plan Mode toggle", copy: "AI Plan ialah default: AI buat prompts, dialog dan cover text daripada frameworks yang dipilih. Manual Plan untuk advanced user yang mahu paste JSON prompts sendiri.", tip: "AI Plan untuk 95% case. Manual Plan bila korang sudah ada struktur viral competitor." },
        { no: "16", title: "UGC frameworks", copy: "UGC ialah character on screen speaking. Gunakan PAS Hook+Pain, Testimonial, FOMO, BAB, 4Ps, Action Bias, Solution Focus, Benefit + Result atau Fear of Loss untuk angle yang berbeza.", tip: "PAS dan Testimonial paling konsisten untuk TikTok Shop." },
        { no: "17", title: "PRD frameworks", copy: "PRD ialah product-only shot dengan voiceover: Product Hero, Before/After, USP Showcase atau Flat Lay / Aesthetic.", tip: "Mix 1-2 PRD dengan 3-4 UGC dalam batch supaya feed tidak nampak sama." },
        { no: "18", title: "LIFE frameworks", copy: "LIFE ialah aspirational lifestyle scene dengan character dan produk. Soft Sell untuk gentle storytelling. Evening Routine untuk routine aesthetic.", tip: "Lifestyle bagus untuk skincare, supplements dan kitchen tools." },
        { no: "19", title: "CTA Mode options", copy: "Shop CTA untuk TikTok Shop affiliate. Custom CTA untuk seasonal offer atau campaign sendiri. No CTA untuk awareness atau brand video.", tip: "Shop CTA biasanya paling kuat convert untuk TikTok Shop." },
        { no: "20", title: "Quantity dropdown", copy: "Quantity 1-10 menentukan jumlah video dalam batch. 5 video ialah sweet spot untuk A/B test. Untuk 30 video, run 3 batches.", tip: "5 frameworks = 5 angle berbeza = cukup variety untuk test hook." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "Audio 页面 — 一次生成多条视频",
      close: "我明白了 - 关闭",
      path: "AI → 图片 → 视频 → 合并 · 每批 1-10 条视频",
      whatTitle: "这是什么？",
      what: "Audio 用来围绕一个产品批量生成多条 UGC 视频。您可以贴 TikTok Shop / Shopee 链接，或手动上传产品资料；AI 会规划多个角度，例如 UGC、Product、Lifestyle，并自动保存 caption、cover text 和 hashtags，方便后续 auto-post。",
      whenTitle: "什么时候用？",
      when: "当您要为一个产品做月度内容批次，例如 10-30 条视频，或想一次测试多个 hook / framework 时，用 Audio。如果只做一条明确台词的视频，用 UGC tab 就够了。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "操作建议",
      workflow: "Audio 最适合搭配 Auto Post Chrome extension：批量生成，review 后用 TikTok native scheduler 排程发布，后续由 TikTok 处理 posting。",
      sections: { 9: "下拉选项 — 每个选项是什么意思" },
      steps: [
        { no: "1", title: "表单总览", subtitle: "Affiliate / Manual Product、persona、duration、framework、CTA、quantity", copy: "先选择 Affiliate link 或 Manual Product，再设置 Gender、Style、Age、8s/16s、Plan Mode、frameworks、CTA mode 和 Quantity 1-10。" },
        { no: "2", title: "Affiliate vs Manual Product", copy: "Affiliate 是默认模式，粘贴 TikTok Shop 或 Shopee 链接后，AI 会抓取名称、价格和图片。Manual Product 适合 private listing、新产品或无法抓取的产品。", tip: "短链接 vt.tiktok.com 常常抓不到。先在浏览器打开，再复制完整 /pdp/... URL。" },
        { no: "3", title: "History Saved Products", copy: "之前抓取过的产品会出现在 history icon 里。点击即可复用 saved product，不需要再次消耗 scrape call。" },
        { no: "4", title: "设置 Avatar Persona", copy: "选择 Female 或 Male。Female 可选择 Hijab / No Hijab。Age 可选 20s、30s、40s Makcik、55+ Nenek。这个 persona 会贯穿 UGC frameworks。" },
        { no: "5", title: "选择 Duration + Size", copy: "8s 最快最便宜。16s 会自动把两个 8 秒片段合并成一条长视频。Size 默认 9:16，适合 TikTok。" },
        { no: "6", title: "选择 Frameworks", copy: "UGC 是人物出镜口播。PRD 是产品-only voiceover。LIFE 是人物和产品在生活方式场景里出现。", tip: "混合 UGC + PRD 会更有 variety。最多选 5 个 framework，保持角度清晰。" },
        { no: "7", title: "CTA Mode", copy: "Shop CTA 会自动轮换 'tekan beg kuning' 结尾。Custom CTA 可以写自己的 offer。No CTA 适合不想太销售感的内容。" },
        { no: "8", title: "Quantity + Generate", copy: "每批选择 1-10 条视频。点击 Generate 后，AI 会先做 master plan，再生成图片/视频，需要时自动 merge。5 条视频通常需要几分钟。", tip: "每条视频都会保存 caption、cover_title、cover_subtitle 和 hashtags。" },
        { no: "9", title: "Affiliate / Manual Product toggle", copy: "Affiliate 会自动抓 marketplace 信息。Manual Product 让您自己上传图片和填写资料，也支持 multi-product video。", tip: "优先试 Affiliate。失败后再切 Manual。" },
        { no: "10", title: "Gender dropdown", copy: "Female 适合 skincare、beauty、fashion、baby、kitchen、food。Male 适合 gym、gadget、automotive、men's grooming、business。", tip: "马来西亚多数产品 Female conversion 更稳；Male 留给男性 niche 产品。" },
        { no: "11", title: "Style dropdown", copy: "Hijab 是 Female 默认选项，更适合马来西亚大众受众。No Hijab 仍会套用 modesty rule。Male 会隐藏这个选项。", tip: "受众较广时，可以测试 Hijab 和 No Hijab。" },
        { no: "12", title: "Age dropdown", copy: "20s 适合 Gen Z/trendy 产品。30s 适合妈妈或 professional。40s Makcik 适合 food、kitchen、traditional medicine。55+ Nenek 适合信任型 testimonial。", tip: "30s 最通用；40s/Makcik 对 housewife audience 很强。" },
        { no: "13", title: "8s / 16s toggle", copy: "8s 是单次 Veo generation，RM0.40。16s 是两个 8 秒片段自动串联并合并，RM0.80。16s 适合 problem-to-solution story。", tip: "情绪型产品用 16s；冲动购买型产品用 8s。" },
        { no: "14", title: "Size dropdown", copy: "9:16 用于 TikTok、Reels、Shorts。16:9 用于 Facebook、YouTube 横版、landing page hero 或横版广告。" },
        { no: "15", title: "Plan Mode toggle", copy: "AI Plan 是默认模式，AI 会根据 frameworks 自动写 prompts、dialog 和 cover text。Manual Plan 适合高级用户粘贴自己的 JSON prompts。", tip: "95% 情况用 AI Plan。只有要复刻 competitor 结构时用 Manual Plan。" },
        { no: "16", title: "UGC frameworks", copy: "UGC 是人物出镜口播。可用 PAS Hook+Pain、Testimonial、FOMO、BAB、4Ps、Action Bias、Solution Focus、Benefit + Result、Fear of Loss 做不同角度。", tip: "PAS 和 Testimonial 对 TikTok Shop 最稳定。" },
        { no: "17", title: "PRD frameworks", copy: "PRD 是产品-only + voiceover，包括 Product Hero、Before/After、USP Showcase、Flat Lay / Aesthetic。", tip: "一批里混 1-2 条 PRD 和 3-4 条 UGC，feed 会更自然。" },
        { no: "18", title: "LIFE frameworks", copy: "LIFE 是人物和产品共同出现的 lifestyle 场景。Soft Sell 适合轻叙事，Evening Routine 适合 routine aesthetic。", tip: "Lifestyle 很适合 skincare、supplements 和 kitchen tools。" },
        { no: "19", title: "CTA Mode options", copy: "Shop CTA 适合 TikTok Shop affiliate。Custom CTA 适合 seasonal offer。No CTA 适合 awareness 或 brand video。", tip: "TikTok Shop conversion 通常先测 Shop CTA。" },
        { no: "20", title: "Quantity dropdown", copy: "Quantity 1-10 决定每批视频数量。5 条是 A/B test 的 sweet spot。要 30 条就跑 3 批。", tip: "5 个 framework = 5 个不同角度，足够测试 hook。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "Audio Tab — Batch Videos in One Click",
      close: "Got it - close",
      path: "AI → Image → Video → Merge · 1-10 videos per batch",
      whatTitle: "What is this?",
      what: "Audio generates many UGC videos from one product. Paste a TikTok Shop / Shopee link or enter product details manually, then AI plans multiple angles such as UGC, Product, and Lifestyle, generates the batch, and saves captions, cover text, and hashtags for auto-posting.",
      whenTitle: "When should I use it?",
      when: "Use Audio for monthly production batches, such as 10-30 videos for one product, or when you want to test multiple hooks and frameworks quickly. If you only need one specific video, use the UGC tab.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Audio is strongest with the Auto Post Chrome extension. Generate a batch, review the outputs, schedule hourly through TikTok's native scheduler, then let TikTok handle posting.",
      sections: { 9: "Dropdowns & Options — What Each One Means" },
      steps: [
        { no: "1", title: "Audio form overview", subtitle: "Affiliate / Manual Product, persona, duration, frameworks, CTA, and quantity", copy: "Start with an Affiliate link or Manual Product. Then set Gender, Style, Age, 8s/16s duration, Plan Mode, frameworks, CTA mode, and Quantity from 1-10." },
        { no: "2", title: "Affiliate vs Manual Product", copy: "Affiliate is the default: paste a TikTok Shop or Shopee link so AI can fetch name, price, and image. Manual Product is for private listings, new products, or products that cannot be scraped.", tip: "Short vt.tiktok.com links often fail. Open the link in a browser first, then copy the full /pdp/... URL." },
        { no: "3", title: "History Saved Products", copy: "If a product was fetched before, the history icon beside the input shows a count. Click it to reuse saved products without another scrape call." },
        { no: "4", title: "Set Avatar Persona", copy: "Choose Female or Male. For Female, choose Hijab or No Hijab. Choose Age such as 20s, 30s, 40s Makcik, or 55+ Nenek. This persona carries across UGC frameworks." },
        { no: "5", title: "Pick Duration + Size", copy: "8s is fastest and cheapest. 16s auto-merges two 8-second segments into one longer video. Default size is 9:16 for TikTok." },
        { no: "6", title: "Pick Frameworks", copy: "UGC frameworks create character-speaking videos. PRD frameworks create product-only voiceover videos. LIFE frameworks create lifestyle scenes with character and product.", tip: "Mix UGC + PRD for variety. Pick up to 5 frameworks for clear angles." },
        { no: "7", title: "CTA Mode", copy: "Shop CTA rotates 'tekan beg kuning' endings. Custom CTA lets you write your own offer. No CTA keeps the video less salesy." },
        { no: "8", title: "Quantity + Generate", copy: "Choose 1-10 videos per batch. Click Generate: AI creates a master plan, then image/video generation runs, with merge if needed. A 5-video batch usually takes a few minutes.", tip: "Caption, cover_title, cover_subtitle, and hashtags are saved for each video." },
        { no: "9", title: "Affiliate / Manual Product toggle", copy: "Affiliate auto-scrapes marketplace info. Manual Product lets you upload images and enter details yourself, including multi-product video inputs.", tip: "Try Affiliate first. If fetch fails, fall back to Manual." },
        { no: "10", title: "Gender dropdown", copy: "Female works well for skincare, beauty, fashion, baby, kitchen, and food. Male works well for gym, gadgets, automotive, men's grooming, and business.", tip: "Female usually converts better for most Malaysia products; use Male for male-focused niches." },
        { no: "11", title: "Style dropdown", copy: "Hijab is the Female default and fits most Malaysia audiences. No Hijab still follows the modesty rule. For Male, this option is hidden.", tip: "Test both Hijab and No Hijab when the audience is broad." },
        { no: "12", title: "Age dropdown", copy: "20s fits Gen Z/trendy products. 30s fits moms or professionals. 40s Makcik fits food, kitchen, and traditional medicine. 55+ Nenek fits trust-led testimonials.", tip: "30s is the most universal. 40s/Makcik works strongly for housewife audiences." },
        { no: "13", title: "8s / 16s toggle", copy: "8s is one Veo generation at RM0.40. 16s is two auto-chained 8s shots merged into one video at RM0.80. Use 16s for problem-to-solution stories.", tip: "Use 16s for emotional products like skincare and health. Use 8s for impulse products." },
        { no: "14", title: "Size dropdown", copy: "9:16 is for TikTok, Reels, and Shorts. 16:9 is for Facebook, YouTube horizontal, landing page hero videos, or horizontal ads." },
        { no: "15", title: "Plan Mode toggle", copy: "AI Plan is the default: AI writes prompts, dialog, and cover text from your selected frameworks. Manual Plan is for advanced users who want to paste their own JSON prompts.", tip: "Use AI Plan for most cases. Use Manual Plan only when following an exact competitor structure." },
        { no: "16", title: "UGC frameworks", copy: "UGC means character on screen speaking. Use PAS Hook+Pain, Testimonial, FOMO, BAB, 4Ps, Action Bias, Solution Focus, Benefit + Result, or Fear of Loss for different angles.", tip: "PAS and Testimonial are the most consistent for TikTok Shop." },
        { no: "17", title: "PRD frameworks", copy: "PRD means product-only with voiceover: Product Hero, Before/After, USP Showcase, or Flat Lay / Aesthetic.", tip: "Mix 1-2 PRD videos with 3-4 UGC videos so the feed has variety." },
        { no: "18", title: "LIFE frameworks", copy: "LIFE creates aspirational lifestyle scenes with character and product. Soft Sell is gentle storytelling. Evening Routine is routine aesthetic.", tip: "Lifestyle works well for skincare, supplements, and kitchen tools." },
        { no: "19", title: "CTA Mode options", copy: "Shop CTA is for TikTok Shop affiliate. Custom CTA is for seasonal offers or custom campaigns. No CTA is for awareness or brand videos.", tip: "Shop CTA usually converts best for TikTok Shop." },
        { no: "20", title: "Quantity dropdown", copy: "Quantity 1-10 controls how many videos are generated in the batch. 5 videos is a strong A/B test size. For 30 videos, run 3 batches.", tip: "5 frameworks = 5 different angles, enough variety to test hooks." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopOriginalVideoContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Tab Original Video — Cinematic AI Video",
      close: "Faham - tutup",
      path: "Grok Imagine 3 · 6-30 saat · cinematic style",
      whatTitle: "Apa ini?",
      what: "Original Video digunakan untuk generate video sinematik seperti drone shots, action sequence, dramatic scene dan brand footage yang tidak perlu face-talking UGC. Ia sesuai untuk landing page hero, brand cinematic, ad transition dan B-roll visual.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna tab ini bila korang nak footage cantik macam trailer movie: pemandangan, action shot, slow-motion dramatic, jungle chase, sci-fi scene atau cinematic transition. Bukan untuk product review dan bukan untuk dialog panjang.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Original Video paling kuat sebagai standalone cinematic piece atau B-roll. Combine dengan UGC voice-over dalam CapCut / Premiere untuk tambah variety dalam ads.",
      sections: { 6: "Dropdown & Pilihan — Apa Maksud Setiap Satu" },
      steps: [
        { no: "1", title: "Cinema Generator overview", subtitle: "Image Mode, cinematic prompt, duration, size dan Generate Cinema", copy: "Pilih Image Mode, tulis scene prompt yang panjang, set duration 6-30 saat, pilih size 9:16 atau 16:9, kemudian tekan Generate Cinema." },
        { no: "2", title: "Pilih Image Mode", copy: "Text to Video ialah default dan guna prompt sahaja. First Frame animate dari gambar permulaan. Last Frame targetkan ending frame tertentu, berguna untuk continuation series." },
        { no: "3", title: "Tulis Cinematic Prompt", copy: "Berbeza daripada UGC, prompt cinematic patut panjang dan descriptive: characters, actions, camera movement, lighting, mood dan environment. Gunakan bahasa seperti POV tracking shot, dramatic lighting, slow-motion, volumetric haze.", tip: "Lebih detail = lebih sinematik. Contoh: cinematic drone shot over snowy mountain village at sunrise, warm window lights, blue morning haze, slow camera dolly, golden rim lighting." },
        { no: "4", title: "Pilih Duration", copy: "Default 6 saat. Maximum 30 saat. Cost ikut saat, contohnya RM0.03 per saat. Slider akan update cost secara real-time.", tip: "Untuk hero video landing page, 8-12 saat biasanya sweet spot." },
        { no: "5", title: "Generate Cinema", copy: "Tekan Generate Cinema. Pending card muncul di history bawah. Cinematic generation biasanya lebih lambat daripada UGC, sekitar 90-180 saat.", tip: "Output akan dilabel Product Ref jika guna reference image, atau Text to Video jika pure text." },
        { no: "6", title: "Image Mode dropdown", copy: "Text to Video membiarkan AI imagine semua dari prompt. First Frame mula dari image yang korang upload. Last Frame cuba akhiri video pada image sasaran.", tip: "First Frame paling useful: generate cinematic start image di Image tab, kemudian animate di Original Video." },
        { no: "7", title: "Duration slider", copy: "Minimum 6 saat, maximum 30 saat. 6s murah untuk hook, 10s sweet spot, 15s untuk mid-form story, 30s untuk mini-film.", tip: "15s+ jarang convert lebih baik untuk social kerana ramai orang scroll." },
        { no: "8", title: "Size dropdown", copy: "9:16 untuk TikTok, Reels dan Shorts. 16:9 untuk YouTube, Facebook dan desktop landing page. 1:1 sesuai untuk Instagram feed lama." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "Original Video 页面 — 电影感 AI 视频",
      close: "我明白了 - 关闭",
      path: "Grok Imagine 3 · 6-30 秒 · cinematic style",
      whatTitle: "这是什么？",
      what: "Original Video 用来生成电影感画面，例如航拍、动作镜头、戏剧场景和品牌视觉，不需要 UGC 露脸口播。它适合 landing page hero、品牌 cinematic、广告转场和 B-roll。",
      whenTitle: "什么时候用？",
      when: "当您想要像电影 trailer 一样的画面，例如风景、action shot、slow-motion、jungle chase、科幻场景或 cinematic transition 时，用这个 tab。它不是产品 review，也不适合长对白。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "操作建议",
      workflow: "Original Video 最适合作为独立 cinematic piece 或 B-roll。也可以在 CapCut / Premiere 里和 UGC voice-over 混剪，让广告更有层次。",
      sections: { 6: "下拉选项 — 每个选项是什么意思" },
      steps: [
        { no: "1", title: "Cinema Generator 总览", subtitle: "Image Mode、cinematic prompt、duration、size、Generate Cinema", copy: "先选择 Image Mode，写长一点的 scene prompt，设置 6-30 秒 duration，选择 9:16 或 16:9，然后点击 Generate Cinema。" },
        { no: "2", title: "选择 Image Mode", copy: "Text to Video 是默认模式，只用文字 prompt。First Frame 会从起始图片动画化。Last Frame 会尝试让视频结束在目标图片，适合 continuation series。" },
        { no: "3", title: "写 Cinematic Prompt", copy: "和 UGC 不同，cinematic prompt 应该更长、更具体，包含角色、动作、镜头运动、灯光、情绪和环境。可以使用 POV tracking shot、dramatic lighting、slow-motion、volumetric haze 等电影语言。", tip: "越具体越电影感。例子：cinematic drone shot over snowy mountain village at sunrise, warm window lights, blue morning haze, slow camera dolly, golden rim lighting." },
        { no: "4", title: "选择 Duration", copy: "默认 6 秒，最长 30 秒。成本按秒计算，例如 RM0.03 / 秒。拖动 slider 时，cost 会实时更新。", tip: "Landing page hero video 通常 8-12 秒最刚好。" },
        { no: "5", title: "Generate Cinema", copy: "点击 Generate Cinema 后，下方 history 会出现 pending card。Cinematic generation 通常比 UGC 慢，大约 90-180 秒。", tip: "如果有 reference image，会显示 Product Ref；纯文字生成会显示 Text to Video。" },
        { no: "6", title: "Image Mode 下拉", copy: "Text to Video 让 AI 完全根据 prompt 想象画面。First Frame 从您上传的起始图开始。Last Frame 尝试把视频结束在指定图片。", tip: "First Frame 最常用：先在 Image tab 生成 cinematic start image，再到 Original Video 里 animate。" },
        { no: "7", title: "Duration slider", copy: "最短 6 秒，最长 30 秒。6s 适合 hook，10s 是 sweet spot，15s 适合 mid-form story，30s 是 mini-film。", tip: "社媒上 15s+ 不一定更好，因为用户很容易划走。" },
        { no: "8", title: "Size 下拉", copy: "9:16 用于 TikTok、Reels、Shorts。16:9 用于 YouTube、Facebook 和 desktop landing page。1:1 适合旧版 Instagram feed。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "Original Video Tab — Cinematic AI Video",
      close: "Got it - close",
      path: "Grok Imagine 3 · 6-30 seconds · cinematic style",
      whatTitle: "What is this?",
      what: "Original Video generates cinematic footage such as drone shots, action sequences, dramatic scenes, and brand visuals without UGC face-talking. Use it for landing page heroes, brand films, ad transitions, and B-roll.",
      whenTitle: "When should I use it?",
      when: "Use this tab when you want movie-trailer-style footage: landscapes, action shots, slow-motion drama, jungle chase scenes, sci-fi shots, or cinematic transitions. It is not for product reviews or long dialog.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Original Video works best as a standalone cinematic piece or B-roll. Combine it with UGC voice-over in CapCut / Premiere to add variety to ads.",
      sections: { 6: "Dropdowns & Options — What Each One Means" },
      steps: [
        { no: "1", title: "Cinema Generator overview", subtitle: "Image Mode, cinematic prompt, duration, size, and Generate Cinema", copy: "Choose Image Mode, write a long scene prompt, set duration from 6-30 seconds, choose 9:16 or 16:9, then click Generate Cinema." },
        { no: "2", title: "Choose Image Mode", copy: "Text to Video is the default and uses prompt only. First Frame animates from a starting image. Last Frame targets a specific ending frame, useful for continuation series." },
        { no: "3", title: "Write a Cinematic Prompt", copy: "Unlike UGC, cinematic prompts should be longer and descriptive: characters, actions, camera movement, lighting, mood, and environment. Use language like POV tracking shot, dramatic lighting, slow-motion, and volumetric haze.", tip: "More detail creates a stronger cinematic result. Example: cinematic drone shot over snowy mountain village at sunrise, warm window lights, blue morning haze, slow camera dolly, golden rim lighting." },
        { no: "4", title: "Choose Duration", copy: "Default is 6 seconds. Maximum is 30 seconds. Cost is calculated per second, for example RM0.03 per second. The slider updates cost in real time.", tip: "For landing page hero videos, 8-12 seconds is usually the sweet spot." },
        { no: "5", title: "Generate Cinema", copy: "Click Generate Cinema. A pending card appears in history. Cinematic generation is usually slower than UGC, around 90-180 seconds.", tip: "Outputs are labeled Product Ref when using a reference image, or Text to Video for pure prompt generation." },
        { no: "6", title: "Image Mode dropdown", copy: "Text to Video lets AI imagine everything from the prompt. First Frame starts from your uploaded image. Last Frame tries to end on the target image.", tip: "First Frame is the most useful: create a cinematic start image in Image, then animate it in Original Video." },
        { no: "7", title: "Duration slider", copy: "Minimum is 6 seconds, maximum is 30 seconds. 6s is cheap for hooks, 10s is the sweet spot, 15s is mid-form story, and 30s is mini-film territory.", tip: "15s+ rarely converts better on social because people scroll quickly." },
        { no: "8", title: "Size dropdown", copy: "9:16 is for TikTok, Reels, and Shorts. 16:9 is for YouTube, Facebook, and desktop landing pages. 1:1 works for legacy Instagram feed." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopClonePromptContent() {
  const content = {
    ms: {
      eyebrow: "Panduan",
      title: "Tab Clone Prompt — Curi Formula Video Viral",
      close: "Faham - tutup",
      path: "Frames → AI → Prompt(s) · reverse-engineer any video",
      whatTitle: "Apa ini?",
      what: "Clone Prompt digunakan untuk reverse-engineer video viral. Upload atau paste video reference, AI extract key frames, baca struktur scene, dialog dan timing, kemudian hasilkan prompt yang boleh korang pakai semula dalam UGC, Cinema atau Story. Output ialah prompt sahaja, bukan video terus.",
      whenTitle: "Bila guna tab ni?",
      when: "Guna Clone Prompt bila korang jumpa video kompetitor atau creator yang perform dan nak buat versi serupa untuk produk sendiri. Ia juga berguna bila stuck idea dan nak belajar formula video yang sudah terbukti jalan.",
      guideTitle: "Cara guna",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Clone Prompt = curi struktur, bukan curi content. Ambil timing, camera logic, hook dan scene anchor, kemudian adapt dialog serta produk supaya jadi versi brand korang sendiri.",
      sections: { 6: "Dropdown & Pilihan — Apa Maksud Setiap Satu" },
      steps: [
        { no: "1", title: "Clone Prompt overview", subtitle: "Reference video, Output type, Size, Dialog override dan Generate Prompt", copy: "Upload reference video atau paste URL. Pilih Output UGC, Cinema atau Story. Pilih Size. Isi Dialog jika mahu override. Tekan Generate Prompt untuk hasilkan prompt siap guna." },
        { no: "2", title: "Upload Reference Video", copy: "Drag video file seperti mp4/mov atau paste TikTok URL. Video panjang akan dibaca sebagai beberapa segment. AI extract key frames seperti start, middle dan end secara automatik." },
        { no: "3", title: "Pilih Output Type", copy: "UGC untuk prompt Veo 3.1 character speaking. Cinema untuk action atau cinematic sequence. Story untuk dramatic visual prompt.", tip: "Kalau reference ada orang bercakap, pilih UGC. Kalau visual cinematic tanpa dialog, pilih Cinema atau Story." },
        { no: "4", title: "Dialog Override", copy: "Dialog optional. Kalau kosong, AI ikut dialog reference. Kalau mahu dialog sendiri, tulis dengan timestamp seperti 0s-4s Hook, 4s-8s Value/proof, 8s-12s Build-up, 12s-16s CTA.", tip: "Untuk produk sendiri, override dialog supaya skeleton ikut reference tetapi content dan CTA ikut brand korang." },
        { no: "5", title: "Generate Prompt", copy: "Tekan Generate Prompt dan tunggu 30-60 saat. Output akan muncul di History — Clone — project semasa, lengkap dengan segment count, scene description, character lock dan dialog timeline.", tip: "Click card untuk full prompt modal, copy prompt, kemudian paste dalam UGC Scene prompt atau Cinema/Story tab." },
        { no: "6", title: "Output dropdown", copy: "UGC generate prompt untuk Veo 3.1 8s/16s dengan character speaking dan dialog. Cinema generate prompt untuk action/cinematic sequence. Story generate prompt untuk pure dramatic visuals.", tip: "Pilih output ikut destination tab. TikTok review biasanya UGC. Cinematic ad biasanya Cinema atau Story." },
        { no: "7", title: "Size dropdown", copy: "9:16 ialah default untuk TikTok vertical dan prompt akan include aspect ratio lock. 16:9 untuk Facebook, YouTube atau reference video horizontal." },
        { no: "8", title: "Dialog field", copy: "Kalau kosong, AI transcribe dan adapt dialog reference. Kalau diisi, AI replace dengan dialog korang. Pakai timestamps untuk timing yang lebih tepat.", tip: "Dialog override wajib kalau produk korang berbeza daripada reference." }
      ]
    },
    zh: {
      eyebrow: "指南",
      title: "Clone Prompt 页面 — 复刻爆款视频公式",
      close: "我明白了 - 关闭",
      path: "Frames → AI → Prompt(s) · reverse-engineer any video",
      whatTitle: "这是什么？",
      what: "Clone Prompt 用来反向拆解爆款视频。上传或粘贴参考视频后，AI 会抽取关键帧，分析场景结构、对白和节奏，再生成可复用的 prompt。输出的是 prompt，不会直接生成视频。",
      whenTitle: "什么时候用？",
      when: "当您看到竞品或 creator 的爆款视频，想为自己的产品做相似版本时，用 Clone Prompt。它也适合在没灵感时研究已验证有效的视频结构。",
      guideTitle: "怎么用",
      stepLabel: "步骤",
      tipLabel: "提示",
      workflowTitle: "操作建议",
      workflow: "Clone Prompt 是偷结构，不是偷内容。保留 timing、camera logic、hook 和 scene anchor，再换成自己的产品、dialog 和 CTA。",
      sections: { 6: "下拉选项 — 每个选项是什么意思" },
      steps: [
        { no: "1", title: "Clone Prompt 总览", subtitle: "Reference video、Output type、Size、Dialog override、Generate Prompt", copy: "上传 reference video 或粘贴 URL。选择 Output：UGC、Cinema 或 Story。选择 Size。需要时填写 Dialog override。点击 Generate Prompt 生成可用 prompt。" },
        { no: "2", title: "上传 Reference Video", copy: "拖入 mp4/mov 文件，或粘贴 TikTok URL。较长视频会被拆成多个 segment。AI 会自动抽取 start、middle、end 等关键帧。" },
        { no: "3", title: "选择 Output Type", copy: "UGC 用于 Veo 3.1 人物口播 prompt。Cinema 用于 action / cinematic sequence。Story 用于 dramatic visual prompt。", tip: "参考视频有人讲话就选 UGC。没有对白、偏电影画面就选 Cinema 或 Story。" },
        { no: "4", title: "Dialog Override", copy: "Dialog 是可选的。留空时，AI 会参考原视频对白。如果要换成自己的话术，用 timestamp 写：0s-4s Hook，4s-8s Value/proof，8s-12s Build-up，12s-16s CTA。", tip: "做自己产品时建议 override dialog：结构来自 reference，内容和 CTA 来自您。" },
        { no: "5", title: "Generate Prompt", copy: "点击 Generate Prompt，等待 30-60 秒。结果会出现在当前 project 的 History — Clone，包含 segment 数量、scene description、character lock 和 dialog timeline。", tip: "点击 card 打开 full prompt modal，复制后粘贴到 UGC Scene prompt 或 Cinema/Story tab。" },
        { no: "6", title: "Output 下拉", copy: "UGC 会生成 Veo 3.1 8s/16s 人物口播 prompt。Cinema 会生成 action/cinematic sequence prompt。Story 会生成纯 dramatic visual prompt。", tip: "根据目标 tab 选择 output。TikTok review 通常 UGC；cinematic ad 通常 Cinema 或 Story。" },
        { no: "7", title: "Size 下拉", copy: "9:16 是默认 TikTok 竖屏，prompt 会包含 aspect ratio lock。16:9 用于 Facebook、YouTube 或横版参考视频。" },
        { no: "8", title: "Dialog field", copy: "留空时 AI 会 transcribe 并 adapt 参考视频对白。填写后，AI 会替换成您的 dialog。用 timestamps 可以控制更准的 timing。", tip: "如果您的产品和 reference 不同，Dialog override 基本必填。" }
      ]
    },
    en: {
      eyebrow: "Guide",
      title: "Clone Prompt Tab — Reverse-Engineer Viral Video Formula",
      close: "Got it - close",
      path: "Frames → AI → Prompt(s) · reverse-engineer any video",
      whatTitle: "What is this?",
      what: "Clone Prompt reverse-engineers viral videos. Upload or paste a reference video, and AI extracts key frames, analyzes scene structure, dialog, and timing, then outputs reusable prompts for UGC, Cinema, or Story. It outputs prompts only, not a generated video.",
      whenTitle: "When should I use it?",
      when: "Use Clone Prompt when you find a competitor or creator video that performs well and want to make a similar version for your own product. It is also useful for studying proven video structures when you are out of ideas.",
      guideTitle: "How to use it",
      stepLabel: "Step",
      tipLabel: "Tip",
      workflowTitle: "Workflow tip",
      workflow: "Clone Prompt copies structure, not content. Keep the timing, camera logic, hook, and scene anchors, then adapt the product, dialog, and CTA to your own brand.",
      sections: { 6: "Dropdowns & Options — What Each One Means" },
      steps: [
        { no: "1", title: "Clone Prompt overview", subtitle: "Reference video, Output type, Size, Dialog override, and Generate Prompt", copy: "Upload a reference video or paste a URL. Choose Output: UGC, Cinema, or Story. Choose Size. Add Dialog override if needed. Click Generate Prompt to create reusable prompts." },
        { no: "2", title: "Upload Reference Video", copy: "Drag an mp4/mov file or paste a TikTok URL. Longer videos are read as multiple segments. AI automatically extracts key frames such as start, middle, and end." },
        { no: "3", title: "Choose Output Type", copy: "UGC creates a Veo 3.1 character-speaking prompt. Cinema creates an action or cinematic sequence prompt. Story creates a dramatic visual prompt.", tip: "If the reference has a person speaking, choose UGC. If it is cinematic without dialog, choose Cinema or Story." },
        { no: "4", title: "Dialog Override", copy: "Dialog is optional. Leave it empty to follow the reference dialog. To use your own dialog, write timestamps such as 0s-4s Hook, 4s-8s Value/proof, 8s-12s Build-up, 12s-16s CTA.", tip: "For your own product, override dialog so the skeleton comes from the reference while content and CTA come from you." },
        { no: "5", title: "Generate Prompt", copy: "Click Generate Prompt and wait 30-60 seconds. Output appears in History — Clone for the current project, including segment count, scene description, character lock, and dialog timeline.", tip: "Click the card for the full prompt modal, copy it, then paste into UGC Scene prompt or the Cinema/Story tab." },
        { no: "6", title: "Output dropdown", copy: "UGC generates Veo 3.1 8s/16s prompts with character speaking and dialog. Cinema generates action/cinematic sequence prompts. Story generates pure dramatic visual prompts.", tip: "Choose output based on the destination tab. TikTok reviews are usually UGC. Cinematic ads are usually Cinema or Story." },
        { no: "7", title: "Size dropdown", copy: "9:16 is the default TikTok vertical format, and the prompt will include aspect ratio lock. Use 16:9 for Facebook, YouTube, or horizontal reference videos." },
        { no: "8", title: "Dialog field", copy: "If empty, AI transcribes and adapts reference dialog. If filled, AI replaces the dialog with yours. Use timestamps for more precise timing.", tip: "Dialog override is essential when your product differs from the reference." }
      ]
    }
  };
  return content[state.lang] || content.ms;
}

function sopGuideContent() {
  if (state.page === "project" && state.step === "image") return sopImageContent();
  if (state.page === "project" && state.step === "ugc") return sopUgcContent();
  if (state.page === "project" && state.step === "auto") return sopAutoContentContent();
  if (state.page === "project" && state.step === "original") return sopOriginalVideoContent();
  if (state.page === "project" && state.step === "clone") return sopClonePromptContent();
  return sopDashboardContent();
}

function sopLibrary() {
  const labels = {
    dashboard: { group: "Getting Started", shortTitle: "Start", icon: "layout-dashboard", desc: "Set up projects and read production stats.", time: "5 min", nextLabel: "Create new project", nextPage: "dashboard", nextAction: "new-project", content: sopDashboardContent },
    image: { group: "Create Content", shortTitle: "Image", icon: "image", desc: "Generate product visuals and avatar images.", time: "7 min", nextLabel: "Go to Image tab", nextStep: "image", content: sopImageContent },
    ugc: { group: "Create Content", shortTitle: "UGC", icon: "video", desc: "Create selfie-style product videos.", time: "8 min", nextLabel: "Go to UGC tab", nextStep: "ugc", content: sopUgcContent },
    auto: { group: "Create Content", shortTitle: "Audio", icon: "audio-lines", desc: "Plan voiceover, presets, and audio direction.", time: "5 min", nextLabel: "Go to Audio", nextStep: "auto", content: sopAudioContentContent },
    original: { group: "Create Content", shortTitle: "Cinema", icon: "film", desc: "Write original cinematic video prompts.", time: "6 min", nextLabel: "Go to Original Video", nextStep: "original", content: sopOriginalVideoContent },
    clone: { group: "Create Content", shortTitle: "Clone", icon: "layers-3", desc: "Break down competitor video structure.", time: "6 min", nextLabel: "Go to Clone Prompt", nextStep: "clone", content: sopClonePromptContent },
    scheduler: { group: "Publish & Operate", shortTitle: "Schedule", icon: "calendar-days", desc: "Plan posting cadence and queue drafts.", time: "Soon" },
    autopost: { group: "Publish & Operate", shortTitle: "Auto Post", icon: "send", desc: "Connect TikTok posting workflow.", time: "Soon" },
    usage: { group: "Publish & Operate", shortTitle: "Usage", icon: "activity", desc: "Track credits, usage, and cost.", time: "Soon" }
  };
  return Object.entries(labels).map(([id, item]) => {
    const guide = item.content?.();
    const steps = guide?.steps?.length || 0;
    const done = sopProgressCount(id);
    const progressTotal = guide ? sopProgressTotal(guide) : 0;
    return {
      id,
      ...item,
      title: guide?.title || sopComingSoonTitle(id),
      path: guide?.path || "SOP Center · coming soon",
      guide,
      steps,
      done,
      progressTotal,
      status: guide ? `${done}/${progressTotal} done` : "Coming soon"
    };
  });
}

function sopComingSoonTitle(id = "") {
  return {
    scheduler: "Scheduler SOP",
    autopost: "Auto Post TikTok SOP",
    usage: "Usage & Credit SOP"
  }[id] || "SOP";
}

function activeSopItem() {
  const items = sopLibrary();
  return items.find((item) => item.id === state.sopTopic) || items[0];
}

function sopProgressCount(topicId) {
  return Object.values(state.sopProgress?.[topicId] || {}).filter(Boolean).length;
}

function sopProgressTotal(guide) {
  return Math.min(4, Math.max(1, Math.ceil((guide?.steps?.length || 1) / 5)));
}

function sopSearchResults(items, query) {
  const value = query.trim().toLowerCase();
  if (!value) return [];
  return items.flatMap((item) => {
    const guide = item.guide;
    if (!guide) return [];
    const base = [item.shortTitle, item.title, item.desc, guide.path, guide.what, guide.when, guide.workflow].join(" ").toLowerCase();
    const topicHit = base.includes(value) ? [{ topicId: item.id, topicTitle: item.shortTitle, stepNo: "", stepTitle: item.title, excerpt: item.desc }] : [];
    const stepHits = (guide.steps || []).filter((step) => [step.title, step.subtitle, step.copy, step.tip, ...(step.bullets || [])].join(" ").toLowerCase().includes(value))
      .slice(0, 4)
      .map((step) => ({ topicId: item.id, topicTitle: item.shortTitle, stepNo: step.no, stepTitle: step.title, excerpt: step.copy || step.tip || "" }));
    return [...topicHit, ...stepHits];
  }).slice(0, 12);
}

function sopPage() {
  const items = sopLibrary();
  const active = activeSopItem();
  const quickIds = ["dashboard", "image", "ugc", "auto", "original", "clone"];
  const operateItems = items.filter((item) => item.group === "Publish & Operate");
  const results = sopSearchResults(items, state.sopSearch || "");
  const progressTotal = active.guide ? sopProgressTotal(active.guide) : 0;
  return `
    <header class="project-head sop-center-head sop-compact-head">
      <div>
        <p class="folder-label">${icon("book-open", 18)} SOP Center</p>
        <h1>SOP Center</h1>
        <p class="subtitle">选择一个任务，按步骤完成生成、复盘和发布。</p>
      </div>
      <div class="head-actions">
        <button class="dark-button mini-button" data-action="support">${icon("message-circle", 17)} Help</button>
      </div>
    </header>
    <section class="sop-command-bar">
      <label>${icon("search", 18)}<input data-sop-search placeholder="Search SOP, step, credit, prompt, UGC..." value="${esc(state.sopSearch || "")}"></label>
      <div class="sop-path-pills">
        <span>Recommended</span>
        ${["dashboard", "image", "ugc", "auto"].map((id) => {
          const item = items.find((entry) => entry.id === id);
          return `<button type="button" class="${active.id === id ? "active" : ""}" data-sop-target="${id}">${esc(item.shortTitle)}</button>`;
        }).join("")}
      </div>
    </section>
    ${state.sopSearch ? `<section class="sop-search-results">
      <div class="card-title"><h2>${icon("search-check", 20)} Search Results</h2><span>${results.length} matches</span></div>
      ${results.length ? results.map((result) => `<button type="button" data-sop-result-topic="${esc(result.topicId)}" data-sop-result-step="${esc(result.stepNo)}">
        <b>${esc(result.topicTitle)}${result.stepNo ? ` · Step ${esc(result.stepNo)}` : ""}</b>
        <span>${esc(result.stepTitle)}</span>
        <small>${esc(result.excerpt).slice(0, 150)}${result.excerpt.length > 150 ? "..." : ""}</small>
      </button>`).join("") : `<p class="empty-text">No matching SOP steps yet.</p>`}
    </section>` : ""}
    <section class="sop-quick-grid">
      ${quickIds.map((id) => {
        const item = items.find((entry) => entry.id === id);
        return `<button class="${active.id === id ? "active" : ""}" data-sop-target="${id}">
          ${icon(item.icon, 22)}
          <span>${esc(item.shortTitle)}</span>
          <small>${esc(item.desc)}</small>
          <em>${item.steps || 0} steps · ${esc(item.time || "Ready")}</em>
        </button>`;
      }).join("")}
    </section>
    <section class="sop-center-layout">
      <aside class="sop-center-nav">
        <div>
          <h3>SOP Library</h3>
          ${quickIds.map((id) => {
            const item = items.find((entry) => entry.id === id);
            return `<button class="${active.id === item.id ? "active" : ""}" data-sop-target="${esc(item.id)}">
              ${icon(item.icon, 18)}
              <span><b>${esc(item.shortTitle)}</b><small>${item.done}/${item.progressTotal} done</small></span>
            </button>`;
          }).join("")}
        </div>
        ${active.guide ? `<div>
          <h3>On This SOP</h3>
          ${(active.guide.steps || []).slice(0, 8).map((step) => `<button type="button" data-sop-step-jump="${esc(active.id)}-${esc(step.no)}">
            ${icon("list-checks", 18)}
            <span><b>${esc(step.no)}. ${esc(step.title)}</b><small>${esc(step.subtitle || "Step")}</small></span>
          </button>`).join("")}
        </div>` : ""}
        <div>
          <h3>Publish & Operate</h3>
          ${operateItems.map((item) => `
              <button class="${active.id === item.id ? "active" : ""}" data-sop-target="${esc(item.id)}">
                ${icon(item.icon, 18)}
                <span><b>${esc(item.title)}</b><small>${esc(item.status)}</small></span>
              </button>`).join("")}
        </div>
      </aside>
      <article class="sop-center-content">
        ${active.guide ? sopGuideArticle(active.guide, active) : sopComingSoonArticle(active)}
        ${active.guide ? `<footer class="sop-next-panel">
          <div><span>Progress</span><b>${active.done}/${progressTotal} checklist done</b></div>
          <button class="gold-button" data-sop-next="${esc(active.id)}">${icon("arrow-right", 18)} ${esc(active.nextLabel || "Continue")}</button>
        </footer>` : ""}
      </article>
    </section>`;
}

function sopGuideArticle(guide, item) {
  const stepCards = Array.isArray(guide.steps) ? guide.steps : [];
  const sectionLabels = guide.sections || {};
  const progressTotal = sopProgressTotal(guide);
  const progress = state.sopProgress?.[item.id] || {};
  const checklist = [
    "I know where this feature lives",
    "I know what input is required",
    "I know what output to expect",
    "I know the next action"
  ].slice(0, progressTotal);
  return `
    <div class="sop-center-title">
      <p>${esc(item.shortTitle || guide.eyebrow || "Guide")}</p>
      <h2>${esc(guide.title || "SOP")}</h2>
      <span>${esc(guide.path || "")}</span>
    </div>
    <section class="sop-info-grid">
      <div class="sop-copy-block">
        <h3>${esc(guide.whatTitle || "What is this?")}</h3>
        <p>${esc(guide.what || "")}</p>
      </div>
      <div class="sop-callout">
        <h3>${esc(guide.whenTitle || "When should I use this?")}</h3>
        <p>${esc(guide.when || "")}</p>
      </div>
    </section>
    <section class="sop-guide">
      <h3>${icon("chevron-right", 28)} ${esc(guide.guideTitle || "How to use it")}</h3>
      <div class="sop-step-list">
        ${stepCards.map((item) => `
          ${sectionLabels[item.no] ? `<h3 class="sop-section-heading">${esc(sectionLabels[item.no])}</h3>` : ""}
          <article class="sop-step-card" id="sop-step-${esc(state.sopTopic)}-${esc(item.no)}">
            <div class="sop-step-title">
              <span>${esc(item.no)}</span>
              <h4>${esc(guide.stepLabel || "Step")} ${esc(item.no)} &mdash; ${esc(item.title)}</h4>
            </div>
            <div class="sop-step-body">
              ${item.subtitle ? `<strong>${esc(item.subtitle)}</strong>` : ""}
              <p>${esc(item.copy || "")}</p>
              ${item.bullets ? `<ul>${item.bullets.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>` : ""}
              ${item.after ? `<p>${esc(item.after)}</p>` : ""}
              ${item.tip ? `<div class="sop-tip">${icon("lightbulb", 20)} <div><b>${esc(guide.tipLabel || "Tip")}:</b><p>${esc(item.tip)}</p></div></div>` : ""}
            </div>
          </article>`).join("")}
      </div>
    </section>
    <section class="sop-workflow">
      <h3>${esc(guide.workflowTitle || "Workflow tip")}</h3>
      <p>${esc(guide.workflow || "")}</p>
    </section>
    <section class="sop-checklist">
      <h3>Before you leave this SOP</h3>
      ${checklist.map((label, index) => `<label>
        <input type="checkbox" data-sop-progress="${esc(item.id)}" data-sop-progress-key="check${index}" ${progress[`check${index}`] ? "checked" : ""}>
        <span>${esc(label)}</span>
      </label>`).join("")}
    </section>`;
}

function sopComingSoonArticle(item) {
  return `
    <div class="sop-center-title">
      <p>${esc(item.group)}</p>
      <h2>${esc(item.title)}</h2>
      <span>${esc(item.path)}</span>
    </div>
    <section class="sop-callout">
      ${icon("construction", 34)}
      <div>
        <h3>Coming soon</h3>
        <p>${esc(item.desc)} 这份 SOP 会放在这里，不会再用弹窗承载。</p>
      </div>
    </section>`;
}

function sopDashboardModal() {
  const guide = sopGuideContent();
  const stepCards = guide.steps;
  const sectionLabels = guide.sections || {};
  return `
    <div class="modal-backdrop sop-backdrop" data-action="close-modal">
      <section class="sop-modal" role="dialog" aria-modal="true" aria-labelledby="sop-dashboard-title">
        <header class="sop-modal-head">
          <span class="sop-modal-icon">${icon("book-open", 36)}</span>
          <div>
            <p>${guide.eyebrow}</p>
            <h2 id="sop-dashboard-title">${guide.title}</h2>
          </div>
          <button class="sop-close" data-action="close-modal" aria-label="Close SOP">${icon("x", 34)}</button>
        </header>
        <div class="sop-modal-scroll">
          <p class="sop-path">${guide.path}</p>
          <section class="sop-copy-block">
            <h3>${guide.whatTitle}</h3>
            <p>${guide.what}</p>
          </section>
          <section class="sop-callout">
            ${icon("lightbulb", 34)}
            <div>
              <h3>${guide.whenTitle}</h3>
              <p>${guide.when}</p>
            </div>
          </section>
          <section class="sop-guide">
            <h3>${icon("chevron-right", 28)} ${guide.guideTitle}</h3>
            <div class="sop-step-list">
              ${stepCards.map((item) => `
                ${sectionLabels[item.no] ? `<h3 class="sop-section-heading">${sectionLabels[item.no]}</h3>` : ""}
                <article class="sop-step-card">
                  <div class="sop-step-title">
                    <span>${item.no}</span>
                    <h4>${guide.stepLabel} ${item.no} &mdash; ${item.title}</h4>
                  </div>
                  <div class="sop-step-body">
                    ${item.subtitle ? `<strong>${item.subtitle}</strong>` : ""}
                    <p>${item.copy}</p>
                    ${item.bullets ? `<ul>${item.bullets.map((line) => `<li>${line}</li>`).join("")}</ul>` : ""}
                    ${item.after ? `<p>${item.after}</p>` : ""}
                    ${item.tip ? `<div class="sop-tip">${icon("lightbulb", 20)} <div><b>${guide.tipLabel}:</b><p>${item.tip}</p></div></div>` : ""}
                  </div>
                </article>`).join("")}
            </div>
          </section>
          <section class="sop-workflow">
            <h3>${guide.workflowTitle}</h3>
            <p>${guide.workflow}</p>
          </section>
        </div>
        <footer class="sop-modal-foot">
          <button class="sop-understood" data-action="close-modal">${guide.close}</button>
        </footer>
      </section>
    </div>`;
}

function livePanel() {
  return `<aside class="live-panel"><h3>${icon("activity")} Live Activity</h3>${state.db.usage.slice(0, 6).map((x) => `<p>${x.action}<small>${x.credits} credits</small></p>`).join("")}</aside>`;
}

function latestAgentUserMessage() {
  return [...state.agentMessages].reverse().find((item) => item.role === "user")?.content || state.agentInput || "";
}

function agentWorkMode(text = "") {
  const value = String(text).toLowerCase();
  if (/(video|ugc|reel|tiktok|clip|shoot|shooting|视频|短片|短视频|拍摄)/i.test(value)) return "video";
  if (/(image|photo|picture|avatar|thumbnail|poster|图片|图|头像|海报|封面)/i.test(value)) return "image";
  if (/(caption|hook|script|copy|story|文案|脚本|标题|开头|caption)/i.test(value)) return "copy";
  if (/(schedule|calendar|post|autopost|publish|plan|排期|发布|计划|日历)/i.test(value)) return "schedule";
  return "command";
}

function currentAgent3DMode() {
  const preview = new URLSearchParams(window.location.search).get("agentPreview");
  const canPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (canPreview && ["idle", "image", "video", "copy", "schedule", "command", "chat"].includes(preview)) return preview;
  if (state.agentVisualPhase && state.agentVisualPhase !== "idle") return state.agentTaskMode || "command";
  if (!state.agentBusy) return "idle";
  return agentWorkMode(latestAgentUserMessage());
}

function agentVisualBubble(mode, phase) {
  if (phase === "wake") return "收到任务";
  if (phase === "chatting") return "沟通中";
  if (phase === "walking") return "去工位中";
  if (phase === "done") return "完成，等您查看";
  if (phase === "returning") return "回去休息";
  if (phase === "idle") return "待命中";
  return {
    image: "图片生成中",
    video: "影片生成中",
    copy: "文案生成中",
    schedule: "排期规划中",
    command: "沟通中",
    chat: "沟通中"
  }[mode] || "处理中";
}

function agent3DCopy(mode = "idle") {
  const copy = {
    idle: {
      label: "Idle mode",
      title: "Mascot sedang rehat, menunggu arahan.",
      subtitle: "没活干的时候它就在生活区睡觉。用户一发消息，它先到中间沟通区回应；需要生成图片或影片时，再去电脑工位开工。",
      cards: ["Sleeping", "Chatting", "Working"]
    },
    image: {
      label: "Image station",
      title: "Image station: generate product visuals.",
      subtitle: "图片任务会切到视觉工位：头像、商品图、封面和广告素材都在这里处理。",
      cards: ["Avatar", "Product shot", "Thumbnail"]
    },
    video: {
      label: "Video station",
      title: "Video station: build TikTok UGC.",
      subtitle: "视频任务会切到剪辑工位：脚本、镜头、素材和发布节奏一起推进。",
      cards: ["Hook", "Scene", "Export"]
    },
    copy: {
      label: "Copy station",
      title: "Copy station: write hooks and captions.",
      subtitle: "文案任务会切到写作工位：hook、caption、脚本和卖点结构由 Agent 生成。",
      cards: ["Hook", "Script", "Caption"]
    },
    schedule: {
      label: "Schedule station",
      title: "Schedule station: plan posting flow.",
      subtitle: "排期任务会切到运营工位：日历、批量内容和下一步动作都由 Agent 梳理。",
      cards: ["7 days", "Queue", "Review"]
    },
    command: {
      label: "Chat station",
      title: "Chat station: talk with the user.",
      subtitle: "当用户正在跟 Agent 沟通、问问题或交代需求时，它会来到中间交流区，像真人客服一样回应。",
      cards: ["Listen", "Clarify", "Reply"]
    },
    chat: {
      label: "Chat station",
      title: "Chat station: talk with the user.",
      subtitle: "当用户正在跟 Agent 沟通、问问题或交代需求时，它会来到中间交流区，像真人客服一样回应。",
      cards: ["Listen", "Clarify", "Reply"]
    }
  };
  return copy[mode] || copy.idle;
}

function agent3DScene(options = {}) {
  const compact = Boolean(options.compact);
  const mode = currentAgent3DMode();
  const copy = agent3DCopy(mode);
  const status = agentStatusInfo();
  const params = new URLSearchParams(window.location.search);
  const canPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const phasePreview = canPreview ? params.get("agentPhase") : "";
  const idlePreview = canPreview ? params.get("agentIdle") : "";
  const phase = ["idle", "wake", "chatting", "walking", "working", "done", "returning"].includes(phasePreview) ? phasePreview : state.agentVisualPhase || "idle";
  const idle = ["sleep"].includes(idlePreview) ? idlePreview : "sleep";
  return `
    <div class="agent-3d-card agent-life-card ${compact ? "agent-life-card-compact" : ""}" data-agent-mode="${mode}" data-agent-phase="${phase}" data-idle-activity="${idle}">
      ${compact ? "" : `<div class="agent-3d-status">
        <span>${icon(status.iconName, 17)} ${status.label}</span>
        <b>${status.label}</b>
      </div>`}
      <div class="agent-life-stage" aria-label="Pokaya Agent work, chat, and rest states">
        <img class="agent-life-render-image agent-life-render-sleep" src="/pokaya-agent-stage-chat-sleep-bg.png" alt="Pokaya Agent sleeping in bed">
        <span class="agent-life-route" aria-hidden="true"></span>
        <span class="agent-chair-mask" aria-hidden="true"></span>
        <img class="agent-sprite agent-sprite-work" src="/pokaya-agent-sprite-work.png" alt="">
        <img class="agent-sprite agent-sprite-chat" src="/pokaya-agent-sprite-chat.png" alt="">
        ${compact ? "" : `<span class="agent-life-bubble">${agentVisualBubble(mode, phase)}</span>`}
      </div>
      ${compact ? "" : `<div class="agent-3d-copy">
        <h2>${copy.title}</h2>
        <p>${copy.subtitle}</p>
        <div class="agent-3d-task-row">
          ${copy.cards.map((item) => `<span>${esc(item)}</span>`).join("")}
        </div>
      </div>`}
    </div>`;
}

function agentUiCopy() {
  const copy = {
    zh: {
      title: "Pokaya Agent",
      subtitle: "帮你在 Pokaya 平台上完成任何可执行的事情",
      emptyTitle: "你今天想让 Agent 做什么？",
      emptyBody: "直接说一句话就可以。我会记住项目和历史；需要补充信息、扣费或发布时，会先问你确认。",
      inputReady: "告诉 Agent 你想做什么...",
      inputBusy: "Agent 正在处理，你可以继续输入，发送后会排队...",
      inputConfirm: "请先确认或取消当前动作",
      send: "发送",
      errorUnavailable: "Agent 暂时不可用，请联系管理员配置 AI 服务。",
      thinkingLabel: "Agent 正在思考",
      slowTitle: "这次响应比较久",
      slowDescription: "你可以先继续输入，我会在结果回来后接上。",
      abilityDirect: "能直接执行的，我会直接做",
      abilityAsk: "信息不够时，我会先问清楚",
      abilityConfirm: "扣费或发布前，一定先确认",
      debug: "调试",
      close: "关闭",
      newChat: "新对话",
      history: "历史",
      more: "更多",
      clearContext: "清空本次聊天",
      statusIdle: "待命中",
      statusBusy: "工作中",
      statusConfirm: "需要确认",
      statusDone: "已完成",
      idleHint: "我现在在待命。你发一句话，我会先理解需求，再决定是否需要问你确认。",
      busyHint: "正在理解你的需求、检查 workspace，并准备安全执行。",
      confirmHint: "有动作需要你确认，确认后我才会继续执行。",
      doneHint: "上一轮任务已完成。你可以继续让我安排下一步。",
      workspace: "Workspace 摘要",
      currentProject: "当前项目",
      credits: "Credits",
      results: "结果",
      schedule: "排期",
      nextStep: "下一步",
      noProject: "还没有项目",
      noProjectHint: "可以先让 Agent 帮你创建一个产品项目。",
      missingProduct: "补产品名和目标人群",
      scheduleLatest: "把已有结果安排到排期",
      createContent: "生成第一批内容",
      ready: "准备好了",
      userLabel: "你",
      agentLabel: "Agent",
      statusActions: ["继续追问", "做内容计划", "生成视频 prompt"],
      quickTasks: [
        "检查今天还缺什么",
        "创建 7 天内容计划",
        "把最新图片安排到今晚发布",
        "新建一个产品项目",
        "生成视频 prompt"
      ]
    },
    ms: {
      title: "Pokaya Agent",
      subtitle: "Bantu anda buat apa sahaja yang tersedia dalam platform Pokaya",
      emptyTitle: "Apa yang anda mahu Agent buat hari ini?",
      emptyBody: "Tulis satu arahan sahaja. Saya akan ingat project dan sejarah; jika perlu maklumat, credits atau publish, saya akan confirm dulu.",
      inputReady: "Beritahu Agent apa nak buat...",
      inputBusy: "Agent sedang kerja. Anda boleh terus taip; mesej akan queue...",
      inputConfirm: "Sila confirm atau cancel tindakan semasa dulu",
      send: "Hantar",
      errorUnavailable: "Agent belum tersedia. Sila hubungi admin untuk konfigurasi servis AI.",
      thinkingLabel: "Agent sedang berfikir",
      slowTitle: "Respons kali ini agak lama",
      slowDescription: "Anda boleh terus taip dulu. Saya akan sambung bila jawapan siap.",
      abilityDirect: "Jika boleh terus buat, saya akan buat",
      abilityAsk: "Jika maklumat kurang, saya akan tanya dulu",
      abilityConfirm: "Credits atau publish mesti confirm dulu",
      debug: "Debug",
      close: "Tutup",
      newChat: "Chat baru",
      history: "Sejarah",
      more: "Lagi",
      clearContext: "Kosongkan chat ini",
      statusIdle: "Standby",
      statusBusy: "Sedang kerja",
      statusConfirm: "Perlu confirm",
      statusDone: "Selesai",
      idleHint: "Saya sedang standby. Hantar satu arahan, saya akan fahamkan dulu sebelum bertindak.",
      busyHint: "Sedang fahamkan request, semak workspace, dan sediakan tindakan selamat.",
      confirmHint: "Ada tindakan perlu confirmation sebelum saya teruskan.",
      doneHint: "Task tadi sudah selesai. Anda boleh minta langkah seterusnya.",
      workspace: "Ringkasan workspace",
      currentProject: "Project",
      credits: "Credits",
      results: "Results",
      schedule: "Schedule",
      nextStep: "Next step",
      noProject: "Belum ada project",
      noProjectHint: "Minta Agent buat product project dulu.",
      missingProduct: "Tambah nama produk dan audience",
      scheduleLatest: "Masukkan result ke schedule",
      createContent: "Generate content pertama",
      ready: "Ready",
      userLabel: "Anda",
      agentLabel: "Agent",
      statusActions: ["Tanya lanjut", "Buat content plan", "Generate video prompt"],
      quickTasks: [
        "Check hari ini kurang apa",
        "Buat 7-day content plan",
        "Schedule gambar latest malam ini",
        "Buat product project baru",
        "Generate video prompt"
      ]
    },
    en: {
      title: "Pokaya Agent",
      subtitle: "Help with anything available inside the Pokaya platform",
      emptyTitle: "What should Agent do today?",
      emptyBody: "Say it in one sentence. I remember your project and history; if details, credits, or publishing are involved, I will ask first.",
      inputReady: "Tell Agent what to do...",
      inputBusy: "Agent is working. Keep typing; sent messages will queue...",
      inputConfirm: "Confirm or cancel the current action first",
      send: "Send",
      errorUnavailable: "Agent is temporarily unavailable. Please ask an admin to configure the AI service.",
      thinkingLabel: "Agent is thinking",
      slowTitle: "This response is taking longer",
      slowDescription: "You can keep typing. I will continue when the result is ready.",
      abilityDirect: "If I can act directly, I will",
      abilityAsk: "If details are missing, I will ask first",
      abilityConfirm: "Credits or publishing always require confirmation",
      debug: "Debug",
      close: "Close",
      newChat: "New Chat",
      history: "History",
      more: "More",
      clearContext: "Clear this chat",
      statusIdle: "Standby",
      statusBusy: "Working",
      statusConfirm: "Needs confirmation",
      statusDone: "Completed",
      idleHint: "I am standing by. Send one request and I will understand it before deciding what to do.",
      busyHint: "Understanding your request, checking workspace, and preparing safe actions.",
      confirmHint: "One action needs your confirmation before I continue.",
      doneHint: "The last task is complete. You can ask me for the next step.",
      workspace: "Workspace Summary",
      currentProject: "Project",
      credits: "Credits",
      results: "Results",
      schedule: "Schedule",
      nextStep: "Next step",
      noProject: "No project yet",
      noProjectHint: "Ask Agent to create a product project first.",
      missingProduct: "Add product name and audience",
      scheduleLatest: "Schedule the existing result",
      createContent: "Generate the first content",
      ready: "Ready",
      userLabel: "You",
      agentLabel: "Agent",
      statusActions: ["Ask a follow-up", "Create a content plan", "Generate a video prompt"],
      quickTasks: [
        "Check what is missing today",
        "Create a 7-day content plan",
        "Schedule the latest image tonight",
        "Create a new product project",
        "Generate a video prompt"
      ]
    }
  };
  return copy[state.lang] || copy.en;
}

function agentDisplayLang() {
  const sample = [
    state.agentInput,
    [...state.agentMessages].reverse().find((item) => item.role === "user")?.content,
    [...state.agentMessages].reverse().find((item) => item.role === "assistant")?.content
  ].filter(Boolean).join(" ");
  if (/[\u3400-\u9fff]/.test(sample)) return "zh";
  return state.lang || "en";
}

function agentUserSafeError(error) {
  const raw = String(error?.message || error || "");
  const lang = agentDisplayLang();
  const errorCopy = {
    zh: {
      network: "Agent 请求连接中断了，可能是网络不稳、域名配置异常，或后端响应太久。请刷新后再试一次；如果持续出现，请联系管理员检查 API 状态。",
      login: "登录状态已失效，请重新登录后再试。",
      unavailable: "Agent 暂时不可用，可能是 AI 服务配置或上游接口异常。请稍后重试，或联系管理员检查 API 状态。",
      generic: "Agent 这次请求失败了。请刷新后再发一次；如果持续出现，请联系管理员检查后端日志和 API 配置。"
    },
    ms: {
      network: "Permintaan Agent terputus. Ini mungkin kerana network tidak stabil, domain/API bermasalah, atau server lambat respon. Refresh dan cuba lagi; jika masih berlaku, minta admin semak status API.",
      login: "Sesi login sudah tamat. Sila login semula dan cuba lagi.",
      unavailable: "Agent belum tersedia buat masa ini. Mungkin konfigurasi AI service atau upstream API bermasalah. Cuba lagi sebentar lagi, atau minta admin semak status API.",
      generic: "Permintaan Agent gagal. Refresh dan hantar semula; jika masih berlaku, minta admin semak log backend dan konfigurasi API."
    },
    en: {
      network: "The Agent request was interrupted. This may be a network issue, a domain/API routing problem, or a slow backend response. Refresh and try again; if it keeps happening, ask an admin to check API status.",
      login: "Your login session has expired. Please sign in again and retry.",
      unavailable: "Agent is temporarily unavailable. The AI service configuration or upstream API may be failing. Try again shortly, or ask an admin to check API status.",
      generic: "The Agent request failed. Refresh and send it again; if it keeps happening, ask an admin to check backend logs and API configuration."
    }
  };
  const copy = errorCopy[lang] || errorCopy.en;
  if (/failed to fetch|networkerror|load failed|network|timeout|aborted|dns|cloudflare/i.test(raw)) {
    return copy.network;
  }
  if (/login required|unauthorized|session|401/i.test(raw)) {
    return copy.login;
  }
  if (/DEE?PSEEK|API[_ -]?KEY|Environment Variables|configure|configured|403|503|502|500|service unavailable|bad gateway/i.test(raw)) {
    return copy.unavailable;
  }
  if (!raw || /^request failed$/i.test(raw)) {
    return copy.generic;
  }
  if (/request failed|failed/i.test(raw)) {
    return copy.generic;
  }
  return raw;
}

function agentHasPendingConfirmation() {
  return state.agentMessages.some((item) => item.agentRun?.status === "waiting_confirmation");
}

function latestPendingAgentConfirmation() {
  return [...state.agentMessages].reverse().find((item) => item.agentRun?.status === "waiting_confirmation" && item.agentRun?.confirmation)?.agentRun || null;
}

function isAgentConfirmIntent(content = "") {
  const text = String(content || "").trim().toLowerCase();
  return /^(生成|确认|确认生成|开始生成|直接生成|可以|ok|okay|yes|confirm|generate|run|do it)$/i.test(text);
}

function agentStatusInfo() {
  const c = agentUiCopy();
  if (agentHasPendingConfirmation()) return { key: "confirm", label: c.statusConfirm, hint: c.confirmHint, iconName: "shield-alert" };
  if (state.agentBusy) return { key: "busy", label: c.statusBusy, hint: c.busyHint, iconName: "loader-circle" };
  const lastRun = [...state.agentMessages].reverse().find((item) => item.agentRun)?.agentRun;
  if (lastRun?.status === "completed") return { key: "done", label: c.statusDone, hint: c.doneHint, iconName: "check-check" };
  return { key: "idle", label: c.statusIdle, hint: c.idleHint, iconName: "circle-dot" };
}

function agentProjectSchedule(projectId) {
  if (!projectId) return [];
  return (state.db?.schedule || []).filter((item) => !item.projectId || item.projectId === projectId);
}

function agentWorkspaceSummaryData() {
  const p = state.db?.projects?.find((item) => item.id === state.projectId) || state.db?.projects?.[0];
  const schedules = agentProjectSchedule(p?.id);
  const memory = p?.agentMemory || {};
  const missingMemory = !memory.productName || !memory.audience;
  const c = agentUiCopy();
  return {
    project: p,
    credits: formatCreditBalance(state.db?.billing?.credits || 0),
    resultCount: p?.results?.length || 0,
    scheduleCount: schedules.length,
    nextStep: !p ? c.noProjectHint : missingMemory ? c.missingProduct : p.results?.length ? c.scheduleLatest : c.createContent
  };
}

function agentQuickTasks() {
  const c = agentUiCopy();
  const { project, resultCount } = agentWorkspaceSummaryData();
  const tasks = [...c.quickTasks];
  if (!project) return [c.quickTasks[3], c.quickTasks[0], c.quickTasks[1]];
  if (!resultCount) return [c.quickTasks[1], c.quickTasks[4], c.quickTasks[0], c.quickTasks[3]];
  return tasks;
}

function agentTopbar() {
  const c = agentUiCopy();
  const status = agentStatusInfo();
  return `<header class="agent-topbar">
    <div>
      <p class="folder-label">${icon("bot", 18)} Pokaya Agent</p>
      <h1>${c.title}</h1>
      <p>${c.subtitle}</p>
    </div>
    <div class="agent-topbar-actions">
      <span class="agent-status-pill" data-agent-status="${status.key}">${icon(status.iconName, 16)} ${status.label}</span>
      <button class="dark-button mini-button" data-action="new-agent-chat" title="${esc(c.newChat)}">${icon("message-square-plus", 16)} ${c.newChat}</button>
      <button class="icon-only" data-action="toggle-agent-history" title="${esc(c.history)}" aria-label="${esc(c.history)}">${icon("history", 18)}${state.agentHistorySessions.length ? `<b>${state.agentHistorySessions.length}</b>` : ""}</button>
    </div>
  </header>`;
}

function agentStatusRail() {
  return `<aside class="agent-status-rail">
    ${agentStatusCard()}
  </aside>`;
}

function agentStatusCard() {
  const status = agentStatusInfo();
  const c = agentUiCopy();
  return `<section class="agent-status-card" data-agent-status="${status.key}">
    <div class="agent-status-card-head">
      <span>${icon(status.iconName, 16)} ${status.label}</span>
    </div>
    <p>${esc(status.hint)}</p>
    ${agent3DScene({ compact: true })}
  </section>`;
}

function agentWorkspaceSummary() {
  const c = agentUiCopy();
  const data = agentWorkspaceSummaryData();
  if (!data.project) return `<section class="agent-context-card">
    <h2>${icon("folder-plus", 18)} ${c.workspace}</h2>
    <strong>${c.noProject}</strong>
    <p>${c.noProjectHint}</p>
  </section>`;
  return `<section class="agent-context-card">
    <h2>${icon("layout-dashboard", 18)} ${c.workspace}</h2>
    <div class="agent-context-grid">
      <p><span>${c.currentProject}</span><b>${esc(data.project.name)}</b></p>
      <p><span>${c.credits}</span><b>${esc(data.credits)}</b></p>
      <p><span>${c.results}</span><b>${data.resultCount}</b></p>
      <p><span>${c.schedule}</span><b>${data.scheduleCount}</b></p>
    </div>
    <div class="agent-next-step"><span>${c.nextStep}</span><b>${esc(data.nextStep)}</b></div>
  </section>`;
}

function agentNextActions() {
  return "";
}

function agentListChips(items = [], empty = "还没有足够信号") {
  const values = Array.isArray(items) ? items.filter(Boolean).slice(0, 6) : [];
  return values.length ? values.map((item) => `<span>${esc(item)}</span>`).join("") : `<em>${esc(empty)}</em>`;
}

function agentBrainPanel() {
  const prefs = state.db?.agentPreferences || {};
  const metrics = state.db?.agentMetrics || {};
  const templates = (state.db?.agentTemplates || []).slice(0, 4);
  return `<aside class="agent-brain-panel">
    <section class="agent-brain-card">
      <header><strong>${icon("brain", 17)} Agent Brain</strong><button class="icon-only" data-action="clear-agent-preferences" title="清空偏好记忆" aria-label="清空偏好记忆">${icon("trash-2", 16)}</button></header>
      <p>Agent 不主动打扰，只在你提问后用这些偏好辅助判断。</p>
      <div class="agent-memory-groups">
        <div><b>常用方向</b><p>${agentListChips(prefs.adoptedTrends)}</p></div>
        <div><b>偏好品类</b><p>${agentListChips(prefs.preferredCategories)}</p></div>
        <div><b>偏好风格</b><p>${agentListChips(prefs.preferredStyles)}</p></div>
        <div><b>少走方向</b><p>${agentListChips(prefs.avoidedPatterns, "暂无负反馈")}</p></div>
      </div>
    </section>
    <section class="agent-brain-card">
      <header><strong>${icon("activity", 17)} 学习状态</strong></header>
      <div class="agent-metric-grid">
        <p><span>对话执行</span><b>${esc(metrics.completedRuns || 0)}/${esc(metrics.runs || 0)}</b></p>
        <p><span>正反馈</span><b>${esc(metrics.positiveSignals || 0)}</b></p>
        <p><span>负反馈</span><b>${esc(metrics.negativeSignals || 0)}</b></p>
        <p><span>模板</span><b>${esc(metrics.templates || templates.length || 0)}</b></p>
      </div>
      ${(metrics.topTools || []).length ? `<div class="agent-tool-chip-row">${metrics.topTools.slice(0, 5).map((item) => `<span>${esc(item)}</span>`).join("")}</div>` : ""}
    </section>
    <section class="agent-brain-card">
      <header><strong>${icon("bookmark", 17)} 成功模板</strong></header>
      ${templates.length ? `<div class="agent-template-list">${templates.map(agentTemplateItem).join("")}</div>` : `<p>你保存过的趋势、脚本、prompt 会出现在这里。</p>`}
    </section>
  </aside>`;
}

function agentTemplateItem(template = {}) {
  const prompt = `Use this saved template and adapt it to my current project:\n${template.content || template.summary || template.title || ""}`;
  return `<article class="agent-template-item">
    <div><b>${esc(template.title || "Agent template")}</b><span>${esc(template.summary || template.type || "")}</span></div>
    <menu>
      <button class="icon-only" data-agent-template-use="${esc(template.id)}" data-agent-prompt="${esc(prompt)}" title="使用模板" aria-label="使用模板">${icon("send", 15)}</button>
      <button class="icon-only" data-agent-template-delete="${esc(template.id)}" title="删除模板" aria-label="删除模板">${icon("trash-2", 15)}</button>
    </menu>
  </article>`;
}

function agentPage() {
  return `
    <section class="agent-page">
      <div class="agent-workspace-shell">
        ${chatPanel()}
      </div>
    </section>`;
}

function chatPanel() {
  const fixtureActive = agentLayoutFixtureEnabled();
  const newChatPulse = state.agentNewChatPulse && Date.now() - Number(state.agentNewChatPulse) < 900;
  return `
    <section class="agent-panel agent-page-panel agent-chat-shell ${fixtureActive ? "agent-layout-fixture-active" : ""} ${newChatPulse ? "is-new-chat" : ""}" ${fixtureActive ? `data-agent-layout-fixture="${agentLayoutFixtureParam}"` : ""}>
      ${agentChatToolbar()}
      ${agentHistoryPanel()}
      ${agentDebugPanel()}
      <div class="agent-thread">${agentThreadHtml()}</div>
      ${agentFormHtml()}
    </section>`;
}

function agentThreadHtml() {
  const c = agentUiCopy();
  const visibleMessages = visibleAgentMessages();
  const intro = state.agentMessages.length
    ? ""
    : `<div class="agent-empty-state">
        <strong>${c.emptyTitle}</strong>
        <p>${c.emptyBody}</p>
      </div>`;
  return `
    ${intro}
    ${agentCollapsedHistoryBar()}
    ${visibleMessages.map(({ item, index }) => agentMessageArticle(item, index)).join("")}
    ${state.agentBusy && !state.agentTyping ? agentThinkingCard() : ""}
    ${agentRecoveredRunCard()}
    ${agentQueuedMessages()}`;
}

function agentRecoveredRunCard() {
  const run = state.agentRecoveredRun;
  if (!run || state.agentBusy || state.agentTyping || !state.agentMessages.length) return "";
  const signature = agentHistoryMessagesSignature(state.agentMessages);
  const chatMatches = !run.chatId || !state.activeAgentHistoryId || run.chatId === state.activeAgentHistoryId;
  if (!chatMatches || (run.signature && run.signature !== signature)) return "";
  const title = state.lang === "zh" ? "处理中任务已恢复" : state.lang === "ms" ? "Tugas sedang dipulihkan" : "Working task restored";
  const description = state.lang === "zh"
    ? "这个 chat 之前有一个进行中的 Agent 请求。你可以先留在当前对话，结果回来后会接上；如果太久没变化，可以重新发送。"
    : state.lang === "ms"
      ? "Chat ini ada request Agent yang sedang diproses. Kekal di sini; jika terlalu lama, hantar semula."
      : "This chat had an active Agent request. Stay here for the result to reconnect; if it takes too long, send it again.";
  return `<article class="assistant agent-thinking agent-thinking-restored">
    <span>${esc(state.lang === "zh" ? "Agent 正在恢复" : "Agent recovery")}</span>
    <div class="agent-thinking-row">
      <b>${icon("loader-circle", 18)}</b>
      <div>
        <strong>${esc(title)}</strong>
        <p>${esc(description)}</p>
      </div>
    </div>
  </article>`;
}

function agentFormHtml() {
  const c = agentUiCopy();
  const pendingConfirmation = agentHasPendingConfirmation();
  const inputPlaceholder = state.agentBusy
    ? c.inputBusy
    : pendingConfirmation
      ? c.inputConfirm
      : c.inputReady;
  const canStopAgent = state.agentBusy && (state.agentTyping || agentAbortController);
  return `<form class="agent-form" data-form="agent">
    ${agentAttachmentTray()}
    <label class="agent-attach-button" title="Add image or video" aria-label="Add image or video">
      ${icon("paperclip", 18)}
      <input type="file" data-agent-file accept="image/*,video/*" multiple hidden>
    </label>
    <textarea name="message" rows="1" data-agent-input placeholder="${esc(inputPlaceholder)}" ${pendingConfirmation ? "disabled" : ""}>${esc(state.agentInput)}</textarea>
    ${canStopAgent
      ? `<button class="gold-button agent-send-button agent-stop-button" type="button" data-action="stop-agent-response" title="Stop Agent" aria-label="Stop Agent">${icon("square", 17)}<span>Stop</span></button>`
      : `<button class="gold-button agent-send-button" type="submit" title="${esc(c.send)}" aria-label="${esc(c.send)}" ${pendingConfirmation || state.agentBusy ? "disabled" : ""}>${icon(state.agentBusy ? "loader-circle" : "send", 19)}<span>${c.send}</span></button>`}
  </form>`;
}

function agentAttachmentTray() {
  const items = state.agentAttachments || [];
  if (!items.length) return "";
  return `<div class="agent-attachment-tray">
    ${items.map((item) => `<article>
      ${item.kind === "image" ? `<img src="${esc(item.previewUrl || item.dataUrl || "")}" alt="">` : `<span>${icon("video", 18)}</span>`}
      <div><b>${esc(item.name)}</b><small>${esc(agentAttachmentLabel(item))}</small></div>
      <button type="button" data-agent-remove-attachment="${esc(item.id)}" aria-label="Remove attachment">${icon("x", 14)}</button>
    </article>`).join("")}
  </div>`;
}

function agentMessageAttachments(items = []) {
  const attachments = Array.isArray(items) ? items : [];
  if (!attachments.length) return "";
  return `<div class="agent-message-attachments">
    ${attachments.map((item) => `<article>
      ${item.kind === "image" && item.previewUrl ? `<img src="${esc(item.previewUrl)}" alt="">` : `<span>${icon(item.kind === "video" ? "video" : "image", 16)}</span>`}
      <div><b>${esc(item.name || "Attachment")}</b><small>${esc(agentAttachmentLabel(item))}</small></div>
    </article>`).join("")}
  </div>`;
}

function agentQueuedMessages() {
  const queue = Array.isArray(state.agentQueue) ? state.agentQueue : [];
  if (!queue.length) return "";
  const c = agentUiCopy();
  const label = state.lang === "zh" ? "排队中" : state.lang === "ms" ? "Dalam queue" : "Queued";
  return queue.map((item, index) => `<article class="user agent-queued">
    <span>${c.userLabel} · ${label}${queue.length > 1 ? ` #${index + 1}` : ""}</span>
    ${agentMessageAttachments(item.attachments)}
    <div class="agent-message"><p>${esc(item.content).replaceAll("\n", "<br>")}</p></div>
  </article>`).join("");
}

function agentAttachmentLabel(item = {}) {
  const type = item.type || (item.kind === "video" ? "video" : "image");
  const frameCount = Array.isArray(item.keyframes) ? item.keyframes.length : 0;
  return `${type}${item.size ? ` · ${formatBytes(item.size)}` : ""}${frameCount ? ` · ${frameCount} frames` : ""}`;
}

function agentChatToolbar() {
  const c = agentUiCopy();
  const sessions = Array.isArray(state.agentHistorySessions) ? state.agentHistorySessions : [];
  const newChatBusy = state.agentBusy || state.agentTyping;
  const newChatTitle = newChatBusy
    ? (state.lang === "zh" ? "Agent 处理中，完成后才能开新 chat" : "Agent is working. Start a new chat after it finishes.")
    : c.newChat;
  return `<aside class="agent-chat-toolbar agent-session-sidebar" aria-label="${esc(c.history)}">
    <nav class="agent-session-actions" aria-label="Agent chats">
      <button class="agent-session-action" type="button" data-action="new-agent-chat" title="${esc(newChatTitle)}" ${newChatBusy ? `disabled aria-disabled="true" data-agent-busy-action="true"` : ""}>${icon(newChatBusy ? "loader-circle" : "square-pen", 20)}<span>${esc(c.newChat)}</span></button>
      <label class="agent-session-search" title="${esc(c.history)}">
        ${icon("search", 20)}
        <input type="search" data-agent-history-search placeholder="${agentHistorySearchPlaceholder()}" aria-label="${agentHistorySearchPlaceholder()}">
      </label>
    </nav>
    <section class="agent-session-recents">
      <header><strong>${agentHistoryRecentsLabel()}</strong></header>
      ${agentHistorySidebarList(sessions)}
    </section>
  </aside>`;
}

function agentHistorySearchPlaceholder() {
  if (state.lang === "zh") return "搜索对话";
  if (state.lang === "ms") return "Cari chat";
  return "Search chats";
}

function agentHistoryRecentsLabel() {
  if (state.lang === "zh") return "最近";
  if (state.lang === "ms") return "Terkini";
  return "Recents";
}

function agentHistorySidebarList(sessions = []) {
  const normalizedSessions = normalizeAgentHistorySessions(sessions);
  const displaySessions = normalizedSessions;
  if (!displaySessions.length) return `<p class="agent-session-empty">还没有历史记录</p>`;
  return `<div class="agent-session-list">
    ${displaySessions.map((item) => {
      const title = agentHistoryDisplayTitle(item);
      const isEditing = state.agentHistoryEditingId === item.id;
      const isDraft = item.id === agentDraftHistoryId || item.isDraft;
      const isActive = isDraft || state.activeAgentHistoryId === item.id;
      const searchText = `${title} ${agentHistoryMeta(item)}`.toLowerCase();
      return `<article class="agent-session-item ${isActive ? "is-active" : ""}" data-agent-history-row data-agent-history-restore-row="${esc(item.id)}" data-agent-history-text="${esc(searchText)}">
        ${isEditing ? `<label class="agent-session-edit" title="重命名对话">
          <input data-agent-history-title-input data-agent-history-title-id="${esc(item.id)}" value="${esc(title)}" maxlength="64" autofocus>
          <small>Enter 保存 · Esc 取消</small>
        </label>` : `<button type="button" class="agent-session-restore" data-agent-history-restore="${esc(item.id)}" title="${esc(title)}">
            <span>${esc(title)}</span>
            <small>${agentHistoryMeta(item)}</small>
          </button>`}
        ${isDraft ? "" : `<button type="button" class="agent-session-rename" data-agent-history-rename="${esc(item.id)}" title="重命名对话" aria-label="重命名对话">${icon("pencil", 15)}</button>
        <button type="button" class="agent-session-delete" data-agent-history-delete="${esc(item.id)}" title="删除这条历史" aria-label="删除这条历史">${icon("trash-2", 15)}</button>`}
      </article>`;
    }).join("")}
  </div>`;
}

function agentDebugPanel() {
  if (!state.agentDebugOpen || !isOwnerAdminAccount()) return "";
  const c = agentUiCopy();
  const latestRun = [...state.agentMessages].reverse().find((item) => item.agentRun)?.agentRun;
  const plan = Array.isArray(latestRun?.plan) ? latestRun.plan : [];
  const cards = Array.isArray(latestRun?.toolCards) ? latestRun.toolCards : [];
  return `<section class="agent-debug-panel">
    <header><strong>${icon("bug", 16)} Agent Debug</strong><button class="icon-only" data-action="toggle-agent-debug" title="${esc(c.close)}" aria-label="${esc(c.close)}">${icon("x", 15)}</button></header>
    <div class="agent-debug-grid">
      <p><span>Status</span><b>${esc(latestRun?.status || "idle")}</b></p>
      <p><span>Run</span><b>${esc(latestRun?.id || "-")}</b></p>
      <p><span>Steps</span><b>${plan.length}</b></p>
      <p><span>Tool cards</span><b>${cards.length}</b></p>
    </div>
    ${plan.length ? `<ol>${plan.slice(0, 6).map((step) => `<li><b>${esc(step.status || "pending")}</b><span>${esc(step.label || step.id || "Step")}</span>${step.detail ? `<small>${esc(step.detail)}</small>` : ""}</li>`).join("")}</ol>` : `<p class="agent-debug-empty">No agent run yet.</p>`}
  </section>`;
}

function agentHistoryPanel() {
  if (!state.agentHistoryOpen) return "";
  const c = agentUiCopy();
  const sessions = normalizeAgentHistorySessions(state.agentHistorySessions);
  const newChatBusy = state.agentBusy || state.agentTyping;
  return `<section class="agent-history-panel">
    <header>
      <strong>${icon("history", 16)} ${c.history}</strong>
      <button class="agent-history-close" data-action="toggle-agent-history" title="关闭" aria-label="关闭">${icon("x", 16)}</button>
    </header>
    ${sessions.length
      ? `<div class="agent-history-list">${sessions.map((item) => `<article>
          <div class="agent-history-item-main"><b>${esc(agentHistoryDisplayTitle(item))}</b><small>${agentHistoryMeta(item)}</small></div>
          <div class="agent-history-actions">
            <button class="agent-history-action primary" data-agent-history-restore="${esc(item.id)}" title="恢复这条对话" aria-label="恢复这条对话">${icon("rotate-ccw", 15)}</button>
            <button class="agent-history-action danger" data-agent-history-delete="${esc(item.id)}" title="删除这条历史" aria-label="删除这条历史">${icon("trash-2", 15)}</button>
          </div>
        </article>`).join("")}</div>`
      : `<p class="agent-history-empty">还没有历史记录。点「新对话」时，当前对话会自动保存到这里。</p>`}
    <div class="agent-history-footer">
      <button class="agent-history-footer-action" data-action="new-agent-chat" ${newChatBusy ? `disabled aria-disabled="true" data-agent-busy-action="true"` : ""}>${icon(newChatBusy ? "loader-circle" : "message-square-plus", 14)} ${c.newChat}</button>
      <button class="agent-history-footer-action danger" data-action="clear-agent-context">${icon("trash-2", 14)} ${c.clearContext}</button>
    </div>
  </section>`;
}

function agentHistoryCountLabel(count = 0) {
  if (state.lang === "zh") return `${count} 个对话`;
  if (state.lang === "ms") return `${count} chat`;
  return `${count} chats`;
}

function agentHistoryMeta(item = {}) {
  if (item.id === agentDraftHistoryId || item.isDraft) return state.lang === "zh" ? "空白" : "Empty";
  const date = item.updatedAt ? new Date(item.updatedAt).toLocaleString(state.lang === "zh" ? "zh-CN" : "en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  return date;
}

function visibleAgentMessages() {
  const keep = 8;
  const start = Math.max(0, state.agentMessages.length - keep);
  return state.agentMessages.slice(start).map((item, offset) => ({ item, index: start + offset }));
}

function agentCollapsedHistoryBar() {
  return "";
}

function agentMessageArticle(item, index = 0) {
  const c = agentUiCopy();
  const displayContent = item.isTyping ? `${item.content || ""}▍` : item.content;
  const body = item.role === "assistant" ? agentMessageMarkdown(displayContent) : `<p>${esc(item.content).replaceAll("\n", "<br>")}</p>`;
  if (item.role !== "assistant") {
    return `<article class="${item.role}" data-agent-message-index="${index}">
      <span>${c.userLabel}</span>
      ${agentMessageAttachments(item.attachments)}
      <div class="agent-message">${body}</div>
    </article>`;
  }
  const runId = item.agentRun?.id || "";
  const feedback = runId ? `<div class="agent-feedback-row">
    <button type="button" data-agent-feedback="positive_feedback" data-agent-run-id="${esc(runId)}">${icon("thumbs-up", 14)} 有用</button>
    <button type="button" data-agent-feedback="negative_feedback" data-agent-run-id="${esc(runId)}">${icon("thumbs-down", 14)} 不准</button>
  </div>` : "";
  const runPanel = agentVisibleRunPanel(item.agentRun);
  return `<article class="assistant" data-agent-message-index="${index}">
    <span class="agent-avatar-badge" aria-label="${esc(c.agentLabel)}">${icon("bot", 22)}</span>
    <div class="agent-response-stack">
      <div class="agent-message">${body}</div>
      ${runPanel}
      ${feedback}
    </div>
  </article>`;
}

function formatBytes(value = 0) {
  const bytes = Number(value || 0);
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function isLongAgentMessage(content = "") {
  const text = String(content || "");
  return text.length > 520 || text.split(/\r?\n/).filter((line) => line.trim()).length > 7;
}

function agentMessageMarkdown(content = "") {
  const lines = esc(content).split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (/^-{3,}$/.test(line)) {
      i += 1;
      continue;
    }
    if (isMarkdownTable(lines, i)) {
      const head = markdownTableCells(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(markdownTableCells(lines[i]));
        i += 1;
      }
      blocks.push(`<div class="agent-message-table"><table><thead><tr>${head.map((cell) => `<th>${agentInlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${agentInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    const listMatch = line.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[1]);
      const items = [];
      while (i < lines.length) {
        const match = lines[i].trim().match(/^([-*]|\d+\.)\s+(.+)$/);
        if (!match || (/^\d+\./.test(match[1]) !== ordered)) break;
        items.push(`<li>${agentInlineMarkdown(match[2])}</li>`);
        i += 1;
      }
      blocks.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }
    blocks.push(`<p>${agentInlineMarkdown(line.replace(/^#{1,4}\s+/, ""))}</p>`);
    i += 1;
  }
  return blocks.join("");
}

function agentActionChips(content = "") {
  return "";
}

function isMarkdownTable(lines, index) {
  return /^\s*\|.*\|\s*$/.test(lines[index] || "") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || "");
}

function markdownTableCells(line = "") {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function agentInlineMarkdown(value = "") {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function agentThinkingCard() {
  const c = agentUiCopy();
  const mode = agentWorkMode(latestAgentUserMessage());
  const elapsed = state.agentBusyStartedAt ? Date.now() - state.agentBusyStartedAt : 0;
  const phase = agentWorkingPhase(elapsed, mode);
  const steps = agentWorkingSteps(phase.key);
  return `
    <article class="assistant agent-thinking">
      <span>${esc(c.thinkingLabel)}</span>
      <div class="agent-thinking-row">
        <b>${icon("loader-circle", 18)}</b>
        <div>
          <strong>${esc(phase.title)}</strong>
          <p>${esc(phase.description)}</p>
        </div>
      </div>
      <div class="agent-thinking-steps" aria-label="Agent progress">
        ${steps.map((step) => `<span class="${step.status}">${step.status === "done" ? icon("check", 13) : ""}${esc(step.label)}</span>`).join("")}
      </div>
      <div class="agent-thinking-track"><i></i></div>
    </article>`;
}

function agentWorkingPhase(elapsed = 0, mode = "command") {
  const c = agentUiCopy();
  const locale = agentDisplayLang();
  const phaseCopy = {
    zh: {
      tool: "正在处理任务",
      toolDesc: "涉及扣积分或发布时会先让你确认。",
      plan: "正在规划下一步",
      planDesc: "如果信息不够，我会先问你；涉及扣积分会先确认。",
      inspect: "正在检查 workspace",
      inspectDesc: "我在看项目资料、生成结果、排期和积分状态。",
      understand: "正在理解你的需求",
      understandDesc: "我会判断是直接回答、追问，还是调用工具。"
    },
    ms: {
      tool: "Sedang proses tugas",
      toolDesc: "Jika perlu credits atau publish, saya akan minta confirm dulu.",
      plan: "Sedang susun langkah seterusnya",
      planDesc: "Kalau maklumat tak cukup, saya akan tanya dulu.",
      inspect: "Sedang semak workspace",
      inspectDesc: "Saya semak project, hasil, schedule dan credit.",
      understand: "Sedang fahamkan request",
      understandDesc: "Saya tentukan sama ada terus jawab, tanya lanjut, atau guna tool."
    },
    en: {
      tool: "Processing the task",
      toolDesc: "If credits or publishing are involved, I will ask for confirmation first.",
      plan: "Planning the next step",
      planDesc: "If details are missing, I will ask before acting.",
      inspect: "Checking your workspace",
      inspectDesc: "I am reviewing project details, results, schedule, and credits.",
      understand: "Understanding your request",
      understandDesc: "I will decide whether to answer, ask a follow-up, or use a tool."
    }
  }[locale] || {};
  if (elapsed >= 8000) {
    return {
      key: "slow",
      title: c.slowTitle,
      description: c.slowDescription
    };
  }
  if (elapsed >= 4500) {
    return {
      key: "tool_calling",
      title: agentWorkingExecutionTitle(mode),
      description: phaseCopy.toolDesc
    };
  }
  if (elapsed >= 2500) {
    return {
      key: "planning",
      title: phaseCopy.plan,
      description: phaseCopy.planDesc
    };
  }
  if (elapsed >= 1000) {
    return {
      key: "inspecting",
      title: phaseCopy.inspect,
      description: phaseCopy.inspectDesc
    };
  }
  return {
    key: "understanding",
    title: phaseCopy.understand,
    description: phaseCopy.understandDesc
  };
}

function agentWorkingExecutionTitle(mode = "command") {
  const locale = agentDisplayLang();
  const map = {
    zh: {
      image: "正在准备生成内容",
      video: "正在准备视频任务",
      copy: "正在整理内容结构",
      schedule: "正在检查排期动作",
      chat: "正在整理回复",
      command: "正在准备执行"
    },
    ms: {
      image: "Sedang sediakan content",
      video: "Sedang sediakan video",
      copy: "Sedang susun copy",
      schedule: "Sedang semak schedule",
      chat: "Sedang susun jawapan",
      command: "Sedang sediakan tindakan"
    },
    en: {
      image: "Preparing content generation",
      video: "Preparing video work",
      copy: "Structuring the content",
      schedule: "Checking schedule actions",
      chat: "Drafting the reply",
      command: "Preparing the action"
    }
  }[locale] || {};
  return map[mode] || map.command || "Preparing the action";
}

function agentWorkingSteps(activeKey = "understanding") {
  const order = ["understanding", "inspecting", "planning", "tool_calling"];
  const labels = ({
    zh: { understanding: "理解需求", inspecting: "检查资料", planning: "准备执行", tool_calling: "整理结果" },
    ms: { understanding: "Faham request", inspecting: "Semak data", planning: "Sedia tindakan", tool_calling: "Susun hasil" },
    en: { understanding: "Understand", inspecting: "Check data", planning: "Prepare", tool_calling: "Finalize" }
  }[agentDisplayLang()]) || {};
  const activeIndex = activeKey === "slow" ? order.length - 1 : Math.max(order.indexOf(activeKey), 0);
  return order.map((key, index) => ({
    label: labels[key],
    status: index < activeIndex ? "done" : index === activeIndex ? "active" : "pending"
  }));
}

function agentRunStatusLabel(status = "") {
  return {
    planning: "规划中",
    running: "执行中",
    waiting_confirmation: "等待确认",
    completed: "已完成",
    failed: "失败"
  }[status] || status || "处理中";
}

function agentVisibleRunPanel(run) {
  if (!run) return "";
  if (run.status === "waiting_confirmation" || run.status === "failed" || run.confirmation || run.recovery) {
    return agentRunPanel(run);
  }
  const generationCards = agentGenerationRunCards(run);
  if (generationCards) return generationCards;
  return "";
}

function agentRunPanel(run) {
  if (!run) return "";
  const steps = Array.isArray(run.plan) ? run.plan : [];
  const completed = run.status === "completed";
  const summary = completed
    ? agentRunSummary(steps)
    : "";
  if (completed) {
    return `<div class="agent-run-card agent-run-meta" data-agent-run-status="${esc(run.status || "")}" data-agent-run-id="${esc(run.id || "")}">
      <span>${icon("check-check", 14)} ${agentRunStatusLabel(run.status)}</span>
      ${summary ? `<small>${esc(summary)}</small>` : ""}
      ${agentToolCards(run)}
      ${agentUndoCard(run)}
    </div>`;
  }
  return `
    <div class="agent-run-card" data-agent-run-status="${esc(run.status || "")}" data-agent-run-id="${esc(run.id || "")}">
      <div class="agent-run-head">
        <strong>${icon(run.status === "waiting_confirmation" ? "shield-alert" : "list-checks", 16)} ${agentRunStatusLabel(run.status)}</strong>
        ${run.status === "waiting_confirmation" ? `<span>需要确认</span>` : ""}
      </div>
      ${completed && summary ? `<p class="agent-run-summary">${esc(summary)}</p>` : steps.length ? `<ol class="agent-run-steps">${steps.map((step) => `
        <li data-step-status="${esc(step.status || "pending")}">
          <b></b>
          <span>${esc(step.label || step.id || "Step")}</span>
          ${step.detail ? `<small>${esc(step.detail)}</small>` : ""}
        </li>`).join("")}</ol>` : ""}
      ${agentToolCards(run)}
      ${agentRecoveryCard(run)}
      ${agentUndoCard(run)}
      ${agentConfirmationCard(run)}
    </div>`;
}

function agentRunSummary(steps = []) {
  const done = steps
    .filter((step) => ["completed", "waiting_confirmation"].includes(step.status))
    .map((step) => step.label || step.id)
    .filter(Boolean)
    .slice(0, 3);
  return done.length ? done.join(" · ") : "已回复";
}

function agentToolCards(run) {
  const unique = agentUniqueRunCards(run);
  if (!unique.length) return "";
  const generationCards = unique.filter((card) => card.type === "generation_job");
  const otherCards = unique.filter((card) => card.type !== "generation_job");
  return `<div class="agent-tool-cards">
    ${generationCards.length ? agentGenerationRunCards({ ...run, cards: generationCards, toolResults: [] }) : ""}
    ${otherCards.map(agentToolCard).join("")}
  </div>`;
}

function agentRunCards(run) {
  return [...(run?.cards || []), ...(run?.toolResults || []).map((item) => item.card).filter(Boolean)];
}

function agentCardIdentity(card = {}) {
  return `${card.type}:${card.jobId || card.resultId || card.projectId || card.title || ""}`;
}

function agentUniqueRunCards(run) {
  const cards = agentRunCards(run);
  return cards.filter((card, index, list) => index === list.findIndex((item) => agentCardIdentity(item) === agentCardIdentity(card)));
}

function agentGenerationRunCards(run) {
  const cards = agentUniqueRunCards(run).filter((card) => card.type === "generation_job");
  if (!cards.length) return "";
  return `<div class="agent-tool-cards agent-generation-run-cards">${cards.length > 1 ? agentGenerationGalleryCard(cards) : cards.map(agentGenerationJobCard).join("")}</div>`;
}

function agentToolCard(card = {}) {
  if (card.type === "generation_job") {
    return agentGenerationJobCard(card);
  }
  if (card.type === "trend_research") {
    const categories = Array.isArray(card.bestCategories) ? card.bestCategories.slice(0, 6) : [];
    const hooks = Array.isArray(card.hooks) ? card.hooks.slice(0, 5) : [];
    const angles = Array.isArray(card.videoAngles) ? card.videoAngles.slice(0, 3) : [];
    const risks = Array.isArray(card.risks) ? card.risks.slice(0, 3) : [];
    const nextPrompt = card.recommendedNextAction === "create_seedance_prompt"
      ? `Write a video prompt for ${card.trendName || "this trend"}`
      : `Create a 7-day content plan for ${card.trendName || "this trend"}`;
    const templateContent = [
      `Trend: ${card.trendName || card.title || "Trend research"}`,
      card.summary ? `Summary: ${card.summary}` : "",
      categories.length ? `Best categories: ${categories.join(", ")}` : "",
      hooks.length ? `Hooks:\n- ${hooks.join("\n- ")}` : "",
      angles.length ? `Angles:\n- ${angles.map((item) => `${item.title || "Video angle"}: ${item.productPlacement || item.format || ""}`).join("\n- ")}` : "",
      risks.length ? `Risks:\n- ${risks.join("\n- ")}` : ""
    ].filter(Boolean).join("\n\n");
    return `<section class="agent-tool-card trend-research-card" data-agent-card-type="trend_research" data-agent-trend-name="${esc(card.trendName || "")}">
      <header><strong>${icon("search-check", 16)} ${esc(card.title || "Trend research")}</strong><span>${esc(card.summary || "")}</span></header>
      <div class="trend-fit-row">
        <p><span>Fit</span><b>${esc(card.marketFit?.label || "usable")}</b></p>
        <p><span>Score</span><b>${esc(card.marketFit?.score ?? "-")}/5</b></p>
      </div>
      ${categories.length ? `<div class="trend-chip-row">${categories.map((item) => `<span>${esc(item)}</span>`).join("")}</div>` : ""}
      ${angles.length ? `<div class="trend-angle-list">${angles.map((item) => `<p><b>${esc(item.title || "Video angle")}</b><span>${esc(item.productPlacement || item.format || "")}</span></p>`).join("")}</div>` : ""}
      ${hooks.length ? `<div class="trend-hook-list"><strong>${icon("lightbulb", 15)} Hooks</strong><ul>${hooks.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>` : ""}
      ${risks.length ? `<div class="trend-risk-list"><strong>${icon("triangle-alert", 15)} Risks</strong><ul>${risks.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>` : ""}
    </section>`;
  }
  if (card.type === "content_plan") {
    const plan = Array.isArray(card.plan) ? card.plan.slice(0, 7) : [];
    return `<section class="agent-tool-card" data-agent-card-type="content_plan">
      <header><strong>${icon("calendar-days", 16)} ${esc(card.title || "Content plan")}</strong><span>${esc(card.summary || "")}</span></header>
      ${plan.length ? `<div class="agent-plan-table">${plan.map((item) => `<p><b>${esc(item.title || `Day ${item.day}`)}</b><span>${esc(item.hook || item.idea || "")}</span></p>`).join("")}</div>` : ""}
    </section>`;
  }
  if (card.type === "visual_card") {
    const visual = card.visualCard || {};
    const bullets = Array.isArray(visual.bullets) ? visual.bullets.slice(0, 4) : Array.isArray(card.bullets) ? card.bullets.slice(0, 4) : [];
    const sections = Array.isArray(visual.sections) ? visual.sections.slice(0, 3) : [];
    const promptContent = String(card.prompt || visual.prompt || "");
    return `<section class="agent-tool-card visual-card-tool" data-agent-card-type="visual_card">
      <header><strong>${icon("panels-top-left", 16)} ${esc(card.title || visual.title || "Visual card")}</strong><span>${esc(card.summary || visual.subtitle || "Publish-ready social card saved.")}</span></header>
      <div class="agent-visual-card-preview">
        <span>${esc(visual.eyebrow || "Pokaya Visual Card")}</span>
        <h4>${esc(visual.title || card.title || "Social selling card")}</h4>
        <p>${esc(visual.subtitle || card.summary || "")}</p>
        ${sections.length ? `<div>${sections.map((item) => `<b>${esc(item.label || "Point")}</b><small>${esc(item.text || "")}</small>`).join("")}</div>` : ""}
        ${bullets.length ? `<ul>${bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
      </div>
    </section>`;
  }
  if (card.type === "seedance_prompt") {
    const promptContent = String(card.prompt || "");
    return `<section class="agent-tool-card" data-agent-card-type="seedance_prompt">
      <header><strong>${icon("film", 16)} ${esc(card.title || "视频 prompt 已保存")}</strong><span>${esc(card.summary || "")}</span></header>
      <pre>${esc(String(card.prompt || "").slice(0, 900))}</pre>
    </section>`;
  }
  if (card.type === "workspace_inspect") {
    const schedule = card.schedule || {};
    const latest = Array.isArray(schedule.latest) ? schedule.latest.slice(0, 3) : [];
    return `<section class="agent-tool-card" data-agent-card-type="workspace_inspect">
      <header><strong>${icon("clipboard-check", 16)} ${esc(card.title || "Workspace checklist")}</strong><span>${esc(card.summary || "")}</span></header>
      <div class="agent-workspace-summary">
        ${card.projectName ? `<p><span>当前项目</span><b>${esc(card.projectName)}</b></p>` : ""}
        <p><span>剩余积分</span><b>${esc(card.credits ?? "-")}</b></p>
        <p><span>生成结果</span><b>${esc(card.resultCount ?? 0)}</b></p>
        <p><span>排期</span><b>${esc((schedule.currentProjectReady || 0) + (schedule.currentProjectDrafts || 0))}</b></p>
      </div>
      ${card.missing?.length ? `<ul>${card.missing.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>Workspace looks ready for the next Agent task.</p>`}
      ${latest.length ? `<div class="agent-mini-schedule">${latest.map((item) => `<p><b>${esc(item.title || "Untitled")}</b><span>${esc(item.time || "")}</span><em data-status="${esc(item.status || "")}">${esc(item.status || "")}</em></p>`).join("")}</div>` : ""}
    </section>`;
  }
  if (card.type === "agent_memory") {
    return `<section class="agent-tool-card" data-agent-card-type="agent_memory">
      <header><strong>${icon("brain", 16)} ${esc(card.title || "Memory updated")}</strong><span>${esc(card.summary || "")}</span></header>
    </section>`;
  }
  if (card.type === "schedule_drafts") {
    return `<section class="agent-tool-card" data-agent-card-type="schedule_drafts">
      <header><strong>${icon("send", 16)} ${esc(card.title || "Drafts created")}</strong><span>${esc(card.summary || "")}</span></header>
    </section>`;
  }
  return "";
}

function agentGenerationEntry(card = {}) {
  const job = (state.db?.generationJobs || []).find((item) => item.id === card.jobId)
    || (state.db?.generationJobs || []).find((item) => item.resultId && item.resultId === card.resultId);
  const resultId = job?.resultId || card.resultId || "";
  const result = resultId
    ? (state.db?.projects || []).flatMap((projectItem) => projectItem.results || []).find((item) => item.id === resultId)
    : null;
  const jobId = job?.id || card.jobId || "";
  const status = job?.status || (result ? "succeeded" : "queued");
  const mediaType = job?.type || card.resultType || resultMediaKind(result || {});
  return { card, job, result, jobId, status, mediaType };
}

function agentGenerationStatusStep(status = "") {
  if (status === "failed") return "failed";
  if (status === "succeeded") return "generated";
  if (status === "processing") return "processing";
  return "queued";
}

function agentGenerationStatusRail(entries = []) {
  const statuses = entries.map((entry) => agentGenerationStatusStep(entry.status));
  const order = ["queued", "processing", "generated"];
  const failed = statuses.includes("failed");
  const activeIndex = failed
    ? Math.max(order.indexOf(statuses.find((item) => item !== "failed") || "queued"), 0)
    : Math.max(...statuses.map((item) => order.indexOf(item)).filter((index) => index >= 0), 0);
  const labels = { queued: "Queued", processing: "Processing", generated: "Generated" };
  return `<div class="agent-generation-status-rail" data-agent-gallery-status="${esc(failed ? "failed" : order[activeIndex])}">
    ${order.map((key, index) => `<span data-step-status="${esc(failed && index === activeIndex ? "failed" : index < activeIndex ? "done" : index === activeIndex ? "active" : "pending")}">${index < activeIndex ? icon("check", 12) : ""}${esc(labels[key])}</span>`).join("")}
  </div>`;
}

function agentGenerationResultMeta(result) {
  if (!result) return "";
  return "";
}

function agentGenerationResultActions(result) {
  if (!result) return "";
  const canSaveReference = Boolean(result.imageUrl || result.videoUrl);
  return `<div class="studio-wall-actions agent-generation-result-actions" aria-label="Image actions">
    <button type="button" data-result-action="save-avatar" data-result-id="${esc(result.id)}" data-tooltip="Save as Avatar" aria-label="Save as Avatar" ${canSaveReference ? "" : "disabled"}>${icon("user-round-plus", 17)}</button>
    <button type="button" data-result-action="save-product" data-result-id="${esc(result.id)}" data-tooltip="Save as Product" aria-label="Save as Product" ${canSaveReference ? "" : "disabled"}>${icon("package-plus", 17)}</button>
    <button type="button" data-result-action="download" data-result-id="${esc(result.id)}" data-result-kind="${result.videoUrl ? "video" : result.imageUrl ? "image" : "text"}" data-tooltip="Download" aria-label="Download">${icon("download", 18)}</button>
    <button type="button" data-result-action="delete" data-result-id="${esc(result.id)}" data-tooltip="Delete" aria-label="Delete">${icon("trash-2", 18)}</button>
  </div>`;
}

function agentGenerationFailedActions(entry = {}) {
  if (!entry.jobId) return "";
  return `<div class="agent-generation-failed-actions">
    <button type="button" data-generation-retry="${esc(entry.jobId)}">${icon("refresh-cw", 14)} Retry</button>
    <button type="button" data-generation-edit="${esc(entry.jobId)}">${icon("pencil-line", 14)} Edit prompt</button>
  </div>`;
}

function agentGenerationPendingFrame(entry = {}, options = {}) {
  const { job, jobId, status, mediaType, card } = entry;
  const isFailed = status === "failed";
  const aspectRatioRaw = String(job?.aspectRatio || card?.aspectRatio || project().image?.aspectRatio || "");
  const aspectRatio = aspectRatioRaw.includes("16:9") ? "16:9" : aspectRatioRaw.includes("1:1") ? "1:1" : "9:16";
  const aspectStyle = aspectRatio === "16:9" ? "16 / 9" : aspectRatio === "1:1" ? "1 / 1" : "9 / 16";
  const summary = isFailed
    ? (job?.errorMessage || "生成失败，请调整 prompt 后再试一次。")
    : status === "processing" ? "模型正在生成，完成后会自动出现在这里。" : "任务已加入队列，马上开始生成。";
  return `<div class="agent-generation-pending agent-generation-processing-frame ${options.compact ? "is-compact" : ""}" ${jobId ? `data-generation-job-id="${esc(jobId)}"` : ""} data-agent-job-status="${esc(status)}" data-agent-ratio="${esc(aspectRatio)}" style="aspect-ratio:${esc(aspectStyle)}">
    ${icon(isFailed ? "triangle-alert" : "loader-circle", 28)}
    <strong>${esc(isFailed ? "Failed" : status === "processing" ? "Processing" : "Queued")}</strong>
    <span>${esc(summary)}</span>
    ${isFailed ? `<p class="agent-generation-refund-note">${icon("rotate-ccw", 13)} Credit refunded</p>${agentGenerationFailedActions(entry)}` : ""}
  </div>`;
}

function agentGenerationGalleryCard(cards = []) {
  const entries = cards.map(agentGenerationEntry);
  const done = entries.filter((entry) => entry.status === "succeeded" && entry.result);
  const failed = entries.filter((entry) => entry.status === "failed");
  const running = entries.filter((entry) => !["succeeded", "failed"].includes(entry.status));
  const first = entries[0] || {};
  const mediaType = first.mediaType || "image";
  const title = failed.length
    ? `${failed.length} generation failed`
    : done.length
      ? `${done.length} ${done.length === 1 ? "image" : "images"} generated`
      : mediaType === "video" ? "视频生成中" : "图片生成中";
  const summary = failed.length
    ? "Some queued tasks failed. Credits were refunded for failed images."
    : done.length === entries.length
      ? "结果已保存在当前项目，点击任意图片可进入详情。"
      : "任务正在后台处理，你可以继续输入下一个 prompt。";
  const resultTiles = done.map((entry, index) => `<article class="agent-generation-gallery-tile ${agentGenerationResultOrientationClass(entry.result)}" data-result-id="${esc(entry.result.id)}">
    ${resultPreview(entry.result, { clickable: true, full: mediaType === "video", priority: done.length <= 2 })}
    ${agentGenerationResultActions(entry.result)}
    ${done.length > 1 ? `<span class="agent-generation-tile-count">${esc(index + 1)}/${esc(done.length)}</span>` : ""}
  </article>`).join("");
  const pendingTiles = [...running, ...failed].map((entry) => agentGenerationPendingFrame(entry, { compact: done.length > 0 })).join("");
  return `<section class="agent-tool-card agent-generation-card agent-generation-gallery-card" data-agent-card-type="generation_job" data-agent-job-status="${esc(failed.length ? "failed" : running.length ? "processing" : "succeeded")}">
    <header><strong>${icon(mediaType === "video" ? "video" : "image", 16)} ${esc(title)}</strong><span>${esc(summary)}</span></header>
    ${agentGenerationStatusRail(entries)}
    ${done.length ? `<div class="agent-generation-gallery-grid" data-gallery-count="${esc(done.length)}">${resultTiles}</div>` : ""}
    ${pendingTiles ? `<div class="agent-generation-pending-list">${pendingTiles}</div>` : ""}
  </section>`;
}

function agentGenerationJobCard(card = {}) {
  const entry = agentGenerationEntry(card);
  const { job, result, jobId, status, mediaType } = entry;
  const isDone = status === "succeeded" && result;
  const isFailed = status === "failed";
  const title = isDone
    ? mediaType === "video" ? "视频已生成" : mediaType === "image" ? "图片已生成" : "内容已生成"
    : isFailed
      ? "生成失败"
      : mediaType === "video" ? "视频生成中" : mediaType === "image" ? "图片生成中" : "生成中";
  const summary = isDone
    ? "结果已保存在当前项目，点击图片可查看详情资料。"
    : isFailed
      ? `${job?.errorMessage || "生成失败，请调整 prompt 后再试一次。"} Credit refunded.`
      : status === "processing" ? "模型正在生成，完成后会自动出现在这里。" : "任务已加入队列，马上开始生成。";
  const preview = isDone && result
    ? `<div class="agent-generation-preview agent-generation-result-preview ${agentGenerationResultOrientationClass(result)}" data-result-id="${esc(result.id)}">
        ${resultPreview(result, { clickable: true, full: mediaType === "video" })}
        ${agentGenerationResultActions(result)}
      </div>`
    : agentGenerationPendingFrame(entry);
  return `<section class="agent-tool-card agent-generation-card" data-agent-card-type="generation_job" ${jobId ? `data-generation-job-id="${esc(jobId)}"` : ""} data-agent-job-status="${esc(status)}">
    <header><strong>${icon(mediaType === "video" ? "video" : mediaType === "image" ? "image" : "sparkles", 16)} ${esc(title)}</strong><span>${esc(summary)}</span></header>
    ${agentGenerationStatusRail([entry])}
    ${preview}
  </section>`;
}

function agentGenerationResultOrientationClass(result) {
  const ratio = Number(resultMediaRatio(result));
  if (!Number.isFinite(ratio) || ratio <= 0) return "";
  if (ratio < 0.8) return "is-portrait";
  if (ratio > 1.25) return "is-landscape";
  return "is-square";
}

function agentRecoveryCard(run) {
  const recovery = run?.recovery;
  if (!recovery) return "";
  return `<section class="agent-recovery-card">
    <strong>${icon("life-buoy", 16)} Recovery</strong>
    <p>${esc(recovery.reason || "Agent action needs recovery.")}</p>
    <div>${(recovery.actions || []).map((item) => item.agentPrompt
      ? `<button class="dark-button" data-agent-prompt="${esc(item.agentPrompt)}">${esc(item.label || "Try")}</button>`
      : `<button class="dark-button" data-page="${esc(item.uiAction?.page || "agent")}">${esc(item.label || "Open")}</button>`).join("")}</div>
  </section>`;
}

function agentUndoCard(run) {
  const canUndo = run?.status === "completed" && !run.undoedAt && (run.diffs || []).some((item) => item.undoable);
  if (!canUndo) return "";
  return `<div class="agent-undo-card"><span>${icon("undo-2", 15)} This run has undoable workspace changes.</span><button class="dark-button" data-agent-undo="${esc(run.id)}">${icon("rotate-ccw", 15)} Undo</button></div>`;
}

function agentRunById(runId = "") {
  return state.agentMessages.find((item) => item.agentRun?.id === runId)?.agentRun || null;
}

function openAgentConfirmModal(runId = "") {
  const run = agentRunById(runId);
  if (!run?.confirmation || run.status !== "waiting_confirmation") return;
  set({ modal: "agentConfirm", activeAgentRunId: runId });
}

function agentConfirmModal() {
  const run = agentRunById(state.activeAgentRunId);
  const confirmation = run?.confirmation || {};
  if (!run || run.status !== "waiting_confirmation" || !confirmation.token) {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal agent-confirm-modal"><button class="icon-only close" data-action="close-modal">${icon("x")}</button><h2>确认已失效</h2><p>这个生成确认已经过期或被取消。</p><button class="gold-button" data-action="close-modal">${icon("check", 16)} 知道了</button></section></div>`;
  }
  const credits = Number(confirmation.creditsRequired || 0);
  const balance = Number(confirmation.creditBalance || 0);
  const remaining = credits ? Math.max(0, Math.round((balance - credits) * 100) / 100) : null;
  const model = confirmation.args?.model || "";
  const actionLabel = confirmation.toolName === "generate_project_output" ? "生成内容" : confirmation.toolName === "publish_tiktok_video" ? "发布到 TikTok" : "执行动作";
  return `<div class="modal-backdrop" data-action="close-modal">
    <section class="modal agent-confirm-modal" role="dialog" aria-modal="true" aria-label="Agent confirmation">
      <button class="icon-only close" data-action="close-modal">${icon("x")}</button>
      <p class="folder-label">${icon("shield-check", 18)} Agent 确认</p>
      <h2>${esc(confirmation.title || "确认执行")}</h2>
      <p class="agent-confirm-modal-copy">${esc(confirmation.message || "确认后才会执行。")}</p>
      <div class="agent-confirm-modal-grid">
        <p><span>动作</span><b>${esc(actionLabel)}</b></p>
        ${model ? `<p><span>模型</span><b>${esc(model)}</b></p>` : ""}
        <p><span>预计消耗</span><b>${credits ? `${esc(credits)} credits` : "不扣 credits"}</b></p>
        ${credits ? `<p><span>当前余额</span><b>${esc(balance)} credits</b></p><p><span>确认后剩余</span><b>${esc(remaining)} credits</b></p>` : ""}
      </div>
      <div class="agent-confirm-modal-actions">
        <button class="dark-button" data-action="clear-agent-confirm">${icon("x", 16)} 取消这次生成</button>
        <button class="gold-button" data-action="confirm-agent-modal">${icon("check", 16)} ${credits ? `确认生成，扣 ${esc(credits)} credits` : "确认执行"}</button>
      </div>
    </section>
  </div>`;
}

function agentConfirmationCard(run) {
  const confirmation = run?.confirmation;
  if (!confirmation || run.status !== "waiting_confirmation") return "";
  const credits = Number(confirmation.creditsRequired || 0);
  return `
    <div class="agent-confirm-card">
      <strong>${icon("shield-check", 18)} ${esc(confirmation.title || "需要确认")}</strong>
      <p>${esc(confirmation.message || "确认后才会执行。")}</p>
      <small>${esc(confirmation.impact || "工作区动作")}</small>
      <div>
        <button class="gold-button" data-agent-confirm="${esc(run.id)}" data-agent-token="${esc(confirmation.token || "")}" ${state.agentBusy ? "disabled" : ""}>${icon("shield-check", 16)} ${credits ? `确认生成，扣 ${esc(credits)} credits` : "确认执行"}</button>
        <button class="dark-button" data-action="clear-agent-confirm">${icon("x", 16)} 取消</button>
      </div>
    </div>`;
}

function bind() {
  document.querySelectorAll("[data-sop-target]").forEach((el) => el.addEventListener("click", () => {
    const sopTopic = el.dataset.sopTarget || "dashboard";
    if (el.dataset.sopModal === "true") return set({ sopTopic, modal: "sop" });
    set({ page: "sop", sopTopic, sopSearch: "", sopStepAnchor: "", modal: null });
  }));
  document.querySelectorAll("[data-affiliate-tab]").forEach((el) => el.addEventListener("click", () => set({ affiliateTab: el.dataset.affiliateTab })));
  document.querySelectorAll("[data-wizard-feature]").forEach((el) => el.addEventListener("click", () => {
    const patch = { wizardFeature: el.dataset.wizardFeature };
    if (el.dataset.wizardAuto === "true") patch.wizardStep = 2;
    set(patch);
  }));
  document.querySelectorAll("[data-wizard-jump]").forEach((el) => el.addEventListener("click", () => {
    const step = Number(el.dataset.wizardJump);
    if (step < state.wizardStep) set({ wizardStep: step });
  }));
  document.querySelectorAll("[data-wizard-field]").forEach((el) => el.addEventListener("input", () => {
    state[el.dataset.wizardField] = el.value;
  }));
  document.querySelectorAll("[data-wizard-field]").forEach((el) => el.addEventListener("change", () => {
    state[el.dataset.wizardField] = el.value;
  }));
  document.querySelectorAll("[data-project-menu]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    set({ projectMenuId: state.projectMenuId === el.dataset.projectMenu ? null : el.dataset.projectMenu });
  }));
  document.querySelectorAll("[data-project-rename]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    set({ modal: "renameProject", editingProjectId: el.dataset.projectRename, projectMenuId: null });
  }));
  document.querySelectorAll("[data-project-delete]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    set({ modal: "deleteProject", editingProjectId: el.dataset.projectDelete, projectMenuId: null });
  }));
  document.querySelectorAll("[data-agent-history-restore]").forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    restoreAgentHistory(el.dataset.agentHistoryRestore);
  }));
  document.querySelectorAll("[data-agent-history-restore-row]").forEach((el) => el.addEventListener("click", (event) => {
    if (event.target.closest("[data-agent-history-rename], [data-agent-history-delete], [data-agent-history-title-input]")) return;
    event.preventDefault();
    event.stopPropagation();
    restoreAgentHistory(el.dataset.agentHistoryRestoreRow);
  }));
  document.querySelectorAll("[data-agent-history-rename]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    set({ agentHistoryEditingId: el.dataset.agentHistoryRename });
  }));
  document.querySelectorAll("[data-agent-history-delete]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteAgentHistory(el.dataset.agentHistoryDelete);
  }));
  document.querySelectorAll("[data-agent-history-title-input]").forEach((el) => {
    el.addEventListener("click", (event) => event.stopPropagation());
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        renameAgentHistory(el.dataset.agentHistoryTitleId, el.value);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        el.dataset.agentHistorySkipRename = "true";
        set({ agentHistoryEditingId: null });
      }
    });
    el.addEventListener("blur", () => {
      if (el.dataset.agentHistorySkipRename === "true") return;
      renameAgentHistory(el.dataset.agentHistoryTitleId, el.value, { quiet: true });
    });
    requestAnimationFrame(() => {
      el.focus();
      el.select();
    });
  });
  document.querySelectorAll("[data-agent-history-search]").forEach((el) => el.addEventListener("input", (event) => {
    const query = String(event.currentTarget.value || "").trim().toLowerCase();
    const root = event.currentTarget.closest(".agent-session-sidebar");
    root?.querySelectorAll("[data-agent-history-row]").forEach((row) => {
      const text = row.dataset.agentHistoryText || "";
      row.hidden = Boolean(query && !text.includes(query));
    });
  }));
  bindAgentControls();
  document.querySelectorAll("[data-admin-user]").forEach((el) => el.addEventListener("click", () => set({ adminUserId: el.dataset.adminUser })));
  document.querySelectorAll("[data-admin-search]").forEach((el) => el.addEventListener("input", (event) => {
    state.adminSearch = event.target.value;
    state.adminUserId = null;
    clearTimeout(adminSearchTimer);
    adminSearchTimer = setTimeout(render, 160);
  }));
  document.querySelectorAll("[data-admin-status-filter]").forEach((el) => el.addEventListener("change", () => set({ adminStatusFilter: el.value, adminUserId: null })));
  document.querySelectorAll("[data-admin-sort]").forEach((el) => el.addEventListener("change", () => set({ adminSort: el.value })));
  document.querySelectorAll("[data-admin-filter]").forEach((el) => el.addEventListener("click", () => set({ adminStatusFilter: el.dataset.adminFilter || "all", adminUserId: null })));
  document.querySelectorAll("[data-admin-toggle-ops]").forEach((el) => el.addEventListener("click", () => set({ adminOpsOpen: !state.adminOpsOpen })));
  document.querySelectorAll("[data-admin-credit]").forEach((el) => el.addEventListener("click", () => adminAdjustCredits(el.dataset.adminCredit, Number(el.dataset.delta))));
  document.querySelectorAll("[data-admin-clean-payment]").forEach((el) => el.addEventListener("click", () => adminCleanupPayment(el.dataset.adminCleanPayment)));
  document.querySelectorAll("[data-admin-status]").forEach((el) => el.addEventListener("click", () => adminUpdateUser(el.dataset.adminStatus, { status: el.dataset.status })));
  document.querySelectorAll("[data-agent-permission]").forEach((el) => el.addEventListener("click", () => adminUpdateUser(el.dataset.agentPermission, { agentPermissions: { [el.dataset.permission]: el.dataset.enabled === "true" } })));
  document.querySelectorAll("[data-agent-fill]").forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    fillAgentInput(el.dataset.agentFill || "");
  }));
  document.querySelectorAll("[data-agent-prompt]").forEach((el) => el.addEventListener("click", () => {
    const card = el.closest("[data-agent-card-type]");
    const run = el.closest("[data-agent-run-id]");
    recordAgentFeedback({
      agentRunId: run?.dataset.agentRunId || "",
      eventType: "tool_card_clicked",
      targetType: card?.dataset.agentCardType || "agent_prompt",
      targetId: card?.dataset.agentTrendName || el.dataset.agentPrompt || "",
      sourceTool: card?.dataset.agentCardType || "",
      metadata: {
        action: el.dataset.agentPrompt,
        trendName: card?.dataset.agentTrendName || "",
        category: card?.dataset.agentCardType || ""
      }
    });
    sendAgentMessage(el.dataset.agentPrompt);
  }));
  document.querySelectorAll("[data-agent-feedback]").forEach((el) => el.addEventListener("click", () => {
    recordAgentFeedback({
      agentRunId: el.dataset.agentRunId || "",
      eventType: el.dataset.agentFeedback,
      targetType: "agent_reply",
      targetId: el.dataset.agentRunId || "",
      metadata: { action: el.dataset.agentFeedback }
    });
    notify(el.dataset.agentFeedback === "positive_feedback" ? "已记录：这个回复有用。" : "已记录：我会少走这个方向。");
  }));
  document.querySelectorAll("[data-agent-template-save]").forEach((el) => el.addEventListener("click", () => saveAgentTemplate(el)));
  document.querySelectorAll("[data-agent-template-use]").forEach((el) => el.addEventListener("click", () => useAgentTemplate(el.dataset.agentTemplateUse)));
  document.querySelectorAll("[data-agent-template-delete]").forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    deleteAgentTemplate(el.dataset.agentTemplateDelete);
  }));
  document.querySelectorAll("[data-agent-confirm]").forEach((el) => el.addEventListener("click", () => confirmAgentAction(el.dataset.agentConfirm, el.dataset.agentToken)));
  document.querySelectorAll("[data-agent-undo]").forEach((el) => el.addEventListener("click", () => {
    recordAgentFeedback({ agentRunId: el.dataset.agentUndo, eventType: "agent_run_undone", targetType: "agent_run", targetId: el.dataset.agentUndo, metadata: { action: "undo" } });
    undoAgentRun(el.dataset.agentUndo);
  }));
  document.querySelectorAll("[data-date-field]").forEach((el) => el.addEventListener("change", () => set({ [el.dataset.dateField]: el.value })));
  document.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", (e) => action(e, el.dataset.action)));
  document.querySelectorAll("[data-studio-wall-zoom]").forEach((el) => el.addEventListener("input", () => updateStudioWallZoom(el.value)));
  bindAspectRatioFloatingMenus();
  bindProjectFieldSetControls();
  document.querySelectorAll("[data-field]").forEach((el) => el.addEventListener("change", fieldChange));
  document.querySelectorAll("[data-ugc-builder-option]").forEach((el) => el.addEventListener("click", () => updateUgcBuilderOption(el)));
  document.querySelectorAll("[data-ugc-builder-field]").forEach((el) => el.addEventListener("click", () => updateUgcBuilderField(el.dataset.ugcBuilderField, el.dataset.ugcBuilderValue, true)));
  document.querySelectorAll("[data-ugc-builder-input]").forEach((el) => el.addEventListener("input", () => updateUgcBuilderField(el.dataset.ugcBuilderInput, el.value, false)));
  document.querySelectorAll("[data-ugc-builder-input]").forEach((el) => el.addEventListener("change", () => updateUgcBuilderField(el.dataset.ugcBuilderInput, el.value, true)));
  document.querySelectorAll("[data-auto-framework-card]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      toggleAutoFramework(el.dataset.autoFrameworkCard, el);
    });
    el.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      toggleAutoFramework(el.dataset.autoFrameworkCard, el);
    });
  });
  document.querySelectorAll("[data-upload]").forEach((el) => el.addEventListener("change", uploadChange));
  bindAgentInput();
  document.querySelectorAll("[data-image-console-prompt-zone]").forEach((el) => el.addEventListener("paste", handleImagePromptPaste));
  document.querySelectorAll("[data-prompt-group]").forEach((el) => el.addEventListener("click", () => set({ imagePromptGroup: el.dataset.promptGroup })));
  document.querySelectorAll("[data-image-preset]").forEach((el) => el.addEventListener("click", () => applyImagePreset(el.dataset.imagePreset)));
  document.querySelectorAll("[data-topup-select]").forEach((el) => el.addEventListener("click", () => set({ topupAmount: Number(el.dataset.topupSelect) })));
  document.querySelectorAll("[data-usage-filter]").forEach((el) => el.addEventListener("click", () => set({ usageFilter: el.dataset.usageFilter })));
  document.querySelectorAll("[data-topup]").forEach((el) => el.addEventListener("click", () => topup(Number(el.dataset.topup))));
  document.querySelectorAll("[data-schedule]").forEach((el) => el.addEventListener("click", () => scheduleUpdate(el.dataset.schedule)));
  document.querySelectorAll("[data-autopost-edit]").forEach((el) => el.addEventListener("click", () => editAutopostJob(el.dataset.autopostEdit)));
  document.querySelectorAll("[data-autopost-status]").forEach((el) => el.addEventListener("click", () => setAutopostStatus(el.dataset.autopostStatus, el.dataset.status)));
  document.querySelectorAll("[data-autopost-delete]").forEach((el) => el.addEventListener("click", () => deleteAutopostJob(el.dataset.autopostDelete)));
  document.querySelectorAll("[data-tiktok-publish]").forEach((el) => el.addEventListener("click", () => tiktokPublish(el.dataset.tiktokPublish)));
  document.querySelectorAll("[data-tiktok-status]").forEach((el) => el.addEventListener("click", () => tiktokStatus(el.dataset.tiktokStatus)));
  document.querySelectorAll("[data-invoice]").forEach((el) => el.addEventListener("click", () => download(`/api/export/invoice/${el.dataset.invoice}`, `${el.dataset.invoice}.txt`)));
  document.querySelectorAll("[data-result]").forEach((el) => el.addEventListener("click", () => download(`/api/export/result/${el.dataset.result}`, `pokaya-result.txt`)));
  document.querySelectorAll("[data-video-play]").forEach((el) => el.addEventListener("click", () => playResultVideo(el)));
  document.querySelectorAll("[data-image-console-prompt]").forEach((el) => {
    updateImagePromptEditorRows(el);
    el.addEventListener("input", () => {
      updateImagePromptLocal(el.value);
      updateImagePromptEditorRows(el);
    });
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey) || event.shiftKey || event.altKey || event.isComposing) return;
      event.preventDefault();
      generate("generate-image", event);
    });
  });
  document.querySelectorAll("[data-video-console-prompt]").forEach((el) => {
    updateVideoPromptEditorRows(el);
    el.addEventListener("input", () => {
      updateVideoPromptLocal(el.value);
      updateVideoPromptEditorRows(el);
    });
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey) || event.shiftKey || event.altKey || event.isComposing) return;
      event.preventDefault();
      generate("generate-ugc", event);
    });
  });
  document.querySelectorAll("[data-audio-prompt]").forEach((el) => {
    updateAudioPromptEditorRows(el);
    el.addEventListener("input", () => {
      updateAudioPromptLocal(el.value);
      updateAudioPromptEditorRows(el);
    });
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey) || event.shiftKey || event.altKey || event.isComposing) return;
      event.preventDefault();
      audioGeneratePlaceholder();
    });
  });
  document.querySelectorAll("[data-result-title]").forEach((el) => {
    el.addEventListener("input", () => {
      if (state.resultTitleSavedId === el.dataset.resultTitle) set({ resultTitleSavedId: null });
    });
    el.addEventListener("change", () => renameResultInline(el));
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      renameResultInline(el);
    });
  });
  document.querySelectorAll("[data-result-title-save]").forEach((el) => {
    el.addEventListener("click", () => renameResultInline(el.closest(".result-title-editor")?.querySelector("[data-result-title]")));
  });
  document.querySelectorAll("[data-asset-type]").forEach((el) => el.addEventListener("click", () => set({ assetTypeFilter: el.dataset.assetType })));
  document.querySelectorAll("[data-asset-project]").forEach((el) => el.addEventListener("click", () => set({ assetProjectFilter: el.dataset.assetProject })));
  document.querySelectorAll("[data-asset-search]").forEach((el) => el.addEventListener("input", (event) => {
    state.assetSearch = event.target.value;
    clearTimeout(assetSearchTimer);
    assetSearchTimer = setTimeout(render, 180);
  }));
  document.querySelectorAll("[data-sop-search]").forEach((el) => el.addEventListener("input", (event) => {
    state.sopSearch = event.target.value;
    clearTimeout(sopSearchTimer);
    sopSearchTimer = setTimeout(render, 180);
  }));
  document.querySelectorAll("[data-sop-result-topic]").forEach((el) => el.addEventListener("click", () => {
    const topic = el.dataset.sopResultTopic || "dashboard";
    const step = el.dataset.sopResultStep || "";
    set({ sopTopic: topic, sopSearch: "", sopStepAnchor: step ? `${topic}-${step}` : "" });
  }));
  document.querySelectorAll("[data-sop-step-jump]").forEach((el) => el.addEventListener("click", () => {
    set({ sopStepAnchor: el.dataset.sopStepJump || "" });
  }));
  document.querySelectorAll("[data-sop-progress]").forEach((el) => el.addEventListener("change", () => {
    const topic = el.dataset.sopProgress;
    const key = el.dataset.sopProgressKey;
    if (!topic || !key) return;
    const next = { ...(state.sopProgress || {}), [topic]: { ...(state.sopProgress?.[topic] || {}), [key]: el.checked } };
    localStorage.setItem("pokaya-sop-progress", JSON.stringify(next));
    set({ sopProgress: next });
  }));
  document.querySelectorAll("[data-sop-next]").forEach((el) => el.addEventListener("click", () => {
    const item = sopLibrary().find((entry) => entry.id === el.dataset.sopNext);
    if (!item) return;
    if (item.nextAction) return action({ currentTarget: el, target: el }, item.nextAction);
    if (item.nextStep) return set({ page: "project", step: item.nextStep, modal: null });
    if (item.nextPage) return set({ page: item.nextPage, modal: null });
  }));
  document.querySelectorAll("[data-attachment-filter]").forEach((el) => el.addEventListener("click", () => set({ attachmentPickerFilter: el.dataset.attachmentFilter || "all" })));
  document.querySelectorAll("[data-attachment-pick]").forEach((el) => el.addEventListener("click", () => pickAttachment(el.dataset.attachmentPick, el.dataset.attachmentTarget)));
  document.querySelectorAll("[data-drop-upload]").forEach((el) => bindAttachmentDropZone(el));
  document.querySelectorAll("form:not(.agent-form)").forEach((el) => el.addEventListener("submit", submit));
  document.querySelectorAll("[data-lang-toggle]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    set({ langOpen: !state.langOpen });
  }));
  document.querySelectorAll("[data-lang]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    localStorage.setItem(storageKeys.lang, el.dataset.lang);
    set({ lang: el.dataset.lang, langOpen: false });
  }));
  document.addEventListener("click", closeLangMenu, { once: true });
}

function bindAgentControls() {
  bindAgentInput();
  document.querySelectorAll("[data-agent-file]").forEach((el) => el.addEventListener("change", (event) => {
    addAgentAttachments(event.target.files);
    event.target.value = "";
  }));
  document.querySelectorAll("[data-agent-remove-attachment]").forEach((el) => el.addEventListener("click", () => removeAgentAttachment(el.dataset.agentRemoveAttachment)));
  document.querySelectorAll(".agent-form").forEach((el) => {
    el.addEventListener("submit", submit);
    el.addEventListener("dragover", (event) => {
      const items = Array.from(event.dataTransfer?.items || []);
      if (!items.some((item) => item.kind === "file")) return;
      event.preventDefault();
      el.classList.add("is-dragging");
    });
    el.addEventListener("dragleave", () => el.classList.remove("is-dragging"));
    el.addEventListener("drop", (event) => {
      const files = event.dataTransfer?.files;
      if (!files?.length) return;
      event.preventDefault();
      el.classList.remove("is-dragging");
      addAgentAttachments(files);
    });
  });
}

function bindAgentInput() {
  const agentInput = document.querySelector("[data-agent-input]");
  autoResizeAgentInput(agentInput);
  agentInput?.addEventListener("compositionstart", (event) => {
    state.agentInputComposing = true;
    event.currentTarget.dataset.composing = "true";
  });
  agentInput?.addEventListener("compositionend", (event) => {
    state.agentInputComposing = false;
    delete event.currentTarget.dataset.composing;
    state.agentInput = event.currentTarget.value;
    autoResizeAgentInput(event.currentTarget);
    if (state.agentRenderAfterComposition) {
      state.agentRenderAfterComposition = false;
      render();
      restoreAgentInputFocus({
        value: state.agentInput,
        start: event.currentTarget.selectionStart,
        end: event.currentTarget.selectionEnd,
        composing: false
      });
    }
  });
  agentInput?.addEventListener("input", (e) => {
    state.agentInput = e.target.value;
    autoResizeAgentInput(e.target);
  });
  agentInput?.addEventListener("paste", handleAgentInputPaste);
  agentInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey || event.isComposing || state.agentInputComposing || event.keyCode === 229) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  });
}

function bindAgentThreadControls(root = document) {
  root.querySelectorAll("[data-agent-prompt]").forEach((el) => el.addEventListener("click", () => {
    const card = el.closest("[data-agent-card-type]");
    const run = el.closest("[data-agent-run-id]");
    recordAgentFeedback({
      agentRunId: run?.dataset.agentRunId || "",
      eventType: "tool_card_clicked",
      targetType: card?.dataset.agentCardType || "agent_prompt",
      targetId: card?.dataset.agentTrendName || el.dataset.agentPrompt || "",
      sourceTool: card?.dataset.agentCardType || "",
      metadata: {
        action: el.dataset.agentPrompt,
        trendName: card?.dataset.agentTrendName || "",
        category: card?.dataset.agentCardType || ""
      }
    });
    sendAgentMessage(el.dataset.agentPrompt);
  }));
  root.querySelectorAll("[data-agent-feedback]").forEach((el) => el.addEventListener("click", () => {
    recordAgentFeedback({
      agentRunId: el.dataset.agentRunId || "",
      eventType: el.dataset.agentFeedback,
      targetType: "agent_reply",
      targetId: el.dataset.agentRunId || "",
      metadata: { action: el.dataset.agentFeedback }
    });
    notify(el.dataset.agentFeedback === "positive_feedback" ? "已记录：这个回复有用。" : "已记录：我会少走这个方向。");
  }));
  root.querySelectorAll("[data-agent-template-save]").forEach((el) => el.addEventListener("click", () => saveAgentTemplate(el)));
  root.querySelectorAll("[data-agent-template-use]").forEach((el) => el.addEventListener("click", () => useAgentTemplate(el.dataset.agentTemplateUse)));
  root.querySelectorAll("[data-agent-template-delete]").forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    deleteAgentTemplate(el.dataset.agentTemplateDelete);
  }));
  root.querySelectorAll("[data-agent-confirm]").forEach((el) => el.addEventListener("click", () => confirmAgentAction(el.dataset.agentConfirm, el.dataset.agentToken)));
  root.querySelectorAll("[data-agent-undo]").forEach((el) => el.addEventListener("click", () => {
    recordAgentFeedback({ agentRunId: el.dataset.agentUndo, eventType: "agent_run_undone", targetType: "agent_run", targetId: el.dataset.agentUndo, metadata: { action: "undo" } });
    undoAgentRun(el.dataset.agentUndo);
  }));
  root.querySelectorAll("[data-date-field]").forEach((el) => el.addEventListener("change", () => set({ [el.dataset.dateField]: el.value })));
}

function autoResizeAgentInput(input) {
  if (!input) return;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 116)}px`;
}

function fillAgentInput(value = "") {
  state.agentInput = value;
  const input = document.querySelector("[data-agent-input]");
  if (!input) return;
  input.value = value;
  autoResizeAgentInput(input);
}

function updateImagePromptLocal(value = "") {
  if (!state.projectId || !state.db) return;
  state.db = dbWithProjectField(state.db, state.projectId, "image.prompt", value);
  syncImagePromptDensityClass(value);
  document.querySelectorAll(".image-console-compact-summary").forEach((el) => {
    el.textContent = imageCompactPromptText(value);
  });
}

function updateVideoPromptLocal(value = "") {
  if (!state.projectId || !state.db) return;
  state.db = dbWithProjectField(state.db, state.projectId, "ugc.script", value);
  syncVideoPromptDensityClass(value);
}

function imageCompactPromptText(value = null) {
  const liveValue = document.querySelector("[data-image-console-prompt]")?.value;
  const text = String(value ?? liveValue ?? project()?.image?.prompt ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text || "Describe your image";
}

function syncImagePromptDensityClass(value = project()?.image?.prompt || "") {
  const promptText = String(value || "");
  const isLong = promptText.length > 120 || promptText.includes("\n");
  document.querySelectorAll(".image-generate-console").forEach((el) => {
    el.classList.toggle("has-long-prompt", isLong);
  });
  requestAnimationFrame(() => {
    document.querySelectorAll("[data-image-console-prompt]").forEach((el) => updateImagePromptEditorRows(el));
  });
}

function syncVideoPromptDensityClass(value = project()?.ugc?.script || "") {
  const promptText = String(value || "");
  const isLong = promptText.length > 120 || promptText.includes("\n");
  document.querySelectorAll(".video-generate-console").forEach((el) => {
    el.classList.toggle("has-long-prompt", isLong);
  });
  requestAnimationFrame(() => {
    document.querySelectorAll("[data-video-console-prompt]").forEach((el) => updateVideoPromptEditorRows(el));
  });
}

function updateImagePromptEditorRows(input) {
  updatePromptEditorRows(input, ".image-generate-console");
}

function updateVideoPromptEditorRows(input) {
  updatePromptEditorRows(input, ".video-generate-console");
}

function updatePromptEditorRows(input, consoleSelector = ".image-generate-console") {
  const consoleEl = input?.closest?.(consoleSelector);
  if (!input || !consoleEl) return;
  const styles = window.getComputedStyle(input);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const mirror = document.createElement("div");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.zIndex = "-1";
  mirror.style.boxSizing = styles.boxSizing;
  mirror.style.width = `${Math.max(1, input.clientWidth)}px`;
  mirror.style.font = styles.font;
  mirror.style.letterSpacing = styles.letterSpacing;
  mirror.style.lineHeight = styles.lineHeight;
  mirror.style.padding = `${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`;
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordBreak = "normal";
  mirror.style.overflowWrap = "break-word";
  mirror.textContent = input.value || " ";
  document.body.appendChild(mirror);
  const contentHeight = Math.max(0, mirror.scrollHeight - paddingTop - paddingBottom);
  mirror.remove();
  const rawRows = Math.max(1, Math.ceil(contentHeight / lineHeight));
  const visibleRows = Math.max(1, Math.min(6, rawRows));
  consoleEl.style.setProperty("--image-prompt-lines", String(visibleRows));
  consoleEl.style.setProperty("--video-prompt-lines", String(visibleRows));
  consoleEl.classList.toggle("has-long-prompt", rawRows > 1);
  consoleEl.classList.toggle("has-scroll-prompt", rawRows > 6);
}

function fillImagePrompt(value = "") {
  const promptText = String(value || "").trim();
  if (!promptText) return;
  updateImagePromptLocal(promptText);
  const input = document.querySelector("[data-image-console-prompt]");
  if (input) {
    input.value = promptText;
    input.focus({ preventScroll: true });
    input.setSelectionRange(promptText.length, promptText.length);
    syncImagePromptDensityClass(promptText);
    updateImagePromptEditorRows(input);
  } else if (state.projectId && state.db) {
    set({ db: dbWithProjectField(state.db, state.projectId, "image.prompt", promptText) });
  }
}

function generationJobById(jobId = "") {
  return [...(state.optimisticGenerationJobs || []), ...(state.db?.generationJobs || [])]
    .find((job) => job.id === jobId);
}

async function retryGenerationJob(jobId = "") {
  const job = generationJobById(jobId);
  const promptText = job?.promptSnapshot || job?.prompt || project()?.image?.prompt || "";
  fillImagePrompt(promptText);
  notify("Retrying generation...");
  await generate("generate-image");
}

function editGenerationJobPrompt(jobId = "") {
  const job = generationJobById(jobId);
  const promptText = job?.promptSnapshot || job?.prompt || "";
  fillImagePrompt(promptText);
  document.querySelector("[data-image-console-prompt]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  notify("Prompt loaded. Adjust it, then generate again.");
}

function togglePromptAdvanced() {
  if (state.promptAdvancedBusy) return;
  const enabled = !state.promptAdvancedEnabled;
  state.promptAdvancedEnabled = enabled;
  document.querySelectorAll('[data-action="toggle-prompt-advanced"]').forEach((button) => {
    button.classList.toggle("is-active", enabled);
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
  });
}

function updateStudioWallZoom(value) {
  const zoom = Math.max(studioWallZoomMin, Math.min(studioWallZoomMax, Math.round(Number(value) || studioWallZoomMin)));
  state.studioWallZoom = zoom;
  localStorage.setItem(storageKeys.studioWallZoom, String(zoom));
  const column = `${studioWallZoomColumn(zoom)}px`;
  document.querySelectorAll(".studio-wall-zoomable").forEach((el) => {
    el.style.setProperty("--studio-wall-column", column);
    el.dataset.studioWallZoomLevel = String(zoom);
  });
  document.querySelectorAll("[data-studio-wall-zoom]").forEach((el) => {
    if (Number(el.value) !== zoom) el.value = zoom;
    el.closest(".studio-wall-zoom-control")?.style.setProperty("--studio-wall-zoom-progress", `${((zoom - studioWallZoomMin) / (studioWallZoomMax - studioWallZoomMin)) * 100}%`);
  });
}

function closeLangMenu(event) {
  if (!state.langOpen || event.target.closest(".lang-menu")) return;
  set({ langOpen: false });
}

async function action(event, name) {
  if (name === "close-modal" && event.target !== event.currentTarget && event.currentTarget.classList.contains("modal-backdrop")) return;
  if (name === "close-modal") return set({ modal: null, activeResultId: null, activeAgentRunId: null, editImageBusy: false, bulkDeleteBusy: false });
  if (name === "new-project") return set({ modal: "newProject" });
  if (name === "wizard-back") return set({ wizardStep: Math.max(1, state.wizardStep - 1) });
  if (name === "wizard-next") return set({ wizardStep: Math.min(4, state.wizardStep + 1) });
  if (name === "skip-wizard") {
    markFirstGenerationWizardDone();
    return set({ page: "agent" });
  }
  if (name === "start-wizard") return startFirstGenerationWizard();
  if (name === "sop") return set({ page: "sop", sopTopic: state.page === "project" ? state.step : "dashboard", modal: null });
  if (name === "register") return set({ modal: "register" });
  if (name === "support") return window.open(supportWhatsappUrl, "_blank", "noopener,noreferrer");
  if (name === "open-settings") return set({ modal: "settings", settingsSection: normalizeSettingsSection(event.currentTarget.dataset.settingsOpen || "account") });
  if (name === "clear-image-reference") {
    event.preventDefault();
    event.stopPropagation();
    return clearImageReference(event.currentTarget.dataset.attachmentKind || "avatar");
  }
  if (name === "open-attachment-picker") {
    const kind = event.currentTarget.dataset.attachmentKind || "avatar";
    return set({ modal: "attachmentPicker", attachmentPickerKind: kind, attachmentPickerFilter: kind });
  }
  if (name === "open-ugc-prompt-builder") return set({ modal: "ugcPromptBuilder" });
  if (name === "build-ugc-prompt") return buildAndStoreUgcPrompt();
  if (name === "copy-result-prompt") return copyActiveResultPrompt();
  if (name === "copy-ugc-prompt") {
    const promptText = currentUgcBuiltPrompt();
    await navigator.clipboard?.writeText(promptText);
    return notify("Prompt copied.");
  }
  if (name === "use-ugc-prompt") return useUgcBuiltPrompt();
  if (name === "save-ugc-prompt-template") return notify("Prompt template saved in this builder.");
  if (name === "confirm-delete-project") return deleteProject();
  if (name === "confirm-delete-result") return deleteResult();
  if (name === "confirm-bulk-delete-results") return bulkDeleteSelectedResults();
  if (name === "refresh-payment-status") return refreshPaymentStatus(event.currentTarget.dataset.order);
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
    await ensureStudioData();
    window.history.pushState({}, "", "/studio");
    return render();
  }
  if (name === "reload-page") return window.location.reload();
  if (name === "toggle-sidebar") {
    const sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem(storageKeys.sidebarCollapsed, sidebarCollapsed ? "true" : "false");
    return set({ sidebarCollapsed });
  }
  if (name === "apply-date") return notify(t("toastDashboardDate"));
  if (name === "reset-date") return set({ dateFrom: "2026-05-01", dateTo: "2026-05-26" });
  if (name === "chat") return set({ page: "agent" });
  if (name === "ask-agent-schedule") return askAgentSchedule();
  if (name === "toggle-agent-history") return set({ agentHistoryOpen: !state.agentHistoryOpen });
  if (name === "toggle-agent-debug" && isOwnerAdminAccount()) return set({ agentDebugOpen: !state.agentDebugOpen, agentHistoryOpen: false });
  if (name === "new-agent-chat") {
    if (state.agentBusy || state.agentTyping) {
      notify(state.lang === "zh" ? "Agent 还在处理当前对话，完成后再开新 chat。" : "Agent is still working in the current chat. Start a new chat after it finishes.");
      scrollAgentThreadToBottom();
      return;
    }
    clearAgentTypingTimer();
    clearAgentActiveRun();
    saveCurrentAgentHistory(null, { onlyIfChanged: true });
    localStorage.removeItem(storageKeys.agentMessages);
    const activeAgentDraftId = createAgentDraftId();
    clearAgentContextSummary(activeAgentDraftId);
    syncAgentChatUrl("", { replace: false });
    set({ agentMessages: [], agentInput: "", agentAttachments: [], agentQueue: [], agentTyping: false, agentRecoveredRun: null, agentExpandedMessages: {}, agentContextSummary: "", activeAgentHistoryId: null, activeAgentDraftId, agentHistoryOpen: false, agentDebugOpen: false, agentNewChatPulse: Date.now() });
    return setTimeout(() => document.querySelector("[data-agent-input]")?.focus(), 0);
  }
  if (name === "clear-agent-context" || name === "clear-agent") {
    clearAgentTypingTimer();
    clearAgentActiveRun();
    localStorage.removeItem(storageKeys.agentMessages);
    clearAgentContextSummary();
    return set({ agentMessages: [], agentInput: "", agentAttachments: [], agentQueue: [], agentTyping: false, agentRecoveredRun: null, agentContextSummary: "", agentExpandedMessages: {} });
  }
  if (name === "clear-agent-preferences") return clearAgentPreferences();
  if (name === "clear-agent-confirm") {
    const messages = state.agentMessages.map((item) => item.agentRun?.status === "waiting_confirmation"
      ? { ...item, agentRun: { ...item.agentRun, status: "failed", confirmation: null, plan: (item.agentRun.plan || []).map((step) => step.status === "waiting_confirmation" ? { ...step, status: "failed", detail: "用户已取消" } : step) } }
      : item);
    rememberAgentMessages(messages);
    return set({ agentMessages: messages, modal: null, activeAgentRunId: null });
  }
  if (name === "open-agent-confirm") return openAgentConfirmModal(event.currentTarget.dataset.agentRunId);
  if (name === "confirm-agent-modal") {
    const run = agentRunById(state.activeAgentRunId);
    if (!run?.confirmation?.token) return set({ modal: null, activeAgentRunId: null });
    set({ modal: null, activeAgentRunId: null });
    return confirmAgentAction(run.id, run.confirmation.token);
  }
  if (name === "logout") {
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem(storageKeys.token);
    return set({ user: null, token: "", db: null, modal: null });
  }
  if (name === "google-login") return window.location.href = `${apiBaseUrl}/api/auth/google/start`;
  if (name === "forgot") return window.open("https://wa.me/60123456789", "_blank");
  if (name === "open-whatsapp") return window.open(whatsappGroupUrl, "_blank", "noopener,noreferrer");
  if (name === "connect-tiktok") return window.location.href = `${apiBaseUrl}/api/tiktok/connect?token=${encodeURIComponent(state.token)}`;
  if (name === "tiktok-creator-info") return tiktokCreatorInfo();
  if (name === "copy-affiliate") {
    const code = state.db?.affiliate?.code || "POKAYA2026";
    await navigator.clipboard?.writeText(`https://pokaya.ai/ref/${code}`);
    return notify(t("toastAffiliateCopied"));
  }
  if (name === "copy-affiliate-code") {
    await navigator.clipboard?.writeText(state.db?.affiliate?.code || "POKAYA2026");
    return notify(t("toastAffiliateCodeCopied"));
  }
  if (name === "support-ticket") return mutate("/support", { method: "POST", body: JSON.stringify({ message: "Support ticket from studio" }) }, t("toastSupportSaved"));
  if (name === "download-sop") return download("/api/export/sop", "pokaya-image-sop.txt");
  if (name === "download-autopost-extension") return download("/api/export/autopost-extension", "pokaya-autopost-extension.zip");
  if (name === "export-all") return download("/api/export/all", "pokaya-data.json");
  if (name === "export-project") return download(`/api/export/project/${state.projectId}`, `${project().name}.json`);
  if (name === "image-count-down") return updateImageBatchCount(-1);
  if (name === "image-count-up") return updateImageBatchCount(1);
  if (name === "video-count-down") return updateVideoBatchCount(-1);
  if (name === "video-count-up") return updateVideoBatchCount(1);
  if (name === "toggle-prompt-advanced" || name === "optimize-image-prompt") return togglePromptAdvanced();
  if (name === "clear-image-prompt-media") return clearImagePromptMedia();
  if (name === "stop-agent-response") return stopAgentResponse();
  if (name === "clear-clone-reference") return clearCloneReferenceVideo();
  if (name?.startsWith("generate") || ["analyze-original", "clone-prompt", "write-story", "decode-viral"].includes(name)) return generate(name, event);
}

async function copyActiveResultPrompt() {
  const item = activeResult();
  const promptText = item ? resultPromptText(item) : "";
  if (!promptText) return notify("No prompt saved.");
  await navigator.clipboard?.writeText(promptText);
  return notify("Prompt copied.");
}

async function submit(event) {
  event.preventDefault();
  if (event.currentTarget.dataset.form === "agent" && state.agentInputComposing) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (event.currentTarget.dataset.form === "login") {
    try {
      if (data.adminKey) {
        localStorage.setItem(storageKeys.adminKey, data.adminKey);
        state.adminKey = data.adminKey;
      }
      const res = await api("/auth/login", { method: "POST", body: JSON.stringify(data) });
      localStorage.setItem(storageKeys.user, JSON.stringify(res.user));
      localStorage.setItem(storageKeys.token, res.token);
      state.token = res.token;
      state.db = res.state;
      state.projectId = state.db.projects[0]?.id;
      window.history.pushState({}, "", "/studio");
      return set({ user: res.user, modal: null, page: shouldShowFirstGenerationWizard(res.state, res.user) ? "wizard" : "project" });
    } catch (error) {
      return notify(error.message || "Sign in failed. Please try again.");
    }
  }
  if (event.currentTarget.dataset.form === "admin-key") {
    const adminKey = String(data.adminKey || "").trim();
    if (!adminKey) return notify("Enter admin key first.");
    localStorage.setItem(storageKeys.adminKey, adminKey);
    state.adminKey = adminKey;
    try {
      const res = await api("/admin/unlock", { method: "POST", body: JSON.stringify({ adminKey }) });
      localStorage.setItem(storageKeys.user, JSON.stringify(res.user));
      notify("Admin unlocked.");
      return set({ db: res.state, user: res.user, page: "admin" });
    } catch (error) {
      return notify(error.message || "Admin unlock failed.");
    }
  }
  if (event.currentTarget.dataset.form === "lead") {
    notify(t("toastOpeningRegistration"));
    window.history.pushState({}, "", "/register");
    return render();
  }
  if (event.currentTarget.dataset.form === "register") {
    try {
      notify(t("toastOpeningPayment"));
      const res = await api("/checkout/register", {
        method: "POST",
        body: JSON.stringify(data)
      });
      window.location.href = res.checkoutUrl;
    } catch (error) {
      notify(error.message);
    }
    return;
  }
  if (event.currentTarget.dataset.form === "affiliate") {
    return notify("Affiliate application saved for the next backend phase.");
  }
  if (event.currentTarget.dataset.form === "wizard-details") {
    state.wizardProductName = String(data.productName || "").trim();
    state.wizardProductLink = String(data.productLink || "").trim();
    state.wizardLanguage = String(data.language || state.wizardLanguage);
    state.wizardStyle = String(data.style || state.wizardStyle);
    return set({ wizardStep: 4 });
  }
  if (event.currentTarget.dataset.form === "account-profile") {
    return updateAccountProfile({ name: data.name, phone: currentAccountUser().phone || "" });
  }
  if (event.currentTarget.dataset.form === "account-whatsapp") {
    return updateAccountProfile({ name: currentAccountUser().name || "", phone: data.phone });
  }
  if (event.currentTarget.dataset.form === "account-password") {
    return changeAccountPassword(data);
  }
  if (event.currentTarget.dataset.form === "project") {
    const form = event.currentTarget;
    if (form.dataset.submitting === "true") return;
    const submitButton = form.querySelector("button[type='submit']");
    form.dataset.submitting = "true";
    if (submitButton) submitButton.disabled = true;
    try {
      const db = await api("/projects", { method: "POST", body: JSON.stringify(data) });
      const nextProjectId = db.projects.at(-1).id;
      return set({
        db,
        projectId: nextProjectId,
        modal: null,
        page: state.page === "library" ? "library" : "project",
        assetProjectFilter: state.page === "library" ? nextProjectId : state.assetProjectFilter
      });
    } catch (error) {
      notify(error.message);
    } finally {
      if (form.isConnected) {
        delete form.dataset.submitting;
        if (submitButton) submitButton.disabled = false;
      }
    }
    return;
  }
  if (event.currentTarget.dataset.form === "rename-project") {
    return renameProject(data.name);
  }
  if (event.currentTarget.dataset.form === "support") {
    const db = await api("/support", { method: "POST", body: JSON.stringify(data) });
    notify(t("toastSupportSaved"));
    return set({ db, modal: null });
  }
  if (event.currentTarget.dataset.form === "result-edit-image") {
    return editResultImage(data);
  }
  if (event.currentTarget.dataset.form === "agent") {
    return sendAgentMessage(data.message);
  }
}

async function fieldChange(event) {
  if (event.target.dataset.field === "image.aspectRatio") {
    saveProjectFieldQuick(event.target.dataset.field, event.target.value);
    return;
  }
  return saveProjectField(event.target.dataset.field, event.target.value);
}

function updateUgcBuilderOption(el) {
  const field = el.dataset.ugcBuilderOption;
  const value = el.dataset.ugcBuilderValue;
  const patch = { [field]: value, builtPrompt: "" };
  if (el.dataset.ugcBuilderTarget) patch[el.dataset.ugcBuilderTarget] = el.dataset.ugcBuilderTargetValue || "";
  if (field === "style") patch.stylePrompt = ugcBuilderStyleOptions[value] || state.ugcPromptBuilder?.stylePrompt || "";
  set({ ugcPromptBuilder: { ...defaultUgcPromptBuilder(), ...(state.ugcPromptBuilder || {}), ...patch } });
}

function updateUgcBuilderField(field, value, shouldRender = false) {
  const patch = { [field]: value };
  if (field === "style") patch.stylePrompt = ugcBuilderStyleOptions[value] || state.ugcPromptBuilder?.stylePrompt || "";
  state.ugcPromptBuilder = { ...defaultUgcPromptBuilder(), ...(state.ugcPromptBuilder || {}), ...patch };
  if (field !== "builtPrompt") state.ugcPromptBuilder.builtPrompt = "";
  if (shouldRender) render();
}

function buildAndStoreUgcPrompt() {
  const builtPrompt = buildUgcPrompt();
  set({ ugcPromptBuilder: { ...defaultUgcPromptBuilder(), ...(state.ugcPromptBuilder || {}), builtPrompt } });
}

function currentUgcBuiltPrompt() {
  const fromDom = document.querySelector('[data-ugc-builder-input="builtPrompt"]')?.value;
  return String(fromDom || state.ugcPromptBuilder?.builtPrompt || buildUgcPrompt()).trim();
}

async function useUgcBuiltPrompt() {
  const promptText = currentUgcBuiltPrompt();
  state.ugcPromptBuilder = { ...defaultUgcPromptBuilder(), ...(state.ugcPromptBuilder || {}), builtPrompt: promptText };
  await saveProjectField("ugc.script", promptText);
  set({ modal: null });
}

function updateImageBatchCount(delta) {
  const projectId = state.projectId;
  const previousDb = state.db;
  const nextCount = Math.min(4, Math.max(1, imageBatchCount(project()) + delta));
  if (nextCount === imageBatchCount(project())) return;
  imageConsoleExpandLockUntil = Date.now() + 700;
  state.db = dbWithProjectField(previousDb, projectId, "image.count", nextCount);
  updateImageCountDom(nextCount);
  const seq = ++imageCountSaveSeq;
  clearTimeout(imageCountSaveTimer);
  imageCountSaveTimer = setTimeout(async () => {
    try {
      const db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "image.count", value: imageBatchCount(project()) })
      });
      if (state.projectId !== projectId || seq !== imageCountSaveSeq) return;
      state.db = preserveActiveGenerationState(db, state.db, projectId);
    } catch (error) {
      if (state.projectId === projectId && seq === imageCountSaveSeq) {
        state.db = previousDb;
        updateImageCountDom(imageBatchCount(project()));
      }
      notify(error.message || t("toastSaveFailed"));
    }
  }, 140);
}

function updateVideoBatchCount(delta) {
  const projectId = state.projectId;
  const previousDb = state.db;
  const nextCount = Math.min(4, Math.max(1, videoBatchCount(project()) + delta));
  if (nextCount === videoBatchCount(project())) return;
  state.db = dbWithProjectField(previousDb, projectId, "ugc.count", nextCount);
  updateVideoCountDom(nextCount);
  const timerKey = `${projectId}:ugc.count`;
  const previousTimer = quickFieldSaveTimers.get(timerKey);
  if (previousTimer) clearTimeout(previousTimer.id);
  const seq = ++quickFieldSaveSeq;
  const id = window.setTimeout(async () => {
    try {
      const db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "ugc.count", value: videoBatchCount(project()) })
      });
      if (quickFieldSaveTimers.get(timerKey)?.seq !== seq || state.projectId !== projectId) return;
      state.db = db;
      quickFieldSaveTimers.delete(timerKey);
    } catch (error) {
      if (quickFieldSaveTimers.get(timerKey)?.seq !== seq || state.projectId !== projectId) return;
      quickFieldSaveTimers.delete(timerKey);
      state.db = previousDb;
      updateVideoCountDom(videoBatchCount(project()));
      notify(error.message || t("toastSaveFailed"));
    }
  }, 140);
  quickFieldSaveTimers.set(timerKey, { id, seq });
}

async function saveProjectField(field, value) {
  const projectId = state.projectId;
  const previousDb = state.db;
  set({ db: dbWithProjectField(previousDb, projectId, field, value) });
  try {
    const db = await api(`/projects/${projectId}/field`, { method: "PATCH", body: JSON.stringify({ field, value }) });
    set({ db });
    notify(t("saveDone"));
  } catch (error) {
    set({ db: previousDb });
    notify(error.message || t("toastSaveFailed"));
  }
}

function setFieldSetActive(field, value, source = null) {
  document.querySelectorAll("[data-field-set]").forEach((el) => {
    if (el.dataset.fieldSet !== field) return;
    const active = el.dataset.value === value;
    el.classList.toggle("active", active);
    el.setAttribute("aria-pressed", active ? "true" : "false");
    if (el.getAttribute("role") === "option") {
      el.setAttribute("aria-selected", active ? "true" : "false");
    }
  });
  if (source && source.dataset.fieldSet === field) {
    source.classList.add("active");
    source.setAttribute("aria-pressed", "true");
    if (source.getAttribute("role") === "option") {
      source.setAttribute("aria-selected", "true");
    }
  }
  if (field === "image.aspectRatio") {
    document.querySelectorAll(".image-aspect-ratio-menu summary b").forEach((el) => {
      el.textContent = value;
    });
  }
  if (field === "image.resolution") {
    const label = source?.dataset.label || String(value || "").toLowerCase();
    document.querySelectorAll("[data-resolution-current]").forEach((el) => {
      el.textContent = label;
    });
    document.querySelectorAll('[data-field-set="image.resolution"]').forEach((el) => {
      const active = el.dataset.value === value;
      el.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  if (field?.startsWith("ugc.")) {
    document.querySelectorAll(`[data-video-option-current="${field}"]`).forEach((el) => {
      el.textContent = value;
    });
    document.querySelectorAll(`[data-field-set="${field}"]`).forEach((el) => {
      const active = el.dataset.value === value;
      el.classList.toggle("active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    });
    updateVideoCountDom(videoBatchCount(project()));
  }
  if (field === "original.provider") {
    const provider = originalProviderValue(value);
    const button = document.querySelector(".original-generate-button");
    if (button) button.textContent = `🎬 Generate ${originalProviderLabel(provider)} Video · ~${originalProviderCredits(provider)} credits`;
  }
}

function bindProjectFieldSetControls(root = document) {
  root.querySelectorAll("[data-field-set]").forEach((el) => {
    if (el.dataset.fieldSetBound === "true") return;
    el.dataset.fieldSetBound = "true";
    const save = () => {
      if (el.dataset.fieldSet?.startsWith("image.")) stabilizeImageConsoleExpansion(1000);
      el.closest("details")?.removeAttribute("open");
      saveProjectFieldQuick(el.dataset.fieldSet, el.dataset.value, el);
    };
    el.addEventListener("click", save);
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      save();
    });
  });
}

function saveProjectFieldQuick(field, value, source = null) {
  if (!field) return;
  const projectId = state.projectId;
  const previousDb = state.db;
  state.db = dbWithProjectField(previousDb, projectId, field, value);
  setFieldSetActive(field, value, source);
  document.querySelectorAll(`[data-field="${field}"]`).forEach((el) => {
    el.value = value;
  });

  const timerKey = `${projectId}:${field}`;
  const previousTimer = quickFieldSaveTimers.get(timerKey);
  if (previousTimer) clearTimeout(previousTimer.id);
  const seq = ++quickFieldSaveSeq;
  const id = window.setTimeout(async () => {
    try {
      const db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field, value })
      });
      if (quickFieldSaveTimers.get(timerKey)?.seq !== seq || state.projectId !== projectId) return;
      state.db = preserveActiveGenerationState(db, state.db, projectId);
      quickFieldSaveTimers.delete(timerKey);
    } catch (error) {
      if (quickFieldSaveTimers.get(timerKey)?.seq !== seq || state.projectId !== projectId) return;
      quickFieldSaveTimers.delete(timerKey);
      state.db = previousDb;
      render();
      notify(error.message || t("toastSaveFailed"));
    }
  }, 180);
  quickFieldSaveTimers.set(timerKey, { id, seq });
}

function updateImageModelDom(modelValue, source = null) {
  const model = imageModelOptions().find((item) => item.value === modelValue) || imageModelOptions()[0];
  const consoleEl = source?.closest?.("[data-image-generate-console]") || document.querySelector("[data-image-generate-console]");
  if (!consoleEl) return;
  const projectItem = project();
  const currentIcon = consoleEl.querySelector("[data-image-model-current-icon]");
  const currentText = consoleEl.querySelector(".image-model-current-text b");
  const creditLabel = consoleEl.querySelector("[data-image-credit-label]");
  const compactSummary = consoleEl.querySelector("[data-image-compact-summary]");
  const aspectMenu = consoleEl.querySelector(".image-aspect-ratio-menu");
  const resolutionMenu = consoleEl.querySelector(".image-resolution-menu");
  if (currentIcon) currentIcon.innerHTML = providerLogo(model.provider);
  if (currentText) currentText.textContent = model.title;
  consoleEl.querySelectorAll("[data-image-model-option]").forEach((button) => {
    const active = button.dataset.imageModelOption === model.value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    const check = button.querySelector(".image-model-option-check");
    if (check) check.innerHTML = active ? icon("check", 18) : "";
  });
  if (creditLabel && !state.generating) {
    creditLabel.textContent = `${(imageModelCredit(model.value) * imageBatchCount(project())).toFixed(2)} Credit`;
  }
  if (compactSummary) compactSummary.textContent = imageCompactPromptText();
  if (aspectMenu) {
    const aspectOptions = imageModelCapabilities(model.value).aspectRatios;
    const selectedAspectRatio = normalizedImageSettingForModel(model.value, "image.aspectRatio", projectItem?.image?.aspectRatio);
    aspectMenu.outerHTML = imageAspectRatioPicker(selectedAspectRatio, aspectOptions);
  }
  if (resolutionMenu) {
    const resolutionOptions = imageResolutionOptionsForModel(model.value);
    const selectedResolution = normalizedImageSettingForModel(model.value, "image.resolution", projectItem?.image?.resolution);
    resolutionMenu.outerHTML = resolutionOptions.length ? imageResolutionPicker(selectedResolution, resolutionOptions) : "";
  }
  window.lucide?.createIcons();
  bindImageConsoleCompact();
  bindAspectRatioFloatingMenus();
  bindProjectFieldSetControls(consoleEl);
}

function updateImageCountDom(count = imageBatchCount(project())) {
  const consoleEl = document.querySelector("[data-image-generate-console]");
  if (!consoleEl) return;
  const safeCount = Math.min(4, Math.max(1, Number.parseInt(count, 10) || 1));
  const countLabel = consoleEl.querySelector("[data-image-count-current]");
  const downButton = consoleEl.querySelector('[data-action="image-count-down"]');
  const upButton = consoleEl.querySelector('[data-action="image-count-up"]');
  const creditLabel = consoleEl.querySelector("[data-image-credit-label]");
  const compactSummary = consoleEl.querySelector("[data-image-compact-summary]");
  if (countLabel) countLabel.textContent = String(safeCount);
  if (downButton) downButton.disabled = safeCount <= 1;
  if (upButton) upButton.disabled = safeCount >= 4;
  if (creditLabel && !state.generating) {
    creditLabel.textContent = `${(imageModelCredit(project().image?.model) * safeCount).toFixed(2)} Credit`;
  }
  if (compactSummary) compactSummary.textContent = imageCompactPromptText();
  consoleEl.classList.add("is-hover-expanded");
  consoleEl.classList.remove("is-compact");
}

function updateVideoCountDom(count = videoBatchCount(project())) {
  const consoleEl = document.querySelector("[data-video-generate-console]");
  if (!consoleEl) return;
  const safeCount = Math.min(4, Math.max(1, Number.parseInt(count, 10) || 1));
  const countLabel = consoleEl.querySelector("[data-video-count-current]");
  const downButton = consoleEl.querySelector('[data-action="video-count-down"]');
  const upButton = consoleEl.querySelector('[data-action="video-count-up"]');
  const creditLabel = consoleEl.querySelector("[data-video-credit-label]");
  if (countLabel) countLabel.textContent = String(safeCount);
  if (downButton) downButton.disabled = safeCount <= 1;
  if (upButton) upButton.disabled = safeCount >= 4;
  if (creditLabel && !state.generating) {
    creditLabel.textContent = `${videoCreditEstimate(project())} Credit`;
  }
}

async function saveImageModelQuick(value, source = null) {
  const selected = imageModelOptions().find((item) => item.value === value);
  if (!selected) return;
  const projectId = state.projectId;
  const previousDb = state.db;
  const currentProject = project();
  const nextAspectRatio = normalizedImageSettingForModel(selected.value, "image.aspectRatio", currentProject?.image?.aspectRatio);
  const nextResolution = normalizedImageSettingForModel(selected.value, "image.resolution", currentProject?.image?.resolution);
  let nextDb = dbWithProjectField(previousDb, projectId, "image.model", selected.value);
  nextDb = dbWithProjectField(nextDb, projectId, "image.aspectRatio", nextAspectRatio);
  nextDb = dbWithProjectField(nextDb, projectId, "image.resolution", nextResolution);
  state.db = nextDb;
  stabilizeImageConsoleExpansion(1000);
  updateImageModelDom(selected.value, source);
  const consoleEl = source?.closest?.("[data-image-generate-console]");
  if (consoleEl) {
    consoleEl.classList.add("is-hover-expanded");
    consoleEl.classList.remove("is-compact");
  }
  try {
    let db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field: "image.model", value: selected.value })
    });
    if (currentProject?.image?.aspectRatio !== nextAspectRatio) {
      db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "image.aspectRatio", value: nextAspectRatio })
      });
    }
    if (String(currentProject?.image?.resolution || "").toUpperCase() !== nextResolution) {
      db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "image.resolution", value: nextResolution })
      });
    }
    if (state.projectId !== projectId) return;
    state.db = preserveActiveGenerationState(db, state.db, projectId);
  } catch (error) {
    if (state.projectId === projectId) {
      state.db = previousDb;
      render();
    }
    notify(error.message || t("toastSaveFailed"));
  }
}

function setFrameworkChipState(chip, checked) {
  if (!chip) return;
  chip.classList.toggle("selected", checked);
  chip.setAttribute("aria-checked", checked ? "true" : "false");
  const input = chip.querySelector("input");
  if (input) input.checked = checked;
}

function saveAutoFrameworksQuietly(projectId, next, previousDb) {
  const seq = ++autoFrameworkSaveSeq;
  clearTimeout(autoFrameworkSaveTimer);
  autoFrameworkSaveTimer = window.setTimeout(async () => {
    try {
      const db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "auto.frameworks", value: next })
      });
      if (seq === autoFrameworkSaveSeq && state.projectId === projectId) state.db = db;
    } catch (error) {
      if (seq !== autoFrameworkSaveSeq || state.projectId !== projectId) return;
      state.db = previousDb;
      render();
      notify(error.message || t("toastSaveFailed"));
    }
  }, 220);
}

async function toggleAutoFramework(value = "", chip = null) {
  if (!value) return;
  const projectId = state.projectId;
  const previousDb = state.db;
  const selected = Array.isArray(project().auto?.frameworks) ? [...project().auto.frameworks] : [];
  const exists = selected.includes(value);
  const next = exists ? selected.filter((item) => item !== value) : [...selected, value];
  if (!exists && selected.length >= 5) {
    notify("最多选择 5 个 frameworks。");
    setFrameworkChipState(chip, false);
    return;
  }
  state.db = dbWithProjectField(previousDb, projectId, "auto.frameworks", next);
  setFrameworkChipState(chip, !exists);
  saveAutoFrameworksQuietly(projectId, next, previousDb);
}

async function applyImagePreset(promptText) {
  const projectId = state.projectId;
  const previousDb = state.db;
  set({ db: dbWithProjectField(previousDb, projectId, "image.prompt", promptText) });
  clearTimeout(imagePresetSaveTimer);
  imagePresetSaveTimer = setTimeout(async () => {
    try {
      const db = await api(`/projects/${projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "image.prompt", value: promptText })
      });
      if (state.projectId === projectId && project()?.image?.prompt === promptText) set({ db: preserveActiveGenerationState(db, state.db, projectId) });
    } catch (error) {
      if (state.projectId === projectId && project()?.image?.prompt === promptText) set({ db: previousDb });
      notify(error.message || t("toastSaveFailed"));
    }
  }, 180);
}

function wizardTargetForFeature(feature = state.wizardFeature) {
  return {
    "product-image": { step: "image", action: "generate-image", field: "image.prompt" },
    "visual-card": { step: "image", action: "", field: "image.prompt" },
    "short-video": { step: "ugc", action: "generate-ugc", field: "ugc.script" },
    "ugc-script": { step: "ugc", action: "generate-ugc", field: "ugc.script" },
    "content-plan": { step: "auto", action: "generate-auto", field: "auto.productUrl" },
    "clone-style": { step: "clone", action: "clone-prompt", field: "clone.rules" },
    "ask-agent": { step: "agent", action: "", field: "" }
  }[feature] || { step: "agent", action: "", field: "" };
}

async function createOrPrepareWizardProject() {
  const productName = state.wizardProductName.trim();
  let db = state.db;
  let projectId = state.projectId || db.projects?.[0]?.id || "";
  if (!projectId) {
    db = await api("/projects", { method: "POST", body: JSON.stringify({ name: productName || wizardFeatureLabel() }) });
    projectId = db.projects.at(-1)?.id;
  }
  const currentProject = db.projects.find((item) => item.id === projectId);
  if (productName && /^Project\s+\d+$/i.test(currentProject?.name || "")) {
    db = await api(`/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ name: productName }) });
  }
  return { db, projectId };
}

async function patchWizardProjectFields(projectId, target) {
  const fields = [
    ["image.prompt", wizardPrompt()],
    ["image.mode", state.wizardFeature === "product-image" ? "Create Image" : "Create Image"],
    ["ugc.script", wizardPrompt()],
    ["original.brief", wizardPrompt()],
    ["story.notes", wizardPrompt()],
    ["clone.rules", wizardPrompt()]
  ];
  if (state.wizardProductLink) fields.push(["auto.productUrl", state.wizardProductLink]);
  let db = state.db;
  for (const [field, value] of fields) {
    if (!value) continue;
    db = await api(`/projects/${projectId}/field`, { method: "PATCH", body: JSON.stringify({ field, value }) });
  }
  return db;
}

async function startFirstGenerationWizard() {
  if (state.wizardBusy) return;
  if (!state.wizardFeature) return set({ wizardStep: 2 });
  const target = wizardTargetForFeature();
  if (state.wizardFeature === "ask-agent") {
    markFirstGenerationWizardDone();
    const promptText = wizardPrompt();
    set({ page: "agent", agentInput: promptText });
    requestAnimationFrame(() => fillAgentInput(promptText));
    return notify("Agent is ready to recommend your first step.");
  }
  try {
    set({ wizardBusy: true });
    const prepared = await createOrPrepareWizardProject();
    set({ db: prepared.db, projectId: prepared.projectId });
    const db = await patchWizardProjectFields(prepared.projectId, target);
    set({ db, projectId: prepared.projectId, step: target.step });
    if (state.wizardFeature === "visual-card") {
      const promptText = wizardPrompt();
      const res = await api("/agent", {
        method: "POST",
        body: JSON.stringify({
          message: promptText,
          messages: [],
          contextSummary: "",
          projectId: prepared.projectId
        })
      });
      markFirstGenerationWizardDone();
      set({ db: res.state || db, page: "agent", wizardBusy: false });
      const messages = [{ role: "user", content: promptText }, { role: "assistant", content: res.reply || "Visual card created.", agentRun: res.agentRun || null }];
      rememberAgentMessages(messages);
      notify("Visual card 已创建。");
      return;
    }
    if (target.action) {
      notify(t("toastGenerationQueued"));
      const generatedDb = await api(`/projects/${prepared.projectId}/generate`, { method: "POST", body: JSON.stringify({ action: target.action, step: target.step }) });
      markFirstGenerationWizardDone();
      set({ db: generatedDb, page: "agent", wizardBusy: false });
      const nextPrompt = `My first ${wizardFeatureLabel()} is ready or queued. Please explain what I should try next as a beginner.`;
      fillAgentInput(nextPrompt);
      notify(t("toastGenerationJobQueued"));
      pollGenerationQueue();
      return;
    }
    markFirstGenerationWizardDone();
    set({ page: "project", step: target.step, wizardBusy: false });
    notify("Your first Pokaya tool is ready.");
  } catch (error) {
    set({ wizardBusy: false });
    notify(error.message || t("toastSaveFailed"));
  }
}

async function uploadChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (event.target.dataset.upload === "clone-reference") {
    await uploadCloneReferenceVideo(file);
    event.target.value = "";
    return;
  }
  if (event.target.dataset.upload === "image-prompt") {
    await saveImagePromptMediaFile(file);
    event.target.value = "";
    return;
  }
  await uploadAttachmentFile(file, event.target.dataset.upload, event.target.dataset.uploadSelect);
  event.target.value = "";
}

function bindAttachmentDropZone(el) {
  const kind = el.dataset.dropUpload || state.attachmentPickerKind || "product";
  const clear = () => el.classList.remove("is-dragging");
  el.addEventListener("dragenter", (event) => {
    event.preventDefault();
    el.classList.add("is-dragging");
  });
  el.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    el.classList.add("is-dragging");
  });
  el.addEventListener("dragleave", (event) => {
    if (!el.contains(event.relatedTarget)) clear();
  });
  el.addEventListener("drop", async (event) => {
    event.preventDefault();
    clear();
    const file = [...(event.dataTransfer?.files || [])].find((item) => /^(image|video)\//i.test(item.type || ""));
    if (!file) return notify("Please drop an image or video file.");
    if (kind === "clone-reference") return uploadCloneReferenceVideo(file);
    await uploadAttachmentFile(file, kind, kind);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

async function uploadCloneReferenceVideo(file) {
  if (!/^video\//i.test(file.type || "")) return notify("Please upload a video file.");
  const maxBytes = 30 * 1024 * 1024;
  if (file.size > maxBytes) return notify("Video is too large. Please upload a clip under 30 MB.");
  try {
    notify("Reading video...");
    const dataUrl = await readFileAsDataUrl(file);
    const value = {
      name: file.name,
      size: file.size,
      type: file.type || "video/mp4",
      dataUrl,
      updatedAt: new Date().toISOString()
    };
    const projectId = state.projectId;
    const previousDb = state.db;
    const nextDb = dbWithProjectField(previousDb, projectId, "clone.referenceVideo", value);
    set({ db: nextDb });
    const db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field: "clone.referenceVideo", value })
    });
    if (state.projectId === projectId) set({ db });
    notify("Video ready for prompt extraction.");
  } catch (error) {
    notify(error.message || "Could not upload video.");
  }
}

async function saveImagePromptMediaFile(file) {
  if (!/^image\//i.test(file.type || "")) return notify("Please upload an image file.");
  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) return notify("Image is too large. Please upload an image under 12 MB.");
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const value = {
      name: file.name || agentPastedFilename(file, "image"),
      size: file.size,
      type: file.type || "image/png",
      dataUrl,
      updatedAt: new Date().toISOString()
    };
    const projectId = state.projectId;
    const previousDb = state.db;
    let nextDb = dbWithProjectField(previousDb, projectId, "image.promptImage", value);
    nextDb = dbWithProjectField(nextDb, projectId, "image.prompt", "");
    set({ db: nextDb });
    const db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field: "image.promptImage", value })
    });
    if (state.projectId === projectId) {
      const clearedDb = dbWithProjectField(db, projectId, "image.prompt", "");
      set({ db: clearedDb });
    }
    api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field: "image.prompt", value: "" })
    }).catch((error) => notify(error.message || t("toastSaveFailed")));
    notify("Image added. Text input is locked until you remove it.");
  } catch (error) {
    notify(error.message || "Could not add image.");
  }
}

async function clearImagePromptMedia() {
  const projectId = state.projectId;
  const previousDb = state.db;
  set({ db: dbWithProjectField(previousDb, projectId, "image.promptImage", null) });
  try {
    const db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field: "image.promptImage", value: null })
    });
    if (state.projectId === projectId) set({ db });
  } catch (error) {
    set({ db: previousDb });
    notify(error.message || t("toastSaveFailed"));
  }
}

async function handleImagePromptPaste(event) {
  const files = imageClipboardFiles(event.clipboardData);
  if (!files.length) return;
  event.preventDefault();
  await saveImagePromptMediaFile(files[0]);
}

function imageClipboardFiles(clipboardData) {
  const items = Array.from(clipboardData?.items || []);
  const files = items
    .filter((item) => item.kind === "file" && /^image\//.test(item.type || ""))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (files.length) return files;
  return Array.from(clipboardData?.files || []).filter((file) => /^image\//.test(file.type || ""));
}

async function clearCloneReferenceVideo() {
  const projectId = state.projectId;
  const previousDb = state.db;
  set({ db: dbWithProjectField(previousDb, projectId, "clone.referenceVideo", null) });
  try {
    const db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field: "clone.referenceVideo", value: null })
    });
    if (state.projectId === projectId) set({ db });
  } catch (error) {
    set({ db: previousDb });
    notify(error.message || t("toastSaveFailed"));
  }
}

async function uploadAttachmentFile(file, kind = state.attachmentPickerKind || "product", selectTarget = "") {
  const isImage = /^image\//i.test(file.type || "");
  if (isImage && file.size > 18 * 1024 * 1024) return notify("Image is too large. Please upload an image under 18 MB.");
  const preview = isImage ? await imageFileToDataUrl(file) : "";
  const db = await api("/attachments", {
    method: "POST",
    body: JSON.stringify({
      projectId: state.projectId,
      kind,
      name: file.name,
      size: file.size,
      type: file.type,
      mediaKind: isImage ? "image" : /^video\//i.test(file.type || "") ? "video" : "",
      ...(preview ? { dataUrl: preview, previewUrl: preview } : {})
    })
  });
  let nextDb = db;
  if (selectTarget === "product" || selectTarget === "avatar") {
    const uploaded = (db.attachments || []).find((item) => item.projectId === state.projectId && item.kind === kind && item.name === file.name);
    const field = selectTarget === "product" ? "image.productAttachmentId" : "image.avatarAttachmentId";
    if (uploaded?.id) {
      nextDb = dbWithProjectField(db, state.projectId, field, uploaded.id);
      api(`/projects/${state.projectId}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field, value: uploaded.id })
      }).catch((error) => notify(error.message));
    }
  }
  if (selectTarget === "product" || selectTarget === "avatar") {
    state.db = nextDb;
    closeModalDom();
    patchImageReferencesDom();
    notify(tf("toastFileSaved", { name: file.name }));
    return;
  }
  set({ db: nextDb });
  notify(tf("toastFileSaved", { name: file.name }));
}

async function pickAttachment(id, targetKind = state.attachmentPickerKind) {
  if (!id) return;
  const field = imageReferenceField(targetKind);
  const projectId = state.projectId;
  const previousDb = state.db;
  const selectedAttachment = (previousDb.attachments || []).find((item) => item.id === id) || null;
  const requestSeq = (imageReferenceSaveSeq.get(field) || 0) + 1;
  imageReferenceSaveSeq.set(field, requestSeq);
  setPendingImageReference(field, id, selectedAttachment);
  state.db = dbWithProjectField(previousDb, projectId, field, id);
  closeModalDom();
  patchImageReferencesDom();
  try {
    const db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field, value: id })
    });
    if (state.projectId === projectId && imageReferenceSaveSeq.get(field) === requestSeq) {
      clearPendingImageReference(field, projectId);
      state.db = dbWithPreservedAttachments(db, previousDb, [id]);
      patchImageReferencesDom();
    }
  } catch (error) {
    if (imageReferenceSaveSeq.get(field) === requestSeq) {
      clearPendingImageReference(field, projectId);
      state.db = previousDb;
      patchImageReferencesDom();
    }
    notify(error.message || t("toastSaveFailed"));
  }
}

async function clearImageReference(kind = "avatar") {
  const targetKind = kind === "product" ? "product" : "avatar";
  const field = imageReferenceField(targetKind);
  const projectId = state.projectId;
  const previousDb = state.db;
  const requestSeq = (imageReferenceSaveSeq.get(field) || 0) + 1;
  imageReferenceSaveSeq.set(field, requestSeq);
  setPendingImageReference(field, "", null);
  state.db = dbWithProjectField(previousDb, projectId, field, "");
  patchImageReferencesDom();
  try {
    const db = await api(`/projects/${projectId}/field`, {
      method: "PATCH",
      body: JSON.stringify({ field, value: "" })
    });
    if (state.projectId === projectId && imageReferenceSaveSeq.get(field) === requestSeq) {
      clearPendingImageReference(field, projectId);
      state.db = db;
      patchImageReferencesDom();
    }
  } catch (error) {
    if (imageReferenceSaveSeq.get(field) === requestSeq) {
      clearPendingImageReference(field, projectId);
      state.db = previousDb;
      patchImageReferencesDom();
    }
    notify(error.message || t("toastSaveFailed"));
  }
}

async function renameProject(name) {
  if (!state.editingProjectId) return;
  const db = await api(`/projects/${state.editingProjectId}`, { method: "PATCH", body: JSON.stringify({ name }) });
  notify(t("toastProjectRenamed"));
  set({ db, modal: null, editingProjectId: null });
}

async function deleteProject() {
  if (!state.editingProjectId) return;
  const deletedId = state.editingProjectId;
  const deletedName = (state.db?.projects || []).find((project) => project.id === deletedId)?.name || t("project");
  if ((state.db?.projects || []).length <= 1) {
    notify(t("toastKeepOneProject"));
    return;
  }

  const previousDb = state.db;
  const previousProjectId = state.projectId;
  const previousPage = state.page;
  const optimisticDb = {
    ...previousDb,
    projects: (previousDb.projects || []).filter((project) => project.id !== deletedId),
    attachments: (previousDb.attachments || []).filter((item) => item.projectId !== deletedId),
    schedule: (previousDb.schedule || []).filter((item) => item.projectId !== deletedId),
    generationJobs: (previousDb.generationJobs || []).filter((item) => item.projectId !== deletedId)
  };
  const nextProjectId = deletedId === state.projectId ? optimisticDb.projects[0]?.id || null : state.projectId;
  const nextAssetProjectFilter = state.assetProjectFilter === deletedId ? "all" : state.assetProjectFilter;

  notify(t("toastDeletingProject"));
  set({
    db: optimisticDb,
    modal: null,
    editingProjectId: null,
    projectId: nextProjectId,
    page: nextProjectId ? state.page : "dashboard",
    assetProjectFilter: nextAssetProjectFilter
  });

  try {
    const db = await api(`/projects/${deletedId}`, { method: "DELETE" });
    notify(tf("toastProjectDeleted", { name: deletedName }));
    set({ db });
  } catch (error) {
    notify(error.message);
    set({ db: previousDb, projectId: previousProjectId, page: previousPage });
  }
}

function generationFeedbackCopy(key, count = 1) {
  const copies = {
    zh: {
      busy: "上一条生成正在提交，请等几秒。",
      submitting: "已收到，正在提交生成任务...",
      queued: count > 1 ? `已提交 ${count} 个生成任务，正在排队。` : "已提交生成任务，正在排队。"
    },
    ms: {
      busy: "Generation sebelumnya sedang dihantar. Tunggu sebentar.",
      submitting: "Diterima. Sedang hantar generation...",
      queued: count > 1 ? `${count} generation sudah masuk queue.` : "Generation sudah masuk queue."
    },
    en: {
      busy: "The previous generation is still being submitted. Please wait a moment.",
      submitting: "Got it. Submitting the generation...",
      queued: count > 1 ? `${count} generations queued.` : "Generation queued."
    }
  };
  return (copies[state.lang] || copies.en)[key] || "";
}

function markGenerateTriggerSubmitting(trigger) {
  if (!trigger || trigger.disabled) return;
  trigger.setAttribute("aria-busy", "true");
  trigger.classList.add("is-submitting");
}

function optimisticGenerationJobs(name, count, options = {}) {
  if (name === "generate-ugc") {
    const current = project();
    const aspectRatio = current.ugc?.aspectRatio || current.image?.aspectRatio || "16:9";
    const createdAt = new Date().toISOString();
    return Array.from({ length: count }, (_, index) => ({
      id: `optimistic_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`,
      projectId: state.projectId,
      action: name,
      step: state.step || "ugc",
      type: "video",
      status: "queued",
      stage: options.advancePrompt ? "prompt_advanced" : "queued",
      prompt: options.prompt || "",
      promptSnapshot: options.prompt || "",
      aspectRatio,
      optimistic: true,
      createdAt
    }));
  }
  if (name !== "generate-image") return [];
  const current = project();
  const aspectRatio = current.image?.aspectRatio || "9:16";
  const type = /seedance|veo|sora|video|omni/i.test(String(current.image?.model || "")) ? "video" : "image";
  const createdAt = new Date().toISOString();
  return Array.from({ length: count }, (_, index) => ({
    id: `optimistic_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`,
    projectId: state.projectId,
    action: name,
    step: state.step || "image",
    type,
    status: "queued",
    stage: options.advancePrompt ? "prompt_advanced" : "queued",
    prompt: options.prompt || "",
    promptSnapshot: options.prompt || "",
    aspectRatio,
    optimistic: true,
    createdAt
  }));
}

async function generate(name, event = null) {
  if (state.generating && name !== "generate-image") {
    notify(generationFeedbackCopy("busy"));
    return;
  }
  const generationOptions = syncImageConsoleBeforeGenerate(name);
  const count = name === "generate-image" ? imageBatchCount(project()) : name === "generate-ugc" ? videoBatchCount(project()) : 1;
  const optimisticJobs = optimisticGenerationJobs(name, count, generationOptions);
  const optimisticIds = new Set(optimisticJobs.map((job) => job.id));
  try {
    markGenerateTriggerSubmitting(event?.currentTarget);
    set({
      generating: true,
      optimisticGenerationJobs: [...(state.optimisticGenerationJobs || []), ...optimisticJobs]
    });
    notify(generationOptions.advancePrompt ? "Queued. Prompt Enhance will run before generation." : generationFeedbackCopy("submitting"));
    const db = await api(`/projects/${state.projectId}/generate`, { method: "POST", body: JSON.stringify({ action: name, step: state.step, count, ...generationOptions }) });
    set({
      db,
      generating: false,
      optimisticGenerationJobs: (state.optimisticGenerationJobs || []).filter((job) => !optimisticIds.has(job.id))
    });
    notify(generationFeedbackCopy("queued", count));
    pollGenerationQueue();
  } catch (error) {
    set({
      generating: false,
      promptAdvancedBusy: false,
      optimisticGenerationJobs: (state.optimisticGenerationJobs || []).filter((job) => !optimisticIds.has(job.id))
    });
    notify(error.message);
  }
}

async function cancelGenerationJob(jobId) {
  if (!jobId || !state.db) return;
  if (!window.confirm("确认取消这次生成？未完成的任务会停止，未开始扣费的任务会自动释放。")) return;
  const previousDb = state.db;
  const nextDb = {
    ...previousDb,
    generationJobs: (previousDb.generationJobs || []).map((job) => job.id === jobId
      ? { ...job, status: "cancelled", completedAt: new Date().toISOString() }
      : job)
  };
  set({ db: nextDb });
  try {
    const db = await api(`/generation-jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({})
    });
    set({ db });
    notify("已取消这次生成。");
  } catch (error) {
    set({ db: previousDb });
    notify(error.message || "Could not cancel generation.");
  }
}

function syncImageConsoleBeforeGenerate(name) {
  if (name === "generate-ugc") {
    const promptInput = document.querySelector("[data-video-console-prompt]");
    const value = promptInput?.value || project().ugc?.script || "";
    updateVideoPromptLocal(value);
    const current = project();
    return {
      prompt: value,
      model: videoModelValue(current),
      aspectRatio: videoAspectRatioValue(current),
      resolution: videoQualityValue(current),
      duration: videoDurationValue(current).match(/\d+/)?.[0] || "8",
      audio: videoAudioValue(current),
      advancePrompt: Boolean(state.promptAdvancedEnabled)
    };
  }
  if (name !== "generate-image") return {};
  const promptInput = document.querySelector("[data-image-console-prompt]");
  const value = promptInput?.value || project().image?.prompt || "";
  updateImagePromptLocal(value);
  const current = project();
  return {
    prompt: value,
    model: current.image?.model || "GPT Image 2",
    aspectRatio: current.image?.aspectRatio || "9:16",
    resolution: current.image?.resolution || "1K",
    count: imageBatchCount(current),
    advancePrompt: Boolean(state.promptAdvancedEnabled)
  };
}

async function pollGenerationQueue(attempt = 0) {
  if (document.hidden) {
    state.queuePolling = false;
    clearTimeout(generationPollTimer);
    return;
  }
  if (state.queuePolling && attempt === 0) return;
  clearTimeout(generationPollTimer);
  state.queuePolling = true;
  try {
    const nextDb = await fetchGenerationRefreshDb();
    const shouldRender = shouldRenderGenerationRefresh(state.db, nextDb);
    if (shouldRender) {
      const patchedWall = patchStudioResultWallFromDb(nextDb);
      if (!patchedWall) set({ db: nextDb });
    }
    else {
      state.db = nextDb;
      patchStudioGenerationCardsFromDb(nextDb);
      updateGenerationStatusInDom(nextDb);
    }
    const db = nextDb;
    const hasRunning = db.generationJobs.some((job) => ["queued", "processing"].includes(job.status));
    if (hasRunning && attempt < 240) {
      scheduleGenerationPoll(attempt + 1, db);
      return;
    }
  } catch (error) {
    notify(error.message);
  }
  state.queuePolling = false;
}

async function fetchGenerationRefreshDb() {
  if (!state.projectId || !state.db) return api("/state");
  try {
    const cacheKey = state.projectId;
    const headers = {};
    if (generationStateEtags.has(cacheKey)) headers["If-None-Match"] = generationStateEtags.get(cacheKey);
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    if (state.adminKey) headers["X-Admin-Key"] = state.adminKey;
    const response = await fetch(`${apiBaseUrl}/api/projects/${encodeURIComponent(state.projectId)}/generation-state`, { headers });
    if (response.status === 304) return state.db;
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed");
    const nextEtag = response.headers.get("etag");
    if (nextEtag) generationStateEtags.set(cacheKey, nextEtag);
    const payload = await response.json();
    return mergeGenerationRefreshState(state.db, payload);
  } catch (error) {
    console.warn("Lightweight generation refresh failed; falling back to full state.", error);
    return api("/state");
  }
}

function mergeGenerationRefreshState(previousDb, payload = {}) {
  if (!previousDb || !payload.project?.id) return previousDb;
  const projectId = payload.project.id;
  const projectJobs = Array.isArray(payload.generationJobs) ? payload.generationJobs : [];
  return {
    ...previousDb,
    billing: payload.billing || previousDb.billing,
    projects: (previousDb.projects || []).map((projectItem) => projectItem.id === projectId
      ? {
          ...projectItem,
          resultCount: payload.project.resultCount || projectItem.resultCount,
          results: mergeProjectResults(projectItem.results || [], payload.project.results || [])
        }
      : projectItem),
    generationJobs: [
      ...(previousDb.generationJobs || []).filter((job) => job.projectId !== projectId),
      ...projectJobs
    ]
  };
}

function preserveActiveGenerationState(incomingDb, currentDb = state.db, projectId = state.projectId) {
  if (!incomingDb || !currentDb || !projectId) return incomingDb || currentDb;
  const currentJobs = (currentDb.generationJobs || []).filter((job) => job.projectId === projectId);
  const incomingJobs = (incomingDb.generationJobs || []).filter((job) => job.projectId === projectId);
  const hasActiveLocalJobs = currentJobs.some((job) => ["queued", "processing"].includes(job.status));
  if (!hasActiveLocalJobs || incomingJobs.length >= currentJobs.length) return incomingDb;
  const currentProject = (currentDb.projects || []).find((item) => item.id === projectId);
  return {
    ...incomingDb,
    projects: (incomingDb.projects || []).map((item) => item.id === projectId && currentProject
      ? {
          ...item,
          results: mergeProjectResults(item.results || [], currentProject.results || []),
          resultCount: Math.max(Number(item.resultCount || 0), Number(currentProject.resultCount || 0))
        }
      : item),
    generationJobs: [
      ...(incomingDb.generationJobs || []).filter((job) => job.projectId !== projectId),
      ...currentJobs
    ],
    billing: incomingDb.billing || currentDb.billing
  };
}

function mergeProjectResults(existing = [], incoming = []) {
  const byId = new Map();
  [...existing, ...incoming].forEach((item) => {
    if (item?.id) byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
  });
  return [...byId.values()].sort((a, b) => {
    const aTime = Date.parse(a.timelineAt || a.createdAt || 0);
    const bTime = Date.parse(b.timelineAt || b.createdAt || 0);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return aTime - bTime;
    const aBatch = Number(a.batchIndex || 9999);
    const bBatch = Number(b.batchIndex || 9999);
    if (Number.isFinite(aBatch) && Number.isFinite(bBatch) && aBatch !== bBatch) return aBatch - bBatch;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function hasRunningGenerationJobs(db = state.db) {
  return (db?.generationJobs || []).some((job) => ["queued", "processing"].includes(job.status));
}

function generationPollDelay(attempt = 0, db = state.db) {
  const runningCount = (db?.generationJobs || []).filter((job) => ["queued", "processing"].includes(job.status)).length;
  if (runningCount > 1 && attempt < 6) return 1800;
  if (attempt < 2) return 1500;
  if (attempt < 12) return 3000;
  return 5000;
}

function scheduleGenerationPoll(attempt = 0, db = state.db) {
  clearTimeout(generationPollTimer);
  if (document.hidden) {
    state.queuePolling = false;
    return;
  }
  generationPollTimer = setTimeout(() => pollGenerationQueue(attempt), generationPollDelay(attempt, db));
}

function generationResultSignature(db = state.db) {
  return (db?.projects || [])
    .map((projectItem) => `${projectItem.id}:${(projectItem.results || []).map((item) => [
      item.id,
      item.generationJobId || "",
      item.timelineAt || "",
      item.batchIndex || "",
      item.batchCount || ""
    ].join(":")).join(",")}`)
    .join("|");
}

function generationJobTerminal(status = "") {
  return ["succeeded", "failed", "cancelled"].includes(status);
}

function shouldRenderGenerationRefresh(previousDb, nextDb) {
  if (!previousDb || !nextDb) return true;
  if (generationResultSignature(previousDb) !== generationResultSignature(nextDb)) return true;
  const previousJobs = new Map((previousDb.generationJobs || []).map((job) => [job.id, job]));
  const nextJobs = nextDb.generationJobs || [];
  if (previousJobs.size !== nextJobs.length) return true;
  return nextJobs.some((job) => {
    const previous = previousJobs.get(job.id);
    if (!previous) return true;
    if (previous.status === job.status) return false;
    if (job.status === "failed" || previous.status === "failed") return false;
    return generationJobTerminal(previous.status) || generationJobTerminal(job.status);
  });
}

function patchStudioGenerationCardsFromDb(nextDb) {
  if (state.page !== "project" || !state.projectId || !nextDb) return false;
  let patched = false;
  const jobs = new Map((nextDb.generationJobs || []).map((job) => [job.id, job]));
  withStableStudioWallMutation(() => {
    document.querySelectorAll(".studio-wall-pending[data-generation-job-id]").forEach((card) => {
      const job = jobs.get(card.dataset.generationJobId);
      if (!job) return;
      const currentStatus = card.dataset.generationJobStatus || "";
      if (currentStatus === (job.status || "queued")) return;
      const orderIndex = Number(card.dataset.wallOrder || getComputedStyle(card).order || 0);
      card.outerHTML = studioPendingWallCard(job, Number.isFinite(orderIndex) ? orderIndex : 0);
      patched = true;
    });
  });
  if (patched) window.lucide?.createIcons();
  return patched;
}

function withStableStudioWallMutation(callback) {
  const shell = document.querySelector(".image-higgsfield-mode, .studio-immersive-page");
  const wall = shell?.querySelector(".studio-result-wall");
  if (!wall) return callback();
  const previousMinHeight = wall.style.minHeight;
  const currentHeight = Math.ceil(wall.getBoundingClientRect().height);
  if (currentHeight > 0) wall.style.minHeight = `${currentHeight}px`;
  shell.classList.add("is-studio-wall-patching");
  try {
    return callback();
  } finally {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shell.classList.remove("is-studio-wall-patching");
        const nextWall = shell.querySelector(".studio-result-wall");
        if (nextWall) nextWall.style.minHeight = previousMinHeight;
      });
    });
  }
}

function patchStudioResultWallFromDb(nextDb) {
  if (state.page !== "project" || !state.projectId || !nextDb) return false;
  const shell = document.querySelector(".image-higgsfield-mode, .studio-immersive-page");
  if (!shell) return false;
  const nextProject = (nextDb.projects || []).find((item) => item.id === state.projectId);
  if (!nextProject) return false;
  state.db = nextDb;
  const wallHtml = studioResultWall(nextProject, studioStepMeta(state.step));
  withStableStudioWallMutation(() => {
    const existingWall = shell.querySelector(".studio-result-wall");
    if (existingWall) {
      if (wallHtml) existingWall.outerHTML = wallHtml;
      else existingWall.remove();
    } else if (wallHtml) {
      const dock = shell.querySelector(".image-generate-console, .studio-generate-dock");
      if (dock) dock.insertAdjacentHTML("beforebegin", wallHtml);
      else shell.insertAdjacentHTML("afterbegin", wallHtml);
    }
  });
  window.lucide?.createIcons();
  bindStudioWallInfiniteScroll();
  return true;
}

function updateGenerationStatusInDom(db = state.db) {
  const jobs = new Map((db?.generationJobs || []).map((job) => [job.id, job]));
  document.querySelectorAll("[data-generation-job-id]").forEach((card) => {
    const job = jobs.get(card.dataset.generationJobId);
    if (!job) return;
    card.dataset.generationJobStatus = job.status || "queued";
    card.dataset.agentJobStatus = job.status || "queued";
    card.dataset.generationJobStage = generationJobStatusKey(job);
    const label = card.matches(".agent-generation-processing-frame")
      ? card.querySelector("strong")
      : card.querySelector(".agent-generation-processing-frame strong, b");
    if (label) label.textContent = generationJobStatusLabel(job);
    const wallCenterLabel = card.matches(".studio-wall-pending")
      ? card.querySelector(".studio-wall-pending-controls > b")
      : null;
    if (wallCenterLabel && ["queued", "processing"].includes(job.status)) {
      wallCenterLabel.textContent = generationJobCenterLabel(job);
    }
    const wallSummary = card.matches(".studio-wall-pending")
      ? card.querySelector(".studio-wall-pending-copy small")
      : null;
    if (wallSummary && ["queued", "processing"].includes(job.status)) {
      wallSummary.textContent = generationJobStageHelp(job);
    }
    const wallTimer = card.matches(".studio-wall-pending")
      ? card.querySelector(".studio-wall-pending-top em")
      : null;
    if (wallTimer) {
      const wait = generationJobWaitSeconds(job);
      wallTimer.textContent = wait ? `${wait}s` : "Just now";
      card.classList.toggle("is-long-wait", wait >= 45 && !["failed", "cancelled"].includes(job.status));
    }
    const frameSummary = card.matches(".agent-generation-processing-frame")
      ? card.querySelector("span")
      : card.querySelector(".agent-generation-processing-frame span");
    const nextSummary = generationJobStageHelp(job);
    if (frameSummary && ["queued", "processing"].includes(job.status)) {
      frameSummary.textContent = nextSummary;
    }
    if (card.matches(".agent-generation-card")) {
      const headerSummary = card.querySelector("header span");
      if (headerSummary && ["queued", "processing"].includes(job.status)) headerSummary.textContent = nextSummary;
    }
    const title = card.matches(".agent-generation-card") ? card.querySelector("header strong") : null;
    if (title && ["queued", "processing"].includes(job.status)) {
      const titleText = job.type === "video" ? "视频生成中" : job.type === "image" ? "图片生成中" : "生成中";
      title.innerHTML = `${icon(job.type === "video" ? "video" : job.type === "image" ? "image" : "sparkles", 16)} ${esc(titleText)}`;
    }
  });
  window.lucide?.createIcons();
}

function rememberAgentMessages(messages) {
  const safeMessages = agentMessagesForStorage(messages);
  const overflow = safeMessages.slice(0, Math.max(0, safeMessages.length - 10));
  if (overflow.length) rememberAgentContextSummary(overflow);
  localStorage.setItem(storageKeys.agentMessages, JSON.stringify(safeMessages.slice(-10)));
  state.agentContextSummary = readAgentContextSummary();
}

function rememberAgentActiveRun(messages = state.agentMessages) {
  const safeMessages = agentMessagesForStorage(messages);
  const payload = {
    chatId: state.activeAgentHistoryId || "",
    signature: agentHistoryMessagesSignature(safeMessages),
    startedAt: Date.now()
  };
  localStorage.setItem(storageKeys.agentActiveRun, JSON.stringify(payload));
  state.agentRecoveredRun = payload;
  return payload;
}

function clearAgentActiveRun() {
  localStorage.removeItem(storageKeys.agentActiveRun);
  state.agentRecoveredRun = null;
}

function rememberAgentHistorySessions(sessions = [], options = {}) {
  const incomingSessions = normalizeAgentHistorySessions(sessions);
  const shouldReplace = options.replace === true;
  const safeSessions = shouldReplace
    ? incomingSessions
    : normalizeAgentHistorySessions([
        ...incomingSessions,
        ...(state.agentHistorySessions || []),
        ...readStoredJson(storageKeys.agentHistoryBackup, [])
      ]);
  localStorage.setItem(agentHistoryStorageKey, JSON.stringify(safeSessions));
  localStorage.setItem(storageKeys.agentHistoryBackup, JSON.stringify(safeSessions));
  state.agentHistorySessions = safeSessions;
  return safeSessions;
}

function mergeAgentHistorySessionInPlace(session = {}) {
  if (!session?.id) return state.agentHistorySessions || [];
  const sessions = normalizeAgentHistorySessions(state.agentHistorySessions || []);
  const index = sessions.findIndex((item) => item.id === session.id);
  const nextSessions = index >= 0
    ? sessions.map((item) => item.id === session.id ? { ...item, ...session } : item)
    : [session, ...sessions];
  return rememberAgentHistorySessions(nextSessions, { replace: true });
}

function agentChatIsActive(id = "") {
  return Boolean(id) && String(state.activeAgentHistoryId || "") === String(id);
}

function saveAgentHistoryMessagesForSession(id = "", messages = [], patch = {}, options = {}) {
  const chatId = String(id || "");
  const safeMessages = agentMessagesForStorage(messages);
  if (!chatId || !safeMessages.length) return null;
  const sessions = normalizeAgentHistorySessions(state.agentHistorySessions || []);
  const existing = sessions.find((item) => item.id === chatId) || {};
  const session = {
    ...existing,
    ...patch,
    id: chatId,
    title: String(existing.title || patch.title || "").trim()
      ? (existing.title || patch.title)
      : agentHistoryTitleFromMessages(safeMessages),
    isolatedContext: Boolean(existing.isolatedContext || patch.isolatedContext),
    updatedAt: new Date().toISOString(),
    messages: safeMessages
  };
  mergeAgentHistorySessionInPlace(session);
  if (options.persist !== false) persistAgentChatSession(session);
  return session;
}

function migrateAgentHistorySessions() {
  const current = Array.isArray(state.agentHistorySessions) ? state.agentHistorySessions : [];
  const normalized = normalizeAgentHistorySessions(current);
  if (normalized.length !== current.length || JSON.stringify(normalized) !== JSON.stringify(current)) {
    rememberAgentHistorySessions(normalized);
  }
  return normalized;
}

function hydrateAgentChatIdentity() {
  const sessions = migrateAgentHistorySessions();
  const messages = agentMessagesForStorage(state.agentMessages);
  if (!messages.length) {
    state.activeAgentHistoryId = null;
    if (!state.activeAgentDraftId) state.activeAgentDraftId = createAgentDraftId();
    return;
  }
  const urlChatId = agentChatIdFromUrl();
  const existing = sessions.find((item) => item.id === urlChatId || item.id === state.activeAgentHistoryId);
  state.activeAgentHistoryId = existing?.id || state.activeAgentHistoryId || null;
  if (state.activeAgentHistoryId) {
    state.activeAgentDraftId = "";
    localStorage.removeItem(storageKeys.agentDraftId);
  }
}

function hydrateAgentChatsFromBackend() {
  const backendChats = normalizeAgentHistorySessions(state.db?.agentChats || []);
  if (!backendChats.length) return;
  const localChats = normalizeAgentHistorySessions(state.agentHistorySessions || []);
  rememberAgentHistorySessions([...backendChats, ...localChats]);
}

function agentChatUrl(id = "") {
  return id ? `/studio/agent/chat/${encodeURIComponent(id)}` : "/studio/agent";
}

function agentChatIdFromUrl() {
  const match = window.location.pathname.match(/^\/studio\/agent\/chat\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function syncAgentChatUrl(id = "", options = {}) {
  if (!window.location.pathname.startsWith("/studio/agent")) return;
  const next = agentChatUrl(id);
  if (window.location.pathname === next) return;
  window.history[options.replace ? "replaceState" : "pushState"]({}, "", next);
}

function normalizeAgentHistorySessions(sessions = []) {
  const seenIds = new Set();
  const safeSessions = [];
  for (const item of Array.isArray(sessions) ? sessions : []) {
    if (!item?.id || !Array.isArray(item.messages) || !item.messages.length || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    safeSessions.push(item);
    if (safeSessions.length >= agentHistoryLimit) break;
  }
  return safeSessions;
}

function agentHistoryMessagesSignature(messages = []) {
  const compact = agentMessagesForStorage(messages).map((item) => ({
    role: item.role,
    content: String(item.content || "").replace(/\s+/g, " ").trim(),
    attachments: Array.isArray(item.attachments) ? item.attachments.map((attachment) => `${attachment.kind || ""}:${attachment.name || ""}:${attachment.size || ""}`) : [],
    run: item.agentRun?.id || item.agentRun?.status || ""
  }));
  return compact.length ? JSON.stringify(compact) : "";
}

function createAgentHistorySessionId() {
  return `agent_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createAgentDraftId() {
  const id = `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKeys.agentDraftId, id);
  state.activeAgentDraftId = id;
  clearAgentContextSummary(id);
  return id;
}

function agentContextScopeId() {
  return state.activeAgentHistoryId || state.activeAgentDraftId || "draft";
}

function agentContextSummaryStorageKey(scopeId = "") {
  const id = String(scopeId || "draft").trim() || "draft";
  return `${storageKeys.agentContextSummary}:${id}`;
}

function readAgentContextSummary(scopeId = agentContextScopeId()) {
  return localStorage.getItem(agentContextSummaryStorageKey(scopeId)) || "";
}

function writeAgentContextSummary(value = "", scopeId = agentContextScopeId()) {
  localStorage.setItem(agentContextSummaryStorageKey(scopeId), String(value || ""));
  localStorage.removeItem(storageKeys.agentContextSummary);
}

function clearAgentContextSummary(scopeId = agentContextScopeId()) {
  localStorage.removeItem(agentContextSummaryStorageKey(scopeId));
  localStorage.removeItem(storageKeys.agentContextSummary);
  if (scopeId === agentContextScopeId()) state.agentContextSummary = "";
}

function currentAgentHistorySession(messages = state.agentMessages) {
  const sessions = state.agentHistorySessions || [];
  if (state.activeAgentHistoryId) {
    const existing = sessions.find((item) => item.id === state.activeAgentHistoryId);
    if (existing) return existing;
  }
  return null;
}

function activeAgentHistoryIsIsolated() {
  if (!state.activeAgentHistoryId) return false;
  return Boolean((state.agentHistorySessions || []).find((item) => item.id === state.activeAgentHistoryId)?.isolatedContext);
}

function saveCurrentAgentHistory(messagesOverride = null, options = {}) {
  const messages = agentMessagesForStorage(Array.isArray(messagesOverride) ? messagesOverride : state.agentMessages);
  if (!messages.length) return state.agentHistorySessions;
  const sessions = state.agentHistorySessions || [];
  const signature = agentHistoryMessagesSignature(messages);
  const existing = currentAgentHistorySession(messages);
  const existingSignature = existing ? agentHistoryMessagesSignature(existing.messages) : "";
  const previousSummaryScope = state.activeAgentHistoryId || state.activeAgentDraftId || "";
  if (options.onlyIfChanged && existing && existingSignature === signature) {
    state.activeAgentHistoryId = existing.id;
    return rememberAgentHistorySessions(sessions);
  }
  const session = {
    ...(existing || {}),
    id: existing?.id || createAgentHistorySessionId(),
    title: String(existing?.title || "").trim()
      ? existing.title
      : agentHistoryTitleFromMessages(messages),
    isolatedContext: Boolean(existing?.isolatedContext || options.isolatedContext),
    updatedAt: new Date().toISOString(),
    messages
  };
  const existingIndex = sessions.findIndex((item) => item.id === session.id);
  const nextSessions = existingIndex >= 0
    ? sessions.map((item) => item.id === session.id ? session : item)
    : [session, ...sessions];
  const remembered = rememberAgentHistorySessions(nextSessions, { replace: true });
  state.activeAgentHistoryId = session.id;
  state.activeAgentDraftId = "";
  localStorage.removeItem(storageKeys.agentDraftId);
  if (previousSummaryScope && previousSummaryScope !== session.id && state.agentContextSummary) {
    writeAgentContextSummary(state.agentContextSummary, session.id);
    clearAgentContextSummary(previousSummaryScope);
  }
  syncAgentChatUrl(session.id, { replace: Boolean(options.replaceUrl) });
  persistAgentChatSession(session);
  return remembered;
}

async function persistAgentChatSession(session = {}) {
  if (!state.token || !session.id || pendingAgentChatSync.has(session.id)) return;
  pendingAgentChatSync.add(session.id);
  try {
    const payload = await api("/agent-chats", {
      method: "POST",
      body: JSON.stringify(session)
    });
    if (payload?.state) state.db = payload.state;
    if (payload?.chat) {
      mergeAgentHistorySessionInPlace(payload.chat);
      if (!session.manualTitle && isAutoAgentHistoryTitle(payload.chat.title)) requestAgentChatTitle(payload.chat.id);
    }
  } catch (error) {
    console.warn("Agent chat sync failed", error);
  } finally {
    pendingAgentChatSync.delete(session.id);
  }
}

async function requestAgentChatTitle(id = "") {
  if (!state.token || !id) return;
  try {
    const payload = await api(`/agent-chats/${encodeURIComponent(id)}/title`, { method: "POST" });
    if (payload?.state) state.db = payload.state;
    if (payload?.chat && !payload.chat.manualTitle) {
      mergeAgentHistorySessionInPlace(payload.chat);
      if (state.page === "agent") render();
    }
  } catch (error) {
    console.warn("Agent chat title sync failed", error);
  }
}

function agentHistoryTitleFromMessages(messages = []) {
  return agentHistoryTaskTitleFromMessages(messages);
}

function agentHistoryDisplayTitle(item = {}) {
  if (String(item.title || "").trim()) return String(item.title).trim();
  const messages = Array.isArray(item.messages) ? item.messages : [];
  const generated = agentHistoryTaskTitleFromMessages(messages.length ? messages : [{ role: "user", content: item.title || "" }]);
  return generated || normalizeAgentHistoryTitle(item.title || "Agent chat");
}

function agentHistoryTaskTitleFromMessages(messages = []) {
  const firstUser = messages.find((item) => item.role === "user" && String(item.content || "").trim());
  const firstAssistant = messages.find((item) => item.role === "assistant" && String(item.content || "").trim());
  return naturalAgentHistoryTitle(firstUser?.content || firstAssistant?.content || "Agent chat");
}

function naturalAgentHistoryTitle(value = "") {
  const raw = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const text = raw
    .replace(/^(你好|您好|嗨|哈喽|hello|hi|hey)[,，\s]*/i, "")
    .replace(/^(帮我|请你|请帮我|我要|我想|可以|能不能|麻烦你|can you|could you|please|pls|i want to|i need to)\s*/i, "")
    .replace(/[。！？!?]+$/g, "")
    .trim();
  if (!text) return "Agent Chat";
  if (/^[a-z0-9][a-z0-9\s:._/-]{2,}$/i.test(text)) {
    const words = text.split(/\s+/).filter(Boolean).slice(0, 6);
    const title = words.map((word) => /^(ai|ui|ux|api|ugc|prd)$/i.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
    return title || "Agent Task";
  }
  if (/[㐀-鿿]/.test(text)) return text.slice(0, 16) || "Agent Chat";
  return text.slice(0, 40) || "Agent Chat";
}

function normalizeAgentHistoryTitle(value = "") {
  return naturalAgentHistoryTitle(value);
}

function isAutoAgentHistoryTitle(value = "") {
  const title = String(value || "").trim();
  return !title || /^agent\s+chat$/i.test(title) || /^untitled\s+chat$/i.test(title);
}

function markAgentHistorySelection(id = "") {
  const selectedId = String(id || "");
  if (!selectedId) return;
  state.activeAgentHistoryId = selectedId === agentDraftHistoryId ? null : selectedId;
  document.querySelectorAll("[data-agent-history-row]").forEach((row) => {
    const rowId = row.dataset.agentHistoryRestoreRow || "";
    row.classList.toggle("is-active", rowId === selectedId);
  });
}

function restoreAgentChatFromUrl(options = {}) {
  const id = agentChatIdFromUrl();
  if (!id) {
    if (state.page === "agent" && !state.agentMessages.length) {
      state.activeAgentHistoryId = null;
    }
    return false;
  }
  const session = (state.agentHistorySessions || []).find((item) => item.id === id);
  if (!session) return false;
  restoreAgentHistory(id, options);
  return true;
}

function restoreAgentHistory(id, options = {}) {
  const requestedId = String(id || "");
  const historyBeforeRestore = Array.isArray(state.agentHistorySessions) ? state.agentHistorySessions : [];
  const targetSession = requestedId === agentDraftHistoryId
    ? null
    : historyBeforeRestore.find((item) => item.id === requestedId);
  if (requestedId !== agentDraftHistoryId && !targetSession) return notify("找不到这条历史记录。");
  if (requestedId !== agentDraftHistoryId) {
    saveCurrentAgentHistory(null, { onlyIfChanged: true });
    rememberAgentHistorySessions([...(state.agentHistorySessions || []), ...historyBeforeRestore]);
  }
  markAgentHistorySelection(id);
  if (id === agentDraftHistoryId) {
    clearAgentTypingTimer();
    clearAgentActiveRun();
    localStorage.removeItem(storageKeys.agentMessages);
    const activeAgentDraftId = createAgentDraftId();
    clearAgentContextSummary(activeAgentDraftId);
    return set({
      page: "agent",
      agentMessages: [],
      agentInput: "",
      agentAttachments: [],
      agentQueue: [],
      agentBusy: false,
      agentTyping: false,
      agentRecoveredRun: null,
      agentExpandedMessages: {},
      agentContextSummary: "",
      activeAgentHistoryId: null,
      activeAgentDraftId,
      agentHistoryOpen: false
    });
  }
  const messages = agentMessagesForStorage(targetSession.messages);
  clearAgentTypingTimer();
  localStorage.setItem(storageKeys.agentMessages, JSON.stringify(messages));
  Object.assign(state, {
    page: "agent",
    agentMessages: messages,
    agentInput: "",
    agentAttachments: [],
    agentQueue: [],
    agentBusy: false,
    agentTyping: false,
    agentExpandedMessages: {},
    agentContextSummary: readAgentContextSummary(id),
    activeAgentHistoryId: id,
    agentHistoryOpen: false,
    agentDebugOpen: false
  });
  syncAgentChatUrl(id, { replace: options.replace });
  render();
  if (!options.quiet) notify("已恢复历史对话。");
  scrollAgentThreadToBottom();
}

function deleteAgentHistory(id) {
  const sessions = (state.agentHistorySessions || []).filter((item) => item.id !== id);
  rememberAgentHistorySessions(sessions, { replace: true });
  deleteAgentChatBackend(id);
  notify("已删除这条历史记录。");
  set({ agentHistorySessions: sessions, activeAgentHistoryId: state.activeAgentHistoryId === id ? null : state.activeAgentHistoryId, agentHistoryEditingId: null });
  if (state.activeAgentHistoryId === id || window.location.pathname === agentChatUrl(id)) syncAgentChatUrl("", { replace: true });
}

function renameAgentHistory(id, title, options = {}) {
  const nextTitle = String(title || "").replace(/\s+/g, " ").trim().slice(0, 64);
  const sessions = state.agentHistorySessions || [];
  const session = sessions.find((item) => item.id === id);
  if (!session) return set({ agentHistoryEditingId: null });
  if (!nextTitle) {
    if (!options.quiet) notify("对话名字不能为空。");
    return set({ agentHistoryEditingId: null });
  }
  if (nextTitle === (session.title || "Untitled chat") && session.manualTitle) return set({ agentHistoryEditingId: null });
  const renamed = sessions.map((item) => item.id === id ? { ...item, title: nextTitle, manualTitle: true, updatedAt: new Date().toISOString() } : item);
  rememberAgentHistorySessions(renamed, { replace: true });
  renameAgentChatBackend(id, nextTitle);
  if (!options.quiet) notify("已重命名对话。");
  return set({ agentHistorySessions: renamed, agentHistoryEditingId: null });
}

async function deleteAgentChatBackend(id = "") {
  if (!state.token || !id) return;
  try {
    const db = await api(`/agent-chats/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.db = db;
  } catch (error) {
    console.warn("Agent chat delete sync failed", error);
  }
}

async function renameAgentChatBackend(id = "", title = "") {
  if (!state.token || !id || !title) return;
  try {
    const payload = await api(`/agent-chats/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    });
    if (payload?.state) state.db = payload.state;
    if (payload?.chat) mergeAgentHistorySessionInPlace(payload.chat);
  } catch (error) {
    console.warn("Agent chat rename sync failed", error);
  }
}

function agentMessagesForStorage(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((item) => ["user", "assistant"].includes(item.role))
    .map((item) => ({
      role: item.role,
      content: String(item.content || "").slice(0, 1600),
      ...(item.clientMessageId ? { clientMessageId: String(item.clientMessageId).slice(0, 100) } : {}),
      ...(Array.isArray(item.attachments) && item.attachments.length ? { attachments: item.attachments.map(agentAttachmentForStorage) } : {}),
      ...(item.agentRun ? { agentRun: compactAgentRunForStorage(item.agentRun) } : {})
    }));
}

function agentAttachmentForStorage(item = {}) {
  const videoPreview = item.kind === "video" && item.previewUrl && !String(item.previewUrl).startsWith("blob:") ? item.previewUrl : "";
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    kind: item.kind,
    previewUrl: item.kind === "image" ? item.previewUrl || item.dataUrl || "" : videoPreview,
    ...(Array.isArray(item.keyframes) && item.keyframes.length ? { keyframes: item.keyframes.map(agentKeyframeForStorage) } : {})
  };
}

function agentKeyframeForStorage(frame = {}) {
  return {
    time: Number(frame.time || 0),
    dataUrl: frame.dataUrl || ""
  };
}

function compactAgentRunForStorage(run) {
  return {
    id: run.id,
    status: run.status,
    intent: run.intent,
    confirmation: run.confirmation || null,
    plan: Array.isArray(run.plan) ? run.plan.slice(0, 6) : [],
    cards: Array.isArray(run.cards) ? run.cards.slice(0, 4).map(compactAgentCardForStorage) : [],
    toolResults: Array.isArray(run.toolResults)
      ? run.toolResults.slice(0, 4).map((item) => ({
        name: item.name,
        argsSummary: item.argsSummary || {},
        result: {
          ok: Boolean(item.result?.ok),
          message: String(item.result?.message || item.result?.error || "").slice(0, 240)
        },
        card: item.card ? compactAgentCardForStorage(item.card) : undefined
      }))
      : []
  };
}

function compactAgentCardForStorage(card = {}) {
  return {
    type: card.type,
    title: card.title,
    summary: card.summary,
    projectId: card.projectId,
    jobId: card.jobId,
    resultType: card.resultType,
    aspectRatio: card.aspectRatio,
    resultId: card.resultId,
    scheduleIds: card.scheduleIds,
    prompt: typeof card.prompt === "string" ? card.prompt.slice(0, 600) : undefined,
    plan: Array.isArray(card.plan) ? card.plan.slice(0, 3) : undefined,
    schedule: card.schedule ? {
      total: card.schedule.total,
      ready: card.schedule.ready,
      draft: card.schedule.draft,
      latest: Array.isArray(card.schedule.latest) ? card.schedule.latest.slice(0, 3) : []
    } : undefined
  };
}

function rememberAgentContextSummary(messages = []) {
  const previous = state.agentContextSummary || readAgentContextSummary() || "";
  const lines = messages.map((item) => {
    const text = String(item.content || "").replace(/\s+/g, " ").slice(0, 180);
    return `${item.role === "user" ? "User" : "Agent"}: ${text}`;
  }).filter(Boolean);
  const next = [
    previous,
    lines.length ? `Recent compressed context (${new Date().toLocaleDateString()}): ${lines.join(" | ")}` : ""
  ].filter(Boolean).join("\n").slice(-1800);
  writeAgentContextSummary(next);
  state.agentContextSummary = next;
}

function applyAgentUiActions(uiActions = [], db) {
  const patch = {};
  for (const item of uiActions) {
    if (state.page !== "agent" && item.page) patch.page = item.page;
    if (state.page !== "agent" && item.step) patch.step = item.step;
    if (item.projectId && db?.projects?.some((project) => project.id === item.projectId)) patch.projectId = item.projectId;
  }
  return patch;
}

function scheduleAgentVisual(patch, delay) {
  clearTimeout(agentVisualTimer);
  agentVisualTimer = setTimeout(() => set(patch), delay);
}

function startAgentWorkingTimer() {
  clearTimeout(agentWorkingTimer);
  set({ agentBusyStartedAt: Date.now(), agentWorkingTick: 0 });
  scheduleNextAgentWorkingTick();
}

function scheduleNextAgentWorkingTick() {
  const elapsed = state.agentBusyStartedAt ? Date.now() - state.agentBusyStartedAt : 0;
  const nextPhaseAt = [1100, 2600, 4600, 8100].find((ms) => ms > elapsed);
  if (!nextPhaseAt) {
    agentWorkingTimer = null;
    return;
  }
  agentWorkingTimer = setTimeout(() => {
    if (!state.agentBusy) {
      agentWorkingTimer = null;
      return;
    }
    set({ agentWorkingTick: state.agentWorkingTick + 1 });
    scheduleNextAgentWorkingTick();
  }, Math.max(250, nextPhaseAt - elapsed));
}

function stopAgentWorkingTimer() {
  clearTimeout(agentWorkingTimer);
  agentWorkingTimer = null;
  set({ agentBusyStartedAt: 0, agentWorkingTick: 0 });
}

function clearAgentTypingTimer() {
  clearTimeout(agentTypingTimer);
  agentTypingTimer = null;
  agentTypingRunId += 1;
}

function stopAgentResponse() {
  if (!state.agentBusy && !state.agentTyping) return;
  agentAbortController?.abort();
  agentAbortController = null;
  clearAgentTypingTimer();
  clearTimeout(agentVisualTimer);
  agentVisualTimer = null;
  clearTimeout(agentWorkingTimer);
  agentWorkingTimer = null;
  const messages = (state.agentMessages || []).filter((item) => !item.isTyping);
  rememberAgentMessages(messages);
  saveCurrentAgentHistory(messages);
  clearAgentActiveRun();
  set({
    agentMessages: messages,
    agentBusy: false,
    agentTyping: false,
    agentRecoveredRun: null,
    agentQueue: [],
    agentBusyStartedAt: 0,
    agentWorkingTick: 0,
    agentTaskMode: "idle",
    agentVisualPhase: "idle",
    agentIdleActivity: "sleep"
  });
  notify("Agent stopped.");
}

function agentTypingChunkSize(length = 0) {
  if (length > 1600) return 8;
  if (length > 900) return 5;
  if (length > 420) return 3;
  return 2;
}

function typeAgentReply({ baseMessages, assistantMessage, fullContent, finalPatch = {}, onDone = () => {} }) {
  clearAgentTypingTimer();
  const runId = agentTypingRunId;
  const chars = [...String(fullContent || "Done.")];
  const chunkSize = agentTypingChunkSize(chars.length);
  const delay = chars.length > 900 ? 24 : 30;
  const finalAssistantMessage = { ...assistantMessage, content: chars.join(""), isTyping: false };
  const initialAssistantMessage = { ...assistantMessage, content: "", isTyping: true };
  const messageIndex = baseMessages.length;
  let index = 0;

  set({ ...finalPatch, agentMessages: [...baseMessages, initialAssistantMessage], agentTyping: true });

  const target = document.querySelector(`.agent-thread article.assistant[data-agent-message-index="${messageIndex}"] .agent-message`);
  const paintPartial = () => {
    if (!target) return;
    const partial = chars.slice(0, index).join("");
    target.innerHTML = agentMessageMarkdown(`${partial}▍`);
  };

  const finish = () => {
    if (runId !== agentTypingRunId) return;
    const messages = [...baseMessages, finalAssistantMessage];
    rememberAgentMessages(messages);
    saveCurrentAgentHistory(messages);
    clearAgentActiveRun();
    set({ ...finalPatch, agentMessages: messages, agentBusy: false, agentTyping: false, agentRecoveredRun: null });
    agentTypingTimer = null;
    onDone(messages);
  };

  const tick = () => {
    if (runId !== agentTypingRunId) return;
    index = Math.min(chars.length, index + chunkSize);
    if (index >= chars.length) return finish();
    paintPartial();
    agentTypingTimer = setTimeout(tick, delay);
  };

  agentTypingTimer = setTimeout(tick, 80);
}

function startAgentVisual(content) {
  const taskMode = agentWorkMode(content);
  const isChatOnly = taskMode === "command";
  const startPhase = "wake";
  set({ agentTaskMode: taskMode, agentVisualPhase: startPhase });
  scheduleAgentVisual({ agentTaskMode: isChatOnly ? "chat" : taskMode, agentVisualPhase: isChatOnly ? "chatting" : "walking" }, 700);
  setTimeout(() => {
    if (state.agentBusy && !isChatOnly) set({ agentTaskMode: taskMode, agentVisualPhase: "working" });
  }, 1900);
}

function completeAgentVisual() {
  clearTimeout(agentVisualTimer);
  clearTimeout(agentWorkingTimer);
  agentWorkingTimer = null;
  set({ agentVisualPhase: "done" });
  setTimeout(() => set({ agentVisualPhase: "returning" }), 1100);
  setTimeout(() => {
    if (!state.agentBusy) set({ agentVisualPhase: "idle", agentTaskMode: "idle", agentIdleActivity: "sleep", agentBusyStartedAt: 0, agentWorkingTick: 0 });
  }, 2400);
}

async function addAgentAttachments(fileList) {
  const files = Array.from(fileList || []).filter((file) => /^image\//.test(file.type) || /^video\//.test(file.type));
  if (!files.length) return notify("Please attach an image or video.");
  const slots = Math.max(0, 4 - (state.agentAttachments || []).length);
  if (!slots) return notify("Agent can read up to 4 attachments at a time.");
  const prepared = [];
  for (const file of files.slice(0, slots)) {
    try {
      prepared.push(await prepareAgentAttachment(file));
    } catch (error) {
      notify(error.message || "Attachment could not be added.");
    }
  }
  if (prepared.length) set({ agentAttachments: [...(state.agentAttachments || []), ...prepared] });
}

async function handleAgentInputPaste(event) {
  const files = agentClipboardFiles(event.clipboardData);
  if (!files.length) return;
  event.preventDefault();
  const form = event.currentTarget.closest(".agent-form");
  form?.classList.add("is-pasting");
  try {
    await addAgentAttachments(files);
  } finally {
    window.setTimeout(() => form?.classList.remove("is-pasting"), 260);
  }
}

function agentClipboardFiles(clipboardData) {
  const items = Array.from(clipboardData?.items || []);
  const files = items
    .filter((item) => item.kind === "file" && (/^image\//.test(item.type) || /^video\//.test(item.type)))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (files.length) return files;
  return Array.from(clipboardData?.files || []).filter((file) => /^image\//.test(file.type) || /^video\//.test(file.type));
}

function agentPastedFilename(file, kind) {
  if (file.name && !/^image\.(png|jpe?g|webp|gif)$/i.test(file.name)) return file.name;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || (kind === "video" ? "mp4" : "jpg");
  return `pasted-${kind}-${stamp}.${extension}`;
}

async function prepareAgentAttachment(file) {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  if (kind === "video" && file.size > 80 * 1024 * 1024) throw new Error("Video is too large. Use a file below 80 MB.");
  if (kind === "image" && file.size > 18 * 1024 * 1024) throw new Error("Image is too large. Use a file below 18 MB.");
  const base = {
    id: `att_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: agentPastedFilename(file, kind),
    type: file.type || kind,
    size: file.size,
    kind
  };
  if (kind === "video") {
    const previewUrl = URL.createObjectURL(file);
    const keyframes = await videoFileToKeyframes(file, previewUrl);
    return { ...base, previewUrl: keyframes[0]?.dataUrl || previewUrl, objectUrl: previewUrl, keyframes };
  }
  const dataUrl = await imageFileToDataUrl(file);
  return { ...base, dataUrl, previewUrl: dataUrl };
}

function removeAgentAttachment(id) {
  const current = state.agentAttachments || [];
  const removed = current.find((item) => item.id === id);
  if (removed?.objectUrl?.startsWith("blob:")) URL.revokeObjectURL(removed.objectUrl);
  if (removed?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
  set({ agentAttachments: current.filter((item) => item.id !== id) });
}

function videoFileToKeyframes(file, objectUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };
    const fail = () => {
      cleanup();
      reject(new Error("Could not read video frames."));
    };
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onerror = fail;
    video.onloadedmetadata = async () => {
      try {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const count = duration >= 20 ? 8 : duration >= 8 ? 6 : 5;
        const times = Array.from({ length: count }, (_, index) => {
          const ratio = count === 1 ? 0.5 : (index + 0.5) / count;
          return Math.max(0, Math.min(Math.max(0, duration - 0.12), duration * ratio));
        });
        const frames = [];
        for (const time of times) {
          const dataUrl = await captureVideoFrame(video, time);
          frames.push({ time: Number(time.toFixed(2)), dataUrl });
        }
        cleanup();
        resolve(frames);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    video.src = objectUrl || URL.createObjectURL(file);
  });
}

function captureVideoFrame(video, time) {
  return new Promise((resolve, reject) => {
    const done = () => {
      try {
        const maxSide = 640;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.68));
      } catch (error) {
        reject(error);
      }
    };
    video.onseeked = done;
    video.onerror = () => reject(new Error("Could not seek video."));
    video.currentTime = time;
  });
}

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not preview image."));
      image.onload = () => {
        const maxSide = 960;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function sendAgentMessage(message, queuedAttachments = null) {
  const content = String(message || state.agentInput || "").trim();
  const attachments = Array.isArray(queuedAttachments) ? queuedAttachments : Array.isArray(state.agentAttachments) ? state.agentAttachments : [];
  const pendingRun = latestPendingAgentConfirmation();
  if (pendingRun && !attachments.length && isAgentConfirmIntent(content)) {
    set({ agentInput: "" });
    openAgentConfirmModal(pendingRun.id);
    return notify("请在确认弹窗里检查模型和 credits 后再生成。");
  }
  if (!content && !attachments.length) return;
  if (state.agentBusy) return enqueueAgentMessage(content, attachments);
  return runAgentMessage(content, attachments);
}

function enqueueAgentMessage(content, attachments = []) {
  const userContent = content || "请先看我上传的附件，然后判断下一步应该怎么做。";
  set({
    agentQueue: [
      ...(state.agentQueue || []),
      {
        id: `queue_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        content: userContent,
        attachments: attachments.map(agentAttachmentForStorage),
        apiAttachments: attachments.map(agentAttachmentForApi)
      }
    ],
    agentInput: "",
    agentAttachments: []
  });
}

function processAgentQueue() {
  if (state.agentBusy || !(state.agentQueue || []).length) return;
  const [next, ...rest] = state.agentQueue;
  state.agentQueue = rest;
  runAgentMessage(next.content, next.attachments || [], next.apiAttachments || null);
}

async function runAgentMessage(message, attachments = [], queuedApiAttachments = null) {
  const content = String(message || "").trim();
  if (!content && !attachments.length) return;
  clearAgentTypingTimer();
  agentAbortController?.abort();
  agentAbortController = new AbortController();
  const requestController = agentAbortController;
  const userContent = content || "请先看我上传的附件，然后判断下一步应该怎么做。";
  const isolatedAgentContext = activeAgentHistoryIsIsolated() || (!state.activeAgentHistoryId && !(state.agentMessages || []).length);
  const messageAttachments = attachments.map(agentAttachmentForStorage);
  const apiAttachments = Array.isArray(queuedApiAttachments) ? queuedApiAttachments : attachments.map(agentAttachmentForApi);
  const clientMessageId = `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const nextMessages = [...state.agentMessages, { role: "user", content: userContent, attachments: messageAttachments, clientMessageId }];
  rememberAgentMessages(nextMessages);
  saveCurrentAgentHistory(nextMessages, { isolatedContext: isolatedAgentContext });
  const lockedAgentHistoryId = state.activeAgentHistoryId;
  rememberAgentActiveRun(nextMessages);
  set({ agentMessages: nextMessages, agentInput: "", agentAttachments: [], agentBusy: true, agentTyping: false, agentRecoveredRun: null, activeAgentHistoryId: lockedAgentHistoryId });
  startAgentWorkingTimer();
  startAgentVisual(userContent);
  try {
    const res = await api("/agent", {
      method: "POST",
      signal: requestController.signal,
      body: JSON.stringify({
        messages: nextMessages,
        attachments: apiAttachments,
        chatId: lockedAgentHistoryId,
        clientMessageId,
        contextSummary: isolatedAgentContext ? "" : state.agentContextSummary,
        projectId: isolatedAgentContext ? "" : state.projectId,
        isolatedContext: isolatedAgentContext,
        page: state.page,
        step: state.step
      })
    });
    if (agentAbortController === requestController) agentAbortController = null;
    const db = res.db || state.db;
    const responseChatId = res.chatId || res.agentRun?.chatId || lockedAgentHistoryId;
    const finalAssistantMessage = { role: "assistant", content: res.reply || "Done.", agentRun: res.agentRun || null };
    if (responseChatId !== lockedAgentHistoryId || !agentChatIsActive(lockedAgentHistoryId)) {
      if (res.db) state.db = res.db;
      saveAgentHistoryMessagesForSession(lockedAgentHistoryId, [...nextMessages, finalAssistantMessage], { isolatedContext: isolatedAgentContext });
      if (res.toolResults?.length) notify(t("toastAgentWorkspaceUpdated"));
      if ((db.generationJobs || []).some((job) => ["queued", "processing"].includes(job.status))) pollGenerationQueue();
      window.setTimeout(processAgentQueue, 0);
      return;
    }
    typeAgentReply({
      baseMessages: nextMessages,
      assistantMessage: { ...finalAssistantMessage, content: "" },
      fullContent: finalAssistantMessage.content,
      finalPatch: {
        db,
        agentAttachments: [],
        ...applyAgentUiActions(res.uiActions, db)
      },
      onDone: () => {
        completeAgentVisual();
        if (res.toolResults?.length) notify(t("toastAgentWorkspaceUpdated"));
        if ((db.generationJobs || []).some((job) => ["queued", "processing"].includes(job.status))) pollGenerationQueue();
        window.setTimeout(processAgentQueue, 0);
      }
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    if (agentAbortController === requestController) agentAbortController = null;
    const safeError = agentUserSafeError(error);
    const finalAssistantMessage = { role: "assistant", content: safeError };
    if (!agentChatIsActive(lockedAgentHistoryId)) {
      saveAgentHistoryMessagesForSession(lockedAgentHistoryId, [...nextMessages, finalAssistantMessage], { isolatedContext: isolatedAgentContext });
      window.setTimeout(processAgentQueue, 0);
      return;
    }
    typeAgentReply({
      baseMessages: nextMessages,
      assistantMessage: { ...finalAssistantMessage, content: "" },
      fullContent: safeError,
      onDone: () => {
        completeAgentVisual();
        notify(safeError);
        window.setTimeout(processAgentQueue, 0);
      }
    });
  }
}

function agentAttachmentForApi(item = {}) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    kind: item.kind,
    dataUrl: item.kind === "image" ? item.dataUrl || "" : "",
    keyframes: item.kind === "video" && Array.isArray(item.keyframes) ? item.keyframes.map(agentKeyframeForStorage) : []
  };
}

function recordAgentFeedback(payload = {}) {
  if (!state.token) return;
  api("/agent/feedback", {
    method: "POST",
    body: JSON.stringify({
      projectId: state.projectId || "",
      ...payload
    })
  }).then((res) => {
    if (res.preferences && state.db) state.db.agentPreferences = res.preferences;
  }).catch(() => null);
}

async function clearAgentPreferences() {
  if (!state.token) return;
  const approved = window.confirm("清空 Agent 偏好记忆？这不会删除项目。");
  if (!approved) return;
  try {
    const res = await api("/agent/preferences", { method: "DELETE" });
    if (res.state) set({ db: res.state });
    else if (res.preferences && state.db) set({ db: { ...state.db, agentPreferences: res.preferences } });
    notify("Agent 偏好记忆已清空。");
  } catch (error) {
    notify(error.message);
  }
}

async function saveAgentTemplate(el) {
  if (!state.token || !el) return;
  try {
    const res = await api("/agent/templates", {
      method: "POST",
      body: JSON.stringify({
        type: el.dataset.agentTemplateSave || "agent_output",
        title: el.dataset.templateTitle || "Agent template",
        summary: el.dataset.templateSummary || "",
        content: el.dataset.templateContent || "",
        projectId: state.projectId || ""
      })
    });
    if (res.state) set({ db: res.state });
    notify("已保存为成功模板。");
  } catch (error) {
    notify(error.message);
  }
}

function useAgentTemplate(id) {
  if (!state.token || !id) return;
  api(`/agent/templates/${id}/use`, { method: "POST", body: JSON.stringify({}) })
    .then((res) => {
      if (res.state) set({ db: res.state });
    })
    .catch(() => null);
}

async function deleteAgentTemplate(id) {
  if (!state.token || !id) return;
  try {
    const db = await api(`/agent/templates/${id}`, { method: "DELETE" });
    set({ db });
    notify("模板已删除。");
  } catch (error) {
    notify(error.message);
  }
}

async function confirmAgentAction(runId, token) {
  if (!runId || !token || state.agentBusy) return;
  set({ agentBusy: true });
  startAgentWorkingTimer();
  try {
    const res = await api("/agent/confirm", {
      method: "POST",
      body: JSON.stringify({ runId, token })
    });
    const db = res.db || state.db;
    const messages = state.agentMessages.map((item) => item.agentRun?.id === runId
      ? { ...item, content: res.reply || item.content, agentRun: res.agentRun || item.agentRun }
      : item);
    rememberAgentMessages(messages);
    saveCurrentAgentHistory(messages);
    set({
      db,
      agentMessages: messages,
      agentBusy: false,
      ...applyAgentUiActions(res.uiActions, db)
    });
    completeAgentVisual();
    if ((db.generationJobs || []).some((job) => ["queued", "processing"].includes(job.status))) pollGenerationQueue();
    notify(t("toastAgentConfirmCompleted"));
  } catch (error) {
    const messages = state.agentMessages.map((item) => item.agentRun?.id === runId
      ? { ...item, agentRun: { ...item.agentRun, status: "failed", confirmation: null } }
      : item);
    rememberAgentMessages(messages);
    saveCurrentAgentHistory(messages);
    set({ agentMessages: messages, agentBusy: false });
    stopAgentWorkingTimer();
    notify(error.message);
  }
}

async function undoAgentRun(runId) {
  if (!runId || state.agentBusy) return;
  set({ agentBusy: true });
  startAgentWorkingTimer();
  try {
    const res = await api(`/agent/runs/${runId}/undo`, { method: "POST", body: JSON.stringify({}) });
    const db = res.db || state.db;
    const messages = state.agentMessages.map((item) => item.agentRun?.id === runId
      ? { ...item, agentRun: { ...(res.agentRun || item.agentRun), undoedAt: new Date().toISOString() } }
      : item);
    rememberAgentMessages(messages);
    saveCurrentAgentHistory(messages);
    set({ db, agentMessages: messages, agentBusy: false });
    stopAgentWorkingTimer();
    notify(t("toastAgentChangesUndone"));
  } catch (error) {
    set({ agentBusy: false });
    stopAgentWorkingTimer();
    notify(error.message || t("toastUndoFailed"));
  }
}

async function topup(amount) {
  notify(t("toastOpeningPayment"));
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
  notify(t("toastScheduleUpdated"));
}

function askAgentSchedule() {
  set({
    page: "agent",
    agentHistoryOpen: false,
    agentInput: "帮我根据当前资产库和产品，创建 TikTok 发布排期草稿。请检查每条内容缺少什么素材、caption、hashtags 或产品链接，并告诉我下一步要补什么。"
  });
  setTimeout(() => {
    const input = document.querySelector("[data-agent-input]");
    input?.focus();
    autoResizeAgentInput(input);
  }, 0);
}

async function editAutopostJob(id) {
  const item = state.db.schedule.find((entry) => entry.id === id);
  if (!item) return notify("找不到这条排期。");
  const title = window.prompt("Title", item.title || "");
  if (title === null) return;
  const time = window.prompt("Publish time", item.time || "");
  if (time === null) return;
  const caption = window.prompt("Caption", item.caption || "");
  if (caption === null) return;
  const hashtags = window.prompt("Hashtags", item.hashtags || "");
  if (hashtags === null) return;
  const productUrl = window.prompt("Product URL", item.productUrl || "");
  if (productUrl === null) return;
  try {
    const db = await api(`/autopost/jobs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ title, time, caption, hashtags, productUrl })
    });
    set({ db });
    notify("排期已更新。");
  } catch (error) {
    notify(error.message);
  }
}

async function setAutopostStatus(id, status) {
  const item = state.db.schedule.find((entry) => entry.id === id);
  if (!item) return notify("找不到这条排期。");
  const readiness = autopostReadiness(item, state.db.tiktok?.connections?.[0]);
  if (status === "Ready" && !readiness.ready) {
    return notify(`还缺：${readiness.blockers.map((check) => check.label).join(", ")}`);
  }
  try {
    const db = await api(`/autopost/jobs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    set({ db });
    notify(status === "Ready" ? "已标记为 Ready。" : "已保留为 Draft，请补齐缺少内容。");
  } catch (error) {
    notify(error.message);
  }
}

async function deleteAutopostJob(id) {
  const item = state.db.schedule.find((entry) => entry.id === id);
  if (!item) return notify("找不到这条排期。");
  if (!window.confirm(`Delete "${item.title || "this draft"}"?`)) return;
  try {
    const db = await api(`/autopost/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
    set({ db });
    notify("排期已删除。");
  } catch (error) {
    notify(error.message);
  }
}

async function adminUpdateUser(userId, patch) {
  const db = await api(`/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(patch) });
  set({ db, adminUserId: userId });
  notify("Admin user updated.");
}

async function adminAdjustCredits(userId, delta) {
  const db = await api(`/admin/users/${userId}/credits`, { method: "POST", body: JSON.stringify({ delta, note: `Admin adjusted ${delta} credits` }) });
  set({ db, adminUserId: userId });
  notify("Credits updated.");
}

async function adminCleanupPayment(paymentId) {
  const db = await api(`/admin/payments/${paymentId}/cleanup`, { method: "POST", body: JSON.stringify({ deleteUser: true }) });
  set({ db });
  notify("Pending checkout cleaned up.");
}

async function updateAccountProfile(patch) {
  try {
    const res = await api("/account/profile", { method: "PATCH", body: JSON.stringify(patch) });
    localStorage.setItem(storageKeys.user, JSON.stringify(res.user));
    set({ user: res.user, db: res.state });
    notify(t("toastAccountSaved"));
  } catch (error) {
    notify(error.message);
  }
}

async function changeAccountPassword(data) {
  try {
    await api("/account/password", { method: "PATCH", body: JSON.stringify(data) });
    notify(t("toastPasswordChanged"));
  } catch (error) {
    notify(error.message);
  }
}

async function refreshPaymentStatus(orderId) {
  if (!orderId) return;
  try {
    const payment = await api(`/payments/status/${encodeURIComponent(orderId)}`);
    set({ paymentReturn: payment });
    notify(payment.status === "paid" ? t("toastPaymentConfirmed") : tf("toastPaymentStatus", { status: payment.status }));
  } catch (error) {
    notify(error.message);
  }
}

async function tiktokCreatorInfo() {
  try {
    notify(t("toastCheckingTiktok"));
    const res = await api("/tiktok/creator-info", { method: "POST", body: JSON.stringify({}) });
    set({ db: { ...state.db, tiktok: res.tiktok } });
    notify(t("toastTiktokUpdated"));
  } catch (error) {
    notify(error.message);
  }
}

async function tiktokPublish(id) {
  const item = state.db.schedule.find((entry) => entry.id === id);
  if (!item?.mediaUrl) {
    notify(t("toastTiktokNeedsUrl"));
    return;
  }
  try {
    notify(t("toastTiktokStarting"));
    const res = await api(`/tiktok/publish/${id}`, { method: "POST", body: JSON.stringify({ mediaUrl: item.mediaUrl, privacyLevel: "SELF_ONLY", isAigc: true }) });
    set({ db: res.db });
    notify(t("toastTiktokStarted"));
  } catch (error) {
    notify(error.message);
  }
}

async function tiktokStatus(id) {
  try {
    const res = await api(`/tiktok/publish/${id}/status`);
    set({ db: res.db });
    notify(tf("toastTiktokStatus", { status: res.publish.status }));
  } catch (error) {
    notify(error.message);
  }
}

async function mutate(path, options, message) {
  const db = await api(path, options);
  set({ db, modal: null });
  notify(message);
}

async function download(url, filename, options = {}) {
  const res = await fetch(url.startsWith("/api") ? `${apiBaseUrl}${url}` : url, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {}
  });
  if (!res.ok) throw new Error("Download failed.");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  if (!options.keepModal) set({ modal: "export" });
}

function downloadDirect(url, filename, options = {}) {
  const href = new URL(url.startsWith("/api") ? `${apiBaseUrl}${url}` : url, window.location.origin);
  if (state.token && !href.searchParams.has("token")) href.searchParams.set("token", state.token);
  href.searchParams.set("download", "1");
  if (filename) href.searchParams.set("filename", filename);
  const link = document.createElement("a");
  link.href = href.toString();
  link.download = filename || "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function wait(ms = 0) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function playResultVideo(button) {
  const shell = button?.closest(".result-video-shell");
  const video = shell?.querySelector("video");
  if (!video) return;
  video.controls = true;
  video.play().catch(() => null);
  shell.classList.add("is-playing");
}

function findAssetResult(id) {
  return allResults().find((item) => item.id === id);
}

function flashResultActionButton(button) {
  if (!button || button.disabled) return;
  button.classList.remove("is-pressed");
  void button.offsetWidth;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 180);
}

function toggleResultSelection(id) {
  if (!id) return;
  const ids = selectedResultIdSet();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  set({ selectedResultIds: [...ids] });
}

function clearResultSelection() {
  if (!isBulkSelectingResults()) return;
  set({ selectedResultIds: [], bulkDeleteBusy: false, bulkReferenceBusy: "" });
}

async function bulkResultAction(actionName) {
  if (actionName === "clear") return clearResultSelection();
  if (actionName === "delete") {
    if (!selectedResults().length) return clearResultSelection();
    return set({ modal: "bulkDeleteResults" });
  }
  if (actionName === "download") return bulkDownloadSelectedResults();
  if (actionName === "save-avatar") return bulkSaveSelectedResultsAsReference("avatar");
  if (actionName === "save-product") return bulkSaveSelectedResultsAsReference("product");
}

async function bulkDownloadSelectedResults() {
  const items = selectedResults().filter((item) => item.imageUrl || item.videoUrl);
  if (!items.length) return notify("没有可下载的生成结果。");
  notify(`正在下载 ${items.length} 张图片。`);
  let failed = 0;
  for (const item of items) {
    const kind = item.videoUrl ? "video" : "image";
    try {
      downloadDirect(`/api/media/result/${item.id}/${kind}`, resultDownloadFilename(item, kind), { keepModal: true });
    } catch {
      failed += 1;
    }
  }
  if (failed) notify(`已下载 ${items.length - failed} 张，${failed} 张失败。`);
}

async function bulkSaveSelectedResultsAsReference(kind = "avatar") {
  const items = selectedResults().filter((item) => item.id && (item.imageUrl || item.videoUrl));
  if (!items.length) return notify("没有可保存的生成结果。");
  const label = kind === "avatar" ? "Avatar" : "Product";
  const selectedIds = new Set(items.map((item) => item.id));
  set({ bulkReferenceBusy: kind });
  notify(`正在保存 ${items.length} 个 ${label} reference。`);
  let nextDb = state.db;
  let failed = 0;
  try {
    for (const item of items) {
      try {
        nextDb = await api(`/results/${item.id}/save-reference`, {
          method: "POST",
          body: JSON.stringify({ kind })
        });
      } catch {
        failed += 1;
      }
    }
    const saved = (nextDb.attachments || []).find((attachment) => attachment.kind === kind && selectedIds.has(attachment.sourceResultId));
    const field = kind === "product" ? "image.productAttachmentId" : "image.avatarAttachmentId";
    if (saved?.id && state.projectId) {
      nextDb = dbWithProjectField(nextDb, state.projectId, field, saved.id);
      try {
        nextDb = await api(`/projects/${state.projectId}/field`, {
          method: "PATCH",
          body: JSON.stringify({ field, value: saved.id })
        });
      } catch (error) {
        notify(error.message || t("toastSaveFailed"));
      }
    }
    set({ db: nextDb, selectedResultIds: [], bulkReferenceBusy: "" });
    if (failed) notify(`已保存 ${items.length - failed} 个，${failed} 个失败。`);
    else notify(`已保存 ${items.length} 个 ${label} reference。`);
  } catch (error) {
    set({ bulkReferenceBusy: "" });
    notify(error.message || t("toastSaveFailed"));
  }
}

function setResultActionBusy(button, busy) {
  if (!button) return;
  button.classList.toggle("is-working", Boolean(busy));
  button.setAttribute("aria-busy", busy ? "true" : "false");
  if (!button.dataset.originalTooltip && button.dataset.tooltip) button.dataset.originalTooltip = button.dataset.tooltip;
  if (busy) {
    button.dataset.tooltip = button.dataset.resultAction === "download" ? "Downloading" : "Saving";
  } else if (button.dataset.originalTooltip) {
    button.dataset.tooltip = button.dataset.originalTooltip;
  }
}

async function resultAction(button) {
  const id = button?.dataset.resultId;
  const actionName = button?.dataset.resultAction;
  if (!id || !actionName) return;
  const item = findAssetResult(id);
  const busyActions = new Set(["download", "schedule", "variant", "avatar", "product", "save-avatar", "save-product", "save-project"]);
  const shouldShowBusy = busyActions.has(actionName);
  if (shouldShowBusy) setResultActionBusy(button, true);
  try {
    if (actionName === "save") return set({ modal: "saveResultReference", activeResultId: id });
    if (actionName === "edit-image") return set({ modal: "editResultImage", activeResultId: id });
    if (actionName === "download") {
      const kind = button.dataset.resultKind || "text";
      const filename = resultDownloadFilename(item, kind);
      const path = kind === "text" ? `/api/export/result/${id}` : `/api/media/result/${id}/${kind}`;
      await wait(80);
      if (kind !== "text") downloadDirect(path, filename, { keepModal: true });
      else await download(path, filename, { keepModal: true });
      await wait(620);
      return;
    }
    if (actionName === "delete") {
      return set({ modal: "deleteResult", activeResultId: id });
    }
    if (actionName === "copy-prompt") {
      const text = item?.body || "";
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement("textarea");
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      return notify("Prompt 已复制。");
    }
    if (actionName === "rename") {
      const title = window.prompt("给这个资产改名", item?.title || "");
      if (title === null) return;
      const db = await api(`/results/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });
      set({ db });
      return notify("资产已改名。");
    }
    if (actionName === "schedule") {
      const db = await api(`/results/${id}/schedule`, { method: "POST", body: JSON.stringify({}) });
      set({ db, page: "autopost" });
      return notify("已加入排期草稿。");
    }
    if (actionName === "variant") {
      if (!item?.projectId) return notify("找不到这个资产所属项目。");
      const prompt = `${item.body || item.title || ""}\n\nCreate a fresh variation: keep the same product logic, improve the hook, change composition, and make it suitable for TikTok Shop testing.`;
      const db = await api(`/projects/${item.projectId}/field`, { method: "PATCH", body: JSON.stringify({ field: "image.prompt", value: prompt }) });
      set({ db, projectId: item.projectId, page: "project", step: item.videoUrl ? "ugc" : "image" });
      return notify("已把变体 prompt 放回项目，可直接继续生成。");
    }
    if (actionName === "avatar" || actionName === "product" || actionName === "save-avatar" || actionName === "save-product") {
      const kind = actionName.endsWith("avatar") ? "avatar" : actionName.endsWith("product") ? "product" : actionName;
      const db = await api(`/results/${id}/save-reference`, {
        method: "POST",
        body: JSON.stringify({ kind })
      });
      if (state.modal === "previewResult") set({ db, modal: "previewResult", activeResultId: id });
      else set({ db, modal: null, activeResultId: null });
      return notify(kind === "avatar" ? "已保存为人物参考。" : "已保存为产品图参考。");
    }
    if (actionName === "save-project") {
      const db = await api(`/results/${id}/save-reference`, {
        method: "POST",
        body: JSON.stringify({ kind: "file" })
      });
      if (state.modal === "previewResult") set({ db, modal: "previewResult", activeResultId: id });
      else set({ db, modal: null, activeResultId: null });
      return notify("已保存到当前项目。");
    }
  } catch (error) {
    notify(error.message);
  } finally {
    if (shouldShowBusy) setResultActionBusy(button, false);
  }
}

async function renameResultInline(input) {
  const id = input?.dataset.resultTitle;
  const item = findAssetResult(id);
  const title = String(input?.value || "").trim();
  if (!id || !item) return;
  if (!title) {
    input.value = item.title || "";
    return notify("资产名称不能为空。");
  }
  if (title === item.title) {
    flashResultTitleSaved(id);
    return notify("资产名称已保存。");
  }
  try {
    const db = await api(`/results/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });
    flashResultTitleSaved(id, db);
    notify("资产名称已保存。");
  } catch (error) {
    input.value = item.title || "";
    notify(error.message);
  }
}

function flashResultTitleSaved(id, db) {
  clearTimeout(resultTitleSaveTimer);
  set(db ? { db, resultTitleSavedId: id } : { resultTitleSavedId: id });
  resultTitleSaveTimer = setTimeout(() => {
    if (state.resultTitleSavedId === id) set({ resultTitleSavedId: null });
  }, 1400);
}

async function editResultImage(data) {
  const id = state.activeResultId;
  if (!id) return;
  const instruction = String(data.instruction || "").trim();
  if (!instruction) return notify("先写 Edit instruction。");
  set({ editImageBusy: true });
  try {
    const db = await api(`/results/${id}/edit-image`, {
      method: "POST",
      body: JSON.stringify({
        instruction,
        model: data.model || "GPT Image 2",
        referenceAttachmentId: data.referenceAttachmentId || ""
      })
    });
    set({ db, modal: null, activeResultId: null, editImageBusy: false });
    notify("已加入图片编辑生成队列。");
  } catch (error) {
    set({ editImageBusy: false });
    notify(error.message);
  }
}

async function deleteResult() {
  const id = state.activeResultId;
  if (!id) return;
  const previousDb = state.db;
  const selectedIds = selectedResultIdSet();
  selectedIds.delete(id);
  set({
    db: dbWithoutResult(previousDb, id),
    modal: null,
    activeResultId: null,
    selectedResultIds: [...selectedIds]
  });
  try {
    const db = await api(`/results/${id}`, { method: "DELETE" });
    set({ db, selectedResultIds: [...selectedIds] });
    notify("已删除生成结果。");
  } catch (error) {
    set({ db: previousDb });
    notify(error.message);
  }
}

async function bulkDeleteSelectedResults() {
  const ids = selectedResults().map((item) => item.id);
  if (!ids.length) return set({ modal: null, selectedResultIds: [], bulkDeleteBusy: false });
  set({ bulkDeleteBusy: true });
  let nextDb = state.db;
  let failed = 0;
  for (const id of ids) {
    try {
      nextDb = await api(`/results/${id}`, { method: "DELETE" });
    } catch {
      failed += 1;
    }
  }
  set({ db: nextDb, modal: null, selectedResultIds: [], bulkDeleteBusy: false });
  if (failed) notify(`已删除 ${ids.length - failed} 个，${failed} 个失败。`);
  else notify(`已删除 ${ids.length} 个生成结果。`);
}

async function showPaymentReturnNotice() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");
  if (!payment) return;
  const orderId = params.get("order");

  const messages = {
    success: "Payment received. Checking activation status...",
    failed: "Payment failed. Please try again.",
    cancelled: "Payment cancelled."
  };
  window.history.replaceState({}, "", window.location.pathname);
  setTimeout(() => notify(messages[payment] || "Payment status updated."), 400);
  if (orderId) {
    try {
      const status = await api(`/payments/status/${encodeURIComponent(orderId)}`);
      set({ paymentReturn: status });
      setTimeout(() => notify(status.status === "paid" ? t("toastPaymentConfirmed") : tf("toastPaymentStatus", { status: status.status })), 750);
    } catch {
      setTimeout(() => notify(t("toastPaymentConfirmed")), 750);
    }
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimeout(generationPollTimer);
    state.queuePolling = false;
    return;
  }
  if (hasRunningGenerationJobs()) pollGenerationQueue();
});

window.addEventListener("storage", (event) => {
  if (event.key === agentHistoryStorageKey) {
    rememberAgentHistorySessions(readStoredJson(agentHistoryStorageKey, []));
    if (state.page === "agent") render();
  }
  if (event.key === storageKeys.agentMessages) {
    const messages = agentMessagesForStorage(readStoredJson(storageKeys.agentMessages, []));
    if (agentHistoryMessagesSignature(messages) !== agentHistoryMessagesSignature(state.agentMessages)) {
      state.agentMessages = messages;
      hydrateAgentChatIdentity();
      if (state.page === "agent") render();
    }
  }
});

window.addEventListener("popstate", () => {
  if (window.location.pathname.startsWith("/studio/agent")) {
    state.page = "agent";
    if (!restoreAgentChatFromUrl({ quiet: true, replace: true }) && !agentChatIdFromUrl()) {
      clearAgentTypingTimer();
      state.agentMessages = [];
      state.agentInput = "";
      state.agentAttachments = [];
      state.agentQueue = [];
      state.agentBusy = false;
      state.agentTyping = false;
      state.activeAgentHistoryId = null;
      state.activeAgentDraftId = state.activeAgentDraftId || createAgentDraftId();
      localStorage.removeItem(storageKeys.agentMessages);
      render();
    }
    return;
  }
  render();
});

hydrateAgentChatIdentity();

boot().catch((error) => {
  if (isStudioPath() && !state.db && isAuthExpiredError(error)) {
    clearStoredSession();
    window.history.replaceState({}, "", "/login");
  } else if (isStudioPath() && !state.db) {
    state.studioBootError = agentUserSafeError(error);
  }
  state.loading = false;
  render();
  notify(isStudioPath() ? agentUserSafeError(error) : error.message);
});
