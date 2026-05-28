# Duitok Agent 下一阶段优化 PRD

最后更新：2026-05-28

## 1. 背景

Duitok Agent 当前已经完成第一阶段可用闭环：

- 能理解用户输入并调用后端工具。
- 有结构化 `agentRun`、timeline、confidence、confirmation card。
- 有安全拦截、输出脱敏、工具 allowlist、参数校验。
- 有 `inspect_workspace_state`、`create_content_plan`、`create_seedance_prompt`、`remember_agent_context`。
- 有项目级 memory、latest result resolver、多 draft 创建。

下一阶段的问题不再是“Agent 能不能做事”，而是：

**Agent 做得准不准、用户是否信任、失败后是否能恢复、运营团队是否能看懂它每天做了什么。**

本 PRD 目标是把 Duitok Agent 从“可用的 AI operator”升级成“稳定、可解释、可优化的 TikTok Shop 内容运营系统”。

## 2. 产品目标

### 2.1 用户侧目标

- 用户能清楚知道 Agent 为什么这样做。
- 用户能在 Agent 执行前预览将要改动的内容。
- 用户能一键撤销低/中风险改动。
- 用户能编辑 Agent memory，而不是只能通过聊天隐式更新。
- 用户能从 Agent 得到更具体的下一步动作，而不是泛泛建议。
- 用户能把一次任务变成可复用 workflow，例如“每周一生成 7 天计划”。

### 2.2 运营侧目标

- 管理员能看到 Agent 成功率、失败原因、工具调用分布、确认通过率。
- 管理员能看到哪些 prompt 最容易导致失败或拒答。
- 管理员能用 red-team 用例持续检查安全边界。
- 管理员能快速定位用户说“Agent 不好用”时到底卡在哪一步。

### 2.3 系统侧目标

- 降低模型误判对生产动作的影响。
- 降低重复请求和重复生成成本。
- 让 Agent 具备可回滚、可重试、可观测、可测试的工程边界。

## 3. 非目标

本阶段不做：

- 完全无人监管的 TikTok 自动发布。
- 跨用户共享记忆。
- 读取外部网页内容的通用浏览器 Agent。
- 替代所有现有功能页。
- 暴露上游 provider、密钥、内部路由或工具 schema。
- 多 Agent 专家团队。可以预留接口，但不实现。

## 4. 当前可优化问题

### 4.1 Agent 结果仍偏“聊天文本”

现在 Agent 会返回文字、timeline 和工具结果，但工具结果还没有完全产品化成可操作卡片。

例子：

- 创建内容计划后，用户应该看到 7 天计划表。
- 创建 Seedance prompt 后，用户应该看到 prompt preview、复制、编辑、生成按钮。
- inspect 后，用户应该看到 checklist，而不是只读一段回答。

### 4.2 Confidence 还不够可执行

当前已有 confidence 字段，但还缺：

- 每个 tool call 的 confidence。
- confidence 低时的强制追问策略。
- confidence 和失败率的后台统计。
- 用户侧可理解解释：为什么这一步需要确认？

### 4.3 Memory 只有隐式更新

项目级 `agentMemory` 已存在，但用户还不能在 UI 里直接看到和编辑。

风险：

- Agent 记错产品定位，用户难以发现。
- 用户每次都要重新说明语言、目标人群、品牌语气。
- memory 更新没有版本历史，无法知道什么时候被改了。

### 4.4 缺少可回滚机制

Agent 会更新字段、创建 drafts、保存计划，但用户如果不满意，目前只能手动改。

需要：

- 每次 Agent run 记录写入前后的 diff。
- 对低/中风险改动支持 undo。
- 对不可逆动作明确标记不可撤销。

### 4.5 失败恢复不够强

Agent 工具失败时应该给用户下一步，而不是只显示失败。

例子：

- TikTok 未连接：直接给“连接 TikTok”按钮。
- 余额不足：给 top-up 入口。
- prompt 太空：给 3 个补充问题模板。
- 视频生成失败：给 retry、改短 duration、改模型建议。

### 4.6 缺少 Agent 评测体系

目前有手工 smoke test，但没有标准化测试集。

需要把核心场景固化为自动测试：

- 正常任务。
- 安全拒答。
- prompt injection。
- 高风险确认。
- 权限不足。
- fallback 模式。
- 多语言输入。

### 4.7 Agent 没有任务模板化

用户常见任务高度重复：

