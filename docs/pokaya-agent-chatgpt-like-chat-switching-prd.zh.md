# Pokaya Agent Chat 切换体验优化 PRD

## 1. 背景

当前 Pokaya Agent 的 chat 列表已经具备 Recents、新建 chat、恢复历史 chat、自动标题、上下文摘要等能力，但用户在频繁切换 chat 时仍会遇到不稳定体验：

- 新 chat 可能继承另一个 chat 的上下文、产品方向或任务记忆。
- 切换历史 chat 后，左侧标题、选中态、当前消息区、URL、localStorage、后端 agentChats 之间可能不同步。
- 同一条 chat 在不同点击/恢复/同步时可能表现为不同会话。
- 用户预期是类似 ChatGPT：每个 chat 是独立线程，点击哪个就进入哪个，新建 chat 就是干净的新线程。

本 PRD 的目标不是继续零散修 bug，而是把 Pokaya Agent 的 chat 体验升级成稳定的“ChatGPT 式会话系统”。

## 2. 产品目标

让 Pokaya Agent 的 chat 切换体验达到类似 ChatGPT 的稳定标准：

1. 新 chat 永远是干净线程，不自动混入其他 chat 的上下文。
2. 点击任意历史 chat 后，消息区、标题、URL、选中态、后端记录必须一致。
3. 一个 chat 的记忆、摘要、运行中任务、附件、确认卡片只属于这个 chat。
4. 切换 chat 时不能闪烁、不能重复生成标题、不能把当前输入错误保存到别的 chat。
5. 用户可以放心像 ChatGPT 一样开很多 chat，每条 chat 都是可恢复、可命名、可删除的独立工作线程。

## 3. 非目标

- 不重做 Agent 整体 UI 视觉风格。
- 不引入新前端框架、路由框架或状态管理库。
- 不改变 Pokaya 的内容生成、扣费、确认卡片规则。
- 不删除现有历史 chat 数据，除非做显式迁移和备份。

## 4. 现有问题归因

### 4.1 状态来源过多

当前 chat 状态分散在：

- `state.agentMessages`
- `state.activeAgentHistoryId`
- `state.activeAgentDraftId`
- `state.agentContextSummary`
- `localStorage[pokaya-agent-messages]`
- `localStorage[pokaya-agent-context-summary...]`
- `localStorage[pokaya-agent-history]`
- `db.agentChats`
- URL `/studio/agent/chat/:id`

这些状态各自更新，缺少一个明确的“当前 chat 真源”。

### 4.2 新 chat 和历史 chat 的生命周期不清晰

新 chat 在第一条消息之前是 draft；第一条消息后会被保存成正式 chat。但当前逻辑中 draft id、正式 chat id、URL、摘要迁移、后端保存可能不是一个原子流程。

### 4.3 Chat 切换不是原子操作

恢复历史 chat 时会同时做：

- 保存当前 chat
- 合并历史列表
- 更新 localStorage
- 更新 state
- 更新 URL
- render
- 滚动到底部

如果其中任一步被异步同步、后台 `/agent-chats` 返回、标题生成或其他 render 打断，就可能出现 UI 与真实 active chat 不一致。

### 4.4 后端上下文仍可能污染

即使前端清空摘要，后端如果默认使用当前内容设置或第一个内容设置，也可能让模型误以为新 chat 仍属于旧产品。

## 5. 目标体验定义

### 5.1 新建 Chat

用户点击 New Chat 后：

- 消息区立即清空。
- 输入框获得焦点。
- 左侧可出现一个 draft 行，也可以不出现；但一旦出现，必须是未保存草稿状态。
- URL 变为 `/studio/agent`。
- `activeAgentHistoryId = null`。
- 新 draft 拥有自己的 `draftId`。
- 不读取任何旧 chat 的 messages、summary、attachments、confirmation、agentRun。
- 第一条消息发送时才创建正式 chat id。

### 5.2 发送第一条消息

用户在新 chat 发送第一条消息后：

