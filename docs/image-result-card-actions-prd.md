# 图片结果卡片操作区优化 PRD

Last updated: 2026-05-30

## 1. 背景

Pokaya AI 当前已经能生成图片、保存结果、下载结果、加入排期，也已经有 Content Library。但图片生成结果下方的信息和操作还不够像一个真正的素材管理系统：

- 用户看不清这张图叫什么。
- 用户看不清它是用哪个模型生成的。
- 用户想复用 prompt 时，需要自己找。
- 保存成 Avatar / Product 的入口不够清楚。
- Edit Image、下载、删除等动作没有形成统一卡片规范。
- 图片结果和后续 UGC / Cinema / Auto Post workflow 的连接还不够强。

本 PRD 目标是把每一张生成图片下方做成一个标准化 asset action panel，让用户可以马上理解、命名、保存、编辑、下载、删除和复用这张图。

## 2. 目标

### 2.1 用户目标

用户看到一张生成图后，可以立刻完成：

1. 给图片自定义名称。
2. 看出图片由哪个模型生成：`GPT IMAGE 2` 或 `NANO BANANA PRO`。
3. 查看生成这张图片的 prompt。
4. 保存为后续生成可用的 `Avatar` 或 `Product` reference。
5. 用同一张图继续 edit / regenerate。
6. 下载图片。
7. 删除图片。

### 2.2 产品目标

- 把“生成结果”升级为“可管理素材”。
- 让用户更容易进入循环：生成图片 -> 保存 reference -> edit image -> 做 UGC/video -> 排期。
- 提高 Content Library 的资产复用价值。
- 减少用户重新上传同一张图的摩擦。

## 3. 范围

### 3.1 本次包含

- 图片结果卡片下方 UI 重构。
- 自定义图片名称。
- 模型标签展示。
- Prompt 展示。
- 4 个主按钮：
  1. Save to Attachments
  2. Edit Image
  3. Download
  4. Delete
- Save to Attachments 弹窗。
- Edit Image 弹窗。
- 后端保存名称 / 删除 / 保存 reference / edit image 所需 API。
- Content Library 和 Project result grid 共用同一套卡片。

### 3.2 本次不包含

- 复杂 Photoshop 式局部编辑。
- 多图层编辑器。
- 训练 LoRA / 人物模型。
- 直接替换已排期 TikTok 内容。
- 批量删除 / 批量下载。

## 4. 信息架构

每个图片结果卡片分为两层：

### 4.1 图片预览区

显示：

- 生成图片本体。
- 图片状态，例如 `Ready`、`Generating`、`Failed`。
- 图片比例 / 类型，如 `Image`。

要求：

- 图片区域保持稳定比例，不因下方文字变化导致卡片跳动。
- 图片为纵图时完整显示，不裁掉关键内容。
- 图片为横图时居中显示。

### 4.2 图片信息与操作区

图片下方显示：

- 模型标签：`GPT IMAGE 2` / `NANO BANANA PRO`
- 任务 ID：短 id，可复制
- 图片名称：可编辑
- Prompt：显示前 2-3 行，超出省略，可展开或复制
- 4 个主按钮

建议布局：

```text
[Ready]                 NANO BANANA PRO · P4
[# task id]
Name
Create a scroll-stopping HARD SELL Facebook ad poster...

[Save] [Edit Image] [Download] [Delete]
```

## 5. 字段定义

每个 result 应该支持以下字段：

```json
{
  "id": "result_id",
  "title": "Custom image name",
  "type": "image",
  "modelLabel": "NANO BANANA PRO",
  "modelKey": "nano-banana-pro",
  "prompt": "Original generation prompt",
  "editPrompt": "Last edit instruction",
  "imageUrl": "https://...",
  "projectId": "project_id",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "sourceResultId": "optional parent result id",
  "referenceImageUrl": "optional edit reference image",
  "assetTags": ["avatar", "product"]
}
```

兼容策略：

- 如果旧 result 没有 `modelLabel`，前端根据 `title` / `type` / generation action 推断。
- 如果旧 result 没有 `prompt`，使用 `body` 作为 prompt fallback。
- 如果旧 result 没有 `title`，显示 `Generated image`。

## 6. 自定义图片名称

### 6.1 UI

图片下方显示：

```text
Name
[Custom image name]
```

交互：

- 默认静态展示。
- 点击 name 或铅笔 icon 后进入 inline edit。
- Enter 保存。
- Esc 取消。
- Blur 保存。

### 6.2 校验

- 名称不能为空。
- 最长 120 字符。
- 去掉首尾空格。

### 6.3 API

```http
PATCH /api/results/:id
Content-Type: application/json

{
  "title": "New image name"
}
```

