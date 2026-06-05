# Video Page 大框对齐 Image Page 逻辑 PRD

Last updated: 2026-06-05

## 1. 背景

当前 Video Page 底部生成大框已经有一部分 Image Page 的视觉样式，但交互逻辑还没有完全对齐。截图里可以看到几个明显问题：

- Video 大框在页面滑动时没有像 Image Page 一样稳定缩小。
- 鼠标靠近大框时，没有完整恢复成可操作状态。
- Model、Resolution / Quality、Ratio、Duration、Audio 这些选择菜单可以互相挤在一起，缺少“同一时间只能打开一个”的规则。
- Video 模型菜单只是文字列表，没有像 Image Page 一样展示模型描述、供应商 logo、选中态和能力说明。
- 参数 chip 宽度和文案不稳定，出现 `9..`、`7..`、`1..`、`O..` 这种截断，用户无法一眼看懂当前选择。
- Video 需要保留自己的视频参数，但整个“大框”的心智应该几乎等于 Image Page。

本 PRD 只定义 Video Page 底部生成大框的交互、信息、视觉和实现要求，不重写视频结果墙、不新增 provider，也不改后端生成接口。

## 2. 目标

1. Video Page 底部大框复用 Image Page 的核心交互逻辑：页面滑动缩小，鼠标靠近或聚焦放大。
2. 任意时刻只允许打开一个选择菜单：模型、比例、画质、时长、声音互斥。
3. Video 模型选择器升级为 Image Page 同级别的 rich picker：左侧供应商 logo，中间标题和描述，右侧选中 check。
4. Ratio、Quality、Duration、Audio 选择项都配上说明文案，不只显示裸数值。
5. 根据当前模型的供应商和能力，动态展示支持的参数；不支持的参数自动消失或禁用。
6. 保留 Video 所需参数：Model、Aspect Ratio、Quality / Resolution、Duration、Count、Audio、Reference / Input。
7. 避免切换模型或打开菜单造成闪缩、重排、遮挡和文字截断。

## 3. 非目标

- 不改 Image Page。
- 不新增视频模型或视频供应商。
- 不改 `generate-ugc` 后端 payload，除非实现时发现字段名称已经与 UI 不一致。
- 不重新设计 Studio 顶部 tab。
- 不调整视频结果卡片、failed card、pending card 的展示规则。
- 不引入新的前端框架、UI kit 或动画库。

## 4. 需要复用的 Image Page 逻辑

### 4.1 大框状态

Video Composer 需要拥有与 Image Composer 一致的状态：

- `expanded`：默认完整输入状态。
- `is-compact`：页面向下滑动后进入缩小状态。
- `is-hover-expanded`：鼠标靠近、鼠标移动到大框上、输入框获得焦点时恢复完整状态。
- `has-open-menu`：任意下拉菜单打开时，强制保持完整状态。
- `has-long-prompt`：prompt 文本过长时，只让 textarea 内部滚动，不撑爆整个大框。

### 4.2 滑动缩小

规则：

- 当 Video Page 内容区域发生纵向滚动，且滚动距离超过阈值，Video Composer 添加 `is-compact`。
- `is-compact` 状态只展示核心摘要，减少高度和遮挡。
- 缩小过程中不能改变结果墙 scroll position。
- 缩小状态不能触发页面闪烁或布局重新计算抖动。

建议阈值：

- `compactAt = 1`
- `expandAt = 0`

与 Image Page 当前实现保持一致。

### 4.3 鼠标靠近放大

触发：

- `mouseenter`
- `mousemove`
- `pointerenter`
- `pointermove`
- prompt textarea `focus`
- 任意 menu `open`

效果：

- 添加 `is-hover-expanded`。
- 移除 `is-compact`。
- 大框恢复完整参数和 Generate CTA。
- 当用户继续滑动页面后，再重新允许进入 compact 状态。

### 4.4 菜单打开锁定

只要任意 Video 菜单打开：

- 大框必须保持 expanded。
- 禁止 compact。
- 关闭其他已打开菜单。
- 点击外部或按 Escape 关闭当前菜单。

这条规则要覆盖：

- Model
- Aspect Ratio
- Quality / Resolution
- Duration
- Audio

## 5. 菜单互斥规则

Video Page 所有选择器必须是互斥关系。

示例：

- 打开 Model 菜单时，Quality、Ratio、Duration、Audio 自动关闭。
- 打开 Quality 菜单时，Model、Ratio、Duration、Audio 自动关闭。
- 打开 Ratio 菜单时，Model、Quality、Duration、Audio 自动关闭。
- 打开 Duration 菜单时，其他菜单自动关闭。
- 打开 Audio 菜单时，其他菜单自动关闭。

如果某个菜单使用 floating popover，仍然算作打开状态，并且要让大框保持 `has-open-menu`。

## 6. Video 模型选择器规格

### 6.1 当前选中态