- 生成一个正式 chat id。
- URL 变为 `/studio/agent/chat/:id`。
- 左侧 Recents 出现该 chat。
- 该 chat 被标记为 isolated，直到用户主动选择/创建内容设置。
- 后端 `/api/agent` 不应默认注入其他 chat 或 workspace 的内容记忆。

### 5.3 切换历史 Chat

用户点击某条历史 chat 后：

- 选中态立即切换到该 chat。
- 消息区只展示该 chat 的 messages。
- URL 与该 chat id 一致。
- 当前 chat 的未完成输入应保存为 draft，不应写入被点击的历史 chat。
- 不触发标题重新生成，除非标题为空或默认标题。
- 不触发新一轮 Agent 回复。
- 不继承上一个 chat 的 typing、busy、queue、attachments、confirmation modal。

### 5.4 删除 Chat

用户删除 chat 后：

- 如果删除的是非当前 chat，只从列表移除，不影响当前消息区。
- 如果删除的是当前 chat，回到干净 New Chat 状态。
- 后端删除成功后同步；失败时给用户提示并恢复列表。

### 5.5 重命名 Chat

用户重命名后：

- 手动标题优先级最高。
- 后端自动标题不得覆盖手动标题。
- 切换 chat 不得改变已存在的标题。

## 6. 方案设计

### 6.1 建立 Chat Session 真源

新增统一概念：`AgentChatSession`。

建议字段：

```js
{
  id,
  userId,
  title,
  manualTitle,
  messages,
  contextSummary,
  isolatedContext,
  status,
  draftInput,
  attachments,
  activeRunId,
  createdAt,
  updatedAt,
  lastOpenedAt
}
```

前端状态只保留当前必要渲染字段，但任何切换都从 `AgentChatSession` 读取。

### 6.2 明确 Draft 与 Saved Chat

状态分为三类：

- `draft`: 新 chat，未发送消息。
- `saved`: 已有正式 chat。
- `running`: 当前 chat 有 Agent 回复或工具执行中。

Draft 不写入后端，直到第一条消息发送。

### 6.3 Chat 切换必须使用单入口

新增或重构为一个单入口函数：

```js
switchAgentChat(targetChatId, options)
```

该函数负责：

- flush 当前 chat 的 draft/input。
- 取消当前 typing animation。
- 清空当前 attachments/queue/confirmation。
- 读取目标 chat snapshot。
- 更新 state。
- 更新 URL。
- render。

禁止其他地方直接修改 `activeAgentHistoryId + agentMessages + URL` 组合。

### 6.4 消息发送绑定 Chat ID

发送 `/api/agent` 时必须带：

- `chatId`
- `clientMessageId`
- `isolatedContext`
- `contextSummary` scoped by chat id

后端返回时也必须带 `chatId`。前端只允许把返回写入当前仍然 active 的同一个 chat。

如果用户在 Agent 回复期间切换了 chat：

- 回复可以继续完成并保存到原 chat。
- 当前屏幕不应被原 chat 的返回覆盖。
- Recents 中该 chat 可显示运行状态。

### 6.5 后端上下文隔离

后端 `/api/agent` 需要遵守：

- 如果 `isolatedContext = true`，不得 fallback 到第一个 content setup。
- 如果 `chatId` 有独立 summary，只用该 chat 的 summary。
- workspace JSON 只在非 isolated 且用户明确处于某个内容设置时注入。
- 所有 agentRun 必须绑定 `chatId`。

### 6.6 标题生成策略

标题生成改成幂等策略：

- 第一条 user message 后生成一次。
- 如果标题为空、`Agent Chat`、`Untitled Chat`，允许自动生成。
- 已有正常标题不再自动覆盖。
- 手动标题永远不自动覆盖。
- 切换 chat 不触发标题生成。

## 7. UI / UX 要求

### 7.1 Recents 列表

- 当前选中 chat 高亮稳定，不因后端同步闪烁。
- 列表按 `lastOpenedAt` 或 `updatedAt` 排序，规则固定。
- 标题最多两行，时间固定格式。
- 正在回复的 chat 可显示轻量状态，但不抢占当前页面。

