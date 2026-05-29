# Pokaya Homepage Video Experience PRD

## 1. 背景

当前 Pokaya 首页是传统 SaaS landing page：左侧文案，右侧 hero card。用户想要的方向不是替换右侧图片，而是把整个首屏改成类似参考视频的动态展示方式：第一眼像一段正在播放的品牌宣传视频，主视觉占满整个画面，文案和 CTA 作为视频层上的 UI 信息出现。

目标不是做一个普通网页动效，而是做一个“视频化前端”：用户打开页面时，感觉 Pokaya 是一个面向 TikTok Shop seller 的内容生产引擎，画面有镜头感、流光、漂浮内容卡、AI 正在生成的状态。

## 2. 核心目标

1. 首页首屏从“双栏 SaaS hero”改为“全屏视频感场景”。
2. 主图作为整屏背景，而不是放在右侧卡片里。
3. 动态层覆盖整个 hero：镜头推进、光线扫过、卡片漂浮、生成状态、UI 粒子。
4. 保留转化重点：RM69、2 Video FREE、TikTok Shop seller、无需露脸、快速生成内容。
5. 移动端也要像短视频封面，不像压缩后的桌面网页。

## 3. 非目标

1. 这版不先接真实 AI 视频生成 API。
2. 不先重做 Studio / Login / Admin 页面。
3. 不做复杂 3D 或大型 WebGL 场景。
4. 不把参考视频原样当作最终背景，除非后续确认版权和品牌一致性。

## 4. 用户感受

用户打开首页后，第一屏应该像看到一段 Pokaya 的动态宣传片：

- 背景是完整的 seller 工作场景。
- 右侧浮动多个 TikTok/UGC 视频卡片。
- 画面有紫粉色流光和轻微镜头运动。
- Pokaya 的标题、CTA、价格、信任点浮在画面上。
- 整体更像“正在发生的内容生产系统”，不是静态模板。

## 5. 信息架构

### 5.1 首屏 Hero

首屏采用 full-bleed video scene：

- 背景层：Pokaya seller hero image/video，占满 hero。
- 暗色/紫粉渐变蒙层：保证文字可读。
- 左侧或中下方文案层：
  - Eyebrow：1,300+ Malaysia sellers
  - H1：Kompetitor dah post 10 video. Anda masih fikir hook pertama.
  - Body：Paste TikTok Shop product link...
  - CTA：Mula Sekarang - 2 Video FREE
  - Secondary CTA：Tengok Demo
- 右侧动态内容层：
  - 3-6 个 TikTok-style vertical cards
  - 每张卡片模拟不同内容结果：Hook, Avatar, Caption, Script, Posting Plan
  - 卡片带轻微浮动、发光边框、错位层级
- 底部信任条：
  - Built for Malaysia sellers
  - BM / 中文 / EN
  - Tak perlu tunjuk muka
  - Review dulu sebelum post

### 5.2 Hero 下方首个 section

首屏下方不应突然切成普通白底卡片。需要做一个过渡区：

- 从深紫视频场景自然过渡到浅色页面。
- 保留一个水平 proof strip：
  - Rating 4.9
  - 7 sellers generating now
  - 30-day guarantee
  - RM69/month

## 6. 视觉方向

### 6.1 色彩

主色保持 Pokaya 品牌：

- Deep purple / near black background
- Pink / coral CTA
- Lavender / magenta glow
- 少量 white glass UI

避免：

- 过重黑灰 SaaS dashboard 感
- 单调紫色糊成一片
- 太多卡片嵌套卡片

### 6.2 画面构图

桌面端：

- Hero 高度接近一屏：`min-height: calc(100vh - nav)`
- 背景图铺满整个 hero，不放在小框里。
- 文案区浮在左侧，宽度约 42%-48%。
- 动态卡片区分布在右侧和中右侧。
- 下方露出一点下一 section，避免首屏像死封面。

移动端：

- Hero 像竖版短视频封面。
- 背景图居中裁切，人物和手机卡片优先可见。
- H1 缩短行宽，CTA 固定在内容流中。
- 动态卡片减少到 2-3 个，避免遮住主体。

