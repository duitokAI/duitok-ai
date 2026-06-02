# Pokaya AI DESIGN.md

本文档定义 Pokaya AI 的前端设计系统。以后任何 landing page、studio、agent、asset library、pricing、affiliate 或 onboarding 页面改版，都必须先读这个文件。

## 1. 设计定位

Pokaya AI 不是泛 AI 工具站，也不是“AI 赚钱广告页”。

Pokaya AI 是给 TikTok Affiliate、小卖家和内容创作者的 AI 内容工作台。它帮助用户把一个产品变成可以发布的内容素材、口播脚本、短视频方向、推广文案和可复用资产。

核心感觉：

- 清楚，比炫更重要。
- 像工具，不像活动页。
- 像 AI operator，不像普通 chatbot。
- 有副业入口的行动感，但不能有暴富感。
- 有品牌个性，但不能变成粉紫装饰模板。

推荐设计气质：

- Linear 的克制、产品证据和层级。
- Shopify 的卖家语境和 commerce clarity。
- Intercom 的友好、可读和 conversational product feel。
- Claude 的 AI 信任感，但不要复制它的 serif/cream 体系。

## 2. 品牌叙事

主叙事：

> 把任何产品，变成可以发布的 TikTok 内容。

中文主卖点：

> 给 TikTok Affiliate 的 AI 内容工具。

辅助叙事：

> RM79.80/月，给自己一个开始 AI 副业的入口。

禁止叙事：

- 保证赚钱
- 躺赚
- 自动赚钱
- 稳赚
- 一键暴富
- 不用执行也能变现

正确表达：

- 降低开始门槛
- 更快生成内容素材
- 更快开始发布和测试
- 用 AI 辅助内容生产
- 结果取决于选品、发布、测试和执行

## 3. 色彩系统

Pokaya 可以保留深紫和粉色，但必须克制。粉紫只能作为品牌信号和行动点，不能铺满页面。

### Core

- `--pokaya-plum-950`: `#22002d`
- `--pokaya-plum-900`: `#30003e`
- `--pokaya-plum-800`: `#4b005e`
- `--pokaya-pink-600`: `#ff315f`
- `--pokaya-coral-500`: `#ff765d`
- `--pokaya-yellow-400`: `#ffd21a`

### Neutral

- `--pokaya-canvas`: `#fffafc`
- `--pokaya-canvas-soft`: `#f8f0ff`
- `--pokaya-surface`: `#ffffff`
- `--pokaya-surface-tint`: `#fff3f8`
- `--pokaya-ink`: `#2a1033`
- `--pokaya-muted`: `#68506e`
- `--pokaya-subtle`: `#8a758f`
- `--pokaya-line`: `rgba(75, 0, 94, 0.12)`

### Dark Product Surface

- `--pokaya-dark`: `#1f0029`
- `--pokaya-dark-2`: `#30003e`
- `--pokaya-dark-line`: `rgba(255, 255, 255, 0.12)`
- `--pokaya-dark-muted`: `rgba(255, 255, 255, 0.68)`

### Usage Rules

- Primary CTA uses pink-to-coral or solid plum. Do not use yellow as the main CTA except for very specific promo badges.
- Large backgrounds should be white, soft blush, or controlled dark product panels.
- Do not use full-page pink/purple mesh gradients.
- Do not use decorative bokeh/orbs.
- Do not put many different accent colors in one page.
- Green is reserved for status like `READY`, not marketing decoration.

## 4. Typography

Pokaya should use a strong sans-serif system. Avoid default-looking Inter-only pages when possible, but keep fallback safe.

Recommended stack:

```css
font-family: "Satoshi", "Outfit", "Geist", Inter, ui-sans-serif, system-ui, sans-serif;
```

If no custom font is installed, use system sans with heavier hierarchy.

### Scale

- Display XL: `clamp(48px, 6vw, 84px)`, weight `850-950`, line-height `0.96-1.05`
- Display LG: `clamp(38px, 4.5vw, 64px)`, weight `850-950`, line-height `1.02`
- Section H2: `clamp(32px, 3.6vw, 52px)`, weight `850-950`, line-height `1.08`
- Card title: `20-28px`, weight `800-950`, line-height `1.15`
- Body: `16-18px`, weight `500-700`, line-height `1.5-1.65`
- Caption: `12-14px`, weight `700-850`, line-height `1.35`
- Button: `15-17px`, weight `850-950`

### Rules

- 中文标题不要负字距。
- 中文段落必须短，一段最多 2-3 行。
- 不要在 compact card 里使用 hero 级大字。
- 英文 UI label 可以保留，例如 `READY`, `Prompt`, `Asset`, `Credit`。
- 小标签可以 uppercase，但不要全站都是 uppercase。

## 5. Layout Principles

### Landing Page

首屏必须同时出现：

- 明确人群：TikTok Affiliate / seller / content creator
- 明确结果：product -> content asset
- 明确 CTA：开始使用 Pokaya AI
- 产品证据：真实 UI、agent mockup、asset card 或 output preview

首屏禁止：

- 只有背景美女图，没有产品 UI。
- CTA 被挤到首屏下方。
- 大促销条抢走主标题注意力。
- 大面积粉紫渐变导致廉价感。
- Logo 区过高，把内容往下推。

推荐首屏结构：

```text
Promo bar: low-height, restrained
Nav: logo + 3-4 links + login + language
Hero:
  Left: eyebrow / H1 / copy / CTA / trust chips
  Right: Pokaya Agent or product-output mockup
Next section preview: visible below fold
```

