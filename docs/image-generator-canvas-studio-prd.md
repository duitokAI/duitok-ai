# Pokaya Image Generator Canvas Studio PRD

## 1. 背景

当前 Image Generator 页面仍然是传统表单布局：上方 model / mode，下方 Avatar Reference、Product Reference、Prompt 等模块按纵向卡片排列。这个结构清楚，但对于高频生成图片的用户来说，效率和创作感不足。

用户参考的目标界面更像图片创作工作台：中间是结果画布 / 历史画廊，底部是固定生成控制台，右侧/底部可以选择参考图、尺寸、模型和生成数量。用户的注意力集中在“我要生成什么图”和“生成后的效果”上，而不是在多个大卡片之间上下滚动。

本 PRD 目标是把 Pokaya Image Generator 从“表单页面”升级为“AI 图片创作工作台”，但保持 Pokaya 品牌色调，不照搬黑色界面。

## 2. 核心问题

### 2.1 表单占据首屏

- 当前首屏主要看到 Model、Mode、Avatar Reference、Product Reference。
- 用户还没看到 prompt 和生成结果，就已经需要滚动。
- 上传区高度偏大，适合首次说明，不适合重复生成。

### 2.2 生成结果不够中心化

- 结果历史目前在页面下方，用户需要滚动才能看。
- 用户生成多张图时，无法像画廊一样快速比较。
- 缺少“当前选中图片 / 当前预览图”的主画布。

### 2.3 控制区分散

- Model、Mode、Reference、Prompt、Size、Generate 分散在不同位置。
- 用户每次修改 prompt 或参考图，需要在页面中上下移动。
- 生成按钮没有固定在用户视线范围内。

### 2.4 Reference 选择不够像创作素材

- Avatar Reference 和 Product Reference 现在像上传表单。
- 目标体验应该像“把参考素材放到底部控制台”，方便一眼看到当前用的是哪几张图。

## 3. 产品目标

### 3.1 用户体验目标

- 用户进入 Image tab 后，第一眼看到的是创作画布和 prompt 输入区。
- 用户能直接写 prompt、选择参考图、点 Generate，不需要上下滚动。
- 生成结果以横向 / 网格画廊形式展示，方便对比多张图。
- Reference 图片以小缩略图形式固定显示，可快速替换。
- 整体体验接近“AI creative canvas”，而不是后台表单。

### 3.2 业务目标

- 提高用户生成第一张图的完成率。
- 提高多次 generate / variation 的使用频率。
- 降低新手对 Image、Avatar、Product reference 的理解成本。
- 让 Pokaya 更像专业 AI 内容工具，而不是简单表单集合。

## 4. 非目标

- 本期不重做图片生成后端。
- 本期不修改扣费逻辑。
- 本期不新增复杂 Photoshop 式编辑能力。
- 本期不照搬参考图的黑色 UI；Pokaya 保持浅色、紫粉品牌调性。
- 本期不移除现有 Avatar / Product reference 功能，只改变呈现方式。

## 5. 目标页面结构

### 5.1 Desktop 主结构

页面改为三层：

1. 顶部轻量栏
2. 中间画布 / 历史结果区
3. 底部固定生成控制台

推荐布局：

```text
┌────────────────────────────────────────────┐
│ Top Bar: Image Generator / History / Model │
├────────────────────────────────────────────┤
│                                            │
│        Canvas / Result Gallery             │
│        当前结果、历史图、空状态引导          │
│                                            │
├────────────────────────────────────────────┤
│ Fixed Generate Console                      │
│ Prompt + Reference thumbs + Settings + CTA  │
└────────────────────────────────────────────┘
```

### 5.2 Mobile 主结构

Mobile 不做复杂多栏，采用：

- 顶部：Image Generator 标题 + History 切换
- 中部：结果画廊
- 底部：sticky generate console
- Reference 缩略图横向滚动

## 6. 功能需求

### 6.1 顶部轻量栏

顶部不再使用大卡片。

必须包含：

- `Image Generator` 标题
- History / Current Project 切换
- Model 快捷选择
- 可选：生成数量 / view size slider

要求：

- 高度控制在 56-72px。
- 不要占据大面积首屏。
- 保留 Pokaya 深紫文字和粉色 accent。

### 6.2 中间画布 / 结果区

结果区是页面主体。

状态一：还没有结果

- 显示轻量空状态：
  - “Write a prompt below to generate your first image.”
  - 可显示 3 个 prompt preset chip
  - 不要使用大插画或大卡片

状态二：有历史结果

- 以横向瀑布 / 网格方式展示。
- 最新结果默认最大或居中。
- 用户可以点击任意结果设为当前预览。
- 当前选中结果显示：
  - 下载
  - 保存为 Avatar reference
  - 保存为 Product reference
  - Generate variation
  - Delete

验收：

- Desktop 1440px 下，首屏至少能看到 3-5 张历史图或一个大预览 + 2-3 张缩略图。
- 结果区不被上传表单挤掉。

### 6.3 底部固定生成控制台

底部控制台是核心交互区，类似参考图右侧下方的大输入台。

必须包含：

- Add reference 按钮
- Prompt textarea
- Model selector
- Size selector
- Quality / resolution selector
- Generate count stepper
- Avatar reference thumbnail
- Product reference thumbnail
- Generate button

推荐结构：

```text
[ + ] [ Prompt textarea                                      ]
      [ Model ] [ 9:16 ] [ Quality ] [ - 4/4 + ] [ Generate ]
      [ Avatar thumb ] [ Product thumb / Change ]
```

要求：

- 控制台 sticky 在 workspace 底部。
- Prompt 输入区支持多行，但默认不超过 4-5 行高度。
- Generate button 永远可见。
- Reference 缩略图显示当前选中的图片。
- 没选 reference 时显示轻量 placeholder：`Avatar optional` / `Product optional`。

