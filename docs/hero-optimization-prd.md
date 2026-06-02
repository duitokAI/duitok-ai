# Pokaya AI Hero Optimization PRD

## 1. 背景

当前 Pokaya AI 首页已经具备基础卖点：TikTok Shop seller、10 videos/day 对比、RM69 价格、三语切换、Studio 入口。但与参考图相比，当前首屏更像一个干净的 SaaS landing page，参考图更像一个高压成交页：情绪更强、场景更具体、视觉冲突更明显、CTA 更有紧迫感。

本 PRD 目标是把首页首屏从“说明产品”升级为“让卖家立刻感到自己落后，并马上开始生成”。

## 2. 对比结论

### 2.1 参考图强在哪里

1. 情绪更强  
   参考图不是在解释功能，而是在制造痛点：竞争对手已经发了 10 条，你还在想。用户一眼能感到焦虑。

2. 画面更像真实使用场景  
   右侧有真人卖家、手机阵列、TikTok 视频画面，用户能马上理解“这是短视频内容生产工具”。

3. 视觉层次更狠  
   黑底、橙色重点词、巨大标题、发光手机，把注意力集中在“post 10 video”。

4. CTA 更具体  
   “Mula Sekarang - 2 Video FREE”比“Start creating”更像低门槛行动。

5. 信任信息更像成交组件  
   rating、7 seller generating now、money-back guarantee 都在 CTA 附近，减少犹豫。

### 2.2 当前版本弱在哪里

1. 视觉太白、太安全  
   当前页面清爽，但缺少压迫感和记忆点，不像卖家增长工具，更像普通 AI SaaS。

2. 右侧 hero board 信息太抽象  
   Logo + 对比条表达了意思，但不如真人 + 手机视频阵列直观。

3. 文案还不够本地化  
   “Competitor post 10 video”保留英文单词，BM 语境可以更自然、更有攻击性。

4. CTA 缺少即时利益  
   “Mula buat content”没有告诉用户点击后能得到什么。参考图里的“2 Video FREE”更强。

5. 首屏信任信息位置偏弱  
   当前 trust row 在底部，但参考图把社证明和保障压在 CTA 附近，成交感更强。

## 3. 产品目标

### 3.1 业务目标

- 提升首页首屏注册点击率。
- 提高 WhatsApp 咨询点击率。
- 让用户在 5 秒内理解：Pokaya AI 帮 TikTok Shop seller 批量生成 UGC/短视频内容。
- 让用户产生“我现在不做，会输给竞争对手”的紧迫感。

### 3.2 用户目标

目标用户进入首页后，应该马上知道：

- 我的问题：竞争对手内容量比我高。
- 这个工具做什么：放产品链接，生成 UGC/video/script/caption。
- 我为什么敢试：免费生成 2 条、有评分、有退款保障。
- 下一步做什么：点击开始生成，或 WhatsApp 问。

## 4. 首屏改版范围

### 4.1 Hero Layout

当前：左文案 + 右 logo 对比卡。  
建议：左文案 + 右“真人 seller + 手机视频阵列”沉浸式视觉。

要求：

- Desktop 首屏左右比例约 58:42。
- 左侧标题占据主要视觉重量。
- 右侧视觉需要真实表达 TikTok/UGC/video，而不是只放 logo。
- Mobile 下右侧视觉下移，标题和 CTA 仍优先展示。

### 4.2 Background

当前：浅色粉白背景。  
建议：首屏改为深色高对比版本，后续 section 仍可保持浅色。

要求：

- Hero 使用黑/深紫底。
- 加微弱 grid texture 或 noise texture。
- 重点词使用 coral/orange/pink 高亮。
- 不使用大面积单一紫色渐变。

### 4.3 Headline

BM 主文案建议：

```text
Kompetitor dah
post 10 video.
Anda baru fikir.
```

中文：

```text
竞争对手已经
发了 10 条视频。
你还在想。
```

英文：

```text
Your competitor
posted 10 videos.
You are still thinking.
```

要求：

- 三语都必须保留“落后感”。
- `post 10 video / 发了 10 条视频 / posted 10 videos`必须高亮。
- 避免太温和的 SaaS 语气。

### 4.4 Subheadline

BM 建议：

```text
Pokaya AI catch up dalam 3 minit. Letak link produk TikTok Shop - AI hasilkan skrip UGC, avatar image, caption, dan idea posting. Tanpa shoot, tanpa hire creator.
```

中文建议：

```text
Pokaya AI 让你 3 分钟追上内容节奏。放入 TikTok Shop 产品链接，AI 生成 UGC 脚本、头像素材、caption 和发布想法。不用拍摄，不用请 creator。
```

英文建议：

```text
Pokaya AI helps you catch up in 3 minutes. Paste a TikTok Shop product link and generate UGC scripts, avatar images, captions, and posting ideas. No shoot, no creator hiring.
```

### 4.5 CTA

Primary CTA：

