# Pokaya 全站 Typography 统一 PRD

## 1. 背景

当前 Pokaya 网站与 Studio 后台存在大量分散的 `font-size`、`line-height`、`font-weight` 和局部 `font-family` 覆盖。不同页面在视觉密度、标题重量、按钮文字、卡片标题、金额数字等区域表现不一致，导致页面之间切换时有明显的“不是同一个产品”的感觉。

用户提供的新 typography 规范需要成为全站字体系统的统一基准，覆盖 public website、登录/注册页、Studio 工作台、Image/Video/Audio/Clone Prompt/Storytelling 页面、弹窗、账单、结果详情、Agent 页面和移动端布局。

## 2. 目标

1. 全站统一字体栈：
   `Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif`
2. 全站统一字号、行高、字重 token，减少页面级随意覆盖。
3. 保持 Studio 工作台的高密度可扫读体验，不把内部工具页面改成 landing page 风格。
4. 金额、credit、用量、账单数字使用等宽数字或 tabular nums，减少金额跳动。
5. 中文、英文、马来文、多语言混排都保持稳定可读。

## 3. 非目标

1. 本 PRD 不改变品牌色、布局、组件结构、路由或交互逻辑。
2. 不引入新的 UI framework、Tailwind、字体加载服务或设计系统库。
3. 不把所有 hero 大标题硬压到 32px。已有营销 hero 如果依赖更大的展示字号，需要通过“Display+”例外 token 审核。
4. 不一次性重写所有 CSS 文件。执行应以 token 化和高风险页面逐步迁移为主。

## 4. Typography 规范

### 4.1 字体栈

全站默认字体：

```css
font-family: Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif;
```

说明：

- `Inter` 作为英文和数字主字体。
- `PingFang SC` 覆盖 macOS / iOS 中文。
- `Microsoft YaHei` 覆盖 Windows 中文。
- `Noto Sans` 覆盖更多脚本和 fallback。
- 不再使用页面级自定义字体栈覆盖，除非是 logo、品牌图形字、代码块或金额数字。

### 4.2 Type Scale

| Level | Size / Line height | Weight | Usage |
| --- | --- | --- | --- |
| Display | 32px / 40px | 700 | Landing page hero titles |
| H1 | 24px / 32px | 700 | Page titles |
| H2 | 20px / 28px | 600 | Section titles |
| H3 | 16px / 24px | 600 | Card titles |
| Body | 14px / 22px | 400 | Body text desktop default |
| Body-lg | 16px / 24px | 400 | Mobile body text / important readable body |
| Caption | 12px / 18px | 400 | Helper text, timestamps, metadata |
| Amount | 20-28px / normal | 700, tabular nums | Money amounts, credits, billing numbers |

### 4.3 CSS Token 建议

```css
:root {
  --font-sans: Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif;

  --text-display-size: 32px;
  --text-display-line: 40px;
  --text-display-weight: 700;

  --text-h1-size: 24px;
  --text-h1-line: 32px;
  --text-h1-weight: 700;

  --text-h2-size: 20px;
  --text-h2-line: 28px;
  --text-h2-weight: 600;

  --text-h3-size: 16px;
  --text-h3-line: 24px;
  --text-h3-weight: 600;

  --text-body-size: 14px;
  --text-body-line: 22px;
  --text-body-weight: 400;

  --text-body-lg-size: 16px;
  --text-body-lg-line: 24px;
  --text-body-lg-weight: 400;

  --text-caption-size: 12px;
  --text-caption-line: 18px;
  --text-caption-weight: 400;

  --text-amount-min: 20px;
  --text-amount-max: 28px;
  --text-amount-weight: 700;
}
```

金额数字建议：