### 7.2 消息区

- 切换 chat 时使用即时 snapshot，不等待后端。
- 如果后端稍后返回旧 chat 更新，只更新列表，不覆盖当前消息区。
- 如果目标 chat 数据缺失，显示 loading 或恢复失败提示，而不是显示上一个 chat 的内容。

### 7.3 输入框

- 每个 chat 有独立 draft input。
- 切换回来时恢复该 chat 未发送输入。
- 新 chat 输入框为空。

## 8. 技术执行拆分

### Phase 1：状态审计与保护

- 梳理所有修改 `agentMessages`、`activeAgentHistoryId`、`agentContextSummary`、URL 的入口。
- 加 runtime guard：异步返回必须校验 `chatId`。
- 禁止非 switch 函数直接切换 active chat。

### Phase 2：Chat Session Store

- 引入统一 session normalization。
- 将 localStorage history、backend agentChats、active draft 合并为稳定 store。
- 每条 session 保存独立 `contextSummary`、`draftInput`、`isolatedContext`。

### Phase 3：切换流程重构

- 实现 `switchAgentChat` 单入口。
- 实现 `startNewAgentChat` 单入口。
- 实现 `persistActiveAgentChatSnapshot`。
- 改造 restore/delete/rename/new chat 行为。

### Phase 4：后端 chatId 绑定

- `/api/agent` 接收并返回 `chatId`。
- agentRun、confirmation、tool results 绑定 chatId。
- isolated chat 禁止 workspace fallback。

### Phase 5：回归验证

- 覆盖新建、切换、删除、重命名、运行中切换、刷新恢复、多 tab 同步。

## 9. 验收标准

### 9.1 基础验收

- 新建 chat 后问“帮我生成视频”，不会提到旧产品名。
- 连续点击两个历史 chat 20 次，标题、消息区、URL、选中态始终一致。
- 切换 chat 不会触发新的 Agent 回复。
- 切换 chat 不会改变标题。
- 刷新页面后，URL 指向哪个 chat，就恢复哪个 chat。

### 9.2 上下文隔离验收

- Chat A 讨论 Bleu de Chanel。
- New Chat 中问“帮我做图”，Agent 不应自动使用 Bleu de Chanel。
- Chat B 讨论宠物用品。
- 切回 Chat A 后，仍恢复 Bleu de Chanel 的上下文。
- 切回 Chat B 后，仍恢复宠物用品上下文。

### 9.3 异步验收

- Chat A 正在生成回复时切到 Chat B，Chat A 的回复完成后不得覆盖 Chat B 消息区。
- Chat A 的结果只更新 Chat A 历史记录。
- 运行中的 confirmation modal 不应出现在其他 chat。

### 9.4 数据验收

- 每条 chat 在前端和后端的 id 一致。
- 每条 chat 有独立 contextSummary。
- 后端 agentRun 有 chatId。
- localStorage 不再使用全局摘要作为当前 chat 真源。

## 10. 风险与注意事项

- 现有用户已经有历史 chat，需要兼容旧数据。
- 旧 localStorage 的全局 summary 需要迁移或忽略，避免继续污染。
- 如果直接大改所有 Agent 状态，容易引入生成流程回归；建议按 Phase 小步提交。
- 运行中任务与 chat 切换的关系必须谨慎处理，避免用户以为任务丢失。

## 11. 推荐优先级

P0：

- 新 chat 不串上下文。
- 切换 chat 后消息区、URL、选中态一致。
- 异步返回不能覆盖当前 chat。

P1：

- 每个 chat 独立 draft input。
- running chat 状态显示。
- 删除/重命名体验完善。

P2：

- 多 tab 同步优化。
- 历史搜索、pin、archive。
- Chat 分组或内容设置关联。

## 12. 最终目标一句话

Pokaya Agent 的 chat 要像 ChatGPT 一样：每条对话都是独立、可恢复、可切换、不会串线的工作线程；用户点击哪里，当前屏幕、URL、记忆、输入框和后端状态就一致指向哪里。
