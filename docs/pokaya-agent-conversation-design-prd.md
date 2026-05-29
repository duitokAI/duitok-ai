# Pokaya Agent Conversation Design PRD

## 1. 背景

用户截图显示，Agent 聊天区虽然已经从黑色卡片迁移到浅色卡片，但仍然存在浅色文案、Markdown 痕迹和整体视觉混乱的问题。

这不是单一颜色 bug，而是 Agent 回复缺少统一的「对话设计系统」：

- 后端回复内容仍像 Markdown 报告。
- 前端只是把 Markdown 转成 HTML，没有把内容变成产品化组件。
- 一些段落、分隔线、状态信息仍使用低对比色。
- 表格、列表、项目标签、建议动作混在同一个大文本块里。

结果是：用户看到的是一段“半报告半界面”的内容，不像一个能执行任务的 Agent。

## 2. 当前问题

### 2.1 浅色文案仍存在

截图中这些内容很淡：

- 「好的！现在来看你的 workspace 完整情况」
- `---` 分隔线
- 「项目已经生成了 1 张图片...」
- 「你想先做哪个？」
- 底部完成状态条

原因：

- `.agent-message` 的基础颜色已加深，但部分 Markdown block、段落、表格或状态卡有继承/覆盖。
- Agent 输出里用 `---` 做分隔线，渲染后仍像浅色文本。
- 一些强调之外的普通段落没有足够视觉权重。

### 2.2 Agent 输出像 Markdown 报告，不像应用 UI

当前输出包括：

- emoji 图标
- `---`
- 大段自然语言
- bullet list
- markdown table
- 建议列表

这些都被放在同一个消息泡泡里，视觉上不够清晰。

### 2.3 信息层级不清楚

用户需要依次理解：

1. 当前项目是什么
2. 缺什么
3. 排期情况
4. 剩余积分
5. 下一步建议
6. Agent 是否完成

但现在它们都是普通文本块，缺少卡片化层级。

### 2.4 状态卡仍像系统调试信息

底部「已完成」状态条虽然已变浅色，但仍占一块，且与正文主内容关联弱。用户真正关心的是“我现在该做什么”，而不是“Agent run completed”。

## 3. 产品目标

把 Agent 回复从「Markdown 报告」升级为「可操作工作台对话」。

具体目标：

- 所有文本清晰可读，不出现淡到像 disabled 的正文。
- Agent 回复自动拆成结构化视觉模块。
- 用户 3 秒内能看懂：当前状态、缺口、下一步。
- 完成状态弱化，确认/扣费/风险状态强化。
- 减少 emoji 和 Markdown 原始痕迹。

## 4. 设计原则

1. **不要让用户读报告**
   Agent 应该像运营助理汇报重点，而不是丢一篇 Markdown。

2. **每个回复只能有一个主任务**
   workspace 检查就展示检查结果；内容计划就展示计划；扣费就展示确认。

3. **文字默认高对比**
   普通正文不允许低于 `rgba(31, 6, 38, 0.86)`。

4. **Markdown 是输入格式，不是最终 UI**
   `---`、表格、粗体符号、内部状态都不应直接成为用户界面。

5. **建议动作按钮化**
   “补齐项目资料 / 生成内容 / 安排排期”应该是按钮，不只是文字。

## 5. 范围

### 本期包含

- Agent 消息渲染样式重构。
- Markdown 分隔线处理。
- workspace 检查类回复组件化。
- 建议动作按钮化。
- 完成状态条弱化。
- 所有 Agent 聊天文本颜色统一。

### 本期不包含

- 不改 DeepSeek 模型供应商。
- 不改生成/扣费逻辑。
- 不改 TikTok 发布逻辑。
- 不做完整多轮 Agent memory UI。

## 6. 需求

### 6.1 消息基础排版

Agent message 的默认规则：

- 普通段落颜色：`rgba(31, 6, 38, 0.9)`
- 次级说明颜色：`rgba(31, 6, 38, 0.74)`，但只能用于 caption/small。
- 字号：正文 `16px`，移动端不低于 `15px`。
- 字重：正文 `700`，重点 `900+`。
- 行高：`1.58`。

验收：

- 截图里所有普通句子都清晰可读。
- 不允许出现浅灰到看不清的正文。

### 6.2 Markdown 分隔线处理

当 Agent 输出中出现单独一行：

```text
---
```

前端不要显示为文字。

方案：

- 在 `agentMessageMarkdown()` 中识别 `/^-{3,}$/`。
- 渲染为 `<hr class="agent-message-rule">`。
- CSS 中把它做成很浅的水平线，或直接隐藏。

推荐：

