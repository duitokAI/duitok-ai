# Pokaya 全局色系与字体刷新 PRD

Last updated: 2026-06-05

## 1. 背景

当前 Pokaya 的设计系统已经建立了紫色、粉色、珊瑚色和柔和白底的品牌方向，但不同页面在视觉执行上仍有几个问题：

- 紫色、粉色、珊瑚色的使用不够统一，容易出现“粉紫模板感”。
- Landing、Studio、Agent、Billing、Settings 等页面的色彩 token 与实际 CSS 使用可能存在漂移。
- 现有字体方向偏品牌化展示，适合 landing，但在工具型工作台里可能不够规格化。
- 用户提供的新参考图明确要求将 Pokaya 全站切换到新的 **Purple to Orange Mix** 色系，以及截图中的字体层级和 font stack。

本 PRD 定义一次全局视觉 refresh：不改变产品功能和页面架构，只统一色彩、渐变、字体、字号、字重和落地检查标准。

执行范围更新（2026-06-05）：本轮先只执行用户后台，也就是登录后的 Pokaya Studio / sidebar / tool tabs / media wall / composer / settings / billing 等工作台区域；公开前台 landing、login/register、affiliate 页面和 Auto Post 扩展暂不改，后续再作为单独阶段处理。

## 2. 目标

### 2.1 产品目标

- 让 Pokaya 在所有主要页面形成统一、可识别的紫橙品牌视觉。
- 保留 Pokaya “AI 内容工作台”的工具感，不把 Studio 做成营销页。
- 提高界面可读性、层级稳定性和跨语言显示一致性。
- 让用户在云端部署版本看到一致的品牌刷新结果。

### 2.2 设计目标

- 主色从原来的 soft purple / coral 体系收敛到用户指定的 5 色品牌梯度。
- 字体系统切换为更清晰、稳定、跨中英文和 Malay 都可靠的 sans-serif stack。
- 标题、正文、caption、金额等文字层级全站统一。
- CTA、状态、边框、卡片、hover、选中态等组件状态基于新 token 重新映射。

### 2.3 技术目标

- 通过 CSS variables / design tokens 做全局替换，避免散落硬编码。
- 尽量不改 DOM 结构、不引入新 UI kit、不迁移前端框架。
- 保持现有交互、数据流、支付、生成、登录、Agent 会话等功能不受影响。
- 完成后运行 build，并对关键页面做桌面与移动端视觉检查。

## 3. 非目标

本次不包含：

- 重做信息架构。
- 重写 Studio / Agent / Billing 的功能逻辑。
- 新增动画库、UI 框架或路由架构。
- 重新设计 logo、mascot 或品牌插画资产。
- 修改 pricing、credits、provider、payment、TikTok OAuth 业务逻辑。
- 把所有页面改成大面积渐变背景。

## 4. 参考输入

### 4.1 色彩参考

用户提供的主视觉为 **Purple to Orange Mix**，包含以下色值：

| 色值 | 建议 token | 角色 |
|---|---|---|
| `#210024` | `--pokaya-plum-950` | 最深品牌紫、主文字、暗色背景 |
| `#32103A` | `--pokaya-plum-900` | 深紫表面、导航、深色卡片 |
| `#8B1A78` | `--pokaya-magenta-700` | 品牌中段紫、图标、强调文字 |
| `#C12B62` | `--pokaya-rose-600` | 主行动色、选中态、进度状态 |
| `#FF6738` | `--pokaya-orange-500` | CTA 渐变终点、成功生成后的行动强调 |

参考图背景接近暖白/奶白，不建议用纯灰冷底。建议新增：

| 色值 | 建议 token | 角色 |
|---|---|---|
| `#FBF6EC` | `--pokaya-canvas` | 全局页面背景 |
| `#FFF9F0` | `--pokaya-surface-warm` | 温暖白色卡片/面板 |
| `#F3E7DC` | `--pokaya-line-warm` | 暖色边框/分割线 |
| `rgba(33, 0, 36, 0.68)` | `--pokaya-muted` | 次级正文 |
| `rgba(33, 0, 36, 0.42)` | `--pokaya-subtle` | 辅助说明、placeholder |

### 4.2 字体参考

用户提供的 typography 参考要求如下：

| Level | Size / Line height | Weight | Usage |
|---|---:|---:|---|
| Display | `32px / 40px` | `700` | Landing page hero titles |
| H1 | `24px / 32px` | `700` | Page titles |
| H2 | `20px / 28px` | `600` | Section titles |
| H3 | `16px / 24px` | `600` | Card titles |
| Body | `14px / 22px` | `400` | Desktop default body text |
| Body-lg | `16px / 24px` | `400` | Mobile body text |
| Caption | `12px / 18px` | `400` | Helper text, timestamps |
| Amount | `20-28px / normal` | `700`, tabular nums | Money amounts, credits, usage numbers |

全局 font stack：

```css
font-family: Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif;
```

金额、credits、usage、计数器等数字应开启：

```css
font-variant-numeric: tabular-nums;
```

## 5. 设计原则

### 5.1 紫橙是品牌信号，不是背景噪音

