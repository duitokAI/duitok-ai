# SOP Center 整体体验优化 PRD

## 1. 背景

当前 SOP Center 已经从弹窗升级为独立页面，但从截图看，页面仍然更像“把所有教程铺开的大目录”，还不是一个真正帮助用户完成任务的操作中心。

主要问题：

- 首屏信息过重：大标题、6 张大卡、左侧目录、正文大标题同时出现，用户第一眼不知道该先点哪里。
- SOP 卡片标题过长，英文标题换行严重，阅读成本高。
- 页面纵向空间被顶部卡片吃掉，真正的步骤内容在首屏下方，只露出一部分。
- 左侧目录和顶部快捷卡功能重复，两个导航系统同时抢注意力。
- CTA `Need help?` 和 `Export SOP` 视觉权重过高，像主操作，但用户当前最需要的是“继续学习 / 开始执行”。
- 正文标题字号过大，像 landing page hero，不像后台工具里的说明文档。
- 当前 SOP 只有 `Ready` 状态，没有学习进度、预计时间、步骤数量、下一步行动。
- 用户无法搜索“credit / UGC / prompt / auto post”等具体问题。

## 2. 产品目标

把 SOP Center 从“教程展示页”优化成“任务型学习与执行中心”。

核心目标：

- 用户进入后 3 秒内知道自己该选哪个 SOP。
- 用户能快速搜索问题，而不是只能逐个卡片翻。
- 每个 SOP 从“长文档”变成“可执行步骤”：目标、适用场景、步骤、检查清单、下一步按钮。
- 页面视觉密度更适合后台 CRM / Studio，不再像营销落地页。
- 移动端和小屏不再出现卡片过大、标题被截断、正文被挤下去的问题。

## 3. 非目标

- 本期不重写所有 SOP 的核心教学内容。
- 本期不做视频课程系统。
- 本期不做后端学习进度同步，进度可先用 localStorage。
- 本期不做复杂权限控制。
- 本期不删除项目页里的 SOP 快捷入口，只优化跳转和承接体验。

## 4. 用户场景

### 场景 A：新用户不知道从哪里开始

用户刚进 Studio，不知道 Dashboard、Image、UGC、Auto Content 的顺序。SOP Center 应该给出“推荐路径”，例如：

1. 创建 Project
2. 生成产品图 / avatar
3. 生成 UGC 视频
4. 复盘与下载

### 场景 B：用户正在某个功能页卡住

用户在 Image / UGC / Auto Content 页面点 SOP，应该直接打开对应 SOP，并高亮当前功能，不需要重新选择。

### 场景 C：用户只想查一个具体问题

用户想知道“credits 怎么算”“UGC 8 秒为什么”“怎么 extend video”，应该能直接搜索关键词，跳到相关 SOP 步骤。

### 场景 D：用户边看边执行

用户不是来读文章，而是来照做。每个 SOP 步骤需要有明确的操作动词、检查点和下一步按钮。

## 5. 信息架构

### 5.1 页面模块

建议页面改成 5 个区域：

1. Compact Header
2. Search + Recommended Path
3. SOP Category Tabs
4. SOP Reader
5. Execution Checklist / Next Action

### 5.2 SOP 分类

保留现有 6 个核心 SOP，但用更短的用户语言命名：

- Start：总控与项目
- Image：生成图片
- UGC：生成口播视频
- Batch：批量内容
- Cinema：原创视频
- Clone：拆解竞品

完整标题放在正文内，不放在卡片标题里。

## 6. 页面设计需求

### 6.1 Compact Header

现状：`SOP Center` H1 很大，占用大量首屏空间。

优化：

- Header 高度压缩到 96-128px。
- H1 改为中等标题，不再使用 hero 级字号。
- 副标题缩短为一句具体任务文案：

```text
选择一个任务，按步骤完成生成、复盘和发布。
```

