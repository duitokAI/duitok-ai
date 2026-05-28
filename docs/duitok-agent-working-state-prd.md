# Duitok Agent Working State UI Optimization PRD

## 1. 背景

当前 Agent 执行中界面已经比黑色卡片清楚，但截图里的 running card 仍然有几个明显问题：

- 卡片面积过大，像一条系统横幅，抢走了聊天内容的主视觉。
- `Agent is working`、`Understanding your request`、`Reading workspace context...` 都偏工程化，用户知道它在跑，但不知道“跑到哪一步、还要等什么”。
- 黄色进度条是无限动画，没有真实阶段感，容易让用户误以为卡住了。
- 当前状态只展示“理解需求”，但 Agent 实际可能在理解、检查 workspace、规划工具、等待确认、调用工具、整理结果。
- 用户在等待时没有可操作选项，例如取消、查看正在做什么、知道是否会扣 credit。

这会让 Agent 显得“正在转圈”，而不是“有条理地帮我做事”。

## 2. 目标

把 Agent running state 从“大块 loading 横幅”优化成「轻量、可信、可解释」的执行状态组件。

核心目标：

- 用户一眼知道 Agent 正在做哪一步。
- 运行态不压过聊天内容。
- 高风险或扣 credit 行为在执行前明确提示。
- 长时间等待时给用户稳定反馈，避免误判卡死。
- 保留专业感，但去掉 debug 感和内部系统文案。

## 3. 非目标

- 不重写 Agent 后端工具链。
- 不改变 DeepSeek / 工具调用的核心决策流程。
- 不在本期做实时 token stream。
- 不展示内部 prompt、tool schema、provider、apikey、中转站等任何敏感信息。
- 不把 running state 做成复杂任务管理器，本期只优化聊天界面里的等待体验。

## 4. 当前问题诊断

### P0：运行状态占用面积过大

当前卡片高度接近一条 banner，且横向占满。对于聊天产品来说，运行态应该是消息流中的辅助状态，而不是页面主内容。

用户感受：

- “它又弹出一个大东西。”
- “我看不到上下文，只看到它在转。”

### P0：进度含义不清

`Understanding your request` 只能说明第一步。用户不知道后面是否还有：

- 检查项目资料
- 判断是否需要追问
- 准备扣费动作
- 调用生成工具
- 创建排期草稿
- 整理结果

无限进度条没有阶段语义，等待超过 3 秒后焦虑感会增加。

### P1：文案不够用户化

`Reading workspace context, planning safe tool calls...` 更像开发者日志。普通用户更关心：

- 你现在在看什么？
- 会不会扣 credit？
- 我需不需要确认？
- 大概还要多久？

### P1：缺少长等待保护

当 Agent 调用外部模型或工具较慢时，界面没有从“正在理解”切换到“仍在处理”。如果等待超过 8-12 秒，用户可能重复提交或刷新。

### P1：缺少可控感

运行中没有“取消”或“停止本次任务”的轻量入口。即使后端暂时不支持真正 abort，也应该提供前端层面的“停止等待 / 结束本次显示”能力，并避免用户继续误操作。

## 5. 设计原则

1. **轻量存在**：running state 是聊天流的一部分，不是页面横幅。
2. **阶段明确**：用用户听得懂的阶段替代内部执行术语。
3. **安全优先**：扣 credit、发布、外部账号动作必须先确认。
4. **稳定反馈**：超过预期等待时间时，主动说明“仍在处理”。
5. **不暴露内部**：不展示模型名、供应商、工具 schema、路由、中转站、token、key。
6. **少而准**：每个状态最多一句主文案加一句辅助文案。

## 6. 用户体验方案

### 6.1 Running Card 视觉形态

把当前大横幅改成聊天流里的紧凑状态卡。

建议规格：

- 最大宽度：`min(560px, 94%)`
- padding：`14px 16px`
- border radius：`14px`
- 背景：浅暖白 `#fffaf2` 或 `rgba(244, 202, 50, 0.08)`
- 边框：`rgba(244, 202, 50, 0.28)`
- 不再占满整行大横幅。
- spinner 缩小到 `28px`，不使用大黄色圆底。

推荐结构：