- 为一个产品做 7 天内容。
- 根据最近视频创建排期。
- 检查今天还缺什么。
- 把产品图改成 Seedance prompt。
- 生成 UGC 脚本并排期。

这些应该变成可点击、可复用、可参数化的 workflow，而不只是聊天 prompt。

## 5. 用户体验目标

### 5.1 Agent 回复结构

每次 Agent 回复应该尽量包含四层：

1. **结论**：我完成了什么 / 需要你确认什么。
2. **执行摘要**：改了哪些项目、创建了哪些草稿、用了哪些能力。
3. **可操作卡片**：查看计划、编辑 prompt、生成素材、创建排期、连接 TikTok。
4. **下一步建议**：最多 3 个，按当前项目状态动态生成。

### 5.2 工具结果卡片

新增前端 result cards：

#### Content Plan Card

显示：

- 计划天数。
- 每天标题、hook、caption 摘要、发布时间。
- 按钮：`Create drafts`、`Edit plan`、`Export`、`Generate Day 1 asset`。

#### Seedance Prompt Card

显示：

- prompt 摘要。
- duration。
- style。
- target language。
- 按钮：`Edit`、`Copy`、`Generate video`、`Save as template`。

#### Workspace Inspect Card

显示：

- 当前项目是否完整。
- 最近结果。
- 今日 draft / ready 数量。
- 缺失项 checklist。
- 按钮：`Fix missing context`、`Create 7-day plan`、`Open scheduler`。

#### Memory Card

显示：

- 产品名。
- 目标人群。
- 常用语言。
- 品牌语气。
- 注意事项。
- 按钮：`Edit memory`、`Reset`、`Use in this task`。

## 6. 功能需求

### 6.1 Agent Run Diff 与 Undo

每次工具写入 DB 前后记录 diff：

```json
{
  "runId": "agent_run_id",
  "toolName": "update_project_field",
  "target": {"type": "project", "id": "p_123"},
  "before": {"image.prompt": ""},
  "after": {"image.prompt": "new prompt"},
  "undoable": true
}
```

要求：

- `update_project_field` 可撤销。
- `remember_agent_context` 可撤销。
- `create_schedule_draft` 可删除新建草稿。
- `create_content_plan` 可删除本次创建的 plan result 和 drafts。
- `publish_tiktok_video` 不可撤销，只能显示 status check。

新增接口：

- `POST /api/agent/runs/:id/undo`
- 仅允许撤销当前用户自己的 run。
- 只能撤销 24 小时内未发布的低/中风险动作。

### 6.2 Agent Memory Editor

在 Project 页面或 Agent 页面新增 Memory 面板。

字段：

- `productName`
- `audience`
- `language`
- `brandTone`
- `claimsToAvoid`
- `preferredHooks`
- `blockedWords`
- `notes`

要求：

- 用户可手动编辑。
- Agent 修改 memory 前显示 diff。
- memory 更新写入 usage log。
- memory 不允许存 secrets，经过同一套 secret scanner。

### 6.3 Tool Result Cards

后端 `safeAgentToolResult` 增加 `card` 字段：

```json
{
  "name": "create_content_plan",
  "result": {"ok": true},
  "card": {
    "type": "content_plan",
    "title": "7-day TikTok content plan",
    "actions": ["create_drafts", "edit", "generate_day_1"]
  }
}
```

前端根据 `card.type` 渲染不同 UI。

### 6.4 Task Templates

新增 Agent quick workflows：

- `Create 7-day content plan`
- `Generate Seedance prompt`
- `Inspect today's gaps`
- `Create drafts from latest result`
- `Turn product URL into content plan`
- `Write UGC script`

每个模板包含：

- 必填字段。
- 默认值。
- 预估动作。
- 是否需要确认。

模板不直接绕过 Agent；模板只是把用户输入结构化后交给 `/api/agent`。

### 6.5 Cost Estimate 与 Credit Guard

新增工具或内部函数：

- `estimate_generation_cost`
- `estimate_plan_cost`

规则：

- 纯计划：0 credits。
- 图片生成：显示预计 credits。
- 视频生成：显示预计 credits、duration、模型类型。
- 批量生成：必须确认。
- 余额不足：不调用生成工具，直接引导 top-up。

确认卡必须显示：

- 动作。
- 预计 credits。
- 是否会调用外部平台。
- 是否可撤销。

### 6.6 Error Recovery Playbook

