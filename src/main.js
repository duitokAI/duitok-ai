import "./styles.css";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isStudioPath = () => window.location.pathname.startsWith("/studio") || window.location.pathname.startsWith("/admin");
const pathIs = (path) => window.location.pathname === path;

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
  lang: localStorage.getItem("duitok-lang") || "ms",
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
  agentMessages: JSON.parse(localStorage.getItem("duitok-agent-messages") || "[]"),
  queuePolling: false,
  langOpen: false,
  imagePromptGroup: "avatar",
  generating: false
};

const languages = [
  ["ms", "BM"],
  ["zh", "中文"],
  ["en", "EN"]
];

const brandAssets = {
  horizontal: "/duitok-logo-transparent.png",
  mascot: "/duitok-mascot-transparent.png",
  banner: "/duitok-brand-banner-transparent.png",
  stacked: "/duitok-logo-stacked.png"
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
    contentEngine: "Enjin Kandungan",
    checkout: "Checkout",
    studio: "Studio",
    navFeatures: "Fungsi",
    navPricing: "Harga",
    navAffiliate: "Affiliate",
    navFaq: "FAQ",
    signIn: "Log masuk",
    promo: "Promo RM69/bulan tamat malam ini · 13 slot pelancaran lagi",
    heroEyebrow: "1,300+ seller Malaysia boleh hasilkan content lebih laju",
    heroTitle: "Competitor post 10 video. Anda mula hari ini.",
    heroTitleLead: "Kompetitor dah",
    heroTitleHot: "post 10 video.",
    heroTitleTail: "Anda masih fikir hook pertama.",
    demoCta: "Tengok Demo",
    heroCopy: "Paste link produk TikTok Shop. Duitok AI hasilkan hook, skrip UGC, caption, avatar idea dan posting plan dalam beberapa minit.",
    startCreating: "Mula Sekarang - 2 Video FREE",
    heroTrust1: "Built for Malaysia sellers",
    heroTrust2: "BM / 中文 / EN",
    heroTrust3: "Tak perlu tunjuk muka",
    heroTrust4: "Review dulu sebelum post",
    whatsappCta: "WhatsApp",
    rating: "Rating 4.9",
    sellersNow: "7 seller sedang generate",
    guarantee: "Jaminan 30 hari",
    you: "Anda",
    competitor: "Competitor",
    oneVideo: "1 video / hari",
    tenVideos: "10 video / hari",
    catchUp: "Duitok AI kejar dalam beberapa minit",
    speed: "Laju",
    speedTitle: "100 idea dalam satu sesi.",
    speedCopy: "Generate content sebulan sementara team anda urus order.",
    price: "Harga",
    priceTitle: "Ringan untuk seller kecil.",
    priceCopy: "Mula RM69/bulan, tambah credit hanya bila generate.",
    simple: "Mudah",
    simpleTitle: "Paste link. Pilih output. Export.",
    simpleCopy: "Tak perlu belajar prompt engineering. Tak perlu timeline editor.",
    sellerReality: "Realiti seller",
    painTitle: "Content tertangguh bukan sebab malas. Sistem belum ada.",
    painCopy: "Seller TikTok Shop perlu output harian, tapi kerja operasi selalu makan masa content.",
    notEnoughTime: "Tak sempat shoot",
    notEnoughTimeCopy: "Satu produk simple boleh makan separuh hari bila perlu setup, record dan ulang take.",
    ideasDry: "Idea cepat habis",
    ideasDryCopy: "Hook sama berulang buat video nampak penat sebelum buyer sempat percaya.",
    scatteredTools: "Team content mahal",
    scatteredToolsCopy: "Creator, editor dan copywriter cepat jadi kos tetap sebelum sales stabil.",
    competitorsFaster: "Competitor lebih laju",
    competitorsFasterCopy: "Mereka menang bukan sebab lebih kreatif sahaja, tapi sebab output lebih konsisten.",
    advantage: "Kelebihan anda",
    weaponsTitle: "Lima senjata content untuk seller TikTok Shop.",
    liveOutput: "Output Duitok AI",
    outputTitle: "Bukan dashboard kosong. Ini benda yang seller terus boleh guna.",
    outputCopy: "Setiap generate simpan rekod, boleh diedit, diexport dan nanti disambung ke auto-post TikTok selepas approval.",
    hookTitle: "Hook BM",
    hookSample: "Competitor dah post 10 video. Produk anda masih tunggu caption?",
    scriptTitle: "UGC Script",
    scriptSample: "Scene 1: tunjuk masalah. Scene 2: close-up produk. Scene 3: bukti cepat. CTA: klik beg kuning.",
    captionTitle: "Caption",
    captionSample: "Seller busy, content tetap jalan. Simpan dulu, cuba untuk produk anda hari ini.",
    planTitle: "Posting Plan",
    planSample: "Day 1 proof video, Day 2 comparison, Day 3 objection, Day 4 promo soft-sell.",
    howKicker: "Cara guna",
    howTitle: "Dari product link ke content plan tanpa buka 5 tool.",
    howCopy: "Flow dibuat supaya seller boleh repeat setiap hari, bukan hanya cantik untuk demo.",
    how1Title: "Paste product link",
    how1Copy: "Masukkan URL TikTok Shop atau detail produk.",
    how2Title: "Choose content mode",
    how2Copy: "Pilih UGC, image/avatar, clone prompt, storytelling atau viral angle.",
    how3Title: "Generate output",
    how3Copy: "Duitok AI hasilkan hook, skrip, caption, image state dan posting idea.",
    how4Title: "Export atau schedule",
    how4Copy: "Download file, simpan ke library, atau sedia untuk TikTok auto-post nanti.",
    demoTitle: "Demo gaya TikTok Shop Malaysia.",
    demoCopy: "Contoh dibuat untuk kategori seller sebenar: skincare, supplement, kitchenware, gadget, fashion dan home product.",
    oldWay: "Cara lama",
    newWay: "Cara Duitok AI",
    pricingTitle: "RM69/month untuk content engine seller kecil.",
    pricingCopy: "Launch plan jelas: mula murah, dapat 2 Video FREE, kemudian tambah credit bila volume naik.",
    launchOffer: "Launch offer",
    claimPlan: "Claim plan RM69",
    riskReversal: "30-day money-back bila setup tak sesuai dengan workflow anda.",
    controlKicker: "Trust & compliance",
    controlTitle: "Auto-post boleh datang kemudian. Kawalan tetap di tangan anda.",
    controlCopy: "Duitok AI bantu hasilkan output dan jadual. Final publish, claim produk dan compliance tetap perlu review manusia.",
    startNow: "Mula sekarang",
    registerTitle: "Register dan aktif dalam satu minit.",
    registerCopy: "Guna flow sign-in Studio sekarang. Payment dan automasi account akan connect ke CHIP bila merchant key siap.",
    fullName: "Nama penuh",
    email: "Email",
    password: "Password",
    continueRegistration: "Teruskan ke registration",
    faqTitle: "Soalan seller sebelum mula.",
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
    imageGenerator: "Media Generator",
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
    contentEngine: "内容引擎",
    checkout: "结账",
    studio: "工作台",
    navFeatures: "功能",
    navPricing: "价格",
    navAffiliate: "联盟",
    navFaq: "FAQ",
    signIn: "登录",
    promo: "RM69/月限时优惠今晚结束 · 还剩 13 个名额",
    heroEyebrow: "1,300+ 马来西亚卖家正在加速内容生产",
    heroTitle: "竞争对手一天发 10 条，你今天就开始追上。",
    heroTitleLead: "竞争对手已经",
    heroTitleHot: "发了 10 条视频。",
    heroTitleTail: "你还在想第一句 hook。",
    demoCta: "查看 Demo",
    heroCopy: "粘贴 TikTok Shop 产品链接。Duitok AI 在几分钟内生成 hook、UGC 脚本、caption、avatar 想法和发布计划。",
    startCreating: "现在开始 - 免费生成 2 条",
    heroTrust1: "为马来西亚卖家设计",
    heroTrust2: "BM / 中文 / EN",
    heroTrust3: "无需露脸",
    heroTrust4: "发布前人工确认",
    whatsappCta: "WhatsApp",
    rating: "4.9 评分",
    sellersNow: "7 个卖家正在生成",
    guarantee: "30 天保障",
    you: "你",
    competitor: "竞争对手",
    oneVideo: "1 条 / 天",
    tenVideos: "10 条 / 天",
    catchUp: "Duitok AI 几分钟内帮你追上",
    speed: "速度",
    speedTitle: "一次生成 100 个想法。",
    speedCopy: "团队处理订单时，你可以生成一个月内容。",
    price: "价格",
    priceTitle: "小卖家也负担得起。",
    priceCopy: "RM69/月开始，需要生成时再加 credit。",
    simple: "简单",
    simpleTitle: "粘贴链接，选择输出，导出。",
    simpleCopy: "不用学 prompt，不用剪辑时间线。",
    sellerReality: "卖家现实",
    painTitle: "内容拖延不是你懒，是你还没有系统。",
    painCopy: "TikTok Shop 卖家每天都需要内容，但打包、客服、库存和供应商已经吃掉大部分时间。",
    notEnoughTime: "没时间拍",
    notEnoughTimeCopy: "一个简单产品也要布景、拍摄、重拍，半天很快就没了。",
    ideasDry: "想法很快枯竭",
    ideasDryCopy: "重复同一个 hook，视频还没卖货就先显得疲惫。",
    scatteredTools: "内容团队太贵",
    scatteredToolsCopy: "creator、剪辑、文案都会变成固定成本，销量还没稳定前压力很大。",
    competitorsFaster: "竞争对手更快",
    competitorsFasterCopy: "他们赢不只是因为更有创意，而是更新数量更稳定。",
    advantage: "你的优势",
    weaponsTitle: "TikTok Shop 卖家的五个内容武器。",
    liveOutput: "Duitok AI 输出",
    outputTitle: "不是空 dashboard，而是卖家马上能用的素材。",
    outputCopy: "每次生成都会保存记录，可以编辑、导出，后续 TikTok auto-post 审批通过后继续接上。",
    hookTitle: "中文 / BM Hook",
    hookSample: "竞争对手已经发 10 条视频，你的产品还在等 caption？",
    scriptTitle: "UGC 脚本",
    scriptSample: "镜头 1：展示痛点。镜头 2：产品 close-up。镜头 3：快速证明。CTA：点击小黄车。",
    captionTitle: "Caption",
    captionSample: "卖家再忙，内容也可以继续跑。先收藏，今天试一个产品。",
    planTitle: "发布计划",
    planSample: "Day 1 证明视频，Day 2 对比，Day 3 处理疑虑，Day 4 soft-sell 促销。",
    howKicker: "使用流程",
    howTitle: "从产品链接到内容计划，不用打开 5 个工具。",
    howCopy: "流程是为了卖家每天重复使用，不只是做一个好看的 demo。",
    how1Title: "粘贴产品链接",
    how1Copy: "输入 TikTok Shop URL 或产品信息。",
    how2Title: "选择内容模式",
    how2Copy: "选择 UGC、图片/avatar、复刻 prompt、故事脚本或爆款角度。",
    how3Title: "生成输出",
    how3Copy: "Duitok AI 生成 hook、脚本、caption、图片状态和发布想法。",
    how4Title: "导出或排程",
    how4Copy: "下载文件、保存到素材库，或为后续 TikTok auto-post 做准备。",
    demoTitle: "马来西亚 TikTok Shop 风格 Demo。",
    demoCopy: "示例覆盖真实卖家类目：skincare、supplement、kitchenware、gadget、fashion 和 home product。",
    oldWay: "旧方法",
    newWay: "Duitok AI 方法",
    pricingTitle: "RM69/month，给小卖家的内容引擎。",
    pricingCopy: "启动计划清楚：低成本开始，包含 2 Video FREE，后续内容量上来再加 credit。",
    launchOffer: "启动优惠",
    claimPlan: "领取 RM69 计划",
    riskReversal: "如果不适合你的工作流，30 天内可申请退款。",
    controlKicker: "信任与合规",
    controlTitle: "Auto-post 可以后续接，但控制权必须在你手里。",
    controlCopy: "Duitok AI 帮你生成内容和计划。最终发布、产品宣称和合规，仍然需要人工确认。",
    startNow: "现在开始",
    registerTitle: "一分钟注册并激活。",
    registerCopy: "现在先使用 Studio 登录流程。支付和账号自动化会在 CHIP merchant key 准备好后连接。",
    fullName: "姓名",
    email: "邮箱",
    password: "密码",
    continueRegistration: "继续注册",
    faqTitle: "卖家开始前常问的问题。",
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
    stepOriginal: "原视频",
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
    imageGenerator: "图片 / 视频生成器",
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
    contentEngine: "Content Engine",
    checkout: "Checkout",
    studio: "Studio",
    navFeatures: "Features",
    navPricing: "Pricing",
    navAffiliate: "Affiliate",
    navFaq: "FAQ",
    signIn: "Sign in",
    promo: "Promo RM69/month ends tonight · 13 launch slots left",
    heroEyebrow: "1,300+ Malaysia sellers can scale content faster",
    heroTitle: "Competitors post 10 videos. You start today.",
    heroTitleLead: "Your competitor",
    heroTitleHot: "posted 10 videos.",
    heroTitleTail: "You are still writing the first hook.",
    demoCta: "View Demo",
    heroCopy: "Paste a TikTok Shop product link. Duitok AI generates hooks, UGC scripts, captions, avatar ideas, and posting plans in minutes.",
    startCreating: "Start Now - 2 Videos FREE",
    heroTrust1: "Built for Malaysia sellers",
    heroTrust2: "BM / 中文 / EN",
    heroTrust3: "No need to show face",
    heroTrust4: "Review before posting",
    whatsappCta: "WhatsApp",
    rating: "4.9 rating",
    sellersNow: "7 sellers generating now",
    guarantee: "30-day guarantee",
    you: "You",
    competitor: "Competitor",
    oneVideo: "1 video / day",
    tenVideos: "10 videos / day",
    catchUp: "Duitok AI catches up in minutes",
    speed: "Speed",
    speedTitle: "100 ideas in one sitting.",
    speedCopy: "Generate a full content month while your team handles orders.",
    price: "Price",
    priceTitle: "Lean enough for small sellers.",
    priceCopy: "Start from RM69/month, then top up credits only when you generate.",
    simple: "Simple",
    simpleTitle: "Paste link. Choose output. Export.",
    simpleCopy: "No prompt engineering course. No editor timeline.",
    sellerReality: "Seller reality",
    painTitle: "Content is delayed because the system is missing.",
    painCopy: "TikTok Shop sellers need daily output, but operations keep swallowing the time meant for content.",
    notEnoughTime: "No time to shoot",
    notEnoughTimeCopy: "One simple product becomes a half-day task once you set up, record, and retake.",
    ideasDry: "Ideas run out fast",
    ideasDryCopy: "Repeating the same hook makes content feel tired before buyers trust you.",
    scatteredTools: "Content teams cost too much",
    scatteredToolsCopy: "Creators, editors, and copywriters become fixed costs before sales are stable.",
    competitorsFaster: "Competitors move faster",
    competitorsFasterCopy: "They win because their output is more consistent, not just more creative.",
    advantage: "Your advantage",
    weaponsTitle: "Five content weapons for TikTok Shop sellers.",
    liveOutput: "Duitok AI output",
    outputTitle: "Not an empty dashboard. Output sellers can actually use.",
    outputCopy: "Every generation is stored, editable, exportable, and ready for TikTok auto-post once approval is complete.",
    hookTitle: "Hook",
    hookSample: "Your competitor already posted 10 videos. Is your product still waiting for a caption?",
    scriptTitle: "UGC Script",
    scriptSample: "Scene 1: show the problem. Scene 2: product close-up. Scene 3: quick proof. CTA: tap the yellow bag.",
    captionTitle: "Caption",
    captionSample: "Busy seller, content still moving. Save this and test one product today.",
    planTitle: "Posting Plan",
    planSample: "Day 1 proof video, Day 2 comparison, Day 3 objection, Day 4 soft-sell promo.",
    howKicker: "How it works",
    howTitle: "From product link to content plan without opening five tools.",
    howCopy: "The flow is designed for sellers to repeat daily, not just to look good in a demo.",
    how1Title: "Paste product link",
    how1Copy: "Add a TikTok Shop URL or product details.",
    how2Title: "Choose content mode",
    how2Copy: "Pick UGC, image/avatar, clone prompt, storytelling, or viral angle.",
    how3Title: "Generate output",
    how3Copy: "Duitok AI creates hooks, scripts, captions, image states, and posting ideas.",
    how4Title: "Export or schedule",
    how4Copy: "Download files, save to library, or prepare for TikTok auto-post later.",
    demoTitle: "Malaysia TikTok Shop demo styles.",
    demoCopy: "Examples are shaped around real seller categories: skincare, supplement, kitchenware, gadget, fashion, and home product.",
    oldWay: "Old way",
    newWay: "Duitok AI way",
    pricingTitle: "RM69/month content engine for lean sellers.",
    pricingCopy: "Clear launch plan: start low, get 2 Videos FREE, then add credits as volume grows.",
    launchOffer: "Launch offer",
    claimPlan: "Claim RM69 plan",
    riskReversal: "30-day money-back if the setup does not fit your workflow.",
    controlKicker: "Trust & compliance",
    controlTitle: "Auto-post can come later. You stay in control.",
    controlCopy: "Duitok AI helps create output and schedules. Final publishing, product claims, and compliance still need human review.",
    startNow: "Start now",
    registerTitle: "Register and activate in one minute.",
    registerCopy: "Use the Studio sign-in flow now. Payment and account automation will connect to CHIP when your merchant keys are ready.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    continueRegistration: "Continue to registration",
    faqTitle: "Questions sellers ask before starting.",
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
    imageGenerator: "Media Generator",
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

const t = (key) => copy[state.lang]?.[key] || copy.en[key] || key;

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
  return `<span>${t("heroTitleLead")}</span><mark>${t("heroTitleHot")}</mark><span>${t("heroTitleTail")}</span>`;
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
  Object.assign(state, patch);
  render();
}

