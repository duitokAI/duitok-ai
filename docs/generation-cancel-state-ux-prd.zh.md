# Cancel Generation 取消状态机与即时隐藏体验 PRD

## 1. 背景

当前 Studio 图片墙 / Clone Prompt 共享的生成卡片里，用户点击 `Cancel generation` 后，卡片不会稳定地“立刻消失”。前端现在会把对应 generation job 标记为 `cancelled`，再等待后端返回新的数据库状态；但后端的 generation-state 仍会把 `queued / processing / failed / cancelled` 任务返回给前端，所以被取消的卡片可能继续留在墙上，或在下一次刷新状态时重新出现。

这会造成两个问题：

- 用户以为取消没有生效，会重复点击或怀疑系统卡住。
- 后台实际已经取消或软取消，但前端仍把它当作需要展示的任务，破坏图片墙的稳定性。

本 PRD 定义生成任务什么时候可以取消、什么时候不能取消，以及点击取消后前端和后端应该如何协作。

## 2. 目标

- 点击取消后，目标卡片必须立即从当前图片墙和历史 pending 列表中消失。
- 明确定义每个生成阶段的可取消规则，避免“按钮能点但后台已经太晚”的模糊体验。
- 后端返回状态不能让已取消卡片重新刷回图片墙。
- 对供应商已经接单或可能已产生供应商成本的任务，进入成本锁定，不再允许用户取消。
- 保持扣费语义清楚：取消成功后用户不应为未产出的结果付费。

## 3. 非目标

- 不要求第一期接入所有供应商的真实取消 API。
- 不重做整套生成队列系统。
- 不新增真实百分比进度。
- 不改变图片墙瀑布流布局和结果卡片视觉设计。

## 4. 当前行为梳理

### 4.1 前端

当前 `data-generation-cancel` 点击后会进入 `cancelGenerationJob(jobId)`。

现有逻辑：

- 弹出浏览器原生确认框。
- 用户确认后，把本地 `generationJobs` 中该 job 标记为 `cancelled`。
- 调用 `POST /api/generation-jobs/:id/cancel`。
- 接口成功后用后端返回的 `db` 覆盖前端状态。
- 接口失败则回滚到之前的 `db`。

问题是：前端只是把状态改成 `cancelled`，不等于从墙上隐藏；如果渲染逻辑仍包含 `cancelled`，卡片就不会消失。

### 4.2 后端

当前取消接口只处理 `queued` 和 `processing`：

- 找到用户自己的 generation job。
- 如果状态是 `queued` 或 `processing`，标记为 `cancelled`。
- 记录 `cancelledAt / completedAt`。
- 将 `creditsCharged` 置为 `0`。
- 返回 `publicState(db, user)`。

但后端的 generation-state 仍可能返回 `cancelled` job；同时，如果任务已经提交给供应商，当前并没有统一的 provider cancel adapter。

## 5. 用户体验原则

### 5.1 用户点击取消后，界面先响应

取消是一个“撤回等待”的动作。用户点击后不应该继续看见那张正在生成的卡片。

要求：

- 点击取消后，不等待接口返回，卡片立即从当前墙面移除。
- 图片墙布局重新流动，但不能出现闪烁、空白大洞或横向跳动。
- 如果接口失败，再把卡片恢复，并显示错误提示。

### 5.2 不用原生 confirm 阻断操作

原生确认框会打断 Studio 工作流，也会延迟“立刻消失”的感受。

建议第一期改为：

- 单击取消即执行。
- toast 显示：`已取消生成`
- 可选增强：toast 内提供 `撤销`，有效期 5 秒。

如果暂时不做撤销，也应去掉原生 confirm，让取消成为即时动作。

### 5.3 “能不能取消”由阶段决定

按钮不能只根据 `queued / processing` 粗暴显示。需要根据 `stage` 判断：

