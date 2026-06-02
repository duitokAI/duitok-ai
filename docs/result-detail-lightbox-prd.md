# Result Detail Lightbox 优化 PRD

## 1. 背景

当前用户在 Image / Result Wall 点击生成图片后，会进入一个偏大的图片预览弹窗。现有弹窗主要展示图片本身，缺少右侧详情信息，用户无法在同一个页面完成查看 prompt、复制 prompt、重命名图片、确认生成模型、查看 resolution、保存为 Avatar / Product 等关键动作。

用户期望点击图片后的体验更接近参考图：左侧是图片沉浸预览，右侧是清晰的信息面板；背景不只是纯色遮罩，而是出现当前图片的模糊缩影，让预览更有质感。

## 2. 目标

1. 点击图片后，弹窗升级为「图片预览 + 右侧详情面板」布局。
2. 右侧必须显示 Prompt，并提供一键复制按钮。
3. 支持直接重命名当前图片。
4. 显示生成所用模型，例如 `Nano Banana Pro` / `GPT Image 2`。
5. 显示图片 Resolution，例如 `1024 x 1536`、`4k`、`9:16`。
6. 支持将当前图片保存为 `Avatar` 或 `Product` reference。
7. 弹窗背景使用当前图片缩影作为模糊背景，而不是单纯灰紫遮罩。
8. 保持移动端可用，不出现内容遮挡、按钮跑位、文字看不清。

## 3. 非目标

1. 本期不重做 Result Wall 整体布局。
2. 本期不改变生成逻辑、扣费逻辑、模型价格逻辑。
3. 本期不新增图片编辑、局部重绘、重新生成等复杂功能。
4. 本期不做评论系统，参考图里的 Comments tab 暂不实现。
5. 本期不改变已保存 Attachment 的后端数据结构，除非现有字段无法承载命名或 metadata。

## 4. 用户故事

作为用户，我点击一张生成图片后，希望能马上知道：

1. 这张图是用什么 prompt 做出来的。
2. 我能一键复制 prompt，继续改 prompt 或复用。
3. 我能给这张图改一个看得懂的名字。
4. 我能知道它用的是什么模型、尺寸是多少。
5. 我能直接把它保存为 Avatar 或 Product，后续生成继续用。
6. 我能看清楚图片，同时右侧信息不会挡住图片。

## 5. 入口与触发

### 5.1 入口

当前所有点击生成结果图片的入口，都应打开新的 Result Detail Lightbox：

- Result Wall 图片卡片点击。
- Image Canvas 结果点击。
- History / result card 里的 preview 点击。

### 5.2 保留现有入口

如果已有 `查看 prompt`、`保存为 Avatar/Product`、`删除` 等按钮，可以保留，但点击图片本身时应进入统一详情弹窗。

## 6. 页面结构

### 6.1 Desktop 布局

Desktop 使用左右结构：

左侧：图片预览区  
右侧：详情面板

建议比例：

- 左侧图片区：约 `68%`
- 右侧详情区：约 `32%`
- 右侧最小宽度：`360px`
- 右侧最大宽度：`460px`

结构示意：

