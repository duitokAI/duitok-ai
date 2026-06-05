# Audio Page 参考 Higgsfield Audio 改版 PRD

Last updated: 2026-06-05

## 1. 背景

当前 Studio 顶部工具里仍有 `Product Scanner` 入口。这个能力偏产品研究和脚本批量生成，但 Pokaya 现在已经有 Image、Video、Prompt、Story、Clone、Content Library 等内容生产链路，缺少一个直接服务短视频发布的声音生成入口。

用户希望新增一个 Audio 页面，并把原本的 `Product Scanner` 页面位替换成 `Audio`。参考图来自 Higgsfield 的 Audio 页面：深色舞台、中心大标题、底部一体式 prompt composer、左侧模式拨盘、右侧 voice preset 和 Generate CTA。Pokaya 需要借鉴这个页面的“声音工作台”结构和氛围，但不能直接照搬品牌、文案或交互动效。

本 PRD 只定义产品需求、页面结构、视觉方向、交互状态和验收标准，不包含实际代码执行。

## 2. 目标

### 2.1 用户目标

用户进入 Audio 页面后，可以快速完成：

1. 为短视频场景生成 voiceover。
2. 输入一段描述，让系统生成适合场景的声音、语气和台词。
3. 选择 voice preset，例如女声、男声、Malay、English、Chinese、energetic、soft sell。
4. 对已有音频做变声或翻译的入口预留。
5. 生成后能试听、下载、复制文案，并保存到 Content Library。

### 2.2 产品目标

- 把 `Product Scanner` 的顶部工具入口替换为 `Audio`，让 Pokaya 的内容生产链路更完整：Image -> Video -> Audio -> Script/Story -> Library。
- 让 Audio 成为“短视频声音生成工作台”，不是一个普通表单页。
- 参考 Higgsfield Audio 的空间感和底部 composer，但保持 Pokaya 的品牌识别与可用性。
- 为后续 voice cloning、voice translation、multi-language caption、Auto Post 配音绑定做好结构预留。

## 3. 非目标

- 不重做整个 Studio 导航。
- 不删除 Product Scanner 历史数据或后端接口；本次只替换前端入口和页面位。
- 不承诺一次上线真实 voice cloning，如果后端能力未接好，可以先做 disabled 预留态。
- 不引入新的前端框架、UI kit、路由系统或动画库。
- 不把整个 Pokaya Studio 改成 Higgsfield 的黑色品牌。

## 4. 命名与入口

### 4.1 顶部工具 Tab

原入口：

- `Product Scanner`
- step id 当前可能为 `auto`
- icon 当前偏 `layout-template` / `sparkles`

目标入口：

- 英文：`Audio`
- 中文：`声音`
- Malay：`Audio`
- 推荐 icon：`audio-lines`、`mic` 或 `volume-2`

如果为了减少改动风险，第一版可以继续复用内部 step id `auto`，但所有用户可见文案必须改为 `Audio`。更理想的执行方式是把 step id 从 `auto` 迁移为 `audio`，并保留兼容映射：

- 旧 URL / state `auto` -> 自动跳转或映射到 `audio`
- 旧结果类型 `auto` 不被误显示成 Audio 结果
- 旧 Product Scanner SOP 文案不在 Audio 页面出现

### 4.2 页面主文案

参考截图的主标题语气，但改成 Pokaya 语境：

- Eyebrow：`AUDIO`
- 主标题：`Ready to give your video a voice?`
- 中文可显示：`给你的短视频配一个声音`
- Prompt placeholder：`Describe the voice, scene, and emotion you imagine...`
- CTA：`Generate Audio`

页面内可以保留英文 UI label，因为 Studio 工具标签本来就混合英文；但中文环境下的解释、tooltip、空状态和错误提示应使用中文。

## 5. 设计方向

### 5.1 参考 Higgsfield 的部分

参考的是页面构图和声音工具心智：

- 暗色舞台式背景。
- 中央大标题，像声音生成的入口。
- 背景底部有音频波形 / equalizer 氛围。
- 底部固定大型 composer。
- 左侧模式拨盘或模式选择区。
- 右侧 voice preset 卡片和试听按钮。
- Generate CTA 与输入区在同一条工作台里。

