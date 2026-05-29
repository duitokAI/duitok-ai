# Duitok SOP Center PRD

## 1. 背景

当前 Studio 侧边栏有一个 `SOP` 入口，但点击后打开的是小窗口 modal。这个体验有几个问题：

- SOP 是平台教学资产，不应该被塞进小弹窗里。
- 用户看 SOP 时需要对照平台操作，modal 会遮住主界面。
- 平台已经写了多套 SOP：Dashboard、Image、UGC、Auto Content、Original Video、Clone Prompt 等，但用户无法在一个地方系统浏览。
- 现在项目页顶部也有按当前 tab 打开的 SOP 按钮，入口分散，用户不知道哪里才是完整教程中心。
- 小窗口不适合长 SOP、步骤卡、搜索、分类、进度记录和后续扩展。

目标是把 SOP 从“弹窗说明”升级成“完整 SOP 中心”。

## 2. 产品目标

建立一个独立的 SOP Center 页面，聚合整个平台已经写好的 SOP，并支持用户按流程学习和按功能查找。

核心目标：

- 点击左侧 `SOP` 进入完整页面，而不是打开 modal。
- 平台所有 SOP 在一个页面聚合。
- 用户可以快速找到当前要做的任务 SOP。
- SOP 正文不遮挡界面，适合长内容阅读。
- 未来可以加入搜索、完成进度、视频教程、下载 PDF。

## 3. 非目标

- 本期不重写所有 SOP 文案。
- 本期不做用户学习进度同步到后端。
- 本期不做视频播放器和课程系统。
- 本期不做复杂权限分层，登录用户都可看 SOP。
- 本期不移除底层 SOP 内容函数，只重构展示方式。

## 4. 当前 SOP 资产盘点

当前代码内已有 SOP 内容函数：

- `sopDashboardContent()`
- `sopImageContent()`
- `sopUgcContent()`
- `sopAutoContentContent()`
- `sopOriginalVideoContent()`
- `sopClonePromptContent()`

当前已有入口：

- 侧边栏：`<button class="side-link" data-action="sop">SOP</button>`
- Dashboard header：`SOP Dashboard`
- Project header：按当前 tab 显示 `图片 SOP / UGC SOP / 自动内容 SOP / ...`
- 旧 modal：`sopDashboardModal()`

问题：

- `data-action="sop"` 统一打开 `state.modal = "sop"`。
- SOP 内容根据当前页面/step 决定，所以侧边栏 SOP 只能显示某一个上下文，而不是总目录。
- modal 结构不适合聚合所有 SOP。

## 5. 信息架构

### 5.1 新页面

新增 Studio 页面：

```text
state.page = "sop"
```

左侧侧边栏 `SOP` 点击后：

```js
set({ page: "sop", modal: null })
```

不再打开 modal。

### 5.2 SOP 分类

SOP Center 首版分为 3 组：

#### Getting Started

- Dashboard 总控 SOP
- 注册、credits、项目基本概念说明

#### Create Content

- Image / 产品图 SOP
- UGC Video SOP
- Auto Content 批量内容 SOP
- Original Video SOP
- Clone Prompt SOP

#### Publish & Operate

- Scheduler / 排期 SOP
- Auto Post TikTok SOP
- Usage / Credit SOP
- WhatsApp support / 人工协助入口

如果某些 SOP 当前还没有完整文案，可以先显示 `Coming soon`，但页面结构要预留。

## 6. 页面结构

### 6.1 顶部 Header

显示：

```text
SOP Center
把 Duitok 平台的完整操作步骤集中在这里。先选任务，再按步骤执行。
```

右侧可显示：

- 当前语言
- `Need help? WhatsApp` 按钮
- 可选 `Export SOP` 按钮

### 6.2 左侧目录 / 顶部 Tabs

桌面：

- 左侧 sticky 目录
- 分组标题
- SOP item button
- 当前选中高亮

移动端：

- 横向 scroll tabs 或 select dropdown
- 不使用 modal

### 6.3 主内容区

选中一个 SOP 后，右侧显示完整正文：

- Path
- What is this?
- When should I use it?
- Step-by-step guide
- Tips
- Workflow tip

复用现有 `sopDashboardModal()` 里的内容结构，但不使用 modal/backdrop/close button。

### 6.4 快速卡片

SOP Center 首页或上方显示 4-6 个快捷卡：

- 新手先看：Dashboard SOP
- 生成图片：Image SOP
- 做 UGC：UGC SOP
- 批量生成：Auto Content SOP
- 写视频：Original Video SOP
- 复刻竞品：Clone Prompt SOP

点击卡片切换当前 SOP。

## 7. 功能需求

### 7.1 侧边栏 SOP 入口改为页面导航

要求：

- 点击侧边栏 `SOP` 不再弹窗。
- `state.page` 改为 `sop`。
- 侧边栏 SOP item 在 SOP 页面处于 active 状态。

验收：

- 点击 SOP 后没有 modal overlay。
- 页面主体切换为 SOP Center。

### 7.2 Dashboard / Project 的 SOP 按钮行为

当前 Dashboard 和 Project header 里的 SOP 按钮不再打开 modal。

推荐行为：

- Dashboard `SOP Dashboard` -> 跳转到 SOP Center，并选中 Dashboard SOP。
- Project 当前 tab 的 SOP -> 跳转到 SOP Center，并选中对应 SOP。

实现方式：

```html
data-sop-target="image|ugc|auto|original|clone|dashboard"
```

点击后：

```js
set({ page: "sop", sopTopic: target, modal: null })
```

验收：

- 在 Image tab 点 SOP，进入 SOP Center 且默认打开 Image SOP。
- 在 Dashboard 点 SOP，进入 SOP Center 且默认打开 Dashboard SOP。