function captureScrollState() {
  const sidebar = document.querySelector(".sidebar");
  const workspace = document.querySelector(".workspace");
  if (!sidebar && !workspace) return null;
  return {
    sidebarTop: sidebar?.scrollTop || 0,
    workspaceTop: workspace?.scrollTop || 0,
    windowX: window.scrollX,
    windowY: window.scrollY
  };
}

function restoreScrollState(scrollState) {
  if (!scrollState) return;
  const sidebar = document.querySelector(".sidebar");
  const workspace = document.querySelector(".workspace");
  if (sidebar) sidebar.scrollTop = scrollState.sidebarTop;
  if (workspace) workspace.scrollTop = scrollState.workspaceTop;
  window.scrollTo(scrollState.windowX, scrollState.windowY);
}

function project() {
  return state.db.projects.find((item) => item.id === state.projectId) || state.db.projects[0];
}

function render() {
  const scrollState = captureScrollState();
  app.innerHTML = state.loading ? `<main class="loading">${icon("loader-circle")} Loading...</main>` : route();
  bind();
  window.lucide?.createIcons();
  restoreScrollState(scrollState);
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
    <main class="public-shell home-shell">
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
      <section class="public-hero">
        <div>
          <p class="eyebrow">${t("heroEyebrow")}</p>
          <h1 class="hero-headline">${heroTitleMarkup()}</h1>
          <p class="public-copy">${t("heroCopy")}</p>
          <div class="public-actions">
            <button class="gold-button" data-action="open-register">${icon("sparkles")} ${t("startCreating")}</button>
            <a class="dark-button demo-button" href="#demo">${icon("play-circle")} ${t("demoCta")}</a>
          </div>
          <div class="trust-row">
            <span>${icon("map-pin", 16)} ${t("heroTrust1")}</span>
            <span>${icon("languages", 16)} ${t("heroTrust2")}</span>
            <span>${icon("user-round-check", 16)} ${t("heroTrust3")}</span>
            <span>${icon("shield-check", 16)} ${t("heroTrust4")}</span>
          </div>
        </div>
        <section class="hero-board">
          <img class="hero-scene" src="/duitok-hero-seller-v2.jpg" alt="Duitok AI seller using AI content tools">
          <div class="hero-board-panel">
            <div class="product-link-card">
              <span>${icon("link", 16)} TikTok Shop URL</span>
              <b>duitok.my/product/ugc-kit</b>
            </div>
            <div class="output-stack">
              <article>${icon("image", 18)} <b>Avatar image</b><span>ready</span></article>
              <article>${icon("file-text", 18)} <b>UGC script BM</b><span>12 hooks</span></article>
              <article>${icon("captions", 18)} <b>Caption + CTA</b><span>auto</span></article>
            </div>
            <div class="race-card self"><span>${t("you")}</span><b>${t("oneVideo")}</b></div>
            <div class="race-card hot"><span>${t("competitor")}</span><b>${t("tenVideos")}</b></div>
            <div class="race-meter"><i></i></div>
            <strong class="catch-badge">${icon("zap", 16)} ${t("catchUp")}</strong>
          </div>
        </section>
      </section>
      <section class="proof-strip">
        <article>${icon("star", 18)} <b>${t("rating")}</b></article>
        <article>${icon("radio", 18)} <b>${t("sellersNow")}</b></article>
        <article>${icon("badge-check", 18)} <b>${t("guarantee")}</b></article>
        <article>${icon("wallet-cards", 18)} <b>RM69/month</b></article>
      </section>
      <section class="split-section">
        <div><p class="eyebrow">${t("sellerReality")}</p><h2>${t("painTitle")}</h2><p>${t("painCopy")}</p></div>
        <div class="pain-list">
          ${painCards()}
        </div>
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
        </div>
        <div class="workflow-steps">${workflowSteps()}</div>
      </section>
      <section class="feature-section">
        <p class="eyebrow">${t("advantage")}</p>
        <h2>${t("weaponsTitle")}</h2>
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
          <p class="eyebrow">TikTok Shop Demo</p>
          <h2>${t("demoTitle")}</h2>
          <p>${t("demoCopy")}</p>
        </div>
        <div class="demo-reel">
          ${demoGalleryCards()}
        </div>
      </section>
      <section class="comparison-section">
        <p class="eyebrow">Manual vs Duitok AI</p>
        <h2>The old workflow burns days. The new one compresses decisions.</h2>
        <div class="compare-grid">
          <article><span>${t("oldWay")}</span><h3>Manual production</h3><ul><li>Find creator or shoot yourself</li><li>Write script and brief</li><li>Edit, revise, caption manually</li><li>Repeat again tomorrow</li></ul></article>
          <article class="winner"><span>${t("newWay")}</span><h3>AI-assisted content engine</h3><ul><li>Paste product link</li><li>Pick image, UGC, clone, or story mode</li><li>Generate batch-ready outputs</li><li>Export or continue inside Studio</li></ul></article>
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
        <div><p class="eyebrow">${t("navPricing")}</p><h2>${t("pricingTitle")}</h2><p>${t("pricingCopy")}</p></div>
        <article class="price-card">
          <span>${t("launchOffer")}</span>
          <img class="price-brand-mark" src="${brandAssets.mascot}" alt="" aria-hidden="true">
          <h3>Duitok AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM69</b><small>/month</small></div>
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
        <details open><summary>Do I need to know how to shoot video?</summary><p>No. Duitok AI is designed around product links, prompts, scripts, and repeatable content structures.</p></details>
        <details><summary>Can this work for Malay content?</summary><p>Yes. The product is shaped for Malaysia seller workflows and informal Bahasa Melayu content direction.</p></details>
        <details><summary>Is auto-posting ready?</summary><p>The current build prepares scheduling states and exports. Full TikTok auto-posting should be connected after API approval.</p></details>
        <details><summary>Where do I manage projects?</summary><p>Go to /studio, sign in, and use the workspace for projects, billing, usage, affiliate, and support.</p></details>
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
          <p class="public-copy">This page mirrors the Duitok AI checkout flow: plan confirmation on one side, buyer details on the other. CHIP payment will be connected after your merchant keys are ready.</p>
          <div class="checkout-steps">
            <article><b>1</b><span>Subscribe plan</span><p>Unlock all content tools and low generation rates.</p></article>
            <article><b>2</b><span>Top up credits</span><p>RM1 = 1 credit. Credits are used when generating assets.</p></article>
            <article><b>3</b><span>Generate outputs</span><p>Image, UGC, clone, story, and batch tools deduct automatically.</p></article>
          </div>
        </div>
        <article class="price-card checkout-card">
          <span>Launch offer</span>
          <img class="price-brand-mark" src="${brandAssets.mascot}" alt="" aria-hidden="true">
          <h3>Duitok AI Pro</h3>
          <div class="price"><s>RM300</s><b>RM69</b><small>/month</small></div>
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
          <label class="check-label"><input type="checkbox" required> <span>I agree to <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</span></label>
          <button class="gold-button" type="submit">${icon("credit-card")} Pay RM69 - FPX / DuitNow QR</button>
          <small>Secured via CHIP Payment once API keys are configured.</small>
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

function painCards() {
  return [
    ["video", t("notEnoughTime"), t("notEnoughTimeCopy")],
    ["lightbulb", t("ideasDry"), t("ideasDryCopy")],
    ["receipt", t("scatteredTools"), t("scatteredToolsCopy")],
    ["activity", t("competitorsFaster"), t("competitorsFasterCopy")]
  ]
    .map(([ic, title, text]) => `<article>${icon(ic, 24)}<h3>${title}</h3><p>${text}</p></article>`)
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
  return [
    ["link", t("how1Title"), t("how1Copy")],
    ["sliders-horizontal", t("how2Title"), t("how2Copy")],
    ["sparkles", t("how3Title"), t("how3Copy")],
    ["download", t("how4Title"), t("how4Copy")]
  ]
    .map(([ic, title, text], index) => `<article><b>${String(index + 1).padStart(2, "0")}</b>${icon(ic, 24)}<h3>${title}</h3><p>${text}</p></article>`)
    .join("");
}

function demoGalleryCards() {
  const data = {
    ms: [
      ["8s", "Hijab skincare UGC", "Hook soft-sell BM"],
      ["12s", "Supplement proof", "Angle before/after"],
      ["16s", "Kitchenware demo", "Problem-solution flow"],
      ["10s", "Gadget review", "Handle objection"],
      ["14s", "Fashion try-on", "Style comparison"],
      ["11s", "Home product", "Trust + CTA"]
    ],
    zh: [
      ["8s", "头巾 skincare UGC", "BM soft-sell hook"],
      ["12s", "保健品证明视频", "before/after 角度"],
      ["16s", "厨具演示", "痛点到解决方案"],
      ["10s", "Gadget 测评", "处理购买疑虑"],
      ["14s", "Fashion try-on", "穿搭对比"],
      ["11s", "Home product", "信任 + CTA"]
    ],
    en: [
      ["8s", "Hijab skincare UGC", "BM soft-sell hook"],
      ["12s", "Supplement proof", "Before/after angle"],
      ["16s", "Kitchenware demo", "Problem-solution flow"],
      ["10s", "Gadget review", "Objection handling"],
      ["14s", "Fashion try-on", "Style comparison"],
      ["11s", "Home product", "Trust + CTA"]
    ]
  };
  return (data[state.lang] || data.ms).map(([duration, title, text]) => demoCard(duration, title, text)).join("");
}

function pricingBullets() {
  const data = {
    ms: ["2 Video FREE", "UGC Script Studio", "AI Image / Avatar workflow", "Caption generator", "Clone prompt mode", "TikTok posting planner", "WhatsApp support"],
    zh: ["免费生成 2 条 Video", "UGC 脚本工作台", "AI Image / Avatar 流程", "Caption 生成器", "复刻 Prompt 模式", "TikTok 发布计划器", "WhatsApp 客服支持"],
    en: ["2 Videos FREE", "UGC Script Studio", "AI Image / Avatar workflow", "Caption generator", "Clone prompt mode", "TikTok posting planner", "WhatsApp support"]
  };
  return data[state.lang] || data.ms;
}

function controlCards() {
  const data = {
    ms: ["Manual review sebelum posting", "Tiada final publish tanpa approval anda", "Avatar workflow untuk kurang bergantung pada muka sendiri", "Anda semak claim produk dan compliance", "TikTok API approval diperlukan untuk official auto-post"],
    zh: ["发布前人工审核", "没有你的确认不会最终发布", "Avatar workflow 降低对真人露脸的依赖", "产品宣称和合规由你最终确认", "官方 auto-post 需要 TikTok API 审批"],
    en: ["Manual review before posting", "No final publish without your approval", "Avatar workflow reduces dependence on your own face", "You review product claims and compliance", "TikTok API approval is required for official auto-post"]
  };
  return (data[state.lang] || data.ms)
    .map((item) => `<article>${icon("check-circle-2", 20)}<p>${item}</p></article>`)
    .join("");
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
      <div class="login-brand">${brand()}</div>
      <section class="login-card">
        <div class="login-copy">
          <h1>${t("loginTitle")}</h1>
          <p>${t("loginCopy")}</p>
        </div>
        <form data-form="login" class="login-form">
          <label>${t("email")}<input name="email" type="email" value="admin@duitok.com" required></label>
          <label>${t("password")}<input name="password" type="password" value="duitok123" required></label>
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
        ${state.user?.role === "admin" ? `<button class="side-link ${state.page === "admin" ? "active" : ""}" data-page="admin">${icon("shield-check")} Admin CRM</button>` : ""}
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
        <button class="side-link ${state.page === "whatsapp" ? "active" : ""}" data-page="whatsapp">${icon("message-circle")} ${t("whatsapp")}${icon("arrow-up-right", 14)}</button>
      </aside>
      <main class="workspace">${page()}</main>
      <button class="live-tab" data-action="live">${icon("activity", 18)} LIVE - ${state.db.liveCount}</button>
      <button class="chat-bubble support-bubble" data-action="support" title="Contact support">${icon("message-circle", 32)}</button>
      ${state.live ? livePanel() : ""}
      ${modal()}
    </div>`;
}

function brand(label = "") {
  const labelMarkup = label ? `<strong class="brand-context">${label}</strong>` : "";
  return `<div class="brand-lockup"><span class="brand-core" aria-label="Duitok AI"><img class="brand-logo-mascot" src="${brandAssets.mascot}" alt="" aria-hidden="true"><span class="brand-wordmark"><span>Duitok</span><span>AI</span></span></span>${labelMarkup}</div>`;
}

function footerBrand(label = "Duitok AI") {
  return `<footer class="public-footer"><span class="footer-brand"><span class="brand-core footer-brand-core" aria-label="Duitok AI"><img class="brand-logo-mascot" src="${brandAssets.mascot}" alt="" aria-hidden="true"><span class="brand-wordmark"><span>Duitok</span><span>AI</span></span></span><b>${label}</b></span><span>© 2026</span><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="mailto:hello@duitok.com">hello@duitok.com</a></footer>`;
}

function projectButtons() {
  return state.db.projects
    .filter((item) => item.name.toLowerCase().includes(state.search.toLowerCase()))
    .map((item) => `<button class="project-button ${item.id === state.projectId && state.page === "project" ? "active" : ""}" data-project="${item.id}">${icon("folder")} <span>${item.name}</span></button>`)
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

function generationQueueTable(jobs) {
  const rows = jobs.slice(0, 8);
  return table(rows.map((job) => [
    job.model || job.action,
    `${job.status} | ${job.creditsCharged || 0} credits`,
    job.errorMessage || job.completedAt || job.startedAt || job.createdAt || ""
  ]));
}

function projectStatusBar(p) {
  const spent = p.results.length * 4;
  const ready = state.db.schedule.filter((item) => item.status === "Ready").length;
  return `<section class="project-status"><article><span>Assets generated</span><b>${p.results.length}</b></article><article><span>Ready to publish</span><b>${ready}</b></article><article><span>Credits used</span><b>${spent}</b></article></section>`;
}

function contentLibraryPage() {
  const results = allResults().slice().reverse();
  return `<header class="project-head"><div><p class="folder-label">${icon("folder", 18)} Content Library</p><h1>Generated Assets</h1><p class="subtitle">All project outputs in one place, ready for export or scheduling.</p></div><button class="sop-button" data-action="export-all">${icon("download")} Export Data</button></header><section class="canvas-card slim"><div class="library-grid">${results.map((item) => `<article><b>${item.title}</b><span>${item.projectName}</span>${resultPreview(item)}<button data-result="${item.id}">${icon("download")} ${t("export")}</button></article>`).join("") || `<p class="empty-text">No generated assets yet.</p>`}</div></section>`;
}

function adminPage() {
  if (state.user?.role !== "admin") return `<section class="canvas-card slim"><h1>Admin access required</h1></section>`;
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
        ${table(selectedPayments.slice(0, 4).map((payment) => [payment.orderId, `${payment.status} | RM ${payment.amount}`, payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""]))}
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
        ${table(payments.slice(0, 12).map((payment) => [payment.orderId, `${payment.status} | RM ${payment.amount}`, payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""]))}
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
    ${projectStatusBar(p)}
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
  const mediaModels = ["Duitok Image", "Duitok Image Pro", "Duitok Video", "Duitok Video Plus", "Duitok Story Video", "Duitok Omni Video", "Duitok Motion Video"];
  return `
    <div class="generator-box"><h2>🖼️ ${t("imageGenerator")}</h2><div class="form-grid three">${select("image.model", t("model"), mediaModels, p.image.model)}${select("image.mode", t("mode"), ["Create Image", "Edit Image", "Product Scene"], p.image.mode)}${mediaDurationSelect(p)}</div></div>
    ${upload(t("avatarRef"), t("dropAvatar"), "Face / person - used for all variations", "camera", "avatar")}
    ${upload(t("productRef"), t("dropProduct"), "Product - used for all images and videos", "package", "product")}
    ${imagePromptSettings(p)}
    ${results(p, ["image", "video"])}`;
}

function mediaDurationSelect(p) {
  if (p.image.model === "Duitok Video") return select("image.duration", "Duration", ["4", "6", "8", "10", "12", "15"], String(p.image.duration || "4"));
  if (p.image.model === "Duitok Story Video") return select("image.duration", "Duration", ["8", "12"], String(p.image.duration || "8"));
  if (p.image.model === "Duitok Motion Video") return select("image.duration", "Duration", Array.from({ length: 23 }, (_, index) => String(index + 8)), String(p.image.duration || "8"));
  if (p.image.model === "Duitok Omni Video") return `<label>Duration<input value="10 seconds" disabled></label>`;
  if (p.image.model === "Duitok Video Plus") return `<label>Duration<input value="8 seconds" disabled></label>`;
  return `<label>Charge<input value="${p.image.model === "Duitok Image Pro" ? "0.2" : "0.1"} credit" disabled></label>`;
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
    topup: [t("topup"), "Credit purchases update the backend ledger.", `<div class="topup-grid">${[10, 30, 50, 100].map((x) => `<button data-topup="${x}"><strong>${x}</strong><span>credits</span><b>RM${x}</b></button>`).join("")}</div>`],
    affiliate: [t("affiliate"), "Referral links and payouts.", `<div class="metric-row"><article><span>Code</span><strong>${state.db.affiliate.code}</strong></article><article><span>Clicks</span><strong>${state.db.affiliate.clicks}</strong></article><article><span>Payout</span><strong>RM${state.db.affiliate.payout}</strong></article></div><button class="gold-button" data-action="copy-affiliate">${icon("copy")} Copy referral link</button>`],
    usage: [t("usage"), "Every generated action is written to history.", table(state.db.usage.map((x) => [x.action, `${x.credits} credits`, new Date(x.createdAt).toLocaleString()]))],
    autopost: [t("autopost"), "Chrome extension assisted TikTok publishing queue.", autoPostPage()],
    whatsapp: [t("whatsapp"), "Community handoff.", `<button class="gold-button" data-action="open-whatsapp">${icon("message-circle")} Open WhatsApp Group</button>`]
  };
  const [title, subtitle, body] = map[state.page];
  return `<header class="project-head"><div><p class="folder-label">${icon("folder", 18)} ${t("publicTools")}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><button class="sop-button" data-action="export-all">${icon("download")} ${t("export")}</button></header><section class="canvas-card slim">${body}</section>`;
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
  const title = { newProject: t("createProject"), register: t("choosePlan"), sop: t("sopImage"), export: t("exportReady"), support: t("supportTitle") }[state.modal];
  const body = {
    newProject: `<form data-form="project"><label>${t("project")}<input name="name" placeholder="Project ${(state.db?.projects.length || 0) + 1}" required></label><button class="gold-button" type="submit">${icon("plus")} ${t("newProject")}</button></form>`,
    register: `<form data-form="login"><label>${t("email")}<input name="email" type="email" placeholder="you@duitok.com" required></label><label>${t("password")}<input name="password" type="password" placeholder="Create password" required></label><button class="gold-button" type="submit">${icon("lock")} Register & Enter Studio</button></form>`,
    sop: `<div class="sop-sheet"><b>Image SOP</b><ol><li>Upload avatar face.</li><li>Upload product reference.</li><li>Select model and mode.</li><li>Write prompt.</li><li>Generate, save, export.</li></ol><button class="dark-button" data-action="download-sop">${icon("download")} Download SOP</button></div>`,
    export: `<p>Your export has started. Files are generated by the backend.</p><button class="gold-button" data-action="close-modal">${icon("check")} Done</button>`,
    support: `<form data-form="support" class="support-form"><label>Message<textarea name="message" placeholder="Tell us what happened, what you tried, and your WhatsApp number if you want a reply." required></textarea></label><button class="gold-button" type="submit">${icon("send")} ${t("supportTicket")}</button></form>`
  }[state.modal];
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal"><button class="icon-only close" data-action="close-modal">${icon("x")}</button><p class="folder-label">${icon("sparkles", 18)} Duitok AI</p><h2>${title}</h2>${body}</section></div>`;
}

function livePanel() {
  return `<aside class="live-panel"><h3>${icon("activity")} Live Activity</h3>${state.db.usage.slice(0, 6).map((x) => `<p>${x.action}<small>${x.credits} credits</small></p>`).join("")}</aside>`;
}

function agentPage() {
  const prompts = [
    "帮我为这个产品做 7 天 TikTok 内容",
    "用 Duitok Video 生成一个产品视频版本",
    "分析这个 competitor URL，生成 5 个 hook",
    "看一下我今天还缺什么内容"
  ];
  return `
    <section class="agent-page">
      <header class="agent-page-hero">
        <div>
          <p class="folder-label">${icon("bot", 18)} Duitok Agent</p>
          <h1>Your AI operator for TikTok Shop content.</h1>
          <p class="subtitle">Ask it to create projects, write prompts, generate assets, build batches, schedule posts, and decide the next best action.</p>
        </div>
        <button class="dark-button" data-action="support">${icon("ticket")} Contact human support</button>
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
  document.querySelectorAll("[data-project]").forEach((el) => el.addEventListener("click", () => set({ projectId: el.dataset.project, page: "project" })));
  document.querySelectorAll("[data-admin-user]").forEach((el) => el.addEventListener("click", () => set({ adminUserId: el.dataset.adminUser })));
  document.querySelectorAll("[data-admin-credit]").forEach((el) => el.addEventListener("click", () => adminAdjustCredits(el.dataset.adminCredit, Number(el.dataset.delta))));
  document.querySelectorAll("[data-admin-status]").forEach((el) => el.addEventListener("click", () => adminUpdateUser(el.dataset.adminStatus, { status: el.dataset.status })));
  document.querySelectorAll("[data-agent-permission]").forEach((el) => el.addEventListener("click", () => adminUpdateUser(el.dataset.agentPermission, { agentPermissions: { [el.dataset.permission]: el.dataset.enabled === "true" } })));
  document.querySelectorAll("[data-agent-prompt]").forEach((el) => el.addEventListener("click", () => sendAgentMessage(el.dataset.agentPrompt)));
  document.querySelectorAll("[data-date-field]").forEach((el) => el.addEventListener("change", () => set({ [el.dataset.dateField]: el.value })));
  document.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", (e) => action(e, el.dataset.action)));
  document.querySelectorAll("[data-field]").forEach((el) => el.addEventListener("change", fieldChange));
  document.querySelectorAll("[data-upload]").forEach((el) => el.addEventListener("change", uploadChange));
  document.querySelector("[data-agent-input]")?.addEventListener("input", (e) => { state.agentInput = e.target.value; });
  document.querySelectorAll("[data-prompt-group]").forEach((el) => el.addEventListener("click", () => set({ imagePromptGroup: el.dataset.promptGroup })));
  document.querySelectorAll("[data-image-preset]").forEach((el) => el.addEventListener("click", () => applyImagePreset(el.dataset.imagePreset)));
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
  if (name === "live") return set({ live: !state.live });
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
  if (name === "open-whatsapp") return window.open("https://wa.me/60123456789", "_blank");
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
  const db = await api(`/projects/${state.projectId}/field`, { method: "PATCH", body: JSON.stringify({ field: event.target.dataset.field, value: event.target.value }) });
  set({ db });
  notify(t("saveDone"));
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

async function sendAgentMessage(message) {
  const content = String(message || state.agentInput || "").trim();
  if (!content || state.agentBusy) return;
  const nextMessages = [...state.agentMessages, { role: "user", content }];
  rememberAgentMessages(nextMessages);
  set({ agentMessages: nextMessages, agentInput: "", agentBusy: true });
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
    if (res.toolResults?.length) notify("Duitok Agent updated the workspace.");
  } catch (error) {
    const messages = [...nextMessages, { role: "assistant", content: error.message }];
    rememberAgentMessages(messages);
    set({ agentMessages: messages, agentBusy: false });
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