大框左下角 Model chip 必须显示：

- 供应商 logo
- 模型名称
- chevron

示例：

```txt
[Google logo] Veo 3.1
```

不要只显示文字，也不要让长模型名挤压后面的参数 chip。

### 6.2 模型菜单内容

模型菜单标题：

```txt
Video models
```

每个模型选项包含：

- 左侧供应商 logo
- 模型名
- 供应商名
- 一句用途描述
- 能力 chip，例如 `Text to Video`、`Image to Video`、`Audio`、`1080p`
- 选中 check

推荐结构：

```txt
[G] Veo 3.1
    Google · Cinematic video with strong realism
    9:16 · 16:9 · 720p · Audio
                                      ✓
```

### 6.3 当前已接入模型的展示建议

以下为前端展示文案建议，真实可用模型以当前配置和后端接入为准：

| 模型 | 供应商 logo | 供应商 | 展示文案 |
| --- | --- | --- | --- |
| Seedance 2.0 Fast | S | Seedance / ByteDance | Fast social video generation for creator-style clips |
| Veo 3.1 | G | Google | Cinematic video generation with realistic motion |
| Sora 2 | OpenAI | OpenAI | High-quality narrative video generation |
| Wan 2.7 | W | Alibaba Wan | Flexible video model for product and creator shots |
| Kling V3 Omni | K | Kling | Multi-modal video generation with strong motion control |
| Kling V3 Motion Control | K | Kling | Motion-guided video generation for controlled movement |
| MiniMax Hailuo 2.3 | M | MiniMax | Fast video generation for short creative scenes |

## 7. 模型能力与参数联动

### 7.1 数据结构

实现时需要新增或完善 `videoModelOptions()` / `videoModelCapabilities()`。

建议字段：

```js
{
  value: "Veo 3.1",
  provider: "google",
  providerName: "Google",
  title: "Veo 3.1",
  description: "Cinematic video generation with realistic motion",
  badge: "",
  capabilities: {
    modes: ["Text to Video", "Image to Video"],
    aspectRatios: ["16:9", "9:16"],
    qualities: ["720p", "1080p"],
    durations: ["8s"],
    audio: ["On", "Off"]
  }
}
```

### 7.2 自动校验

当用户切换模型后：

1. 保存新模型。
2. 读取该模型 capabilities。
3. 校验当前 `aspectRatio`、`quality`、`duration`、`audio` 是否被支持。
4. 不支持的值自动切换到该模型的默认值。
5. 更新每个菜单的可选项。
6. 更新 credit estimate。
7. 保持大框展开，不闪缩。

### 7.3 参数不可用时的处理

优先级：

1. 如果模型完全不支持某类参数，例如不支持 Audio，则隐藏 Audio chip。
2. 如果模型支持该类参数但只支持一个值，例如只支持 `8s`，则显示但不可打开，或者菜单里只显示一个 active option。
3. 如果模型支持多个值，则正常可选。

不要显示用户点了也不会生效的参数。

## 8. Video 参数菜单文案

### 8.1 Aspect Ratio

菜单标题：

```txt
Aspect ratio
```

选项文案：

| 值 | 文案 |
| --- | --- |
| 9:16 | Vertical shorts and mobile-first videos |
| 16:9 | Wide cinematic frame |
| 1:1 | Square social feed video |
| 4:3 | Classic product or demo frame |
| 3:4 | Tall creator and product scene |

### 8.2 Quality / Resolution

菜单标题：

```txt
Select quality
```

选项文案：

| 值 | Badge | 文案 |
| --- | --- | --- |
| 480p | FAST | Fast preview generation |
| 720p | DEFAULT | Balanced quality and cost |
| 1080p | PRO | Sharper output for final video |

如果后端实际使用的是 `quality` 字段，UI 仍然可以显示为 Quality；如果字段叫 `resolution`，需要保持字段映射清晰。

### 8.3 Duration

菜单标题：

```txt
Duration
```

选项文案：

| 值 | 文案 |
| --- | --- |
| 5s | Quick shot |
| 8s | Standard clip |
| 12s | Longer scene |

### 8.4 Audio

菜单标题：

```txt
Audio
```

选项文案：

| 值 | 文案 |
| --- | --- |
| On | Generate video with audio |
| Off | Silent video |

## 9. 大框布局要求

### 9.1 展开状态

宽屏结构：

```txt
[ + ][ prompt textarea ][ prompt enhance ]       [ Generate Video ]
[ Model ][ Ratio ][ Quality ][ Duration ][ Count ][ Audio ]
```

要求：

- Generate Video 始终在右侧清楚可见。
- Model chip 可以比其他 chip 宽，但不能把后面的 chip 挤成省略号。
- 后续 chip 需要显示完整核心文本：`9:16`、`720p`、`8s`、`1/4`、`On`。
- 每个 chip 高度一致。
- 打开菜单时菜单向上展开，不被大框裁切。

