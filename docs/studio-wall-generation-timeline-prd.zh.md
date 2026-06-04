# Studio 图片墙生成时间线稳定 PRD

## 1. 背景

当前 Studio 图片墙在一批图片生成完成后，仍可能出现排序错乱：

- 新生成成功的图片被旧的 Failed 卡片压到后面。
- 同一批生成里，成功图和失败卡片没有保持在一起。
- Generating 卡片完成后，最终图片没有稳定替换原来的位置，而是重新进入结果列表排序。
- 用户无法判断图片墙到底按「生成任务时间」排序，还是按「成功完成时间」排序。

用户预期更接近 Higgsfield / Canvas 类创作体验：生成任务一旦出现在墙上，它的位置就应该稳定。成功、失败、取消都只是同一个任务卡片的状态变化，而不是重新插队。

## 2. 核心目标

把图片墙从「结果列表」优化成「生成任务时间线」。

最重要目标：

> Generating 卡片出现在哪个位置，成功 / Failed / Cancelled 后就原地替换，不重新排到别的位置。

这个目标成立后，下面问题会自然一起改善：

- 最新一批生成不会被旧 Failed 卡片隔开。
- 同一批生成的多张图能保持相邻。
- Failed 和成功图使用同一套排序规则。
- 刷新页面后图片墙顺序仍然一致。

## 3. 非目标

本 PRD 不处理：

- 图片墙整体视觉重设计。
- 图片质量、模型能力、prompt 优化。
- 图片下载、收藏、删除、保存到项目的交互。
- 后台 provider 成功率或扣费逻辑。
- Content Library 的资产排序。

## 4. 产品原则

### 4.1 任务位置优先于结果状态

图片墙里的最小单位应该是 generation job，而不是 result。

一个 job 从创建开始，就拥有固定位置：

```text
queued / processing -> succeeded / failed / cancelled
```

状态可以变化，位置不能因为状态变化而跳动。

### 4.2 同一批生成必须成组

如果用户一次生成 3 张图片：

- 这 3 个 Generating 卡片应该相邻。
- 其中 2 张成功、1 张失败时，仍然保持相邻。
- 成功图不应该跑到图片墙最前面，失败图不应该被留在后面。

### 4.3 排序只认任务创建时间

图片墙排序必须统一使用：

```text
job.createdAt DESC
batchIndex ASC
```

禁止混用：

- result.createdAt
- job.completedAt
- result 保存时间
- 图片上传到 storage 的完成时间

这些字段只能作为展示或 debug 使用，不能作为墙面主排序依据。

### 4.4 刷新前后一致

用户刷新页面后，图片墙顺序必须和刷新前一致。

不能出现：

- 第一次看到图片在原地，刷新后跑到最前。
- Failed 卡片刷新后集中到前面。
- 成功图刷新后和同批 Failed 分离。

## 5. 数据需求

### 5.1 Generation Job 必须保存

每个生成任务必须有：

```json
{
  "id": "job-id",
  "projectId": "project-id",
  "resultId": "result-id-if-succeeded",
  "status": "queued | processing | succeeded | failed | cancelled",
  "step": "image",
  "type": "image",
  "createdAt": "2026-06-05T00:00:00.000Z",
  "completedAt": "2026-06-05T00:00:20.000Z",
  "batchIndex": 1,
  "batchCount": 3,
  "aspectRatio": "9:16"
}
```

### 5.2 Result 必须保存任务锚点

成功结果必须保留原 job 的时间线信息：

```json
{
  "id": "result-id",
  "generationJobId": "job-id",
  "timelineAt": "job.createdAt",
  "batchIndex": 1,
  "batchCount": 3,
  "createdAt": "result completed time"
}
```

说明：

- `createdAt` 表示结果完成时间。
- `timelineAt` 表示墙面排序时间，必须来自 `job.createdAt`。
- 如果旧数据没有 `timelineAt`，前端和后端可以 fallback 到匹配的 job.createdAt。

### 5.3 Public API 必须返回锚点

`/api/projects/:id/generation-state` 和图片墙分页接口必须返回：

- `result.generationJobId`
- `result.timelineAt`
- `result.batchIndex`
- `result.batchCount`
- `job.resultId`
- `job.createdAt`
- `job.batchIndex`
- `job.batchCount`

否则前端无法稳定把 succeeded result 和原 pending job 对上。

## 6. 前端排序规则

### 6.1 墙面统一时间线

前端需要把 pending jobs 和 results 合并成一个 timeline：

```js
const entries = [
  ...activeOrFailedJobs,
  ...results
];
```

每个 entry 计算：

```js
timelineAt = result.timelineAt || originJob.createdAt || result.createdAt;
batchIndex = result.batchIndex || originJob.batchIndex || fallbackIndex;
```

最终排序：

```js
entries.sort((a, b) =>
  Date.parse(b.timelineAt) - Date.parse(a.timelineAt)
  || Number(a.batchIndex || 9999) - Number(b.batchIndex || 9999)
);
```

### 6.2 成功结果和 job 去重

如果一个 job 已经 succeeded，并且 result 已经存在：

