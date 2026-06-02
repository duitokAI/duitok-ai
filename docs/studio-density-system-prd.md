# Pokaya Studio Density System PRD

## 1. 背景

当前 Pokaya Studio 的整体视觉尺寸偏大。截图中 Project 页面、左侧导航、步骤 tab、表单卡片、按钮、上传区域和浮动客服入口都占用了过多空间。这个问题不只出现在 Project 页面，也会影响 Billing、Top Up Credit、Usage、Affiliate、Content Library、Agent、Auto Post、WhatsApp、Admin CRM 等几乎所有 Studio 页面。

参考图右侧的 PeningLab Studio 更接近一个高频工作台：左侧导航窄、顶部标题克制、tab 高度低、卡片紧凑、表单可扫读、主内容可在首屏看到更多操作。Pokaya 现在更像演示页面或 landing page 延伸，工作效率感不足。

本 PRD 目标是建立一套 Studio 全局密度规范，把 Pokaya Studio 从“视觉很大”调整为“紧凑、专业、可长期使用的 AI 短视频营销工作台”。

## 2. 核心问题

### 2.1 信息密度过低

- 页面 H1 过大，Project 名称占用过高首屏。
- 顶部 project header、step tab、SOP 按钮之间留白过大。
- 主卡片 padding、border radius、section gap 偏 landing page 风格。
- 上传 dropzone 高度过大，导致用户需要频繁滚动。

### 2.2 Studio 层级不统一

- Project 页面、Billing、Top Up、Usage、Agent 使用不同尺寸节奏。
- 有些页面已经局部压缩，有些页面仍保留大字号和大卡片。
- 同样是操作按钮，有的像 CTA，有的像工具按钮，比例不统一。

### 2.3 侧边栏过重

- logo 区、语言切换、导航按钮、新项目按钮、project list item 都偏高。
- 左侧栏宽度和按钮高度使主工作区被挤压。
- 侧栏滚动时视觉负担大，像主页面而不是工具导航。

### 2.4 表单和卡片像展示模块

- 输入框、select、upload area 的高度偏大。
- section card 内标题、emoji、label 都偏大。
- 用户每次操作需要穿过大量空白区域。

## 3. 产品目标

### 3.1 用户体验目标

- 用户进入任意 Studio 页面，都能在首屏看到当前页面核心操作。
- 用户能快速扫读导航、项目、账单、生成、历史和排程信息。
- Studio 观感更像 SaaS 工作台，而不是首页营销模块。
- 保留 Pokaya 品牌的紫 / 粉 / 金色系，但减少大面积渐变和夸张留白。

### 3.2 业务目标

- 降低用户首次使用时的压迫感和滚动成本。
- 提高生成、充值、查看用量、管理内容库的完成率。
- 让 RM69 订阅后的 Studio 体验更像“专业工具”，提高付费合理性。

## 4. 非目标

- 不重做品牌色。
- 不把 Studio 改成 PeningLab 黑金风格。
- 不修改生成、扣费、支付、发布、Agent 后端逻辑。
- 不删除现有功能入口，除非有明确重复入口。
- 不一次性重构所有组件逻辑，本期重点是视觉密度和布局 token。

## 5. 设计原则

### 5.1 Operator Scale，不用 Landing Scale

Studio 内部不使用首页级大标题、大按钮、大卡片。所有页面都应服务于重复操作。

### 5.2 统一 Token，避免页面各自为政

用一套 Studio density token 约束全局尺寸：

- sidebar width
- page padding
- header height
- title size
- card radius
- card padding
- form input height
- tab height
- button height
- table/list row height

### 5.3 首屏优先

每个页面首屏必须看到：

- 当前页面标题
- 主要操作入口
- 至少一个核心内容区域

Project 页面首屏必须看到 image generator 与下一段上传区域的开头，而不是只看到巨大 header 和一张大卡。

### 5.4 品牌保留，装饰收敛

保留 Pokaya 的：

- 深紫文字
- 粉色 accent
- 金黄 primary action
- 轻微粉紫背景

减少：

- 巨大 radial glow
- 过重 shadow
- 大面积 pastel 卡片
- 过大的 border radius

## 6. 全局尺寸规范

### 6.1 Layout

| Element | Current Problem | Target |
| --- | --- | --- |
| Sidebar width | 过宽，主内容被挤压 | desktop 280-320px，非 400px+ |
| Workspace padding | 四周留白过大 | 32-44px desktop，18-22px mobile |
| Page max width | 内容过宽且空 | 1440-1520px，根据页面收敛 |
| Section gap | 页面像 landing page | 18-28px |
| Card radius | 大圆角显得 toy-like | 14-20px |
| Card padding | 过大 | 22-32px |

### 6.2 Typography

| Text | Target |
| --- | --- |
| Page H1 | 36-48px desktop；28-34px mobile |
| Section H2 | 22-30px |
| Card title | 18-24px |
| Form label | 12-14px，letter spacing 可保留 |
| Body copy | 14-16px |
| Sidebar nav | 14-16px |
| Table/list rows | 13-15px |

