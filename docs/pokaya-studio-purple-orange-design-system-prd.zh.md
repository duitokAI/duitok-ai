# Pokaya Studio 紫橙设计系统优化 PRD

Last updated: 2026-06-05

## 1. 背景

当前 Pokaya 用户后台已经开始套用用户指定的 Purple to Orange Mix 色系：

- `#210024`
- `#32103A`
- `#8B1A78`
- `#C12B62`
- `#FF6738`

最新 Studio 截图显示，紫橙方向已经可见，但整体仍有优化空间：橙色被放进了部分 active tab 和 CTA，却还没有形成一套稳定、可复用、可扩展的后台设计系统。部分区域依然显得像“在原紫色界面上叠了一层渐变”，而不是从 token、状态、层级、组件关系上重新梳理。

本 PRD 目标是为下一轮优化建立明确设计要求。后续执行时应搭配：

- `figma-create-design-system-rules`：把紫橙色系、组件状态和 Figma-to-code 规则固化成项目规则。
- `pokaya-ui-stability`：在实际改 Studio / sidebar / toolbar / media wall / composer 时保证布局稳定、可验证、可回滚。

本 PRD 只覆盖登录后的用户后台，优先覆盖当前截图中的 Studio 页面；公开前台 landing、登录注册页、外部营销页暂不纳入本轮。

## 2. 当前截图诊断

### 2.1 色彩已经有品牌感，但系统性不足

当前界面能看到紫橙渐变，但使用方式偏“局部上色”：

- 顶部 active tab 和 Generate Media CTA 有橙色，但其他区域仍以大面积紫粉为主。
- 侧边栏底部出现较重的紫粉渐变，视觉重量过强，容易抢主工作区注意力。
- 媒体墙失败卡片与页面暗背景过于接近，状态信息不够清晰。
- Composer 大面积暖粉白与深色工作区之间关系还不够自然，像浮在画面上。
- 多个按钮、pill、tab 都在竞争“主按钮”的视觉权重。

### 2.2 橙色不是越多越好，而是要有明确职责

用户希望这套颜色成为主色调，因此橙色不能只偶尔出现；但如果全页铺满橙色，也会伤害后台工具的可读性。当前更合适的方向是：

- 橙色用于行动、确认、能量、当前选中边缘。
- 深紫用于工作台底色、品牌底盘、文本锚点。
- 洋红用于中间态、hover、active surface。
- 玫红用于可操作状态和组件边界。
- 暖白用于输入、composer、弹层和高可读控件。

### 2.3 顶部工具 tab 缺少状态层级

当前 tab 的问题：

- active tab 的渐变较强，但 inactive tab 仍然偏亮、偏重。
- `Image`、`Video`、`Product Scanner`、`Original Video`、`Clone Prompt`、`Storytelling` 的默认态都像大按钮。
- 橙色从 active tab 向右侧区域扩散，但没有明确 token 规则。
- tab 高度、边框、背景透明度需要统一为“工具栏状态”，而不是 CTA 状态。

### 2.4 Sidebar 仍有过重的装饰感

当前 sidebar 的问题：

- 顶部 logo 区和底部紫粉渐变形成上下竞争。
- active nav 的橙色边缘方向是对的，但周围面板色、hover 色、inactive 色还需要重新分级。
- `Language`、`Pokaya Agent`、`Dashboard`、`Studio`、`Admin CRM`、`Content Library`、`Business` 分组之间的层级还不够克制。
- Sidebar 应该像高频导航栏，不应该像一张品牌海报。

### 2.5 Media wall 的状态表达偏弱

当前 media wall 中有生成成功图片、失败卡片、空白/占位区域混合在一起。问题是：

- 失败卡片颜色接近背景，导致状态块像普通空 tile。
- 白色分割线较硬，会让失败区域显得像拼图裂缝。
- `Failed`、`No Charge`、`Retry`、`Edit` 的层级关系不够清楚。
- 成功图片应成为主内容，失败状态应清楚但不抢视觉。

### 2.6 Composer 需要成为“稳定控制台”

底部 composer 是 Studio 的核心操作区。当前问题：

- 它现在已经变得很突出，但还没有完全融入深色画布。
- 左侧 prompt 输入、模型选择、参数 pill、右侧 icon button 和 Generate CTA 的视觉语言不完全统一。
- `Generate Media` 是主行动，应最明确；其他参数控件应降低一点重量。
- 暖色面板边缘需要更清晰，但不应该变成过亮的大卡片。

## 3. 产品目标

1. 让 Pokaya 用户后台形成明确、可持续的紫橙设计系统，而不是局部渐变替换。
2. 保持 Studio 的工作台效率感：高频操作、媒体浏览、生成参数调整都要可扫读。
3. 让橙色成为行动与选中信号，而不是随机装饰色。
4. 降低大面积紫粉造成的视觉疲劳，让媒体内容和生成操作更突出。
5. 为后续 Figma 设计系统规则和代码实现建立清晰验收标准。