```text
Agent 正在处理
正在理解你的需求
我会先检查 workspace，再决定是否需要追问或调用工具。

[理解需求] [检查资料] [准备执行] [整理结果]
```

验收：

- 截图中 running card 高度降低 35% 以上。
- 用户不需要横向扫完整屏才能读懂状态。

### 6.2 阶段式进度

将单一 loading 改成 4 步阶段提示。

默认阶段：

1. `理解需求`
2. `检查资料`
3. `准备执行`
4. `整理结果`

有工具调用时可扩展：

- `调用工具`
- `等待确认`
- `生成内容`
- `创建排期`
- `发布前确认`

状态样式：

- 已完成：绿色小圆点或 check。
- 当前：紫色文字 + 轻微 pulse。
- 未开始：浅灰紫。

验收：

- 用户可以看到当前停在哪一步。
- 不显示 confidence、intent、tool name 等内部字段。

### 6.3 文案优化

文案必须从用户角度写。

替换当前文案：

```text
Agent is working
Understanding your request
Reading workspace context, planning safe tool calls, and preparing the next update.
```

改为中文优先：

```text
Agent 正在处理
正在理解你的需求
我会先看当前项目和 workspace，再决定下一步。
```

不同状态文案：

| 状态 | 主文案 | 辅助文案 |
| --- | --- | --- |
| understanding | 正在理解你的需求 | 我会判断是直接回答、追问，还是调用工具。 |
| inspecting | 正在检查 workspace | 我在看项目资料、生成结果、排期和积分状态。 |
| planning | 正在规划下一步 | 如果信息不够，我会先问你；涉及扣费会先确认。 |
| tool_calling | 正在执行工具 | 我正在处理任务，请稍等。 |
| waiting_confirmation | 需要你确认 | 这个动作会扣积分或影响发布，确认后才继续。 |
| finalizing | 正在整理结果 | 我在把结果整理成你能直接看的回复。 |
| slow | 还在处理中 | 这一步比平时久一点，请不要重复提交。 |

验收：

- running card 不出现英文工程文案。
- 不出现 `tool calls`、`workspace context` 这类内部表达，除非产品本身已把 workspace 当作用户概念。

### 6.4 长等待策略

按等待时间切换提示：

- 0-2 秒：显示当前阶段。
- 3-8 秒：显示“正在处理，请稍等”。
- 8-20 秒：显示“这一步比平时久一点”。
- 20 秒以上：显示轻量操作：
  - `继续等待`
  - `停止本次任务`

注意：

- 如果后端无法真正取消工具调用，`停止本次任务` 只停止前端等待态，并提示“本次显示已停止，后台任务可能仍会完成”。
- 不允许用户在同一线程重复提交导致多次扣费。

验收：

- 等待超过 8 秒时，界面文案会变化。
- 等待期间输入框保持禁用或进入确认态，不允许重复触发扣费动作。

### 6.5 扣 credit 前置提示

如果 Agent 规划出的下一步可能扣 credit，不应该只显示 running。

应切换为确认卡：

```text
需要确认
这一步会消耗 10 credits，用于生成 1 张产品图。

[确认执行] [取消]
```

要求：

- running card 不能掩盖扣费确认。
- 所有扣费动作必须等用户点确认后才调用工具。
- 确认卡要显示：
  - 动作名称
  - 预计 credit
  - 影响对象，例如当前项目、排期、生成结果

验收：

- 用户叫 Agent “生成图片/视频/发布/批量排期”时，扣 credit 前必出确认。
- 用户只问问题、做诊断、创建不扣费草稿时可以直接执行。

## 7. 信息架构

### 7.1 状态组件层级

推荐顺序：

1. 小标签：`Agent 正在处理`
2. 当前阶段主文案
3. 一句辅助说明
4. 阶段 pills
5. 可选操作：取消 / 继续等待

不要展示：

- raw tool name
- raw args
- model/provider
- confidence 百分比
- internal intent
- API endpoint

### 7.2 与聊天输入框联动

运行中：

- 输入框 disabled。
- placeholder：`Agent 正在处理，请稍等...`
- 发送按钮 disabled。

等待确认：

- 输入框 disabled。
- placeholder：`请先确认或取消当前动作`

完成后：

- 输入框恢复。
- placeholder：`Message Duitok Agent...`