### 5.2 Pokaya 化处理

Audio 页面可以使用更深的 product surface，但必须仍然像 Pokaya：

- 背景：`#0f1014` / `#17121d` 作为 Audio 专属暗色舞台。
- 品牌光：克制使用 plum、pink、coral、soft yellow，不铺满大面积渐变。
- CTA：沿用 Pokaya pink-to-coral 或 plum 按钮，不直接使用 Higgsfield 的黄绿色主按钮。
- 文字：主标题可以使用粉、coral、warm yellow 的渐变字，但不能低对比或发虚。
- Composer：深色玻璃感可以存在，但边界、输入区和按钮必须清楚。
- 不使用装饰性 bokeh/orb；如果需要背景层，用 equalizer bars、波形线、微弱网格或真实音频 visualizer。

整体感觉应该是：Higgsfield Audio 的沉浸式声音舞台 + Pokaya Studio 的稳定工具控制。

## 6. 页面信息架构

Audio 页面分为四块：

1. Audio Stage Hero
2. Audio Composer Bar
3. Audio Result Strip / Recent Generations
4. Voice Settings / Advanced Options

### 6.1 Audio Stage Hero

位置：页面主体上半区。

内容：

- 顶部小标签：`AUDIO`
- 主标题：`Ready to give your video a voice?`
- 副文案：一句以内，说明可以生成 voiceover、change voice、translate。
- 背景 equalizer 动效或静态条形图。

要求：

- 首屏要直接看到 Audio composer，不要做 landing page 长 hero。
- Hero 高度应随视口收缩，桌面端不超过主内容高度的 `55-60%`。
- 移动端主标题缩小，不遮挡 composer。
- 背景动效必须轻量，不能造成 Studio 滚动卡顿。

### 6.2 Audio Composer Bar

位置：固定在页面底部内容区内，类似 Image / Video composer，但 Audio 页面可以更沉浸。

结构从左到右：

1. 模式选择区：
   - `Voiceover`
   - `Change Voice`
   - `Translate`
2. Prompt 输入区：
   - textarea
   - model chip，例如 `Eleven v3` 或 Pokaya 品牌化模型名
3. Voice Preset 卡：
   - voice name
   - language / tone
   - preview play button
   - 简化 waveform
4. Generate CTA：
   - `Generate Audio`
   - 显示 credit，例如 `0.20 Credit`

### 6.3 模式选择

第一版至少实现 `Voiceover` 可用，另外两个可以按能力决定是否启用。

#### Voiceover

用途：从 prompt 或 script 生成口播音频。

输入：

- 场景描述
- 情绪 / 语气
- 可选脚本文案
- 语言

输出：

- audio file
- transcript / generated script
- duration
- voice preset

#### Change Voice

用途：上传已有音频，把声音换成指定 preset。

第一版如果后端未准备好：

- 展示为 disabled 或 coming soon。
- 不允许用户点完后进入无结果状态。
- tooltip 说明：`Coming soon: upload audio and convert voice style.`

#### Translate

用途：把已有脚本或音频翻译成另一种语言并生成配音。

推荐语言：

- Malay
- English
- Chinese
- Indonesian

第一版如果只支持文字翻译配音，应明确 label 为 `Translate script`，不要暗示能完整做音频 dubbing。

## 7. Voice Preset 需求

### 7.1 Preset 卡片

默认展示一个 compact preset card：

- 名称：例如 `Tallulah`、`Malay Soft Sell`、`Warm Female MY`
- 标签：`Voice Preset`
- play preview button
- waveform mini preview

点击卡片后打开 preset picker。

### 7.2 Preset Picker

Picker 内容：

- Search voice
- 分类 chip：
  - All
  - Female
  - Male
  - Malay
  - English
  - Chinese
  - Soft Sell
  - Energetic
  - Calm
- Voice list：
  - voice name
  - language
  - tone
  - preview button
  - selected state

要求：

- Picker 不被 composer 底部裁切。
- 试听按钮不触发选择，选择和试听是两个动作。
- 切换 voice 不改变 composer 高度。
- 长 voice name 必须 truncate。

