# Pokaya Agent 反馈学习与内容表现记忆 PRD

最后更新：2026-05-29

## 1. 背景

Pokaya Agent 当前已经具备较完整的智能工作流：

- 使用 `deepseek-v4-pro`。
- 已接入 `web_search` 和 `trend_research`。
- 能进行趋势研究、内容策略建议、项目记忆、内容计划、视频 prompt、排期草稿和生成动作。
- 前端已有 Agent 工具卡片、执行状态、确认机制、undo 和安全边界。

现在 Agent 的智能主要来自：

- 模型能力。
- 搜索结果。
- Prompt 和工具规则。
- 当前 workspace 状态。

但它还缺少一层最重要的 Pokaya 专属大脑：

**它不知道哪些建议在 Pokaya 里真的被用户采用、保存、生成、排期或放弃。**

所以它仍然可能给出“看起来合理但不一定被用户采用”的建议。

下一阶段目标是让 Agent 从“会建议”升级成“会根据用户行为和内容结果持续变聪明”。

## 2. 产品目标

### 2.1 用户侧目标

- Agent 能记住用户喜欢什么内容风格、常用语言、产品方向和拍摄难度偏好。
- Agent 能根据用户过去保存、生成、排期和删除的行为，推荐更适合的内容。
- Agent 能少给泛泛建议，多给“你之前更常采用这种打法”的建议。
- Agent 能把成功内容沉淀成模板，帮助用户复用。
- 用户能看到 Agent 为什么推荐这个方向，而不是黑箱输出。

### 2.2 运营侧目标

- Pokaya 团队能看到哪些 Agent 建议被采用。
- 能识别高采用率的 trend、hook、video angle、product category。
- 能把成功案例沉淀为模板库。
- 能判断 Agent 哪些回答经常被忽略或 undo。
- 能持续优化内容 SOP，而不是只靠人工感觉。

### 2.3 系统侧目标

- 建立 Agent 行为反馈事件体系。
- 建立项目级、用户级和全局级的内容表现记忆。
- 将反馈数据用于 Agent 的下一次决策。
- 保持隐私隔离，避免跨用户泄露。
- 不依赖外部平台真实播放量也能先做“Pokaya 内部采用率”学习。

## 3. 非目标

本阶段不做：

- 自动抓取 TikTok 播放量、GMV、转化率。
- 跨用户暴露具体案例、项目名、产品名。
- 完全自动训练或微调模型。
- 自动替用户删除、发布或批量生成内容。
- 复杂 BI 后台。
- 推荐系统大规模重构。

本阶段只做轻量、可审计、可解释的反馈学习闭环。

## 4. 核心问题

### 4.1 Agent 不知道用户是否采纳

Agent 现在可能创建：

- trend research。
- content plan。
- video prompt。
- schedule drafts。
- generated result。

但系统没有明确记录用户后续行为：

- 用户是否复制了 prompt。
- 用户是否点击生成。
- 用户是否保存为项目记忆。
- 用户是否创建排期。
- 用户是否 undo。
- 用户是否删除结果。

这些行为才是用户真实偏好的信号。

### 4.2 Agent 没有“成功模板”

如果某类内容多次被用户采纳，例如：

- `clean girl morning routine`
- `3 rental room upgrade items`
- `POV problem hook`

Agent 应该下次更优先推荐，而不是每次重新从零思考。

### 4.3 Memory 太静态

当前 `agentMemory` 主要保存产品、人群、语言、语气。它还没有保存：

- 用户偏好的 hook 类型。
- 用户常用视频长度。
- 用户常选的视觉风格。
- 用户不喜欢的建议。
- 被采用过的趋势方向。

### 4.4 缺少反馈质量指标

团队现在无法回答：

- 哪种 Agent tool 最常被用户继续执行？
- 哪些 trend research 最容易转内容计划？
- 哪些 hooks 被复制最多？
- 哪些 Agent 结果最常被 undo？
- 用户觉得 Agent 不聪明时，到底卡在哪一层？

## 5. 用户故事

### 5.1 个性化建议

作为卖家，
当我多次选择“家居美学 + soft sell”方向，
我希望 Agent 以后优先给我这种风格的内容，
而不是每次都给完全通用的 TikTok 建议。

### 5.2 成功内容复用

作为内容运营者，
当我之前保存过一个表现好的视频 prompt，
我希望 Agent 下次能说“可以沿用上次的 morning routine 框架”，
并快速变体出新的产品版本。

### 5.3 低质量建议减少

作为用户，
当我经常 undo 或删除某类 Agent 结果，
我希望 Agent 以后少推荐这种方向。

### 5.4 团队优化 Agent

作为 Pokaya 管理员，
我希望看到 Agent 建议到执行的转化漏斗，
这样我能知道哪些能力值得继续优化。

## 6. 功能方案

### 6.1 新增反馈事件：`agentFeedbackEvents`

记录用户对 Agent 产物的后续行为。

事件类型：

