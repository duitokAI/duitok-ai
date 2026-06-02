# Pokaya Agent 页面设计与排版优化 PRD

## 1. 背景

当前 Agent 页面采用左右双栏：

- 左侧：Agent 介绍、3D 工作区/休息区视觉、状态说明。
- 右侧：Pokaya Agent 聊天窗口、历史记录、新对话、清空按钮、输入框。

从当前截图看，页面已经具备“Agent operator”概念，但实际视觉体验仍像两个巨大卡片并排：

- 左侧宣传感太重，占用大量屏幕，却没有直接帮助用户开始任务。
- 右侧聊天区域大面积空白，首屏没有明确下一步动作。
- 顶部按钮过大，历史记录、新对话、删除按钮抢占标题区。
- 左侧英文主标题、马来文状态、中文状态混在同一屏，语言体验不统一。
- WhatsApp 客服悬浮按钮遮挡页面右下角，和 Agent 输入区域竞争注意力。
- 整体卡片边界、阴影、圆角、留白偏大，信息密度低。

本 PRD 目标是把 Agent 页面从“展示型页面”优化为“可直接工作的 Agent 控制台”。

## 2. 目标

### 2.1 产品目标

- 用户一进入 Agent 页面，就知道可以让 Agent 做什么。
- 用户不需要阅读长篇说明，也能直接发出第一个任务。
- 页面视觉重点从“介绍 Agent”转为“让 Agent 开始工作”。
- Agent 当前状态、最近动作、可用任务、聊天输入四件事要清楚分层。
- 页面在 desktop 和 mobile 上都保持紧凑、清晰、可操作。

### 2.2 体验目标

- 首屏减少无效空白 40% 以上。
- 聊天输入框始终可见，但不占用过多高度。
- 历史记录、新对话、清空入口不再像主要 CTA。
- 3D mascot 保留，但作为状态面板，而不是占据半个页面的宣传图。
- 用户看到的是“待命中 / 正在理解 / 正在执行 / 需要确认 / 已完成”，而不是混杂的英文或内部表达。

## 3. 不做范围

- 不重做 Agent 后端工作流。
- 不改 Agent 工具调用逻辑。
- 不新增新的 AI provider。
- 不重做整站 design system。
- 不把 WhatsApp 客服移除，只调整它在 Agent 页面里的显示策略。

## 4. 当前问题诊断

### 4.1 左侧信息过大但价值不够

当前左侧包含：

- `Pokaya Agent`
- `Your AI operator for TikTok Shop content.`
- `Chat on the right...`
- 大面积 3D 图
- `MASCOT SEDANG REHAT...`
- 一段说明文字

问题：

- 这更像 landing page，不像 studio 内部工作台。
- 用户已经在 Agent 页面，不需要再被大标题说服。
- 3D 图的状态很可爱，但尺寸过大，挤压真实工作区。
- 左侧底部说明离视觉太远，读起来像海报文案。

### 4.2 右侧聊天区首屏空白

当前右侧标题区之后，只有一句提示文案，下面是巨大空白。

问题：

- 新用户不知道该输入什么。
- 老用户觉得页面很空，不像一个可执行系统。
- 没有展示 workspace context、可执行任务、最近结果或下一步建议。

### 4.3 顶部操作按钮层级错误

`历史记录`、`新对话`、`删除` 都在标题右侧，且视觉重量接近主按钮。

问题：

- 标题区拥挤。
- 删除按钮过于突出，容易造成误点焦虑。
- `历史记录 1` 不应该长期占据主视觉位置。

### 4.4 输入区过重

输入框底部固定在右侧卡片内，整体很宽，发送按钮很大。

问题：

- 输入框像独立表单，不像聊天工具。
- 没有 quick action chips 辅助用户输入。
- 空状态时输入区和内容区之间距离太大。

### 4.5 语言不统一

同一屏同时出现：

- 英文标题
- 英文说明
- 马来文状态
- 中文状态 badge
- 中文/英文按钮

问题：

- 用户会感觉系统没有跟随语言设置。
- Agent 页面是高频操作页面，应优先使用当前语言。

