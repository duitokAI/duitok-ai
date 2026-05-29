# Duitok Agent 工作流优化 PRD

最后更新：2026-05-28

## 1. 背景

Duitok Agent 现在已经有一个真实 Agent 的基础：

- 前端已有聊天面板和 3D 工作状态吉祥物。
- 后端 `/api/agent` 已接入 DeepSeek function calling。
- 后端已有项目、字段更新、生成、排期、TikTok 发布、客服工单等工具。
- 用户权限已经有基础控制。
- 当 DeepSeek 不可用时，有 deterministic fallback。

但现在缺少的不是“再接一个模型”，而是一套稳定的 Agent 工作协议：

**理解需求 -> 制定计划 -> 高风险动作先确认 -> 调用工具 -> 观察结果 -> 回复下一步。**

目前 Agent 已经能调用工具，但用户感受到的还是“聊天框 + 一些动作”，还不像一个真正的 TikTok Shop 内容运营员。它需要知道什么时候直接做、什么时候追问、什么时候让用户确认、失败后怎么恢复。

## 2. 产品目标

把 Duitok Agent 升级成 TikTok Shop 卖家的 AI 内容运营员。

用户应该可以自然输入：

- `帮我为这个产品做 7 天 TikTok 内容`
- `用这个 competitor URL 拆 5 个 hook`
- `把刚刚生成的视频排到今晚 8 点`
- `看一下我今天还缺什么`
- `帮我生成 Seedance 视频 prompt，然后直接跑一个版本`

Agent 应该能理解意图，选择正确工具，安全执行，更新工作台，并清楚告诉用户发生了什么。

## 3. 非目标

V1 暂不做：

- Duitok 外部的通用网页浏览。
- 不经确认就全自动发布 TikTok。
- 多 Agent 团队架构。
- 跨用户长期记忆。
- 替换现有 Image / UGC / Auto Content / Story / Viral 页面。
- 允许模型绕过权限、余额、计费或安全检查。

## 4. 当前问题

### 4.1 工具调用没有可见计划

模型可以调用工具，但用户看不到：

- Agent 理解到的任务是什么。
- Agent 准备用哪些工具。
- 当前正在执行哪一步。
- 哪一步失败了，为什么失败。

### 4.2 追问规则不清晰

Agent 不应该什么都问，但缺少关键执行信息时必须问。

例子：

- 用户说“generate video”，但没有选项目，也没有产品信息，Agent 应该追问或创建项目。
- 用户说“post to TikTok”，但 TikTok 账号未连接，Agent 应该引导连接。
- 用户要求消耗 credits 做生成，但输入很模糊或成本较高，Agent 应该先确认。

### 4.3 fallback 文案暴露内部实现

当前 fallback 会出现类似 `DeepSeek is not configured` 的工程提示。调试时有用，但产品体验不好。

用户不需要知道环境变量名。用户只需要知道：

- Agent 大脑暂时不可用。
- 现在还能做哪些动作。
- 下一步怎么恢复。

### 4.4 Agent 记忆太浅

前端目前用 localStorage 存最近聊天，后端存项目和结果。Agent 需要更明确的任务记忆：

- 当前用户。
- 当前项目。
- 最近一次生成结果。
- 最近一次失败动作。
- 当前 active 的 schedule draft。
- 项目级品牌规则 / 目标人群 / 常用语言。

### 4.5 工具结果不是一等 UI 对象

现在工具结果主要变成聊天文本和 DB 更新。用户需要更清楚看到：

- 已创建项目。
- 已更新 prompt。
- 正在生成图片。
- 已保存结果。
- 已创建排期草稿。
- 需要用户确认。

### 4.6 风险边界不够明确

有些动作可以自动执行，有些动作必须确认。

低风险，可自动执行：

- 跳转工作台。
- 创建草稿。
- 填 prompt 字段。
- 创建客服工单。

中风险，需要视情况确认：

- 消耗 credits 生成图片/视频。
- 一次创建很多 schedule drafts。

高风险，必须确认：

- 发布到 TikTok。
- 标记内容为已发布。
- 修改账号 / 计费 / 管理员权限。

## 5. 目标用户体验

### 5.1 普通聊天

用户：

`这个产品适合怎么做内容？`

Agent 应该：

