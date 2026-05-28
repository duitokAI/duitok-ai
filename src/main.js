import "./styles.css";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isStudioPath = () => window.location.pathname.startsWith("/studio") || window.location.pathname.startsWith("/admin");
const pathIs = (path) => window.location.pathname === path;
const ownerAdminEmail = "admin@duitok.com";
const whatsappGroupUrl = "https://chat.whatsapp.com/ERz2477U1gJFJHFsXtiMJH?mode=gi_t";
let sidebarScrollTop = 0;

const steps = [
  ["image", "image", "stepImage", "01"],
  ["ugc", "video", "stepUgc", "02"],
  ["auto", "wand-sparkles", "stepAuto", "03"],
  ["original", "film", "stepOriginal", "04"],
  ["clone", "layers-3", "stepClone", "05"],
  ["story", "book-open", "stepStory", "06"],
  ["viral", "film", "stepViral", "07"]
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

const state = {
  loading: true,
  user: JSON.parse(localStorage.getItem("duitok-user") || "null"),
  token: localStorage.getItem("duitok-auth") || "",
  adminKey: localStorage.getItem("duitok-admin-key") || "",
  lang: localStorage.getItem("duitok-lang") || "zh",
  db: null,
  page: "dashboard",
  step: "image",
  projectId: null,
  modal: null,
  search: "",
  adminUserId: null,
  dateFrom: "2026-05-01",
  dateTo: "2026-05-26",
  live: false,
  chat: false,
  agentInput: "",
  agentBusy: false,
  agentVisualPhase: "idle",
  agentTaskMode: "idle",
  agentIdleActivity: "sleep",
  agentMessages: JSON.parse(localStorage.getItem("duitok-agent-messages") || "[]"),
  queuePolling: false,
  langOpen: false,
  imagePromptGroup: "avatar",
  generating: false,
  projectMenuId: null,
  editingProjectId: null,
  paymentReturn: null,
  topupAmount: 50,
  usageFilter: "all"
};

let agentVisualTimer = null;

const languages = [
  ["ms", "BM"],
  ["zh", "中文"],
  ["en", "EN"]
];

const brandAssets = {
  horizontal: "/duitok-logo-transparent.png",
  mascot: "/duitok-mascot-transparent.png",
  banner: "/duitok-brand-banner-transparent.png",
  stacked: "/duitok-logo-stacked.png",
  agentModel: "/models/agent/duitok-agent.glb"
};

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
    contentEngine: "AI Selling System",
    checkout: "Checkout",
    studio: "Studio",
    navFeatures: "Fungsi",
    navPricing: "Harga",
    navAffiliate: "Affiliate",
    navFaq: "FAQ",
    signIn: "Log masuk",
    promo: "Subscribe RM69/bulan, dapat 10 credits · Template + tutorial + platform",
    heroEyebrow: "AI short video selling system untuk beginner",
    heroTitle: "RM69/bulan, mula side income dengan video selling AI",
    heroTitleLead: "RM69/bulan",
    heroTitleHot: "mula side income",
    heroTitleTail: "dengan video selling AI",
    demoCta: "Tengok 20 demo",
    heroCopy: "Duitok AI beri template, tutorial SOP, product method dan pengalaman order sebenar. Ikut sistem, generate 100+ video sehari, post dan test produk dengan lebih laju.",
    startCreating: "Mula Sekarang — 2 Video FREE →",
    heroTrust1: "AI short video selling",
    heroTrust2: "BM / 中文 / EN",
    heroTrust3: "Tak perlu tunjuk muka",
    heroTrust4: "Review dulu sebelum post",
    whatsappCta: "WhatsApp",
    rating: "RM69/bulan membership",
    sellersNow: "Dapat 10 credits",
    guarantee: "Image RM0.10",
    videoPrice: "Video RM0.40",
    you: "Anda",
    competitor: "Competitor",
    oneVideo: "1 video / hari",
    tenVideos: "10 video / hari",
    catchUp: "Dari 2-3 video manual ke 100+ video AI",
    speed: "Volume",
    speedTitle: "Lebih banyak video, lebih banyak peluang view",
    speedCopy: "Short video selling ialah game testing. Duitok bantu anda test lebih banyak produk, hook dan angle dengan cepat.",
    price: "RM69",
    priceTitle: "Kos kecil untuk mula mimpi side income",
    priceCopy: "Bukan beli software sahaja. Anda beli sistem template, tutorial dan AI platform untuk mula buat short video selling.",
    simple: "No stock",
    simpleTitle: "Tak perlu ambil barang dari merchant",
    simpleCopy: "Kurangkan masa shoot, pegang stok dan ulang setup produk.",
    sellerReality: "Realiti short video selling",
    painTitle: "Bukan anda tidak rajin, short video selling perlukan testing volume",
    painCopy: "Setiap hari hanya post 2-3 video memang susah nampak produk, hook dan angle mana yang jalan. Duitok fokus pada SOP dan execution volume, bukan sekadar AI chat biasa.",
    notEnoughTime: "Tak tahu pilih produk",
    notEnoughTimeCopy: "Produk salah buat semua video susah jalan. Beginner perlukan SOP untuk pilih dan test produk, bukan sekadar idea rawak.",
    ideasDry: "Tak tahu struktur video",
    ideasDryCopy: "Hook, skrip, CTA dan caption tidak stabil bila semuanya dibuat ikut rasa sendiri.",
    scatteredTools: "Guna AI pun masih blur",
    scatteredToolsCopy: "AI umum boleh generate text, tapi tidak ajar template short video selling yang boleh diulang.",
    competitorsFaster: "Output terlalu kecil",
    competitorsFasterCopy: "2-3 video sehari terlalu perlahan untuk test produk, angle dan akaun. Kurang test bermaksud kurang data.",
    advantage: "AI selling weapons",
    weaponsTitle: "5 senjata AI selling yang anda dapat dalam Duitok",
    liveOutput: "Output Duitok AI",
    outputTitle: "Dari product info ke 100+ video selling angle yang boleh diuji",
    outputCopy: "Duitok AI bantu pecahkan produk kepada hook, skrip, caption, visual direction dan posting plan. Anda ikut template, generate batch, post, baca data dan ulang.",
    hookTitle: "100+ Hook",
    hookSample: "Satu produk boleh diuji dengan pain angle, proof angle, comparison angle dan offer angle.",
    scriptTitle: "UGC Script",
    scriptSample: "Scene 1: tunjuk masalah. Scene 2: close-up produk. Scene 3: bukti cepat. CTA: klik beg kuning.",
    captionTitle: "Caption",
    captionSample: "Caption selling yang jelas, soft-sell dan sesuai untuk audience Malaysia.",
    planTitle: "Posting Plan",
    planSample: "Test harian untuk TikTok Affiliate, TikTok Shop, produk lokal, Reels atau Shorts.",
    howKicker: "Cara guna",
    howTitle: "Ikut SOP dari pilih produk sampai scale angle yang jalan",
    howCopy: "Flow dibuat untuk beginner: pilih produk, pecahkan selling point, pilih template, generate content, publish, review data dan ulang angle yang convert.",
    demoTitle: "Contoh output yang boleh terus diuji",
    demoCopy: "Setiap contoh menunjukkan kategori, hook, jenis output dan anggaran credit supaya pricing terasa jelas sebelum anda subscribe.",
    oldWay: "Cara lama",
    newWay: "Cara Duitok AI",
    pricingTitle: "RM69/bulan ialah membership, generation guna credit",
    pricingCopy: "RM69 ialah yuran membership bulanan untuk akses platform, template, tutorial dan SOP. Promotion sekarang: subscribe terus dapat 10 credits. Selepas itu generation guna credit: image RM0.10, video RM0.40.",
    launchOffer: "Subscribe dapat 10 credits",
    claimPlan: "Subscribe RM69 + 10 credits",
    riskReversal: "Duitok AI tidak menjamin income. Result bergantung pada product, akaun, posting consistency dan execution anda.",
    controlKicker: "Trust & compliance",
    controlTitle: "Kami jual peluang dan sistem, bukan janji kaya cepat",
    controlCopy: "Ada pelajar ikut tutorial dan guna platform kami lalu capai RM1000+ pada minggu pertama. Ini case sebenar, bukan jaminan untuk semua orang. Result bergantung pada produk, akaun, content, data dan execution.",
    startNow: "Mula sekarang",
    registerTitle: "Mula dengan RM69, bina mesin short video selling anda",
    registerCopy: "Register, bayar melalui CHIP, kemudian masuk Studio untuk ikut template dan generate video batch pertama.",
    fullName: "Nama penuh",
    email: "Email",
    password: "Password",
    continueRegistration: "Teruskan ke registration",
    faqTitle: "Soalan seller sebelum mula",
    dashboard: "Dashboard",
    newProject: "New project",
    search: "Cari",
    projects: "Projects",
    publicTools: "Public Tools",
    logout: "Sign out",
    project: "Project",
    sopImage: "SOP Image",
    stepImage: "Image",
    stepUgc: "UGC",
    stepAuto: "Auto Content",
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
    whatsapp: "Join Discussion WhatsApp",
    imageGenerator: "Image Generator",
    model: "Model",
    mode: "Mode",
    avatarRef: "Avatar Reference (Optional)",
    productRef: "Product Reference (Optional)",
    dropAvatar: "Click atau drop gambar muka character",
    dropProduct: "Click atau drop gambar produk",
    prompt: "Prompt",
    generateImage: "Generate Media",
    generating: "Duitok AI is generating...",
    noResults: "Belum ada result",
    export: "Export",
    saveDone: "Saved.",
    generatedSaved: "Generated result saved.",
    loginTitle: "Welcome back",
    loginCopy: "Sign in untuk teruskan generate UGC viral.",
    welcomeBack: "Welcome back",
    forgot: "Lupa password? Hantar di WhatsApp ->",
    noAccount: "Belum ada akaun? Pilih plan & daftar",
    noAccountLead: "Belum ada akaun?",
    noAccountAction: "Pilih plan & daftar",
    createProject: "Create New Project",
    choosePlan: "Choose Plan & Register",
    exportReady: "Export Ready",
    supportTitle: "Duitok AI Support",
    supportTicket: "Create Support Ticket",
    liveActivity: "Live Activity",
    support: "Support"
  },
  zh: {
    contentEngine: "AI 带货系统",
    checkout: "结账",
    studio: "工作台",
    navFeatures: "功能",
    navPricing: "价格",
    navAffiliate: "联盟",
    navFaq: "FAQ",
    signIn: "登录",
    promo: "现在订阅 RM69/月，送 10 credits · 模板 + 教程 + 平台",
    heroEyebrow: "想用 AI 做副业？从短视频带货开始。",
    heroTitle: "RM69/月，用 AI 开始短视频带货副业",
    heroTitleLead: "RM69/月，用 AI 开始",
    heroTitleHot: "短视频带货副业",
    heroTitleTail: "",
    demoCta: "看看如何运作",
    heroCopy: "Duitok AI 把选品 SOP、带货模板、教学和 AI 生成平台放在一起，让新手不用拿货、不用拍摄，也能用 AI 批量测试短视频带货内容。",
    startCreating: "订阅 RM69，拿 10 credits",
    heroTrust1: "AI 短视频带货系统",
    heroTrust2: "BM / 中文 / EN",
    heroTrust3: "无需露脸",
    heroTrust4: "发布前人工确认",
    whatsappCta: "WhatsApp",
    rating: "RM69/月会员费",
    sellersNow: "订阅送 10 credits",
    guarantee: "图片 RM0.10",
    videoPrice: "视频 RM0.40",
    you: "你",
    competitor: "竞争对手",
    oneVideo: "1 条 / 天",
    tenVideos: "10 条 / 天",
    catchUp: "从手工 2-3 条，升级到 AI 100+ 条",
    speed: "数量优势",
    speedTitle: "短视频带货<br>靠的是测试量",
    speedCopy: "一个产品不知道哪个角度会跑，一个 hook 不知道用户会不会停。手动一天 2-3 条太慢，AI 才能让你用更多内容换更多数据。",
    price: "RM69",
    priceTitle: "RM69 不是买软件按钮，是买一个开始副业的系统",
    priceCopy: "你用小成本拿到平台、模板、教程、SOP 和第一批 10 credits，开始测试一个 AI 短视频带货机会。",
    simple: "不用拿货",
    simpleTitle: "不用再跟商家拿产品拍摄",
    simpleCopy: "减少拿货、布景、拍摄、剪辑这些最浪费时间的环节。",
    sellerReality: "短视频带货的真实门槛",
    painTitle: "不是你不努力<br>是测试量不够",
    painCopy: "每天只发 2-3 条，很难测出哪个产品、hook、角度会跑。Duitok 要解决的是执行量和方法，不是再给你一个普通 AI 聊天工具。",
    notEnoughTime: "不知道选什么产品",
    notEnoughTimeCopy: "产品选错，视频再多也很难跑。新手需要选品 SOP，而不是自己乱猜。",
    ideasDry: "不知道视频怎么开头",
    ideasDryCopy: "Hook、脚本、CTA、caption 没有结构，视频看起来就像随机生成。",
    scatteredTools: "自己用 AI 也不会做",
    scatteredToolsCopy: "普通 AI 只会回答问题，不会告诉你短视频带货应该套什么模板、怎么发布、怎么复盘。",
    competitorsFaster: "每天只做 2-3 条",
    competitorsFasterCopy: "发得太少，测试不出爆款产品和爆款视频，也没有足够数据优化。",
    advantage: "AI 带货武器",
    weaponsTitle: "5 个 AI 带货武器<br>从选品到复盘",
    liveOutput: "Duitok AI 输出",
    outputTitle: "一个产品<br>拆出 100+ 个带货角度",
    outputCopy: "Duitok AI 把产品拆成 hook、脚本、caption、视觉方向和发布计划，让你按模板生成、发布、看数据、复制有效内容。",
    hookTitle: "100+ Hook",
    hookSample: "同一个产品，可以测试痛点角度、证明角度、对比角度、优惠角度。",
    scriptTitle: "UGC 脚本",
    scriptSample: "镜头 1：展示痛点。镜头 2：产品 close-up。镜头 3：快速证明。CTA：点击小黄车。",
    captionTitle: "Caption",
    captionSample: "适合短视频带货的 soft-sell caption，让内容更像真实推荐。",
    planTitle: "发布计划",
    planSample: "适合 TikTok Affiliate、TikTok Shop、产品推广、Reels 和 Shorts 持续测试。",
    howKicker: "使用流程",
    howTitle: "跟着 SOP<br>从选品做到复盘放大",
    howCopy: "流程给新手设计：选产品、拆卖点、套模板、生成内容、发布测试、看数据后复制有效角度。",
    demoTitle: "看得懂成本<br>才敢开始测试",
    demoCopy: "每个样例都写清楚类目、hook、生成类型和预计成本，让你订阅前就理解平台怎么帮你做内容。",
    oldWay: "旧方法",
    newWay: "Duitok AI 方法",
    pricingTitle: "RM69/月<br>开始测试 AI 带货副业机会",
    pricingCopy: "RM69 不是买软件按钮，而是开通一套 AI 短视频带货副业系统：平台、模板、教程和 SOP。现在 promotion：订阅就送 10 credits。之后生成按 credit 扣费：图片 RM0.10，视频 RM0.40。",
    launchOffer: "订阅送 10 credits",
    claimPlan: "订阅 RM69 + 拿 10 credits",
    riskReversal: "Duitok AI 不保证收益。结果取决于选品、账号、发布频率、内容质量和执行力。",
    controlKicker: "信任与合规",
    controlTitle: "我们卖的是机会和系统<br>不是暴富承诺",
    controlCopy: "已有学员根据我们的教程和平台执行，第一个星期赚到 RM1000+。这不是保证每个人都有同样结果，但证明模板、方法、平台和执行量结合起来，是有机会跑出结果的。",
    startNow: "现在开始",
    registerTitle: "用 RM69 开始<br>建立你的 AI 带货系统",
    registerCopy: "注册后通过 CHIP 付款，付款成功后即可进入 Studio，跟着模板和教程生成第一批带货视频。",
    fullName: "姓名",
    email: "邮箱",
    password: "密码",
    continueRegistration: "继续注册",
    faqTitle: "开始前<br>你可能会问",
    dashboard: "总控",
    newProject: "新项目",
    search: "搜索",
    projects: "项目",
    publicTools: "公开工具",
    logout: "退出登录",
    project: "项目",
    sopImage: "图片 SOP",
    stepImage: "图片",
    stepUgc: "UGC",
    stepAuto: "自动内容",
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
    whatsapp: "加入 WhatsApp 讨论群",
    imageGenerator: "Image Generator",
    model: "模型",
    mode: "模式",
    avatarRef: "人物参考（可选）",
    productRef: "产品参考（可选）",
    dropAvatar: "点击或拖入人物脸部图片",
    dropProduct: "点击或拖入产品图片",
    prompt: "提示词",
    generateImage: "生成作品",
    generating: "Duitok AI 正在生成...",
    noResults: "还没有结果",
    export: "导出",
    saveDone: "已保存。",
    generatedSaved: "生成结果已保存。",
    loginTitle: "Welcome back",
    loginCopy: "登录后继续生成爆款 UGC。",
    welcomeBack: "欢迎回来",
    forgot: "忘记密码？去 WhatsApp 联系 ->",
    noAccount: "还没有账号？选择计划并注册",
    noAccountLead: "还没有账号？",
    noAccountAction: "选择计划并注册",
    createProject: "创建新项目",
    choosePlan: "选择计划并注册",
    exportReady: "导出已开始",
    supportTitle: "Duitok AI 客服",
    supportTicket: "创建客服工单",
    liveActivity: "实时动态",
    support: "客服"
  },
  en: {
    contentEngine: "AI Selling System",
    checkout: "Checkout",
    studio: "Studio",
    navFeatures: "Features",
    navPricing: "Pricing",
    navAffiliate: "Affiliate",
    navFaq: "FAQ",
    signIn: "Sign in",
    promo: "Subscribe at RM69/month, get 10 credits · Templates + tutorials + platform",
    heroEyebrow: "Others are batch-testing with AI while you are still planning the first video",
    heroTitle: "RM69/month to start short-video selling with AI",
    heroTitleLead: "RM69/month to start",
    heroTitleHot: "short-video selling",
    heroTitleTail: "with AI",
    demoCta: "See how it works",
    heroCopy: "Duitok AI gives you templates, SOP tutorials, product methods, and real order experience. Follow the system, generate 100+ videos a day, publish, and test faster.",
    startCreating: "Subscribe RM69, get 10 credits",
    heroTrust1: "AI short-video selling",
    heroTrust2: "BM / 中文 / EN",
    heroTrust3: "No need to show face",
    heroTrust4: "Review before posting",
    whatsappCta: "WhatsApp",
    rating: "RM69/month membership",
    sellersNow: "Get 10 credits",
    guarantee: "Image RM0.10",
    videoPrice: "Video RM0.40",
    you: "You",
    competitor: "Competitor",
    oneVideo: "1 video / day",
    tenVideos: "10 videos / day",
    catchUp: "From 2-3 manual videos to 100+ AI videos",
    speed: "Volume",
    speedTitle: "More videos means more chances to earn views",
    speedCopy: "Short-video selling is a testing game. Duitok helps you test more products, hooks, and angles faster.",
    price: "RM69",
    priceTitle: "A small cost to start a side-income dream",
    priceCopy: "You are not buying just a software button. You are buying templates, tutorials, and an AI platform for short-video selling.",
    simple: "No stock",
    simpleTitle: "No need to request products from merchants",
    simpleCopy: "Reduce the time lost to stock handling, setup, filming, and editing.",
    sellerReality: "The real short-video selling bottleneck",
    painTitle: "It is not lack of effort, short-video selling needs testing volume",
    painCopy: "Posting only 2-3 videos a day makes it hard to find the product, hook, or angle that works. Duitok solves SOP and execution volume, not just generic AI chat.",
    notEnoughTime: "No product-selection method",
    notEnoughTimeCopy: "The wrong product makes every video harder to sell. Beginners need a product SOP, not random guessing.",
    ideasDry: "No video structure",
    ideasDryCopy: "Hooks, scripts, CTAs, and captions feel random when there is no proven template.",
    scatteredTools: "Generic AI is still confusing",
    scatteredToolsCopy: "Normal AI can generate text, but it does not teach what selling template to use, how to post, or how to review data.",
    competitorsFaster: "Only 2-3 videos/day",
    competitorsFasterCopy: "Too little output means too little testing data to find winning products and videos.",
    advantage: "AI selling weapons",
    weaponsTitle: "The 5 AI selling weapons inside Duitok",
    liveOutput: "Duitok AI output",
    outputTitle: "Turn one product into 100+ testable selling angles",
    outputCopy: "Duitok AI breaks products into hooks, scripts, captions, visual directions, and posting plans so you can follow templates, publish, read data, and repeat what works.",
    hookTitle: "100+ Hooks",
    hookSample: "Test pain angles, proof angles, comparison angles, and offer angles from the same product.",
    scriptTitle: "UGC Script",
    scriptSample: "Scene 1: show the problem. Scene 2: product close-up. Scene 3: quick proof. CTA: tap the yellow bag.",
    captionTitle: "Caption",
    captionSample: "Soft-sell captions for short-video commerce that feel like real recommendations.",
    planTitle: "Posting Plan",
    planSample: "Use it for TikTok Affiliate, TikTok Shop, product promos, Reels, Shorts, and other selling channels.",
    howKicker: "How it works",
    howTitle: "Follow the SOP from product choice to scaling winning angles",
    howCopy: "The flow is built for beginners: choose a product, break down selling points, pick templates, generate content, publish, review data, and repeat what works.",
    demoTitle: "Output examples you can test directly",
    demoCopy: "Each sample shows the category, hook, output type, and estimated cost so the credit model is clear before you subscribe.",
    oldWay: "Old way",
    newWay: "Duitok AI way",
    pricingTitle: "RM69/month is membership, generation uses credits",
    pricingCopy: "RM69 is the monthly membership fee for platform access, templates, tutorials, and SOP. Current promotion: subscribe and get 10 credits. After that, generation uses credits: RM0.10 per image and RM0.40 per video.",
    launchOffer: "Subscribe and get 10 credits",
    claimPlan: "Subscribe RM69 + get 10 credits",
    riskReversal: "Duitok AI does not guarantee income. Results depend on product choice, account quality, posting frequency, content quality, and execution.",
    controlKicker: "Trust & compliance",
    controlTitle: "We sell the opportunity and system, not a get-rich promise",
    controlCopy: "Some students followed our tutorials and used our platform to earn RM1000+ in their first week. This is not a guarantee for everyone, but it proves that templates, methods, platform, and execution volume matter.",
    startNow: "Start now",
    registerTitle: "Start with RM69 and build your AI short-video selling machine",
    registerCopy: "Register, pay securely with CHIP, then enter Studio to follow templates and generate your first batch of selling videos.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    continueRegistration: "Continue to registration",
    faqTitle: "Questions sellers ask before starting",
    dashboard: "Dashboard",
    newProject: "New project",
    search: "Search",
    projects: "Projects",
    publicTools: "Public Tools",
    logout: "Sign out",
    project: "Project",
    sopImage: "SOP Image",
    stepImage: "Image",
    stepUgc: "UGC",
    stepAuto: "Auto Content",
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
    whatsapp: "Join Discussion WhatsApp",
    imageGenerator: "Image Generator",
    model: "Model",
    mode: "Mode",
    avatarRef: "Avatar Reference (Optional)",
    productRef: "Product Reference (Optional)",
    dropAvatar: "Click or drop character face image",
    dropProduct: "Click or drop product image",
    prompt: "Prompt",
    generateImage: "Generate Media",
    generating: "Duitok AI is generating...",
    noResults: "No results yet",
    export: "Export",
    saveDone: "Saved.",
    generatedSaved: "Generated result saved.",
    loginTitle: "Welcome back",
    loginCopy: "Sign in to keep generating viral UGC.",
    welcomeBack: "Welcome back",
    forgot: "Forgot password? Send WhatsApp ->",
    noAccount: "No account yet? Choose a plan & register",
    noAccountLead: "No account yet?",
    noAccountAction: "Choose a plan & register",
    createProject: "Create New Project",
    choosePlan: "Choose Plan & Register",
    exportReady: "Export Ready",
    supportTitle: "Duitok AI Support",
    supportTicket: "Create Support Ticket",
    liveActivity: "Live Activity",
    support: "Support"
  }
};