### 4.6 客服按钮干扰 Agent 页面

WhatsApp 客服按钮在右下角大面积悬浮。

问题：

- 它和 Agent 输入区位置接近，视觉冲突。
- Agent 页面本身就是求助/执行入口，客服按钮不应抢主任务。

## 5. 设计原则

### 5.1 Agent 页面不是 landing page

进入 Studio 后的 Agent 页面应是工作台，不是营销页。

设计上要减少超大标题、宣传文案、巨大留白，增加任务入口、状态反馈、上下文摘要。

### 5.2 左侧是状态，右侧是对话

左侧职责：

- 当前 Agent 状态。
- Workspace 摘要。
- 最近动作。
- 建议下一步。

右侧职责：

- 聊天记录。
- Agent 回复。
- 用户输入。
- 任务确认。

### 5.3 空状态也要可操作

没有聊天记录时，不显示巨大空白，而是显示：

- 3-5 个常用任务。
- 当前 workspace 摘要。
- 一句短提示。

### 5.4 所有状态文案用户化

禁止使用：

- `Idle mode`
- `Standby`
- `Mascot sedang rehat...`
- `Thinking and calling tools...`

统一使用当前语言，例如中文：

- `待命中`
- `正在理解你的需求`
- `正在检查 workspace`
- `需要你确认`
- `已完成`

## 6. 页面信息架构

### 6.1 Desktop 推荐布局

使用 `Agent Workspace Shell`：

```text
-------------------------------------------------------------+
| Agent Header                                                |
| Pokaya Agent    待命中                         新对话  ⋯   |
+----------------------------+--------------------------------+
| Left Status Rail           | Main Chat Panel                 |
|                            |                                |
| Agent Status Card          | Empty State / Messages          |
| - mascot compact visual    |                                |
| - current state            | Quick task chips                |
|                            |                                |
| Workspace Summary          | Chat input fixed bottom         |
| - credits                  |                                |
| - current project          |                                |
| - pending drafts           |                                |
|                            |                                |
| Suggested Next Steps       |                                |
+----------------------------+--------------------------------+
```

### 6.2 推荐比例

- 页面最大宽度：`min(1500px, 100%)`
- 左侧状态栏：`360px - 420px`
- 右侧聊天区：剩余宽度
- 两栏 gap：`20px - 24px`
- 卡片圆角：`16px - 20px`
- 页面 padding：desktop `24px - 32px`，mobile `14px - 16px`

### 6.3 Mobile 布局

Mobile 不做左右双栏。

顺序：

1. 顶部 Agent Header。
2. 紧凑状态卡。
3. Quick tasks 横向滚动。
4. 聊天记录。
5. 底部 sticky 输入框。

## 7. 具体需求

### 7.1 顶部 Header 重构

当前：

- 左侧大标题在左卡。
- 右侧聊天卡内还有一个 `Pokaya Agent` 标题。

优化后：

- 页面只保留一个全局 header。
- 标题：`Pokaya Agent`
- 副标题：`帮你生成内容、创建排期、检查 workspace`
- 状态 pill：`待命中 / 工作中 / 需要确认`
- 操作区：
  - `新对话`
  - `历史`
  - `更多`

删除按钮放进更多菜单，不直接暴露在一级界面。

### 7.2 左侧 Agent 状态卡

保留 3D mascot，但改为紧凑状态卡。

内容：

- 顶部：状态 badge，例如 `待命中`
- 中部：3D mascot 或静态图，控制高度 `220px - 280px`
- 底部：一句状态说明，例如：
  - `我现在在待命。你发一句话，我会先理解需求，再决定是否需要问你确认。`

不再显示超大宣传标题。

### 7.3 Workspace 摘要卡

左侧增加 `Workspace 摘要`：

- 当前项目
- 剩余 credits
- 最近结果数量
- 待排期数量
- 今日建议

示例：

```text
Workspace
项目：赌博
Credits：83
结果：1 个图片
排期：3 个帖子
下一步：补产品名和目标人群
```

如果没有项目：