每个工具失败后返回结构化 recovery：

```json
{
  "error": "TikTok account not connected yet.",
  "recovery": {
    "reason": "Missing TikTok connection",
    "actions": [
      {"label": "Connect TikTok", "uiAction": {"page": "autopost"}},
      {"label": "Create draft only", "agentPrompt": "Create a draft instead of publishing"}
    ]
  }
}
```

优先支持：

- TikTok 未连接。
- 缺少 public media URL。
- 余额不足。
- provider 生成失败。
- prompt 信息不足。
- 权限不足。

### 6.7 Agent Evaluation Suite

新增 `scripts/test-agent-smoke.mjs`。

测试分类：

1. **Happy path**
   - 创建项目。
   - 保存 memory。
   - 创建 7 天计划。
   - 生成 Seedance prompt。
   - 创建排期草稿。

2. **Safety**
   - 要 API key。
   - 要中转站。
   - 要系统 prompt。
   - prompt injection 放在产品描述里。
   - 要工具 schema。

3. **Confirmation**
   - 直接发布 TikTok必须进入 `waiting_confirmation`。
   - 14 天批量 draft 需要确认。
   - 高成本生成需要确认。

4. **Permissions**
   - 无 generate 权限不能生成。
   - 无 publish 权限不能发布。
   - 不能操作其他用户项目。

5. **Fallback**
   - Agent brain 不可用时 deterministic fallback 仍可创建项目、计划、prompt。

输出：

- pass/fail。
- 响应时间。
- 是否出现敏感词。
- tool call 是否符合预期。

### 6.8 Admin Agent Dashboard

Admin 增加 Agent 运营视图。

指标：

- Agent run 数量。
- 完成率。
- 失败率。
- 平均耗时。
- tool call 分布。
- confirmation 发起率 / 确认率 / 取消率。
- 安全拒答次数。
- fallback 次数。
- 最常见失败原因。

筛选：

- 用户。
- 工具。
- 时间。
- 状态。
- 风险等级。

要求：

- 不显示 secrets。
- 不显示 raw prompt 中疑似敏感片段。
- 可以查看 redacted run summary。

### 6.9 Proactive Suggestions

Agent 不主动打扰用户，但在用户进入 Agent 页面时可以基于 inspect 生成 suggestions。

例子：

- `你有 3 个 draft 还没有 media。`
- `这个项目还没有产品名和目标人群。`
- `最近生成了视频，但还没有排期。`
- `今天没有 ready post。`

要求：

- 只显示 1-3 条。
- 每条必须有明确 action。
- 不做自动执行。

### 6.10 Agent Memory Versioning

每次 memory 更新保存版本：

```json
{
  "id": "memory_version_id",
  "projectId": "p_123",
  "source": "user | agent | admin",
  "before": {},
  "after": {},
  "createdAt": "..."
}
```

用途：

- 回滚错误 memory。
- 分析 Agent 是否乱改用户定位。
- 支撑“为什么 Agent 这样写”的解释。

## 7. 安全要求

所有新增能力必须继承现有安全 PRD：

- 不返回 raw args。
- 不返回 provider。
- 不返回 key/token/env/schema。
- 不允许工具越权。
- 高风险动作必须确认。
- memory 不允许存秘密。
- admin dashboard 只显示 redacted data。

新增安全点：

- Undo 接口不能撤销其他用户数据。
- Memory editor 不能写入疑似 secrets。
- Task templates 不能绕过 confirmation。
- Evaluation logs 不能保存真实 token。

## 8. 数据结构建议

### 8.1 `agentRuns`

新增字段：

```json
{
  "diffs": [],
  "cards": [],
  "recovery": null,
  "riskLevel": "low | medium | high",
  "costEstimate": {
    "credits": 0,
    "money": "RM0.00"
  }
}
```

### 8.2 `project.agentMemory`

扩展字段：

```json
{
  "productName": "",
  "audience": "",
  "language": "",
  "brandTone": "",
  "claimsToAvoid": "",
  "preferredHooks": "",
  "blockedWords": "",
  "notes": "",
  "updatedAt": "",
  "updatedBy": "user | agent | admin"
}
```

### 8.3 `agentMemoryVersions`

新增 DB collection：

```json
{
  "id": "",
  "projectId": "",
  "userId": "",
  "source": "",
  "before": {},
  "after": {},
  "createdAt": ""
}
```

### 8.4 `agentEvaluations`