## 8. Audio 结果展示

生成结果不应只弹 toast。Audio 页面需要有结果区。

### 8.1 Pending 状态

点击 Generate 后：

- 立即在 Recent Generations 生成 pending item。
- 显示 loading waveform。
- 显示 prompt 摘要、voice preset、预计耗时。
- CTA 进入 loading，并禁止重复提交。

### 8.2 Completed 状态

完成后每条结果展示：

- play / pause
- waveform 或进度条
- duration
- transcript
- voice preset
- language
- created time
- cost
- 操作按钮：
  - Download
  - Copy script
  - Use in Video
  - Add to Auto Post
  - Save to Library
  - Delete

### 8.3 Failed 状态

失败时：

- 保留失败 item。
- 显示清楚原因，例如 credit 不足、provider timeout、unsupported language。
- 提供 `Retry`。
- 不扣 credit，除非后端已有明确成功计费规则。

## 9. 输入与参数

### 9.1 Prompt 输入

placeholder：

`Describe the voice, scene, and emotion you imagine...`

示例 prompt：

- `A friendly Malay female voiceover for a TikTok Shop skincare product, soft sell, warm and confident.`
- `Energetic English hook for a 15-second product demo, fast pacing, young creator style.`

要求：

- 空 prompt 时 Generate disabled。
- 长 prompt 最多展开到 5-6 行，超过后 textarea 内滚动。
- 输入区不得与 voice preset 或 CTA 重叠。

### 9.2 高级参数

可放在 composer 内的 compact controls 或点击展开：

- Language
- Duration target
- Voice speed
- Emotion
- Script mode：`Write for me` / `Use my exact script`
- Output format：`mp3` / `wav`

第一版优先级：

1. Language
2. Voice preset
3. Script mode
4. Speed / emotion
5. Output format

## 10. Credit 与权限

Generate 前必须显示本次预估消耗：

- 示例：`0.20 Credit`
- 如果不同 duration / model 成本不同，切换参数后实时更新。

规则：

- credit 不足时 CTA disabled，并提示 top up。
- loading / pending 不允许重复扣费。
- failed 不应扣费，或需要按后端现有规则清晰记录。
- Admin / owner 测试账号仍应能看到成本和内部状态，但普通用户不显示 provider 名称。

## 11. Content Library 集成

Audio 生成结果应进入 Content Library，但不要破坏现有 image / video / text 分类。

建议新增 asset kind：

- `audio`

Content Library 后续需要支持：

- Audio filter
- audio thumbnail / waveform card
- play preview
- Download
- Copy transcript
- Use in Video

如果第一版 Content Library 暂时不做 Audio UI，至少要确保 Audio 结果能在 Recent Generations 内可见和可下载，不丢失。

## 12. 响应式要求

### 12.1 Desktop

- Hero 居中。
- Composer 横向排布。
- Voice preset 和 Generate CTA 保持在右侧。
- 结果区可在 composer 上方或 hero 下方显示。

### 12.2 Tablet

- Composer 可变为两行：
  - 第一行 prompt
  - 第二行 mode / preset / generate
- Picker 使用浮层或 drawer。

### 12.3 Mobile

- 页面不能只剩巨型 hero。
- Composer 改为底部 sheet：
  - prompt 占满一行
  - mode chips 横向滚动
  - preset + generate 同行或上下堆叠
- CTA 不能被安全区遮挡。
- preset picker 改为 bottom drawer。

## 13. 技术执行建议

### 13.1 前端

建议执行顺序：

1. 新增 Audio step meta，或把原 `auto` 前端入口文案迁移为 `Audio`。
2. 新增 `audioPanel()`，不要继续复用 Product Scanner 的表单结构。
3. 新增 Audio composer DOM 与 scoped CSS。
4. 新增 Audio result item UI。
5. 接入生成 action：`generate-audio`。
6. 如果后端未完成，先使用明确 disabled / coming soon 状态，不做假生成成功。

### 13.2 后端

需要后端明确：

- audio generation endpoint
- request schema
- response schema
- credit cost
- file storage
- audio MIME type
- provider error handling
- generated audio 是否写入现有 jobs/results 数据结构