### 7.3 聚合所有已写 SOP

新增函数：

```js
function sopLibrary() {
  return [
    { id: "dashboard", group: "Getting Started", icon: "layout-dashboard", content: sopDashboardContent() },
    { id: "image", group: "Create Content", icon: "image", content: sopImageContent() },
    { id: "ugc", group: "Create Content", icon: "video", content: sopUgcContent() },
    { id: "auto", group: "Create Content", icon: "wand-sparkles", content: sopAutoContentContent() },
    { id: "original", group: "Create Content", icon: "film", content: sopOriginalVideoContent() },
    { id: "clone", group: "Create Content", icon: "layers-3", content: sopClonePromptContent() }
  ];
}
```

未完成内容可加：

```js
{ id: "scheduler", group: "Publish & Operate", status: "coming_soon" }
```

验收：

- SOP Center 至少显示 6 个已有 SOP。
- 点击每个 SOP 都能看到对应正文。

### 7.4 不再使用小窗口

要求：

- `sopDashboardModal()` 可保留给兼容，但不再由主入口触发。
- `renderModal()` 不再把 `state.modal === "sop"` 作为主要 SOP 入口。
- `action("sop")` 改为页面跳转。

验收：

- 用户从侧边栏、Dashboard、Project 点击 SOP 都不会出现 modal。

### 7.5 阅读体验

正文样式：

- 页面背景保持 Studio 浅色。
- SOP 内容卡不嵌套过多卡片。
- Step list 用清晰编号。
- Tips 使用轻量提示条。
- 目录 sticky，不遮挡内容。
- 内容最大宽度控制，避免一行太长。

验收：

- 1280px 桌面下，目录和正文同屏可读。
- 移动端 390px 下，目录不挤压正文。

### 7.6 搜索和筛选

Phase 1 可以不做全文搜索，但要预留结构。

Phase 2 增加：

- 搜索框：按标题、路径、step title 搜索。
- 分类筛选：Getting Started / Create Content / Publish & Operate。
- 搜索结果点击后打开对应 SOP 并滚动到相关 step。

## 8. UI 方案

### 8.1 页面布局

```text
┌────────────────────────────────────┐
│ SOP Center                         │
│ 选任务，看步骤，照着做              │
├──────────────┬─────────────────────┤
│ Getting      │ Dashboard SOP        │
│ - Dashboard  │ What is this?        │
│ Create       │ When to use?         │
│ - Image      │ Step 1 ...           │
│ - UGC        │ Step 2 ...           │
│ - Auto       │ Tips                 │
│ Publish      │ Workflow             │
└──────────────┴─────────────────────┘
```

### 8.2 左侧目录 item

每个 item 显示：

- icon
- title
- one-line description
- optional status：`Ready` / `Coming soon`

### 8.3 正文模块

复用并改造现有 modal class：

- `.sop-center`
- `.sop-center-hero`
- `.sop-center-layout`
- `.sop-nav`
- `.sop-content`
- `.sop-step-card`

避免 `.modal-backdrop`、`.sop-modal`、`.sop-close`。

## 9. 状态设计

新增 state：

```js
state.page = "sop"
state.sopTopic = "dashboard"
state.sopSearch = ""
```

默认：

- 从侧边栏进入：`sopTopic = "dashboard"`
- 从 project step 进入：`sopTopic = state.step`
- 从 dashboard button 进入：`sopTopic = "dashboard"`

## 10. 安全和边界

- SOP 是公开给登录用户看的操作说明，不展示内部 provider、API key、token、tool schema、中转站。
- 涉及发布 TikTok 的 SOP 只能讲用户操作和授权，不展示内部路由。
- 涉及扣 credits 的 SOP 必须写清楚“执行前确认、扣费透明”。
- 不显示后台环境变量、供应商密钥、内部成本表。

## 11. 技术实施计划

### Phase 1：页面化 SOP Center

- 新增 `sopTopic` state。
- 新增 `sopLibrary()`。
- 新增 `sopPage()`。
- 复用现有 SOP content functions。
- 修改侧边栏 SOP 入口：从 modal 改成 page。
- 修改 Dashboard / Project SOP 按钮：跳 SOP page，并传 topic。
- 保留旧 modal 但不再从主入口使用。
- Build 验证。

### Phase 2：目录和体验增强

- 增加搜索框。
- 增加分类筛选。
- Coming soon SOP 占位。
- 增加 `Need help? WhatsApp`。
- 增加 `Export current SOP`。

### Phase 3：学习系统

- 用户可标记 SOP step 完成。
- 保存学习进度。
- 每个 SOP 增加视频教程嵌入。
- Agent 可以根据用户当前页面推荐 SOP。

## 12. 验收标准

### P0

- 侧边栏 SOP 点击后进入 SOP Center 页面，不弹 modal。
- SOP Center 聚合至少 6 个现有 SOP。
- Dashboard / Project SOP 按钮进入对应 SOP 页面。
- 旧小窗口不再作为主要 SOP 体验出现。
- `npm run build` 通过。

### P1

- 桌面和移动端可读，不溢出。
- 目录当前项高亮。
- `Coming soon` 内容不会造成空白页。
- 不暴露内部技术配置。

### P2

- 搜索可用。
- Export 当前 SOP 可用。
- Agent 能在回答里引导用户打开对应 SOP。

## 13. 推荐首版范围

本次建议先执行 Phase 1：

- 建 SOP Center 页面。
- 聚合 6 个已有 SOP。
- 改所有 SOP 入口不再开 modal。
- 用现有 SOP 内容，少改文案。

这样能最快解决当前截图问题，并把 SOP 从“按钮弹窗”升级为真正的平台学习中心。