| 阶段 | 前端状态 | 用户是否可取消 | 体验规则 |
| --- | --- | --- | --- |
| `queued` | 排队中 | 可以 | 点击后立即隐藏，后端直接标记 `cancelled` |
| `prompt_advanced` | 优化 prompt 中 | 可以 | 点击后立即隐藏；如果优化已在执行，后端软取消并丢弃后续结果 |
| `provider_submitted` 但供应商请求尚未开始 | 准备提交模型 | 可以 | 点击后立即隐藏；后端在提交前边界检查取消状态 |
| `provider_submitted` 且已有 `providerStartedAt` | 已提交供应商 | 不可以 | 供应商可能已经开始计费，隐藏取消按钮 |
| `provider_submitted` 且已有供应商任务 ID | 模型生成中 | 不可以 | 供应商已接受任务，视为成本锁定，不允许用户取消 |
| `saving_asset` | 保存结果中 | 不可以 | 不显示取消按钮，或置灰提示 `正在保存，无法取消` |
| `succeeded` | 已完成 | 不可以 | 不显示取消按钮 |
| `failed` | 已失败 | 不可以 | 不显示取消按钮，展示 `Retry / Edit` |
| `cancelled` | 已取消 | 不展示 | 不再回到图片墙 |

## 6. 产品规则

### 6.1 卡片即时隐藏

当用户点击取消：

1. 将 job id 加入前端本地隐藏集合：`cancelledGenerationJobIds`。
2. 当前图片墙、底部历史 pending 缩略图、Clone Prompt 墙面都过滤该 job。
3. 触发接口请求。
4. 接口成功：保持隐藏，并同步最新 job 状态。
5. 接口失败：从隐藏集合移除该 job，恢复卡片，并 toast 告知失败原因。

该隐藏集合需要持续到本次页面会话结束，避免后端短轮询把刚取消的卡重新带回来。

### 6.2 后端不应默认返回已取消卡片给墙面

generation-state 应支持隐藏语义：

- 默认不向普通墙面返回 `cancelled` jobs。
- 如需诊断，可通过 admin/debug 接口查看 cancelled job。
- 如果为了历史审计必须返回，则 job 上应带 `hiddenFromWall: true`，前端必须过滤。

### 6.3 成本锁定规则

一旦后端开始调用供应商，或供应商返回任务 ID，任务进入成本锁定。

成本锁定定义：

- job 写入 `providerBillingLocked: true`。
- 同时写入 `cancelLockedAt` 和 `cancelLockReason`。
- 前端不再展示取消按钮。
- 如果用户因为轮询延迟刚好点到取消，后端返回 `409`。
- toast 显示：`供应商已接受任务并可能已扣费，已无法取消`

第一期成本锁定边界：

- `providerStartedAt` 存在：供应商请求已经开始，视为可能计费。
- `providerTaskId` 或 `taskId` 存在：供应商已接受任务，视为已进入计费区间。

### 6.4 软取消规则

软取消只允许发生在用户点击取消早于成本锁定，但后端异步流程仍在收尾的情况。用户不能在成本锁定后主动发起软取消。

软取消定义：

- 用户界面立即隐藏。
- 后端 job 标记 `cancelRequestedAt`。
- 如果 provider 后续返回结果，worker 不保存结果、不插入 assets、不把结果重新推回墙面。
- 用户侧不扣费；如果已有预扣费，走退款或 credit release。
- 内部可记录供应商成本，但不暴露给用户。

### 6.5 硬取消规则

如果未来供应商支持取消 API，也只能用于内部成本控制或后台补偿；用户侧是否可取消仍以成本锁定为准。

硬取消定义：

- job 标记 `providerCancelAttempted: true`。
- provider 取消成功后标记 `providerCancelStatus: "cancelled"`。
- provider 取消失败或超时，降级为软取消。
- 无论硬取消成功与否，用户界面都不应重新显示已取消卡片。

### 6.6 不可取消阶段

进入成本锁定或 `saving_asset` 后，用户不再能取消。

前端规则：

- `saving_asset` 不展示取消按钮。
- 如果由于状态刷新延迟，用户刚好点到取消，后端返回 `too_late`，前端不要隐藏已完成结果。
- toast 显示：`结果正在保存，已无法取消`