```css
.amount,
.credit-value,
.billing-amount {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

## 5. 适用范围

### 5.1 必须覆盖

- Public landing / marketing pages
- Login / register / onboarding
- Studio shell、sidebar、top tabs
- Image page composer、media wall、result card、detail modal
- Video page composer、duration slider、media wall、result card
- Audio page composer、audio card、control row
- Original Video / Clone Prompt / Storytelling
- Agent chat、thread list、messages、tool cards
- Settings、Billing、Top-up、Usage modal
- Toast、tooltip、dropdown、popover、loading、failed states
- Mobile / narrow viewport variants

### 5.2 允许例外

- Logo 或品牌图形字。
- 代码块、API key、job id：可以用 monospace。
- 金额和 credit：可使用 tabular nums / monospace digits，但不能改变整体字体系统。
- 媒体墙失败卡片、极窄卡片：可使用 container-based clamp，但不得低于可读性底线。
- Landing hero 如果设计上确实需要超过 32px，必须定义为 `Display+` 例外，并记录原因。

## 6. 迁移策略

### Phase 1：建立 Token 和全局字体栈

1. 在全局 CSS 根层建立 `--font-sans` 和 text scale tokens。
2. `body`、button、input、textarea、select 统一使用 `var(--font-sans)`。
3. 清理明显重复或过时的 `font-family: Inter, ui-sans-serif...` 覆盖。
4. 不改布局，只让字体来源先统一。

### Phase 2：Studio 核心页面迁移

优先迁移用户高频页面：

1. Image page
2. Video page
3. Audio page
4. Clone Prompt / Original Video / Storytelling
5. Settings / Billing / Usage modal

每个页面按以下映射：

- 页面标题：H1
- 分区标题：H2
- 卡片标题 / dropdown 当前值：H3
- 输入框、正文、按钮正文：Body
- helper、timestamp、metadata：Caption
- credits、金额、数量：Amount

### Phase 3：Public website 和营销页迁移

1. Hero title 默认 Display。
2. Section title 使用 H2。
3. Card title 使用 H3。
4. 正文使用 Body 或 Body-lg。
5. 只保留必要的视觉例外，不允许每个 section 自己定义一套字号。

### Phase 4：去重和回归

1. 用 `rg "font-size|line-height|font-weight|font-family"` 审计剩余硬编码。
2. 将重复样式收敛到 token 或组件级 class。
3. 对移动端、长英文、中文、多语言混排做截图回归。

## 7. 设计验收标准

1. 全站默认 `font-family` 为指定字体栈。
2. 页面标题、section title、card title、正文、caption 的字号/行高/字重符合 type scale。
3. 金额、credit、账单数字在数值变化时不明显横向跳动。
4. Image、Video、Audio、Clone Prompt 页面之间切换时，文字密度和视觉重量一致。
5. 中文、英文、马来文混排不出现裁切、重叠、按钮文字溢出。
6. Studio 工具栏、dropdown、composer、result card 在 hover、disabled、loading、failed 状态下不因字体变化跳动。
7. 移动端正文不小于 14px；长标题可换行但不能覆盖后续内容。

## 8. 技术验收标准

1. `npm run build` 通过。
2. 全局 CSS 中存在并使用 `--font-sans` 与 typography tokens。
3. `body, button, input, textarea, select` 继承统一字体栈。
4. 新增样式不得引入新的外部字体请求，除非后续明确决定自托管 Inter。
5. 不得新增新的页面级字体栈。
6. 金额相关 class 使用 `font-variant-numeric: tabular-nums` 或等效设置。
7. 关键页面截图回归覆盖 desktop 和 mobile。

## 9. 风险与注意事项

1. 当前 `src/styles.css` 存在大量历史硬编码，直接全局覆盖可能导致按钮、卡片、媒体墙文字溢出。
2. `font-weight` 从大量 800/900 收敛到 600/700 后，部分按钮和标题会显得更轻，需要局部检查视觉层级。
3. Landing hero 现有大字号如果直接压到 32px，可能影响营销冲击力，因此需要 `Display+` 例外机制。
4. 中文字体 fallback 会影响实际字宽，必须检查顶部导航、sidebar、composer 按钮、dropdown label。
5. Amount 的等宽数字要只影响金额/credit，不应污染普通正文。

## 10. 建议执行顺序

1. 新建 typography tokens。
2. 统一全局 font stack。
3. 迁移 Studio shell、sidebar、top tabs。
4. 迁移 Image/Video/Audio composer 与 media wall。
5. 迁移 settings/billing/usage。
6. 迁移 public website。
7. 做一次全站 `font-size` 审计，把不符合 token 的地方列成 follow-up。

## 11. 交付物

1. `src/styles.css` 中的全局 typography token。
2. 统一后的全站字体栈。
3. 核心页面 typography 回归截图。
4. 剩余 hardcoded typography 清单。
5. 如有必要，补充 `DESIGN.md` 的 Typography 章节，把本 PRD 中的字体规范设为新的项目基准。