成功后返回最新 public state。

## 7. 模型标签

### 7.1 展示规则

图片下方右上角显示：

- `GPT IMAGE 2`
- `NANO BANANA PRO`

如果需要显示 cost / quality，可显示：

```text
NANO BANANA PRO · P4
```

其中 `P4` 可以代表 project step / preset / price tier，后续再明确。

### 7.2 数据来源

优先级：

1. `result.modelLabel`
2. `result.modelKey`
3. `result.providerLabel`
4. 从生成动作推断
5. fallback：`Pokaya Image`

### 7.3 安全边界

允许显示产品化模型名：

- GPT IMAGE 2
- NANO BANANA PRO

不要显示内部 provider：

- APIMart
- GRS AI
- Wuyin
- AtlasCloud
- 内部 API endpoint

## 8. Prompt 展示

### 8.1 UI

显示原始生成 prompt：

```text
Create a scroll-stopping HARD SELL Facebook ad poster...
```

规则：

- 默认显示 2-3 行。
- 超出省略。
- Hover 可显示 tooltip。
- 提供 `Copy prompt` 次级动作，或点击 prompt 区域复制。

### 8.2 展示来源

优先级：

1. `result.prompt`
2. `result.body`
3. `result.inputPrompt`
4. fallback：`No prompt saved`

### 8.3 隐私

Prompt 展示给该结果所属用户和 admin。

## 9. 四个主按钮

### 9.1 Button 1: Save to Attachments

按钮含义：

把当前图片保存成后续可复用 reference。

点击后打开小窗口：

```text
Save to Attachments as...

[Product]
Packaging, label, hero shot — anything Pokaya locks onto as the product

[Avatar]
Face / character reference — used to lock identity in UGC + Cinema
```

选项：

- `Product`
- `Avatar`

点击任一选项后：

- 调用保存 API。
- 关闭弹窗。
- Toast：`Saved as Product reference` / `Saved as Avatar reference`。
- 图片卡片上可显示已保存标签。

API：

```http
POST /api/results/:id/save-reference
Content-Type: application/json

{
  "kind": "product"
}
```

或：

```json
{
  "kind": "avatar"
}
```

### 9.2 Button 2: Edit Image

按钮含义：

使用同一张图作为 reference，输入新的 edit instruction，再生成一张新图片。

弹窗结构：

```text
Edit Image

[image preview]

EDIT INSTRUCTION
[textarea]

REFERENCE IMAGE (OPTIONAL)
[current image selected] [Attachments]

[Apply Edit] [Cancel]
```

支持两种模式：

1. **改提示词重新生成**
   - 用户输入 edit instruction。
   - 当前图片作为 reference image。
   - 生成新 result。

2. **替换图里的产品**
   - 用户选择 product attachment。
   - edit instruction 可写：`Replace the product with selected product, keep layout and text style.`
   - 当前图片作为 layout/style reference。
   - product attachment 作为 product reference。

默认 edit prompt 可预填：

```text
Keep the same composition and style. Improve the ad clarity, keep the main subject natural, preserve readable text, and make the product more prominent.
```

如果是人像/手部图，可附加 negative prompt：

```text
Negative prompt: extra hands, extra fingers, deformed hands, mutated fingers, bad anatomy, blurry, low quality, duplicate limbs, distorted face, unrealistic proportions, cropped hands, missing fingers.
```

API 建议：

```http
POST /api/results/:id/edit-image
Content-Type: application/json

{
  "instruction": "Replace product with the selected product while keeping layout.",
  "referenceAttachmentId": "optional_attachment_id",
  "model": "nano-banana-pro"
}
```

返回：

```json
{
  "project": {},
  "result": {
    "id": "new_result_id",
    "sourceResultId": "old_result_id",
    "imageUrl": "..."
  }
}
```

### 9.3 Button 3: Download

按钮含义：

下载当前图片。

行为：

- 图片下载为 PNG / JPG。
- 文件名优先使用自定义名称。

命名规则：

```text
pokaya-{safe-title}-{short-id}.png
```

如果没有 title：

```text
pokaya-image-{short-id}.png
```

### 9.4 Button 4: Delete

按钮含义：

删除当前 result。

交互：

- 点击后弹确认小窗口。
- 文案：

```text
Delete this image?
This removes it from this project and Content Library. Attachments already saved from this image will remain.
```

按钮：

- Cancel
- Delete

API：

```http
DELETE /api/results/:id
```

删除后：

- 从当前项目 results 移除。
- Content Library 不再显示。
- 不删除已经保存到 attachments 的副本。
- 不删除 R2 原始文件，第一版只做逻辑删除或从 state 移除，避免误删共用资源。