### 6.4 Reference 选择方式

把 Avatar Reference / Product Reference 从大 dropzone 改为两种入口：

1. 底部缩略图入口
2. Add reference 按钮

点击后打开 reference picker modal / drawer：

- Upload new
- Pick from attachments
- Recent generated images
- Save selected as Avatar / Product

要求：

- 不再默认显示两个巨大上传卡片。
- 用户已选 reference 时，底部缩略图可直接 `Change`。
- 支持拖拽图片到整个控制台区域。

### 6.5 Prompt Preset

在空状态或 prompt 输入区附近提供轻量 preset：

- TikTok product image
- Creator holding product
- Before / after visual
- Poster / ad image
- Lifestyle desk shot

点击 preset 后填入 prompt，不自动生成。

### 6.6 Generate 状态

点击 Generate 后：

- Generate button 立即进入 loading。
- 结果区出现 pending card。
- 控制台仍然可继续编辑下一条 prompt。
- 如果用户再次点击 Generate，可加入生成队列或提示“当前已有 pending，是否继续生成”。

### 6.7 History / Community

参考图里有 History / Community tab。本期建议先做：

- `History`：当前 project 的生成历史。
- `Attachments`：用户保存过的 reference。

`Community` 暂不做，避免变成社交平台。

## 7. 视觉方向

### 7.1 保留 Pokaya 品牌

使用：

- 深紫文字
- 粉色 primary accent
- 柔和粉紫背景
- 白色 / 半透明控制台
- 少量金色用于价格 / credit 提示

避免：

- 全黑界面
- 荧光绿主按钮
- 过重 shadow
- 大圆角 toy-like 卡片

### 7.2 控制台风格

底部控制台可以比普通卡片更强：

- border radius 18-24px
- glass white background
- subtle pink border
- 轻 shadow
- Generate button 使用 Pokaya 粉橙渐变

### 7.3 结果画廊

结果图本身应成为视觉主角。

- 图片之间 gap 6-10px。
- 不要每张图都套大卡片。
- hover / active 时显示操作按钮。
- 当前选中图用粉色描边。

## 8. 交互流程

### 8.1 新用户首次生成

1. 用户进入 Image tab。
2. 中间区域显示空状态。
3. 用户在底部 prompt 输入内容。
4. 可选：添加 Avatar / Product reference。
5. 点击 Generate。
6. 中间区域出现 pending。
7. 完成后结果进入画廊，最新图自动选中。

### 8.2 使用 reference 生成

1. 用户点击 `Avatar optional` 或 `Product optional`。
2. 打开 picker。
3. 选择上传 / 历史图 / attachments。
4. 底部缩略图更新。
5. prompt 保持不变。
6. 点击 Generate。

### 8.3 从历史结果继续生成

1. 用户点击历史图。
2. 当前图被选中。
3. 用户点击 `Use as reference` 或 `Variation`。
4. 缩略图自动填入 reference。
5. prompt 预填 “Create a variation...”。

## 9. 数据与状态

需要复用现有数据：

- `image.model`
- `image.mode`
- `image.prompt`
- `image.avatarAttachmentId`
- `image.productAttachmentId`
- project results
- attachments
- billing credits

新增前端状态建议：

- `imageCanvasSelectedResultId`
- `imageCanvasViewMode`
- `imageConsoleOpen`
- `imageReferencePickerTarget`
- `imagePendingPrompt`

## 10. 验收标准

### 10.1 Desktop

- 1440px 宽度下，Image tab 首屏必须同时看到：
  - 结果 / 空状态区域
  - prompt 输入区
  - Generate button
  - reference 缩略图入口
- 不需要滚动即可完成一次基础生成。
- Avatar / Product reference 不再以两个巨大上传卡片占据首屏。

### 10.2 Mobile

- Generate console sticky 在底部。
- Prompt 输入、reference 缩略图、Generate button 都可访问。
- 画廊可纵向滚动。
- 不出现文字挤压或按钮超出。

### 10.3 性能

- 切换图片、选择 reference 不触发整页重渲染卡顿。
- 点击 Generate 后 100ms 内有 UI 反馈。
- 历史图超过 30 张时仍可顺畅滚动。

### 10.4 品牌一致性

- 不能变成黑色 PeningLab 风格。
- 必须保持 Pokaya 紫粉白品牌。
- Generate button 使用 Pokaya 主按钮风格。

## 11. 实施优先级

### Phase 1：布局重构

- 顶部轻量栏
- 中间结果画廊 / 空状态
- 底部 sticky generate console
- 保留现有生成逻辑

### Phase 2：Reference Picker

- Avatar / Product reference 缩略图
- Attachments picker
- Recent results as reference
- Change / remove reference

### Phase 3：结果画廊增强

- 当前选中图
- Variation
- Save as reference
- Download / Delete hover actions

### Phase 4：体验细节

- Pending card
- Generate loading
- Prompt presets
- Keyboard shortcuts
- Mobile polish

## 12. 风险

- Sticky console 可能遮挡低端屏幕内容，需要给结果区 padding-bottom。
- 历史图多时可能影响性能，需要 lazy loading 或限制首屏渲染数量。
- Reference picker 如果一次塞太多功能，会变复杂，第一版应保持简单。
- 新手可能不理解 reference 缩略图，需要 placeholder 文案清楚。

## 13. 推荐第一版交付范围

第一版只做最关键的 4 件事：

1. 把 Image 页面改成 `结果区 + 底部控制台`。
2. 把 Avatar / Product Reference 改成底部缩略图入口。
3. Generate button 固定可见。
4. 历史结果改成可浏览画廊。

这样能最快把页面从“表单工具”变成“创作工作台”。