- `agent_reply_viewed`
- `tool_card_clicked`
- `prompt_copied`
- `memory_saved`
- `content_plan_created`
- `video_prompt_created`
- `generation_started`
- `schedule_draft_created`
- `result_downloaded`
- `result_deleted`
- `agent_run_undone`
- `agent_suggestion_reused`
- `negative_feedback`
- `positive_feedback`

### 6.2 事件 schema

```json
{
  "id": "uuid",
  "userId": "uuid",
  "projectId": "uuid",
  "agentRunId": "uuid",
  "eventType": "tool_card_clicked",
  "targetType": "trend_research | content_plan | seedance_prompt | schedule | result",
  "targetId": "uuid-or-title",
  "sourceTool": "trend_research",
  "metadata": {
    "trendName": "loft girl",
    "hook": "POV: your room finally has loft girl energy",
    "category": "home decor",
    "action": "create_content_plan"
  },
  "createdAt": "ISO date"
}
```

### 6.3 新增记忆层：`agentPreferenceMemory`

项目级 memory 之外，增加用户偏好记忆。

```json
{
  "userId": "uuid",
  "preferredLanguages": ["Chinese", "BM"],
  "preferredStyles": ["soft sell", "aesthetic routine", "problem hook"],
  "preferredCategories": ["home decor", "fragrance"],
  "preferredVideoFormats": ["routine", "listicle", "before-after"],
  "adoptedTrends": ["loft girl", "clean girl"],
  "avoidedPatterns": ["hard sell", "too luxury", "medical claims"],
  "lastUpdatedAt": "ISO date"
}
```

### 6.4 反馈聚合：`agentLearningSummary`

每天或每次 Agent 启动时轻量聚合：

- 最近 30 天采用最多的 trend。
- 用户最常保存的 hook 类型。
- 用户最常生成的内容格式。
- 用户最常 undo 的动作。
- 当前项目最常使用的语言和视觉风格。

第一期可不做定时任务，直接在 `/api/agent` 中从最近事件实时汇总。

### 6.5 Agent 使用方式

在 Agent system context 中加入：

```text
User preference summary:
- Often accepts: aesthetic routine, soft-sell home decor, Chinese hooks.
- Often skips: hard-sell offer scripts.
- Recent adopted trends: loft girl, clean girl.
- Recommended default: suggest content plan before video generation.
```

Agent 决策规则：

- 优先推荐用户历史上采用过的内容格式。
- 如果用户多次 undo 某类动作，先解释并询问，不直接推荐。
- 如果趋势研究结果与用户偏好匹配，明确说“这和你之前常用的方向一致”。
- 如果不匹配，给替代建议。

## 7. UI/UX 方案

### 7.1 轻量反馈按钮

每个 Agent 回复或工具卡片底部增加：

- `有用`
- `不准`
- `保存为模板`
- `用这个方向继续`

避免复杂评分。用户只需轻点。

### 7.2 工具卡片事件追踪

以下按钮需要记录事件：

- 趋势卡片：保存记忆、下一步。
- 内容计划卡片：创建 drafts、打开项目。
- Prompt 卡片：编辑、生成视频、复制。
- 排期卡片：打开 scheduler。
- Undo 按钮。

### 7.3 偏好记忆展示

在 Agent 侧边栏或 Project Memory 区增加小块：

```text
Agent 已学到：
- 你常用：中文 + soft sell
- 常做：routine / listicle
- 最近方向：loft girl / home decor
```

提供 `编辑` 和 `清空偏好`。

## 8. 后端实现

### 8.1 新增 endpoint

```text
POST /api/agent/feedback
GET /api/agent/preferences
PATCH /api/agent/preferences
DELETE /api/agent/preferences
```

### 8.2 新增 helper

- `recordAgentFeedbackEvent(event, user)`
- `buildAgentPreferenceSummary(db, user)`
- `updateAgentPreferenceMemory(event, db, user)`
- `agentFeedbackSignal(event)`
- `compactPreferenceSummaryForPrompt(summary)`

### 8.3 写入时机

后端自动记录：

- Agent run completed。
- Tool executed。
- Undo。
- Confirm accepted。

前端主动记录：

- 工具卡片按钮点击。
- 用户复制 prompt。
- 用户点击有用/不准。
- 用户保存为模板。

## 9. 数据策略

### 9.1 保留期限

第一期：

- 每个用户最多保留最近 500 条 feedback events。
- 每个用户保留一个聚合后的 preference memory。

### 9.2 隐私边界

- 用户级偏好只给本人 Agent 使用。
- 全局统计只能用匿名聚合，不显示项目名、用户邮箱、具体产品名。
- 不把某用户的成功案例原文展示给另一个用户。

### 9.3 低成本实现

当前项目使用 JSON/Postgres 状态存储，第一期直接扩展现有 DB：

```json
{
  "agentFeedbackEvents": [],
  "agentPreferenceMemory": {}
}
```

## 10. Agent Prompt 策略

新增 system context：

```text
Preference memory:
{{summary}}

Use this as soft guidance, not as a hard rule.
If the user asks for something different, follow the user.
Do not mention private historical details unless useful and non-sensitive.
```