- `Need help?` 降级为次要按钮。
- `Export SOP` 放入更多菜单或右侧小按钮，不作为主 CTA。

### 6.2 Search First

在标题下方增加 SOP 搜索框：

```text
Search SOP, step, credit, prompt, UGC...
```

搜索范围：

- SOP 标题
- path
- what / when 文案
- step title
- step copy
- tips

搜索结果交互：

- 有搜索词时，隐藏大卡片，显示匹配步骤列表。
- 点击结果后打开对应 SOP，并滚动到对应步骤。

### 6.3 Recommended Path

新增一个轻量推荐路径条，替代现在过大的 6 张卡：

```text
Recommended for beginners:
Project setup → Image → UGC → Batch → Download
```

每个节点是小 pill，点击跳转对应 SOP。

### 6.4 SOP Quick Cards

现有 6 张卡过大且标题过长。改为更紧凑的 2 行卡片：

卡片字段：

- icon
- 短标题：`Start` / `Image` / `UGC` / `Batch` / `Cinema` / `Clone`
- 一句话用途
- steps count
- estimated time
- status / progress

示例：

```text
UGC
Generate selfie-style product videos
16 steps · 8 min
```

桌面布局：

- 6 张卡一行可以保留，但高度控制在 92-108px。

移动端：

- 横向滑动 tabs，卡片高度不超过 84px。

### 6.5 左侧目录优化

现状：左侧目录和顶部卡片重复，而且文字被截断。

优化：

- 桌面端左侧目录只显示分组 + 短标题。
- 选中 SOP 后，目录下方显示“当前 SOP 步骤目录”。
- 去掉 `Ready` 的重复展示，改为：

```text
0/16 done
```

左侧目录结构：

```text
SOP Library
Start
Image
UGC
Batch
Cinema
Clone

On this SOP
1. What is this
2. When to use
3. Steps
4. Checklist
```

### 6.6 SOP Reader 正文优化

现状：正文标题过大，`DASHBOARD — PROJECT & PRODUCTION SUMMARY` 占屏太多。

优化：

- 正文标题字号降到后台页面级别。
- 标题使用短标题 + 完整标题副文案：

```text
Start
Dashboard, project setup, and production summary
```

- `What is this?` 和 `When to use?` 改成双列 compact info cards。
- Step list 保持卡片，但减少圆角和 padding，提升信息密度。
- 每个步骤加入：
  - step number
  - action title
  - body
  - tip
  - optional CTA

### 6.7 Execution Checklist

每个 SOP 底部新增 checklist：

```text
Before you leave this SOP:
[ ] I know where this feature lives
[ ] I know what input is required
[ ] I know what output to expect
[ ] I know the next action
```

交互：

- 勾选状态先存 localStorage。
- 左侧目录和卡片显示进度。

### 6.8 Next Action CTA

每个 SOP 底部新增明确动作，不只是读完关闭：

- Start SOP → `Create new project`
- Image SOP → `Go to Image tab`
- UGC SOP → `Go to UGC tab`
- Batch SOP → `Go to Auto Content`
- Cinema SOP → `Go to Original Video`
- Clone SOP → `Go to Clone Prompt`

这比 `Export SOP` 更符合用户当前任务。

## 7. 功能需求

### 7.1 SOP 页面状态

新增 / 使用状态：

```js
state.sopTopic
state.sopSearch
state.sopStepAnchor
state.sopProgress
```

`sopProgress` 首期可从 localStorage 读取：

```js
localStorage.getItem("pokaya-sop-progress")
```

### 7.2 搜索

新增：

```js
function searchSopLibrary(query)
```

返回：

```js
{
  topicId,
  topicTitle,
  stepNo,
  stepTitle,
  excerpt
}
```

验收：

- 搜 `UGC` 能看到 UGC SOP。
- 搜 `credit` 能看到相关 step。
- 搜 `extend` 能跳到 UGC extend 说明。

