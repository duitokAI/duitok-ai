# Image Composer 工具栏视觉密度优化 PRD

## 1. 背景

最新截图显示，Image 生成页面底部工具栏已经完成基础紧凑化，但仍存在明显的视觉密度、控件对齐和层级问题。

当前工具栏包含：

- 模型选择：`Seedream 5.0 Lite`
- Prompt Enhance 按钮
- Aspect Ratio：`3:4`
- Quality：`1k`
- 数量 Stepper：`1/4`

这些控件功能完整，但视觉上更像一排独立的大按钮，而不是一个专业、稳定、可长期扩展的生成控制台。

本 PRD 目标是把当前工具栏从“高对比大控件拼接”优化成“轻量、对齐、可扫读的专业参数栏”。

## 2. 当前问题诊断

### 2.1 工具栏整体视觉重量过高

截图中每个控件都使用较大的字体、较粗的字重和较高的白色 pill 背景，导致工具栏比画布内容更抢眼。

问题影响：

- 用户注意力被参数栏吸走，而不是先看生成结果。
- 工具栏像主视觉横幅，不像辅助操作区。
- 底部画布可见区域被压缩。

### 2.2 控件高度和视觉节奏不一致

模型选择控件明显比右侧参数控件更宽、更重；Enhance 按钮又是一个单独的小方 pill；Aspect Ratio、Quality、Stepper 则像另一套组件。

问题影响：

- 整排控件缺少统一组件语言。
- 用户会感觉界面是后期叠加出来的，而不是同一套设计系统。
- 后续增加 Product、Style、Seed、Negative Prompt 时会更拥挤。

### 2.3 字体过大，参数变成标题级信息

`Seedream 5.0 Lite`、`3:4`、`1k`、`1/4` 当前都接近标题字级。

问题影响：

- 参数权重超过实际重要性。
- `3:4` 和 `1k` 的小图标、下拉箭头被挤压到边缘。
- 长模型名或更长质量文案容易再次发生裁切。

### 2.4 下拉箭头与主文字关系不稳定

Aspect Ratio 和 Quality 控件里，小箭头被放在较低位置，视觉上像掉出控件。

问题影响：

- 用户会误以为这是渲染错误。
- 控件内部垂直对齐不专业。
- 当前值和可切换状态之间关系不清楚。

### 2.5 Provider icon 不像 badge

模型控件左侧的 `S` 与模型名同色、同重量，缺少 badge 感。

问题影响：

- `S` 更像正文字符，不像模型提供方标识。
- 模型控件首部缺少可识别的视觉锚点。
- 不同 provider 的品牌识别差异弱。

### 2.6 数量 Stepper 分隔过硬

当前 `- | 1/4 | +` 使用强竖线分隔，中间数字又过大，形成表格感。

问题影响：

- 与其它圆润 pill 控件风格不一致。
- `1/4` 抢占过多视觉焦点。
- 减号和加号像被硬切开的三个单元格，而不是一个连续 stepper。

## 3. 优化目标

### 3.1 用户体验目标

- 用户能在 1 秒内扫清当前模型、比例、质量、数量。
- 任何文字、数字、图标、下拉箭头都不能被裁切或溢出。
- 工具栏不再压迫画布内容。
- 参数是辅助信息，生成结果和 Generate 操作仍是主焦点。

### 3.2 视觉目标

- 工具栏从“大按钮堆”变成“专业参数栏”。
- 所有参数控件使用统一高度、圆角、字号、图标尺寸。
- Provider icon、参数 icon、chevron、stepper icon 形成清晰层级。
- 控件之间有明确分组，但不使用过重边框。

### 3.3 技术目标

- 优先通过 CSS 调整完成。
- 如确有必要，仅做轻量 markup 调整。
- 不改变生成逻辑、模型列表、比例列表、质量列表和计数状态。
- 不引入新依赖。

## 4. 设计方案

### 4.1 工具栏整体尺寸

建议标准：

- 工具栏单行高度：`44px`
- 控件高度：`40px`
- 控件圆角：`16px`
- 控件间距：`8px`
- 工具栏上下内边距：`8px - 10px`

验收标准：

- 1440px 宽度下，工具栏不超过截图当前高度的 75%。
- 任何控件 hover 或切换值时不改变整行高度。

### 4.2 字体层级

建议标准：

- Model name：`16px - 17px`，`font-weight: 850`
- Aspect Ratio / Quality 当前值：`17px - 18px`，`font-weight: 850`
- Stepper 数字：`16px`，`font-weight: 850`
- 辅助 label 如 `/4`：`13px - 14px`

禁止：

- 参数控件使用 `20px+` 标题级字号。
- `line-height: 1` 搭配 `overflow: hidden` 裁切 descender。

验收标准：

- `Seedream 5.0 Lite` 的 `g` 完整显示。
- `image`、`1/4`、`3:4`、`16:9`、`Nano Banana Pro` 都完整显示。

### 4.3 Model Picker 优化

建议结构：