### Studio

Studio 是工作台，不是 landing page。

- 信息密度可以更高。
- 左侧导航保持稳定。
- Agent、Affiliate、Asset Library 属于重要功能，可以有更强视觉权重。
- 表单和生成器要优先可扫读，不要过度装饰。
- 卡片不能卡片套卡片。

### Asset Library

资产库必须像生产资料库，不像普通 result list。

每个 asset card 至少支持：

- 预览图片/视频
- 类型
- prompt
- model
- cost
- product/project
- 下载
- 复制 prompt
- 保存 avatar / 保存产品图
- 加入排期
- 继续生成变体
- 删除

## 6. Component Rules

### Buttons

Primary:

- Background: pink-to-coral or plum
- Text: white
- Radius: `10-14px`
- Height: `48-56px`
- Hover: slight lift or darker shade
- Active: `scale(0.98)` or `translateY(1px)`

Secondary:

- White or transparent
- Plum text
- Thin border
- No heavy shadow

Icon buttons:

- Use existing icon library or mascot only where meaningful.
- Do not hand-draw icons.
- Do not use mascot as generic icon everywhere.

### Cards

Landing cards:

- Radius `12-18px`
- Border `1px solid var(--pokaya-line)`
- Shadow subtle, tinted purple
- No nested cards unless it is a real framed product mockup

Studio cards:

- Radius `10-16px`
- Clear labels and grouped controls
- More compact than landing cards

Product mockups:

- Can use dark plum surface to create contrast.
- Must look like an actual working UI, not decorative blocks.

### Badges

Use badges for status and cost:

- `READY`: green dot, short text
- Cost: `20 sen`, `RM0.40`, `0.15 Credit`
- Plan: `Pro`, `Launch offer`

Badges should be compact. No huge pill badges floating randomly.

## 7. Pokaya Agent Rules

Pokaya Agent 是核心卖点之一。

视觉身份：

- It is an operator, not a mascot decoration.
- Can appear in hero, sidebar, agent page, and assistant window.
- Should be paired with actual work: understanding product, generating assets, asking confirmation, preparing schedule.

Agent UI must show:

- Input or attachment
- Agent reasoning/action summary
- Generated output cards
- Cost confirmation before paid generation
- Clear next action

Agent UI must not:

- Auto-jump users to random pages without explanation
- Trigger paid model calls without confirmation
- Use hidden “free design skill” generation
- Look like a generic chatbot with no product context

## 8. Mascot Usage

Mascot is brand identity, not decoration.

Use mascot:

- Logo lockup
- Pokaya Agent card
- Empty state
- Onboarding guide
- Friendly confirmation moment

Do not use mascot:

- As every icon
- Inside every card
- As tiny repeated decoration
- In serious data tables unless it communicates state

Mascot should never be cropped accidentally.

## 9. Motion

Motion should feel useful and restrained.

Allowed:

- Buttons lift slightly on hover
- Cards reveal extra actions on hover
- Agent panel subtle pulse when ready/working
- Generated assets stagger in
- Loading skeleton matching card layout

Avoid:

- Infinite decorative animation
- Floating orbs
- Heavy parallax
- Motion that delays action

## 10. Responsive Rules

Mobile priority order:

1. H1
2. CTA
3. Product/Agent evidence
4. Trust/cost
5. Details

Rules:

- No text overflow.
- No horizontal scroll.
- Hero content must not require 3 screens before CTA.
- Product mockup can collapse below copy.
- Asset cards become one column.
- Touch targets minimum `44px`.

## 11. Page-Specific Direction

### Homepage

Goal: convert new users.

Must show:

- TikTok Affiliate AI content positioning
- Product-to-content workflow
- Pokaya Agent
- Real output gallery
- Pricing and credit transparency
- FAQ and no-income-guarantee statement

Recommended order:

1. Hero
2. Problem
3. Workflow
4. Agent
5. Output gallery
6. Tools
7. Manual vs Pokaya
8. Pricing
9. FAQ
10. Final CTA

### Pricing

Pricing must clarify:

- RM79.80/month unlocks Pro platform/tools
- Credits are used for generation
- Show cost before generation
- No income guarantee

### Agent Page

Agent page should feel like a command center:

- Chat/input panel
- Project context
- Attachments
- Suggested next actions
- Generated results
- Cost confirmation modal

### Auto Content Page

Auto Content should feel operational, not decorative:

- Product selector
- Persona / style / age
- Provider
- Framework chips
- Quantity/cost
- Process log
- Output history

## 12. Visual Anti-Patterns

Never ship:

- Full-screen pink/purple AI gradient with no product evidence
- Giant logo/header that pushes content down
- Generic three-card feature row as the main product explanation
- All-white cards floating inside more cards
- Mascot repeated everywhere
- Placeholder demo blocks with no prompt/model/cost/product context
- Overly large rounded blobs
- Text inside cards overflowing or being clipped
- Pricing that hides credit cost
- “AI赚钱” copy without compliance context

## 13. Acceptance Checklist

Before shipping frontend changes:

- Can a new user understand the page in 5 seconds?
- Is the main CTA visible in the first viewport on desktop and mobile?
- Is there real product evidence, not just marketing copy?
- Does the page explain product -> content -> publish/test?
- Are pricing and credit costs transparent?
- Is the page using Pokaya brand, not copying reference brands?
- Are mobile layouts free from overflow and cropped text?
- Did we avoid generic AI template styling?
- Did we run build and visual QA?