```text
还没有项目
可以先让 Agent 帮你创建一个产品项目。
```

### 7.4 Quick Task Chips

聊天空状态和输入框上方展示可点击任务：

- `检查今天还缺什么`
- `创建 7 天内容计划`
- `把最新图片安排到今晚发布`
- `新建一个产品项目`
- `生成视频 prompt`

规则：

- 最多显示 5 个。
- 根据 workspace 状态动态排序。
- 点击后填入输入框，不自动发送，避免误操作。

### 7.5 聊天空状态优化

当前空状态只有一句：

`Ask me to generate UGC...`

优化为更像工作台：

```text
你可以直接叫我做事

我会先理解需求；如果信息不够，会先问你；如果要扣 credits，会让你确认。
```

下面展示 quick tasks。

### 7.6 聊天消息区域

聊天区域视觉要求：

- 用户消息靠右，浅紫底。
- Agent 消息靠左，白底或浅色底。
- Agent 长回复默认折叠摘要，支持展开。
- agentRun 卡片默认只显示总结，不展开 confidence/raw timeline。
- 需要确认时显示高优先级确认卡。

禁止：

- 大面积纯空白。
- 低对比度浅灰文字。
- 把内部执行状态大面积展开给用户。

### 7.7 输入框优化

输入区固定在聊天卡底部，但更轻：

- 高度默认 `56px - 64px`
- 多行最多展开到 `120px`
- placeholder 根据语言：
  - 中文：`告诉 Agent 你想做什么...`
  - 英文：`Tell Agent what to do...`
  - 马来文：`Beritahu Agent apa nak buat...`
- Enter 发送。
- Shift + Enter 换行。
- 发送按钮保持 icon button，悬停显示 tooltip。

### 7.8 历史记录优化

`历史记录 1` 不放在主按钮里。

建议：

- Header 右侧显示 `历史` 图标按钮。
- 点击打开右侧 drawer 或 popover。
- 历史 drawer 内容：
  - 最近 5 个会话
  - 每个显示摘要、时间、消息数
  - `保留项目记忆并新建对话`
  - `清空本次聊天`

### 7.9 客服按钮策略

在 Agent 页面：

- WhatsApp 客服按钮默认缩小为圆形图标。
- 不显示大号 `人工客服 WHATSAPP` 文案。
- 鼠标 hover 或点击后展开。
- mobile 上放入更多菜单或底部次级入口。

目的：

- Agent 输入区永远是第一行动入口。
- 客服是 fallback，不是主 CTA。

### 7.10 语言统一

所有 Agent 页面文案必须走现有 i18n copy。

中文页面禁止出现：

- `Your AI operator...`
- `Idle mode`
- `Standby`
- `Ask me to...`

马来文页面可出现马来文。
英文页面可出现英文。

默认跟随 `state.lang`。

## 8. 视觉规范

### 8.1 色彩

继续使用 Pokaya 的紫色 + 粉色体系，但降低大面积紫色文字压力。

推荐：

- 主文字：`#2a0633`
- 次文字：`rgba(42, 6, 51, 0.68)`
- 边框：`rgba(95, 0, 103, 0.12)`
- 背景：`#fffafd`
- 状态绿：`#25c978`
- 警告黄：`#f5b84b`
- 确认粉：`#f35b6c`

### 8.2 字体层级

页面内不使用 landing page 级别大标题。

- Header title：`34px - 42px`
- Section title：`18px - 22px`
- Body：`15px - 17px`
- Button：`14px - 16px`
- Badge：`12px - 14px`

### 8.3 卡片

- 不要卡片套卡片。
- 左侧每个信息块是独立 panel。
- 右侧聊天是一个主 panel。
- 圆角不超过 `20px`。
- 阴影减少，避免整页漂浮感。

### 8.4 留白

- 页面垂直留白减少。
- 聊天空状态不要居中偏上后留下大空白。
- 输入框与内容区之间保持合理距离。

## 9. 交互状态

### 9.1 待命中

显示：

- 状态：`待命中`
- 说明：`发一句话，我会先判断要做什么。`
- quick tasks 可用。