## 10. 视觉设计要求

### 10.1 保持 Pokaya 后台色调

不要引入新的黑金/蓝紫体系。

使用现有色：

- 主紫：`#5d086c`
- 深紫背景：`#17091b` / `#0d090f`
- 粉色：`#ff4e78`
- 珊瑚：`#ff835e`
- 页面背景：`#fff8fb`
- 卡片：`#ffffff`

### 10.2 卡片样式

图片结果卡片应符合 Studio 密度系统：

- 卡片不要过高。
- 图片区固定比例。
- 信息区可扫读。
- 按钮尺寸一致。
- 移动端按钮可横向滚动或 2x2 排列。

### 10.3 按钮建议

四个按钮颜色：

| 动作 | 颜色 |
|---|---|
| Save | 青绿色 / mint，用于保存 reference |
| Edit Image | 紫色 |
| Download | 蓝色或深紫次级 |
| Delete | 红色 |

但最终要贴合 Pokaya palette，不能像外部产品截图那样完全变成黑色 neon 风。

## 11. 当前代码接入点

主要文件：

- `src/main.js`
- `src/styles.css`
- `server.mjs`

当前相关函数：

- `contentLibraryPage()`
- `resultCard(item)`
- `resultAction(el)`
- `download(url, filename)`
- `POST /api/results/:id/save-reference`
- `PATCH /api/results/:id`
- `DELETE /api/results/:id`

需要新增或完善：

- `saveReferenceModal(resultId)`
- `editImageModal(resultId)`
- `deleteResultConfirmModal(resultId)`
- `resultModelLabel(item)`
- `resultPromptText(item)`
- `safeAssetFilename(item)`
- `POST /api/results/:id/edit-image`

## 12. State 设计

前端 state 建议新增：

```js
resultModal: null,
activeResultId: null,
editingResultTitle: "",
editImageInstruction: "",
editImageReferenceAttachmentId: "",
editImageModel: "nano-banana-pro",
editImageBusy: false
```

Modal 类型：

- `saveReference`
- `editImage`
- `deleteResult`

## 13. Edge Cases

### 13.1 旧图片没有 prompt

显示：

```text
No prompt saved for this older result.
```

### 13.2 图片正在生成

按钮状态：

- Save disabled
- Edit disabled
- Download disabled
- Delete enabled

### 13.3 图片生成失败

显示 error 状态。

按钮：

- Edit disabled
- Download disabled
- Delete enabled

### 13.4 视频结果

本 PRD 主要针对图片。

如果是 video：

- Save to Attachments 可以 disabled 或保存为 video reference（P1）。
- Edit Image 不显示。
- Download / Delete 保留。

### 13.5 已保存过 reference

同一张图可以同时保存为 Product 和 Avatar，但重复保存同一种类型时：

- 第一版允许重复，但 Toast 提醒。
- P1 可做去重。

## 14. 验收标准

### 14.1 图片卡片

- 每张图片下方显示名称。
- 每张图片下方显示模型标签。
- 每张图片下方显示 prompt 摘要。
- 每张图片有 4 个主按钮。
- 4 个按钮在 Project result grid 和 Content Library 中一致。

### 14.2 Save to Attachments

- 点击 Save 打开小窗口。
- 可选择 Product / Avatar。
- 保存后 attachments 中出现对应 reference。
- Toast 提示成功。

### 14.3 Edit Image

- 点击 Edit Image 打开编辑弹窗。
- 弹窗显示当前图片 preview。
- 可输入 edit instruction。
- 可选择 attachment 作为替换产品 reference。
- Apply 后生成新图片 result。
- 新 result 记录 `sourceResultId`。

### 14.4 Download

- 点击下载按钮可以下载图片。
- 文件名使用自定义名称。

### 14.5 Delete

- 点击删除出现确认。
- 确认后图片从项目和 Content Library 消失。
- Build 通过。

## 15. 推荐执行顺序

1. 更新 result 数据展示 helper：model label、prompt、filename。
2. 重构 `resultCard(item)` 下方信息区。
3. 实现 inline rename。
4. 实现 Save to Attachments modal。
5. 实现 Delete confirm modal。
6. 实现 Edit Image modal UI。
7. 接后端 `edit-image` API。
8. 做 Content Library / Project 页面 QA。
9. 跑 `npm run build`。

## 16. P1 后续增强

- 批量保存 / 批量删除。
- Prompt 展开全文抽屉。
- Result version history。
- Compare before/after。
- 一键生成 3 个变体。
- 保存为 brand style reference。
- 删除时同时清理 R2 孤儿文件。
- Asset 标签系统：`poster`、`product`、`avatar`、`ad`、`thumbnail`。