1. 判断这是咨询类问题。
2. 不乱调用工具。
3. 直接给内容策略。
4. 提供下一步按钮或建议：生成 hooks、创建 7 天计划、创建项目。

### 5.2 创建项目

用户：

`帮我新建一个 D-Bio hair growth campaign`

Agent 应该：

1. 调用 `create_project`。
2. 自动跳转到新项目。
3. 回复：项目已创建，下一步可以做 hooks、UGC script、产品图或 7 天内容计划。

### 5.3 生成内容

用户：

`用 Nano Banana Pro 做一个产品图`

Agent 应该：

1. 检查当前项目。
2. 如果 prompt 不够，追问产品信息，或使用项目已有字段。
3. 展示计划：先更新 image prompt，再生成 1 张图片。
4. 调用 `update_project_field`。
5. 调用 `generate_project_output`。
6. 回复结果，并给下一步动作。

### 5.4 创建排期草稿

用户：

`把刚刚那个视频排今晚 8 点`

Agent 应该：

1. 把“刚刚那个视频”解析为最近生成的视频结果。
2. 调用 `create_schedule_draft`。
3. 打开 Scheduler / Auto Post 页面。
4. 回复标题、时间、caption 摘要。

### 5.5 TikTok 发布

用户：

`直接发 TikTok`

Agent 应该：

1. 检查 TikTok 账号是否连接。
2. 检查是否有可发布的 public media URL。
3. 出现确认卡片。
4. 用户确认后才调用 `publish_tiktok_video`。
5. 回复 publish status 和后续查看方式。

## 6. Agent 工作流

### 6.1 请求生命周期

每次 `/api/agent` 请求都应该产生一个结构化 run：

```json
{
  "runId": "agent_run_id",
  "status": "planning | waiting_confirmation | running | completed | failed",
  "intent": "chat | create_project | generate | schedule | publish | support | navigate",
  "plan": [
    {"step": "resolve_project", "status": "completed"},
    {"step": "update_prompt", "status": "running"},
    {"step": "generate_output", "status": "pending"}
  ],
  "toolResults": [],
  "uiActions": [],
  "reply": "..."
}
```

### 6.2 模型输入协议

每次调用 DeepSeek 时，应该传入：

- System prompt：Duitok Agent 身份、工具规则、安全边界。
- 状态摘要：用户、权限、余额、当前项目、最近结果、TikTok 连接状态。
- 最近对话历史。
- 工具定义。

模型必须遵守：

- 信息足够时优先行动，不要无意义追问。
- 缺少关键执行字段时，只问一个简短问题。
- 不编造 ID、URL、余额、生成结果。
- 所有改状态动作必须通过工具。
- 不暴露内部环境变量或配置细节。
- 高风险动作只请求确认，不直接执行。

### 6.3 确认机制

新增 `request_confirmation` 伪工具，或在后端 response 中返回 `waiting_confirmation`。

必须确认的情况：

- 发布到 TikTok。
- 消耗 credits 超过阈值。
- 一次执行超过 3 次生成。
- 删除或覆盖已有项目内容。
- 修改管理员/用户权限。

不需要确认的情况：

- 创建草稿项目。
- 更新 prompt 字段。
- 创建 schedule draft。
- 跳转页面。
- 创建客服工单。

## 7. 工具优化

### 7.1 新增工具

建议新增：

#### `inspect_workspace_state`

返回当前项目、最近结果、排期草稿、余额、缺失配置。

用途：让 Agent 在行动前能判断“现在有什么”。

#### `create_content_plan`

生成 7 天 / 14 天内容计划，但不立刻生成素材。

用途：把“计划”和“执行生成”拆开。

#### `create_seedance_prompt`

专门生成 Seedance 2.0 prompt，不混在普通 image prompt 里。

用途：提升视频 prompt 质量。

#### `estimate_generation_cost`

生成前估算 credits 成本。

用途：给确认卡片使用。

#### `request_user_confirmation`

让后端返回前端确认卡片。

用途：发布、批量生成、高成本动作。

#### `remember_agent_context`

保存项目级短记忆，例如产品名、目标人群、语言、品牌语气。

用途：让 Agent 后续回复和生成更稳定。

### 7.2 现有工具改造

#### `generate_project_output`