规则：

- 偏好是建议，不是限制。
- 用户当前请求优先级最高。
- 不要说“系统记录显示”，改说“按你之前常用的方向”。
- 如果偏好不足，正常工作，不要假装了解用户。

## 11. 成功模板库

### 11.1 模板来源

模板来自：

- 用户点击“保存为模板”。
- 高采用率 Agent 结果。
- Pokaya 管理员手动标记。

### 11.2 模板 schema

```json
{
  "id": "uuid",
  "scope": "user | global",
  "title": "Loft girl room upgrade listicle",
  "category": "home decor",
  "trendName": "loft girl",
  "format": "listicle",
  "hookPattern": "3 small items that make...",
  "scenePattern": "before-after room corner",
  "promptTemplate": "Video prompt template...",
  "adoptionScore": 0.82,
  "createdAt": "ISO date"
}
```

### 11.3 使用方式

Agent 可在趋势研究后说：

> 这个方向可以套用你之前保存的 “room upgrade listicle” 模板，我可以直接改成香薰版本。

## 12. 管理员视图

第一期只做轻量统计，放入现有 Admin CRM。

指标：

- Agent runs total。
- Tool usage。
- Trend research count。
- Trend research -> content plan conversion。
- Content plan -> generation conversion。
- Undo rate。
- Positive / negative feedback count。
- Top adopted trends。
- Top saved templates。

## 13. 验收标准

### 13.1 基础验收

- 用户点击 Agent 卡片按钮会写入 feedback event。
- Agent run completed 后能记录 tool summary。
- `/api/agent` 能读取 preference summary 并放入上下文。
- 用户偏好不足时，不影响 Agent 正常回答。
- 用户可清空偏好记忆。

### 13.2 智能验收

测试用例：

1. 用户多次保存 `loft girl / home decor / routine`。
2. 再问“这个香薰怎么做内容？”
3. Agent 应优先建议 aesthetic routine 或 room upgrade 方向。

测试用例：

1. 用户对 hard sell 脚本点“不准”。
2. 再问“帮我写脚本”。
3. Agent 应避免强促销开头，改用 soft sell 或 proof demo。

### 13.3 安全验收

- 不跨用户读取偏好。
- 不暴露原始行为日志。
- 不展示邮箱、token、API key、provider。
- 不自动执行扣 credit 动作。

## 14. 指标

### 14.1 采用率

- `trend_research -> content_plan`
- `content_plan -> schedule_draft`
- `seedance_prompt -> generation`
- `tool_card_clicked / agent_run_completed`

### 14.2 质量

- Positive feedback rate。
- Negative feedback rate。
- Undo rate。
- Reuse rate。
- Repeat clarification rate。

### 14.3 个性化

- Preference memory coverage。
- 用户偏好命中率。
- 保存模板数量。
- 模板复用次数。

## 15. Roadmap

### Phase 1：反馈事件闭环

- 新增 `agentFeedbackEvents`。
- 前端按钮点击记录事件。
- 后端自动记录 tool completion / undo / confirm。
- Admin 展示基础统计。

### Phase 2：偏好记忆

- 新增 `agentPreferenceMemory`。
- Agent prompt 注入 preference summary。
- Project / Agent UI 展示已学到的偏好。
- 支持清空和编辑。

### Phase 3：成功模板库

- 支持保存 Agent 结果为模板。
- 用户级模板复用。
- Agent 可推荐历史模板。

### Phase 4：全局匿名学习

- 聚合高采用率趋势和模板。
- 管理员标记 recommended / avoid。
- 将优秀模板加入 Pokaya 官方 SOP。

## 16. 风险

### 16.1 过度个性化

Agent 可能过度沿用旧偏好，忽略用户新方向。

缓解：

- 当前用户请求优先。
- 偏好只作为 soft guidance。
- 提供“换一个方向”。

### 16.2 用户误点反馈

用户可能误点“不准”。

缓解：

- 聚合多次信号，不因单次反馈大幅改变偏好。
- 提供编辑/清空偏好。

### 16.3 数据膨胀

反馈事件可能变多。

缓解：

- 每用户保留最近 500 条。
- 聚合后压缩旧事件。

## 17. 推荐优先级

P0：

- `POST /api/agent/feedback`
- feedback event schema。
- 工具卡片点击记录。
- Agent run completion 自动记录。

P1：

- preference summary 注入 Agent。
- 偏好展示和清空。
- undo / negative feedback 进入偏好。

P2：

- 保存为模板。
- 模板复用。
- Admin 统计面板。

## 18. 成功状态

当用户连续几天使用 Pokaya Agent 后，Agent 应该能说：

> 这个产品我建议继续用你之前常采用的 soft sell routine 方向。你最近保存过 loft girl 和 room upgrade 类型内容，这个香薰可以直接套用“下班回家 30 秒 reset”的结构。我可以帮你生成 7 天内容计划。

这就是本阶段要实现的“Pokaya 专属智能”。