const t = (key) => {
  const current = copy[state.lang] || copy.en;
  if (Object.prototype.hasOwnProperty.call(current, key)) return current[key];
  if (Object.prototype.hasOwnProperty.call(copy.en, key)) return copy.en[key];
  return key;
};

function languageSwitch() {
  const current = languages.find(([id]) => id === state.lang) || languages[0];
  return `
    <div class="lang-menu ${state.langOpen ? "open" : ""}">
      <button class="lang-switch" type="button" data-lang-toggle aria-label="Change language" title="Change language">
        ${icon("globe-2", 15)}<small>Language</small><span>${current[1]}</span>${icon(state.langOpen ? "chevron-up" : "chevron-down", 14)}
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

const icon = (name, size = 20) => `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (state.adminKey) headers["X-Admin-Key"] = state.adminKey;
  const res = await fetch(`${apiBaseUrl}/api${path}`, {
    headers,
    ...options
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.headers.get("content-type")?.includes("application/json") ? res.json() : res;
}

async function boot() {
  if (window.location.pathname.startsWith("/admin")) state.page = "admin";
  if (window.location.pathname.startsWith("/studio/agent")) state.page = "agent";
  if (isStudioPath()) await ensureStudioData();
  state.loading = false;
  render();
  showPaymentReturnNotice();
}

async function ensureStudioData() {
  if (state.db) return;
  if (!state.user || !state.token) {
    window.history.replaceState({}, "", "/login");
    return;
  }
  state.db = await api("/state");
  state.projectId = state.db.projects[0]?.id;
}

async function refreshState() {
  const db = await api("/state");
  set({ db });
  return db;
}

function set(patch) {
  rememberSidebarScroll();
  Object.assign(state, patch);
  render();
}

function rememberSidebarScroll() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebarScrollTop = sidebar.scrollTop;
}

function restoreSidebarScroll() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  const maxScroll = Math.max(0, sidebar.scrollHeight - sidebar.clientHeight);
  sidebar.scrollTop = Math.min(sidebarScrollTop, maxScroll);
}