需要额外返回：

- 消耗 credits。
- provider。
- model。
- media type。
- duration。
- image/video URL。
- 错误是否可重试。

#### `create_schedule_draft`

需要支持：

- 一次创建多个 draft。
- 用“latest result”自动关联最近结果。
- 标准化发布时间。

#### `publish_tiktok_video`

必须：

- 要求 confirmation token。
- 返回 TikTok publish id。
- 返回 privacy level。
- 返回 status check action。

## 8. 前端 UX 要求

### 8.1 Agent 执行 timeline

每次 Agent 执行工具时，在回复下方显示 timeline：

- 理解需求
- 更新项目
- 生成素材
- 保存结果
- 创建排期
- 完成

每一步状态：

- Pending
- Running
- Done
- Failed
- Needs confirmation

### 8.2 确认卡片

高风险动作展示确认卡：

- 动作摘要。
- 成本 / 影响。
- 目标账号 / 项目。
- Confirm 按钮。
- Cancel 按钮。

例子：

`确认把这个视频发布到 TikTok？默认 privacy: SELF_ONLY。`

### 8.3 结果卡片

工具创建输出后，显示可操作结果卡：

- 打开项目。
- 查看结果。
- 创建排期。
- 再生成一个 variation。
- 发布 / 查看发布状态。

### 8.4 空状态

Agent 空状态应该直接教用户怎么用：

- 丢一个产品 URL。
- 让 Agent 做 7 天计划。
- 让 Agent 生成产品图。
- 让 Agent 排期最近结果。

### 8.5 3D mascot 状态同步

mascot 状态应该跟后端 run status 绑定：

- `planning` -> chat station
- `running.generate.image` -> image station
- `running.generate.video` -> video station
- `running.schedule` -> schedule station
- `waiting_confirmation` -> chat station + need approval
- `completed` -> done animation
- `failed` -> error / needs help state

## 9. 后端要求

### 9.1 持久化 Agent run

DB 增加 `agentRuns`：