禁止：

- Studio 页面 H1 超过 56px。
- 普通 section 标题使用首页 hero 级字号。
- button 内文字大于 18px，除非是唯一主 CTA。

### 6.3 Controls

| Control | Target |
| --- | --- |
| Primary button | height 44-52px |
| Secondary button | height 38-46px |
| Icon button | 38-44px square |
| Input / Select | height 46-54px |
| Textarea min height | 96-132px，按场景 |
| Step tab | height 46-58px |
| Upload dropzone | compact 150-220px，不默认 300px+ |

## 7. 页面级需求

### 7.1 Sidebar

目标：从“品牌展示栏”变成“高频导航栏”。

需求：

- Sidebar 宽度降低到 300px 左右。
- Logo 区高度收敛，mascot 不超过 52px。
- Language switch 高度收敛到 48-56px。
- Nav item 高度 46-54px。
- New project button 高度 48-56px。
- Project list item 高度 52-60px。
- Section label 间距减少。
- 当前选中 project 保留粉色描边，但减少大面积高亮。
- Human Support floating bubble 不遮挡底部导航，desktop 可缩小。

验收：

- 1440px 宽度下 sidebar 不超过页面 23%。
- Project list 能在一屏显示至少 4 个 project。
- Business / Account 区域不需要滚动太多才看到 Billing。

### 7.2 Project Page

目标：Project 是工作台核心，必须最先压缩。

需求：

- Project header 高度减少。
- H1 从当前巨大尺寸降到 42-48px。
- SOP button 高度 48-54px，位置靠右即可，不要像 landing CTA。
- Step tabs 高度降到 50-56px。
- Tabs 内文字允许 truncate，但 active tab 不要过高。
- Image generator card padding 降到 24-32px。
- Model / Mode row input 高度 50-54px。
- Virtualize / Avatar / Product Reference 等 section card padding 降低。
- Upload dropzone 高度降到 170-220px。
- Emoji 图标缩小或换成 consistent icon。

验收：

- 1440x900 首屏可看到：Project title、tabs、Image Generator、下一段上传区域上半部分。
- 不需要滚动才能理解当前要上传什么。

### 7.3 Billing

目标：账单页像管理页，不像 pricing landing page。

需求：

- Billing header 与其他页面统一。
- Plan card 不做超大 hero price。
- RM69、credits、renewal、status 用 compact metrics row。
- Payment history 使用 table/list row，不用大卡片堆叠。
- CTA 保持明显，但高度控制在 48-52px。

验收：

- 首屏能看到当前 plan、credit balance、payment status、history 开头。

### 7.4 Top Up Credit

目标：充值页从大卡片改成清晰选择器。

需求：

- Credit balance panel 高度控制在 150-190px。
- Top up package card 高度 90-120px。
- Package grid 支持 2-4 columns，根据宽度。
- Payment CTA 固定在 panel 底部，不要做过大按钮。
- History list 使用 compact rows。

验收：

- 首屏能完成选择 top-up package 并看到支付按钮。

### 7.5 Usage

目标：用量页应该数据密度更高。

需求：

- Metrics card 高度控制在 96-130px。
- Filter bar 一行展示。
- Usage entries 使用 compact table / list。
- 每条记录显示：时间、项目、类型、cost、status。
- 失败记录要用小 badge，不用大块提示。

验收：

- 1440x900 首屏至少看到 6-8 条 usage record。

### 7.6 Affiliate

目标：Affiliate 像运营工具，而不是介绍页。

需求：

- 顶部显示 affiliate link、commission、referrals 三个 compact cards。
- Referral list 用 table row。
- Copy link button 为小型 action。
- 说明文字折叠到 info panel，不占主视觉。

验收：

- 首屏能看到 link、核心数据、referral list 开头。

### 7.7 Content Library

目标：资产库要高密度浏览。

需求：

- Filter bar sticky 或 compact top row。
- Asset cards 默认小尺寸 grid。
- Card 内减少大图外 padding。
- 支持 list view / grid view，至少先提供 compact grid。
- 每个 asset card 显示：type、project、cost/status、quick actions。

验收：

- Desktop 一行至少显示 4-5 个 asset card。

### 7.8 Pokaya Agent

目标：Agent 是操作员，不是大聊天页。

需求：

- Header 高度降低。
- “历史记录 / 新对话 / 清空”按钮尺寸统一。
- 对话区宽度不要过窄，也不要每条消息像大卡片。
- Agent run card completed 状态要 compact。
- 长回复默认折叠逻辑保留，但展开按钮要小。
- 历史记录 panel 高度和列表行压缩。

验收：

- 截图中的“正在处理”卡不应占用半屏。
- 输入框固定底部时不遮挡内容。

### 7.9 Auto Post / WhatsApp

目标：配置与排程信息清楚，不做大块说明。