### 7.3 从功能页进入 SOP

现有 `data-sop-target` 应继续保留。

点击后：

```js
set({ page: "sop", sopTopic: target, sopSearch: "", modal: null })
```

验收：

- Image 页点 SOP，进入 SOP Center 并打开 Image。
- UGC 页点 SOP，进入 SOP Center 并打开 UGC。
- Sidebar SOP 默认打开 Start。

### 7.4 步骤锚点

每个 step card 增加稳定 id：

```html
id="sop-step-ugc-11"
```

搜索结果点击后：

- 切换 sopTopic
- 设置 sopStepAnchor
- render 后滚动到对应 step

### 7.5 Progress

每个 SOP 的 checklist 勾选后保存：

```js
{
  "ugc": ["input", "output", "nextAction"]
}
```

验收：

- 勾选后刷新页面仍保留。
- 卡片显示 `3/4 done`。

## 8. 视觉规范

### 8.1 密度

- Header 不超过 128px 高。
- Quick Card 高度 92-108px。
- 正文最大宽度控制在 900-1040px。
- 避免再出现 hero 级大标题。

### 8.2 色彩

沿用当前粉紫品牌，但减少大面积粉底：

- 页面背景保持淡粉。
- 内容卡使用白底。
- 高亮用粉色 border / left accent。
- 主 CTA 用深紫。
- 进度 / ready 状态用绿色或 muted purple，不要所有元素都粉紫。

### 8.3 字体

- 页面 H1：32-42px。
- SOP 正文标题：28-36px。
- 卡片标题：16-18px。
- Step body：15-16px。
- 不使用全大写长标题作为主要阅读标题。

## 9. 移动端要求

- Header 按钮收纳到一行或更多菜单。
- Quick Cards 横向滚动。
- 左侧目录改成 sticky segmented tabs。
- 正文卡片单列。
- Step card 不能被底部 chat / floating support 挡住。
- Search 固定在顶部区域，不占满全屏。

## 10. 数据与埋点

建议记录以下事件：

- `sop_opened`
- `sop_topic_selected`
- `sop_search_used`
- `sop_search_result_clicked`
- `sop_checklist_checked`
- `sop_next_action_clicked`
- `sop_export_clicked`
- `sop_help_clicked`

用于判断哪些 SOP 真正被使用，后续决定教程优先级。

## 11. 验收标准

- 进入 SOP Center 首屏能看到：搜索、推荐路径、紧凑 SOP 卡、当前 SOP 开头。
- 6 张 SOP 卡不再占掉大半屏。
- `Dashboard — Project & Production Summary` 不再以超大标题压住正文。
- 点击任意 SOP 卡，右侧正文即时切换。
- 从功能页点击 SOP 能打开对应主题。
- 搜索 `UGC / credit / extend / prompt` 都能返回相关结果。
- checklist 勾选后刷新仍保留。
- 桌面和移动端无文字溢出、卡片截断、按钮重叠。

## 12. 实施优先级

### P0

- 压缩 Header。
- 缩小 SOP quick cards。
- 缩小正文标题。
- CTA 权重调整。
- 保证功能页跳转到对应 SOP。

### P1

- 增加搜索。
- 增加 recommended path。
- 增加 next action CTA。
- 优化左侧目录为 SOP library + current steps。

### P2

- checklist + localStorage progress。
- 搜索结果 step anchor。
- 埋点。
- Export SOP 收纳和优化。

## 13. 推荐首版落地方案

先做一个“不改内容、只改结构”的版本：

1. 保留现有 SOP 文案函数。
2. 新增 `sopLibrary()` 元数据：短标题、描述、步骤数、预计时间、next action。
3. 改造 `sopPage()` 布局为 compact header + search + cards + reader。
4. 调整 CSS 密度，解决首屏被吃掉的问题。
5. 加 `go to feature` CTA。

这样风险最低，也能最快解决截图里的核心问题。