function project() {
  return state.db.projects.find((item) => item.id === state.projectId) || state.db.projects[0];
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

function routeShell(content) {
  const dock = pathIs("/login") ? `<div class="global-lang-dock">${languageSwitch()}</div>` : "";
  return `${dock}${content}`;
}

function render() {
  app.innerHTML = state.loading ? `<main class="loading">${icon("loader-circle")} Loading...</main>` : routeShell(route());
  bind();
  window.lucide?.createIcons();
  restoreSidebarScroll();
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

function publicSite() {
  return `
    <main class="public-shell">
      <div class="promo-bar">${icon("timer", 18)} ${t("promo")}</div>
      <nav class="public-nav">
        ${brand(t("contentEngine"))}
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
        <img class="video-scene-bg" src="/duitok-hero-seller-v2.jpg" alt="Duitok AI seller surrounded by TikTok Shop content previews">
        <div class="video-scene-vignette" aria-hidden="true"></div>
        <div class="video-scene-grid" aria-hidden="true"></div>
        <div class="video-scene-beam beam-one" aria-hidden="true"></div>
        <div class="video-scene-beam beam-two" aria-hidden="true"></div>
        <div class="hero-copy-layer">
          <p class="eyebrow">${t("heroEyebrow")}</p>
          <h1 class="hero-headline">${heroTitleMarkup()}</h1>
          <p class="public-copy">${t("heroCopy")}</p>
          <div class="public-actions">
            <button class="gold-button" data-action="open-register">${icon("sparkles")} ${t("startCreating")}</button>
            <a class="dark-button demo-button" href="#demo">${icon("play-circle")} ${t("demoCta")}</a>
          </div>
        </div>
      </section>
      <section class="proof-strip">
        <article>${icon("star", 18)} <b>${t("rating")}</b></article>
        <article>${icon("radio", 18)} <b>${t("sellersNow")}</b></article>
        <article>${icon("badge-check", 18)} <b>${t("guarantee")}</b></article>
        <article>${icon("wallet-cards", 18)} <b>${t("videoPrice")}</b></article>
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
          <p class="eyebrow">${whyDuitokContent().kicker}</p>
          <h2>${whyDuitokContent().title}</h2>
          <p>${whyDuitokContent().copy}</p>
        </div>
        <div class="system-grid">${whyDuitokCards()}</div>
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
        <p class="eyebrow">Manual vs Duitok AI</p>
        <h2>${comparisonContent().title}</h2>
        <div class="compare-grid">
          <article><span>${t("oldWay")}</span><h3>${comparisonContent().oldTitle}</h3><ul>${comparisonContent().oldBullets.map((item) => `<li>${item}</li>`).join("")}</ul></article>
          <article class="winner"><span>${t("newWay")}</span><h3>${comparisonContent().newTitle}</h3><ul>${comparisonContent().newBullets.map((item) => `<li>${item}</li>`).join("")}</ul></article>
        </div>
      </section>
      <section class="case-section">
        <div>
          <p class="eyebrow">${studentCaseContent().kicker}</p>
          <h2>${studentCaseContent().title}</h2>
          <p>${studentCaseContent().copy}</p>
          <p class="risk-note">${studentCaseContent().note}</p>
        </div>
        <article class="case-card">
          <span>${studentCaseContent().badge}</span>
          <b>RM1000+</b>
          <p>${studentCaseContent().cardCopy}</p>
          <ul>${studentCaseContent().bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
        </article>
      </section>
      <section class="testimonial-section dream-section">
        <p class="eyebrow">${dreamContent().kicker}</p>
        <h2>${dreamContent().title}</h2>
        <p>${dreamContent().copy}</p>
        <div class="quote-grid">
          ${dreamCards()}
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
      <section class="journey-section">
        <div>
          <p class="eyebrow">${sevenDayContent().kicker}</p>
          <h2>${sevenDayContent().title}</h2>
          <p>${sevenDayContent().copy}</p>
          <button class="gold-button section-cta" data-action="open-register">${icon("sparkles")} ${t("startCreating")}</button>
        </div>
        <div class="journey-grid">${sevenDaySteps()}</div>
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
          <h3>Duitok AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM69</b><small>${pricePeriodContent().period}</small></div>
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
        <div><p class="eyebrow">${t("startNow")}</p><h2>${t("registerTitle")}</h2><p>${t("registerCopy")}</p><img class="signup-brand-banner" src="${brandAssets.banner}" alt="Duitok AI"></div>
        <form class="lead-form" data-form="lead">
          <label>${t("fullName")}<input name="name" placeholder="Your name"></label>
          <label>WhatsApp<input name="phone" placeholder="+60"></label>
          <label>${t("email")}<input name="email" placeholder="you@duitok.com"></label>
          <button class="gold-button" type="submit">${icon("lock")} ${t("continueRegistration")}</button>
        </form>
      </section>
      <section id="faq" class="faq-section">
        <p class="eyebrow">${t("navFaq")}</p>
        <h2>${t("faqTitle")}</h2>
        ${faqItems().map((item, index) => `<details ${index === 0 ? "open" : ""}><summary>${item.q}</summary><p>${item.a}</p></details>`).join("")}
      </section>
      ${footerBrand("Duitok AI")}
    </main>`;
}

function registerPage() {
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
          <p class="eyebrow">Start now</p>
          <h1>Register, pay, and activate your Studio.</h1>
          <p class="public-copy">Create your account, pay securely through CHIP, and activate Duitok AI Pro after the payment callback confirms.</p>
          <div class="checkout-steps">
            <article><b>1</b><span>Subscribe plan</span><p>RM69/month unlocks the membership and gives 10 promo credits.</p></article>
            <article><b>2</b><span>Use credits</span><p>Images use RM0.10 each. Videos use RM0.40 each.</p></article>
            <article><b>3</b><span>Generate outputs</span><p>Image, UGC, clone, story, and batch tools deduct automatically.</p></article>
          </div>
        </div>
        <article class="price-card checkout-card">
          <span>Launch offer</span>
          <img class="price-brand-mark" src="${brandAssets.mascot}" alt="" aria-hidden="true">
          <h3>Duitok AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM69</b><small>${pricePeriodContent().period}</small></div>
          <div class="included-credit-banner">${includedCreditBanner()}</div>
          <div class="usage-price-grid">${usagePriceCards()}</div>
          <ul><li>Full Studio access</li><li>10 promo credits after subscription</li><li>Prompt library</li><li>Image and video workflows</li><li>Image generation RM0.10 each</li><li>Video generation RM0.40 each</li><li>Clone prompt mode</li><li>VIP WhatsApp support</li></ul>
        </article>
      </section>
      <section id="checkout" class="signup-section checkout-section">
        <div>
          <p class="eyebrow">Buyer details</p>
          <h2>Account info for login and support.</h2>
          <p>This creates a pending Duitok AI Pro order and redirects you to the secure CHIP payment page.</p>
        </div>
        <form class="lead-form" data-form="register">
          <label>Full name<input name="name" placeholder="Your full name" required></label>
          <label>WhatsApp<input name="phone" placeholder="+60" required></label>
          <label>Email<input name="email" type="email" placeholder="you@duitok.com" required></label>
          <label>Password<input name="password" type="password" placeholder="Create password" minlength="6" required></label>
          <label class="check-label"><input type="checkbox" required> <span>I agree to <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</span></label>
          <button class="gold-button" type="submit">${icon("credit-card")} Pay RM69 - FPX / DuitNow QR</button>
          <small>Secured via CHIP Payment.</small>
        </form>
      </section>
    </main>`;
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
          <h1>Earn monthly commission by sharing Duitok AI.</h1>
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
      ${footerBrand("Duitok AI Affiliate")}
    </main>`;
}

function legalPage(type) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const updated = "Last updated: May 26, 2026";
  const sections = isPrivacy
    ? [
        ["Information we collect", "Duitok AI collects account details, project content, uploaded product or creator references, generation prompts, billing records, usage logs, and TikTok connection data when you choose to connect a TikTok account."],
        ["How we use information", "We use this information to provide the Studio, generate content, manage subscriptions and credits, support your account, improve reliability, and publish or prepare posts only when you request it."],
        ["TikTok data", "If you connect TikTok, we use TikTok OAuth data only to identify the connected account, check creator or posting eligibility, and submit content through approved TikTok APIs. We do not sell TikTok account data."],
        ["Sharing", "We share information with service providers that operate hosting, payments, AI generation, analytics, support, and official publishing integrations. We disclose information if required by law or to protect users and the service."],
        ["Retention and deletion", "We keep account and project data while your account is active or as needed for legal, tax, security, and operational reasons. You may request deletion by contacting hello@duitok.com."],
        ["Contact", "For privacy questions, account deletion, or data access requests, contact hello@duitok.com."]
      ]
    : [
        ["Service", "Duitok AI is a web application for TikTok Shop sellers and content teams to create, organize, schedule, and publish or prepare product content."],
        ["Accounts", "You are responsible for keeping your login secure, providing accurate information, and using the service only for content and products you are allowed to promote."],
        ["Generated content", "AI output can contain mistakes. You are responsible for reviewing claims, captions, assets, disclosures, music, product details, and compliance before publishing."],
        ["TikTok publishing", "When TikTok integrations are enabled, posts are created only from user-approved queue items. TikTok may review, limit, reject, or remove content according to its own rules and API policies."],
        ["Payments and credits", "Subscription and generation credits unlock product features. Usage-based credits may be deducted when generation or publishing workflows are requested, subject to the plan terms shown at checkout."],
        ["Acceptable use", "Do not use Duitok AI to infringe intellectual property, impersonate others, bypass platform rules, make unsafe product claims, spam, or publish illegal or harmful content."],
        ["Contact", "For support or legal questions, contact hello@duitok.com."]
      ];

  return `
    <main class="public-shell legal-shell">
      <nav class="public-nav">
        ${brand("Duitok AI")}
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
      ${footerBrand("Duitok AI")}
    </main>`;
}

function featureCard(kicker, title, text, ic) {
  return `<article>${icon(ic, 30)}<span>${kicker}</span><h3>${title}</h3><p>${text}</p></article>`;
}

function heroPanelContent() {
  const data = {
    ms: { label: "AI Selling Generator", title: "1 produk<br>jadi 100+ angle video selling" },
    zh: { label: "AI 带货生成", title: "输入 1 个产品<br>生成 100+ 条带货视频角度" },
    en: { label: "AI Selling Generator", title: "1 product<br>into 100+ selling-video angles" }
  };
  return data[state.lang] || data.ms;
}

function pricePeriodContent() {
  const data = {
    ms: { proof: "RM69/bulan", period: "/bulan" },
    zh: { proof: "RM69/月", period: "/月" },
    en: { proof: "RM69/month", period: "/month" }
  };
  return data[state.lang] || data.ms;
}

function featureMosaicCards() {
  const data = {
    ms: [
      ["01", "Product SOP", "Cari produk yang sesuai diuji dengan short video, bukan sekadar pilih ikut rasa.", "search-check"],
      ["02", "Selling template", "Pain, proof, review, comparison, offer dan before-after template untuk mula cepat.", "layout-template"],
      ["03", "Hook / Script / Caption", "Tidak mula dari blank page. Duitok pecahkan idea kepada struktur content selling.", "message-square-text"],
      ["04", "100+ video angle", "Satu produk boleh jadi banyak angle supaya anda ada volume untuk test data.", "sparkles"],
      ["05", "Review method", "Ikut data, ulang angle yang jalan dan berhenti buang masa pada content yang tidak convert.", "chart-no-axes-combined"]
    ],
    zh: [
      ["01", "选品 SOP", "帮你判断产品是否适合短视频测试，不是凭感觉乱选。", "search-check"],
      ["02", "带货模板", "痛点型、证明型、测评型、对比型、优惠型、before-after 模板。", "layout-template"],
      ["03", "Hook / Script / Caption", "不用从空白页开始想内容，直接按带货结构生成。", "message-square-text"],
      ["04", "100+ 视频角度", "同一个产品拆出更多测试方向，用内容数量换数据。", "sparkles"],
      ["05", "发布复盘方法", "看数据，复制有效内容，停止浪费时间在没效果的角度。", "chart-no-axes-combined"]
    ],
    en: [
      ["01", "Product SOP", "Judge whether a product is suitable for short-video testing instead of guessing.", "search-check"],
      ["02", "Selling templates", "Pain, proof, review, comparison, offer, and before-after templates to start fast.", "layout-template"],
      ["03", "Hook / Script / Caption", "Do not start from a blank page. Duitok turns ideas into selling structures.", "message-square-text"],
      ["04", "100+ video angles", "Turn one product into many testable angles so you have enough data.", "sparkles"],
      ["05", "Review method", "Read data, repeat what works, and stop wasting time on weak content.", "chart-no-axes-combined"]
    ]
  };
  return (data[state.lang] || data.ms).map(([kicker, title, text, ic]) => featureCard(kicker, title, text, ic)).join("");
}

function painCards() {
  const data = {
    ms: [
      ["package-search", "Tak tahu pilih produk", "Produk salah buat semua video susah jalan. Beginner perlukan SOP, bukan tekaan rawak."],
      ["timer", "Hook lemah, orang swipe", "Opening tidak kuat, audience scroll sebelum sempat faham produk anda."],
      ["video", "Tak sempat shoot dan edit", "Ambil barang, setup, record, edit dan caption buat output harian jadi perlahan."],
      ["activity", "Hanya 2-3 video sehari", "Testing volume terlalu kecil. Susah nampak angle mana yang patut diulang."],
      ["receipt", "Guna AI pun masih blur", "AI umum beri jawapan, tapi tidak beri SOP short video selling yang boleh diulang."],
      ["chart-no-axes-combined", "Tidak tahu review data", "Video sudah post, tapi tidak tahu hook, product atau format mana patut scale."]
    ],
    zh: [
      ["package-search", "不知道选什么产品", "产品选错，视频再多也很难跑。新手需要选品 SOP，不是自己乱猜。"],
      ["timer", "Hook 弱，用户直接滑走", "开头没有抓住注意力，用户还没理解产品就已经离开。"],
      ["video", "没时间拍摄剪辑", "拿货、布景、拍摄、剪辑、写 caption，每一步都会拖慢产出。"],
      ["activity", "每天只发 2-3 条", "测试量太少，很难看出哪个角度应该继续复制。"],
      ["receipt", "自己用 AI 也很乱", "普通 AI 给答案，但不给短视频带货 SOP 和执行顺序。"],
      ["chart-no-axes-combined", "不知道怎么复盘", "发了视频，但不知道该放大哪个 hook、产品或内容格式。"]
    ],
    en: [
      ["package-search", "No product-selection method", "The wrong product makes every video harder to sell. Beginners need SOP, not random guessing."],
      ["timer", "Weak hooks get skipped", "If the opening does not stop attention, people scroll before they understand the product."],
      ["video", "No time to film and edit", "Product handling, setup, filming, editing, and captions slow down daily output."],
      ["activity", "Only 2-3 videos a day", "Testing volume is too small to know which angle deserves repetition."],
      ["receipt", "Generic AI is still confusing", "Generic AI gives answers, but not a repeatable short-video selling SOP."],
      ["chart-no-axes-combined", "No data review method", "Videos are posted, but you do not know which hook, product, or format to scale."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([ic, title, text]) => `<article>${icon(ic, 24)}<h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function whyDuitokContent() {
  const data = {
    ms: {
      kicker: "Kenapa bukan AI biasa",
      title: "Guna AI sendiri mudah jadi random, Duitok beri sistem yang boleh diikuti",
      copy: "AI umum hanya beri output. Duitok gabungkan template short video selling, tutorial SOP, product method dan platform supaya beginner tahu apa perlu dibuat selepas tekan generate."
    },
    zh: {
      kicker: "为什么不是自己用普通 AI",
      title: "你拿到的<br>是一套带货系统",
      copy: "普通 AI 只给你生成能力，但不告诉你怎么做短视频带货。Duitok 把模板、教程、SOP、选品方法和 AI 平台放在一起，让新手可以跟着方法执行。"
    },
    en: {
      kicker: "Why not generic AI",
      title: "Generic AI makes random output, Duitok gives you a system to follow",
      copy: "Generic AI gives generation ability, but not a selling method. Duitok combines short-video templates, SOP tutorials, product methods, and platform execution so beginners know what to do next."
    }
  };
  return data[state.lang] || data.ms;
}

function whyDuitokCards() {
  const data = {
    ms: [
      ["layout-template", "Ada template", "Pain, comparison, proof, review, offer dan before-after template supaya tidak mula dari kosong."],
      ["graduation-cap", "Ada tutorial", "Ikut SOP untuk pilih produk, generate video, post, baca data dan scale angle yang jalan."],
      ["wand-sparkles", "Ada platform", "Duitok AI bantu gandakan execution dari 2-3 video manual ke 100+ video angle sehari."],
      ["badge-dollar-sign", "Ada pengalaman", "Student ikut tutorial dan platform kami, ada yang capai RM1000+ pada minggu pertama."]
    ],
    zh: [
      ["layout-template", "有模板", "痛点型、对比型、证明型、测评型、优惠型、before-after 模板，不用从 0 想内容。"],
      ["graduation-cap", "有教程", "跟着 SOP 做选品、生成视频、发布、看数据、复制有效内容。"],
      ["wand-sparkles", "有平台", "Duitok AI 帮你把执行速度从每天 2-3 条手工视频，放大到 100+ 条视频角度。"],
      ["badge-dollar-sign", "有经验", "已有学员根据我们的教程和平台执行，第一个星期赚到 RM1000+。"]
    ],
    en: [
      ["layout-template", "Templates", "Pain, comparison, proof, review, offer, and before-after templates so you do not start from zero."],
      ["graduation-cap", "Tutorials", "Follow SOPs for product selection, video generation, posting, data review, and scaling what works."],
      ["wand-sparkles", "Platform", "Duitok AI expands execution from 2-3 manual videos to 100+ video angles a day."],
      ["badge-dollar-sign", "Experience", "Some students followed our tutorials and platform to earn RM1000+ in their first week."]
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
      ["search-check", "Pilih produk", "Guna SOP untuk cari produk yang sesuai diuji dengan short video."],
      ["list-tree", "Pecahkan selling point", "Tukar produk kepada pain, proof, comparison, offer dan review angle."],
      ["layout-template", "Pilih template", "Gunakan template pain, proof, review, comparison, offer atau before-after."],
      ["sparkles", "Generate content", "Bina hook, skrip, caption, visual direction dan 100+ video angle."],
      ["send", "Publish dan test", "Post ke TikTok, Shop, Reels, Shorts atau channel short video lain."],
      ["chart-no-axes-combined", "Review dan scale", "Lihat data, ulang angle yang jalan dan buang yang tidak convert."]
    ],
    zh: [
      ["search-check", "选产品", "用 SOP 找适合短视频测试的产品，而不是随便乱选。"],
      ["list-tree", "拆卖点", "把产品拆成痛点、证明、对比、优惠和测评角度。"],
      ["layout-template", "选模板", "套用 pain、proof、review、comparison、offer 或 before-after 模板。"],
      ["sparkles", "生成内容", "批量生成 hook、脚本、caption、画面方向和 100+ 视频角度。"],
      ["send", "发布测试", "发布到 TikTok、TikTok Shop、Reels、Shorts 或其它短视频渠道。"],
      ["chart-no-axes-combined", "复盘放大", "看数据，复制表现好的角度，停止浪费时间在没效果的内容。"]
    ],
    en: [
      ["search-check", "Choose products", "Use the SOP to find products that are suitable for short-video testing."],
      ["list-tree", "Break down angles", "Turn each product into pain, proof, comparison, offer, and review angles."],
      ["layout-template", "Pick templates", "Use pain, proof, review, comparison, offer, or before-after templates."],
      ["sparkles", "Generate content", "Create hooks, scripts, captions, visual direction, and 100+ video angles."],
      ["send", "Publish and test", "Post to TikTok, Shop, Reels, Shorts, or other short-video channels."],
      ["chart-no-axes-combined", "Review and scale", "Read the data, repeat winning angles, and cut what does not convert."]
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
      ["Product cover", "Cover visual untuk hook pertama", "AI product image", "RM0.10", "image"]
    ],
    zh: [
      ["Skincare", "为什么你的皮肤一到下午就暗沉？", "UGC 带货视频", "RM0.40", "video"],
      ["Kitchenware", "这个厨房小工具，真的省掉一半时间", "产品演示视频", "RM0.40", "video"],
      ["Supplement", "给还在犹豫的买家一个 before-after 证明", "证明型脚本", "RM0.40", "video"],
      ["Gadget", "买这个 model 前先看这 3 个点", "对比型视频", "RM0.40", "video"],
      ["Fashion", "一件单品，拆出多个 try-on 角度", "穿搭展示视频", "RM0.40", "video"],
      ["Product cover", "让用户停下来的第一张封面图", "AI 产品图", "RM0.10", "image"]
    ],
    en: [
      ["Skincare", "Why does your skin look dull by afternoon?", "UGC selling video", "RM0.40", "video"],
      ["Kitchenware", "This small kitchen tool saves half the prep time", "Product demo video", "RM0.40", "video"],
      ["Supplement", "A before-after proof angle for hesitant buyers", "Proof script", "RM0.40", "video"],
      ["Gadget", "3 reasons buyers choose this model", "Comparison video", "RM0.40", "video"],
      ["Fashion", "One product, multiple try-on angles", "Style video", "RM0.40", "video"],
      ["Product cover", "A cover image that stops the scroll", "AI product image", "RM0.10", "image"]
    ]
  };
  return (data[state.lang] || data.ms).map(([category, hook, type, cost, kind]) => demoCard(category, hook, type, cost, kind)).join("");
}

function demoKickerContent() {
  const data = {
    ms: "Short Video Selling Demo",
    zh: "短视频带货 Demo",
    en: "Short Video Selling Demo"
  };
  return data[state.lang] || data.ms;
}

function comparisonContent() {
  const data = {
    ms: {
      title: "Cara manual lambat, Duitok bantu anda test lebih banyak angle",
      oldTitle: "Cara manual",
      oldBullets: ["Minta barang dari merchant", "Shoot produk dan ulang take", "Fikir hook sendiri", "Edit video dan tulis caption", "Sehari hanya 2-3 video", "Testing volume kecil, data lambat nampak"],
      newTitle: "Cara Duitok AI",
      newBullets: ["Masukkan product info", "Pilih template selling", "Generate hook, script dan caption", "Pecahkan 100+ video angle", "Image RM0.10, video RM0.40", "Post, review data dan ulang angle yang jalan"]
    },
    zh: {
      title: "手动做太慢<br>Duitok 帮你测试更多角度",
      oldTitle: "旧方法：自己手动做",
      oldBullets: ["跟商家拿货", "拍摄产品和重拍", "自己想 hook", "剪辑视频和写 caption", "一天只能做 2-3 条", "测试量太少，很难看出数据"],
      newTitle: "Duitok 方法",
      newBullets: ["输入产品信息", "套用带货模板", "生成 hook、脚本、caption", "拆出 100+ 视频角度", "图片 RM0.10，视频 RM0.40", "发布测试，复盘后复制有效角度"]
    },
    en: {
      title: "Manual production is slow, Duitok helps you test more angles",
      oldTitle: "Manual way",
      oldBullets: ["Request products from merchants", "Film products and repeat takes", "Think of hooks alone", "Edit videos and write captions", "Only 2-3 videos a day", "Too little testing volume to see data"],
      newTitle: "Duitok AI way",
      newBullets: ["Add product info", "Choose selling templates", "Generate hooks, scripts, and captions", "Break into 100+ video angles", "Images RM0.10, videos RM0.40", "Publish, review data, and repeat winning angles"]
    }
  };
  return data[state.lang] || data.ms;
}

function testVolumeContent() {
  const data = {
    ms: {
      kicker: "Kenapa perlu AI",
      title: "Short video selling menang dengan testing volume",
      copy: "Anda tidak tahu produk, hook atau angle mana yang akan convert sebelum ia dipost dan diuji. Duitok gunakan AI untuk bantu anda test lebih banyak angle dengan kos yang jelas."
    },
    zh: {
      kicker: "为什么一定要用 AI",
      title: "短视频带货<br>靠的是测试量",
      copy: "你无法提前知道哪个产品、hook 或角度会出单。更有效的方法，是快速做出更多内容、发布、看数据，再复制有效角度。"
    },
    en: {
      kicker: "Why AI matters",
      title: "Short-video selling is not inspiration, it is testing volume",
      copy: "You do not know which product, hook, or angle will convert until it is published and tested. Duitok uses AI to help you test more angles with clear costs."
    }
  };
  return data[state.lang] || data.ms;
}

function testVolumeSteps() {
  const data = {
    ms: [
      ["1", "Lebih banyak angle", "Satu produk dipecahkan kepada pain, proof, review, comparison dan offer."],
      ["2", "Lebih banyak post", "Lebih banyak content memberi lebih banyak peluang view dan signal data."],
      ["3", "Lebih cepat nampak data", "Anda tahu hook, produk dan format mana yang patut diteruskan."],
      ["4", "Scale yang jalan", "Ulang angle yang ada response, berhenti buang masa pada content lemah."]
    ],
    zh: [
      ["1", "更多视频角度", "一个产品拆成痛点、证明、测评、对比和优惠角度。"],
      ["2", "更多发布机会", "更多内容代表更多曝光机会，也代表更多数据反馈。"],
      ["3", "更快看到数据", "你能更快判断哪个产品、hook 和内容格式值得继续。"],
      ["4", "复制有效内容", "把有反应的角度继续放大，停止浪费时间在无效内容上。"]
    ],
    en: [
      ["1", "More angles", "Break one product into pain, proof, review, comparison, and offer angles."],
      ["2", "More posts", "More content creates more view chances and more data signals."],
      ["3", "Faster data", "See which product, hook, and format deserves more effort."],
      ["4", "Scale what works", "Repeat responsive angles and stop wasting time on weak content."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([number, title, text]) => `<article><b>${number}</b><span>${title}</span><p>${text}</p></article>`)
    .join("");
}

function dreamContent() {
  const data = {
    ms: {
      kicker: "Target imagination",
      title: "Cari satu video yang boleh jual dahulu, lepas itu baru scale akaun dan channel",
      copy: "Short video selling ialah testing game. Lebih banyak template video yang anda post, lebih banyak data anda kumpul, dan lebih cepat anda nampak angle yang patut diulang."
    },
    zh: {
      kicker: "梦想感与执行方向",
      title: "先跑出一个能出单的视频<br>再放大账号和渠道",
      copy: "短视频带货的核心是测试。更多视频代表更多曝光机会，更多数据，也更有机会找到能出单的内容。"
    },
    en: {
      kicker: "Target imagination",
      title: "Find one selling video first, then scale accounts and channels",
      copy: "Short-video selling is a testing game. More template-based videos mean more exposure, more data, and more chances to find content that converts."
    }
  };
  return data[state.lang] || data.ms;
}

function dreamCards() {
  const data = {
    ms: [
      ["RM69", "Kos mula", "Masuk sistem AI short video selling."],
      ["100+", "Video sehari", "Lebih banyak content untuk diuji."],
      ["RM1000+", "Student week 1 case", "Case sebenar, bukan guarantee semua orang."],
      ["Multi", "Channel scale", "TikTok, Shop, Reels, Shorts dan produk lokal."]
    ],
    zh: [
      ["RM69", "开始成本", "低成本进入 AI 短视频带货系统。"],
      ["100+", "每日视频角度", "用更多内容换更多测试机会。"],
      ["RM1000+", "学员首周案例", "真实案例，不代表人人保证。"],
      ["多渠道", "放大空间", "TikTok、Shop、Reels、Shorts 和本地产品。"]
    ],
    en: [
      ["RM69", "Entry cost", "Enter the AI short-video selling system."],
      ["100+", "Daily video angles", "Create more content to run more tests."],
      ["RM1000+", "Student week-one case", "A real case, not a guarantee for everyone."],
      ["Multi", "Channel scale", "TikTok, Shop, Reels, Shorts, and local products."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([value, name, role]) => `<article><p>${value}</p><b>${name}</b><span>${role}</span></article>`)
    .join("");
}

function studentCaseContent() {
  const data = {
    ms: {
      kicker: "Student case",
      title: "Ikut kaedah, ada student minggu pertama capai RM1000+",
      copy: "Student kami ikut tutorial Duitok, guna platform untuk generate video selling secara batch, kemudian post dan test ikut template. Ada yang capai RM1000+ pada minggu pertama.",
      note: "Ini bukan jaminan setiap orang akan dapat result sama. Income bergantung pada produk, akaun, posting frequency, content quality, market feedback dan execution.",
      badge: "Week 1 case",
      cardCopy: "Template + tutorial + platform + execution volume.",
      bullets: ["Ikut tutorial Duitok", "Generate video dengan platform", "Post dan test ikut template", "RM1000+ case pada minggu pertama"]
    },
    zh: {
      kicker: "学员出单案例",
      title: "跟着方法做<br>有人首周做到 RM1000+",
      copy: "已有学员根据 Duitok 教程和平台流程执行，用 AI 批量生成带货视频，并按照模板持续发布和测试，在第一周跑出 RM1000+ 案例。",
      note: "这个结果不代表每个人都会一样。实际收益取决于选品、账号状态、发布频率、内容质量、市场反馈和执行力。",
      badge: "Week 1 Case",
      cardCopy: "模板 + 教程 + 平台 + 执行量。",
      bullets: ["跟着 Duitok 教程执行", "使用 AI 批量生成带货视频", "按模板发布和测试内容", "第一个星期 RM1000+ 案例"]
    },
    en: {
      kicker: "Student case",
      title: "Some students followed the method and earned RM1000+ in week one",
      copy: "Students followed Duitok tutorials, used the platform to batch-generate selling videos, then posted and tested content using the templates. Some reached RM1000+ in their first week.",
      note: "This does not mean everyone will get the same result. Income depends on products, account condition, posting frequency, content quality, market feedback, and execution.",
      badge: "Week 1 case",
      cardCopy: "Templates + tutorials + platform + execution volume.",
      bullets: ["Followed Duitok tutorials", "Generated videos with the platform", "Posted and tested with templates", "RM1000+ first-week case"]
    }
  };
  return data[state.lang] || data.ms;
}

function sevenDayContent() {
  const data = {
    ms: {
      kicker: "Beginner path",
      title: "Selepas subscribe, 7 hari pertama boleh jalan ikut plan ini",
      copy: "Duitok bukan suruh anda tekan butang secara rawak. Ia memberi urutan kerja supaya beginner tahu langkah pertama, batch pertama dan data pertama yang perlu dilihat."
    },
    zh: {
      kicker: "新手 7 天路径",
      title: "订阅后第一周<br>这样开始",
      copy: "Duitok 不是让你随机按按钮，而是给你一条新手执行路径：先学方法，再选品，再生成第一批内容，最后根据数据复盘。"
    },
    en: {
      kicker: "Beginner path",
      title: "After subscribing, your first 7 days can follow this plan",
      copy: "Duitok does not ask you to press random buttons. It gives beginners a work sequence from learning, product selection, generation, publishing, and review."
    }
  };
  return data[state.lang] || data.ms;
}

function sevenDaySteps() {
  const data = {
    ms: [
      ["Day 1", "Belajar SOP", "Faham short video selling, credit dan cara guna template."],
      ["Day 2", "Pilih 3-5 produk", "Guna product method untuk cari produk yang sesuai diuji."],
      ["Day 3", "Generate hook", "Bina batch hook, script dan caption pertama."],
      ["Day 4", "Generate visual", "Cipta image atau video mengikut kos RM0.10 / RM0.40."],
      ["Day 5", "Post batch pertama", "Publish content ke channel pilihan anda."],
      ["Day 6", "Baca data", "Lihat view, retention, click dan response."],
      ["Day 7", "Ulang angle yang jalan", "Scale hook dan produk yang ada signal."]
    ],
    zh: [
      ["Day 1", "看教程，懂 SOP", "先理解短视频带货流程、credit 机制和模板用法。"],
      ["Day 2", "选择 3-5 个产品", "用选品方法找适合短视频测试的产品方向。"],
      ["Day 3", "生成第一批 hook", "用模板生成 hook、脚本和 caption。"],
      ["Day 4", "生成图片或视频", "按 RM0.10 / RM0.40 的成本测试第一批内容。"],
      ["Day 5", "发布第一批内容", "把内容发布到 TikTok、Reels、Shorts 或其他渠道。"],
      ["Day 6", "看数据反馈", "观察浏览量、停留、点击和互动。"],
      ["Day 7", "复制有效角度", "把有反应的 hook、产品和格式继续放大测试。"]
    ],
    en: [
      ["Day 1", "Learn the SOP", "Understand the selling workflow, credits, and templates."],
      ["Day 2", "Pick 3-5 products", "Use the product method to find testable product directions."],
      ["Day 3", "Generate hooks", "Create your first batch of hooks, scripts, and captions."],
      ["Day 4", "Generate visuals", "Create images or videos at RM0.10 / RM0.40 cost."],
      ["Day 5", "Publish batch one", "Post content to TikTok, Reels, Shorts, or other channels."],
      ["Day 6", "Read data", "Check views, retention, clicks, and responses."],
      ["Day 7", "Repeat working angles", "Scale hooks, products, and formats that show signals."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([day, title, text]) => `<article><span>${day}</span><h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function scenarioContent() {
  const data = {
    ms: {
      kicker: "Bukan TikTok sahaja",
      title: "Duitok AI boleh digunakan untuk mana-mana short video selling",
      copy: "TikTok Affiliate ialah entry scene yang kuat, tetapi kemampuan Duitok ialah generate content selling untuk produk. Selagi anda mahu jual, test atau promote produk melalui short video, sistem ini boleh bantu."
    },
    zh: {
      kicker: "不只 TikTok Affiliate",
      title: "不只 TikTok Affiliate<br>任何短视频带货都能用",
      copy: "TikTok Affiliate 是推荐入门场景，但 Duitok AI 的底层能力是短视频带货内容生产。只要你需要用短视频卖产品、测产品、做内容，Duitok 都可以帮你提高执行速度。"
    },
    en: {
      kicker: "Beyond TikTok Affiliate",
      title: "Use Duitok for any AI short-video selling scenario",
      copy: "TikTok Affiliate is a strong entry scene, but Duitok's core ability is producing short-video selling content. If you need to sell, test, or promote products through short videos, the system can help."
    }
  };
  return data[state.lang] || data.ms;
}

function scenarioCards() {
  const data = {
    ms: ["TikTok Affiliate", "TikTok Shop", "Produk lokal", "Shopee / Lazada", "Facebook / Instagram Reels", "YouTube Shorts", "Brand product promo", "Multi-account matrix"],
    zh: ["TikTok Affiliate", "TikTok Shop", "本地商家产品", "Shopee / Lazada 商品短视频", "Facebook / Instagram Reels", "YouTube Shorts", "品牌产品推广", "多账号内容矩阵"],
    en: ["TikTok Affiliate", "TikTok Shop", "Local products", "Shopee / Lazada product videos", "Facebook / Instagram Reels", "YouTube Shorts", "Brand product promos", "Multi-account matrix"]
  };
  return (data[state.lang] || data.ms)
    .map((item) => `<article>${icon("play-square", 20)}<span>${item}</span></article>`)
    .join("");
}

function pricingBullets() {
  const data = {
    ms: ["AI short video selling platform", "Subscribe terus dapat 10 promo credits", "Template short video selling", "Tutorial SOP beginner", "Product selling point breakdown", "Batch hook, skrip dan caption", "Support 100+ video angle sehari", "Image generation RM0.10 setiap gambar", "Video generation RM0.40 setiap video", "Multi-channel content planning", "WhatsApp support"],
    zh: ["AI 带货视频生成平台", "订阅立即送 10 credits", "短视频带货模板库", "新手教学 SOP", "产品卖点拆解", "批量 hook、脚本、caption", "支持一天 100+ 视频角度", "图片生成 RM0.10 / 张", "视频生成 RM0.40 / 条", "多渠道内容计划", "WhatsApp 客服支持"],
    en: ["AI short-video selling platform", "Subscribe and get 10 promo credits", "Short-video selling templates", "Beginner SOP tutorials", "Product selling-point breakdown", "Batch hooks, scripts, and captions", "Supports 100+ video angles a day", "Image generation at RM0.10 each", "Video generation at RM0.40 each", "Multi-channel content planning", "WhatsApp support"]
  };
  return data[state.lang] || data.ms;
}

function usagePriceCards() {
  const data = {
    ms: [
      ["Image", "RM0.10", "setiap gambar"],
      ["Video", "RM0.40", "setiap video"]
    ],
    zh: [
      ["图片", "RM0.10", "每张生成"],
      ["视频", "RM0.40", "每条生成"]
    ],
    en: [
      ["Image", "RM0.10", "per generation"],
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
      ["Membership", "RM69/bulan"],
      ["Promo credit", "10 credits"],
      ["Image generation", "RM0.10 / image"],
      ["Video generation", "RM0.40 / video"]
    ],
    zh: [
      ["月会员费", "RM69/月"],
      ["订阅赠送", "10 credits"],
      ["图片生成", "RM0.10 / 张"],
      ["视频生成", "RM0.40 / 条"]
    ],
    en: [
      ["Membership", "RM69/month"],
      ["Promo credits", "10 credits"],
      ["Image generation", "RM0.10 / image"],
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
      ["1", "Subscribe RM69/bulan", "Buka platform, template, tutorial dan SOP."],
      ["2", "Dapat 10 credits", "Gunakan untuk test batch content pertama."],
      ["3", "Generate ikut credit", "Image RM0.10, video RM0.40. Guna berapa, tolak berapa."]
    ],
    zh: [
      ["1", "订阅 RM69/月", "开通平台、模板、教程和 SOP。"],
      ["2", "获得 10 credits", "先测试第一批内容，不用一开始大量充值。"],
      ["3", "生成时扣 credits", "图片 RM0.10，视频 RM0.40。生成多少，用多少。"]
    ],
    en: [
      ["1", "Subscribe RM69/month", "Unlock the platform, templates, tutorials, and SOP."],
      ["2", "Get 10 credits", "Use them to test your first content batch."],
      ["3", "Generate with credits", "Images RM0.10, videos RM0.40. Pay only for what you generate."]
    ]
  };
  return (data[state.lang] || data.ms)
    .map(([step, title, text]) => `<article><b>${step}</b><span>${title}</span><p>${text}</p></article>`)
    .join("");
}

function includedCreditBanner() {
  const data = {
    ms: "Promotion sekarang: subscribe dan dapat 10 credits",
    zh: "现在 promotion：订阅就送 10 credits",
    en: "Current promotion: subscribe and get 10 credits"
  };
  return data[state.lang] || data.ms;
}

function controlCards() {
  const data = {
    ms: ["RM69/bulan untuk platform, template dan SOP", "Duitok AI bantu output, bukan guarantee income", "Lebih banyak video memberi lebih banyak peluang data", "Anda tetap perlu pilih produk, post dan review result", "RM1000+ student case ialah bukti kemungkinan, bukan janji fixed"],
    zh: ["RM69/月包含平台、模板和 SOP", "Duitok AI 提高产出，不保证收益", "更多视频带来更多测试数据", "你仍然需要选品、发布和复盘结果", "RM1000+ 学员案例是可能性证明，不是固定承诺"],
    en: ["RM69/month includes platform, templates, and SOP", "Duitok AI improves output; it does not guarantee income", "More videos create more testing data", "You still choose products, publish, and review results", "The RM1000+ student case shows possibility, not a fixed promise"]
  };
  return (data[state.lang] || data.ms)
    .map((item) => `<article>${icon("check-circle-2", 20)}<p>${item}</p></article>`)
    .join("");
}

function faqItems() {
  const data = {
    ms: [
      ["Duitok AI guarantee boleh buat duit?", "Tidak. Duitok AI beri platform, template, tutorial dan kaedah untuk mula short video selling dengan AI. Income bergantung pada produk, akaun, posting, content quality, market feedback dan execution."],
      ["Kenapa tidak guna AI biasa sahaja?", "AI biasa hanya beri output. Duitok beri template, SOP, product method dan platform supaya beginner tahu video apa perlu dibuat, bagaimana post dan bagaimana review data."],
      ["RM69 itu unlimited generate?", "Bukan. RM69 ialah membership bulanan untuk akses platform, template, tutorial dan SOP. Generate guna credits supaya kos jelas dan terkawal."],
      ["10 credits boleh buat apa?", "10 credits cukup untuk test batch pertama. Contohnya anda boleh campur beberapa video RM0.40 dan image RM0.10 mengikut produk yang mahu diuji."],
      ["Credits habis macam mana?", "Anda boleh top up semula. Duitok guna konsep generate berapa, bayar berapa supaya anda tidak perlu komit kos besar dari awal."],
      ["Saya perlu shoot video sendiri?", "Tidak semestinya. Fokus Duitok AI ialah bantu anda generate video selling, hook, skrip dan caption supaya tidak tersekat pada shooting manual setiap hari."],
      ["Mesti buat TikTok Affiliate sahaja?", "Tidak. TikTok Affiliate ialah entry scene yang kuat, tetapi Duitok AI sesuai untuk TikTok Shop, produk lokal, Reels, Shorts dan short video selling lain."],
      ["Betul boleh generate 100+ video sehari?", "Workflow direka untuk batch generation. Jumlah sebenar bergantung pada credit, input produk dan cara anda operate, tetapi matlamatnya ialah jauh lebih laju daripada 2-3 video manual."],
      ["Student minggu pertama RM1000+ itu confirmed untuk semua?", "Tidak. Itu case daripada student yang ikut tutorial dan guna platform. Result setiap orang berbeza bergantung pada produk, akaun, content, market dan execution."],
      ["RM69 termasuk apa?", "RM69 ialah yuran membership bulanan untuk akses Duitok AI platform, template short video selling, tutorial SOP, hook/script/caption workflow dan basic support. Promotion sekarang: subscribe dan dapat 10 credits. Generation credit dikira jelas: image RM0.10 dan video RM0.40."]
    ],
    zh: [
      ["Duitok AI 是保证赚钱吗？", "不保证。Duitok AI 提供平台、模板、教程和方法，帮助你更快开始短视频带货。实际收益取决于选品、账号、内容质量、市场反馈和执行力。"],
      ["为什么不用普通 AI 工具？", "普通 AI 工具只给你生成能力，但不告诉你怎么做短视频带货。Duitok 提供模板、教程、SOP 和平台，让新手可以跟着方法执行。"],
      ["RM69 是无限生成吗？", "不是。RM69 是每月会员费，用来开通平台、模板、教程和 SOP。生成内容会按 credits 扣费，这样成本更清楚。"],
      ["10 credits 可以做什么？", "10 credits 可以先测试第一批内容。你可以混合生成一些 RM0.40 的视频和 RM0.10 的图片，看哪个产品和角度值得继续放大。"],
      ["Credits 用完怎么办？", "之后可以再 top up。Duitok 的逻辑是生成多少用多少，不需要一开始投入很大的内容成本。"],
      ["我不会拍视频可以用吗？", "可以。Duitok AI 主打减少拍摄和剪辑压力，帮助你生成带货视频方向、脚本、caption 和不露脸内容。"],
      ["一定要做 TikTok Affiliate 吗？", "不一定。TikTok Affiliate 是推荐入门场景，但 Duitok AI 适合任何需要短视频带货的场景。"],
      ["没有 TikTok Affiliate 账号可以吗？", "可以。你也可以先用 Duitok 做 TikTok Shop、本地产品、Shopee / Lazada、Reels、Shorts 或品牌产品推广内容。"],
      ["一天 100+ 视频是真的吗？", "平台流程是为了批量生成视频角度和内容而设计，具体数量取决于使用方式、credit 和产品素材。"],
      ["学员第一个星期 RM1000+ 是保证吗？", "不是保证。这是已有学员根据教程和平台执行后的案例，结果因人而异。"],
      ["RM69 包含什么？", "RM69 是每月会员费，包含 Duitok AI 平台使用、短视频带货模板、教学 SOP、hook/script/caption 生成流程和基础支持。现在 promotion：订阅送 10 credits。生成费用另外按 credit 计算：图片 RM0.10，视频 RM0.40。"]
    ],
    en: [
      ["Does Duitok AI guarantee income?", "No. Duitok AI provides a platform, templates, tutorials, and method to help you start short-video selling. Results depend on products, accounts, content quality, market feedback, and execution."],
      ["Why not use a generic AI tool?", "Generic AI gives generation ability but not a selling method. Duitok provides templates, tutorials, SOP, and a platform so beginners can follow a workflow."],
      ["Is RM69 unlimited generation?", "No. RM69 is the monthly membership fee for platform access, templates, tutorials, and SOP. Generations use credits so costs stay clear."],
      ["What can I do with 10 credits?", "10 credits lets you test your first content batch. You can mix RM0.40 videos and RM0.10 images depending on the product you want to test."],
      ["What happens when credits run out?", "You can top up again. Duitok is designed so you pay for what you generate instead of committing a large content budget upfront."],
      ["Do I need to film videos myself?", "Not necessarily. Duitok AI reduces filming and editing pressure by generating selling video directions, scripts, captions, and no-face content ideas."],
      ["Must I do TikTok Affiliate only?", "No. TikTok Affiliate is a recommended entry scene, but Duitok AI works for any short-video selling scenario."],
      ["Can I use it without a TikTok Affiliate account?", "Yes. You can start with TikTok Shop, local products, Shopee / Lazada, Reels, Shorts, or brand product promotions."],
      ["Can it really generate 100+ videos a day?", "The workflow is designed for batch video angles and content. Actual quantity depends on usage style, credits, and product inputs."],
      ["Is the RM1000+ first-week student case guaranteed?", "No. It is a case from students who followed the tutorial and used the platform. Results vary by product, account, content, market, and execution."],
      ["What does RM69 include?", "RM69 is the monthly membership fee. It includes Duitok AI platform access, short-video selling templates, SOP tutorials, hook/script/caption workflow, and basic support. Current promotion: subscribe and get 10 credits. Generation credit is transparent: RM0.10 per image and RM0.40 per video."]
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
    <div class="demo-screen">
      ${icon(ic, 34)}
      <small>${cost}</small>
    </div>
    <span>${category}</span>
    <h3>${hook}</h3>
    <p>${type}</p>
  </article>`;
}

function login() {
  const payment = state.paymentReturn;
  const emailValue = payment?.buyer?.email || "";
  const paymentNotice = payment ? `
    <div class="payment-return ${payment.status === "paid" ? "paid" : "pending"}">
      <b>${payment.status === "paid" ? "Payment confirmed" : "Payment status: " + esc(payment.status)}</b>
      <p>${payment.status === "paid"
        ? "Your Duitok AI Pro account is active. Sign in with the password you created during checkout."
        : "If you have just paid, the CHIP callback may need a moment. Refresh the payment status before trying again."}</p>
      <div>
        <button class="dark-button mini-button" data-action="refresh-payment-status" data-order="${esc(payment.orderId)}">${icon("refresh-cw", 15)} Refresh status</button>
        ${payment.checkoutUrl ? `<a class="gold-button mini-button" href="${esc(payment.checkoutUrl)}">${icon("credit-card", 15)} Continue checkout</a>` : ""}
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
  return `
    <div class="studio-shell">
      <aside class="sidebar">
        ${brand()}
        <div class="sidebar-language">${languageSwitch()}</div>
        <div class="side-section">${icon("layout-dashboard", 18)} Workspace</div>
        <button class="side-primary ${state.page === "dashboard" ? "active" : ""}" data-page="dashboard">${icon("sparkles")} ${t("dashboard")}</button>
        ${isOwnerAdminAccount() ? `<button class="side-link ${state.page === "admin" ? "active" : ""}" data-page="admin">${icon("shield-check")} Admin CRM</button>` : ""}
        <button class="side-link ${state.page === "agent" ? "active" : ""}" data-page="agent">${icon("bot")} Duitok Agent</button>
        <button class="side-link ${state.page === "library" ? "active" : ""}" data-page="library">${icon("folder")} Content Library</button>
        <button class="side-link ${state.page === "autopost" ? "active" : ""}" data-page="autopost">${icon("calendar-days")} Scheduler</button>
        <button class="new-project" data-action="new-project">${icon("plus")} <span>${t("newProject")}</span><b>${state.db.projects.length}/5</b></button>
        <label class="search-box">${icon("search", 18)}<input data-search value="${esc(state.search)}" placeholder="${t("search")}"></label>
        <div class="side-section">${icon("folder", 18)} ${t("projects")}</div>
        <div class="project-list">${projectButtons()}</div>
        <div class="side-section account">${icon("wand-sparkles", 18)} Create</div>
        ${steps.map(([id, ic, key]) => `<button class="side-link ${state.page === "project" && state.step === id ? "active" : ""}" data-step-open="${id}">${icon(ic)} ${t(key)}</button>`).join("")}
        <div class="side-section account">${icon("wallet-cards", 18)} Business</div>
        ${[
          ["billing", "credit-card", "billing"],
          ["topup", "wallet-cards", "topup"],
          ["usage", "activity", "usage"],
          ["affiliate", "users", "affiliate"]
        ].map(([id, ic, key]) => `<button class="side-link ${state.page === id ? "active" : ""}" data-page="${id}">${icon(ic)} ${t(key)}</button>`).join("")}
        <div class="side-section account">${icon("life-buoy", 18)} Support</div>
        <button class="side-link" data-action="support">${icon("ticket")} Contact Support</button>
        <button class="side-link" data-action="sop">${icon("book-open")} SOP</button>
        <button class="side-link ${state.page === "autopost" ? "active" : ""}" data-page="autopost">${icon("send")} ${t("autopost")}</button>
        <button class="side-link ${state.page === "whatsapp" ? "active" : ""}" data-page="whatsapp">${icon("message-circle")} ${t("whatsapp")}${icon("arrow-up-right", 14)}</button>
        ${sidebarAccountPanel()}
      </aside>
      <main class="workspace">${page()}</main>
      <button class="chat-bubble support-bubble" data-action="support" title="Contact support">${icon("message-circle", 32)}</button>
      ${modal()}
    </div>`;
}

function brand(label = "") {
  const labelMarkup = label ? `<strong class="brand-context">${label}</strong>` : "";
  return `<div class="brand-lockup"><span class="brand-core" aria-label="Duitok AI"><img class="brand-logo-mascot" src="${brandAssets.mascot}" alt="" aria-hidden="true"><span class="brand-wordmark"><span>Duitok</span><span>AI</span></span></span>${labelMarkup}</div>`;
}

function footerBrand(label = "Duitok AI") {
  const labelMarkup = label && label !== "Duitok AI" ? `<b>${label}</b>` : "";
  return `<footer class="public-footer"><span class="footer-brand"><span class="brand-core footer-brand-core" aria-label="Duitok AI"><img class="brand-logo-mascot" src="${brandAssets.mascot}" alt="" aria-hidden="true"><span class="brand-wordmark"><span>Duitok</span><span>AI</span></span></span>${labelMarkup}</span><span>© 2026</span><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="mailto:hello@duitok.com">hello@duitok.com</a></footer>`;
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
    plan: billing.plan || "Duitok AI Pro",
    nextBill,
    daysLeft,
    expired,
    label: expired ? "Expired" : `${daysLeft} days left`,
    expiryText: nextBill ? `Expires ${formatReadableDate(nextBill)}` : "No expiry date"
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
        <span>${icon("wallet-cards", 18)} Credit Balance</span>
        <b>${formatCreditNumber(billing.credits || 0)}</b>
        <button type="button" data-page="topup">${icon("plus", 18)} Top Up</button>
      </article>
      <article class="sidebar-subscription-card ${subscription.expired ? "expired" : ""}">
        <strong><i></i>${subscription.expired ? "Expired" : "Pro"} <em>·</em> ${subscription.label}</strong>
        <span>${subscription.expiryText}</span>
      </article>
      <div class="sidebar-user-card">
        <span class="sidebar-avatar">${accountInitials(user.name)}</span>
        <div><b>${esc(user.name || "Duitok User")}</b><small>${esc(user.email || "")}</small></div>
      </div>
      <div class="sidebar-account-actions">
        <button type="button" class="${state.page === "settings" ? "active" : ""}" data-page="settings">${icon("settings", 18)} Settings</button>
        <button type="button" data-action="logout">${icon("log-out", 18)} Sign out</button>
      </div>
    </section>`;
}

function projectButtons() {
  return state.db.projects
    .filter((item) => item.name.toLowerCase().includes(state.search.toLowerCase()))
    .map((item) => {
      const active = item.id === state.projectId && state.page === "project";
      const menuOpen = state.projectMenuId === item.id;
      return `
        <div class="project-menu-item ${active ? "active" : ""} ${menuOpen ? "menu-open" : ""}">
          <button class="project-button ${active ? "active" : ""}" data-project="${item.id}">
            <span class="project-icon">${icon("folder", 22)}</span>
            <span>${esc(item.name)}</span>
          </button>
          <button class="project-more" type="button" data-project-menu="${item.id}" aria-label="Project actions" title="Project actions">${icon("ellipsis", 18)}</button>
          ${menuOpen ? `
            <div class="project-action-menu">
              <button type="button" data-project-rename="${item.id}">${icon("pencil", 19)} Rename</button>
              <button type="button" class="danger" data-project-delete="${item.id}">${icon("trash-2", 19)} Delete</button>
            </div>` : ""}
        </div>`;
    })
    .join("") || `<p class="empty-text">No projects found.</p>`;
}

function page() {
  if (state.page === "admin") return adminPage();
  if (state.page === "agent") return agentPage();
  if (state.page === "dashboard") return dashboardOverview();
  if (state.page === "project") return projectPage();
  if (state.page === "library") return contentLibraryPage();
  if (state.page !== "dashboard") return accountPage();
}

function selectedDateRange() {
  const from = new Date(`${state.dateFrom}T00:00:00`);
  const to = new Date(`${state.dateTo}T23:59:59`);
  return { from, to };
}

function allResults() {
  return state.db.projects.flatMap((item) => item.results.map((result) => ({ ...result, projectName: item.name })));
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
  const todayKey = localDateKey(new Date());
  const todayCount = (type) => results.filter((item) => item.type === type && item.createdAt?.startsWith(todayKey)).length;
  const usedCredits = usage.reduce((sum, item) => sum + Number(item.credits || 0), 0);
  const readyPosts = state.db.schedule.filter((item) => item.status === "Ready").length;
  return {
    results,
    usage,
    usedCredits,
    cards: [
      ["Image", typeCount("image"), "image", `${todayCount("image")} today`, "Visual assets"],
      ["UGC", typeCount("ugc"), "video", `${todayCount("ugc")} today`, "Video-ready"],
      ["Auto Content", typeCount("auto"), "wand-sparkles", `${todayCount("auto")} today`, "Batch plans"],
      ["Original Video", typeCount("original"), "film", `${todayCount("original")} today`, "Analyzed"],
      ["Clone Prompt", typeCount("clone") + typeCount("viral"), "layers-3", `${todayCount("clone") + todayCount("viral")} today`, "Patterns"],
      ["Ready to Post", readyPosts, "send", "Scheduler", "Queued"],
      ["Credits Used", usedCredits, "wallet-cards", `${usedCredits} credits`, "Usage"]
    ]
  };
}

function dashboardOverview() {
  const stats = dashboardStats();
  return `
    <header class="project-head dashboard-head">
      <div>
        <p class="folder-label">${icon("sparkles", 18)} Dashboard</p>
        <h1>${t("dashboard")}</h1>
        <p class="subtitle">Production summary for your TikTok affiliate workspace.</p>
      </div>
      <div class="head-actions">
        <button class="dark-button" data-page="topup">${icon("plus")} Top Up Credit</button>
        <button class="sop-button" data-action="sop">${icon("book-open", 24)} SOP Dashboard</button>
      </div>
    </header>
    <section class="dashboard-stat-grid">
      ${stats.cards.map(([label, value, ic, note, meta]) => `<article><div><span>${label}</span><b>${value}</b><small>${note}</small></div>${icon(ic, 24)}<em>${meta}</em></article>`).join("")}
    </section>
    <section class="date-filter-card">
      <h2>${icon("calendar-days", 22)} Filter by date range</h2>
      <label>From Date<input type="date" data-date-field="dateFrom" value="${state.dateFrom}"></label>
      <label>To Date<input type="date" data-date-field="dateTo" value="${state.dateTo}"></label>
      <button class="gold-button" data-action="apply-date">Apply</button>
      <button class="dark-button" data-action="reset-date">Reset</button>
    </section>
    <section class="dashboard-main-grid">
      <article class="chart-card">
        <div class="card-title"><h2>${icon("trending-up", 22)} Daily Production</h2><span>${stats.results.length} total in range</span></div>
        ${productionChart(stats.results)}
      </article>
      <article class="next-action-card">
        <p class="eyebrow">Recommended next action</p>
        <h2>${nextActionTitle()}</h2>
        <p>${nextActionCopy(stats)}</p>
        <div class="next-actions">
          <button class="gold-button" data-page="autopost">${icon("calendar-plus")} Go to Scheduler</button>
          <button class="dark-button" data-step-open="ugc">${icon("video")} Generate UGC</button>
        </div>
      </article>
    </section>
    <section class="dashboard-main-grid">
      <article class="cost-card">
        <div class="card-title"><h2>${icon("receipt-text", 22)} Credit Breakdown</h2><span>Usage ledger</span></div>
        ${costBreakdown(stats)}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("activity", 22)} Recent Activity</h2><span>Backend ledger</span></div>
        ${recentActivity(stats.usage)}
      </article>
    </section>
    <section class="dashboard-main-grid">
      <article class="activity-card">
        <div class="card-title"><h2>${icon("list-checks", 22)} Generation Queue</h2><span>${state.db.generationJobs.length} jobs</span></div>
        ${generationQueueTable(state.db.generationJobs)}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("database", 22)} Asset Storage</h2><span>${state.db.storage?.durableAssets ? "CDN ready" : "Proxy ready"}</span></div>
        ${table([
          ["Current mode", state.db.storage?.durableAssets ? "Duitok media CDN" : "Duitok media proxy", state.db.storage?.message || ""],
          ["Content library", `${allResults().length} assets`, "Generated assets stay attached to your account"],
          ["Publishing", `${state.db.schedule.filter((item) => item.mediaUrl).length} media URLs`, "Scheduler stores the final publish media URL"]
        ])}
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
    <div class="legend-row"><span><i></i> Image</span><span><i></i> UGC</span><span><i></i> Auto Content</span><span><i></i> Video/Research</span></div>
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
  if (stats.results.length === 0) return "No content has been generated in this date range. Start with UGC or Auto Content to build a publishing batch.";
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
  const totalSpend = rows.filter((item) => item.credits < 0).reduce((sum, item) => sum + Math.abs(item.credits), 0);
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

  return `
    <section class="usage-experience">
      <div class="usage-summary-grid">
        ${[
          ["Total Spend", formatCreditNumber(totalSpend), "credits", "spend"],
          ["Images", imageCount, "generated", "image"],
          ["Videos", videoCount, "generated", "video"],
          ["Auto Plans", autoCount, "batches", "auto"]
        ].map(([label, value, helper, tone]) => `<article class="usage-summary-card ${tone}"><span>${label}</span><b>${value}</b><small>${helper}</small></article>`).join("")}
      </div>
      <section class="usage-ledger-panel">
        <div class="usage-filter-row">
          <span>${icon("filter", 18)} Filter</span>
          <div>
            ${filters.map(([id, ic, label]) => `<button class="${state.usageFilter === id ? "active" : ""}" data-usage-filter="${id}">${icon(ic, 16)} ${label}</button>`).join("")}
          </div>
          <small>${icon("calendar-days", 16)} All time</small>
        </div>
        <div class="usage-ledger-table">
          <div class="usage-ledger-head"><span>Action</span><span>Prompt</span><span>Preview</span><span>Date</span><span>Credit</span><span>Balance</span></div>
          ${visibleRows.map((row) => `
            <article>
              <strong>${esc(row.action)}</strong>
              <p>${esc(row.detail || row.action)}</p>
              <em class="${row.category}">${icon(usageCategoryIcon(row.category), 15)} ${usageCategoryLabel(row.category)}</em>
              <time>${row.createdAt ? new Date(row.createdAt).toLocaleString(state.lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</time>
              <b class="${row.credits < 0 ? "debit" : "credit"}">${row.credits > 0 ? "+" : ""}${formatCreditNumber(row.credits)}</b>
              <span>${formatCreditNumber(row.balanceAfter)}</span>
            </article>`).join("") || `<p class="empty-text">No usage records for this filter.</p>`}
        </div>
      </section>
    </section>`;
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
  const status = `${payment.status} | ${kind} | RM ${payment.amount}`;
  const detail = [
    buyer.fullName || buyer.email || payment.userId || "",
    buyer.phone ? (phoneLink ? `<a href="${phoneLink}" target="_blank" rel="noreferrer">${esc(buyer.phone)}</a>` : esc(buyer.phone)) : "",
    payment.errorMessage ? `Error: ${esc(payment.errorMessage)}` : paymentAge(payment),
    adminActions && payment.status !== "paid" ? `<button class="dark-button mini-button" data-admin-clean-payment="${payment.id}">${icon("trash-2", 15)} Cleanup</button>` : ""
  ].filter(Boolean).join(" · ");
  return [payment.orderId, status, detail || (payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "")];
}

function contentLibraryPage() {
  const results = allResults().slice().reverse();
  return `<header class="project-head"><div><p class="folder-label">${icon("folder", 18)} Content Library</p><h1>Generated Assets</h1><p class="subtitle">All project outputs in one place, ready for export or scheduling.</p></div><button class="sop-button" data-action="export-all">${icon("download")} Export Data</button></header><section class="canvas-card slim"><div class="library-grid">${results.map((item) => `<article><b>${item.title}</b><span>${item.projectName}</span>${resultPreview(item)}<button data-result="${item.id}">${icon("download")} ${t("export")}</button></article>`).join("") || `<p class="empty-text">No generated assets yet.</p>`}</div></section>`;
}

function isOwnerAdminAccount() {
  return state.user?.role === "admin" && String(state.user?.email || "").toLowerCase() === ownerAdminEmail;
}

function adminPage() {
  if (!isOwnerAdminAccount()) return `<section class="canvas-card slim"><h1>Admin access required</h1></section>`;
  if (state.user?.adminLocked || !state.db?.admin) {
    return `<section class="canvas-card slim"><h1>Admin verification</h1><p class="subtitle">Enter your private admin key to unlock provider operations, costs, endpoints, and user controls.</p><form data-form="admin-key" class="login-form"><label>Admin key<input name="adminKey" type="password" autocomplete="off" required></label><button class="gold-button" type="submit">${icon("shield-check")} Unlock Admin</button></form></section>`;
  }
  const admin = state.db.admin || {};
  const totals = admin.totals || {};
  const users = admin.users || [];
  const jobs = admin.generationJobs || [];
  const calls = admin.apiCalls || [];
  const adminAuditLogs = admin.adminAuditLogs || [];
  const payments = admin.payments || [];
  const selectedUser = users.find((user) => user.id === state.adminUserId) || users[0];
  const selectedJobs = jobs.filter((job) => job.userId === selectedUser?.id);
  const selectedPayments = payments.filter((payment) => payment.userId === selectedUser?.id);
  const selectedLedger = (admin.creditLedger || []).filter((entry) => entry.userId === selectedUser?.id);
  const selectedProjects = (state.db.projects || []).filter((project) => project.userId === selectedUser?.id);
  const modelCosts = admin.modelCosts || {};
  const permissions = selectedUser?.agentPermissions || {};
  return `
    <header class="project-head dashboard-head">
      <div>
        <p class="folder-label">${icon("shield-check", 18)} Admin CRM</p>
        <h1>Duitok Multi-User CRM</h1>
        <p class="subtitle">Users, generation jobs, API calls, costs, assets, payments, and publish records.</p>
      </div>
      <button class="sop-button" data-action="export-all">${icon("download")} Export CRM Data</button>
    </header>
    <section class="dashboard-stat-grid">
      ${[
        ["Users", totals.users || 0, "users", "All accounts", "CRM"],
        ["Generations", totals.generations || 0, "sparkles", "All jobs", "AI"],
        ["Revenue", `RM ${Number(totals.revenueRm || 0).toFixed(2)}`, "receipt-text", "Paid CHIP", "Sales"],
        ["Cost", `RM ${Number(totals.costRm || 0).toFixed(2)}`, "wallet-cards", "Provider cost", "COGS"],
        ["Profit", `RM ${Number((totals.revenueRm || 0) - (totals.costRm || 0)).toFixed(2)}`, "trending-up", "Revenue - cost", "Margin"],
        ["Failed Calls", totals.failedCalls || 0, "triangle-alert", "API errors", "Ops"]
      ].map(([label, value, ic, note, meta]) => `<article><div><span>${label}</span><b>${value}</b><small>${note}</small></div>${icon(ic, 24)}<em>${meta}</em></article>`).join("")}
    </section>
    <section class="dashboard-main-grid">
      <article class="activity-card">
        <div class="card-title"><h2>${icon("users", 22)} Users</h2><span>${users.length} accounts</span></div>
        ${table(users.map((user) => [user.email, `${user.role} | ${user.projectCount} projects`, `<button class="dark-button mini-button" data-admin-user="${user.id}">${icon("eye", 15)} View</button> Credits ${user.billing?.credits ?? 0} | Cost RM ${Number(user.totalCostRm || 0).toFixed(2)}`]))}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("activity", 22)} API Calls</h2><span>${calls.length} records</span></div>
        ${table(calls.slice(0, 12).map((call) => [call.model || call.provider, `${call.status} | RM ${Number(call.costRm || 0).toFixed(3)}`, call.endpoint || call.taskId || ""]))}
      </article>
    </section>
    <section class="dashboard-main-grid">
      <article class="activity-card">
        <div class="card-title"><h2>${icon("id-card", 22)} User Detail</h2><span>${selectedUser?.email || "No user"}</span></div>
        ${selectedUser ? `<div class="metric-row">
      <article><span>Credits</span><strong>${selectedUser.billing?.credits ?? 0}</strong></article>
          <article><span>Revenue</span><strong>RM ${Number(selectedUser.totalRevenueRm || 0).toFixed(2)}</strong></article>
          <article><span>Profit</span><strong>RM ${Number(selectedUser.totalProfitRm || 0).toFixed(2)}</strong></article>
          <article><span>Projects</span><strong>${selectedProjects.length}</strong></article>
          <article><span>Jobs</span><strong>${selectedJobs.length}</strong></article>
          <article><span>Status</span><strong>${selectedUser.status || "active"}</strong></article>
        </div>
        <div class="admin-actions">
          <button class="gold-button mini-button" data-admin-credit="${selectedUser.id}" data-delta="10">${icon("plus", 15)} +10 credits</button>
          <button class="dark-button mini-button" data-admin-credit="${selectedUser.id}" data-delta="-10">${icon("minus", 15)} -10 credits</button>
          <button class="dark-button mini-button" data-admin-status="${selectedUser.id}" data-status="${selectedUser.status === "suspended" ? "active" : "suspended"}">${icon(selectedUser.status === "suspended" ? "unlock" : "ban", 15)} ${selectedUser.status === "suspended" ? "Unsuspend" : "Suspend"}</button>
        </div>
        ${table(selectedJobs.slice(0, 8).map((job) => [job.model || job.type, `${job.status} | ${job.provider || ""}`, job.imageUrl || job.videoUrl || job.errorMessage || job.taskId || ""]))}` : `<p class="empty-text">No user selected.</p>`}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("wallet-cards", 22)} Ledger</h2><span>${selectedLedger.length} entries</span></div>
        ${table(selectedLedger.slice(0, 8).map((entry) => [entry.note || entry.type, `${entry.credits > 0 ? "+" : ""}${entry.credits} credits`, entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""]))}
        <div class="card-title compact-title"><h2>${icon("receipt-text", 20)} Payments</h2><span>${selectedPayments.length}</span></div>
        ${table(selectedPayments.slice(0, 4).map((payment) => paymentRow(payment, true)))}
      </article>
    </section>
    <section class="dashboard-main-grid">
      <article class="activity-card">
        <div class="card-title"><h2>${icon("sliders-horizontal", 22)} Internal Model Costs</h2><span>Admin only</span></div>
        ${table(Object.entries(modelCosts).map(([model, cost]) => [model, `RM ${Number(cost.costRm || 0).toFixed(3)}`, cost.unit || ""]))}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("shield-check", 22)} Guardrails</h2><span>Active</span></div>
        ${table([
          ["Credit check", "4 credits per generation", "Blocks normal users when balance is below 4"],
          ["Rate limit", "3/minute, 50/day", "Admin accounts are exempt for testing"],
          ["Failure ledger", "No credit charge", "Failed API calls are recorded for admin review"],
          ["Admin audit", `${adminAuditLogs.length} events`, "Sensitive admin actions are logged"]
        ])}
        <div class="card-title compact-title"><h2>${icon("bot", 20)} Agent Permissions</h2><span>${selectedUser?.email || ""}</span></div>
        ${selectedUser ? `<div class="permission-grid">${["generate", "updateProject", "schedule", "publish", "support"].map((key) => `<button class="${permissions[key] ? "gold-button" : "dark-button"} mini-button" data-agent-permission="${selectedUser.id}" data-permission="${key}" data-enabled="${permissions[key] ? "false" : "true"}">${permissions[key] ? icon("check", 15) : icon("x", 15)} ${key}</button>`).join("")}</div>` : ""}
      </article>
    </section>
    <section class="dashboard-main-grid">
      <article class="activity-card">
        <div class="card-title"><h2>${icon("image", 22)} Generated Assets</h2><span>${jobs.length} jobs</span></div>
        ${table(jobs.slice(0, 12).map((job) => [job.model || job.type, `${job.provider} | ${job.status}`, `RM ${Number(job.costRm || 0).toFixed(3)} | ${job.taskId || ""}`]))}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("credit-card", 22)} Payments</h2><span>${payments.length} payments</span></div>
        ${table(payments.slice(0, 12).map((payment) => paymentRow(payment, true)))}
      </article>
      <article class="activity-card">
        <div class="card-title"><h2>${icon("shield-check", 22)} Admin Audit</h2><span>${adminAuditLogs.length} events</span></div>
        ${table(adminAuditLogs.slice(0, 12).map((entry) => [entry.action, entry.email || entry.userId, entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""]))}
      </article>
    </section>`;
}

function projectPage() {
  const p = project();
  return `
    <header class="project-head">
      <div><p class="folder-label">${icon("folder", 18)} ${t("project")}</p><h1>${p.name}</h1></div>
      <button class="sop-button" data-action="sop">${icon("book-open", 25)} ${t("sopImage")}</button>
    </header>
    <nav class="step-tabs">
      ${steps.map(([id, ic, key, no]) => `<button class="${state.step === id ? "active" : ""}" data-step="${id}">${icon(ic)} <span>${t(key)}</span><b>${no}</b></button>`).join("")}
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
  const imageModels = ["GPT Image 2", "Nano Banana Pro"];
  const selectedModel = imageModels.includes(p.image.model) ? p.image.model : String(p.image.model || "").toLowerCase().includes("pro") ? "Nano Banana Pro" : "GPT Image 2";
  const modeOptions = ["Create Image", "Virtualize (Poster/Ad)"];
  const selectedMode = modeOptions.includes(p.image.mode) ? p.image.mode : "Create Image";
  return `
    <div class="generator-box image-generator-box"><h2>🖼️ ${t("imageGenerator")}</h2><div class="form-grid two">${select("image.model", t("model"), imageModels, selectedModel)}${select("image.mode", t("mode"), modeOptions, selectedMode)}</div></div>
    ${selectedMode === "Virtualize (Poster/Ad)" ? virtualizePanel() : `
      ${upload(t("avatarRef"), t("dropAvatar"), "Face / person - used for all variations", "camera", "avatar")}
      ${upload(t("productRef"), t("dropProduct"), "Product - used for all images and videos", "package", "product")}
      ${imagePromptSettings(p)}
    `}
    ${results(p, ["image", "video"])}`;
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

function ugcPanel(p) {
  const provider = p.ugc.provider || "Veo 3.1";
  const imageMode = p.ugc.imageMode || "Product Reference (AI creates scene)";
  const firstFrameMode = imageMode === "First Frame (animate from image)";
  const textOnlyMode = imageMode === "Text to Video (no image needed)";
  const promptTemplate = "Create an 8-second TikTok Shop UGC scene. Start with a visual hook in 0-2s, show the product benefit in 2-6s, and end with a clear CTA in 6-8s. Natural Malaysian creator tone, realistic product handling, no exaggerated claims.";
  return `
    <div class="generator-box video-generator-box">
      <h2>🎬 Video Generator</h2>
      <p class="field-label">Provider</p>
      <div class="video-provider-grid">
        ${videoProviderButton("Veo 3.1", "🎬 Veo 3.1 · 8s", provider)}
        ${videoProviderButton("Sora 2", "⚡ Sora 2 · 8 / 12s", provider)}
      </div>
      ${select("ugc.imageMode", "Image Mode", ["Product Reference (AI creates scene)", "First Frame (animate from image)", "Text to Video (no image needed)"], imageMode)}
    </div>
    <section class="ugc-scene-card">
      <div class="ugc-scene-head">
        <h2>🎞️ Scene</h2>
        <button type="button" data-field-set="ugc.script" data-value="${esc(promptTemplate)}">${icon("sparkles", 18)} Prompt Builder</button>
      </div>
      ${textOnlyMode ? ugcTextOnlyNotice() : firstFrameMode ? ugcFrameReferences() : ugcProductReferences(provider)}
      <div class="ugc-prompt-toolbar">
        <button class="active" type="button">✍️ Prompt</button>
        <button type="button">💡 Idea (AI expand)</button>
      </div>
      <textarea class="ugc-scene-textarea" data-field="ugc.script" placeholder="Scene description + spoken dialog 0-8s...">${esc(p.ugc.script)}</textarea>
      <div class="ugc-scene-foot">
        <span>Each shot = 8s · Sweet spot <b>18-22 words</b> of spoken dialog (split: 0-2s hook ≤6 words · 2-6s middle ≤14 words · 6-8s CTA ≤6 words) · <b>${wordCount(p.ugc.script)}</b> words · 0/1500</span>
        <button class="gold-button" data-action="generate-ugc">${icon("video")} Generate Video</button>
      </div>
    </section>
    ${results(p, "ugc")}`;
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
  const frameworks = [
    ["UGC", "Hook + Pain (PAS)"],
    ["PRD", "Product Hero (AIDA)"],
    ["UGC", "Testimonial"],
    ["UGC", "FOMO/Urgency"],
    ["PRD", "Before/After"],
    ["UGC", "BAB (Before-After-Bridge)"],
    ["UGC", "4Ps (Promise-Picture-Proof-Push)"],
    ["PRD", "USP Showcase"],
    ["UGC", "Action Bias"],
    ["UGC", "Solution Focus"]
  ];
  return `
    <section class="auto-content-card">
      <div class="auto-content-head">
        <h2>🪄 Auto Content</h2>
        <span>AI → Image → Video → Merge</span>
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
        ${select("auto.style", "Style", ["Hijab", "Casual", "Professional", "Streetwear"], p.auto.style || "Hijab")}
        ${select("auto.age", "Age", ["20s", "30s", "40s", "50s"], p.auto.age || "30s")}
      </div>
      <p class="field-label">Provider</p>
      <div class="auto-provider-grid">
        ${autoButton("auto.provider", "Veo 3.1", "🎬 Veo 3.1", provider)}
        ${autoButton("auto.provider", "Sora 2", "⚡ Sora 2", provider)}
        ${autoButton("auto.provider", "GeminiOmni", "🔷 GeminiOmni", provider)}
      </div>
      <div class="auto-duration-pill">8s (1 shot)</div>
      <label class="auto-size-field">Size${select("auto.size", "", ["9:16", "1:1", "16:9"], p.auto.size || "9:16")}</label>
      <p class="field-label">Plan Style</p>
      <div class="auto-plan-grid">
        ${autoPlanButton("Normal Flow", "AI plan biasa — framework drive scene", planStyle)}
        ${autoPlanButton("Custom Idea", "Client kasi idea — AI buat variants", planStyle, true)}
      </div>
      <p class="field-label">Frameworks <small>(pick up to 5 angles)</small></p>
      <div class="auto-framework-grid">
        ${frameworks.map(([tag, label]) => `<label><input type="checkbox" data-auto-framework="${esc(`${tag} ${label}`)}"><span class="${tag === "UGC" ? "ugc-tag" : "prd-tag"}">${tag}</span> ${label} <b>ⓘ</b></label>`).join("")}
      </div>
      <button class="gold-button auto-generate-button" data-action="generate-auto">${icon("video")} Generate</button>
    </section>
    ${schedule()}`;
}

function autoButton(field, value, label, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}">${label}</button>`;
}

function autoPlanButton(value, note, active, isNew = false) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="auto.planStyle" data-value="${esc(value)}">${isNew ? "<em>✨ NEW</em>" : ""}<b>${value}</b><span>${note}</span></button>`;
}

function originalPanel(p) {
  const provider = p.original.provider || "Veo 3.1";
  const imageMode = p.original.imageMode || "Text only";
  const aspectRatio = p.original.aspectRatio || "9:16 (Vertical)";
  return `
    <section class="original-video-card">
      <div class="original-video-head">
        <h2>🎞️ Original Video</h2>
        <p>Power-user raw video generator. Pick a provider — prompt sent 100% verbatim, no auto-locks or templates. Cascade fallback + history + deduct-on-success all work like other tabs.</p>
      </div>
      <p class="original-field-label">Provider</p>
      <div class="original-provider-grid">
        ${originalChoiceButton("original.provider", "Veo 3.1", "🎬 Veo 3.1", provider)}
        ${originalChoiceButton("original.provider", "Grok", "⚡ Grok", provider)}
        ${originalChoiceButton("original.provider", "Sora 2", "✨ Sora 2", provider)}
        ${originalChoiceButton("original.provider", "GeminiOmni", "🔷 GeminiOmni", provider)}
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
      <button class="original-generate-button" data-action="analyze-original">🎬 Generate ${esc(provider.split(" ")[0])} Video · ~RM0.40</button>
    </section>
    ${results(p, "original")}`;
}

function originalChoiceButton(field, value, label, active) {
  return `<button class="${active === value ? "active" : ""}" type="button" data-field-set="${field}" data-value="${esc(value)}">${label}</button>`;
}

function clonePanel(p) {
  return `
    <section class="clone-prompt-shell">
      <div class="clone-prompt-card">
        <div class="clone-prompt-head">
          <h2>📌 Clone Prompt</h2>
          <span>Frames → AI → Prompt(s)</span>
        </div>
        <p>Upload Reference Video</p>
        <label class="clone-video-drop">
          <input type="file" data-upload="clone-reference" accept="video/*" hidden>
          <span>🎬 Click or drop video</span>
        </label>
        <button class="clone-generate-button" data-action="clone-prompt">📋 Generate Prompt</button>
      </div>
    </section>
    ${results(p, "clone")}`;
}

function storyPanel(p) {
  const visualStyle = p.story.visualStyle || "Cinematic";
  const voice = p.story.voice || "Jamal";
  const cta = p.story.cta || "Engagement";
  const styleCards = ["Cinematic", "3D Pixar", "Anime Ghibli", "Fantasy Epic", "Watercolor", "Cinematic Noir", "Vintage Film", "Editorial"];
  return `
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
    ${results(p, "story")}`;
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
  const list = value && !options.includes(value) ? [value, ...options] : options;
  return `<label>${label}<select data-field="${field}">${list.map((item) => `<option ${item === value ? "selected" : ""}>${item}</option>`).join("")}</select></label>`;
}

function upload(title, main, sub, ic, kind) {
  return `<section class="upload-card"><h2>${icon(ic)} ${title}</h2><label class="drop-zone"><input type="file" data-upload="${kind}" hidden><span>${icon(ic, 44)}</span><strong>${main}</strong><small>${sub}</small></label></section>`;
}

function prompt(field, value, placeholder, action, button) {
  return `<div class="prompt-block"><label>${t("prompt")}<textarea data-field="${field}" placeholder="${placeholder}">${esc(value)}</textarea></label><button class="gold-button" data-action="${action}" ${state.generating ? "disabled" : ""}>${icon(state.generating ? "loader-circle" : "sparkles")} ${state.generating ? t("generating") : button}</button></div>`;
}

function results(p, type) {
  const types = Array.isArray(type) ? type : [type];
  const items = p.results.filter((item) => types.includes(item.type)).slice(-4).reverse();
  if (!items.length) return `<section class="empty-result">${icon("sparkles")} ${t("noResults")}</section>`;
  return `<section class="result-grid">${items.map(resultCard).join("")}</section>`;
}

function resultCard(item) {
  const model = item.title || "Generated asset";
  const promptText = item.body || "";
  return `
    <article class="result-card">
      <header class="result-card-head">
        <span>${icon("circle-check", 18)}</span>
        <b>${esc(model)}</b>
      </header>
      ${resultPreview(item)}
      <div class="result-meta">
        <span>${icon("cloud-check", 16)} Duitok asset</span>
        <code>${esc(item.id)}</code>
      </div>
      <div class="result-name">
        ${icon("pencil", 18)}
        <div><b>${esc(item.title)}</b><p>${esc(promptText).replaceAll("\n", " ").slice(0, 120)}${promptText.length > 120 ? "..." : ""}</p></div>
      </div>
      <div class="result-actions" aria-label="Result actions preview">
        <button type="button" title="Copy prompt">${icon("cloud-upload", 20)}</button>
        <button type="button" title="Full prompt">${icon("palette", 20)}</button>
        <button type="button" title="Cloud status">${icon("cloud", 20)}</button>
        <button type="button" title="${t("export")}">${icon("download", 20)}</button>
        <button type="button" title="Delete">${icon("trash-2", 20)}</button>
      </div>
    </article>`;
}

function resultPreview(item) {
  const token = encodeURIComponent(state.token || "");
  const imageSrc = item.imageUrl ? `/api/media/result/${encodeURIComponent(item.id)}/image?token=${token}` : "";
  const videoSrc = item.videoUrl ? `/api/media/result/${encodeURIComponent(item.id)}/video?token=${token}` : "";
  const imageError = "this.replaceWith(Object.assign(document.createElement('div'),{className:'result-media-error',textContent:'Image link expired or blocked. Try generating again or configure durable storage.'}))";
  const image = imageSrc ? `<img class="result-image" src="${imageSrc}" alt="${esc(item.title)}" loading="lazy" onerror="${esc(imageError)}">` : "";
  const video = videoSrc ? `<video class="result-video" src="${videoSrc}" controls playsinline></video>` : "";
  return `${image}${video}`;
}

function accountPage() {
  const map = {
    attachments: [t("attachments"), "Upload records saved to backend.", table(state.db.attachments.map((x) => [x.name, x.kind, new Date(x.createdAt).toLocaleString()]))],
    billing: [t("billing"), "Invoices and plan state are persisted.", `<div class="metric-row"><article><span>Plan</span><strong>${state.db.billing.plan}</strong></article><article><span>Credits</span><strong>${state.db.billing.credits}</strong></article><article><span>Next bill</span><strong>${state.db.billing.nextBill}</strong></article></div><div class="plan-grid">${[["Starter", "RM29", "For testing products"], ["Pro", "RM69", "Daily TikTok Shop creation"], ["Agency", "RM199", "Multiple brands and operators"]].map(([name, price, note]) => `<article><span>${name}</span><strong>${price}</strong><small>${note}</small></article>`).join("")}</div>${invoiceTable()}`],
    topup: [t("topup"), "Credit purchases update the backend ledger.", topupPage()],
    affiliate: [t("affiliate"), "Referral links and payouts.", `<div class="metric-row"><article><span>Code</span><strong>${state.db.affiliate.code}</strong></article><article><span>Clicks</span><strong>${state.db.affiliate.clicks}</strong></article><article><span>Payout</span><strong>RM${state.db.affiliate.payout}</strong></article></div><button class="gold-button" data-action="copy-affiliate">${icon("copy")} Copy referral link</button>`],
    usage: [t("usage"), "Credit usage from the backend ledger.", usagePage()],
    autopost: [t("autopost"), "Chrome extension assisted TikTok publishing queue.", autoPostPage()],
    whatsapp: [t("whatsapp"), "Community handoff.", `<button class="gold-button" data-action="open-whatsapp">${icon("message-circle")} Open WhatsApp Group</button>`],
    settings: ["Settings", "Account info, WhatsApp support contact, and password.", settingsPage()]
  };
  const [title, subtitle, body] = map[state.page];
  return `<header class="project-head"><div><p class="folder-label">${icon("folder", 18)} ${t("publicTools")}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><button class="sop-button" data-action="export-all">${icon("download")} ${t("export")}</button></header><section class="canvas-card slim">${body}</section>`;
}

function topupPage() {
  const credits = Number(state.db.billing?.credits || 0);
  const selectedAmount = Number(state.topupAmount || 50);
  const imagePossible = Math.floor(credits / 0.2);
  const videoPossible = Math.floor(credits / 0.4);
  const autoBatches = Math.floor(credits / 4);
  return `
    <section class="topup-experience">
      <div class="credit-balance-panel">
        <div class="credit-balance-main">
          <span>${icon("wallet-cards", 18)} Credit Balance</span>
          <p><b>${formatCreditNumber(credits)}</b><em>credits</em></p>
          <small>Top up anytime. Credits never expire.</small>
        </div>
        <div class="credit-usage-grid">
          <article><span>Image Generate</span><b>~${imagePossible}</b><small>images possible</small></article>
          <article><span>Video 8s</span><b>~${videoPossible}</b><small>videos possible</small></article>
          <article><span>Auto Content (10 video pack)</span><b>~${autoBatches} batch</b><small>10 video x 8s + 1 master plan</small></article>
        </div>
      </div>
      <div class="topup-purchase-panel">
        <div class="topup-panel-head">
          <div><h2>Select credit package</h2><p>RM1 = 1 credit. No hidden fees.</p></div>
          <span>${icon("sparkles", 18)} Instant top-up via CHIP</span>
        </div>
        <div class="topup-package-grid">
          ${topupPackages().map((item) => `
            <button class="topup-package ${item.amount === selectedAmount ? "active" : ""}" type="button" data-topup-select="${item.amount}">
              ${item.badge ? `<i>${item.badge}</i>` : ""}
              <strong>${item.amount}</strong>
              <span>Credits</span>
              <b>RM${item.amount}</b>
              <small>${item.note}</small>
            </button>
          `).join("")}
        </div>
        <button class="topup-pay-button" data-topup="${selectedAmount}">${icon("zap", 22)} Pay RM${selectedAmount} for ${selectedAmount} Credits ${icon("arrow-right", 22)}</button>
        <p class="topup-secure-note">Secured via Chip · FPX online banking & DuitNow QR</p>
      </div>
      ${topupHistory()}
    </section>`;
}

function topupPackages() {
  return [
    { amount: 10, note: "Starter pack" },
    { amount: 20, note: "Try it out" },
    { amount: 30, note: "Common" },
    { amount: 50, note: "Best value", badge: "Best" },
    { amount: 100, note: "Power user" }
  ];
}

function formatCreditNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function topupHistory() {
  const payments = (state.db.payments || []).filter((payment) => (payment.kind || "topup") === "topup").slice(0, 8);
  return `<div class="topup-history-panel">
    <h2>${icon("receipt", 22)} Top up history</h2>
    <div class="topup-history-list">
      ${payments.map((payment) => {
        const status = payment.status || "pending";
        const credits = Number(payment.credits || payment.amount || 0);
        return `<div>
          <time>${formatTopupDate(payment.createdAt)}</time>
          <b>+${credits} credits</b>
          <strong>RM${Number(payment.amount || 0).toFixed(2)}</strong>
          <span class="payment-status ${status}">${icon(status === "paid" ? "check-circle-2" : "clock", 16)} ${status}</span>
          ${status === "pending" ? `<button class="mini-button" data-action="refresh-payment-status" data-order="${esc(payment.orderId)}">${icon("refresh-cw", 15)} Check</button>` : ""}
        </div>`;
      }).join("") || `<p class="empty-text">No top up records yet.</p>`}
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
      <form class="settings-card" data-form="account-profile">
        <header>
          <span>${icon("user-round", 30)}</span>
          <div><h2>Profile</h2><p>Account info & contact</p></div>
        </header>
        <div class="settings-form-grid">
          <label>Display Name<input name="name" value="${esc(user.name || "")}" autocomplete="name" required></label>
          <label>Email<input name="email" value="${esc(user.email || "")}" disabled></label>
        </div>
        <button class="gold-button" type="submit">${icon("save", 18)} Save Profile</button>
      </form>
      <form class="settings-card whatsapp-settings-card" data-form="account-whatsapp">
        <header>
          <span>${icon("message-circle", 30)}</span>
          <div><h2>WhatsApp</h2><p>Untuk login + support notifications</p></div>
        </header>
        <label>WhatsApp Number<input name="phone" value="${esc(user.phone || "")}" placeholder="+60123456789" autocomplete="tel"></label>
        <button class="gold-button" type="submit">Save WhatsApp</button>
      </form>
      <form class="settings-card password-settings-card" data-form="account-password">
        <header>
          <span>${icon("lock-keyhole", 30)}</span>
          <div><h2>Change Password</h2><p>Ganti password dari yang dihantar via WhatsApp</p></div>
        </header>
        <label>Old Password<input name="oldPassword" type="password" autocomplete="current-password" required></label>
        <div class="settings-form-grid">
          <label>New Password<input name="newPassword" type="password" autocomplete="new-password" required></label>
          <label>Confirm New<input name="confirmPassword" type="password" autocomplete="new-password" required></label>
        </div>
        <button class="gold-button" type="submit">Change Password</button>
      </form>
    </section>`;
}

function table(rows) {
  return `<div class="table">${rows.map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><small>${c || ""}</small></div>`).join("") || `<p class="empty-text">No records yet.</p>`}</div>`;
}

function invoiceTable() {
  return `<div class="table">${state.db.billing.invoices.map((x) => `<div><span>${x.id}</span><b>RM${x.amount}</b><button data-invoice="${x.id}">${icon("download")} ${t("export")}</button></div>`).join("")}</div>`;
}

function autoPostPage() {
  const connection = state.db.tiktok?.connections?.[0];
  const publishes = state.db.tiktok?.publishes || [];
  return `
    <div class="autopost-console">
      <section class="autopost-sop">
        <div>
          <p class="folder-label">${icon("puzzle", 18)} Extension</p>
          <h2>Duitok Auto Post - SOP</h2>
          <p>Local Chrome helper for pulling Duitok scheduled TikTok posts into TikTok upload pages. It fills captions and hashtags; you still review and click final publish yourself.</p>
        </div>
        <button class="gold-button" data-action="download-autopost-extension">${icon("download")} Download Extension</button>
        <ol>
          <li><b>1</b><span>Download extension zip</span></li>
          <li><b>2</b><span>Extract folder</span></li>
          <li><b>3</b><span>Open <code>chrome://extensions/</code></span></li>
          <li><b>4</b><span>Enable Developer Mode</span></li>
          <li><b>5</b><span>Click Load unpacked and select the extracted folder</span></li>
        </ol>
      </section>
      <section class="autopost-sop tiktok-official">
        <div>
          <p class="folder-label">${icon("badge-check", 18)} Official API</p>
          <h2>TikTok Direct Post</h2>
          <p>${connection ? `Connected: ${connection.displayName || connection.openId || "TikTok account"}` : "Connect a TikTok account after your TikTok Developer app has Content Posting API access."}</p>
        </div>
        <div class="official-actions">
          <button class="gold-button" data-action="connect-tiktok">${icon("plug")} Connect TikTok</button>
          <button class="dark-button" data-action="tiktok-creator-info">${icon("refresh-cw")} Creator Info</button>
        </div>
        <div class="tiktok-publishes">
          ${publishes.slice(0, 4).map((item) => `<article><b>${item.status}</b><span>${item.publishId || item.id}</span><button data-tiktok-status="${item.publishId || item.id}">${icon("activity")} Check</button></article>`).join("") || `<p class="empty-text">No official API publishes yet.</p>`}
        </div>
      </section>
      <section class="autopost-queue">
        <div class="card-title">
          <h2>${icon("calendar-days", 22)} TikTok Queue</h2>
          <span>${state.db.schedule.length} scheduled items</span>
        </div>
        ${schedule()}
      </section>
    </div>`;
}

function schedule() {
  return `<section class="schedule-list">${state.db.schedule.map((x) => `<article><b>${x.title}</b><span>${x.platform}</span><small>${x.time}</small><p>${esc([x.caption, x.hashtags].filter(Boolean).join("\n")).replaceAll("\n", "<br>")}</p><button data-schedule="${x.id}">${icon("settings")} ${x.status}</button>${state.page === "autopost" ? `<button data-tiktok-publish="${x.id}">${icon("send")} Official Post</button>` : ""}</article>`).join("")}</section>`;
}

function modal() {
  if (!state.modal) return "";
  const editProject = state.db?.projects?.find((item) => item.id === state.editingProjectId);
  if (state.modal === "sop") return sopDashboardModal();
  const title = { newProject: t("createProject"), renameProject: "Rename project", deleteProject: "Delete project", register: t("choosePlan"), sop: t("sopImage"), export: t("exportReady"), support: t("supportTitle") }[state.modal];
  const body = {
    newProject: `<form data-form="project"><label>${t("project")}<input name="name" placeholder="Project ${(state.db?.projects.length || 0) + 1}" required></label><button class="gold-button" type="submit">${icon("plus")} ${t("newProject")}</button></form>`,
    renameProject: `<form data-form="rename-project"><label>${t("project")}<input name="name" value="${esc(editProject?.name || "")}" required autofocus></label><button class="gold-button" type="submit">${icon("check")} Save name</button></form>`,
    deleteProject: `<div class="delete-confirm"><p>Delete <b>${esc(editProject?.name || "this project")}</b>? This removes its generated assets, prompts, and schedules from this workspace.</p><div><button class="dark-button" data-action="close-modal">${icon("x")} Cancel</button><button class="gold-button danger-button" data-action="confirm-delete-project">${icon("trash-2")} Delete project</button></div></div>`,
    register: `<form data-form="login"><label>${t("email")}<input name="email" type="email" placeholder="you@duitok.com" required></label><label>${t("password")}<input name="password" type="password" placeholder="Create password" required></label><button class="gold-button" type="submit">${icon("lock")} Register & Enter Studio</button></form>`,
    sop: `<div class="sop-sheet"><b>Image SOP</b><ol><li>Upload avatar face.</li><li>Upload product reference.</li><li>Select model and mode.</li><li>Write prompt.</li><li>Generate, save, export.</li></ol><button class="dark-button" data-action="download-sop">${icon("download")} Download SOP</button></div>`,
    export: `<p>Your export has started. Files are generated by the backend.</p><button class="gold-button" data-action="close-modal">${icon("check")} Done</button>`,
    support: `<form data-form="support" class="support-form"><label>Message<textarea name="message" placeholder="Tell us what happened, what you tried, and your WhatsApp number if you want a reply." required></textarea></label><button class="gold-button" type="submit">${icon("send")} ${t("supportTicket")}</button></form>`
  }[state.modal];
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal"><button class="icon-only close" data-action="close-modal">${icon("x")}</button><p class="folder-label">${icon("sparkles", 18)} Duitok AI</p><h2>${title}</h2>${body}</section></div>`;
}

function sopDashboardModal() {
  const stepCards = [
    ["1", "Dashboard overview", "Tengok total production bulan ni: Image, UGC, Auto Content, Original Video, Clone Prompt, Ready to Post dan credit yang sudah guna.", "layout-dashboard"],
    ["2", "Pilih atau create project", "Semua generation mesti duduk dalam satu project. Kalau campaign baru, create project dulu supaya asset, prompt dan schedule tidak bercampur.", "folder-plus"],
    ["3", "Baca daily stats", "Guna date filter untuk check output harian, cost breakdown dan recent activity sebelum decide nak scale angle mana.", "bar-chart-3"],
    ["4", "Masuk tab generation", "Lepas pilih project, teruskan ke Image / UGC / Auto Content / Story / Original Video / Clone Prompt ikut task yang nak dibuat.", "wand-sparkles"]
  ];
  return `
    <div class="modal-backdrop sop-backdrop" data-action="close-modal">
      <section class="sop-modal" role="dialog" aria-modal="true" aria-labelledby="sop-dashboard-title">
        <header class="sop-modal-head">
          <span class="sop-modal-icon">${icon("book-open", 36)}</span>
          <div>
            <p>Panduan</p>
            <h2 id="sop-dashboard-title">Dashboard - Project & Production Summary</h2>
          </div>
          <button class="sop-close" data-action="close-modal" aria-label="Close SOP">${icon("x", 34)}</button>
        </header>
        <div class="sop-modal-scroll">
          <p class="sop-path">Welcome screen · pick / create project · daily stats</p>
          <section class="sop-copy-block">
            <h3>Apa ini?</h3>
            <p>Dashboard ialah landing page bila korang first kali login. Dia tunjuk ringkasan production keseluruhan (total Image / UGC / Cinema / Auto Content + Total Cost) dan jadi launchpad untuk pilih project mana yang nak kerja. Semua tab generation (Image / UGC / Auto Content / Story / Cinema / Clone) live DALAM satu project - korang mesti pilih atau buat project dulu sebelum generate apa-apa.</p>
          </section>
          <section class="sop-callout">
            ${icon("lightbulb", 34)}
            <div>
              <h3>Bila guna tab ni?</h3>
              <p>Setiap kali korang login. Atau bila nak switch antara client / campaign berbeza. Atau bila nak tengok overall production stats - berapa banyak generated bulan ni, total cost, daily breakdown.</p>
            </div>
          </section>
          <section class="sop-guide">
            <h3>${icon("chevron-right", 28)} Cara guna</h3>
            <div class="sop-step-list">
              ${stepCards.map(([no, title, copy, ic]) => `
                <article class="sop-step-card">
                  <div class="sop-step-title">
                    <span>${no}</span>
                    <h4>Step ${no} - ${title}</h4>
                  </div>
                  <div class="sop-step-preview">
                    <div class="sop-mini-sidebar">
                      <b>Duitok</b>
                      <i></i><i></i><i></i>
                    </div>
                    <div class="sop-mini-screen">
                      <strong>${icon(ic, 20)} ${title}</strong>
                      <div class="sop-mini-grid"><i></i><i></i><i></i><i></i></div>
                      <p>${copy}</p>
                    </div>
                  </div>
                </article>`).join("")}
            </div>
          </section>
          <section class="sop-checklist">
            <h3>Checklist sebelum generate</h3>
            <div>
              <span>${icon("check", 18)} Project sudah dipilih</span>
              <span>${icon("check", 18)} Credit cukup untuk batch</span>
              <span>${icon("check", 18)} Date range betul</span>
              <span>${icon("check", 18)} Next action jelas</span>
            </div>
          </section>
        </div>
        <footer class="sop-modal-foot">
          <button class="sop-understood" data-action="close-modal">Faham - tutup</button>
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
  if (phase === "done") return "完成，等你查看";
  if (phase === "returning") return "回去休息";
  if (phase === "idle") return "休息中";
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

function agent3DScene() {
  const mode = currentAgent3DMode();
  const copy = agent3DCopy(mode);
  const params = new URLSearchParams(window.location.search);
  const canPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const phasePreview = canPreview ? params.get("agentPhase") : "";
  const idlePreview = canPreview ? params.get("agentIdle") : "";
  const phase = ["idle", "wake", "chatting", "walking", "working", "done", "returning"].includes(phasePreview) ? phasePreview : state.agentVisualPhase || "idle";
  const idle = ["sleep"].includes(idlePreview) ? idlePreview : "sleep";
  return `
    <div class="agent-3d-card agent-life-card" data-agent-mode="${mode}" data-agent-phase="${phase}" data-idle-activity="${idle}">
      <div class="agent-3d-status">
        <span>${icon(mode === "idle" ? "moon" : "activity", 17)} ${copy.label}</span>
        <b>${mode === "idle" ? "Standby" : mode === "chat" || mode === "command" ? "Talking" : "Working"}</b>
      </div>
      <div class="agent-life-stage" aria-label="Duitok Agent work, chat, and rest states">
        <img class="agent-life-render-image agent-life-render-active" src="/duitok-agent-stage-chat-bg.png" alt="Duitok Agent workstation, chat station, and sleeping bed">
        <img class="agent-life-render-image agent-life-render-sleep" src="/duitok-agent-stage-chat-sleep-bg.png" alt="Duitok Agent sleeping in bed">
        <span class="agent-life-route" aria-hidden="true"></span>
        <span class="agent-chair-mask" aria-hidden="true"></span>
        <img class="agent-sprite agent-sprite-work" src="/duitok-agent-sprite-work-chair.png" alt="">
        <img class="agent-sprite agent-sprite-chat" src="/duitok-agent-sprite-chat.png" alt="">
        <span class="agent-life-bubble">${agentVisualBubble(mode, phase)}</span>
      </div>
      <div class="agent-3d-copy">
        <h2>${copy.title}</h2>
        <p>${copy.subtitle}</p>
        <div class="agent-3d-task-row">
          ${copy.cards.map((item) => `<span>${esc(item)}</span>`).join("")}
        </div>
      </div>
    </div>`;
}

function agentPage() {
  const prompts = [
    "帮我为这个产品做 7 天 TikTok 内容",
    "用 Nano Banana Pro 生成一个产品图版本",
    "分析这个 competitor URL，生成 5 个 hook",
    "看一下我今天还缺什么内容"
  ];
  return `
    <section class="agent-page">
      <header class="agent-page-hero">
        <div class="agent-hero-copy">
          <p class="folder-label">${icon("bot", 18)} Duitok Agent</p>
          <h1>Your AI operator for TikTok Shop content.</h1>
          <p class="subtitle">Ask it to create projects, write prompts, generate assets, build batches, schedule posts, and decide the next best action.</p>
          <button class="dark-button" data-action="support">${icon("ticket")} Contact human support</button>
        </div>
        ${agent3DScene()}
      </header>
      <div class="agent-quick-actions">
        ${prompts.map((prompt) => `<button type="button" data-agent-prompt="${esc(prompt)}">${icon("sparkles", 17)} ${prompt}</button>`).join("")}
      </div>
      ${chatPanel()}
    </section>`;
}

function chatPanel() {
  const intro = state.agentMessages.length
    ? ""
    : `<p class="agent-empty">Ask me to generate UGC, build a batch, decode a competitor, create a project, or decide what to do next.</p>`;
  return `
    <section class="agent-panel agent-page-panel">
      <header>
        <h3>${icon("bot")} Duitok Agent</h3>
        <button class="icon-only" data-action="clear-agent" title="Clear chat">${icon("trash-2", 18)}</button>
      </header>
      <div class="agent-thread">
        ${intro}
        ${state.agentMessages.map((item) => `<article class="${item.role}"><span>${item.role === "user" ? "You" : "Agent"}</span><p>${esc(item.content).replaceAll("\n", "<br>")}</p></article>`).join("")}
        ${state.agentBusy ? `<article class="assistant"><span>Agent</span><p>${icon("loader-circle", 16)} Thinking and calling Duitok tools...</p></article>` : ""}
      </div>
      <form class="agent-form" data-form="agent">
        <textarea name="message" data-agent-input placeholder="Tell Duitok Agent what you want..." ${state.agentBusy ? "disabled" : ""}>${esc(state.agentInput)}</textarea>
        <button class="gold-button" type="submit" ${state.agentBusy ? "disabled" : ""}>${icon(state.agentBusy ? "loader-circle" : "send")} Send</button>
      </form>
    </section>`;
}

function bind() {
  document.querySelectorAll("[data-page]").forEach((el) => el.addEventListener("click", () => set({ page: el.dataset.page })));
  document.querySelectorAll("[data-step]").forEach((el) => el.addEventListener("click", () => set({ step: el.dataset.step })));
  document.querySelectorAll("[data-step-open]").forEach((el) => el.addEventListener("click", () => set({ page: "project", step: el.dataset.stepOpen })));
  document.querySelectorAll("[data-project]").forEach((el) => el.addEventListener("click", () => set({ projectId: el.dataset.project, page: "project", projectMenuId: null })));
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
  document.querySelectorAll("[data-admin-user]").forEach((el) => el.addEventListener("click", () => set({ adminUserId: el.dataset.adminUser })));
  document.querySelectorAll("[data-admin-credit]").forEach((el) => el.addEventListener("click", () => adminAdjustCredits(el.dataset.adminCredit, Number(el.dataset.delta))));
  document.querySelectorAll("[data-admin-clean-payment]").forEach((el) => el.addEventListener("click", () => adminCleanupPayment(el.dataset.adminCleanPayment)));
  document.querySelectorAll("[data-admin-status]").forEach((el) => el.addEventListener("click", () => adminUpdateUser(el.dataset.adminStatus, { status: el.dataset.status })));
  document.querySelectorAll("[data-agent-permission]").forEach((el) => el.addEventListener("click", () => adminUpdateUser(el.dataset.agentPermission, { agentPermissions: { [el.dataset.permission]: el.dataset.enabled === "true" } })));
  document.querySelectorAll("[data-agent-prompt]").forEach((el) => el.addEventListener("click", () => sendAgentMessage(el.dataset.agentPrompt)));
  document.querySelectorAll("[data-date-field]").forEach((el) => el.addEventListener("change", () => set({ [el.dataset.dateField]: el.value })));
  document.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", (e) => action(e, el.dataset.action)));
  document.querySelectorAll("[data-field-set]").forEach((el) => el.addEventListener("click", () => saveProjectField(el.dataset.fieldSet, el.dataset.value)));
  document.querySelectorAll("[data-field]").forEach((el) => el.addEventListener("change", fieldChange));
  document.querySelectorAll("[data-upload]").forEach((el) => el.addEventListener("change", uploadChange));
  document.querySelector("[data-agent-input]")?.addEventListener("input", (e) => { state.agentInput = e.target.value; });
  document.querySelectorAll("[data-prompt-group]").forEach((el) => el.addEventListener("click", () => set({ imagePromptGroup: el.dataset.promptGroup })));
  document.querySelectorAll("[data-image-preset]").forEach((el) => el.addEventListener("click", () => applyImagePreset(el.dataset.imagePreset)));
  document.querySelectorAll("[data-topup-select]").forEach((el) => el.addEventListener("click", () => set({ topupAmount: Number(el.dataset.topupSelect) })));
  document.querySelectorAll("[data-usage-filter]").forEach((el) => el.addEventListener("click", () => set({ usageFilter: el.dataset.usageFilter })));
  document.querySelectorAll("[data-topup]").forEach((el) => el.addEventListener("click", () => topup(Number(el.dataset.topup))));
  document.querySelectorAll("[data-schedule]").forEach((el) => el.addEventListener("click", () => scheduleUpdate(el.dataset.schedule)));
  document.querySelectorAll("[data-tiktok-publish]").forEach((el) => el.addEventListener("click", () => tiktokPublish(el.dataset.tiktokPublish)));
  document.querySelectorAll("[data-tiktok-status]").forEach((el) => el.addEventListener("click", () => tiktokStatus(el.dataset.tiktokStatus)));
  document.querySelectorAll("[data-invoice]").forEach((el) => el.addEventListener("click", () => download(`/api/export/invoice/${el.dataset.invoice}`, `${el.dataset.invoice}.txt`)));
  document.querySelectorAll("[data-result]").forEach((el) => el.addEventListener("click", () => download(`/api/export/result/${el.dataset.result}`, `duitok-result.txt`)));
  document.querySelectorAll("form").forEach((el) => el.addEventListener("submit", submit));
  document.querySelector("[data-search]")?.addEventListener("input", (e) => set({ search: e.target.value }));
  document.querySelectorAll("[data-lang-toggle]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    set({ langOpen: !state.langOpen });
  }));
  document.querySelectorAll("[data-lang]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    localStorage.setItem("duitok-lang", el.dataset.lang);
    set({ lang: el.dataset.lang, langOpen: false });
  }));
  document.addEventListener("click", closeLangMenu, { once: true });
}

function closeLangMenu(event) {
  if (!state.langOpen || event.target.closest(".lang-menu")) return;
  set({ langOpen: false });
}

async function action(event, name) {
  if (name === "close-modal" && event.target !== event.currentTarget && event.currentTarget.classList.contains("modal-backdrop")) return;
  if (name === "close-modal") return set({ modal: null });
  if (name === "new-project") return set({ modal: "newProject" });
  if (name === "sop") return set({ modal: "sop" });
  if (name === "register") return set({ modal: "register" });
  if (name === "support") return set({ modal: "support" });
  if (name === "confirm-delete-project") return deleteProject();
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
  if (name === "apply-date") return notify("Dashboard date range applied.");
  if (name === "reset-date") return set({ dateFrom: "2026-05-01", dateTo: "2026-05-26" });
  if (name === "chat") return set({ page: "agent" });
  if (name === "clear-agent") {
    localStorage.removeItem("duitok-agent-messages");
    return set({ agentMessages: [], agentInput: "" });
  }
  if (name === "logout") {
    localStorage.removeItem("duitok-user");
    localStorage.removeItem("duitok-auth");
    return set({ user: null, token: "", db: null, modal: null });
  }
  if (name === "forgot") return window.open("https://wa.me/60123456789", "_blank");
  if (name === "open-whatsapp") return window.open(whatsappGroupUrl, "_blank", "noopener,noreferrer");
  if (name === "connect-tiktok") return window.location.href = `${apiBaseUrl}/api/tiktok/connect?token=${encodeURIComponent(state.token)}`;
  if (name === "tiktok-creator-info") return tiktokCreatorInfo();
  if (name === "copy-affiliate") { await navigator.clipboard?.writeText("https://duitok.com/ref/DUIT2026"); return notify("Affiliate link copied."); }
  if (name === "support-ticket") return mutate("/support", { method: "POST", body: JSON.stringify({ message: "Support ticket from studio" }) }, "Support ticket saved.");
  if (name === "download-sop") return download("/api/export/sop", "duitok-image-sop.txt");
  if (name === "download-autopost-extension") return download("/api/export/autopost-extension", "duitok-autopost-extension.zip");
  if (name === "export-all") return download("/api/export/all", "duitok-data.json");
  if (name === "export-project") return download(`/api/export/project/${state.projectId}`, `${project().name}.json`);
  if (name?.startsWith("generate") || ["analyze-original", "clone-prompt", "write-story", "decode-viral"].includes(name)) return generate(name);
}

async function submit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (event.currentTarget.dataset.form === "login") {
    if (data.adminKey) {
      localStorage.setItem("duitok-admin-key", data.adminKey);
      state.adminKey = data.adminKey;
    }
    const res = await api("/auth/login", { method: "POST", body: JSON.stringify(data) });
    localStorage.setItem("duitok-user", JSON.stringify(res.user));
    localStorage.setItem("duitok-auth", res.token);
    state.token = res.token;
    state.db = res.state;
    state.projectId = state.db.projects[0]?.id;
    window.history.pushState({}, "", "/studio");
    return set({ user: res.user, modal: null, page: "dashboard" });
  }
  if (event.currentTarget.dataset.form === "admin-key") {
    localStorage.setItem("duitok-admin-key", data.adminKey);
    state.adminKey = data.adminKey;
    const db = await api("/state");
    const user = { ...(state.user || {}), adminVerified: Boolean(db.admin), adminLocked: !db.admin };
    localStorage.setItem("duitok-user", JSON.stringify(user));
    return set({ db, user });
  }
  if (event.currentTarget.dataset.form === "lead") {
    notify("Opening registration.");
    window.history.pushState({}, "", "/register");
    return render();
  }
  if (event.currentTarget.dataset.form === "register") {
    try {
      notify("Opening secure CHIP payment page...");
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
      return set({ db, projectId: db.projects.at(-1).id, modal: null, page: "dashboard" });
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
    notify("Support ticket saved.");
    return set({ db, modal: null });
  }
  if (event.currentTarget.dataset.form === "agent") {
    return sendAgentMessage(data.message);
  }
}

async function fieldChange(event) {
  return saveProjectField(event.target.dataset.field, event.target.value);
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
    notify(error.message || "Save failed.");
  }
}

async function applyImagePreset(promptText) {
  const db = await api(`/projects/${state.projectId}/field`, { method: "PATCH", body: JSON.stringify({ field: "image.prompt", value: promptText }) });
  set({ db });
  notify("Prompt preset applied.");
}

async function uploadChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const db = await api("/attachments", { method: "POST", body: JSON.stringify({ projectId: state.projectId, kind: event.target.dataset.upload, name: file.name, size: file.size, type: file.type }) });
  set({ db });
  notify(`${file.name} saved to backend.`);
}

async function renameProject(name) {
  if (!state.editingProjectId) return;
  const db = await api(`/projects/${state.editingProjectId}`, { method: "PATCH", body: JSON.stringify({ name }) });
  notify("Project renamed.");
  set({ db, modal: null, editingProjectId: null });
}

async function deleteProject() {
  if (!state.editingProjectId) return;
  const deletedId = state.editingProjectId;
  if ((state.db?.projects || []).length <= 1) {
    notify("Keep at least one project in the workspace.");
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

  notify("Deleting project...");
  set({
    db: optimisticDb,
    modal: null,
    editingProjectId: null,
    projectId: nextProjectId,
    page: nextProjectId ? state.page : "dashboard"
  });

  try {
    const db = await api(`/projects/${deletedId}`, { method: "DELETE" });
    notify("Project deleted.");
    set({ db });
  } catch (error) {
    notify(error.message);
    set({ db: previousDb, projectId: previousProjectId, page: previousPage });
  }
}

async function generate(name) {
  if (state.generating) return;
  try {
    set({ generating: true });
    notify("Generation queued. You can keep working while Duitok processes it.");
    const db = await api(`/projects/${state.projectId}/generate`, { method: "POST", body: JSON.stringify({ action: name, step: state.step }) });
    set({ db, generating: false });
    notify("Generation job queued.");
    pollGenerationQueue();
  } catch (error) {
    set({ generating: false });
    notify(error.message);
  }
}

async function pollGenerationQueue(attempt = 0) {
  if (state.queuePolling && attempt === 0) return;
  state.queuePolling = true;
  try {
    const db = await refreshState();
    const hasRunning = db.generationJobs.some((job) => ["queued", "processing"].includes(job.status));
    if (hasRunning && attempt < 30) {
      setTimeout(() => pollGenerationQueue(attempt + 1), 3000);
      return;
    }
    if (!hasRunning && attempt > 0) notify("Generation queue updated.");
  } catch (error) {
    notify(error.message);
  }
  state.queuePolling = false;
}

function rememberAgentMessages(messages) {
  localStorage.setItem("duitok-agent-messages", JSON.stringify(messages.slice(-12)));
}

function applyAgentUiActions(uiActions = [], db) {
  const patch = {};
  for (const item of uiActions) {
    if (item.page) patch.page = item.page;
    if (item.step) patch.step = item.step;
    if (item.projectId && db?.projects?.some((project) => project.id === item.projectId)) patch.projectId = item.projectId;
  }
  return patch;
}

function scheduleAgentVisual(patch, delay) {
  clearTimeout(agentVisualTimer);
  agentVisualTimer = setTimeout(() => set(patch), delay);
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
  set({ agentVisualPhase: "done" });
  setTimeout(() => set({ agentVisualPhase: "returning" }), 1100);
  setTimeout(() => set({ agentVisualPhase: "idle", agentTaskMode: "idle", agentIdleActivity: "sleep" }), 2400);
}

async function sendAgentMessage(message) {
  const content = String(message || state.agentInput || "").trim();
  if (!content || state.agentBusy) return;
  const nextMessages = [...state.agentMessages, { role: "user", content }];
  rememberAgentMessages(nextMessages);
  set({ agentMessages: nextMessages, agentInput: "", agentBusy: true });
  startAgentVisual(content);
  try {
    const res = await api("/agent", {
      method: "POST",
      body: JSON.stringify({
        messages: nextMessages,
        projectId: state.projectId,
        page: state.page,
        step: state.step
      })
    });
    const messages = [...nextMessages, { role: "assistant", content: res.reply || "Done." }];
    rememberAgentMessages(messages);
    const db = res.db || state.db;
    set({
      db,
      agentMessages: messages,
      agentBusy: false,
      ...applyAgentUiActions(res.uiActions, db)
    });
    completeAgentVisual();
    if (res.toolResults?.length) notify("Duitok Agent updated the workspace.");
  } catch (error) {
    const messages = [...nextMessages, { role: "assistant", content: error.message }];
    rememberAgentMessages(messages);
    set({ agentMessages: messages, agentBusy: false });
    completeAgentVisual();
    notify(error.message);
  }
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
    localStorage.setItem("duitok-user", JSON.stringify(res.user));
    set({ user: res.user, db: res.state });
    notify("Account settings saved.");
  } catch (error) {
    notify(error.message);
  }
}

async function changeAccountPassword(data) {
  try {
    await api("/account/password", { method: "PATCH", body: JSON.stringify(data) });
    notify("Password changed.");
  } catch (error) {
    notify(error.message);
  }
}

async function refreshPaymentStatus(orderId) {
  if (!orderId) return;
  try {
    const payment = await api(`/payments/status/${encodeURIComponent(orderId)}`);
    set({ paymentReturn: payment });
    notify(payment.status === "paid" ? "Payment confirmed. You can sign in now." : `Payment is ${payment.status}.`);
  } catch (error) {
    notify(error.message);
  }
}

async function tiktokCreatorInfo() {
  try {
    notify("Checking TikTok creator info...");
    const res = await api("/tiktok/creator-info", { method: "POST", body: JSON.stringify({}) });
    set({ db: { ...state.db, tiktok: res.tiktok } });
    notify("TikTok creator info updated.");
  } catch (error) {
    notify(error.message);
  }
}

async function tiktokPublish(id) {
  const item = state.db.schedule.find((entry) => entry.id === id);
  if (!item?.mediaUrl) {
    notify("Official TikTok post needs a public video URL on this queue item first.");
    return;
  }
  try {
    notify("Starting TikTok official post...");
    const res = await api(`/tiktok/publish/${id}`, { method: "POST", body: JSON.stringify({ mediaUrl: item.mediaUrl, privacyLevel: "SELF_ONLY", isAigc: true }) });
    set({ db: res.db });
    notify("TikTok publish started.");
  } catch (error) {
    notify(error.message);
  }
}

async function tiktokStatus(id) {
  try {
    const res = await api(`/tiktok/publish/${id}/status`);
    set({ db: res.db });
    notify(`TikTok status: ${res.publish.status}`);
  } catch (error) {
    notify(error.message);
  }
}

async function mutate(path, options, message) {
  const db = await api(path, options);
  set({ db, modal: null });
  notify(message);
}

async function download(url, filename) {
  const res = await fetch(url.startsWith("/api") ? `${apiBaseUrl}${url}` : url, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {}
  });
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  set({ modal: "export" });
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
      setTimeout(() => notify(status.status === "paid" ? "Payment confirmed. Sign in to Studio." : `Payment is ${status.status}. Refresh in a moment if you just paid.`), 750);
    } catch {
      setTimeout(() => notify("Payment received. Sign in after activation completes."), 750);
    }
  }
}

boot().catch((error) => {
  state.loading = false;
  render();
  notify(error.message);
});
