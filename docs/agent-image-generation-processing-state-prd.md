# Agent 图片生成 Processing 状态修复 PRD

Last updated: 2026-06-02

## 1. 背景

当前在 Agent / Content Setup 场景里触发图片生成后，系统会返回：

`Generation queued. Pokaya will save the result to this content setup when it is ready.`

但界面没有像 Image Page 那样在当前生成区域放入稳定的 processing 画面。用户看到的是一条很长的 queued 消息，左侧内容区被挤压成很窄的竖向区域，导致“图片生成中”的提示、反馈按钮和内容 setup 布局都显得异常。

这会造成两个问题：

1. 用户不知道图片到底有没有开始生成，只看到一条系统消息。
2. 当前内容 setup 的版面被 queued 消息破坏，看起来像页面坏掉了。

本 PRD 目标是：Agent 在做图时，必须像 Image Page 一样显示一个稳定、可理解、不会挤坏布局的 processing 占位画面，并在生成完成后自动替换成结果。

## 2. 问题描述

### 2.1 当前异常

从截图观察：

- 顶部出现过长英文提示文案。
- 左侧 content setup 卡片被压缩，文字竖排溢出。
- 生成任务已经 queued，但主区域没有明确的图片 processing 卡片。
- 用户只能通过 toast / message 猜测后台正在生成。
- “有用 / 不准”反馈按钮漂浮在空白区域，和生成任务关系不明确。

### 2.2 预期体验

当用户在 Agent / Content Setup 里让 Pokaya 生成图片时：

- 当前 content setup 位置应立即出现图片生成占位卡。
- 占位卡显示 `Queued` 或 `Processing`。
- 占位卡保持目标图片比例，例如 `9:16`、`1:1`、`16:9`。
- 占位卡有 loading spinner / skeleton / subtle progress 动效。
- 生成完成后，占位卡自动替换为生成图片。
- 生成失败时，占位卡原位变成 failed 状态，并提供 retry / adjust prompt 行动。

## 3. 产品目标

### 3.1 用户目标

- 用户提交生成后立刻看到“图片正在这里生成”。
- 用户不用刷新页面，也不用去别的 tab 找结果。
- 用户能理解当前状态：排队中、生成中、成功、失败。
- 页面不再出现内容被挤压、文字竖排、反馈按钮位置混乱的问题。

### 3.2 业务目标

- 降低用户重复点击生成按钮的概率。
- 降低生成慢时的焦虑感。
- 提升 Agent 作为“执行型助手”的可信度。
- 让 Agent 生成链路和 Image Page 的生成体验保持一致。

## 4. 范围

### 4.1 本次包含

- Agent 图片生成 queued / processing / succeeded / failed 状态 UI。
- Content Setup 内的生成占位卡。
- Image Page pending wall card 体验复用。
- 生成状态轮询时的原位更新。
- 失败状态的错误展示和 retry 入口。
- 避免 long message 撑坏布局的 CSS 修复。

### 4.2 本次不包含

- 不重做图片生成后端。
- 不修改 credits 扣费逻辑。
- 不新增新的模型选择逻辑。
- 不改 Image Page 主体验，只复用其 processing 状态规范。
- 不做复杂进度百分比，除非后端已提供可信 progress。

## 5. 用户故事

### 5.1 提交生成

作为用户，当我让 Agent 生成一张图片时，我希望页面马上在当前内容 setup 里显示一个“图片生成中”的卡片，而不是只看到一条 queued 消息。

验收：

- 点击生成后 300ms 内出现 pending card。
- pending card 不改变整个页面主布局宽度。
- Generate 按钮进入 disabled / busy 状态，避免重复提交。

### 5.2 排队中

作为用户，当任务还没开始时，我希望知道任务已经进入队列。

验收：

- 卡片显示 `Queued`。
- 辅助文案显示：`任务已加入队列，马上开始生成。`
- 保留取消入口，若当前后端已支持 cancel。

### 5.3 生成中

作为用户，当模型正在生成时，我希望看到明确的 processing 状态。

