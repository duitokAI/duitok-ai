# 影片 Prompt 识别面板优化 PRD

## 1. 背景

当前 Clone Prompt / 视频拆解相关面板底部仍保留了类似生成工具的输入框、多个 chip 和复杂设置项：

- 左侧有一个通用 `+` 上传入口。
- 中间有文字输入框，占用大量空间。
- 下方有 `Reference video / Prompt / Frame analysis` 等多个选项。

但这个功能的真实使用方式更简单：用户只需要把一支参考影片丢进来，系统使用固定 prompt 交给 Gemini 识别，输出这支影片可复用的生成 prompt。用户不需要选择多个模式，也不需要先写描述。

因此本次优化目标是把该面板从“复杂生成器”改成“影片 Prompt 提取器”。

## 2. 产品目标

把当前底部面板简化为一个清晰流程：

1. 用户上传或拖入一支影片。
2. 点击主按钮。
3. 后端固定调用 Gemini，分析影片内容。
4. 页面展示上传影片和 Gemini 识别出的 prompt。
5. 展示方式参考 Image 页面：上方/主体展示结果墙，下方面板保持轻量输入入口。

## 3. 功能命名

建议按钮名称：

**Extract Prompt**

中文语义：提取影片提示词。

理由：

- 比 `Generate Prompt` 更准确，因为用户不是从零生成，而是从影片中提取。
- 比 `Analyze Video` 更贴近最终交付物。
- 英文短，适合按钮，移动端不容易挤爆。

页面/功能名称建议：

**Video Prompt Extractor**

中文可显示为：

**影片 Prompt 提取**

## 4. 用户故事

作为 Pokaya AI 用户，我希望把一支竞品、爆款或参考影片丢进系统，让系统自动识别出这支影片的拍摄结构、画面元素、镜头节奏、人物动作、产品展示方式和可复用 prompt，这样我可以把 prompt 复制到 UGC / Image / Video 生成流程里快速复刻类似风格。

## 5. 面板改造范围

### 5.1 删除内容

底部面板中以下内容全部删除：

- 大文本输入框。
- `Reference video` chip。
- `Prompt` chip。
- `Frame analysis` chip。
- 多余的 mode / tab / advanced 入口。
- 任何需要用户手动填写风格描述的区域。

### 5.2 保留内容

只保留一个上传影片的位置：

- 支持点击上传。
- 支持 drag & drop。
- 支持显示已选影片缩略图 / 文件名。
- 支持替换影片。
- 支持移除影片。

### 5.3 新增主按钮

按钮文案：

**Extract Prompt**

按钮状态：

- 未上传影片：disabled。
- 上传中：`Uploading...`
- 分析中：`Extracting...`
- 成功后：可再次点击重新分析。
- 失败后：显示错误状态，并允许重试。

## 6. 信息架构

### 6.1 默认空状态

页面主体区域显示轻量提示：

- “Drop a reference video to extract its reusable prompt.”
- 一个影片上传 dropzone。

底部固定面板只显示：

- 影片上传入口。
- `Extract Prompt` 按钮。

### 6.2 上传后状态

页面主体区域展示：

- 左侧 / 上方：上传影片预览。
- 右侧 / 下方：待生成 prompt 的占位区。

底部面板展示：

- 已上传影片缩略图。
- 文件名或时长。
- `Change` / 删除入口。
- `Extract Prompt` 按钮。

### 6.3 分析完成状态

参考 Image 页面结果展示方式：

- 结果墙中出现一张结果卡。
- 卡片包含影片预览。
- 卡片点击后打开 detail/lightbox。
- detail 中展示：
  - 上传影片。
  - Gemini 输出的完整 prompt。
  - 可复制按钮。
  - 可发送到 UGC / Image / Video 的后续入口，后续入口可放二期。

## 7. 交互设计

### 7.1 上传入口

组件形态：

- 一个横向 pill 或 compact card。
- 左侧显示 upload / video icon。
- 中间显示状态文字：
  - 未上传：`Drop video here`
  - 已上传：文件名 / 视频时长
- 右侧显示 `Change` 或小型删除 icon。

限制：