- 渐变主要用于 primary CTA、品牌标识、关键状态、少量 hero/empty state 强调。
- Studio 主工作区仍以暖白、白色 surface、清晰边框为主。
- 不允许全页大面积铺满紫橙渐变，避免影响生产工具的可扫读性。

### 5.2 深紫负责信任，橙红负责行动

- `#210024` 和 `#32103A` 用于主文字、导航、深色品牌区域。
- `#C12B62` 用于选中态、主按钮、可操作强调。
- `#FF6738` 用于 CTA 渐变终点、生成完成后的 next action、少量能量感点缀。

### 5.3 字体层级要更产品化

- 全站默认正文从大号品牌感改为 `14px / 22px`。
- Studio、Settings、Billing、表格、弹窗优先采用紧凑但可读的工具型层级。
- Landing 可以保留更强视觉，但 Display 上限以本 PRD 为准，避免超大标题压缩首屏产品证据。

### 5.4 多语言安全

- 英文、中文、Malay 都必须在同一 font stack 下稳定显示。
- 中文不使用负字距。
- 按钮、tab、card title 不得因为长英文或 Malay 文案溢出容器。

## 6. Token 迁移方案

### 6.1 Core Tokens

建议在全局 CSS token 层统一替换为：

```css
:root {
  --pokaya-plum-950: #210024;
  --pokaya-plum-900: #32103A;
  --pokaya-magenta-700: #8B1A78;
  --pokaya-rose-600: #C12B62;
  --pokaya-orange-500: #FF6738;

  --pokaya-canvas: #FBF6EC;
  --pokaya-surface: #FFFFFF;
  --pokaya-surface-warm: #FFF9F0;
  --pokaya-line: rgba(33, 0, 36, 0.12);
  --pokaya-line-strong: rgba(33, 0, 36, 0.2);
  --pokaya-ink: #210024;
  --pokaya-muted: rgba(33, 0, 36, 0.68);
  --pokaya-subtle: rgba(33, 0, 36, 0.42);

  --pokaya-gradient-primary: linear-gradient(90deg, #210024 0%, #8B1A78 48%, #C12B62 72%, #FF6738 100%);
  --pokaya-gradient-action: linear-gradient(135deg, #C12B62 0%, #FF6738 100%);
}
```

### 6.2 旧 token 映射

| 旧 token / 用法 | 新映射 |
|---|---|
| `--pokaya-plum-950` | `#210024` |
| `--pokaya-plum-900` | `#32103A` |
| `--pokaya-plum-800` | `#8B1A78` 或仅保留为 alias |
| `--pokaya-pink-600` | `#C12B62` |
| `--pokaya-coral-500` | `#FF6738` |
| `--pokaya-canvas` | `#FBF6EC` |
| `--pokaya-surface-tint` | `#FFF9F0` |
| 黄色营销 accent | 降级为极少量 warning / promo，不再作为品牌主 accent |

## 7. Typography 迁移方案

### 7.1 全局字体

`body`、按钮、表单、弹窗、sidebar、Studio、Agent、Billing 全部使用：

```css
font-family: Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif;
```

如项目当前加载了 Satoshi、Outfit、Geist 或其他展示字体，本次应从全局默认里移除；除非某个 logo/品牌资产是图片或专门 wordmark，不再作为 UI font 使用。

### 7.2 字级 token

```css
:root {
  --text-display-size: 32px;
  --text-display-line: 40px;
  --text-h1-size: 24px;
  --text-h1-line: 32px;
  --text-h2-size: 20px;
  --text-h2-line: 28px;
  --text-h3-size: 16px;
  --text-h3-line: 24px;
  --text-body-size: 14px;
  --text-body-line: 22px;
  --text-body-lg-size: 16px;
  --text-body-lg-line: 24px;
  --text-caption-size: 12px;
  --text-caption-line: 18px;
}
```

### 7.3 典型映射

| 页面区域 | 标题 | 正文 | 备注 |
|---|---|---|---|
| Landing hero | Display | Body-lg | 不再使用 48px 以上超大标题作为默认 |
| Studio 页面标题 | H1 | Body | 保持工作台密度 |
| Sidebar | H3 / Caption | Caption | 当前选中态用 rose/orange accent |
| Agent 消息 | H3 | Body | 长文案优先可读，不加大字号 |
| Result card | H3 | Caption / Body | cost、model、time 使用 tabular nums |
| Billing / Usage | H1 / Amount | Body | 金额、credits、usage 必须 tabular nums |
| Modal | H2 | Body | 弹窗标题不使用 Display |

## 8. 页面范围

### 8.1 必须覆盖

- Landing / homepage
- Login / register
- Studio shell
- Sidebar / navigation
- Prompt composer
- Image / video result wall
- Result detail lightbox
- Agent page / Agent messages
- Settings modal
- Billing / top-up / usage
- SOP center
- Auto Post 相关页面或扩展下载页面
- Admin / dashboard 中用户可见的品牌色与数字层级

### 8.2 可后置覆盖

- 历史 PRD 截图。
- 开发 README 截图。
- 不影响用户的内部脚本输出。
- 已生成的历史媒体内容。