```json
{
  "id": "run_id",
  "userId": "u_1",
  "projectId": "p_1",
  "status": "completed",
  "intent": "generate",
  "userMessage": "...",
  "plan": [],
  "toolResults": [],
  "uiActions": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 9.2 状态摘要器

调用 DeepSeek 前，生成一个小型状态摘要：

- 用户角色和权限。
- credit balance。
- 当前项目名和关键字段。
- 最近 5 个结果。
- 未来 5 个排期草稿。
- TikTok 连接状态。
- Provider readiness flags。

不要把完整 DB 全塞给模型。

### 9.3 错误分类

统一错误类型：

- `CONFIG_MISSING`
- `AUTH_REQUIRED`
- `PERMISSION_DENIED`
- `CREDIT_REQUIRED`
- `PROVIDER_FAILED`
- `VALIDATION_FAILED`
- `PUBLISH_BLOCKED`

用户文案要讲下一步，不要讲内部实现。

坏文案：

`DeepSeek is not configured yet.`

好文案：

`Agent 大脑暂时不可用。我还能帮你创建草稿、更新工作台，但复杂规划会受限。`

### 9.4 可观测性

日志记录：

- run id
- intent
- tool names
- 总耗时
- model latency
- tool latency
- error class
- user id

不要记录 secret 或 provider key。

## 10. Prompt 要求

DeepSeek system prompt 中，Duitok Agent 的定位：

> 你是 TikTok Shop 马来西亚卖家的 AI 内容运营员。你帮助用户创建 campaign、产品视觉、UGC 脚本、短视频 prompt、内容计划、排期和发布流程。

规则：

- 用户用中文，就中文回复；用户用 BM，就 BM 回复；用户用英文，就英文回复。
- 回复要短，偏执行，不要像泛泛聊天机器人。
- 如果工具改变了工作台状态，要明确说改变了什么。
- 如果用户要求生成，先补齐或更新对应项目字段，再生成。
- 如果用户要求发布，必须先确认。
- 如果 provider 没配置，给用户可理解的下一步，不要默认暴露 env 变量名。
- TikTok 未确认发布成功前，不要说“已经发布成功”。

## 11. 指标

核心指标：

- Agent 任务完成率。
- 工具调用成功率。
- 对话最终产生输出 / 草稿 / 排期的比例。
- 用户从输入到第一个有效动作的时间。
- 确认卡接受率。

质量指标：

- 追问率。
- 失败后恢复率。
- 重复 fallback / error 消息次数。
- Agent 更新字段后用户手动修改率。

运营指标：

- DeepSeek latency。
- 各工具 latency。
- Provider failure rate。
- 每次 Agent run 消耗 credits。

## 12. 上线计划

### Phase 1：可靠性和 UX 协议

- 增加结构化 Agent run response。
- 隐藏内部配置 fallback 文案。
- 前端增加 run timeline。
- TikTok publish 和高成本生成增加 confirmation gate。
- 调用 DeepSeek 前增加 state summary。

### Phase 2：增强运营工具

- 新增 `inspect_workspace_state`。
- 新增 `create_content_plan`。
- 新增 `create_seedance_prompt`。
- 新增 latest-result resolver。
- 支持一次创建多个 schedule drafts。

### Phase 3：记忆和半自动运营

- 新增项目级 Agent memory。
- Agent 复用品牌语气、目标人群和语言。
- 增加“今天还缺什么内容”诊断。
- 每次任务完成后给下一步建议。

### Phase 4：发布工作流

- TikTok publish confirmation card。
- 发布状态轮询 UI。
- 发布失败恢复步骤。
- 默认安全 privacy。

## 13. 验收标准

V1 完成标准：

- 普通聊天不会乱调用工具。
- 创建项目请求能创建项目并跳转。
- 生成请求能更新字段、执行生成、保存结果、显示结果卡。
- 排期请求能用最近结果创建 draft。
- TikTok 发布请求一定先确认。
- provider 缺配置时显示产品化文案。
- 前端能显示工具任务 timeline。
- mascot 状态跟 Agent run status 同步。
- 日志记录 run id、tool names、耗时、错误类型。

## 14. 100% Confidence 标准

这里的 `100% confidence` 不是指模型永远不会错，而是指产品和工程层面做到：

**任何 Agent 动作都必须有可解释的信心分、明确阈值、可回滚路径、可测试结果。**

### 14.1 Confidence 分级

每次 Agent run 必须输出 `confidence`：

```json
{
  "confidence": {
    "intent": 0.94,
    "project": 0.88,
    "tool": 0.91,
    "execution": 0.86
  }
}
```

含义：

- `intent`：是否理解用户要做什么。
- `project`：是否确定应该作用在哪个项目。
- `tool`：是否确定应该调用哪些工具。
- `execution`：是否具备执行所需字段、权限、余额、provider 配置。

### 14.2 动作阈值

Agent 必须按以下阈值行动：

| 场景 | 阈值 | 行为 |
| --- | --- | --- |
| 普通聊天 | `intent >= 0.6` | 直接回复，不调用工具 |
| 页面跳转 | `intent >= 0.75` | 可直接执行 |
| 创建项目 | `intent >= 0.8` | 可直接执行 |
| 更新 prompt 字段 | `intent >= 0.8` 且 `project >= 0.75` | 可直接执行 |
| 创建 schedule draft | `intent >= 0.85` 且 `project >= 0.75` | 可直接执行 |
| 生成图片/视频 | `intent >= 0.85` 且 `project >= 0.8` 且 `execution >= 0.8` | 可执行；高成本先确认 |
| 批量生成 | `intent >= 0.9` 且 `execution >= 0.85` | 必须确认 |
| TikTok 发布 | `intent >= 0.95` 且 `execution >= 0.9` | 必须确认 |
| 低于阈值 | 任一关键分数不足 | 只问一个澄清问题 |

### 14.3 Auto / Confirm / Ask 三段式

每个 Agent run 只能进入三种决策之一：

#### Auto

条件：

- 低风险动作。
- confidence 达标。
- 不消耗高额 credits。
- 不影响外部平台。

例子：

- 创建项目。
- 填写 prompt。
- 创建 draft。
- 跳转页面。

#### Confirm

条件：

- 可能花费 credits。
- 会发布到 TikTok。
- 会批量创建或批量生成。
- 会修改用户可见状态。

例子：

- `我要生成 10 个视频`
- `直接发 TikTok`
- `把这 7 条都设成 Ready`

#### Ask

条件：

- 关键字段缺失。
- 项目不明确。
- 用户指代不清楚。
- 工具无法确定。

例子：

- `帮我做一个`
- `发那个`
- `照刚才的继续`，但没有最近结果。

### 14.4 禁止行为

Agent 永远不能：

- 在没有确认时发布 TikTok。
- 编造生成结果 URL。
- 编造 TikTok 发布成功。
- 编造 credit balance。
- 绕过 `requireAgentPermission`。
- 把 provider key、env 变量、内部 stack trace 暴露给普通用户。
- 在 confidence 不足时假装已经理解。
- 把失败说成成功。

### 14.5 Confidence 不足时的标准回复

当 Agent 不确定时，必须只问一个问题，并给默认选项。

示例：

用户：`帮我做视频`

Agent：

`你要我用哪个产品/项目来做？默认我可以用当前项目「D-Bio hair growth」生成 1 条 TikTok 视频 prompt。`

用户：`发那个`

Agent：

`你是指最近生成的那个视频吗？确认后我会先创建 TikTok 发布确认卡，不会直接发布。`

## 15. 测试矩阵

### 15.1 普通聊天测试

输入：

`这个产品适合怎么做内容？`

预期：

- 不调用工具。
- 回复内容策略。
- `intent=chat`。
- timeline 不显示执行工具步骤。

### 15.2 创建项目测试

输入：

`帮我新建一个 D-Bio hair growth campaign`

预期：

- 调用 `create_project`。
- 创建项目属于当前用户。
- 跳转到新项目。
- timeline 显示 `创建项目 -> 完成`。

### 15.3 生成图片测试

输入：

`用当前项目生成一张产品图`

预期：

- 检查项目。
- 如 prompt 足够，调用 `generate_project_output`。
- 保存 result。
- 返回 result card。
- 记录 credits。

### 15.4 模糊生成测试

输入：

`帮我做一个`

预期：

- 不调用生成工具。
- 只问一个澄清问题。
- `status=waiting_clarification`。

### 15.5 排期测试

输入：

`把刚刚那个视频排今晚 8 点`

预期：

- 解析 latest video result。
- 调用 `create_schedule_draft`。
- 创建 draft。
- 跳转 Scheduler / Auto Post。

### 15.6 TikTok 发布测试

输入：

`直接发 TikTok`

预期：

- 不直接调用 `publish_tiktok_video`。
- 返回 confirmation card。
- 用户确认后才发布。
- publish 状态不成功时不能说“已发布成功”。

### 15.7 Provider 缺配置测试

模拟：

- DeepSeek / APIMart / Wuyin / AtlasCloud 任一缺配置。

预期：

- 显示产品化错误。
- 不暴露 env key。
- 提供下一步动作。

### 15.8 权限测试

模拟：

- 普通用户没有 publish 权限。

预期：

- 不调用 publish。
- 返回权限不足文案。
- 后端返回 `PERMISSION_DENIED`。

## 16. 上线 Gate

Phase 1 不能上线，除非以下全部通过：

- 20 条核心 Agent 测试用例全部通过。
- TikTok publish 100% 需要确认。
- 生成失败不会扣错 credits。
- provider 缺配置不会暴露内部错误。
- `/api/agent` 每次都有 `runId`。
- 每个 tool call 都有日志。
- 前端 timeline 能显示 success / failed / waiting_confirmation。
- Agent 不能在低 confidence 时调用高风险工具。
- Admin 和普通用户权限隔离测试通过。

## 17. 待确认问题

- 没有项目时，Agent 默认创建项目，还是先问用户？
- credits 超过多少必须确认？
- Agent memory 是否允许用户手动编辑？
- “今天还缺什么内容”只基于 Duitok 数据，还是未来接 TikTok performance data？
- TikTok publish 默认 privacy 用 `SELF_ONLY`，还是让用户选择？

## 18. 推荐下一步

优先做 Phase 1：

1. `/api/agent` 返回 `agentRun` 结构。
2. 后端持久化 `agentRuns`。
3. 前端聊天区渲染执行 timeline。
4. `publish_tiktok_video` 增加确认机制。
5. 替换内部 fallback 文案。

先把 Agent 的“操作系统”做稳，再继续加更多工具。