### 9.2 缩小状态

页面滑动后，大框进入 compact：

```txt
[prompt summary] [model logo + model] [Generate]
```

要求：

- 保留 prompt 摘要。
- 保留当前模型和供应商 logo。
- 保留 Generate 入口。
- 参数详情可以折叠隐藏。
- 鼠标靠近后恢复完整状态。

### 9.3 中窄屏

当宽度不足时：

- 允许参数区横向滚动。
- Generate CTA 不能完全被挤出屏幕。
- Model chip 不应无限占宽，建议设置 `clamp()` 宽度。
- 菜单宽度使用 viewport 约束，不能超出屏幕。

## 10. 交互验收标准

1. 页面向下滑动后，Video 大框自动缩小。
2. 鼠标靠近 Video 大框后，大框自动放大。
3. prompt textarea 聚焦时，大框保持放大。
4. 打开任意菜单时，大框保持放大。
5. 同一时间只能有一个菜单打开。
6. 打开 Model 后再打开 Quality，Model 菜单自动关闭。
7. 打开 Ratio 后再打开 Duration，Ratio 菜单自动关闭。
8. 切换模型后，当前不支持的参数自动切换到该模型可用默认值。
9. 所有菜单选项都有描述文案和选中 check。
10. 模型选项左侧都有供应商 logo。
11. `Veo 3.1`、`Seedance 2.0 Fast`、`Kling V3 Motion Control` 不会导致工具栏文字截断到不可读。
12. `9:16`、`720p`、`1080p`、`12s`、`Off` 都能完整显示。
13. 切换模型、比例、画质、时长时，结果墙不闪缩，滚动位置不跳。
14. 打开菜单后点击外部区域，菜单关闭。
15. 按 Escape，当前菜单关闭。

## 11. 实现建议

### 11.1 JavaScript

建议新增或改造：

- `bindVideoConsoleCompact()`
- `closeVideoConsoleMenus(except)`
- `updateVideoMenuState()`
- `videoModelOptions()`
- `videoModelCapabilities(model)`
- `normalizedVideoSettingForModel(model, field, value)`
- `videoModelPicker(selectedModel)`
- `videoAspectRatioPicker(selectedRatio, options)`
- `videoQualityPicker(selectedQuality, options)`
- `videoDurationPicker(selectedDuration, options)`
- `videoAudioPicker(selectedAudio, options)`
- `saveVideoModelQuick(value, source)`

优先复用 Image Page 的实现模式，不要另起一套完全不同的菜单系统。

### 11.2 CSS

需要补齐或调整：

- `.video-generate-console.is-compact`
- `.video-generate-console.is-hover-expanded`
- `.video-generate-console.has-open-menu`
- `.video-generate-console.has-long-prompt`
- `.video-model-picker`
- `.video-model-menu`
- `.video-model-option`
- `.video-option-menu`
- `.video-option-list`
- `.video-option-copy`
- `.video-option-check`

关键要求：

- 大框 expanded / compact 高度稳定。
- 菜单 z-index 高于 composer 和结果墙。
- 菜单不被 composer overflow 裁切。
- 参数 chip 使用稳定宽度，不因为文本变化挤压相邻项。

## 12. 执行顺序

1. 先抽象或复制 Image Page 的 compact / hover / menu-open 状态机到 Video Page。
2. 改造 Video model picker，加入供应商 logo、描述、选中态。
3. 改造 Ratio / Quality / Duration / Audio picker，加入文案、check、互斥逻辑。
4. 加入 video model capability matrix。
5. 切换模型时联动修正不支持的参数。
6. 调整 CSS，解决 chip 截断和菜单遮挡。
7. 本地 build。
8. 用浏览器检查桌面宽屏和中窄屏。
9. 确认 Image Page 没有被影响。

## 13. 风险与注意事项

- 不同中转站的视频模型能力可能不完全一致，前端 capability matrix 需要以后端真实接入为准。
- 如果某些模型真实支持 `video to video` 或 `image to video`，需要在模型 menu 的 capability chip 里显示，但不要在本 PRD 中强行新增入口。
- Video Page 目前和其他页面可能共用 `video-prompt-extractor-page` 样式，CSS 必须尽量 scope 到 `.video-page-studio` 和 `.video-generate-console`。
- 不要让 compact 状态影响页面滚动容器高度，否则会再次出现“滑动不了”或“最新卡片被挤下去”的问题。
- 不要在模型切换时整页 render 后丢失 scroll position。

## 14. 交付物

执行本 PRD 后应交付：

- Video Page 大框交互与 Image Page 对齐。
- Video 模型 rich picker。
- Video 参数 rich picker。
- Video 菜单互斥和 hover expand 逻辑。
- 模型能力联动和参数自动校正。
- build 通过。
- 代码 commit 并 push 到远程分支。