### 9.2 正在理解

显示：

- 状态：`正在理解`
- 简短进度：`正在判断是否需要项目、素材或确认。`
- 输入框可禁用或允许继续输入排队，第一版建议禁用。

### 9.3 正在执行

显示：

- 状态：`正在执行`
- 当前步骤：`检查 workspace / 创建计划 / 保存排期`
- 不展示 confidence 百分比给普通用户。

### 9.4 需要确认

显示确认卡：

- 将扣多少 credits。
- 将执行什么动作。
- 影响哪个项目。
- `确认执行`
- `取消`

### 9.5 已完成

显示：

- 完成摘要。
- 创建/更新的对象。
- 下一步按钮。

## 10. 工程实现建议

### 10.1 前端组件拆分

建议在 `src/main.js` 内先按函数拆分，不必立即引入框架组件化：

- `agentWorkspacePage()`
- `agentHeader()`
- `agentStatusRail()`
- `agentStatusCard()`
- `agentWorkspaceSummary()`
- `agentQuickTasks()`
- `agentChatShell()`
- `agentHistoryDrawer()`

### 10.2 CSS 分层

新增或整理以下 class：

- `.agent-workspace-shell`
- `.agent-topbar`
- `.agent-status-rail`
- `.agent-status-card`
- `.agent-workspace-summary`
- `.agent-chat-shell`
- `.agent-empty-state`
- `.agent-quick-task-row`
- `.agent-history-drawer`

避免继续在旧 `.agent-page-hero` 上堆 patch。

### 10.3 状态数据

复用现有 state：

- `agentMessages`
- `agentBusy`
- `agentVisualPhase`
- `agentTaskMode`
- `agentHistorySessions`
- `db.projects`
- `db.billing`
- `generationJobs`

新增可选 state：

- `agentHistoryDrawerOpen`
- `agentQuickTaskDraft`

## 11. 验收标准

### 11.1 Desktop

- 1440px 宽度下，首屏不再出现巨大空白聊天区。
- 左侧 mascot 高度控制在 280px 内。
- 右侧至少显示空状态说明 + quick tasks + 输入框。
- 顶部删除按钮不再一级展示。
- WhatsApp 客服不遮挡输入区。
- 中文语言下，页面主要文案全部为中文。

### 11.2 Mobile

- 390px 宽度下无横向滚动。
- 输入框 sticky 在底部，发送按钮不挤压 placeholder。
- Quick tasks 可横向滚动或换行。
- Mascot 不超过首屏高度的 35%。

### 11.3 可访问性

- 所有 icon-only 按钮有 `aria-label` 或 tooltip。
- 文本对比度满足可读要求。
- 发送按钮、历史按钮、新对话按钮可键盘操作。

### 11.4 回归检查

- Agent 发消息正常。
- Enter 发送、Shift + Enter 换行正常。
- 新对话正常。
- 历史记录正常。
- 清空上下文正常。
- 需要确认的 credit 动作仍会弹确认卡。
- Agent 工作状态切换正常。

## 12. 分阶段执行

### Phase 1：布局和文案

- 重构 Agent 页面为 topbar + status rail + chat shell。
- 移除 landing page 风格大标题。
- 统一中文文案。
- 调整客服按钮在 Agent 页的展示。

### Phase 2：空状态和 quick tasks

- 增加 workspace summary。
- 增加 quick task chips。
- 点击 chip 填入输入框。
- 空状态不再大面积留白。

### Phase 3：历史和长上下文体验

- 历史记录改 drawer/popover。
- 清空聊天入口放入更多菜单。
- 长回复折叠优化。
- 保留项目记忆、新对话、清空本次上下文三个动作清晰区分。

### Phase 4：移动端和 QA

- mobile 单列布局。
- Playwright 截图检查 desktop/mobile。
- 检查语言、空状态、工作状态、确认卡。

## 13. 成功标准

这个 PRD 完成后，Agent 页面应该看起来像：

> 一个正在待命的 TikTok Shop 内容运营工作台。

而不是：

> 左边一张 Agent 宣传海报，右边一个空聊天窗口。

