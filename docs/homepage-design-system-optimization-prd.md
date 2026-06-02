# Pokaya AI Homepage Design System Optimization PRD

## 1. 背景

Pokaya AI 首页已经从普通 SaaS landing page 逐步改成了一个高转化销售页：首屏强调 RM69/月、AI 短视频营销平台、无需露脸、无需囤货；中段有执行量、系统、输出样例、demo、Manual vs Pokaya AI、案例、定价、FAQ；同时已经开始为 GEO 页面群做内容布局。

当前问题不是单个模块不好看，而是整页还没有完全形成一个统一的视觉系统。部分 section 是明亮粉紫风格，部分 section 是黑底科技风，部分卡片密度偏高，标题尺度和信息层级有时不一致。继续零散改，会让页面变成多个好看的片段拼在一起，而不是一个有节奏、有记忆点、有转化逻辑的完整销售页面。

本 PRD 目标是把 Pokaya AI 首页升级成一套稳定、可复用、可扩展到 GEO 页面群的设计系统。

## 2. 核心定位

### 2.1 一句话定位

Pokaya AI 是面向卖家和副业新手的 AI 短视频营销平台，用已经跑通的短视频带货打法，帮助用户批量测试产品、hook、脚本、caption 和内容角度。

### 2.2 页面要卖的不是工具

页面不要把 RM69 讲成“买一个 AI 工具”。RM69 应该被包装成：

- 进入一个已经跑通的 AI 短视频带货打法
- 获得一个可执行的副业入口
- 用 AI 降低拿货、拍摄、剪辑、露脸、客服的门槛
- 用更低成本开始测试产品和内容
- 给自己多一个每月收入来源的机会

### 2.3 用户第一感受

用户进入页面后应该马上感到：

- 这不是普通 AI 生成器
- 这是一个给卖家跑内容、测产品、做副业的系统
- 视觉上有“短视频营销平台”的速度感、产能感和赚钱机会感
- RM69 不是贵，而是低成本进入一个副业系统

## 3. 目标用户

### 3.1 主要用户

- Malaysia TikTok Shop seller
- TikTok Affiliate 新手
- 想做副业但不会拍视频的人
- 有产品但缺内容产能的小卖家
- 想用 AI 批量测产品、测 hook、测内容角度的人

### 3.2 用户心理

他们不是来研究 AI 的。他们关心：

- 我能不能不用露脸开始？
- 我能不能不用拿货、发货、客服？
- 我一个月 RM69 到底拿到什么？
- 我能不能更快知道哪个产品和内容角度有机会？
- 我是不是可以用这个开始一个副业？

## 4. 当前页面问题诊断

### 4.1 视觉系统不够统一

现状：

- Hero 是视频场景感
- 中段是浅粉紫卡片系统
- Manual vs Pokaya AI 是黑底强对比
- Demo 区是视频卡片网格
- Pricing 又回到明亮 SaaS 卡片

问题：

- 每个模块单看可以，但整体节奏还不够像同一个品牌页面
- 黑底 section 很强，但上下过渡需要设计规则
- 亮色 section 内容多时容易显得像后台说明页

### 4.2 信息层级偏满

首页现在 section 很多，且每段都在解释“Pokaya 是什么”。用户滚动时可能会感到重复。

需要明确每一段只回答一个问题：

1. 这是什么机会？
2. 为什么现在做？
3. Pokaya 怎么帮我？
4. 我能产出什么？
5. 手工 vs AI 差在哪里？
6. RM69 包含什么？
7. 我现在怎么开始？

### 4.3 字体和标题尺度需要统一

部分标题很大，部分卡片标题也很大，导致页面节奏忽大忽小。

需要定义：

- Hero title
- Section title
- Card title
- Label / eyebrow
- Body copy
- Legal / risk note

### 4.4 CTA 重复但节奏不够精确

现在 CTA 很多，但需要区分：

- 首屏主 CTA：立即加入 RM69 计划
- Demo 区 CTA：订阅 RM69 + 拿 10 credits
- Pricing CTA：确认价值后购买
- Bottom CTA：最后收口

每个 CTA 的文案要配合当前 section 的心理状态，而不是全页都重复同一句。

### 4.5 GEO 页面还缺统一模板

后续会做：

- `/ai-short-video-marketing-platform`
- `/tiktok-shop-ai-video-generator`
- `/ai-tiktok-affiliate-video-generator`
- `/no-face-ai-product-video-generator`
- `/ai-product-promo-video-generator`

如果首页没有稳定设计系统，GEO 页面会变成 5 个不同风格的 landing page，影响品牌一致性和后续维护。

## 5. 设计目标

### 5.1 业务目标

