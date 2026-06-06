# Image Generate Higgsfield 稳定占位 PRD

## 1. 背景

用户在 Image Page 点击 `Generate Media` 时，会感知到两次闪缩：

1. 点击 `Generate Media` 的瞬间，整体画面闪缩一次。
2. 新生成中的 pending card 出现在 media wall 第一格时，图片墙再次闪缩一次。

用户提供的 Higgsfield 录屏显示，Higgsfield 在同类场景中非常稳定：点击 `Generate` 后，底部输入栏不动，图片墙不闪，新生成任务以固定暗色 pending slot 的形式逐张进入队列。

本 PRD 目标是把 Pokaya Image Generate 流程改成类似 Higgsfield 的稳定模型：**点击不动布局，先占位，再原地升级**。

## 2. 当前问题

### 2.1 Generate 点击瞬间触发全局布局状态

当前点击 Generate 后会进入 generation submit / active 状态，并影响 `html`、`body`、`#app`、`.studio-shell`、`.workspace`、`.studio-result-wall`、`.studio-wall-grid`、`.image-generate-console` 等范围。

这会导致浏览器在点击瞬间重新计算整页布局，即使视觉变化很小，用户也可能看到整屏闪一下。

### 2.2 pending card 是后插入，不是预占位

当前新任务进入 media wall 时，会把 pending card 插入时间线第一格。由于第一格是图片墙顶部核心位置，插入一个新节点会导致后续卡片整体后移，瀑布流 / grid 重新计算。

这符合“按生成时间排序”的业务规则，但视觉上会出现一次明显重排。

### 2.3 pending card 与结果卡片外框不够强约束

生成中、失败、成功卡片虽然已经有 aspect ratio，但生成状态内部 spinner、cancel、状态文案、按钮、失败说明仍可能触发局部布局变化。多张 pending 同时存在时，变化更容易被用户感知。

### 2.4 菜单、按钮、生成状态同时变化

用户可能在模型菜单、resolution 菜单打开时点击 Generate。此时菜单关闭、按钮 loading、全局 generation class、pending card 插入同时发生，多个状态同帧变化，增加闪缩概率。

## 3. Higgsfield 参考结论

从用户录屏观察到 Higgsfield 的关键策略：

1. **底部 composer 是 fixed / overlay 工作台**
   - 它覆盖在页面底部，不参与图片墙布局。
   - 点击 Generate 后 composer 外框尺寸不变，只改变按钮内部 loading。

2. **pending slot 使用固定暗色占位**
   - 生成中卡片是固定比例的暗色 skeleton。
   - spinner 和取消按钮都在卡片内部 absolute 布局，不影响卡片高度。

3. **生成队列槽位在点击前后保持一致**
   - 点击 Generate 不会让整个 wall 先白闪或缩放。
   - 新 pending 更像“某个固定 slot 进入 loading”，不是“整墙新增一个会改变流式布局的卡片”。

4. **按钮 loading 不改变按钮尺寸**
   - `Generate` 文字和 loading 状态在同一按钮盒子里切换。
   - 不改变按钮高度、宽度、padding、grid column。

5. **wall 与 composer 解耦**
   - composer 的状态变化不影响 wall 的 grid 计算。
   - wall 的 pending 变化不影响 composer 的位置。

## 4. 产品目标

### 4.1 体验目标

- 点击 `Generate Media` 时，整屏不闪、不缩、不跳。
- 新 pending card 仍然出现在第一格，仍按生成时间排序。
- 新 pending card 出现时，现有图片墙只发生可控、平滑、低感知的位移。
- pending、failed、success 使用稳定外框，不因状态内容变化改变卡片尺寸。
- 用户刚选完 model / aspect ratio / resolution 后立即 Generate，也不会触发菜单和 bar 的混合闪缩。

### 4.2 工程指标

- 点击 Generate 后 300ms 内，`.image-generate-console` 外框尺寸变化 `<= 1px`。
- 点击 Generate 后 300ms 内，`.studio-result-wall` 顶部位置变化 `<= 1px`。
- 第一屏已有 result card 的单次可见位移 `<= 2px`，或通过 FLIP 动画平滑过渡。
- pending slot 从 optimistic 到 server queued job 的替换不得新增第二张卡。
- Generate button loading 状态不得改变按钮尺寸。

## 5. 非目标

- 不改变生成模型、扣费、队列、后端供应商路由。
- 不改变“新生成任务在第一格”的排序规则。
- 不把 pending 放到墙尾。
- 不重写整个 Studio 布局系统。
- 不引入新的前端框架、动画库或 UI kit。

## 6. 方案概览

核心方案：**Optimistic Stable Slot**

点击 Generate 的同一帧：