## 4. 非目标

本轮不做：

- 不改公开前台页面。
- 不重做信息架构。
- 不改变 Image / Video / Product Scanner 等功能逻辑。
- 不修改生成、扣费、模型、provider、retry、edit 的业务逻辑。
- 不引入新前端框架、UI kit、动画库或路由架构。
- 不把整个 Studio 改成全橙色或全渐变背景。
- 不追求一次性重构所有 CSS，只做为后续执行准备的设计系统 PRD。

## 5. 设计原则

### 5.1 深紫做底盘，橙色做行动

Studio 是生产工具，底层应稳定、深、可承载媒体内容。建议：

- `#210024`：最深工作台背景、主 ink、重要暗面。
- `#32103A`：sidebar、深色 surface、失败卡片底色。
- `#8B1A78`：hover、次级高亮、图标强调。
- `#C12B62`：active、selected、primary border。
- `#FF6738`：Generate、确认行动、active edge、少量高能 highlight。

### 5.2 渐变只服务层级，不做噪音

渐变可以使用，但需要限制职责：

- Primary CTA 可使用玫红到橙色渐变。
- 当前选中 tab 可使用紫到橙渐变。
- Sidebar active item 可用左侧橙色边缘加深紫 surface。
- Composer 边框可用极轻紫橙线性渐变。
- 禁止将所有背景、所有按钮、所有卡片都改成强渐变。

### 5.3 媒体内容优先

Studio 的主内容是生成图片/视频结果。色彩系统必须帮助用户看内容，而不是压住内容：

- 成功媒体 tile 的边框和 overlay 要克制。
- 失败 tile 要清楚，但不能比成功图片更抢眼。
- 深色背景应为媒体墙提供稳定衬底。
- 分割线不能过亮、过硬。

### 5.4 控件状态必须 token 化

所有组件至少定义以下状态：

- default
- hover
- active / selected
- focus
- disabled
- error / failed
- loading

不得继续依赖零散 CSS 覆盖来制造状态差异。

### 5.5 Typography 保持后台工具尺度

用户后台字体沿用已确认的 font stack：

```css
font-family: Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans", sans-serif;
```

后台优先使用：

| Level | Size / Line height | Weight | 用途 |
|---|---:|---:|---|
| H1 | `24px / 32px` | `700` | 页面标题 |
| H2 | `20px / 28px` | `600` | 区块标题 |
| H3 | `16px / 24px` | `600` | 卡片、nav、tab 重点文本 |
| Body | `14px / 22px` | `400` | 默认正文 |
| Caption | `12px / 18px` | `400` | 辅助、状态、时间 |
| Amount / Count | `20-28px` | `700` | credits、数量、金额 |

## 6. Design Token 需求

### 6.1 品牌色 token

```css
--studio-plum-950: #210024;
--studio-plum-900: #32103A;
--studio-magenta-700: #8B1A78;
--studio-rose-600: #C12B62;
--studio-orange-500: #FF6738;
```

### 6.2 工作台 surface token

```css
--studio-shell-bg: #210024;
--studio-sidebar-bg: #210024;
--studio-sidebar-surface: rgba(50, 16, 58, 0.72);
--studio-sidebar-surface-hover: rgba(139, 26, 120, 0.32);
--studio-sidebar-surface-active: rgba(139, 26, 120, 0.44);

--studio-wall-bg: #210024;
--studio-wall-panel: #32103A;
--studio-wall-panel-soft: rgba(50, 16, 58, 0.76);
--studio-wall-line: rgba(255, 249, 240, 0.28);
```

### 6.3 行动与状态 token

```css
--studio-action-primary: linear-gradient(135deg, #C12B62 0%, #FF6738 100%);
--studio-action-primary-hover: linear-gradient(135deg, #D93A6B 0%, #FF7A45 100%);
--studio-selected-edge: #FF6738;
--studio-focus-ring: rgba(255, 103, 56, 0.42);
--studio-failed-bg: rgba(50, 16, 58, 0.88);
--studio-failed-border: rgba(255, 249, 240, 0.2);
--studio-no-charge-bg: rgba(193, 43, 98, 0.26);
```

### 6.4 Composer token

```css
--studio-composer-bg: rgba(255, 249, 240, 0.92);
--studio-composer-border: rgba(255, 103, 56, 0.38);
--studio-composer-line: rgba(33, 0, 36, 0.12);
--studio-control-bg: rgba(255, 255, 255, 0.82);
--studio-control-bg-hover: #FFFFFF;
--studio-control-text: #210024;
--studio-control-muted: rgba(33, 0, 36, 0.52);
```

## 7. 区域级优化需求

### 7.1 Sidebar