- workspace 回复中直接隐藏分隔线。
- 不让 `---` 变成淡色文字。

验收：

- 用户界面不再看到 `---`。

### 6.3 Workspace Inspect 回复组件化

当 Agent 回复包含 workspace 检查类内容时，前端应渲染成结构化模块，而不是纯文本。

识别方式：

- 后端 inspect tool 已有 `workspace_inspect` card 时优先使用 card。
- 如果没有 card，但文本里包含「当前项目」「剩余积分」「排期情况」「建议」等关键词，前端也应按普通 Markdown 渲染但加强样式。

理想组件：

1. Summary strip
   - 当前项目
   - 已生成结果数
   - 排期数量
   - 剩余 credits

2. Missing checklist
   - 产品名
   - 目标人群
   - 图片是否已排期

3. Schedule table/card
   - 标题
   - 时间
   - 状态

4. Next action buttons
   - 补齐项目信息
   - 生成更多内容
   - 安排排期

验收：

- workspace 检查回复不再是一整段文本。
- 用户能一眼看到缺什么和下一步。

### 6.4 建议动作按钮化

如果 Agent 回复里有类似：

```text
1. 补齐项目信息 — ...
2. 生成更多内容 — ...
3. 安排排期 — ...
```

前端应提供按钮区：

- `补齐项目信息`
- `生成更多内容`
- `安排排期`

点击按钮应填入 Agent 输入框或直接发送对应 prompt。

验收：

- 建议动作从纯文本升级为可点击 action chips。

### 6.5 表格设计优化

当前 Markdown 表格太大、太像后台表格。

要求：

- 表头颜色加深。
- 行内文字不低于 `rgba(31, 6, 38, 0.86)`。
- 状态可 pill 化：Ready / Draft。
- 移动端表格可横滑或转成卡片。

验收：

- 表格不再抢过主体正文。
- 移动端不溢出。

### 6.6 完成状态弱化

completed run card 不应占据主要视觉。

要求：

- 默认只显示一行小状态：`已完成 · 已回复`
- 或放在消息底部右侧。
- 不展示步骤列表。
- 不展示 intent。

验收：

- 用户注意力在 Agent 正文和下一步建议上，而不是 run card。

### 6.7 等待确认强化

当 Agent 等待用户确认时，状态卡才应该变强。

要求：

- 扣费确认显示 credits。
- 发布确认显示平台影响。
- 按钮文案中文化：
  - `确认并扣 credits`
  - `确认执行`
  - `取消`

验收：

- 用户明确知道点击后会发生什么。

## 7. 内容规范

后端/Agent prompt 应要求模型：

- 不要输出 `---` 分隔线。
- 不要滥用 emoji。
- 不要输出 Markdown 表格，除非确实是排期/数据。
- workspace 检查回复使用固定结构：

```text
当前情况：
- 当前项目：
- 已有内容：
- 排期：
- 剩余 credits：

还缺：
- ...

建议下一步：
1. ...
2. ...
3. ...
```

更理想：后端返回结构化 `cards`，前端少依赖文本解析。

## 8. 技术方案

### 8.1 前端

修改文件：

- `src/main.js`
- `src/styles.css`

重点函数：

- `agentMessageMarkdown()`
- `agentMessageArticle()`
- `agentRunPanel()`
- `agentToolCard()`

新增/优化：

- `agent-message-rule`
- `agent-action-chips`
- `agent-workspace-summary`
- `agent-run-card[data-agent-run-status="completed"]`
- `agent-message-table`

### 8.2 后端

修改文件：

- `server.mjs`

重点：

- DeepSeek system prompt 增加内容格式约束。
- `inspect_workspace_state` 返回更强 card 数据。
- Agent 回复尽量少输出 Markdown 表格。

## 9. 验收标准

### 可读性

- 所有正文肉眼清楚可读。
- 不出现浅灰正文。
- 不出现原始 `---`。

### 结构

- workspace 检查有明显 summary / missing / next actions。
- completed 状态不抢视觉。
- waiting confirmation 明显突出。

### 技术

- `npm run build` 通过。
- 不新增第三方依赖。
- 不影响 credit confirmation 逻辑。
- 不提交无关截图和测试视频。

## 10. 优先级

P0：

- 修复浅色正文。
- 隐藏/转换 `---`。
- completed 状态弱化。
- 表格和 run card 高对比。

P1：

- 建议动作按钮化。
- workspace inspect card 化。
- 后端 prompt 禁止 Markdown 分隔线和过度 emoji。

P2：

- 移动端表格转卡片。
- Agent 回复模板化。
- 支持“查看执行详情”折叠展开。