1. 读取当前可见设置：model、aspect ratio、resolution、count、prompt。
2. 立即关闭所有 Image 菜单，但不改变 composer 外框。
3. 创建一个或多个 optimistic pending slot，插入第一格。
4. pending slot 使用固定 aspect ratio，不等待 API 返回。
5. 冻结 wall 和 composer 的外框尺寸 300-500ms。
6. API 返回 queued job 后，不再插入新 pending，而是原地 hydrate optimistic slot。
7. job 完成后，在同一 slot 中替换成成功图片；失败则替换成 failed 状态。

## 7. 详细设计

### 7.1 Generate 点击阶段

点击 `Generate Media` 时，前端执行顺序必须固定：

1. `syncImageConsoleBeforeGenerate()`
   - 读取当前 DOM 可见的 model、aspect ratio、resolution。
   - 读取 textarea prompt。

2. `closeImageGenerateConsoleMenus()`
   - 关闭 model / resolution / aspect ratio 菜单。
   - 只关闭浮层，不触发布局收缩。

3. `createOptimisticImageSlots()`
   - 按 count 生成 optimistic pending slot。
   - slot id 使用 `optimistic_${timestamp}_${index}`。
   - slot 必须包含：
     - `projectId`
     - `action: "generate-image"`
     - `status: "queued"`
     - `model`
     - `aspectRatio`
     - `resolution`
     - `promptSnapshot`
     - `createdAt`
     - `timelineAt`
     - `batchIndex`
     - `batchCount`

4. `lockImageGenerateVisualFrame()`
   - 只锁 Image Page 的 wall 和 composer。
   - 不给 `html/body/#app` 加会触发整页重排的 class。

5. `set({ generating: true, optimisticGenerationJobs })`
   - 只让按钮进入 loading。
   - 不改变 composer 尺寸。

6. 发送 API 请求。

### 7.2 pending slot 插入规则

pending slot 仍参与时间线排序：

- 新任务 `timelineAt = now`。
- 它应该排在第一格。
- 多张 batch 使用 `batchIndex` 保持内部顺序。

但它必须是稳定 slot：

- 卡片外层 `aspect-ratio` 固定为当前选择比例。
- 卡片内部所有 loading 内容使用 absolute / grid center，不影响外层尺寸。
- spinner、cancel button、status text 不改变卡片高度。

### 7.3 optimistic slot hydrate

API 返回 `queuedGenerationJobs` 后：

- 用 server job id 替换 optimistic id。
- 保留同一个 DOM card。
- 更新 dataset：
  - `data-generation-job-id`
  - `data-generation-job-status`
  - `data-aspect-ratio`
  - `data-media-ratio`
- 不重新 `insertBefore` 一个新的 card。
- 不让 optimistic card 消失后再出现真实 card。

如果 API 失败：

- optimistic slot 进入 failed/error 状态。
- 展示错误信息和 retry/edit 操作。
- 不要瞬间移除 slot，避免又一次 wall 重排。

### 7.4 completed 原地替换

当 job 成功返回 result：

- 如果 result 有 `generationJobId`，找到对应 pending slot。
- 在同一个 card 位置替换为 result card。
- 成功图片使用同样 aspect ratio 容器。
- 图片 `src` 加载前先显示同尺寸 skeleton / blur background。
- 图片 decode 完成后淡入，不改变容器高度。

### 7.5 wall 视觉冻结

点击 Generate 后 300-500ms 内：

- 记录 `.studio-result-wall` 当前 bounding rect。
- 设置临时 `min-height`，避免 wall 高度抖动。
- 禁用 scroll anchoring。
- 保留当前 scroll position。
- 如果需要移动已有卡片，只使用 transform FLIP，不使用 layout transition。

冻结只作用在 Image Page：

- 不要给 `html/body/#app` 加大范围 layout class。
- 不影响 sidebar、top tabs、browser viewport。

### 7.6 composer 稳定规则

Image bottom bar 在以下状态外框必须一致：

- idle
- hover
- menu open
- submitting
- queued
- generating
- failed

允许变化：

- Generate button 内部 icon 从 send 变 spinner。
- button 文案从 `Generate Media` 变 `Queuing`。
- credit 小字变 `You can keep typing`。

不允许变化：

- composer width / height / min-height / max-height。
- composer padding / border-width / grid-template-columns。
- prompt textarea row count。
- Avatar/Product reference button 尺寸。
- Generate button 外框尺寸。

## 8. 数据结构建议

前端新增或标准化 optimistic slot 字段：

```js
{
  id: "optimistic_...",
  optimistic: true,
  hydratedJobId: "",
  projectId,
  action: "generate-image",
  step: "image",
  type: "image",
  status: "queued",
  model,
  aspectRatio,
  resolution,
  promptSnapshot,
  createdAt,
  timelineAt,
  batchIndex,
  batchCount
}
```