需求：

- Status / connected / not connected 使用 compact status banner。
- 排程列表 row 化。
- 说明文字折叠进 help panel。
- TikTok official post action 不要像主 hero CTA。

验收：

- 首屏能看到连接状态和至少 4 条排程/设置项。

### 7.10 Admin CRM

目标：管理员页面应该最高密度。

需求：

- User list / jobs / payments / failures 用 table density。
- Metrics 使用 4-6 个 compact cards。
- Admin actions 小按钮化。
- 详情信息用 drawer 或 inline expand，不用巨大卡片。

验收：

- 1440x900 首屏至少看到 8-12 个用户/记录。

## 8. 视觉方向

### 8.1 Pokaya Studio Compact Theme

保持亮色 Studio，不切黑底：

- Page background：浅粉紫渐变，但降低强度。
- Sidebar：深紫可保留，但压缩尺寸和减少内阴影。
- Main cards：白色 / 轻粉底。
- Primary action：金黄或粉金。
- Destructive / warning：粉红，不用强红。
- Border：浅紫透明。

### 8.2 Radius / Shadow

- Large container radius：18-24px。
- Inner card radius：12-16px。
- Input radius：10-14px。
- Shadow 降低，避免所有卡片漂浮。

### 8.3 Icons

- 使用 lucide icons 或现有 icon helper。
- Emoji 只保留在内容语境强的地方，不作为所有 section heading 的主图标。
- 图标尺寸 16-22px 为主。

## 9. 技术实施建议

### 9.1 新增 Studio Density Tokens

在 CSS 中建立一组变量，避免逐页硬改：

```css
.studio-shell {
  --studio-sidebar-width: 304px;
  --studio-page-pad-x: clamp(24px, 2.6vw, 42px);
  --studio-page-pad-y: clamp(22px, 2.4vw, 36px);
  --studio-section-gap: 22px;
  --studio-card-pad: clamp(22px, 2.2vw, 32px);
  --studio-card-radius: 18px;
  --studio-control-height: 50px;
  --studio-button-height: 46px;
  --studio-h1: clamp(34px, 3.1vw, 48px);
  --studio-h2: clamp(22px, 2vw, 30px);
  --studio-body: 15px;
}
```

### 9.2 Execution Order

1. Define global density tokens.
2. Normalize sidebar.
3. Normalize page header.
4. Normalize tabs and buttons.
5. Normalize form controls.
6. Normalize cards and section spacing.
7. Apply page-specific patches.
8. QA desktop and mobile.

### 9.3 Avoid

- 不要用 `!important` 大面积覆盖，除非修复历史层叠问题。
- 不要通过 transform scale 缩小整个页面。
- 不要只改 Project 页面。
- 不要引入新 UI library。
- 不要修改业务逻辑。

## 10. Acceptance Criteria

### 10.1 Global

- Studio 所有主页面首屏内容密度提升。
- 没有页面出现文字重叠或按钮文字溢出。
- 不影响 login/public homepage。
- 不影响生成、支付、Agent、发布等功能。

### 10.2 Desktop QA

检查 viewports：

- 1440x900
- 1728x1117
- 1280x720

每个 viewport 检查：

- Sidebar 是否过宽。
- Header 是否过高。
- CTA 是否过大。
- Project/Billing/Topup/Usage/Affiliate/Agent/Library 是否首屏可用。

### 10.3 Mobile / Narrow QA

检查：

- 390x844
- 430x932
- 768x1024

要求：

- Sidebar / nav 不遮挡内容。
- 表单控件不横向溢出。
- 卡片不出现文字裁切。

## 11. Page-by-page QA Checklist

- Dashboard：metrics、recent project、quick actions 是否更紧凑。
- Project：tabs、generator、upload area 是否首屏可见。
- Billing：plan、payment、history 是否首屏可扫。
- Top Up：balance、packages、pay button 是否首屏完成。
- Usage：记录行数是否足够。
- Affiliate：link、commission、referrals 是否首屏清楚。
- Content Library：asset grid 是否密度足够。
- Agent：历史、新对话、消息、输入框是否不挤压。
- Auto Post：连接状态、排程列表是否清楚。
- WhatsApp：设置状态和群入口是否清楚。
- Admin CRM：表格密度是否足够。

## 12. Rollout Plan

### Phase 1：Global Density Foundation

- Sidebar
- Workspace padding
- Page header
- Buttons / inputs / tabs
- Card padding / radius

### Phase 2：Core Workflows

- Project
- Billing
- Top Up
- Usage
- Content Library

### Phase 3：Advanced Pages

- Agent
- Auto Post
- WhatsApp
- Affiliate
- Admin CRM

## 13. Success Definition

这次优化完成后，Pokaya Studio 应该给用户的感觉是：

> “这是一个我每天可以打开来批量做短视频带货的工作台。”

而不是：

> “这是一个很大、很漂亮，但每一步都要滚很久的展示页面。”