## 7. 状态字段建议

建议 generation job 增加或规范以下字段：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `status` | string | `queued / processing / succeeded / failed / cancelled` |
| `stage` | string | `queued / prompt_advanced / provider_submitted / saving_asset` |
| `cancelRequestedAt` | ISO string | 用户点击取消的时间 |
| `cancelledAt` | ISO string | 系统确认取消的时间 |
| `cancelMode` | string | `hard / soft / local_only / too_late` |
| `hiddenFromWall` | boolean | 是否不应展示在普通结果墙 |
| `providerTaskId` | string | 上游供应商任务 ID |
| `providerCancelAttempted` | boolean | 是否尝试调用供应商取消 |
| `providerCancelStatus` | string | `not_supported / pending / cancelled / failed` |
| `providerBillingLocked` | boolean | 供应商请求已开始或任务已被接受，用户侧不可取消 |
| `cancelLockedAt` | ISO string | 取消能力被锁定的时间 |
| `cancelLockReason` | string | `provider_request_started / provider_task_accepted / saving_asset` |
| `creditsCharged` | number | 用户实际扣费 |
| `creditsReleasedAt` | ISO string | 取消释放 credit 的时间 |

## 8. API 合约

### 8.1 取消接口

`POST /api/generation-jobs/:id/cancel`

建议返回：

```json
{
  "ok": true,
  "jobId": "job_123",
  "status": "cancelled",
  "stage": "provider_submitted",
  "cancelMode": "soft",
  "hiddenFromWall": true,
  "canCancel": false,
  "reason": null,
  "creditsCharged": 0
}
```

如果已经太晚：

```json
{
  "ok": false,
  "jobId": "job_123",
  "status": "processing",
  "stage": "saving_asset",
  "cancelMode": "too_late",
  "hiddenFromWall": false,
  "canCancel": false,
  "reason": "saving_asset"
}
```

### 8.2 generation-state

普通 UI 拉取状态时：

- 不返回 `hiddenFromWall === true` 的 jobs，或者前端统一过滤。
- 不把 `cancelled` job 当作 pending 卡片渲染。
- `failed` job 可保留在墙面，因为它需要 `Retry / Edit` 恢复路径。

## 9. 前端实现要求

### 9.1 取消按钮显示条件

新增统一判断函数：

```js
function getGenerationCancelState(job) {
  if (!job || job.optimistic) return { canCancel: false, reason: "optimistic" };
  if (["succeeded", "failed", "cancelled"].includes(job.status)) return { canCancel: false, reason: job.status };
  if (job.stage === "saving_asset") return { canCancel: false, reason: "saving_asset" };
  if (["queued", "processing"].includes(job.status)) return { canCancel: true, reason: null };
  return { canCancel: false, reason: "unknown" };
}
```

`studioPendingWallCard` 和 `imagePendingThumb` 必须共用这个函数，避免一处显示可取消、一处不显示。

### 9.2 本地隐藏集合

建议新增：

```js
state.cancelledGenerationJobIds = new Set()
```

或使用现有 state 结构中的数组字段，确保渲染前过滤：

```js
function shouldHideGenerationJob(job) {
  return job.hiddenFromWall || job.status === "cancelled" || state.cancelledGenerationJobIds.has(job.id);
}
```

所有墙面入口都使用该判断：

- Image Page 主图片墙
- Video / Clone Prompt 共享墙面
- 历史 pending thumb
- 状态刷新合并逻辑

### 9.3 接口失败回滚

如果取消接口失败：

- 从本地隐藏集合移除 job id。
- 恢复原 job。
- toast：`取消失败，请稍后重试`
- 如果失败原因是 `saving_asset`，刷新状态并展示最终结果。

### 9.4 多张批量生成

当一次生成 `1/4`、`2/4` 等多张结果时：

- 取消单张卡片，只取消该 job，不影响其它同批次 job。
- 如果后续支持“取消整个批次”，必须用独立按钮和明确文案，不复用单卡取消按钮。