## 7. 动效要求

### 7.1 必须有

- Background camera breath：背景图 6-8 秒轻微 scale / translate 循环。
- Light sweep：紫粉光束从右往左或左往右扫过。
- Floating UGC cards：卡片上下轻微浮动，错开 delay。
- Card glow pulse：卡片边框或阴影轻微呼吸。
- Progress / generate state：一条 generation progress 或 “12 hooks ready” 状态循环。

### 7.2 可选增强

- Mouse parallax：桌面鼠标移动时卡片轻微跟随。
- Scroll transition：往下滚动时 hero 背景轻微淡出。
- Reduced motion：尊重 `prefers-reduced-motion`，关闭循环动画。

## 8. 资产策略

### 8.1 第一版

使用现有资产：

- `/public/pokaya-hero-seller-v2.jpg`

通过 CSS 动效让静态图变成视频感场景。

### 8.2 第二版

如果要更像参考视频，可以用中转 API 生成一段 3-5 秒循环视频：

Prompt 方向：

> A Malaysian TikTok Shop seller in a lavender studio, AI-generated UGC video cards floating around her, pink purple neon light trails, soft camera push-in, ecommerce boxes and beauty products on desk, clean premium social commerce campaign video, seamless loop, no text distortion, cinematic but bright.

输出要求：

- 16:9 desktop video
- 9:16 mobile crop 或单独移动端版本
- 3-5 秒
- 静音
- 可循环
- 文件压缩到 2-5MB 内

## 9. 技术实现

### 9.1 文件范围

主要改：

- `src/main.js`
- `src/styles.css`
- `public/` 里的 hero video/image asset

### 9.2 Hero Markup

新增结构建议：

- `.video-scene-hero`
- `.video-scene-bg`
- `.video-scene-overlay`
- `.hero-copy-layer`
- `.ugc-orbit`
- `.ugc-card`
- `.hero-proof-layer`

当前 `.public-hero` 可以重构，不建议继续沿用右侧 `.hero-board` 作为主结构。

### 9.3 CSS 实现

需要：

- full-bleed hero layout
- absolute background media
- responsive safe text area
- independent animated card layers
- dark overlay gradient for readability
- mobile-specific crop and card placement

### 9.4 性能

- 首屏图片使用现有 jpg，优先保证加载速度。
- 如果接视频，必须：
  - `autoplay muted loop playsinline`
  - `poster` fallback
  - 小体积 webm/mp4
  - 移动端可降级到图片 + CSS 动效

## 10. 验收标准

桌面端：

- 打开首页第一眼是整屏视频感场景，不再是左文案右小卡片。
- 主视觉铺满 hero 背景。
- H1、CTA、信任点清晰可读。
- 至少 3 个 UGC card 在画面里动态漂浮。
- 背景和光效在动，但不影响阅读。

移动端：

- 首屏像竖版短视频封面。
- 文字不溢出、不遮住关键人物脸部。
- CTA 在首屏内可见。
- 动态卡片不超过 3 个。

技术：

- `npm run build` 通过。
- Playwright 截图检查桌面和手机。
- 无明显 layout overlap。
- `prefers-reduced-motion` 下动画关闭。

## 11. 推荐实施顺序

1. 重构首页 hero DOM，从双栏改为 full-bleed scene。
2. 用现有 hero jpg 做全屏背景和移动端裁切。
3. 加文案 overlay、CTA、trust row。
4. 加 UGC floating cards 和 generation progress。
5. 加 light sweep、camera breath、card float 动效。
6. 做 mobile breakpoint。
7. Playwright 截图 QA。
8. 如果效果确认，再考虑调用中转 API 生成真实 loop video。

## 12. 决策

第一版先不调用中转 API。原因：

- 当前目标是前端整体展示方式大改。
- 用 CSS + 现有主图可以最快验证方向。
- API 生成视频适合作为第二阶段，用来替换背景层，而不是决定页面结构。