可选 DB collection 或本地测试输出：

```json
{
  "id": "",
  "suite": "smoke | safety | regression",
  "passed": 20,
  "failed": 0,
  "createdAt": ""
}
```

## 9. API 需求

### 9.1 新增接口

#### `POST /api/agent/runs/:id/undo`

撤销可撤销动作。

#### `PATCH /api/projects/:id/agent-memory`

用户手动更新项目 memory。

#### `GET /api/projects/:id/agent-memory/history`

查看 memory 版本历史。

#### `GET /api/admin/agent-runs`

Admin 查看 redacted run 列表和统计。

#### `POST /api/agent/evaluate`

Admin 触发安全/回归测试。生产环境可以限制为 admin only。

### 9.2 现有接口增强

#### `/api/agent`

返回新增：

- `agentRun.cards`
- `agentRun.diffs`
- `agentRun.recovery`
- `agentRun.riskLevel`
- `agentRun.costEstimate`

#### `/api/agent/confirm`

确认卡必须校验：

- token。
- run ownership。
- action still valid。
- credits still enough。
- target object still belongs to user。

## 10. 前端需求

### 10.1 Agent Page

新增：

- Tool result cards。
- Undo button。
- Memory panel。
- Suggested actions。
- Recovery actions。

### 10.2 Project Page

新增：

- Agent Memory section。
- `Use memory in prompt` toggle。
- `Ask Agent to improve this prompt` 按钮。

### 10.3 Admin Page

新增：

- Agent Runs table。
- Agent metrics cards。
- Red-team test trigger。
- Failure reason chart。

## 11. 验收标准

### 11.1 功能验收

- 创建内容计划后出现 content plan card。
- Seedance prompt 创建后出现 prompt card。
- Inspect 后出现 checklist card。
- 用户能手动编辑项目 memory。
- Agent 修改 memory 有版本记录。
- 可撤销动作能 undo。
- 不可撤销动作不显示 undo。
- 失败时至少给一个 recovery action。

### 11.2 安全验收

- 20 条安全 red-team case 全部通过。
- toolResults 不出现 raw args。
- memory 不允许保存疑似 secrets。
- admin agent dashboard 不显示 secret。
- confirmation 不能被重放。
- 非 owner 不能 undo。

### 11.3 质量验收

- Agent happy path 成功率 >= 90%。
- 高风险动作 100% 进入 confirmation。
- `/api/agent` p95 响应时间在纯工具任务中 <= 8 秒。
- fallback 模式核心任务成功率 >= 70%。
- 生产错误日志不包含 provider/key/token。

## 12. 上线计划

### Phase 4：可视化和可撤销

- Tool result cards。
- Agent run diffs。
- Undo low/medium risk actions。
- Memory editor。

### Phase 5：可靠性和评测

- Agent smoke/eval suite。
- Error recovery playbook。
- Cost estimate。
- Admin Agent dashboard。

### Phase 6：半自动运营

- Task templates。
- Proactive suggestions。
- Weekly workflow draft。
- Memory versioning。

## 13. 优先级

### P0

- Agent evaluation suite。
- Tool result cards。
- Memory editor。
- Error recovery playbook。

### P1

- Undo。
- Cost estimate。
- Admin Agent dashboard。
- Memory versioning。

### P2

- Task templates。
- Proactive suggestions。
- Weekly workflow automation。

## 14. 风险与边界

### 14.1 风险：Agent 变得过度主动

控制：

- Proactive suggestions 只展示，不自动执行。
- 所有外部动作仍需用户确认。

### 14.2 风险：Undo 误删用户手动修改

控制：

- Undo 前检查目标对象 `updatedAt`。
- 如果用户在 Agent run 后手动修改过，则要求二次确认或禁止 undo。

### 14.3 风险：Memory 被污染

控制：

- 显示 memory diff。
- 支持回滚。
- 敏感词 scanner。
- 用户手动编辑优先级高于 Agent 自动更新。

### 14.4 风险：Admin dashboard 泄露隐私

控制：

- 默认 redacted。
- 不展示完整 user prompt。
- 只显示摘要、工具名、状态、耗时。

## 15. 最终目标

Duitok Agent 下一阶段要解决的不是“多加几个工具”，而是让用户感觉：

**它像一个靠谱的内容运营助理：知道上下文、做事前会解释、做错能恢复、敏感事情有边界、每天能帮我把 TikTok Shop 内容推进一步。**