- 左侧 provider badge：固定 `24px x 24px`
- 中间模型名：单行显示，长文本 ellipsis
- 右侧 chevron：`14px`

视觉建议：

- Provider badge 使用浅紫底或半透明底，字母降低字号到 `13px - 14px`。
- 模型名不再使用标题字重。
- Model picker 宽度控制在 `220px - 240px`。

验收标准：

- `Seedream 5.0 Lite` 不成为整排最重元素。
- provider badge 一眼看起来是 icon，不像正文首字母。

### 4.4 Enhance 按钮优化

建议：

- 保持 icon-only，但尺寸与其它控件同高。
- 宽度控制在 `40px - 44px`。
- 使用 tooltip 或 aria-label 表达功能。
- active 状态使用轻量高亮，不扩大尺寸。

验收标准：

- Enhance 不像空白占位。
- icon 在按钮中水平、垂直居中。

### 4.5 Aspect Ratio / Quality 控件优化

建议结构：

- icon：`16px - 18px`
- 当前值：`17px - 18px`
- chevron：`12px - 14px`
- 三者横向居中排列，不再上下分离。

建议宽度：

- Aspect Ratio：`88px - 96px`
- Quality：`88px - 96px`

验收标准：

- `3:4`、`9:16`、`16:9` 都完整显示。
- chevron 不掉到控件底部。
- icon、文字、chevron 的 baseline 视觉一致。

### 4.6 Quantity Stepper 优化

建议：

- Stepper 总宽度：`108px - 116px`
- 减号、数字、加号在同一个轻量 pill 内。
- 去掉强竖线，改用低透明度内部分隔或 hover 背景。
- `1/4` 视觉拆分为 `1` 和 `/4`，但整体居中。

验收标准：

- `1/4` 不比 `3:4` 更抢眼。
- `-` 和 `+` 点击区域明确，但不形成表格感。
- disabled 状态清楚但不过重。

## 5. 响应式规则

### 5.1 Desktop

- 所有控件单行显示。
- 控件不换行。
- 长模型名 ellipsis，不挤压其它参数。

### 5.2 Tablet

- Model picker 可缩到 `200px`。
- Aspect Ratio、Quality、Stepper 保持固定最小宽度。
- 工具栏可水平居中，但不遮挡 Generate 主按钮。

### 5.3 Mobile

- 参数栏允许分两行：
  - 第一行：Model picker + Enhance
  - 第二行：Aspect Ratio + Quality + Stepper
- 每行高度稳定，不因下拉箭头或文本变化跳动。

## 6. 实施范围

### 6.1 需要修改

- `src/styles.css`
  - Image composer toolbar 尺寸
  - Model picker 当前值样式
  - Aspect Ratio / Quality summary 内部布局
  - Count stepper 内部布局
  - Hover / active / disabled 状态

可能需要轻量修改：

- `src/main.js`
  - 如果当前 markup 无法让 chevron 横向对齐，可调整 summary 内 span 包裹结构。
  - 如果 provider badge 需要明确 class，可增加 className。

### 6.2 不在本次范围

- 不改模型列表。
- 不改生成扣费逻辑。
- 不改下拉菜单内容。
- 不改画布结果墙布局。
- 不新增 Product / Avatar reference 功能。

## 7. 验收标准

### 7.1 视觉验收

- 工具栏整体高度比当前截图更轻，不再像大横幅。
- `Seedream 5.0 Lite` 的 `g` 完整显示。
- `3:4`、`1k`、`1/4` 垂直居中。
- chevron 全部在控件内部，不贴底、不溢出。
- Stepper 不再有过硬的表格分隔感。
- Provider `S` 明显是 badge/icon。

### 7.2 功能验收

- 模型下拉仍可打开并选择模型。
- Aspect Ratio 下拉仍可打开并选择比例。
- Quality 下拉仍可打开并选择质量。
- 数量 `-` / `+` 仍可正确调整。
- Enhance 按钮仍可触发原功能。

### 7.3 技术验收

- `npm run build` 通过。
- CSS 无 conflict marker。
- 不引入水平滚动。
- 1280px、1440px、1920px 桌面宽度下工具栏稳定。
- 移动端不发生文字重叠。

## 8. 建议执行顺序

1. 先统一控件高度、字号、line-height 和 overflow。
2. 再优化 Model picker 的 badge、文字和 chevron。
3. 再重排 Aspect Ratio / Quality 内部为横向结构。
4. 再轻量化 Stepper 分隔和数字层级。
5. 最后做 desktop / mobile 截图验收。

## 9. 风险与注意事项

- 当前 `src/styles.css` 已有多层 toolbar 覆盖规则，实施时必须优先整理最终覆盖层，避免新增规则被旧规则覆盖。
- 不建议继续用更强的 `!important` 堆叠解决问题，除非为了压住历史规则。
- 如果发现同一控件有重复样式块，应优先合并到最后的 toolbar polish 区域。
- 修复后必须用真实 Chrome 登录态检查，因为首页本地预览无法覆盖工作台 toolbar。

