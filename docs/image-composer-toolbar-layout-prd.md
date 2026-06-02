# Image Composer 工具栏排版优化 PRD

## 1. 背景

当前 Image 生成页面底部 composer 已经从大面板压缩成更紧凑的工具栏，但从最新截图看，紧凑后出现了新的排版问题：

- 工具栏整体高度虽然下降了，但控件之间的视觉重量不统一。
- 模型选择、Avatar、增强、比例、质量、数量这些控件像独立拼接的按钮，缺少统一节奏。
- 部分控件文字或图标被挤压，影响用户判断当前设置。
- 关键生成区没有和设置区形成清晰关系，用户会先看到一排参数，而不是清楚知道“现在可以生成”。

本 PRD 目标是把 Image composer 从“压缩后的按钮堆”优化成一个稳定、可读、可扩展的生成工具栏。

## 2. 当前问题诊断

### 2.1 模型选择过于抢眼

截图中 `Seedream 5.0 Lite` 的字体和控件宽度都过大，导致它成为整条工具栏最重的元素。

问题：

- 模型名称占据过多横向空间。
- 左侧 `s` provider icon 与文字距离不够精致，像临时文本。
- 下拉箭头在右侧偏弱，用户不容易感知这是可切换项。
- 当模型名更长时，容易继续挤压后面的比例、质量、数量控件。

### 2.2 Avatar / Product 参考入口缺少语义

当前只显示一个小图标按钮，视觉上像装饰按钮。

问题：

- 用户不知道这是 Avatar、Product，还是随机功能。
- 图标按钮和模型按钮尺寸关系不自然。
- 已选择 reference 与未选择 reference 的状态不够清晰。

### 2.3 Enhance 控件变成“空白竖向胶囊”

截图里 Avatar 后面的白色竖向 pill 很像一个空白占位。

问题：

- 当前状态不可读，不知道是 Enhance on/off。
- 图标可能被隐藏或对齐错误。
- 控件宽度过窄但高度过高，造成视觉噪音。
- 它夹在 Avatar 和 Aspect Ratio 中间，破坏横向节奏。

### 2.4 Aspect Ratio 显示被截断

截图中比例只看得到 `3:`，后面的 `4` 被遮挡或挤压。

问题：

- 当前值不可读，会直接影响用户判断生成尺寸。
- 图形比例 icon 与文字竞争空间。
- 该控件宽度不足，尤其在 `16:9`、`9:16`、`3:4` 切换时容易抖动。

### 2.5 下拉箭头位置不稳定

截图中有一个紫色 chevron 掉在工具栏下方边缘，像溢出的视觉 bug。

问题：

- 下拉状态 icon 没有被锁在控件内部。
- 用户会误以为面板下方还有隐藏菜单或错误边框。
- 会让整个 composer 显得不稳。

### 2.6 Quality 控件视觉过重

`1k` 字号过大，diamond icon 也偏大。

问题：

- 质量不是当前最重要的主操作，不应该比生成按钮更抢眼。
- `1k / 2k / 4k` 作为参数，应该清晰但轻量。
- 视觉重量过大会挤压相邻控件。

### 2.7 数量 stepper 数字过大

`1/4` 的 `1` 非常大，接近主标题级别。

问题：

- 数量是辅助设置，不应该成为视觉焦点。
- `-` 和 `+` 的点击区域与中间数字区分过强，像三段式 tab。
- 字号过大导致控件比其他参数更重。

### 2.8 控件组缺少主次分区

当前一排控件都在同一层级。

问题：

- 用户扫视路径不明确。
- 设置项和行动项没有分区。
- 后续增加 Product、Style、Seed、Negative Prompt 等控制时会更拥挤。

## 3. 优化目标

### 3.1 用户体验目标

- 用户一眼能看懂当前模型、参考素材、比例、质量、数量。
- 任何当前值都不能被截断。
- 所有下拉箭头、图标、文字必须在控件内部垂直居中。
- 工具栏高度稳定，不因为长模型名或长 prompt 抖动。
- 工具栏减少对画布的遮挡，让用户看到更多生成结果。

### 3.2 视觉目标

- 整体从“多个大按钮”变成“专业生成工具栏”。
- 参数控件更轻，Generate 按钮保持唯一主行动。
- 相同类型控件使用统一高度、圆角、字体尺寸、图标尺寸。
- 重要信息清楚，不重要信息收敛。