API 返回 server job 后：

```js
{
  id: "job_...",
  optimisticSourceId: "optimistic_...",
  status: "queued",
  ...
}
```

如果后端暂时不返回 `optimisticSourceId`，前端可按同一 project、action、createdAt 距离、batchIndex 匹配，但建议后端支持 request-side `clientJobId`，让替换更可靠。

## 9. 实施步骤

### Phase 1：点击不动布局

- 删除或收窄 `is-generation-submitting` 对全站容器的影响。
- Image Generate 点击时只锁 `.image-higgsfield-mode` 内部。
- Generate button loading 保持同尺寸。
- 菜单打开时点击 Generate，先读取值再关闭菜单。

### Phase 2：稳定 optimistic slot

- 点击 Generate 同帧创建 optimistic pending slot。
- slot 使用当前 aspect ratio 固定外框。
- 不等待 API 返回再插入 pending。
- pending 内部内容 absolute 化。

### Phase 3：server job 原地 hydrate

- queued job 返回后匹配 optimistic slot。
- 原地更新 job id 和状态。
- 避免 optimistic card 删除 + server pending card 新增。

### Phase 4：result 原地替换

- completed result 按 `generationJobId` 找回 pending slot。
- 在同一位置替换为 result card。
- 图片加载前保持同尺寸 skeleton。

### Phase 5：视觉回归验证

- 录制点击 Generate 前后 1 秒。
- 检查 composer bounding box。
- 检查 wall bounding box。
- 检查第一屏 result card 位移。
- 验证 1 张、2 张、4 张 batch。
- 验证 API 失败、cancel、retry。

## 10. 验收标准

### 10.1 点击 Generate

- 点击后 composer 不缩、不跳、不改变外框。
- Generate button loading 不改变按钮宽高。
- 菜单如果打开，会在同一帧关闭，不造成 bar 重排。
- 页面主体不出现白闪、暗闪、背景闪。

### 10.2 pending 出现

- 新 pending 出现在第一格。
- 新 pending 使用当前选择的 aspect ratio。
- 第一屏已有图片不发生硬跳；如发生位移，必须使用平滑 transform。
- 不出现 pending 先消失再出现真实 job 的双闪。

### 10.3 job 状态变化

- queued -> processing 不改变卡片外框。
- processing -> succeeded 不改变卡片外框。
- processing -> failed 不改变卡片外框。
- failed 操作按钮出现时不改变卡片外框。

### 10.4 多张 batch

- `1/4`、`2/4`、`3/4`、`4/4` 顺序稳定。
- 多张 pending 不把 composer 推动。
- 多张 pending 不造成整页 scroll anchoring 跳动。

## 11. 风险与注意事项

- optimistic slot 必须和真实 job 正确匹配，否则会出现重复 pending。
- 如果 API 返回顺序和 batchIndex 不一致，前端要以 batchIndex 和 timelineAt 共同排序。
- 不要为了消除闪缩把 pending 放到墙尾，这违反用户明确要求。
- 不要隐藏真实失败状态；失败也要原地展示。
- 不要用 `transition: all` 或高度动画解决问题。
- 不要在生成点击时改 `html/body` 级布局 class。

## 12. 建议优先级

P0：

- Generate 点击不触发整页 class 布局变化。
- optimistic pending slot 立即第一格占位。
- queued job 原地 hydrate。

P1：

- completed result 原地替换 pending。
- failed/cancelled 原地稳定展示。
- wall FLIP 动画只作为兜底。

P2：

- 生成队列视觉分组。
- 长等待阶段文案。
- 性能埋点和 CLS 自动监控。

## 13. 埋点建议

- `image_generate_clicked`
- `image_optimistic_slot_created`
- `image_optimistic_slot_hydrated`
- `image_pending_slot_replaced_by_result`
- `image_generate_layout_shift_detected`

关键字段：

- `projectId`
- `model`
- `aspectRatio`
- `resolution`
- `batchCount`
- `slotId`
- `jobId`
- `layoutShiftPx`
- `timeToHydrateMs`

## 14. 最终判断

Pokaya 当前闪缩的本质不是动画不够顺，而是生成流程仍在“状态改变后插入布局节点”。Higgsfield 的稳定来自“点击前后外框不变、任务先占位、后续只原地升级”。

因此，本 PRD 建议优先实现 **Optimistic Stable Slot**，而不是继续微调 reflow 动画。这样可以同时解决：

- 点击 Generate Media 的整屏闪缩。
- 新 pending card 出现导致的 media wall 闪缩。
- server queued job 返回时二次替换造成的闪缩。
- completed result 替换 pending 时的尺寸跳动。