- 提升首页到注册/订阅点击率
- 降低用户对 RM69 的价格阻力
- 强化“副业机会”而不是“工具订阅”
- 让用户清楚理解 credit 价格：图片 RM0.10，视频 RM0.40
- 支撑 GEO 页面批量扩展

### 5.2 体验目标

- 第一屏 3 秒内看懂：RM69/月加入 AI 短视频营销平台
- 15 秒内看懂：不用囤货、不用发货、不用客服、不用露脸
- 30 秒内看懂：Pokaya 不是随机生成，而是已跑通打法 + SOP + 平台
- 60 秒内看懂：订阅得到什么、生成如何扣费、下一步怎么开始

### 5.3 视觉目标

- 形成“明亮粉紫商业机会 + 黑底 AI 产能对比”的双系统
- 黑底模块用于关键冲突、对比、产能感
- 亮底模块用于解释、流程、价格、FAQ
- 所有卡片、标签、按钮、标题有统一尺度
- 页面看起来像一个成熟品牌，不像临时拼出来的促销页

## 6. 视觉系统方向

### 6.1 品牌关键词

- AI short-video selling
- Malaysia seller
- Side income
- Execution volume
- Tested method
- Low entry cost
- No-face product video

### 6.2 色彩

主系统：

- Deep purple: 用于标题和品牌识别
- Hot pink / coral: 用于重点词、价格、转化提醒
- Warm yellow: 用于主要 CTA 和 RM69 offer
- Soft lavender background: 用于解释型 section
- Near black: 用于高冲突对比 section
- Lime accent: 用于 AI 胜出、产能、优势状态

规则：

- 不要整页都粉紫，容易疲劳
- 不要整页都黑，副业机会会变得太硬
- 黄色只给 CTA、价格和倒计时，不做大面积背景
- Lime 只用于“AI 更快、更便宜、更高产”的结论

### 6.3 字体层级

建议规范：

- Hero H1: `clamp(52px, 7vw, 112px)`，只用于首屏
- Major section H2: `clamp(42px, 5vw, 76px)`
- Dense section H2: `clamp(34px, 4vw, 58px)`
- Card H3: `clamp(24px, 2vw, 36px)`
- Body: `18px - 24px`
- Card body: `16px - 20px`
- Eyebrow: `12px - 15px` uppercase / letter-spaced

规则：

- 卡片内不要使用 hero 级别字体
- section title 不要超过 2 行
- 中文标题可以强断行，但不能靠随机 `<br>` 维持布局
- 价格和数字可以大，但必须有解释文案承接

### 6.4 卡片系统

卡片类型分 4 种：

1. Proof Card：用于信任点和结果数字
2. Process Card：用于 SOP / 步骤
3. Demo Video Card：用于短视频样例
4. Contrast Card：用于 Manual vs AI 对比

规则：

- 不要卡片套卡片
- 每张卡只承载一个核心信息
- 大卡负责讲逻辑，小卡负责展示样例
- 卡片圆角统一在 18-28px，工具类 UI 不超过 8-12px

## 7. 页面信息架构重构

### 7.1 推荐首页顺序

1. Promo countdown bar
2. Hero: RM69/月加入 AI 短视频营销平台
3. Proof strip: RM69、10 credits、无需露脸、发布前确认
4. Opportunity section: 不用囤货/发货/客服/露脸，也能开始副业
5. Test volume section: 短视频带货是测试游戏
6. System section: 已跑通打法 + SOP + 模板 + 平台
7. Demo gallery: 15 个 AI 带货内容样例，3 行 5 个
8. Manual vs Pokaya AI: 黑底强对比
9. Pricing: RM69 不是工具，是入场券
10. 7-day path: 新手第一周怎么执行
11. FAQ: 风险、credits、TikTok Affiliate、是否保证收入
12. Final CTA + footer

### 7.2 可合并模块

当前部分模块信息相近，建议合并或压缩：

- `split-section` 和 `test-volume-section` 可合并成“为什么普通卖家做不快”
- `system-section` 和 `feature-section` 可合并成“Pokaya 给你的 5 个执行武器”
- `case-section` 和 `dream-section` 可合并成“副业可能性 + 风险提示”
- `scenario-section` 可以移到 GEO 页面或变成一排横向 chips

目标：首页不一定要短，但每一段都必须有新信息。

## 8. 核心模块 PRD

### 8.1 Promo Bar

目标：

- 制造时效感，但不要廉价黄条

建议：

- 使用品牌粉紫/深紫或半透明 glass bar
- 倒计时每 5 小时循环
- 文案强调 RM69 promo + 10 credits

中文文案：

> RM69 AI 短视频营销平台名额倒计时 01:46:15 · 订阅送 10 credits

验收：

- 不使用大面积纯黄色
- 倒计时数字清晰
- 移动端不换成难读的一长行

### 8.2 Hero

目标：

- 第一眼卖“副业机会”，第二眼解释“AI 短视频营销平台”