```text
[ blurred image background overlay ]

┌──────────────────────────────────────────────────────────────┐
│                       close button                           │
│                                                              │
│   ┌──────────────────────────────┐   ┌───────────────────┐   │
│   │                              │   │ image name input  │   │
│   │                              │   │ metadata          │   │
│   │          preview image        │   │ prompt + copy     │   │
│   │                              │   │ model             │   │
│   │                              │   │ resolution        │   │
│   └──────────────────────────────┘   │ save avatar/product│   │
│                                      └───────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Mobile 布局

Mobile 使用上下结构：

1. 顶部图片预览。
2. 下方详情面板。
3. 详情面板可滚动。
4. Close button 固定在右上角。

避免右侧 panel 在窄屏中挤压图片，导致图片和文字都看不清。

## 7. 视觉要求

### 7.1 背景缩影

弹窗背景使用当前图片作为背景源：

- 使用同一张图片 URL。
- `background-size: cover`
- `filter: blur(28px)`
- 加深色遮罩，避免背景干扰正文。
- 背景 opacity 控制在 `0.35 - 0.55`。

效果目标：

- 用户能感知背景是当前照片的延展。
- 不能让背景影响右侧文字可读性。
- 背景不能出现原图清晰细节抢视觉。

### 7.2 图片预览

图片本体：

- 保持完整比例，不裁切主体。
- `object-fit: contain`
- 圆角建议 `18px - 24px`
- 最大高度不超过视窗高度 `82vh`
- 图片下方不留大块无意义空白。

### 7.3 右侧详情面板

右侧 panel 风格：

- 深色半透明面板，和当前 Studio 暗色弹窗一致。
- 背景建议 `rgba(12, 12, 14, 0.88)`。
- 边框 `rgba(255,255,255,0.08)`。
- 字体颜色必须清楚：标题白色，次级信息灰色。
- 避免紫色文字压在深色背景上导致看不清。

## 8. 右侧面板内容

### 8.1 图片名称

顶部显示可编辑图片名称：

- 默认值优先使用 result title / item title。
- 如果没有名称，显示：
  - `Untitled image`
  - 或 `Image · YYYY-MM-DD HH:mm`

交互：

- 点击名称可编辑。
- `Enter` 保存。
- `Blur` 保存。
- 保存成功后 toast：`Image name updated.`

字段建议：

- 如果 result 已有 `title` 字段，复用。
- 如果没有，可新增 result-level `title` 或 `name` 字段。

### 8.2 Prompt 模块

Prompt 模块必须在右侧显著展示。

内容：

- 标题：`PROMPT`
- 右上按钮：`Copy`
- prompt 文本区域最多先显示约 `8 - 10` 行。
- 超出时显示 `See all` / `Show less`。

交互：

- 点击 `Copy` 复制完整 prompt，不是截断文本。
- 复制成功 toast：`Prompt copied.`
- 如果没有 prompt，显示：`No prompt saved for this image.`

### 8.3 Information 模块

显示生成信息：

- `Model`
- `Resolution`
- `Aspect ratio`
- `Created`

字段来源建议：

- Model：优先 `result.model`，其次 `project.image.model` 快照。
- Resolution：优先读取结果 metadata；没有则尝试从图片 naturalWidth / naturalHeight 获取。
- Aspect ratio：优先 `result.aspectRatio`，否则由 width / height 推算。
- Created：使用 result createdAt。

示例：

```text
INFORMATION
Model          Nano Banana Pro
Resolution     1024 x 1536
Aspect Ratio   9:16
Created        31 May 2026, 11:35 PM
```

### 8.4 保存为 Reference

右侧底部提供两个主操作：

- `Save as Avatar`
- `Save as Product`

要求：

- 按钮命名清楚，不只写 `Avatar` / `Product`。
- 保存后按钮状态变成 `Saved as Avatar` 或 `Saved as Product`。
- 如果同一张图已经保存过，对应按钮显示已保存状态，避免重复困惑。
- Product 按钮使用 product 黄色/金色倾向。
- Avatar 按钮使用品牌粉色/紫粉倾向。

### 8.5 次级操作

可以保留以下次级操作，但不能抢主视觉：

- Download
- Delete
- Open original

Delete 应放在更低优先级位置，避免误触。

## 9. 交互细节

### 9.1 关闭

- 右上角固定 close。
- 点击背景关闭。
- `Esc` 关闭。

### 9.2 Prompt 展开

默认折叠：

- prompt 超过指定高度时出现底部渐隐。
- 点击 `See all` 展开完整 prompt。
- 展开后按钮变为 `Show less`。

### 9.3 Copy 行为

复制内容必须是原始完整 prompt。

如果 clipboard API 失败：

- fallback 到临时 textarea copy。
- 失败时 toast：`Copy failed. Please select manually.`

### 9.4 命名行为

命名输入限制：

- 最多 80 个字符。
- 空名称保存时回退到默认名称。
- 不允许出现换行。

## 10. 数据要求

### 10.1 Result 对象建议字段

```json
{
  "id": "result-id",
  "title": "Product hero image",
  "prompt": "full prompt text",
  "model": "Nano Banana Pro",
  "resolution": {
    "width": 1024,
    "height": 1536
  },
  "aspectRatio": "9:16",
  "createdAt": "2026-05-31T15:35:00.000Z"
}
```

### 10.2 向后兼容

旧数据可能缺少：

- `title`
- `model`
- `resolution`

必须有 fallback：

- title fallback：`Untitled image`
- model fallback：`Unknown model`
- resolution fallback：`Detecting...`，检测失败后显示 `Unknown`

## 11. API / 前端改动建议

### 11.1 前端函数

建议新增或重构：

- `resultDetailLightbox()`
- `resultDetailPromptPanel(item)`
- `resultDetailInfoPanel(item)`
- `resultDetailActions(item)`
- `detectResultResolution(item)`
- `renameResultInline(itemId, title)`

### 11.2 后端或状态更新

如果当前 result rename 没有 API，需要新增：

- `PATCH /api/results/:id`

请求：

```json
{
  "title": "New image name"
}
```

返回：

```json
{
  "db": "updated public state"
}
```

如果已有 project field patch 不适合 result-level rename，不要硬塞到 project field。

## 12. 文案

建议英文 UI 文案：

- `PROMPT`
- `Copy`
- `See all`
- `Show less`
- `INFORMATION`
- `Model`
- `Resolution`
- `Aspect Ratio`
- `Created`
- `Save as Avatar`
- `Save as Product`
- `Saved as Avatar`
- `Saved as Product`
- `Image name`

中文 toast 可继续保留：

- `Prompt copied.`
- `Image name updated.`
- `Saved as Avatar reference.`
- `Saved as Product reference.`

## 13. 验收标准

1. 点击任意图片结果后，打开新的详情 lightbox。
2. 背景显示当前图片的模糊缩影，并有遮罩保证可读性。
3. 左侧图片完整显示，不被右侧面板遮挡。
4. 右侧显示 Prompt，并可一键复制完整 prompt。
5. Prompt 很长时不会撑爆面板，可展开/收起。
6. 图片名称可以编辑并保存。
7. 右侧显示 Model。
8. 右侧显示 Resolution。
9. 可以保存为 Avatar。
10. 可以保存为 Product。
11. 保存后有明确 toast 或按钮状态反馈。
12. Desktop 1440px、1920px 下布局稳定。
13. Mobile 390px 宽度下内容不重叠、不横向溢出。
14. `npm run build` 通过。

## 14. 优先级

P0：

- 新详情弹窗布局。
- Prompt + Copy。
- Model / Resolution。
- Save as Avatar / Product。
- 背景缩影。

P1：

- 图片重命名。
- Prompt 展开/收起。
- 已保存状态识别。

P2：

- Download / Delete / Open original。
- 更完整的 created time / aspect ratio metadata。

## 15. 执行顺序建议

1. 先重构当前 `resultLightbox` / `previewResult` modal 的布局。
2. 接入 Prompt panel 和 Copy。
3. 接入 Information panel。
4. 接入 Save as Avatar / Product。
5. 接入背景缩影。
6. 增加 rename。
7. 做 desktop / mobile QA。
8. 跑 `npm run build`。