## 9. 组件落地要求

### 9.1 Buttons

- Primary button：`--pokaya-gradient-action` 或 solid `#C12B62`。
- Hover：颜色加深或轻微亮度变化，不改变尺寸。
- Disabled：低饱和 rose + muted text，不使用灰黑硬禁用态。
- Icon button：保持固定宽高，hover 不导致布局跳动。

### 9.2 Cards / Panels

- 背景优先使用 white 或 warm surface。
- 边框使用 `rgba(33, 0, 36, 0.12)`。
- 阴影应轻，不使用大面积紫色 glow。
- 结果卡、设置面板、billing 卡片不得嵌套装饰性卡片。

### 9.3 Inputs / Composer

- Focus ring 使用 `rgba(193, 43, 98, 0.24)`。
- Placeholder 使用 `--pokaya-subtle`。
- Composer 底部工具栏保持高度稳定，不因字体替换出现挤压或裁切。

### 9.4 Gradients

- 允许：CTA、logo accent、empty state 小面积装饰、进度条、selected pill。
- 谨慎：hero 背景，只能作为小面积品牌带或文字 accent。
- 禁止：整页 mesh gradient、全屏紫橙背景、影响文字可读性的渐变卡片。

### 9.5 数字与金额

以下内容必须使用 tabular nums：

- credits
- cost
- usage
- RM 金额
- generation count
- timestamps
- queue position
- provider latency / duration

## 10. 实施步骤

### Phase 1: Audit

- 搜索现有 CSS 中所有硬编码紫、粉、珊瑚、黄色、canvas、surface 色值。
- 搜索全局 font-family、heading、button、card title、amount 样式。
- 标记需要保留的品牌资产图片，避免误改图片本身。

### Phase 2: Token Update

- 在全局 CSS token 层更新颜色变量和字体变量。
- 保留必要旧 token alias，避免大量组件一次性断裂。
- 将新增 typography token 接入 body、heading、button、caption、amount。

### Phase 3: Surface Migration

按风险从低到高迁移：

1. Landing / homepage。
2. Login / register。
3. Sidebar / navigation。
4. Studio shell 和 composer。
5. Result wall / result card / lightbox。
6. Agent page。
7. Settings / billing / usage。
8. SOP / Auto Post / admin 可见页面。

### Phase 4: Visual QA

- 桌面宽度检查主要页面。
- 移动宽度检查 landing、Studio、Settings、Billing。
- 检查按钮文字、sidebar label、卡片标题、金额数字不溢出。
- 检查 hover、selected、disabled、loading、error 状态。

## 11. 验收标准

### 11.1 视觉验收

- 全站主视觉读起来是深紫到玫红橙的统一体系。
- 不再出现明显偏旧体系的 bright pink、soft lavender、yellow-dominant 组件。
- 页面背景从冷白/灰白统一到暖白或白色 surface。
- CTA 与选中态使用 `#C12B62` / `#FF6738`，不是随机粉色。
- Studio 仍然像生产工作台，不像 landing page。

### 11.2 字体验收

- 全站 UI font stack 为 Inter, PingFang SC, Microsoft YaHei, Noto Sans, sans-serif。
- Display / H1 / H2 / H3 / Body / Caption / Amount 层级符合本 PRD。
- 中文、英文、Malay 在主要页面无裁切、无重叠、无异常字距。
- 金额、credits、usage 等数字使用 tabular nums，列表刷新时不明显抖动。

### 11.3 技术验收

- `npm run build` 通过。
- 无新增前端框架、UI kit、动画库。
- 无无关业务逻辑改动。
- 只提交与本视觉 refresh 相关的文件。
- 完成执行后 commit 并 push，最终回复包含 commit hash。

## 12. 风险与处理

| 风险 | 影响 | 处理 |
|---|---|---|
| 字体变小导致部分页面显得空 | Landing 和卡片气势下降 | 通过 spacing、weight、色彩层级补足，不随意放大字号 |
| 暖白背景影响图片结果判断 | 生成结果预览可能偏色 | Media wall 的图片容器保持白色或中性底 |
| 全局 token 改动影响旧组件 | 出现 hover、border、disabled 异常 | 保留 alias，并按页面逐个 QA |
| 渐变过度使用 | 工具感下降 | 只允许在 CTA、selected、少量品牌位置使用 |
| 中文字体 fallback 不一致 | Windows / macOS 显示差异 | font stack 明确包含 PingFang SC、Microsoft YaHei、Noto Sans |

## 13. 建议优先级

P0：

- 全局 color token。
- 全局 font stack。
- Body / heading / button / caption / amount 字级。
- Sidebar、Studio、composer、billing 的关键可见区域。

P1：

- Landing 细节 polish。
- Result wall、lightbox、Agent 消息状态。
- Empty state、toast、badge、provider label。

P2：

- Admin 内部页面。
- 文档截图更新。
- 老旧静态图片资产重制。

## 14. 推荐执行命令

执行视觉 refresh 后至少运行：

```bash
npm run build
```

如本地可启动服务，应再检查：

```bash
npm run dev
```

并在桌面与移动宽度分别检查核心页面。