建议 H1：

> RM69/月加入  
> AI 短视频营销平台

副标题：

> 不用囤货、不用发货、不用做客服、不用露脸，也能开始 AI 短视频带货副业，给自己多一个每月收入来源。

CTA：

> 立即加入 RM69 计划

辅助 CTA：

> 先看 AI 带货样例

视觉：

- 保留沉浸式 hero 背景
- 文案不要放进大白卡
- CTA 使用黄色，但周围有足够暗色/白色空间承托
- 首屏底部露出下一 section 的一点内容

验收：

- 桌面首屏一眼能看到 H1、CTA、价格
- 移动端 H1 不超过 4 行
- CTA 在移动端首屏内可见

### 8.3 Opportunity Section

目标：

- 把“工具”转成“副业机会”

标题：

> 不是多一个 AI 工具，  
> 是多一个可以开始的副业入口

内容点：

- 不用先囤货
- 不用自己发货
- 不用做客服
- 不用露脸拍视频
- 用 AI 先跑内容和数据

布局：

- 左侧大标题 + 解释
- 右侧 4 个 compact proof cards
- 可用浅色背景，保持清晰

### 8.4 Test Volume Section

目标：

- 解释 Pokaya 真正的差异是“测试速度”

标题：

> 短视频带货不是猜爆款，  
> 是更快测试产品和角度

核心公式：

> 产品 × Hook × 脚本 × 视觉角度 × 发布量 = 找到机会的速度

设计：

- 用横向 formula bar 或 timeline
- 数字和符号要大
- 不要写成普通段落

### 8.5 Demo Gallery

目标：

- 让用户直观看到 AI 带货内容是什么

布局：

- 桌面：3 行 × 5 个视频卡
- 标题、类目、生成类型、成本放在视频上方或卡片头部
- 视频缩略图为主视觉
- 卡片底部只保留一句 hook 或用途

规则：

- 不要所有卡都是同一渐变占位
- 尽量使用更真实的产品/人物/UGC 视觉
- 每张卡要让用户理解“我也可以做这种内容”

### 8.6 Manual vs Pokaya AI

目标：

- 页面最强冲突区，强化“AI 卖家拼产能”

当前方向保留：

- 黑底网格
- 左红：旧方法 / 手工卖家
- 右绿：Pokaya AI 方法 / AI 卖家

优化建议：

- 标题可改成：
  > 普通卖家拼体力  
  > AI 卖家拼产能
- 右侧增加一个小 badge：
  > 更快测出有效角度
- 左侧最后一条强调：
  > 数据太少，判断靠感觉
- 右侧最后一条强调：
  > 复盘后复制有效角度

验收：

- 这块必须是全页记忆点之一
- 文字要够大、够清楚
- 移动端改成上下两张卡，不横向挤压

### 8.7 Pricing

目标：

- 消除 RM69 和 credit 的理解阻力

标题：

> RM69 买的不是工具，  
> 是一套已经跑通的 AI 带货打法

必须解释清楚：

- RM69/月 = membership
- 包含平台、模板、SOP、教程、基础支持
- promotion 送 10 credits
- 图片 RM0.10
- 视频 RM0.40
- 生成多少扣多少
- 不保证收入

布局：

- 左边解释 value stack
- 右边 price card
- price card 里不要信息过载
- credit 价格用两个小卡明确展示

CTA：

> 订阅 RM69 + 拿 10 credits

### 8.8 7-Day Path

目标：

- 让新手感觉“我知道买了以后怎么做”

结构：

1. Day 1：看 SOP，理解短视频带货打法
2. Day 2：选第一个产品
3. Day 3：生成第一批 hook/script/caption
4. Day 4：生成视频/图片素材
5. Day 5：发布并记录数据
6. Day 6：复盘有效角度
7. Day 7：复制有效角度，继续放大

设计：

- 用 timeline，不要再做普通卡片堆叠
- 每天只写一句动作

## 9. 文案系统

### 9.1 要持续强化的词

- AI 短视频营销平台
- 已经跑通的短视频带货打法
- 副业机会
- 执行量
- 批量测试
- 不用囤货
- 不用发货
- 不用做客服
- 不用露脸
- 多一个每月收入来源

### 9.2 要避免的词

- 实验
- 随便生成
- 保证赚钱
- 一键暴富
- 完全自动赚钱
- 无脑躺赚
- 只要订阅就能出单

### 9.3 风险提示标准文案

> Pokaya AI 不承诺收入。我们提供的是已经跑通的 AI 短视频营销平台和执行系统，结果取决于选品、账号、发布量、复盘和执行。

### 9.4 CTA 文案库

主 CTA：

- 立即加入 RM69 计划
- 订阅 RM69 + 拿 10 credits
- 开始 AI 短视频带货副业