目标：从“装饰性品牌侧栏”优化成“深紫底盘 + 清晰选中 + 低噪音导航”。

需求：

- Sidebar 背景保持深紫，但减少底部大面积亮紫粉渐变。
- Logo 区保留品牌识别，`AI` 可使用玫红/橙色渐变文字。
- Nav item default 使用低透明 surface。
- Nav item hover 使用轻微洋红提升。
- Active item 使用深紫 surface、玫红描边、橙色左侧 edge。
- Section label 使用 caption 尺寸和低透明暖白，不要与 nav item 竞争。
- `Pokaya Agent` 卡片应更像状态面板，`READY` 使用独立状态绿，不混入品牌橙。

验收：

- 用户一眼能识别当前在 `Studio`。
- `Admin CRM`、`Content Library` 不再看起来像次级 active。
- Sidebar 不比主内容更抢眼。

### 7.2 Top Tool Tabs

目标：把顶部从一排大 CTA 改成稳定工具 tab。

需求：

- Active tab 使用紫到橙渐变，但高度和圆角保持工具栏感。
- Inactive tab 使用深紫半透明 surface，文字降权。
- Hover 态只轻微提升亮度或边框，不使用强橙。
- 每个 tab 的 icon 和文字使用同一套尺寸规则。
- `Image` active 时，其他 tabs 不应像可点击主按钮。

验收：

- Active tab 清楚，但 Generate CTA 仍然是页面最强行动。
- tab 行不出现右侧橙色大面积堆叠。
- 1600px 宽度下所有 tab 文案完整显示。

### 7.3 Media Wall

目标：让成功媒体成为主角，让失败状态清楚但安静。

需求：

- Media wall 背景使用深紫或深酒红，但降低纯色块的压迫感。
- tile 分割线从亮白改为暖白低透明。
- 成功图片 tile 保持最少装饰，避免强阴影和强边框。
- 失败 tile 使用 `--studio-failed-bg`，并给中心状态内容一个轻 surface。
- `Failed` 为主状态文本，`No Charge` 为状态 badge，`Retry` / `Edit` 为次级操作。
- Retry / Edit 按钮不应与 Generate CTA 共用同等强度的渐变。

验收：

- 截图里失败 tile 不再像“空洞的暗色块”。
- 用户能快速区分成功媒体、失败媒体、可重试操作。
- Media wall 不因为背景色而降低图片可读性。

### 7.4 Composer

目标：让底部 composer 成为专业、稳定、有品牌能量的生成控制台。

需求：

- Composer 面板使用暖白半透明 surface，边框加入极轻橙色提示。
- Prompt 输入区域保持最高可读性，placeholder 不要过浅。
- 模型、比例、质量、数量控件使用同一控制 token。
- 左侧 `+` 按钮、右侧 persona/cube icon button 统一为 icon control。
- Generate Media 使用玫红到橙色 primary gradient，是唯一最强 CTA。
- CTA 内文字、icon、credit 信息需要垂直居中且不裁切。

验收：

- Composer 不像漂浮的大广告卡片，而像嵌在 Studio 底部的控制台。
- Generate CTA 一眼可见，但不会压过 prompt 输入。
- 长模型名、`Describe your image`、`0.15 Credit` 不溢出或裁切。

### 7.5 Buttons / Badges / Pills

目标：统一按钮语义，避免所有 pill 都像主按钮。

按钮层级：

| 类型 | 视觉 |
|---|---|
| Primary | 玫红到橙色渐变，仅用于 Generate / Confirm |
| Secondary | 深紫或暖白 surface，低透明边框 |
| Ghost | 透明背景，hover 轻 surface |
| Status badge | 固定语义色，不和 CTA 争夺 |
| Icon button | 固定方形尺寸，hover 不改变布局 |

验收：

- `No Charge` 不像主要 CTA。
- `Retry` / `Edit` 是次级操作。
- 参数控件不和 Generate 使用同一视觉强度。

## 8. Figma Design System Rules 要求

后续使用 `figma-create-design-system-rules` 时，规则文件必须覆盖以下内容。

### 8.1 必须写入的项目约束

- Pokaya Studio 的紫橙色系必须通过 token 使用，不允许直接硬编码色值。
- Figma 输出如包含 Tailwind/React 表达，只能作为设计参考，不能直接迁移成新框架或新 styling 架构。
- Studio 相关实现必须限制在现有前端结构和 CSS 体系内。
- 后台作用域优先使用 `.studio-shell` 或现有 Studio 容器，不影响公开前台。
- 媒体墙、composer、sidebar、top tabs 必须保留稳定尺寸，不允许 hover 或 loading 导致布局跳动。
- 图标优先使用现有项目图标体系，不新增 icon package。

### 8.2 Figma MCP 有连接时的执行流程

如果后续 Figma MCP 可用，执行必须按以下顺序：