### 3.3 技术目标

- 不重写 Image 页面结构。
- 优先通过 CSS 和轻量 markup 调整完成。
- 保留现有 state、生成逻辑、下拉菜单逻辑。
- 不引入新依赖。

## 4. 设计方案

### 4.1 工具栏整体结构

建议将 composer 明确分为 3 个区域：

```text
[Prompt / Model Group] [Reference + Settings Group] [Generate]
```

在当前截图对应的紧凑状态中，可采用：

```text
[Model] [Avatar] [Product] [Enhance] [Ratio] [Quality] [Count] [Generate]
```

布局要求：

- 整体高度：建议 92px - 112px。
- 单个参数控件高度：40px - 46px。
- Generate 按钮高度：72px - 88px。
- 控件间距：6px - 8px。
- 外框内边距：8px - 10px。

### 4.2 Model 控件

视觉规格：

- 宽度：`clamp(220px, 25vw, 360px)`。
- 高度：44px。
- 字号：18px - 22px，不再使用 28px+。
- provider icon：20px - 22px。
- 文本超长时使用单行省略，但必须保留右侧 chevron。

交互：

- hover 时边框轻微加深。
- active/open 时显示清楚的选中边框。
- 下拉菜单从控件左侧对齐展开，不能遮挡主按钮。

### 4.3 Reference 控件

Avatar 和 Product 建议做成同一视觉组件：

```text
[avatar icon / thumbnail]
[product icon / thumbnail]
```

规格：

- 宽高：44px × 44px。
- 圆角：16px。
- 未选择：只显示 icon。
- 已选择：显示缩略图，右下角可有小型类型标记。
- hover tooltip：`Avatar reference` / `Product reference`。

避免在紧凑 toolbar 中展示大块文字。

### 4.4 Enhance 控件

Enhance 不应该是空白竖向 pill。

建议两种方案：

方案 A：图标 toggle

```text
[wand icon]
```

- 宽高：44px × 44px。
- off：浅色背景，紫色 icon。
- on：品牌紫背景，白色 icon。
- tooltip：`Enhance prompt: on/off`。

方案 B：移动到高级设置

如果用户很少频繁切换 Enhance，可以把它移入 `More settings`，减少主工具栏拥挤。

本期推荐方案 A，因为改动小。

### 4.5 Aspect Ratio 控件

当前最严重问题是文字被截断。

规格：

- 最小宽度：112px。
- 高度：44px。
- 图标宽度：18px。
- 文本字号：20px - 22px。
- chevron：12px - 14px，固定在右侧。

显示规则：

- `9:16`、`3:4`、`1:1`、`16:9` 必须完整显示。
- 不允许因为 icon 或 chevron 挤压中间文本。
- 可使用三列 grid：`20px minmax(48px, 1fr) 14px`。

### 4.6 Quality 控件

Quality 应比当前更轻。

规格：

- 宽度：104px - 116px。
- 高度：44px。
- diamond icon：18px - 20px。
- `1k / 2k / 4k` 字号：22px - 24px。
- chevron 固定在下方或右侧都可以，但必须在按钮内部。

推荐结构：

```text
[diamond] [1k] [chevron]
```

不要让 chevron 掉到按钮外面。

### 4.7 Count Stepper

数量控件需要降级为辅助控件。

规格：

- 宽度：112px - 124px。
- 高度：44px。
- `-` / `+` 点击区：32px。
- 中间 `1/4` 字号：22px 主数字，14px 次数字。
- 三段之间可以保留淡分割线，但不能像强 tab。

### 4.8 Generate 按钮

Generate 仍然是主行动。

规格：

- 宽度：150px - 190px。
- 高度：76px - 88px。
- 图标：24px - 28px。
- 主文字：18px - 22px。
- credit：12px - 13px。
- 内容整体居中。

当屏幕宽度不足时：

- 可隐藏 `Generate Media` 文案，只显示 send icon + credit。
- 或切换为 compact 状态：`[send icon]`。

## 5. 响应式规则

### 5.1 宽屏桌面

宽度大于 1440px：

- 所有设置项单行展示。
- Model 保持较宽，但不超过 360px。
- Generate 固定在最右。