验收：

- 卡片显示 `Processing`。
- spinner 或 skeleton 持续动效。
- 辅助文案显示：`模型正在生成，完成后会自动出现在这里。`
- 卡片比例与目标输出比例一致。

### 5.4 生成成功

作为用户，当生成完成时，我希望图片直接出现在同一个位置。

验收：

- pending card 原位替换成图片结果。
- 图片展示下载、保存为 Avatar、保存为 Product、Edit Image 等现有操作。
- Agent 消息可保留简短完成说明，但不能再抢占主视觉。

### 5.5 生成失败

作为用户，当生成失败时，我希望知道失败原因并能继续处理。

验收：

- 原 pending card 变成 failed 状态。
- 显示安全、可读的错误文案。
- 提供 `Retry` 和 `Edit prompt`。
- 不展示 provider、key、内部 route、token、tool schema 等内部信息。

## 6. 体验规范

### 6.1 Processing 卡片布局

Agent 生成图片时复用 Image Page 的 pending wall card 视觉语言，但需要适配 Agent / Content Setup 容器。

推荐结构：

```text
┌──────────────────────────┐
│                          │
│        spinner           │
│        Processing        │
│  模型正在生成，完成后会自动出现在这里。 │
│                          │
│         [Cancel]         │
└──────────────────────────┘
```

要求：

- 卡片必须有稳定 `aspect-ratio`。
- 默认图片比例为当前任务的 `aspectRatio`，没有则 fallback 到项目图片设置，再 fallback 到 `9:16`。
- Desktop 下最小宽度不要低于 240px。
- Mobile 下宽度为容器 100%，不横向溢出。
- 文案最多 2 行，超出省略或换行，不允许撑破容器。

### 6.2 文案

状态文案必须用白名单映射，不直接渲染后端异常全文。

| 状态 | 主文案 | 辅助文案 |
|---|---|---|
| queued | Queued | 任务已加入队列，马上开始生成。 |
| processing | Processing | 模型正在生成，完成后会自动出现在这里。 |
| succeeded | 图片已生成 | 结果已保存在当前 content setup。 |
| failed | 生成失败 | 请调整 prompt 后再试一次。 |

### 6.3 Agent 消息区规则

Agent 可以发送一条短消息确认任务已提交，但不能让长消息成为主视觉。

建议：

- 把 `Generation queued. Pokaya will save...` 改短。
- 中文界面显示：`已开始生成，结果会自动保存到当前内容。`
- 英文界面显示：`Generation started. The result will appear here when ready.`
- 消息 bubble 最大宽度受控，长文本换行。
- 反馈按钮跟随消息 bubble，不允许漂浮到主画布区域。

### 6.4 Content Setup 布局保护

Content Setup 容器必须设置明确的 grid / flex 约束：

- `min-width: 0`
- `overflow-wrap: anywhere`
- pending / result 区使用 `minmax(0, 1fr)`
- 侧栏或窄卡片不得被主消息挤成竖排
- 所有 agent run card 最大宽度必须限制在父容器内

## 7. 状态模型

当前后端已有 `generationJobs`，本次优先沿用。

前端以 `job.status` 驱动 UI：

```json
{
  "id": "job_id",
  "projectId": "project_id",
  "status": "queued | processing | succeeded | failed",
  "type": "image",
  "resultId": "optional_result_id",
  "aspectRatio": "9:16",
  "errorMessage": "safe_error_message"
}
```

要求：

- `queued` 创建后立即插入 pending card。
- `processing` 只更新卡片状态，不重新渲染整页导致跳动。
- `succeeded` 找到 `resultId` 后原位替换成 result card。
- `failed` 原位展示 failed card。
- 如果轮询丢失 job，但 project results 已有新图片，应以结果为准。

## 8. 工程改动建议

### 8.1 前端渲染

优先检查并统一以下已有逻辑：