- 只允许视频文件。
- 建议支持 `.mp4`, `.mov`, `.webm`。
- 文件过大时提示用户压缩或选择较短影片。

### 7.2 主按钮

按钮放在面板右侧。

文案：

- 默认：`Extract Prompt`
- Loading：`Extracting...`

视觉：

- 使用品牌红粉渐变按钮。
- 不要过高，和 Image 页面底部按钮密度一致。
- 不要像旧版一样占满整行。

### 7.3 结果卡

结果卡结构参考 Image 页面：

- 视频缩略图/预览占主要面积。
- 右上角保留操作按钮：
  - 复制 prompt。
  - 下载 / 导出。
  - 删除。
- prompt 不直接堆在卡片下方，避免结果墙变乱。
- 点击卡片进入 detail/lightbox 查看完整 prompt。

## 8. 后端逻辑

### 8.1 输入

后端接收：

- `projectId`
- `videoFile` 或已上传后的 `videoUrl`
- 固定系统 prompt 版本号，例如：`video_prompt_extractor_v1`

不需要接收用户额外 prompt。

### 8.2 固定 Gemini Prompt

后端固定使用一套 prompt 调用 Gemini。建议结构：

```text
You are a short-form video prompt extraction agent.
Analyze the uploaded reference video and convert it into a reusable generation prompt.

Return:
1. One concise master prompt for regenerating a similar video.
2. Scene breakdown with timing.
3. Camera movement and framing.
4. Subject / product actions.
5. Lighting, environment, style, pacing.
6. Dialogue or on-screen text if visible.
7. Negative prompt / constraints to avoid copying exact identity, logo, watermark, or copyrighted elements.

Keep the output practical for AI video generation.
Do not claim unknown brand names unless visible.
Do not include private personal identity guesses.
```

### 8.3 输出结构

建议后端保存结构：

```json
{
  "type": "clone",
  "title": "Video Prompt Extracted",
  "videoUrl": "...",
  "prompt": "...",
  "sceneBreakdown": [],
  "model": "Gemini",
  "promptVersion": "video_prompt_extractor_v1",
  "createdAt": "..."
}
```

## 9. 前端展示规格

### 9.1 底部面板布局

Desktop：

- 左侧：影片上传 pill/card。
- 右侧：`Extract Prompt` 按钮。
- 高度控制在 72px - 96px。

Mobile：

- 第一行：影片上传入口。
- 第二行：按钮全宽。
- 不出现多余 chip。

### 9.2 结果区布局

参考 Image 页面：

- 结果墙贴近顶部，不留多余空白。
- 视频结果卡按瀑布流/网格展示。
- 卡片点击打开详情。
- prompt 展示在详情面板中，而不是直接挤在结果墙。

## 10. 验收标准

1. 进入该功能页时，不再出现旧的文本输入框和 `Reference video / Prompt / Frame analysis` chip。
2. 底部面板只保留一个影片上传入口和一个 `Extract Prompt` 按钮。
3. 未上传影片时按钮不可点击。
4. 上传影片后按钮可点击。
5. 点击按钮后后端使用固定 prompt 调用 Gemini。
6. Gemini 输出结果保存到当前 project results。
7. 页面展示上传影片和提取出来的 prompt。
8. 结果展示方式与 Image 页面保持一致：结果卡 + detail/lightbox。
9. 移动端不溢出、不出现横向滚动。
10. 用户可以复制最终 prompt。

## 11. 非目标

本次不做：

- 多 prompt 模板选择。
- 多模型选择。
- 用户自定义分析维度。
- 自动生成新视频。
- 自动发布 TikTok。
- 长视频完整转写工作流。

## 12. 推荐执行顺序

1. 新建专用 `videoPromptExtractorPanel` 渲染函数。
2. 移除 Clone 页对通用 `studioGenerateDock` 的依赖。
3. 建立单一 video upload state。
4. 接入现有 upload handler 或新增 `clone-reference-video` 上传逻辑。
5. 新增 `extract-video-prompt` action。
6. 后端固定 Gemini prompt 调用。
7. 将结果写入 `project.results`。
8. 复用 Image 页面 result wall / detail lightbox 展示结果。
9. 做 desktop / mobile QA。