### 5.2 中等桌面

宽度 1024px - 1440px：

- Model 宽度收缩到 240px - 300px。
- Reference 使用图标模式。
- Quality / Ratio / Count 保持完整值。
- Generate 可以略微缩小，但不能低于 144px。

### 5.3 移动端

宽度小于 768px：

- composer 改为两行：

```text
[Prompt / summary] [Generate]
[Model] [Ratio] [Quality] [Count]
```

- Reference 放进第二行或 More settings。
- 避免横向溢出。

## 6. 状态规范

### 6.1 Normal

- 背景浅白/浅粉玻璃。
- 参数按钮使用低对比边框。
- 字体使用品牌深紫。

### 6.2 Hover

- 背景略微变亮。
- 边框加深。
- 不放大按钮，避免工具栏抖动。

### 6.3 Open

- 当前打开的控件使用清楚边框。
- chevron 旋转 180 度。
- 下拉菜单必须贴合触发器，并避开屏幕边界。

### 6.4 Disabled / Loading

- Generate loading 时只影响 Generate 按钮，不改变整条工具栏高度。
- Count 到 1 时 `-` 降低 opacity。
- Count 到 4 时 `+` 降低 opacity。

## 7. 验收标准

### 7.1 视觉验收

- 截图中的 `3:4` 必须完整显示。
- Enhance 按钮不能出现空白竖向胶囊。
- Quality 的 chevron 不能掉到控件外。
- `1/4` 数量不再比模型名更抢眼。
- 所有控件垂直居中。
- 整体 composer 高度比当前版本再降低 10% - 18%。

### 7.2 功能验收

- 切换模型正常。
- 打开/关闭 Avatar picker 正常。
- 打开/关闭 Product picker 正常。
- Enhance toggle 正常。
- Aspect Ratio 下拉选择正常。
- Quality 下拉选择正常，并向正确方向展开。
- Count 加减正常。
- Generate 正常触发。

### 7.3 响应式验收

测试宽度：

- 1728px desktop。
- 1440px desktop。
- 1280px desktop。
- 1024px tablet。
- 390px mobile。

每个宽度必须确认：

- 没有文字截断到不可读。
- 没有 icon 掉出按钮。
- 没有横向滚动条。
- composer 不遮挡最后一行图片内容超过合理范围。

## 8. 执行优先级

### P0：必须修复

- 修复 Aspect Ratio 被截断。
- 修复 Enhance 空白胶囊。
- 修复 chevron 掉出控件。
- 降低 Count / Quality 字号。
- 统一控件高度和垂直居中。

### P1：强烈建议

- Model 控件降级视觉重量。
- Reference 控件统一为 icon/thumbnail button。
- Generate 按钮保持唯一主视觉焦点。
- 增加 hover/open/focus 状态一致性。

### P2：后续优化

- 移动端两行布局。
- More settings 收纳低频设置。
- 长模型名 tooltip。
- 键盘可访问性细化。

## 9. 建议实施步骤

1. 先建立 CSS 变量：

```css
--image-toolbar-control-height: 44px;
--image-toolbar-control-radius: 18px;
--image-toolbar-gap: 7px;
```

2. 统一所有 toolbar 控件高度、圆角、box-sizing。

3. 重设 grid columns，确保 Ratio / Quality / Count 有稳定最小宽度。

4. 单独修 Enhance：固定为 44px icon button，并恢复 icon 居中。

5. 单独修 chevron：所有 chevron 必须在 summary/button 内部 grid 单元。

6. 降低字体尺寸：

- Model：20px - 22px。
- Ratio：20px - 22px。
- Quality：22px - 24px。
- Count：22px / 14px。

7. 跑 `npm run build`。

8. 用截图 QA 检查 desktop / mobile。

## 10. 不做事项

- 不改变生成 API。
- 不改变模型列表数据。
- 不重构整个 Image 页面。
- 不新增设计系统库。
- 不把所有控制项移入 modal。

## 11. 成功标准

这次优化完成后，用户看到的不是“被压缩到一起的按钮”，而是一条专业、稳定、信息清晰的创作工具栏：

- 当前设置一眼可读。
- 主按钮明确。
- 控件不会挤压、截断、错位。
- 工具栏占屏更少，但可用性更高。