建议 schema：

```json
{
  "type": "audio",
  "mode": "voiceover",
  "prompt": "",
  "script": "",
  "language": "ms-MY",
  "voicePresetId": "",
  "durationTargetSec": 15,
  "format": "mp3"
}
```

结果字段建议：

```json
{
  "id": "",
  "type": "audio",
  "status": "completed",
  "audioUrl": "",
  "transcript": "",
  "durationSec": 0,
  "voicePresetName": "",
  "language": "",
  "costCredits": 0,
  "createdAt": ""
}
```

## 14. 文案清单

### 14.1 英文

- `Audio`
- `Ready to give your video a voice?`
- `Describe the voice, scene, and emotion you imagine...`
- `Voiceover`
- `Change Voice`
- `Translate`
- `Voice Preset`
- `Generate Audio`
- `Preview voice`
- `Use in Video`
- `Save to Library`

### 14.2 中文

- `声音`
- `给你的短视频配一个声音`
- `描述你想要的声音、场景和情绪...`
- `口播配音`
- `变声`
- `翻译配音`
- `声音预设`
- `生成音频`
- `试听声音`
- `用于视频`
- `保存到素材库`

### 14.3 Malay

- `Audio`
- `Beri suara kepada video anda`
- `Terangkan suara, situasi dan emosi yang anda bayangkan...`
- `Voiceover`
- `Tukar Suara`
- `Translate`
- `Voice Preset`
- `Generate Audio`

## 15. 验收标准

### 15.1 功能验收

- Studio 顶部工具不再显示 `Product Scanner`，显示 `Audio`。
- 点击 `Audio` 进入 Audio 页面，不出现 Product Scanner 表单。
- `Voiceover` 是默认选中模式。
- prompt 为空时不能 Generate。
- 选择 voice preset 后，卡片显示正确名称。
- Generate 后有 pending / completed / failed 结果状态。
- completed audio 可以播放、暂停、下载。
- 结果不会因为刷新页面立刻消失，除非当前系统本身还未持久化生成结果。

### 15.2 视觉验收

- 桌面端首屏能看到主标题和完整 composer。
- composer 不与 sidebar、顶部 tabs、结果区重叠。
- voice preset picker 不被底部裁切。
- 长 prompt 不撑破 composer。
- 移动端 CTA 不被浏览器安全区或底部区域挡住。
- 页面可以有暗色 Audio 舞台，但不影响其他 Studio 页面色彩。

### 15.3 稳定性验收

- `npm run build` 通过。
- 桌面和移动 viewport 做浏览器截图检查。
- 检查 sidebar 展开 / 收起后 composer 宽度正常。
- 检查 hover、picker 打开、loading、failed 状态没有布局跳动。
- 检查普通用户看不到上游 provider 名称或内部 endpoint。

## 16. 风险与注意事项

- 如果只改入口文案但仍显示 Product Scanner 表单，会造成用户认知断裂；必须同时改页面内容。
- 如果 Audio 页面直接使用全黑大 hero，可能破坏 Pokaya Studio 的工作台气质；暗色只应用于 Audio 专属舞台。
- 如果 Change Voice / Translate 暂未可用，必须明确 disabled，不要让用户提交后失败。
- Audio 结果需要考虑存储成本和播放体验，不能把大文件直接塞进本地 state。
- 如果使用第三方 TTS/provider，前端文案不要暴露 provider 名称，除非这是有意的产品销售点。

## 17. 推荐第一版范围

第一版应该聚焦可上线的声音生成入口：

1. 替换 `Product Scanner` 可见入口为 `Audio`。
2. 新增 Audio 页面视觉和 composer。
3. 实现 `Voiceover` 模式。
4. 提供 6-10 个 voice preset。
5. 支持生成、试听、下载、保存结果。
6. `Change Voice` 和 `Translate` 作为清楚的 coming soon 预留。

这版完成后，Pokaya 的 Studio 会从“图片/视频/脚本工具集合”更进一步变成完整的短视频生产工作台：画面、视频、声音、脚本和素材库都在同一个地方。