辅助 CTA：

- 先看 AI 带货样例
- 看 RM69 包含什么
- 看新手 7 天路径

## 10. GEO 页面复用规则

每个 GEO 页面都复用同一设计系统，但改变页面主问题。

### 10.1 `/ai-short-video-marketing-platform`

主问题：

- What is an AI short video marketing platform?

首页模块复用：

- Hero
- System section
- Demo gallery
- Pricing
- FAQ

### 10.2 `/tiktok-shop-ai-video-generator`

主问题：

- How can TikTok Shop sellers generate product videos with AI?

重点模块：

- TikTok Shop product link / product info
- Product demo video examples
- Credit pricing

### 10.3 `/ai-tiktok-affiliate-video-generator`

主问题：

- How can TikTok affiliates create selling videos without filming?

重点模块：

- Affiliate side income
- No inventory / no fulfillment
- Hook/script/caption workflow

### 10.4 `/no-face-ai-product-video-generator`

主问题：

- How to create product videos without showing your face?

重点模块：

- No-face formats
- Product cover
- Voiceover / caption / visual angle

### 10.5 `/ai-product-promo-video-generator`

主问题：

- How to generate product promo videos for ads, TikTok, Reels, Shorts?

重点模块：

- Promo video types
- Product benefit angles
- Before/after and problem/solution formats

## 11. 移动端要求

移动端不是桌面缩小版。

要求：

- Hero 像短视频封面
- 所有 section padding 降低，但保留呼吸感
- 两列卡片全部改成单列
- 3 行 5 个 demo 在移动端改成横向 scroll 或 2 列网格
- Pricing card 不能太长，credit 价格要先露出
- Sticky CTA 可考虑在用户滚动过 hero 后出现

验收：

- iPhone 宽度下无文字溢出
- CTA 不被遮挡
- 卡片不出现高度极端不均
- 黑底对比区可读性保持

## 12. 技术范围

主要文件：

- `src/main.js`
- `src/styles.css`
- `public/` brand assets / demo thumbnails

建议新增：

- `homepageSections` 内容配置，减少散落在 JSX string 里的重复结构
- `GEO_PAGE_CONFIGS`，5 个 GEO 页面复用同一 section renderer
- 统一 CSS token：颜色、字体、半径、阴影、section spacing

不建议：

- 为了单个 section 继续追加大量互相覆盖的 CSS
- 每个 GEO 页面手写一套独立 HTML
- 使用过多不同渐变和阴影

## 13. 实施计划

### Phase 1：设计系统清理

- 整理 CSS token
- 统一 section spacing
- 统一标题、body、eyebrow 尺度
- 清理重复/冲突的 public homepage CSS override
- 保留现有品牌颜色，但减少杂色

验收：

- 首页所有 section 看起来属于同一套系统
- `npm run build` 通过
- 桌面和移动端截图无明显错位

### Phase 2：首页信息架构重排

- 合并重复 section
- 调整顺序为“机会 -> 速度 -> 系统 -> 样例 -> 对比 -> 定价 -> 路径 -> FAQ”
- 优化 CTA 文案和出现位置

验收：

- 用户滚动时每段都有新信息
- RM69 value stack 更清楚
- Demo 和 Manual vs AI 成为页面记忆点

### Phase 3：视觉资产升级

- Demo 卡换成更真实的视频/图片缩略图
- Hero 可考虑生成短循环视频或更强动态层
- GEO 页面复用同一视觉组件

验收：

- 页面不再像模板站
- AI 短视频营销平台的视觉感更强
- GEO 页面风格统一

## 14. 验收标准

### 14.1 桌面端

- 首屏 3 秒内看懂 RM69 + AI 短视频营销平台
- 页面有明确视觉记忆点：Hero、Demo、Manual vs AI、Pricing
- 所有 section 间距统一
- 字体层级统一
- CTA 颜色和位置稳定

### 14.2 移动端

- 无文字溢出
- 首屏 CTA 可见
- Demo 可浏览
- Pricing 清楚
- 黑底对比区不拥挤

### 14.3 内容

- 不出现“实验”
- 不承诺 guaranteed income
- RM69 与 credits 解释清楚
- 副业机会表达强于工具功能

### 14.4 技术

- `npm run build` 通过
- Lighthouse mobile 无严重可访问性问题
- 图片尺寸合理
- 动效支持 `prefers-reduced-motion`

## 15. 成功指标

建议上线后观察：

- Hero CTA click rate
- Demo section scroll reach
- Pricing section scroll reach
- Register modal open rate
- Register submit rate
- FAQ open rate
- GEO 页面进入首页/注册页的点击率

核心判断：

如果用户看完页面能说出“RM69 是进入一个 AI 短视频带货副业系统，不只是买工具”，这版设计就达成目标。