- 墙上只显示 result。
- 不再额外显示 succeeded job 卡片。

如果 job failed：

- 显示 failed job 卡片。
- 不需要 result。

如果 job processing：

- 显示 generating job 卡片。

### 6.3 原地替换

Generating 卡片的 DOM key 必须稳定：

```text
generation-job:{job.id}
```

成功后 result 卡片应继续使用同一个位置锚点：

```text
generation-result:{result.id}:{generationJobId}
```

视觉上表现为原位置替换，而不是新卡插入。

## 7. 后端实现需求

### 7.1 创建批次时写入 batch 信息

一次生成多张图时，每个 job 必须保存：

- `batchIndex`
- `batchCount`
- `createdAt`
- `aspectRatio`

同一批的 `createdAt` 可以相同或接近，但排序必须由 `batchIndex` 保证稳定。

### 7.2 成功时把 job 锚点复制到 result

`completeQueuedGeneration()` 里创建 result 时，需要写入：

```js
generationJobId: job.id,
timelineAt: job.createdAt,
batchIndex: job.batchIndex,
batchCount: job.batchCount
```

### 7.3 公开 result 时补齐旧数据

对于旧 result，如果没有 `generationJobId` 或 `timelineAt`：

- 后端应尝试用 `job.resultId === result.id` 找回 origin job。
- 找到后，在 public payload 里补齐 `timelineAt` 和 `batchIndex`。

这样旧数据也不会继续排序错乱。

## 8. UI 状态需求

### 8.1 Generating

Generating 卡片显示在任务创建时的位置：

- 显示 `Generating`
- 显示轻量 spinner
- 保持生成比例
- 允许取消

位置规则：

- 页面刷新后仍在同一时间线位置。
- 成功后原地替换为图片。
- 失败后原地替换为 Failed。

### 8.2 Failed

Failed 卡片不是单独一类排序结果，而是 job 的失败状态。

显示：

- `Failed`
- `Credits safe`
- `Retry`
- `Edit`

位置规则：

- 保持原 job 的位置。
- 不能因为失败集中排到前面或后面。

### 8.3 Succeeded

成功图片显示：

- 图片本体
- 右侧操作栏
- hover / selection 逻辑保持不变

位置规则：

- 使用 `timelineAt` 排序。
- 不使用完成时间插到最前面。

## 9. 验收场景

### 9.1 一批 3 张全部成功

操作：

1. 用户一次生成 3 张图片。
2. 墙上出现 3 个相邻 Generating 卡。
3. 3 张陆续成功。

预期：

- 3 张结果图仍在原来的 3 个位置。
- 不会跳到旧 Failed 卡片前面或后面。
- 刷新后位置不变。

### 9.2 一批 3 张，2 成功 1 失败

操作：

1. 用户一次生成 3 张图片。
2. 第 1、3 张成功，第 2 张失败。

预期：

```text
成功图 1 / Failed 2 / 成功图 3
```

三张保持相邻，不被历史结果打散。

### 9.3 新生成图片不能排到旧 Failed 后面

操作：

1. 墙上已有很多旧 Failed。
2. 用户现在生成 3 张新图。

预期：

- 新的 3 个 job 以当前时间出现在时间线前方。
- 成功后仍保留在前方。
- 不应该出现在旧 Failed 后面。

### 9.4 刷新一致性

操作：

1. 生成一批图片。
2. 等待其中部分成功、部分失败。
3. 刷新页面。

预期：

- 刷新前后的顺序一致。
- Generating / Failed / Succeeded 不重新分组。

## 10. 技术验收

- `npm run build` 通过。
- 新生成 result payload 里可以看到 `generationJobId` 和 `timelineAt`。
- failed job 和 succeeded result 使用同一套 timeline 排序函数。
- 图片墙不再先 `reverse results` 再混合 pending，而是统一 timeline entries 后排序。
- 没有因为 hover、scroll、zoom 导致卡片重新排序。

## 11. 优先级

### P0

- Generating 原地占位。
- 成功 / Failed 原地替换。
- result 保存 `generationJobId` 和 `timelineAt`。
- API 返回排序锚点。
- 前端统一 timeline 排序。

### P1

- 旧数据通过 job.resultId 补齐 timelineAt。
- 同批 batchIndex 稳定排序。
- 刷新后一致性验证。

### P2

- 更接近 Higgsfield 的 canvas 分组视觉。
- 批次 hover 高亮。
- 批次折叠 / 展开。

## 12. 执行建议

第一阶段只做排序和数据锚点，不重做视觉：

1. 后端 result 保存并公开 `generationJobId / timelineAt / batchIndex / batchCount`。
2. 前端 `resultOriginJob()` 支持通过 `generationJobId` 匹配。
3. 前端 `studioWallTimelineTime()` 优先使用 `timelineAt`。
4. 前端把 pending jobs 和 results 合成统一 timeline 后排序。
5. 本地 build。
6. 推送云端后在真实生成场景验证。

只要第 1 点「Generating 原地占位」真正成立，2、3、4 的大部分错位问题会自然消失；后续再考虑 Higgsfield 风格的批次视觉和 canvas 感。