1. 对目标 frame/node 运行 `get_design_context`。
2. 如果结果过大，先运行 `get_metadata`，再只拉取必要节点。
3. 对同一节点运行 `get_screenshot`，保留视觉参考。
4. 下载 Figma 返回的必要图片或 SVG 资产。
5. 将 Figma 输出翻译成 Pokaya 现有 CSS / DOM 约定。
6. 使用 Playwright 截图与 Figma 截图对照验收。

### 8.3 Figma MCP 不可用时的降级流程

如果 Figma MCP 暂时不可用：

- 以用户提供截图作为视觉来源。
- 先生成设计 token 和组件状态规范。
- 执行时在本地浏览器截图对照当前截图。
- 等 Figma MCP 可用后，再把 token 和组件状态写入设计系统规则。

## 9. Pokaya UI Stability 执行要求

后续进入实现阶段时，必须遵守：

1. 先审计 `src/styles.css` 中当前 Studio 相关 selector，确认哪些是本轮改动来源。
2. 优先整理 token 和 scoped override，避免继续叠加大量高优先级补丁。
3. 不修改生成逻辑、retry/edit 逻辑、模型选择逻辑、扣费逻辑。
4. 不影响公开前台、登录注册页和非后台页面。
5. 每次 UI 改动后运行 `npm run build`。
6. 使用浏览器检查至少两个 viewport：
   - desktop：约 `1600x900`
   - narrow：约 `390x844` 或项目已有移动断点
7. 检查重点：
   - 文字不裁切
   - hover 不跳动
   - composer 不遮挡关键操作
   - media tile 不变形
   - tab 不溢出
   - sidebar 不抢主内容

## 10. 验收标准

### 10.1 视觉验收

- 当前 Studio 截图中的橙色不再只集中在 active tab 和 Generate CTA，而是成为选中、焦点、行动的统一信号。
- Sidebar 视觉重量下降，导航层级更清楚。
- Top tabs 默认态明显降权，active tab 明确但不过度。
- Media wall 的成功图片、失败状态、操作按钮能快速区分。
- Composer 看起来像专业控制台，不像孤立的大卡片。
- 整体仍保持 Pokaya AI 的紫橙品牌识别。

### 10.2 可读性验收

- `Image`、`Product Scanner`、`Original Video`、`Clone Prompt`、`Storytelling` 不裁切。
- `Describe your image`、模型名、比例、质量、数量、credit 文案不裁切。
- `Failed`、`No Charge`、`Retry`、`Edit` 层级清晰。
- 中文、英文、Malay 在同一 font stack 下显示稳定。

### 10.3 技术验收

- `npm run build` 通过。
- UI 改动限定在用户后台 Studio 相关范围。
- 不引入新依赖。
- 不新增前端框架或 UI kit。
- Playwright / Browser 截图验证通过。
- 执行阶段完成后按项目规则 commit 并 push。

## 11. 风险与规避

### 11.1 风险：橙色过度使用导致廉价感

规避：

- 橙色只用于 action、selected edge、focus ring 和少量 CTA gradient。
- 背景不使用大面积纯橙。

### 11.2 风险：深紫背景压低媒体图片亮度

规避：

- 图片 tile 不加过重 overlay。
- 分割线使用低透明暖白。
- 失败 tile 与成功图片建立明确状态差异。

### 11.3 风险：继续叠加 CSS patch 导致维护困难

规避：

- 先抽 token，再按区域整理 selector。
- 后续 Figma 规则必须写明“不硬编码色值”和“Studio scoped”。

### 11.4 风险：只看桌面导致移动端 composer 崩

规避：

- 执行阶段必须检查 narrow viewport。
- 控件需要 wrap、scroll 或压缩规则，不允许互相覆盖。

## 12. 建议执行顺序

### Phase 1：规则准备

- 使用本 PRD 提炼 design token。
- 运行或补齐 `figma-create-design-system-rules` 所需规则。
- 明确写入 Figma-to-code 时的 Pokaya 项目约束。

### Phase 2：视觉系统重整

- 整理 Studio scoped color tokens。
- 重做 sidebar 状态。
- 重做 top tabs 状态。
- 重做 media wall failed / success / action 层级。
- 重做 composer 控制台 surface 与 CTA 层级。

### Phase 3：稳定性验证

- `npm run build`
- desktop screenshot 验证
- narrow screenshot 验证
- 检查公开前台未受影响
- commit + push

## 13. 交付物

本轮 PRD 阶段交付：

- 一份中文 PRD：`docs/pokaya-studio-purple-orange-design-system-prd.zh.md`

后续执行阶段交付：

- 更新后的 Figma design system rules。
- Studio scoped CSS / token 调整。
- 本地 build 结果。
- 浏览器截图验证结果。
- Git commit hash 与 push 状态。