- BM：`Mula Sekarang - 2 Video FREE`
- 中文：`现在开始 - 免费生成 2 条`
- EN：`Start Now - 2 Videos FREE`

Secondary CTA：

- BM：`Tengok 20 demo`
- 中文：`查看 20 个 demo`
- EN：`View 20 demos`

要求：

- Primary CTA 使用黄色或 coral 高亮。
- Secondary CTA 为深色 glass button。
- CTA 下方显示 trust row。

### 4.6 Trust Row

内容：

- `4.9 rating`
- `7 seller generate video sekarang`
- `30-day money-back`

中文：

- `4.9 评分`
- `7 个卖家正在生成`
- `30 天退款保障`

要求：

- 靠近 CTA。
- 搭配头像组/星级/红点/盾牌图标。
- 不要放得太远，避免用户看不到。

### 4.7 Right Visual

最低可交付版本：

- 使用生成图或合成图：焦虑的本地 seller + 多个 TikTok 手机视频卡。
- 加两个对比标签：
  - `Anda: 1 video / hari`
  - `Kompetitor: 10 video / hari`
- 加底部状态 badge：`Pokaya AI catch up`

理想版本：

- 生成一张品牌一致的 hero bitmap。
- 手机屏幕内显示 UGC creator / 产品 demo。
- 人物必须是 Malaysia seller 语境，不要像欧美 stock photo。

## 5. 三语要求

### 5.1 语言覆盖

Hero 首屏所有文字必须支持：

- BM
- 中文
- EN

包括：

- Promo bar
- Nav label
- Headline
- Subheadline
- CTA
- Trust row
- Right visual labels
- Badge

### 5.2 语言交互

当前语言选择器符合方向：胶囊按钮 + 下拉三选项。

优化要求：

- 下拉菜单不能被 nav 或 hero 元素遮挡。
- 选择语言后菜单关闭。
- 当前语言高亮。
- Mobile 下点击区域不小于 44px。

## 6. 设计规格

### 6.1 Desktop

- 首屏最小高度：`calc(100vh - nav height)`。
- Hero max width：`1180px - 1280px`。
- H1 字号：`clamp(56px, 7vw, 104px)`。
- H1 行高：`0.92 - 0.98`。
- 高亮词颜色：coral/orange。
- CTA 高度：`56px - 64px`。
- Hero visual 圆角：`28px - 36px`。

### 6.2 Mobile

- H1 不超过 4 行。
- Right visual 可以折叠为单张 hero image。
- Nav 保留 logo、语言、login；其他链接收进菜单或隐藏。
- CTA 两个按钮可以上下排列。

## 7. 功能需求

### 7.1 FR-001 Hero 文案替换

替换当前 hero headline/subheadline/CTA/trust row，并接入三语字典。

验收：

- BM / 中文 / EN 切换后 hero 全部对应变化。
- 不出现混杂旧文案。

### 7.2 FR-002 Hero 视觉替换

将当前 logo board 替换为真人 seller + 手机短视频阵列 hero visual。

验收：

- 一眼能看出“短视频/UGC/TikTok Shop”。
- 不只是 logo 或抽象进度条。

### 7.3 FR-003 首屏深色版本

将首页首屏改为高对比深色成交页风格。

验收：

- 背景、标题、CTA、右侧 visual 有强对比。
- 下方 section 可以继续使用浅色品牌风格。

### 7.4 FR-004 CTA 低门槛利益

Primary CTA 加入“2 Video FREE”。

验收：

- BM / 中文 / EN 均有免费生成利益点。
- 点击仍进入注册/登录流程。

### 7.5 FR-005 Demo 入口

Secondary CTA 指向 demo section。

验收：

- 点击 `Tengok 20 demo` 滚动到 demo section。
- 若 demo section 暂未有 20 个，也必须至少展示 6 个 demo placeholder。

## 8. 非功能需求

- 首屏 LCP 图片需要压缩，目标小于 350KB。
- Hero image 必须有明确尺寸，避免 CLS。
- Mobile 不允许文字和按钮重叠。
- 三语文案不允许撑爆按钮。
- Build 必须通过：`npm run build`。

## 9. 优先级

### P0

- Hero headline 改强。
- CTA 改成免费利益点。
- Trust row 靠近 CTA。
- 三语同步。

### P1

- 右侧 hero visual 换成真人 + 手机阵列。
- 深色 hero 背景。
- Secondary demo CTA。

### P2

- 生成 20 个 demo 卡片。
- 加动画/hover micro interaction。
- A/B test 深色版 vs 浅色版。

## 10. 建议迭代顺序

1. 先改文案和 CTA。
2. 再改 hero 深色布局。
3. 生成或制作右侧 hero image。
4. 补 demo section。
5. 做 mobile QA。
6. 推 GitHub，让 Render 自动部署。

## 11. 一句话判断

当前版本“好看但不够狠”；参考图“没那么干净，但更会卖”。下一版 Pokaya AI 首页要保留品牌精致感，同时把首屏改成能让 seller 产生紧迫感的成交页。