- `studioPendingWallCard(job)`：Image Page pending card。
- `agentGenerationJobCard(card)`：Agent generation card。
- `updateGenerationStatusInDom(db)`：轮询时更新 queued / processing 状态。
- `pollGenerationQueue()`：生成队列轮询。

建议新增或调整：

1. 抽出共用 pending component，例如 `generationPendingFrame(job, context)`。
2. Image Page 和 Agent / Content Setup 都使用同一套 queued / processing / failed 状态。
3. Agent 工具卡返回 `generation_job` 时，不只显示文本消息，还要插入 pending frame。
4. 对 content setup 内的 pending frame 使用当前输出比例，而不是固定小卡宽度。
5. 生成成功时将 pending frame 替换为 result preview / result card。

### 8.2 CSS 修复

重点修复：

- Agent 消息过长撑宽布局。
- content setup 被压缩成竖排。
- pending frame 在窄容器内文字溢出。
- feedback buttons 和生成状态脱离上下文。

建议增加：

```css
.agent-message,
.agent-tool-card,
.agent-generation-card {
  max-width: 100%;
  min-width: 0;
}

.agent-message p,
.agent-tool-card span,
.agent-generation-processing-frame span {
  overflow-wrap: anywhere;
}
```

实际 class 以现有代码为准，不要机械复制。

### 8.3 后端

后端本期不重写生成流程，只需保证：

- 创建任务后返回 `jobId`、`status`、`type`、`aspectRatio`。
- 任务从 `queued` 到 `processing` 到 `succeeded / failed` 的状态可被前端轮询到。
- failed error 返回前做安全清洗。
- 不把 provider 内部错误、密钥、route、模型供应链细节透出给用户。

## 9. 验收标准

### 9.1 Desktop

在 1440px 宽度下：

- 点击 Agent 生成图片后，当前 content setup 区域 300ms 内出现 pending card。
- 页面不出现文字竖排。
- queued message 不撑破布局。
- feedback buttons 仍在对应 Agent 回复附近。
- processing card 保持目标图片比例。
- 生成完成后图片自动替换 pending card。

### 9.2 Mobile

在 390px 宽度下：

- pending card 不横向溢出。
- 文案不重叠。
- spinner、状态、取消 / retry 按钮都可点击。
- 生成完成后结果图完整可见。

### 9.3 慢任务

模拟生成超过 30 秒：

- UI 保持 processing 状态。
- 不重复插入多个 pending card。
- 用户刷新页面后仍能看到 queued / processing 状态。

### 9.4 失败任务

模拟后端返回 failed：

- pending card 原位变成 failed。
- 显示用户可理解的错误。
- 提供 retry / edit prompt。
- 不泄露内部 provider / API 信息。

## 10. QA 测试用例

1. 从 Agent 输入“帮我生成一张产品图”。
2. 确认任务 queued 后立刻出现 pending card。
3. 等待轮询进入 processing，确认状态文案更新。
4. 等待 succeeded，确认图片出现在原位置。
5. 重新生成一张 `16:9` 图片，确认 pending card 是横图比例。
6. 重新生成一张 `1:1` 图片，确认 pending card 是方图比例。
7. 模拟 failed，确认失败卡和 retry。
8. 刷新页面，确认未完成任务仍显示 pending card。
9. 在 mobile viewport 重复以上流程。
10. 检查 console 无布局相关报错。

## 11. 成功指标

- 图片生成后用户重复点击 Generate 的比例下降。
- Agent 生成任务相关客服反馈减少。
- queued / processing 状态下页面布局异常截图减少。
- 从 Agent 生成到查看结果的完成率提升。

## 12. 优先级

P0：

- 修复 Agent 生成图片时没有稳定 processing 画面。
- 修复 queued message 撑坏 content setup 布局。
- 生成完成后 pending card 原位替换结果。

P1：

- failed 状态 retry / edit prompt。
- 刷新后恢复 pending 状态。
- mobile 细节优化。

P2：

- 更精细的进度提示。
- 多任务队列的批量 pending 展示。
- 更接近 Image Page 的 skeleton 动效。