## 8. 视觉规范

### 8.1 颜色

- 主文字：`rgba(31, 6, 38, 0.94)`
- 辅助文字：`rgba(93, 8, 108, 0.68)`
- 当前阶段：`#5d086c`
- 完成阶段：`#22c778`
- 等待阶段：`rgba(93, 8, 108, 0.30)`
- 背景：`#fffaf2`
- 边框：`rgba(244, 202, 50, 0.30)`

### 8.2 字体

- 标签：`13px / 850`
- 主文案：`16px / 900`
- 辅助文案：`14px / 700`
- 阶段 pill：`12px / 850`

### 8.3 动效

- spinner 只保留小尺寸。
- 当前阶段可轻微 pulse，但不要大面积闪烁。
- 进度条如果保留，必须比现在更细，并放到阶段 pill 下方。
- 尊重 `prefers-reduced-motion`，关闭循环动画。

## 9. 技术需求

### 9.1 前端状态模型

新增或复用：

```js
state.agentBusy
state.agentTaskMode
state.agentVisualPhase
state.agentMessages
```

建议新增派生函数：

```js
function agentWorkingState() {
  return {
    phase: "understanding" | "inspecting" | "planning" | "tool_calling" | "waiting_confirmation" | "finalizing" | "slow",
    title: "...",
    description: "...",
    steps: [...]
  };
}
```

### 9.2 后端事件映射

如果现阶段后端没有 streaming events，则前端先用时间和已有状态模拟阶段：

- 提交后立即：`understanding`
- 800ms：`inspecting`
- 1800ms：`planning`
- 后端仍未返回：`tool_calling`
- 返回 `waiting_confirmation`：`waiting_confirmation`
- 返回结果前：`finalizing`
- 超过 8000ms：`slow`

后续可以接真实 Agent event：

```text
agent.started
agent.inspected_workspace
agent.planned
agent.awaiting_confirmation
agent.tool_started
agent.tool_completed
agent.finalized
agent.failed
```

### 9.3 安全要求

- 状态文案必须由白名单映射生成，不能直接渲染模型返回的内部状态。
- 不显示 tool args、raw errors、provider、route、token、key。
- 错误状态只显示安全后的用户文案。
- 如果状态异常，统一 fallback：

```text
Agent 正在处理
我正在整理这次请求，请稍等。
```

## 10. 验收标准

### P0 验收

- running card 不再是大横幅，宽度和高度明显收敛。
- 运行中文案全部改为用户能理解的中文。
- 至少展示 4 个阶段：理解需求、检查资料、准备执行、整理结果。
- 等待确认时，running card 被确认卡替代或让位。
- 扣 credit 动作前必须出现确认。

### P1 验收

- 等待超过 8 秒显示慢处理提示。
- 20 秒以上提供停止本次任务入口。
- 移动端不换行挤压，不出现文字溢出。
- `prefers-reduced-motion` 下无明显循环动画。

### P2 验收

- 后续可接真实 agent events，不需要重写 UI。
- 可按任务类型显示不同阶段，例如生成、排期、发布、诊断。

## 11. 实施计划

### Phase 1：UI 收敛

- 改 `agentThinkingCard()` 结构。
- 改 `.agent-thinking` 样式。
- 将文案切成中文用户语言。
- 加阶段 pills。
- 保留现有 busy / confirmation 逻辑。

### Phase 2：等待体验

- 增加 elapsed timer。
- 8 秒切换 slow 文案。
- 20 秒出现停止本次任务按钮。
- 输入框 placeholder 与 running / confirmation 状态联动。

### Phase 3：真实执行事件

- 后端返回 Agent event timeline。
- 前端按 event 更新阶段。
- 工具调用失败时显示安全错误和下一步建议。

## 12. 推荐首版实现范围

本次建议先做 Phase 1 + Phase 2 的前半：

- 紧凑 running card。
- 中文阶段文案。
- 4 个阶段 pills。
- 8 秒 slow fallback。
- 保持扣 credit 确认逻辑不变。

暂不做：

- 后端 streaming events。
- 真正 abort 工具调用。
- 每个工具的精细阶段。

这样可以最快解决截图里的主要观感问题，同时不碰高风险后端逻辑。