## 10. 后端实现要求

### 10.1 worker 边界检查

worker 需要在关键边界检查取消状态：

1. 开始处理前。
2. prompt 优化完成后、提交供应商前。
3. 供应商返回后、保存 asset 前。
4. 保存 asset 后、写入结果墙前。

如果发现 `cancelRequestedAt` 或 `status === "cancelled"`：

- 停止后续写入。
- 不保存 asset。
- 不追加 result。
- 不扣用户 credit。
- 清理 `activeGenerationJobs`。

### 10.2 activeGenerationJobs 清理

取消 queued job 时，如果 job 已经在 `activeGenerationJobs` 中，应确保最终会被移除。

建议：

- queued 且未启动：直接从 active set 移除。
- processing：不强行中断 Promise，但在 finally 中清理 active set。
- 所有取消路径都要避免 job 永久占用并发槽。

### 10.3 provider adapter

第一期可以不接真实供应商取消，但需要预留接口：

```js
async function cancelProviderGeneration(job) {
  if (!job.provider || !job.providerTaskId) return { supported: false };
  // provider-specific cancel implementation
}
```

供应商不支持取消时返回 `not_supported`，走软取消。

## 11. 文案规范

按钮 tooltip：

- 可取消：`Cancel generation`
- 中文环境：`取消生成`
- 保存中不可取消：`正在保存，无法取消`

toast：

- 成功：`已取消生成`
- 成本锁定：`供应商已接受任务并可能已扣费，已无法取消`
- 太晚：`结果正在保存，已无法取消`
- 失败：`取消失败，请稍后重试`

## 12. 验收标准

- 点击生成中卡片的取消按钮后，该卡片在 100ms 内从当前墙面消失。
- API 成功后，被取消卡片不会因为 generation-state 刷新重新出现。
- API 失败时，原卡片恢复，且用户看到失败提示。
- `queued / prompt_advanced` 阶段可以点击取消。
- 进入 `providerStartedAt / providerTaskId / saving_asset` 后不能取消。
- `saving_asset / succeeded / failed / cancelled` 阶段不展示可点击取消按钮。
- 供应商返回结果晚于取消请求时，结果不会被保存进项目墙。
- 取消单张批量任务不会影响同批次其它卡片。
- 刷新页面后，已取消任务不再作为 pending 卡展示。
- 移动端和桌面端 hover / focus / tooltip 不造成卡片尺寸变化。

## 13. 埋点

建议新增或复用：

- `generation_cancel_clicked`
- `generation_cancel_hidden_optimistically`
- `generation_cancel_api_succeeded`
- `generation_cancel_api_failed`
- `generation_cancel_too_late`
- `generation_cancel_provider_attempted`
- `generation_cancel_provider_failed`

关键属性：

- `jobId`
- `projectId`
- `model`
- `provider`
- `status`
- `stage`
- `cancelMode`
- `waitSeconds`
- `creditsCharged`

## 14. 实施优先级

### P0

- 前端本地隐藏集合。
- 所有墙面统一过滤 `cancelled / hiddenFromWall / locallyHidden` jobs。
- 取消按钮按阶段显示。
- 去掉原生 confirm，点击后即时隐藏。
- API 失败恢复卡片。

### P1

- 后端新增 `cancelRequestedAt / cancelMode / hiddenFromWall`。
- worker 在关键边界丢弃已取消结果。
- generation-state 默认不返回已取消卡片。

### P2

- provider cancel adapter。
- 支持供应商级硬取消。
- toast 撤销取消。
- 批量取消整组任务。

## 15. 建议执行顺序

1. 先改前端渲染过滤和本地隐藏，解决“点了取消卡片还在”的即时体验。
2. 再改后端 cancel response 和 generation-state，解决“刷新后又回来”的一致性问题。
3. 补 worker 边界检查，避免供应商晚返回后仍保存结果。
4. 最后接 provider cancel adapter，逐个供应商支持硬取消。
